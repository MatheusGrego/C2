# Sentinel Vision - Frontend Integration Guide

**Versão:** 1.0.6  
**Backend:** Sentinel Core (Java/Spring Boot)  
**Frontend:** React + WebSocket

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Autenticação](#2-autenticação)
3. [REST API - Endpoints Completos](#3-rest-api---endpoints-completos)
4. [WebSocket - Conexão e Protocolo](#4-websocket---conexão-e-protocolo)
5. [Fluxos de Uso](#5-fluxos-de-uso)
6. [Estrutura de Dados (DTOs)](#6-estrutura-de-dados-dtos)
7. [Tratamento de Erros](#7-tratamento-de-erros)
8. [Boas Práticas de Implementação](#8-boas-práticas-de-implementação)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SENTINEL VISION (React)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐       │
│   │    Login     │         │  Dashboard   │         │ Agent Detail │       │
│   │    Page      │         │    Page      │         │    Page      │       │
│   └──────┬───────┘         └──────┬───────┘         └──────┬───────┘       │
│          │                        │                        │                │
│          │         ┌──────────────┴──────────────┐        │                │
│          │         │                             │        │                │
│   ┌──────▼─────────▼─────────────────────────────▼────────▼──────┐         │
│   │                      Zustand Store                           │         │
│   │  - authStore (token, user)                                   │         │
│   │  - agentStore (agents list, selected agent)                  │         │
│   │  - commandStore (command history, pending)                   │         │
│   │  - uiStore (modals, notifications)                           │         │
│   └──────────────────────────┬───────────────────────────────────┘         │
│                              │                                              │
│          ┌───────────────────┼───────────────────┐                         │
│          │                   │                   │                         │
│   ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐                  │
│   │  REST API   │     │  WebSocket  │     │   Utils     │                  │
│   │  Service    │     │   Service   │     │ (formatters)│                  │
│   └──────┬──────┘     └──────┬──────┘     └─────────────┘                  │
│          │                   │                                              │
└──────────┼───────────────────┼──────────────────────────────────────────────┘
           │                   │
           │    HTTP/HTTPS     │    WebSocket (ws/wss)
           │                   │
┌──────────▼───────────────────▼──────────────────────────────────────────────┐
│                         SENTINEL CORE (Backend)                              │
│                                                                              │
│   REST API: /api/*              WebSocket: /ws-dashboard                    │
│   - /api/auth/login             - Real-time agent updates                   │
│   - /api/agents                 - Command results                           │
│   - /api/commands               - Admin events                              │
│   - /api/screenshots            - Bidirectional messaging                   │
│   - /api/dashboard/stats                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quando usar REST vs WebSocket?

| Operação | REST | WebSocket | Motivo |
|----------|------|-----------|--------|
| Login | ✅ | ❌ | Operação única, precisa de resposta síncrona |
| Carregar lista de agentes inicial | ✅ | ✅ | REST no load, WebSocket envia automaticamente |
| Receber atualizações de agentes | ❌ | ✅ | Real-time, push do servidor |
| Enviar comando | ✅ | ✅ | Ambos funcionam, WebSocket é preferível |
| Receber resultado de comando | ❌ | ✅ | Push assíncrono do servidor |
| Download de screenshot (imagem) | ✅ | ❌ | Binário grande, HTTP é mais adequado |
| Listar metadados de screenshots | ✅ | ✅ | Ambos funcionam |
| Health check | ✅ | ❌ | Operação simples de verificação |

---

## 2. Autenticação

### 2.1 Fluxo de Login

```
┌─────────┐                    ┌─────────┐
│ Frontend│                    │ Backend │
└────┬────┘                    └────┬────┘
     │                              │
     │  POST /api/auth/login        │
     │  {username, password}        │
     │─────────────────────────────>│
     │                              │
     │  200 OK                      │
     │  {token, username, expiresIn}│
     │<─────────────────────────────│
     │                              │
     │  Salvar token no localStorage│
     │  ou sessionStorage           │
     │                              │
     │  Conectar WebSocket com token│
     │─────────────────────────────>│
     │                              │
```

### 2.2 Endpoint de Login

**POST** `/api/auth/login`

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTY5...",
  "username": "admin",
  "expiresIn": 86400000
}
```

**Response (401 Unauthorized):**
```json
{
  "timestamp": "2025-10-25T10:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

### 2.3 Usando o Token

#### Em requisições REST:
```javascript
// Header Authorization
fetch('/api/agents', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### Na conexão WebSocket:
```javascript
// Opção 1: Query parameter (recomendado para browsers)
const ws = new WebSocket(`ws://localhost:8080/ws-dashboard?token=${token}`);

// Opção 2: Se usar biblioteca que suporta headers customizados
// (browsers nativos não suportam headers em WebSocket)
```

### 2.4 Validação de Token

**GET** `/api/auth/validate`

Usado para verificar se o token ainda é válido (ex: ao recarregar a página).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "valid": true,
  "message": "Token is valid"
}
```

**Response (401/403):** Token inválido ou expirado.

### 2.5 Implementação Recomendada (React)

```javascript
// services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sentinel_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

```javascript
// store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      username: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const response = await api.post('/api/auth/login', { username, password });
        const { token, username: user, expiresIn } = response.data;
        
        localStorage.setItem('sentinel_token', token);
        set({ token, username: user, isAuthenticated: true });
        
        return response.data;
      },

      logout: () => {
        localStorage.removeItem('sentinel_token');
        set({ token: null, username: null, isAuthenticated: false });
      },

      validateToken: async () => {
        try {
          await api.get('/api/auth/validate');
          return true;
        } catch {
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'sentinel-auth',
      partialize: (state) => ({ token: state.token, username: state.username }),
    }
  )
);
```

---

## 3. REST API - Endpoints Completos

### 3.1 Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/login` | Fazer login | ❌ |
| GET | `/api/auth/validate` | Validar token | ✅ |

---

### 3.2 Agentes (`/api/agents`)

#### Listar todos os agentes

**GET** `/api/agents`

**Response:**
```json
[
  {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "hostname": "DESKTOP-PC01",
    "osInfo": "Windows 11 Pro 23H2",
    "ipLocal": "192.168.0.105",
    "status": "ONLINE",
    "communicationMode": "SESSION",
    "beaconInterval": null,
    "cpuLoad": 12.5,
    "ramUsage": 4096,
    "activeWindow": "Chrome - Gmail",
    "firstSeen": "2025-10-20T08:30:00",
    "lastSeen": "2025-10-25T10:30:00"
  },
  {
    "hwid": "11-22-33-44-55-66",
    "hostname": "LAPTOP-USER",
    "osInfo": "Windows 10 Pro",
    "ipLocal": "192.168.0.110",
    "status": "OFFLINE",
    "communicationMode": "BEACON",
    "beaconInterval": 300,
    "cpuLoad": 0,
    "ramUsage": 0,
    "activeWindow": null,
    "firstSeen": "2025-10-15T14:00:00",
    "lastSeen": "2025-10-24T18:00:00"
  }
]
```

#### Obter agente por HWID

**GET** `/api/agents/{hwid}`

**Response:** Mesmo objeto do array acima, ou 404 se não encontrado.

#### Filtrar por status

**GET** `/api/agents/status/{status}`

**Parâmetros:**
- `status`: `ONLINE`, `OFFLINE`, ou `DEAD`

**Response:** Array de agentes filtrados.

#### Contar agentes online

**GET** `/api/agents/count/online`

**Response:**
```json
7
```

---

### 3.3 Comandos (`/api/commands`)

#### Enviar comando

**POST** `/api/commands`

**Request:**
```json
{
  "hwid": "AA-BB-CC-DD-EE-FF",
  "type": "SHELL",
  "params": ["ipconfig", "/all"]
}
```

**Tipos de comando disponíveis:**

| type | params | Descrição |
|------|--------|-----------|
| `SHELL` | `["cmd", "/c", "dir"]` ou `["powershell", "-c", "Get-Process"]` | Executa comando no shell |
| `SCREENSHOT` | `[]` | Captura tela |
| `KILL_PROC` | `["notepad.exe"]` | Mata processo |
| `MESSAGE` | `["Título", "Mensagem"]` | Exibe MessageBox |
| `PROCESS_LIST` | `[]` | Lista processos |
| `OPEN_URL` | `["https://google.com"]` | Abre URL no browser |
| `SHUTDOWN` | `[]` | Desliga computador |
| `SWITCH_MODE` | `["session"]` ou `["beacon", "300"]` | Alterna modo de comunicação |

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "agentHwid": "AA-BB-CC-DD-EE-FF",
  "type": "SHELL",
  "payload": ["ipconfig", "/all"],
  "responseText": null,
  "status": "SENT",
  "createdAt": "2025-10-25T10:30:00",
  "executedAt": null
}
```

**Status possíveis:**
- `PENDING` - Criado, aguardando envio
- `SENT` - Enviado ao agente
- `EXECUTED` - Executado com sucesso
- `FAILED` - Falha na execução

#### Obter comando por ID

**GET** `/api/commands/{commandId}`

**Response:** Objeto Command completo.

#### Histórico de comandos do agente

**GET** `/api/commands/agent/{hwid}`

**Response:** Array de comandos ordenados por data (mais recente primeiro).

#### Histórico paginado

**GET** `/api/commands/agent/{hwid}/paged?page=0&size=50`

**Query Params:**
- `page`: Número da página (0-indexed)
- `size`: Itens por página

**Response:**
```json
{
  "content": [...],
  "totalPages": 5,
  "totalElements": 230,
  "size": 50,
  "number": 0,
  "first": true,
  "last": false
}
```

#### Comandos pendentes

**GET** `/api/commands/agent/{hwid}/pending`

**Response:** Array de comandos com status PENDING.

---

### 3.4 Screenshots (`/api/screenshots`)

#### Listar screenshots do agente (metadados)

**GET** `/api/screenshots/agent/{hwid}?page=0&size=20`

**Response:**
```json
{
  "content": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "agentHwid": "AA-BB-CC-DD-EE-FF",
      "triggerCommandId": "550e8400-e29b-41d4-a716-446655440000",
      "capturedAt": "2025-10-25T10:31:00"
    }
  ],
  "totalPages": 3,
  "totalElements": 45,
  "size": 20,
  "number": 0
}
```

#### Obter metadados de screenshot

**GET** `/api/screenshots/{screenshotId}/metadata`

**Response:** Objeto ScreenshotMetadata.

#### Download da imagem (binário)

**GET** `/api/screenshots/{screenshotId}/image`

**Response:**
- Content-Type: `image/jpeg`
- Body: Binário da imagem

**Uso em React:**
```javascript
// Opção 1: Usando URL direta (com auth)
const imageUrl = `${API_URL}/api/screenshots/${screenshotId}/image`;

// Em <img> com token (requer fetch manual)
const [imageSrc, setImageSrc] = useState(null);

useEffect(() => {
  const fetchImage = async () => {
    const response = await api.get(`/api/screenshots/${screenshotId}/image`, {
      responseType: 'blob'
    });
    const url = URL.createObjectURL(response.data);
    setImageSrc(url);
  };
  fetchImage();
  
  return () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
  };
}, [screenshotId]);

// <img src={imageSrc} />
```

#### Contar screenshots

**GET** `/api/screenshots/agent/{hwid}/count`

**Response:** `45`

#### Deletar screenshot

**DELETE** `/api/screenshots/{screenshotId}`

**Response:** `204 No Content`

---

### 3.5 Dashboard (`/api/dashboard`)

#### Estatísticas gerais

**GET** `/api/dashboard/stats`

**Response:**
```json
{
  "totalAgents": 10,
  "onlineAgents": 7,
  "offlineAgents": 2,
  "deadAgents": 1,
  "pendingCommands": 3,
  "executedCommands": 1523,
  "failedCommands": 42
}
```

#### Status de conexões WebSocket

**GET** `/api/dashboard/connections`

**Response:**
```json
{
  "connectedAgents": 7,
  "connectedDashboards": 2,
  "connectedHwids": ["AA-BB-CC-DD-EE-FF", "11-22-33-44-55-66", ...]
}
```

#### Health check

**GET** `/api/dashboard/health`

**Response:**
```json
{
  "status": "UP",
  "service": "Sentinel Core",
  "version": "1.0.6"
}
```

---

## 4. WebSocket - Conexão e Protocolo

### 4.1 Estabelecendo Conexão

```javascript
// services/websocket.js
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

class SentinelWebSocket {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.listeners = new Map();
    this.requestCallbacks = new Map();
  }

  connect(token) {
    return new Promise((resolve, reject) => {
      const url = `${WS_URL}/ws-dashboard?token=${token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.handleDisconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  handleMessage(message) {
    const { type, payload, request_id } = message;

    // Se tem request_id, é resposta a uma requisição
    if (request_id && this.requestCallbacks.has(request_id)) {
      const callback = this.requestCallbacks.get(request_id);
      this.requestCallbacks.delete(request_id);
      callback(payload);
      return;
    }

    // Notificar listeners registrados para este tipo
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(callback => callback(payload));
  }

  // Registrar listener para um tipo de mensagem
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);

    // Retorna função para remover listener
    return () => {
      const list = this.listeners.get(type);
      const index = list.indexOf(callback);
      if (index > -1) list.splice(index, 1);
    };
  }

  // Enviar mensagem com resposta esperada
  send(type, payload = null) {
    return new Promise((resolve) => {
      const requestId = crypto.randomUUID();
      
      this.requestCallbacks.set(requestId, resolve);
      
      // Timeout de 30 segundos
      setTimeout(() => {
        if (this.requestCallbacks.has(requestId)) {
          this.requestCallbacks.delete(requestId);
          resolve({ error: 'Request timeout' });
        }
      }, 30000);

      this.ws.send(JSON.stringify({
        type,
        payload,
        request_id: requestId
      }));
    });
  }

  // Enviar mensagem sem esperar resposta
  sendNoWait(type, payload = null) {
    this.ws.send(JSON.stringify({ type, payload }));
  }

  handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectAttempts++;
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        const token = localStorage.getItem('sentinel_token');
        if (token) this.connect(token);
      }, delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const sentinelWS = new SentinelWebSocket();
```

### 4.2 Formato das Mensagens

Todas as mensagens seguem este envelope:

```json
{
  "type": "MESSAGE_TYPE",
  "payload": { ... },
  "request_id": "optional-uuid-for-request-response"
}
```

### 4.3 Mensagens que o Frontend ENVIA

#### SEND_COMMAND
Envia comando para um agente.

```json
{
  "type": "SEND_COMMAND",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "type": "SHELL",
    "params": ["ipconfig", "/all"]
  },
  "request_id": "req-123"
}
```

**Resposta:**
```json
{
  "type": "COMMAND_SENT",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "agentHwid": "AA-BB-CC-DD-EE-FF",
    "type": "SHELL",
    "status": "SENT",
    ...
  },
  "request_id": "req-123"
}
```

#### GET_AGENTS
Solicita lista de agentes.

```json
{
  "type": "GET_AGENTS",
  "request_id": "req-124"
}
```

**Resposta:**
```json
{
  "type": "AGENTS_LIST",
  "payload": [
    { "hwid": "...", "hostname": "...", ... },
    ...
  ],
  "request_id": "req-124"
}
```

#### GET_AGENT
Solicita detalhes de um agente específico.

```json
{
  "type": "GET_AGENT",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF"
  },
  "request_id": "req-125"
}
```

**Resposta:**
```json
{
  "type": "AGENT_DETAILS",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "hostname": "DESKTOP-PC01",
    ...
  },
  "request_id": "req-125"
}
```

#### GET_STATS
Solicita estatísticas do dashboard.

```json
{
  "type": "GET_STATS",
  "request_id": "req-126"
}
```

**Resposta:**
```json
{
  "type": "STATS",
  "payload": {
    "totalAgents": 10,
    "onlineAgents": 7,
    ...
  },
  "request_id": "req-126"
}
```

#### GET_COMMANDS
Solicita histórico de comandos de um agente.

```json
{
  "type": "GET_COMMANDS",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "page": 0,
    "size": 50
  },
  "request_id": "req-127"
}
```

**Resposta:**
```json
{
  "type": "COMMANDS_LIST",
  "payload": {
    "content": [...],
    "totalPages": 5,
    ...
  },
  "request_id": "req-127"
}
```

#### GET_SCREENSHOTS
Solicita metadados de screenshots de um agente.

```json
{
  "type": "GET_SCREENSHOTS",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "page": 0,
    "size": 20
  },
  "request_id": "req-128"
}
```

**Resposta:**
```json
{
  "type": "SCREENSHOTS_LIST",
  "payload": {
    "content": [...],
    "totalPages": 3,
    ...
  },
  "request_id": "req-128"
}
```

#### PING
Keep-alive para manter conexão.

```json
{
  "type": "PING",
  "request_id": "req-129"
}
```

**Resposta:**
```json
{
  "type": "PONG",
  "request_id": "req-129"
}
```

### 4.4 Mensagens que o Frontend RECEBE (Push do Servidor)

Estas mensagens são enviadas automaticamente pelo servidor quando eventos ocorrem.
**Não têm `request_id`** pois são iniciadas pelo servidor.

#### AGENTS_LIST (Automático no Connect)
Enviado automaticamente quando o dashboard se conecta.

```json
{
  "type": "AGENTS_LIST",
  "payload": [...]
}
```

#### STATS (Automático no Connect)
Enviado automaticamente quando o dashboard se conecta.

```json
{
  "type": "STATS",
  "payload": {
    "totalAgents": 10,
    ...
  }
}
```

#### AGENT_UPDATE
Enviado quando um agente envia telemetria (heartbeat).

```json
{
  "type": "AGENT_UPDATE",
  "payload": {
    "hwid": "AA-BB-CC-DD-EE-FF",
    "hostname": "DESKTOP-PC01",
    "osInfo": "Windows 11 Pro",
    "ipLocal": "192.168.0.105",
    "status": "ONLINE",
    "communicationMode": "SESSION",
    "cpuLoad": 25.5,
    "ramUsage": 5120,
    "activeWindow": "Visual Studio Code",
    "lastSeen": "2025-10-25T10:35:00"
  }
}
```

**Uso:** Atualizar o agente correspondente na lista do store.

#### ADMIN_EVENT
Eventos administrativos importantes.

```json
{
  "type": "ADMIN_EVENT",
  "payload": {
    "eventType": "AGENT_CONNECTED",
    "agentHwid": "AA-BB-CC-DD-EE-FF",
    "message": "Agent DESKTOP-PC01 connected",
    "payload": null,
    "timestamp": "2025-10-25T10:30:00"
  }
}
```

**Tipos de eventos (`eventType`):**

| eventType | Descrição | payload extra |
|-----------|-----------|---------------|
| `AGENT_CONNECTED` | Novo agente conectou | - |
| `AGENT_DISCONNECTED` | Agente desconectou | - |
| `AGENT_STATUS_CHANGED` | Status mudou (ONLINE→OFFLINE, etc) | - |
| `COMMAND_RESULT` | Comando foi executado | commandId |
| `SCREENSHOT_RECEIVED` | Screenshot recebido | - |

**Uso:** Exibir notificação (toast), tocar som, atualizar contadores.

#### COMMAND_UPDATE
Atualização de status de um comando.

```json
{
  "type": "COMMAND_UPDATE",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "agentHwid": "AA-BB-CC-DD-EE-FF",
    "type": "SHELL",
    "payload": ["ipconfig", "/all"],
    "responseText": "Windows IP Configuration\n\nHost Name...",
    "status": "EXECUTED",
    "createdAt": "2025-10-25T10:30:00",
    "executedAt": "2025-10-25T10:30:05"
  }
}
```

**Uso:** Atualizar o comando na lista, exibir output no terminal.

#### ERROR
Erro em uma requisição.

```json
{
  "type": "ERROR",
  "payload": {
    "error": "Agent not found"
  },
  "request_id": "req-xxx"
}
```

### 4.5 Implementação dos Listeners (React)

```javascript
// hooks/useSentinelSocket.js
import { useEffect } from 'react';
import { sentinelWS } from '../services/websocket';
import { useAgentStore } from '../store/agentStore';
import { useCommandStore } from '../store/commandStore';
import { useUIStore } from '../store/uiStore';

export function useSentinelSocket() {
  const { updateAgent, setAgents } = useAgentStore();
  const { updateCommand } = useCommandStore();
  const { showNotification, playSound } = useUIStore();

  useEffect(() => {
    // Registrar listeners
    const unsubscribers = [
      // Lista inicial de agentes
      sentinelWS.on('AGENTS_LIST', (agents) => {
        setAgents(agents);
      }),

      // Atualização de telemetria
      sentinelWS.on('AGENT_UPDATE', (agent) => {
        updateAgent(agent);
      }),

      // Eventos administrativos
      sentinelWS.on('ADMIN_EVENT', (event) => {
        handleAdminEvent(event);
      }),

      // Atualização de comando
      sentinelWS.on('COMMAND_UPDATE', (command) => {
        updateCommand(command);
        
        if (command.status === 'EXECUTED') {
          showNotification({
            type: 'success',
            message: `Command executed on ${command.agentHwid}`
          });
        } else if (command.status === 'FAILED') {
          showNotification({
            type: 'error',
            message: `Command failed on ${command.agentHwid}`
          });
        }
      }),

      // Estatísticas
      sentinelWS.on('STATS', (stats) => {
        // Atualizar store de stats se necessário
      }),
    ];

    function handleAdminEvent(event) {
      switch (event.eventType) {
        case 'AGENT_CONNECTED':
          showNotification({
            type: 'success',
            message: event.message
          });
          playSound('connect');
          break;
          
        case 'AGENT_DISCONNECTED':
          showNotification({
            type: 'warning',
            message: event.message
          });
          break;
          
        case 'SCREENSHOT_RECEIVED':
          showNotification({
            type: 'info',
            message: `Screenshot received from ${event.agentHwid}`
          });
          break;
      }
    }

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);
}
```

---

## 5. Fluxos de Uso

### 5.1 Fluxo de Login e Inicialização

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Usuário acessa /login                                                    │
│ 2. Preenche username/password                                               │
│ 3. Frontend faz POST /api/auth/login                                        │
│ 4. Backend valida e retorna JWT                                             │
│ 5. Frontend salva token no localStorage                                     │
│ 6. Frontend redireciona para /dashboard                                     │
│ 7. Frontend conecta WebSocket com token                                     │
│ 8. Backend envia automaticamente AGENTS_LIST e STATS                        │
│ 9. Frontend popula o store e renderiza UI                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

```javascript
// pages/Login.jsx
async function handleLogin(e) {
  e.preventDefault();
  
  try {
    // 1. Login via REST
    await authStore.login(username, password);
    
    // 2. Conectar WebSocket
    const token = localStorage.getItem('sentinel_token');
    await sentinelWS.connect(token);
    
    // 3. Redirecionar
    navigate('/dashboard');
    
  } catch (error) {
    setError('Invalid credentials');
  }
}
```

### 5.2 Fluxo de Envio de Comando

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Operador seleciona agente no dashboard                                   │
│ 2. Operador clica em "Shell" e digita "ipconfig /all"                       │
│ 3. Frontend envia SEND_COMMAND via WebSocket                                │
│ 4. Backend cria Command com status PENDING                                  │
│ 5. Backend envia comando para agente via WebSocket                          │
│ 6. Backend atualiza status para SENT                                        │
│ 7. Backend responde ao dashboard com COMMAND_SENT                           │
│ 8. Frontend adiciona comando ao histórico (status: SENT)                    │
│ 9. Agente executa e envia COMMAND_RESULT                                    │
│ 10. Backend atualiza Command com output e status EXECUTED                   │
│ 11. Backend envia COMMAND_UPDATE para todos dashboards                      │
│ 12. Frontend atualiza comando no histórico e exibe output                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

```javascript
// Enviando comando
async function sendShellCommand(hwid, command) {
  // Validar
  if (!command.trim()) return;

  // Preparar payload
  const params = command.startsWith('powershell')
    ? ['powershell', '-c', command.replace('powershell ', '')]
    : ['cmd', '/c', command];

  // Enviar via WebSocket
  const response = await sentinelWS.send('SEND_COMMAND', {
    hwid,
    type: 'SHELL',
    params
  });

  if (response.error) {
    showError(response.error);
  } else {
    // Comando enviado com sucesso
    // O resultado virá via COMMAND_UPDATE
    addCommandToHistory(response);
  }
}
```

### 5.3 Fluxo de Captura de Screenshot

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Operador clica em "Screenshot" no agente                                 │
│ 2. Frontend envia SEND_COMMAND (type: SCREENSHOT)                           │
│ 3. Backend cria Command e envia para agente                                 │
│ 4. Agente captura tela                                                      │
│ 5. Agente envia COMMAND_RESULT (SUCCESS)                                    │
│ 6. Agente envia SCREENSHOT_UPLOAD (base64)                                  │
│ 7. Backend salva imagem no banco (BYTEA)                                    │
│ 8. Backend envia ADMIN_EVENT (SCREENSHOT_RECEIVED)                          │
│ 9. Frontend exibe notificação                                               │
│ 10. Frontend pode fazer GET /api/screenshots/agent/{hwid} para listar       │
│ 11. Frontend pode fazer GET /api/screenshots/{id}/image para baixar         │
└─────────────────────────────────────────────────────────────────────────────┘
```

```javascript
// Capturar screenshot
async function captureScreenshot(hwid) {
  const response = await sentinelWS.send('SEND_COMMAND', {
    hwid,
    type: 'SCREENSHOT',
    params: []
  });

  if (!response.error) {
    showNotification({
      type: 'info',
      message: 'Screenshot request sent'
    });
  }
}

// Carregar lista de screenshots
async function loadScreenshots(hwid, page = 0) {
  const response = await api.get(`/api/screenshots/agent/${hwid}`, {
    params: { page, size: 20 }
  });
  return response.data;
}

// Componente de galeria
function ScreenshotGallery({ hwid }) {
  const [screenshots, setScreenshots] = useState([]);

  useEffect(() => {
    loadScreenshots(hwid).then(data => setScreenshots(data.content));
    
    // Listener para novos screenshots
    return sentinelWS.on('ADMIN_EVENT', (event) => {
      if (event.eventType === 'SCREENSHOT_RECEIVED' && event.agentHwid === hwid) {
        // Recarregar lista
        loadScreenshots(hwid).then(data => setScreenshots(data.content));
      }
    });
  }, [hwid]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {screenshots.map(ss => (
        <img
          key={ss.id}
          src={`${API_URL}/api/screenshots/${ss.id}/image`}
          alt={`Screenshot ${ss.capturedAt}`}
          onClick={() => openLightbox(ss.id)}
        />
      ))}
    </div>
  );
}
```

### 5.4 Fluxo de Monitoramento Real-Time

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Dashboard conectado, operador visualizando grid de agentes                  │
│                                                                             │
│ [A cada ~5 segundos para cada agente ONLINE]                                │
│                                                                             │
│ 1. Agente envia HEARTBEAT para backend                                      │
│ 2. Backend atualiza Agent no banco                                          │
│ 3. Backend envia AGENT_UPDATE para todos dashboards                         │
│ 4. Frontend recebe e atualiza store                                         │
│ 5. React re-renderiza card do agente com novos dados                        │
│    - CPU %                                                                  │
│    - RAM usage                                                              │
│    - Active window                                                          │
│    - Last seen timestamp                                                    │
│                                                                             │
│ [Se agente para de enviar heartbeat por 30s]                                │
│                                                                             │
│ 6. AgentMonitorService detecta timeout                                      │
│ 7. Backend marca agente como OFFLINE                                        │
│ 8. Backend envia ADMIN_EVENT (AGENT_STATUS_CHANGED)                         │
│ 9. Frontend atualiza status visual (verde → cinza)                          │
│ 10. Frontend pode exibir notificação                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Estrutura de Dados (DTOs)

### 6.1 Agent

```typescript
interface Agent {
  hwid: string;              // ID único do hardware (PK)
  hostname: string;          // Nome do computador
  osInfo: string;            // "Windows 11 Pro 23H2"
  ipLocal: string;           // "192.168.0.105"
  status: 'ONLINE' | 'OFFLINE' | 'DEAD';
  communicationMode: 'SESSION' | 'BEACON';
  beaconInterval: number | null;  // Segundos (null se SESSION)
  cpuLoad: number;           // Porcentagem (0-100)
  ramUsage: number;          // MB
  activeWindow: string | null;
  firstSeen: string;         // ISO datetime
  lastSeen: string;          // ISO datetime
}
```

### 6.2 Command

```typescript
interface Command {
  id: string;                // UUID
  agentHwid: string;
  type: CommandType;
  payload: string[];         // Parâmetros
  responseText: string | null;
  status: 'PENDING' | 'SENT' | 'EXECUTED' | 'FAILED';
  createdAt: string;
  executedAt: string | null;
}

type CommandType = 
  | 'SHELL'
  | 'SCREENSHOT'
  | 'KILL_PROC'
  | 'MESSAGE'
  | 'PROCESS_LIST'
  | 'OPEN_URL'
  | 'SHUTDOWN'
  | 'SWITCH_MODE';
```

### 6.3 Screenshot Metadata

```typescript
interface ScreenshotMetadata {
  id: string;                // UUID
  agentHwid: string;
  triggerCommandId: string | null;
  capturedAt: string;        // ISO datetime
}
```

### 6.4 Dashboard Stats

```typescript
interface DashboardStats {
  totalAgents: number;
  onlineAgents: number;
  offlineAgents: number;
  deadAgents: number;
  pendingCommands: number;
  executedCommands: number;
  failedCommands: number;
}
```

### 6.5 Admin Event

```typescript
interface AdminEvent {
  eventType: 
    | 'AGENT_CONNECTED'
    | 'AGENT_DISCONNECTED'
    | 'AGENT_STATUS_CHANGED'
    | 'COMMAND_RESULT'
    | 'SCREENSHOT_RECEIVED';
  agentHwid: string;
  message: string;
  payload: any | null;
  timestamp: string;
}
```

### 6.6 WebSocket Message

```typescript
interface WebSocketMessage {
  type: string;
  payload: any;
  request_id?: string;
}
```

---

## 7. Tratamento de Erros

### 7.1 Erros REST

Todos os erros REST seguem este formato:

```json
{
  "timestamp": "2025-10-25T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Descrição do erro"
}
```

Para erros de validação:

```json
{
  "timestamp": "2025-10-25T10:30:00",
  "status": 400,
  "error": "Validation failed",
  "details": {
    "username": "Username is required",
    "password": "Password must be at least 6 characters"
  }
}
```

### 7.2 Erros WebSocket

```json
{
  "type": "ERROR",
  "payload": {
    "error": "Agent not found"
  },
  "request_id": "req-xxx"
}
```

### 7.3 Códigos HTTP Comuns

| Código | Significado | Ação no Frontend |
|--------|-------------|------------------|
| 200 | Sucesso | Processar resposta |
| 201 | Criado | Processar resposta |
| 204 | Sem conteúdo | Sucesso (delete) |
| 400 | Bad Request | Exibir erro de validação |
| 401 | Unauthorized | Redirecionar para login |
| 403 | Forbidden | Exibir erro de permissão |
| 404 | Not Found | Exibir "não encontrado" |
| 500 | Server Error | Exibir erro genérico |

### 7.4 Implementação

```javascript
// Interceptor de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data } = error.response || {};

    switch (status) {
      case 401:
        authStore.logout();
        navigate('/login');
        toast.error('Session expired. Please login again.');
        break;
        
      case 403:
        toast.error('You do not have permission for this action.');
        break;
        
      case 404:
        toast.error(data?.message || 'Resource not found.');
        break;
        
      case 400:
        if (data?.details) {
          // Erros de validação
          Object.values(data.details).forEach(msg => toast.error(msg));
        } else {
          toast.error(data?.message || 'Invalid request.');
        }
        break;
        
      default:
        toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);
```

---

## 8. Boas Práticas de Implementação

### 8.1 Gerenciamento de Estado (Zustand)

```javascript
// store/agentStore.js
import { create } from 'zustand';

export const useAgentStore = create((set, get) => ({
  agents: [],
  selectedAgent: null,
  isLoading: false,

  setAgents: (agents) => set({ agents }),

  updateAgent: (updatedAgent) => set((state) => ({
    agents: state.agents.map(agent =>
      agent.hwid === updatedAgent.hwid
        ? { ...agent, ...updatedAgent }
        : agent
    ),
    // Atualizar selected se for o mesmo
    selectedAgent: state.selectedAgent?.hwid === updatedAgent.hwid
      ? { ...state.selectedAgent, ...updatedAgent }
      : state.selectedAgent
  })),

  selectAgent: (hwid) => set((state) => ({
    selectedAgent: state.agents.find(a => a.hwid === hwid) || null
  })),

  getOnlineAgents: () => get().agents.filter(a => a.status === 'ONLINE'),
  getOfflineAgents: () => get().agents.filter(a => a.status === 'OFFLINE'),
}));
```

### 8.2 Reconexão WebSocket

```javascript
// Implementar reconnect com backoff exponencial
class SentinelWebSocket {
  reconnectAttempts = 0;
  baseDelay = 1000; // 1 segundo
  maxDelay = 30000; // 30 segundos

  handleDisconnect() {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay
    );

    // Adicionar jitter para evitar thundering herd
    const jitter = Math.random() * 1000;

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(getToken());
    }, delay + jitter);
  }
}
```

### 8.3 Otimização de Renderização

```javascript
// Usar React.memo para cards de agente
const AgentCard = React.memo(({ agent, onClick }) => {
  return (
    <div onClick={() => onClick(agent.hwid)}>
      <StatusIndicator status={agent.status} />
      <h3>{agent.hostname}</h3>
      <p>{agent.cpuLoad}% CPU</p>
      <p>{formatBytes(agent.ramUsage * 1024 * 1024)} RAM</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // Só re-renderizar se dados mudaram
  return (
    prevProps.agent.status === nextProps.agent.status &&
    prevProps.agent.cpuLoad === nextProps.agent.cpuLoad &&
    prevProps.agent.ramUsage === nextProps.agent.ramUsage &&
    prevProps.agent.activeWindow === nextProps.agent.activeWindow
  );
});
```

### 8.4 Formatadores Úteis

```javascript
// utils/formatters.js

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatCpuLoad(load) {
  return `${load.toFixed(1)}%`;
}

export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

export function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString();
}
```

### 8.5 Variáveis de Ambiente

```bash
# .env.development
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080

# .env.production
VITE_API_URL=https://sentinel-api.example.com
VITE_WS_URL=wss://sentinel-api.example.com
```

---

## Apêndice: Checklist de Implementação

### Login/Auth
- [ ] Tela de login com validação
- [ ] Salvar token no localStorage
- [ ] Interceptor para adicionar token às requisições
- [ ] Interceptor para tratar 401 e redirecionar
- [ ] Validar token ao carregar app

### WebSocket
- [ ] Conectar com token após login
- [ ] Implementar listeners para todos os tipos de mensagem
- [ ] Reconexão automática com backoff
- [ ] Indicador visual de status da conexão
- [ ] Keep-alive com PING/PONG

### Dashboard
- [ ] Grid de agentes com status visual
- [ ] KPIs (online, offline, dead, commands)
- [ ] Atualização real-time via WebSocket
- [ ] Filtros por status
- [ ] Busca por hostname/HWID

### Agent Details
- [ ] Informações detalhadas do agente
- [ ] Terminal para comandos shell
- [ ] Histórico de comandos com output
- [ ] Galeria de screenshots
- [ ] Lista de processos
- [ ] Ações rápidas (screenshot, kill, message)

### Comandos
- [ ] Envio via WebSocket
- [ ] Exibição de output em tempo real
- [ ] Histórico paginado
- [ ] Indicador de status (pending, sent, executed, failed)

### Screenshots
- [ ] Galeria com thumbnails
- [ ] Lightbox para visualização
- [ ] Download individual
- [ ] Paginação

### Notificações
- [ ] Toast para eventos importantes
- [ ] Som para conexão/desconexão de agente
- [ ] Badge de notificações não lidas

---

*Documento gerado para Sentinel Vision v1.0.6*
