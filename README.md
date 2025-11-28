# Sentinel Core - C2 Backend Server

**Version:** 1.0.6  
**Stack:** Java 21 + Spring Boot 3.3 + PostgreSQL

## Overview

Sentinel Core is the backend server for the Sentinel C2 framework. It handles:

- Agent (implant) connections via WebSocket
- Dashboard (operator) connections via WebSocket
- Real-time telemetry processing
- Command dispatch and result handling
- Screenshot storage and retrieval
- JWT authentication for operators
- PSK authentication for agents

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SENTINEL CORE                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  │   REST API  │    │  WebSocket  │    │  WebSocket  │            │
│  │  /api/*     │    │ /ws-sentinel│    │/ws-dashboard│            │
│  │  (HTTP)     │    │  (Agents)   │    │ (Dashboard) │            │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘            │
│         │                   │                   │                   │
│         └───────────────────┼───────────────────┘                   │
│                             │                                        │
│                    ┌────────▼────────┐                              │
│                    │    Services     │                              │
│                    │  - AgentService │                              │
│                    │  - CommandSvc   │                              │
│                    │  - ScreenshotSvc│                              │
│                    └────────┬────────┘                              │
│                             │                                        │
│                    ┌────────▼────────┐                              │
│                    │   PostgreSQL    │                              │
│                    │  - public       │                              │
│                    │  - blob_storage │                              │
│                    └─────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Configure Application

Edit `src/main/resources/application.properties`:

```properties
# Change the PSK for production!
sentinel.security.agent-secret=YOUR_SECRET_KEY_HERE

# Change JWT secret for production!
sentinel.security.jwt.secret=YOUR_JWT_SECRET_HERE
```

### 3. Build and Run

```bash
# Build
mvn clean package -DskipTests

# Run
java -jar target/sentinel-core-1.0.6.jar
```

The server will start on `http://localhost:8080`

## Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |

**Change these in production!**

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/validate` | Validate token |

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/{hwid}` | Get agent by HWID |
| GET | `/api/agents/status/{status}` | Get agents by status |

### Commands

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/commands` | Send command to agent |
| GET | `/api/commands/{id}` | Get command by ID |
| GET | `/api/commands/agent/{hwid}` | Get agent commands |

### Screenshots

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/screenshots/agent/{hwid}` | Get agent screenshots |
| GET | `/api/screenshots/{id}/image` | Download screenshot image |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get statistics |
| GET | `/api/dashboard/health` | Health check |

## WebSocket Endpoints

| Endpoint | Purpose | Authentication |
|----------|---------|----------------|
| `/ws-sentinel` | Agent connections | PSK header |
| `/ws-dashboard` | Dashboard connections | JWT |

See `docs/WEBSOCKET_PROTOCOL.md` for detailed protocol documentation.

## Project Structure

```
src/main/java/com/sentinel/
├── config/              # Configuration classes
├── controller/          # REST controllers
├── domain/
│   ├── entity/          # JPA entities
│   ├── enums/           # Enumerations
│   └── repository/      # JPA repositories
├── dto/
│   ├── request/         # Request DTOs
│   └── response/        # Response DTOs
├── security/            # JWT and authentication
├── service/             # Business logic
└── websocket/
    ├── handler/         # WebSocket handlers
    ├── interceptor/     # Auth interceptors
    └── session/         # Session management
```

## Database Schema

### Schema: `public`

- `users` - Operator accounts
- `agents` - Connected agents
- `commands` - Command history

### Schema: `blob_storage`

- `agent_screenshots` - Screenshot binary data

## Security

### Agent Authentication (PSK)

Agents authenticate using a Pre-Shared Key with SHA-256 hashing:

```
X-Agent-Auth: SHA256(PSK + TIMESTAMP)
X-Agent-Timestamp: <unix_millis>
```

### Operator Authentication (JWT)

Operators authenticate using JWT tokens:

```
Authorization: Bearer <token>
```

## Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `sentinel.security.agent-secret` | (required) | PSK for agent auth |
| `sentinel.security.jwt.secret` | (required) | JWT signing key |
| `sentinel.security.jwt.expiration` | 86400000 | JWT expiration (ms) |
| `sentinel.agent.heartbeat-timeout` | 30 | Seconds before OFFLINE |
| `sentinel.agent.dead-timeout-days` | 7 | Days before DEAD |

## Development

### Prerequisites

- Java 21
- Maven 3.8+
- Docker (for PostgreSQL)

### Running Tests

```bash
mvn test
```

### Building

```bash
mvn clean package
```

## License

Educational Use Only - See main project LICENSE.
