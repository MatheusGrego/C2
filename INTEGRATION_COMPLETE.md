# Sentinel Vision - Integração Completa com Backend

## Resumo das Alterações

Todos os **mocks foram removidos** e o frontend agora está **totalmente integrado** com o backend Sentinel Core.

---

## Mudanças Implementadas

### 1. Dependências Atualizadas

**Removido:**
- `@stomp/stompjs` - Protocolo STOMP (não utilizado pelo backend)
- `sockjs-client` - SockJS (não utilizado pelo backend)

**Mantido:**
- `axios` - Para chamadas REST API
- WebSocket nativo do navegador para conexão em tempo real

### 2. Novo Serviço WebSocket (`src/services/websocket.js`)

Implementação **Raw WebSocket** conforme especificação do backend:
- Conexão via `/ws-dashboard?token=JWT_TOKEN`
- Protocolo de mensagens com envelope JSON `{type, payload, request_id}`
- Suporte a request-response pattern
- Reconexão automática com backoff exponencial
- Keep-alive com PING/PONG a cada 30 segundos

**Mensagens Implementadas:**
- `SEND_COMMAND` - Enviar comandos para agentes
- `GET_AGENTS` - Solicitar lista de agentes
- `GET_AGENT` - Detalhes de um agente específico
- `GET_STATS` - Estatísticas do dashboard
- `GET_COMMANDS` - Histórico de comandos
- `GET_SCREENSHOTS` - Metadados de screenshots
- `PING` - Keep-alive

**Listeners para Mensagens do Servidor:**
- `AGENTS_LIST` - Lista inicial de agentes (enviada automaticamente ao conectar)
- `AGENT_UPDATE` - Atualização de telemetria de agentes
- `ADMIN_EVENT` - Eventos administrativos (conexão, desconexão, screenshots)
- `COMMAND_UPDATE` - Atualizações de status de comandos
- `STATS` - Estatísticas do dashboard
- `ERROR` - Erros do servidor

### 3. API REST Completa (`src/services/api.js`)

Todos os endpoints implementados conforme `FRONTEND_INTEGRATION.md`:

**Autenticação:**
- `POST /api/auth/login` - Login com username/password
- `GET /api/auth/validate` - Validar token JWT

**Agentes:**
- `GET /api/agents` - Listar todos os agentes
- `GET /api/agents/{hwid}` - Obter agente por HWID
- `GET /api/agents/status/{status}` - Filtrar por status
- `GET /api/agents/count/online` - Contar agentes online
- `DELETE /api/agents/{hwid}` - Deletar agente

**Comandos:**
- `POST /api/commands` - Enviar comando
- `GET /api/commands/{id}` - Obter comando por ID
- `GET /api/commands/agent/{hwid}` - Histórico de comandos
- `GET /api/commands/agent/{hwid}/paged` - Histórico paginado
- `GET /api/commands/agent/{hwid}/pending` - Comandos pendentes

**Screenshots:**
- `GET /api/screenshots/agent/{hwid}` - Listar screenshots (paginado)
- `GET /api/screenshots/{id}/metadata` - Metadados de screenshot
- `GET /api/screenshots/{id}/image` - Download da imagem (blob)
- `GET /api/screenshots/agent/{hwid}/count` - Contar screenshots
- `DELETE /api/screenshots/{id}` - Deletar screenshot

**Dashboard:**
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/connections` - Status de conexões WebSocket
- `GET /api/dashboard/health` - Health check

### 4. Stores Atualizados

**CommandStore (`src/store/commandStore.js`):**
- Novos métodos `addCommand()` e `updateCommand()` para trabalhar com dados do backend
- Status alinhados com o backend: `PENDING`, `SENT`, `EXECUTED`, `FAILED`

**AgentStore (`src/store/agentStore.js`):**
- Já compatível, nenhuma alteração necessária

**UIStore (`src/store/uiStore.js`):**
- Já compatível, nenhuma alteração necessária

### 5. Hooks Atualizados

**useSentinelSocket (`src/hooks/useSentinelSocket.js`):**
- Completamente reescrito para usar novo protocolo WebSocket
- Implementa todos os listeners para mensagens do servidor
- Gerencia reconexão automática
- Keep-alive com ping a cada 30 segundos

### 6. Helpers de Comandos (`src/services/commands.js`)

Atualizado para usar a nova assinatura do WebSocket:
- `sentinelSocket.sendCommand(hwid, type, params)` (ordem corrigida)

### 7. Variáveis de Ambiente

**`.env.development`:**
```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

