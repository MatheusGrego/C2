# ESPECIFICAÇÃO TÉCNICA: SENTINEL C2 - KERNEL DO BACKEND

**Versão:** 1.0.6  
**Status:** Rascunho de Aprovação  
**Data:** 25 de Outubro de 2025  
**Arquitetura:** Clean Architecture / Hexagonal

---

## 1. Introdução e Visão Arquitetural

O presente documento define as especificações técnicas para o desenvolvimento do núcleo (Backend) do sistema Sentinel Command & Control (C2). O sistema tem como objetivo a orquestração remota de agentes de software distribuídos, coleta de telemetria em tempo real e execução de comandos administrativos.

A arquitetura do sistema seguirá estritamente os princípios da **Clean Architecture**. O domínio da aplicação (Entities e Use Cases) deve permanecer agnóstico a frameworks externos. A comunicação com o mundo externo (WebSockets, REST, Banco de Dados) será realizada através de adaptadores em camadas externas (Interface Adapters e Frameworks).

### Stack Tecnológico

- **Linguagem:** Java 21 (LTS)
- **Framework:** Spring Boot 3.3
- **Persistência:** PostgreSQL (Containerizado)
- **Comunicação Real-Time:** Protocolo STOMP sobre WebSocket

---

## 2. Persistência e Modelagem de Dados

A camada de persistência será isolada em um container Docker executando PostgreSQL. Para garantir a organização lógica e a otimização de operações de I/O (Input/Output), o banco de dados será segmentado em dois schemas distintos: `public` para dados relacionais estruturados e `blob_storage` para armazenamento de dados binários não estruturados.

### 2.1 Definição dos Schemas e Tabelas

A integridade referencial entre os schemas deve ser mantida através de chaves estrangeiras (Foreign Keys) explícitas.

#### A. Schema `public` (Metadados e Controle)

Este schema armazena o estado da aplicação e os metadados dos agentes.

**Tabela `users`**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador primário. |
| `username` | VARCHAR(50) | Credencial de acesso (Unique). |
| `password_hash` | VARCHAR(255) | Hash BCrypt da senha. |

**Tabela `agents`**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `hwid` | VARCHAR(64) | Primary Key. Identificador único de hardware gerado pelo implante. |
| `hostname` | VARCHAR(100) | Nome de rede do host. |
| `os_info` | VARCHAR(100) | Versão do Sistema Operacional. |
| `status` | ENUM | Estado atual (ONLINE, OFFLINE, DEAD). |
| `communication_mode` | ENUM | Modo de comunicação (SESSION, BEACON). Default: SESSION. |
| `beacon_interval` | INTEGER | Intervalo em segundos para modo Beacon. Default: NULL (não aplicável em SESSION). |
| `last_seen` | TIMESTAMP | Carimbo de tempo do último heartbeat recebido. |

**Tabela `commands`**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Primary Key. Correlation ID para rastreamento assíncrono. |
| `agent_hwid` | VARCHAR(64) | Foreign Key → `public.agents(hwid)`. |
| `type` | ENUM | Tipo da instrução (SHELL, SCREENSHOT, KILL_PROC, PROCESS_LIST, etc). |
| `payload` | JSONB | Argumentos variáveis do comando. |
| `response_text` | TEXT | Saída de texto (STDOUT/STDERR) do comando. |
| `status` | ENUM | Ciclo de vida (PENDING, SENT, EXECUTED, FAILED). |

#### B. Schema `blob_storage` (Dados Binários)

Este schema é destinado ao armazenamento de evidências digitais (screenshots). A separação permite estratégias de backup diferenciadas (ex: backup frequente do `public`, backup esporádico do `blob_storage`).

**Tabela `agent_screenshots`**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador do recurso. |
| `agent_hwid` | VARCHAR(64) | Foreign Key → `public.agents(hwid)`. |
| `image_data` | BYTEA | O binário bruto da imagem. Não utilizar Base64 no banco para evitar overhead de 33% no tamanho. |
| `captured_at` | TIMESTAMP | Data da captura. |

> **Nota de Implementação:** A entidade JPA correspondente à tabela `agent_screenshots` deve utilizar a anotação `@Lob` no campo `imageData` e ser mapeada para carregar preguiçosamente (`FetchType.LAZY`) para evitar consumo excessivo de memória ao listar metadados.

---

## 3. Protocolo de Comunicação e Contratos de Dados (JSON)

A comunicação entre o C2 (Servidor) e o Implante (Agente) ocorre via WebSocket. Abaixo estão definidos os contratos JSON estritos que devem ser implementados em ambas as pontas.

### 3.1 Endpoints e Mapeamento STOMP

A tabela a seguir detalha os endpoints de comunicação, sua direção e o mapeamento entre a estrutura JSON e o objeto Java (POJO) esperado.

| Endpoint STOMP | Direção | Tipo de Mensagem | POJO Java (DTO) | Descrição |
|----------------|---------|------------------|-----------------|-----------|
| `/app/telemetry` | Agente → Server | Heartbeat | `HeartbeatDTO` | Envio periódico de status vital do agente. Processado pelo `TelemetryController`. |
| `/topic/commands/{hwid}` | Server → Agente | Command | `CommandRequestDTO` | Canal de Subscribe do agente. O servidor publica ordens aqui. |
| `/app/responses` | Agente → Server | Result | `CommandResultDTO` | Retorno textual de comandos executados (Shell, Processos). |
| `/app/upload` | Agente → Server | Binary Upload | `ScreenshotUploadDTO` | Envio de imagem codificada em Base64 para processamento e armazenamento. |

### 3.2 Tipos de Comandos Suportados (Enum: CommandType)

Os seguintes tipos de comandos devem ser suportados pelo Backend e pelo Agente.

| Tipo (`type`) | Descrição | Payload Esperado (`payload`) |
|---------------|-----------|------------------------------|
| `SHELL` | Executa comando no terminal (escondido). | `["comando", "arg1", "arg2"]`<br>Exemplo: `["powershell", "-Command", "Get-Process"]` |
| `SCREENSHOT` | Captura a tela principal. | `[]` (Vazio) |
| `KILL_PROC` | Mata um processo pelo nome. | `["nome_processo.exe"]` |
| `MESSAGE` | Exibe uma caixa de diálogo (MessageBox). | `["Título", "Mensagem"]` |
| `PROCESS_LIST` | Lista processos ativos. | `[]` (Vazio) |
| `OPEN_URL` | Abre uma URL no navegador padrão. | `["https://site.com"]` |
| `SHUTDOWN` | Desliga o computador remoto. | `[]` (Vazio) |
| `SWITCH_MODE` | Alterna entre modo Session e Beacon. | `["session"]` ou `["beacon", "intervalo_segundos"]` |

> **Nota sobre Shell:** O payload para `SHELL` deve ser flexível. Para rodar no CMD, usar `["cmd", "/c", "comando"]`. Para PowerShell, `["powershell", "-c", "comando"]`.

> **Nota sobre SWITCH_MODE:** Este comando permite o Backend alternar o modo de comunicação do agente. Modo `session` mantém conexão persistente (baixa latência), enquanto modo `beacon` utiliza check-ins periódicos (alta furtividade). Exemplo: `["beacon", "300"]` configura check-ins a cada 5 minutos.

### 3.3 Telemetria (Heartbeat)

O agente deve enviar este payload a cada 5 segundos para o tópico `/app/telemetry`. O servidor utiliza esses dados para atualizar a tabela `agents` e detectar "Dead Agents".

**Payload JSON (Agente → Servidor):**

```json
{
  "hwid": "AA-BB-CC-DD-EE-FF",        // String: UUID da Placa-Mãe ou MAC Address
  "hostname": "DESKTOP-FINANCEIRO",   // String: Hostname do SO
  "os_info": "Windows 11 Pro 23H2",   // String: Informação de versão do kernel
  "ip_local": "192.168.0.105",        // String: Interface de rede principal
  "cpu_load": 12.5,                   // Double: % de uso atual da CPU
  "ram_usage": 4096,                  // Long: MB de RAM em uso
  "active_window": "Chrome - Gmail"   // String: Título da janela em primeiro plano
}
```

### 3.4 Estrutura de Comando (Command Object)

O servidor envia este payload para o tópico `/topic/commands/{hwid}` quando o operador solicita uma ação. O campo `id` (UUID) é mandatório para correlação futura.