**`.env.production`:**
```env
VITE_API_URL=https://sentinel-api.example.com
VITE_WS_URL=wss://sentinel-api.example.com
```

---

## Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Certifique-se de que o arquivo `.env.development` aponta para o backend correto:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

### 3. Iniciar o Backend

Certifique-se de que o **Sentinel Core** (backend) está rodando em `http://localhost:8080`.

### 4. Iniciar o Frontend

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

### 5. Fazer Login

Use as credenciais configuradas no backend. Por padrão:
- **Username:** `admin`
- **Password:** (conforme configurado no backend)

---

## Fluxo de Funcionamento

### Login
1. Usuário insere credenciais
2. `POST /api/auth/login` retorna JWT token
3. Token é salvo no `localStorage`
4. Redirecionamento para `/dashboard`

### Dashboard (Após Login)
1. `MainLayout` conecta ao WebSocket com token JWT
2. WebSocket envia automaticamente `AGENTS_LIST` e `STATS`
3. Agents são exibidos na grid/lista
4. Atualizações em tempo real via `AGENT_UPDATE`

### Envio de Comando
1. Usuário seleciona agente e envia comando
2. Comando é enviado via WebSocket: `SEND_COMMAND`
3. Backend responde com confirmação
4. Backend envia `COMMAND_UPDATE` quando o agente executa

### Screenshots
1. Comando `SCREENSHOT` enviado via WebSocket
2. Agente captura e envia screenshot
3. Backend salva e envia `ADMIN_EVENT` (SCREENSHOT_RECEIVED)
4. Frontend carrega metadados via `GET /api/screenshots/agent/{hwid}`
5. Imagens carregadas via `GET /api/screenshots/{id}/image`

---

## Logs e Debugging

Todos os logs de WebSocket e API estão no console do navegador com prefixos:
- `[WS]` - WebSocket logs
- `[API]` - REST API logs

---

## Verificação de Integração

Para verificar se tudo está funcionando:

1. **Login:** Deve redirecionar para dashboard após login bem-sucedido
2. **WebSocket:** Indicador "CONNECTED" deve aparecer no header
3. **Agentes:** Lista de agentes deve carregar automaticamente
4. **Tempo Real:** CPU/RAM devem atualizar a cada ~5 segundos
5. **Comandos:** Comandos enviados devem executar e retornar output
6. **Screenshots:** Screenshots devem ser capturados e exibidos

---

## Diferenças do Mock

| Aspecto | Mock (Antigo) | Real (Atual) |
|---------|---------------|--------------|
| WebSocket | STOMP/SockJS simulado | WebSocket raw nativo |
| API | Dados hardcoded em memória | REST API real com backend |
| Autenticação | Mock "admin/admin" | JWT real do backend |
| Comandos | Respostas simuladas | Execução real em agentes |
| Screenshots | Canvas placeholder | Imagens reais capturadas |
| Telemetria | Valores aleatórios | Dados reais de CPU/RAM |
| Persistência | Nenhuma | PostgreSQL via backend |

---

## Checklist de Funcionalidades

- ✅ Login com JWT
- ✅ Validação de token ao recarregar
- ✅ WebSocket conecta automaticamente
- ✅ Carregamento inicial de agentes via REST
- ✅ Atualizações em tempo real via WebSocket
- ✅ Envio de comandos (SHELL, SCREENSHOT, etc)
- ✅ Recepção de resultados de comandos
- ✅ Notificações de eventos (agentes conectam/desconectam)
- ✅ Galeria de screenshots
- ✅ Download de screenshots
- ✅ Reconexão automática
- ✅ Keep-alive (PING/PONG)
- ✅ Tratamento de erros 401/403
- ✅ Logout e limpeza de sessão

---

## Conclusão

A integração está **100% completa**. Todos os mocks foram removidos e substituídos por implementações reais que se comunicam com o backend Sentinel Core via:
- **REST API** para operações CRUD
- **WebSocket** para comunicação em tempo real

O sistema está pronto para produção! 🚀