**Payload JSON (Servidor → Agente):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000", // UUID: Correlation ID (Gerado pelo Java)
  "type": "SHELL",                              // Enum: Tipo de comando (ver 3.2)
  "params": [                                   // List<String>: Argumentos do comando
    "ipconfig",
    "/all"
  ]
}
```

### 3.5 Resposta de Comando (Command Result)

Após a execução, o agente deve responder para `/app/responses`. O agente deve devolver o `id` original recebido.

**Payload JSON (Agente → Servidor):**

```json
{
  "command_id": "550e8400-e29b-41d4-a716-446655440000", // UUID: O mesmo ID recebido acima
  "hwid": "AA-BB-CC-DD-EE-FF",                         // String: ID do Agente
  "status": "SUCCESS",                                  // Enum: SUCCESS ou ERROR
  "output": "Configuração de IP do Windows...\n..."     // String: O STDOUT capturado
}
```

### 3.6 Resposta Específica: Lista de Processos (PROCESS_LIST)

Quando o comando for `PROCESS_LIST`, o campo `output` do `CommandResult` deve conter um JSON (stringificado) com a lista de processos, e não texto livre.

**Estrutura do JSON dentro de `output`:**

```json
[
  {"pid": 1234, "name": "chrome.exe", "user": "Matheus", "mem_kb": 50000},
  {"pid": 5678, "name": "svchost.exe", "user": "SYSTEM", "mem_kb": 12000}
]
```

O `ProcessListProcessor` no Java deverá fazer o parse dessa string JSON para salvar de forma estruturada ou apenas repassar ao Frontend.

### 3.7 Upload de Evidência (Screenshot)

Devido à limitação de frames do WebSocket, recomenda-se o envio da imagem codificada em Base64 dentro de um envelope JSON para o tópico `/app/upload`.

**Payload JSON (Agente → Servidor):**

```json
{
  "hwid": "AA-BB-CC-DD-EE-FF",                         // String: ID do Agente
  "trigger_command_id": "uuid-opcional-se-houver",      // UUID: ID do comando que gerou o print
  "image_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD..."     // String: Base64 da imagem JPEG
}
```

**Fluxo de Processamento:**

1. O Agente recebe comando `SCREENSHOT`.
2. O Agente captura a tela.
3. O Agente envia confirmação de execução (`SUCCESS`) para `/app/responses`.
4. Imediatamente após, o Agente envia a imagem para `/app/upload`.
5. O Servidor correlaciona pelo `trigger_command_id` (opcional) ou apenas armazena no histórico do agente.

---

## 4. Segurança e Autenticação

O sistema não utilizará autenticação mútua via certificados (mTLS) nesta versão para reduzir a complexidade de deploy. A segurança baseia-se em **Segredo Compartilhado (PSK)** e **Ofuscação**.

### 4.1 Mecanismo de Header-Key

A autenticação do agente ocorre durante o handshake HTTP de upgrade para WebSocket.

1. **Definição do Segredo:** O arquivo `application.properties` do servidor conterá a chave:
   ```properties
   sentinel.security.agent-secret=INSANO_PROJECT_V1
   ```

2. **Transporte:** O Agente deve incluir um header HTTP customizado na requisição de conexão:
   ```
   X-Agent-Auth: <HASH_OFUSCADO>
   ```

3. **Lógica de Desobfuscação (Servidor):**
   - Recomenda-se não trafegar a chave em texto plano.
   - O Agente deve gerar um hash (ex: SHA-256) da concatenação `CHAVE + TIMESTAMP_ATUAL` e enviar o Timestamp em outro header.
   - O Servidor, através de um `ChannelInterceptor` do Spring, recalcula o hash localmente usando a chave armazenada e compara com o recebido.
   - Se os hashes divergirem, a conexão é abortada (`401 Unauthorized`) antes da abertura do socket.

### 4.2 Autenticação do Operador

Para o acesso à API REST e ao Painel, será utilizado um mecanismo simplificado de **JWT (JSON Web Token)**. Não haverá distinção de roles (RBAC) nesta versão; a posse de um token válido confere acesso administrativo total (`ROLE_ADMIN`).

---

## 5. Regras de Negócio e Monitoramento

### 5.1 Detecção de Agentes Mortos (Zombie Detection)

Para manter a integridade da lista de agentes ativos, o sistema deve implementar um mecanismo de monitoramento de liveness.

**Estratégia:**

1. **Janela de Tolerância:** O intervalo de heartbeat esperado é de 5 segundos. A janela de tolerância será de 30 segundos (6 ciclos perdidos).

2. **Job Agendado:** Um processo agendado (`@Scheduled`) no Spring Boot deve rodar a cada 10 segundos.

3. **Lógica de Execução:**
   - Consultar todos os agentes com status `ONLINE`.
   - Comparar `agents.last_seen` com `LocalDateTime.now()`.
   - Se diferença > 30s, atualizar `agents.status` para `OFFLINE`.
   - Opcional: Se diferença > 7 dias, atualizar para `DEAD` (considerado perdido/desinstalado).

4. **Notificação:** Ao alterar o status, o servidor deve emitir um evento via WebSocket para o tópico `/topic/admin/events` para que o Frontend atualize a UI em tempo real (ex: mudar a bolinha de verde para cinza).

---

## 6. Extensibilidade e Design Patterns

Para garantir que o sistema possa crescer (novos comandos) sem refatoração do código de rede, o Backend deve implementar o padrão **Strategy** (ou Command Pattern).

### 6.1 O Pattern de Processamento

A camada de Use Cases deve definir uma interface genérica:

```java
public interface CommandProcessor {
    CommandType getSupportedType();
    void process(UUID agentId, JsonNode payload);
}
```

O sistema deve utilizar a injeção de dependência do Spring para criar um mapa de estratégias: `Map<CommandType, CommandProcessor>`.

**Exemplo Prático: Listagem de Processos**

1. Cria-se uma nova classe `ProcessListProcessor` que implementa a interface.
2. Define-se o `CommandType.PROCESS_LIST`.
3. Quando o payload chega, o Dispatcher delega para esta classe.
4. Esta classe sabe como interpretar o JSON específico de processos (descrito no item 3.6) e como salvá-lo ou enviá-lo para o Frontend.

Isso permite adicionar funcionalidades complexas (como transferência de arquivos ou tunelamento) apenas criando novas classes processadoras, mantendo o Core do WebSocket intocado.
