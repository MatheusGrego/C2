<div align="center">

# 🎯 SENTINEL C2

**Infraestrutura de Comando e Controle Distribuída**

`Java Spring Boot` • `Golang` • `React` • `PostgreSQL`

[Sobre](#-sobre-o-projeto) • [Funcionalidades](#-funcionalidades) • [Arquitetura](#%EF%B8%8F-arquitetura) • [Pesquisa](#-tópicos-de-pesquisa-evasão--segurança) • [Roadmap](#-roadmap--pesquisa-futura) • [Referências](#-referências-e-leitura-recomendada) • [Operação](#-operação)

[![License: Educational](https://img.shields.io/badge/License-Educational-orange.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-21-red.svg)](https://openjdk.org/)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8.svg)](https://golang.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F.svg)](https://spring.io/projects/spring-boot)

</div>

---

## 📋 Sobre o Projeto

**Sentinel C2** é uma plataforma de **Command & Control (C2)** moderna e multiplataforma, desenvolvida como projeto de pesquisa em segurança cibernética e administração de sistemas distribuídos.

O objetivo é demonstrar a convergência entre **engenharia de software corporativa robusta** (Backend em Java) e **programação de sistemas de baixo nível** (Agente em Go), criando uma ferramenta resiliente para monitoramento e administração remota de ativos.

### ⚠️ Aviso Legal

> **Este software foi desenvolvido estritamente para fins educacionais e de administração autorizada.**  
> O autor não se responsabiliza pelo uso indevido da ferramenta. O uso não autorizado em sistemas de terceiros é ilegal e pode resultar em sanções criminais.

---

## 🚀 Funcionalidades

### Vigilância e Telemetria

| Recurso | Descrição |
|---------|-----------|
| **Monitoramento em Tempo Real** | Coleta contínua de métricas vitais do sistema: uso de CPU, consumo de memória RAM, informações do Sistema Operacional e identificação da janela ativa. Transmissão otimizada via WebSocket com suporte a modos **Session** (baixa latência) e **Beacon** (alta furtividade). |
| **Captura Visual (Screenshots)** | Mecanismo para obtenção de evidências visuais sob demanda. Suporte a múltiplos monitores, compressão JPEG otimizada e processamento de imagem no servidor. Armazenamento eficiente em formato binário (BYTEA). |
| **Inventário de Processos** | Capacidade de listar detalhadamente todos os processos em execução na máquina alvo, fornecendo dados estruturados (PID, nome, usuário, memória) para análise e auditoria. |

### Comando e Controle

| Recurso | Descrição |
|---------|-----------|
| **Shell Remoto Furtivo** | Interface para execução de comandos arbitrários de terminal (CMD/PowerShell). O retorno do output (STDOUT/STDERR) é capturado e exibido no painel, sem janelas visíveis no alvo. Suporte a **Living Off the Land Binaries (LOLBins)** para evasão. |
| **Gestão de Energia** | Comandos administrativos para bloqueio de estação, reinicialização e desligamento remoto do sistema. |
| **Interação com Usuário** | Ferramentas para comunicação direta, incluindo envio de mensagens de sistema (MessageBox) customizadas e execução remota de URLs no navegador padrão. |
| **Gerenciamento de Processos** | Terminação remota de processos específicos por nome (KILL_PROC) para controle granular do sistema. |
| **Alternância de Modos** | Comando `SWITCH_MODE` permite alternar entre modo Session (conexão persistente) e Beacon (check-ins periódicos) para adaptar o perfil de rede às necessidades operacionais. |

---

## 🏗️ Arquitetura

O sistema utiliza uma arquitetura **Hub-and-Spoke** baseada em comunicação assíncrona via **WebSocket (STOMP)**, seguindo os princípios de **Clean Architecture** para desacoplamento e extensibilidade.

### Componentes Principais

| Componente | Tecnologia | Função |
|-----------|------------|--------|
| **Sentinel Core (Cérebro)** | Java 21 + Spring Boot 3.3 | Gerencia sessões, orquestra comandos, persiste dados e implementa lógica de negócio isolada de frameworks. |
| **Sentinel Implant (Agente)** | Go 1.22+ | Binário estático multiplataforma que coleta dados e executa ordens no alvo. Suporta modos Session e Beacon. |
| **Sentinel Vision (Dashboard)** | React + Tailwind CSS | Interface visual para operação em tempo real com atualização via WebSocket. |
| **Infraestrutura** | PostgreSQL + Docker | Armazenamento em dois schemas: `public` (metadados) e `blob_storage` (evidências binárias). |

### Fluxo de Dados

```
┌─────────────┐                  ┌──────────────┐                 ┌─────────────┐
│   Implant   │   WebSocket      │ Sentinel     │   WebSocket     │  Dashboard  │
│   (Agent)   │ ──────────────> │   Core       │ <────────────── │  (Operator) │
│             │  Telemetry/      │  (Backend)   │   Commands/     │             │
│  (Target)   │  Responses       │              │   Updates       │  (Browser)  │
└─────────────┘                  └──────────────┘                 └─────────────┘
      │                                 │
      │                                 │
      └────── Auth (PSK + Hash) ────────┘
```

**Passos do Fluxo:**

1. **Handshake:** O Agente inicia a conexão reversa (Reverse TCP) via WebSocket seguro.
2. **Autenticação:** Validação via Pre-Shared Key (PSK) ofuscada no header HTTP customizado (`X-Agent-Auth`) usando hash SHA-256 com timestamp.
3. **Subscrição:** Agente se inscreve no tópico `/topic/commands/{hwid}` para receber ordens.
4. **Operação:** 
   - Servidor publica comandos em tópicos dedicados
   - Agente responde em canais de dados (`/app/responses`, `/app/telemetry`, `/app/upload`)
   - Dashboard recebe atualizações em tempo real via `/topic/admin/events`

### Schemas do Banco de Dados

**Schema `public` (Metadados e Controle):**
- `users` - Operadores do sistema
- `agents` - Registro de agentes conectados (HWID, hostname, status, modo de comunicação)
- `commands` - Histórico de comandos executados com correlation ID

**Schema `blob_storage` (Evidências Binárias):**
- `agent_screenshots` - Capturas de tela em formato BYTEA (sem overhead de Base64)

---

## 🔬 Tópicos de Pesquisa (Evasão & Segurança)

Este projeto implementa e estuda conceitos avançados de **Red Teaming** para fins acadêmicos:

| Tópico | Descrição Técnica |
|--------|------------------|
| **Compilação Estática & Supressão** | Geração de binários Go únicos sem dependências externas, utilizando diretivas de vinculação (`-ldflags -H=windowsgui -s -w`) para execução em background transparente e remoção de símbolos de debugging. |
| **Ofuscação de Memória (Sleep Obfuscation)** | Implementação de algoritmos XOR para proteção de chaves sensíveis em tempo de execução. Durante períodos de `Sleep()`, regiões críticas da memória são encriptadas para evitar detecção por scanners de memória (EDR/AV). |
| **Polimorfismo de Localização (Melt & Move)** | Mecanismo conceitual de *Melting*, onde o binário altera seu diretório de execução periodicamente (4-12h) com nomes aleatórios de processos legítimos, dificultando a análise forense baseada em caminhos fixos. |
| **Persistência Furtiva** | Manutenção de acesso via diretórios de inicialização do usuário (`%APPDATA%\...\Startup`), evitando chaves de registro globais (`HKLM\Run`) monitoradas por soluções de segurança. |
| **PPID Spoofing** | Manipulação da árvore de processos para que o agente apareça como filho de processos legítimos do sistema (`explorer.exe`, `svchost.exe`) usando APIs Win32. |
| **Living Off the Land (LOLBins)** | Uso de binários nativos do Windows assinados pela Microsoft (`certutil`, `mshta`, `regsvr32`) para executar tarefas, reduzindo alertas de AV/EDR. |
| **Domain Fronting & Protocol Mimicry** | Técnica para mascarar o destino real da comunicação C2, fazendo-a parecer direcionada a domínios legítimos (CDNs, serviços cloud). |
| **Modos de Comunicação Adaptativos** | Implementação de modo **Session** (alta interatividade, conexão persistente) e modo **Beacon** (baixa detectabilidade, check-ins periódicos com jitter) para adaptar o perfil operacional ao ambiente. |

---

## 🛣️ Roadmap & Pesquisa Futura

Funcionalidades planejadas para expansão das capacidades de auditoria e Threat Intelligence:

### Monitoramento Avançado (EDR Evasion & Auditing)

| Feature | Objetivo |
|---------|----------|
| **Windows Event Log Monitoring** | Integração com ETW (Event Tracing for Windows) para captura de eventos de segurança em tempo real, permitindo a detecção de tentativas de acesso não autorizado ou alterações críticas no sistema. |
| **Anti-Forensics & Environment Awareness** | Implementação de rotinas para detecção de ambientes hostis, como Sandboxes, Máquinas Virtuais (VMs) e ferramentas de Reverse Engineering (ex: Wireshark, IDA Pro, x64dbg), permitindo que o agente altere seu comportamento ou encerre a execução para evitar análise. |
| **Syscalls Diretas (Hell's Gate)** | Bypassar hooks de EDR fazendo chamadas diretas ao kernel via `NTDLL.dll`, evitando detecção por soluções que interceptam APIs de alto nível. |

### Threat Intelligence & User Profiling

| Feature | Objetivo |
|---------|----------|
| **Análise de Artefatos de Terceiros** | Extração e correlação de IDs de plataformas como Discord, Steam, GitHub para User Profiling. Isso permite identificar se o host pertence a um perfil de usuário comum, desenvolvedor, gamer ou potencial ameaça. |
| **Threat Level Scoring** | Algoritmo no Backend para calcular um "Nível de Ameaça" do host baseado nos artefatos encontrados (softwares instalados, histórico de navegação, conexões ativas), auxiliando na priorização de incidentes. |
| **Behavioral Analysis** | Análise de padrões de uso (horários ativos, aplicativos mais usados) para criar perfil comportamental do alvo. |

### Extração e Auditoria de Dados

| Feature | Objetivo |
|---------|----------|
| **Browser Data Forensics** | Módulo para auditoria de dados de navegação (histórico, cookies, senhas salvas, extensões maliciosas) visando identificar vetores de infecção ou vazamento de dados. Suporte para Chrome, Firefox, Edge. |
| **Network Reconnaissance** | Mapeamento passivo da rede local (ARP Scan, Port Scan furtivo) para identificar outros dispositivos conectados e vulnerabilidades potenciais no ambiente do host. |
| **File Transfer (Upload/Download)** | Sistema bidirecional de transferência de arquivos entre C2 e agente, com suporte a compressão e chunking para arquivos grandes. |
| **Keylogger & Clipboard Monitor** | Captura de teclas digitadas e conteúdo do clipboard para análise forense (com controles de tempo e filtros). |
| **Process Injection** | Técnicas avançadas como Process Hollowing, Thread Hijacking e APC Injection para execução de payloads em processos legítimos. |

### Comunicação e Infraestrutura

| Feature | Objetivo |
|---------|----------|
| **Comunicação via Cloud Services** | Usar AWS Lambda, Azure Functions, Google Cloud Storage como C2 endpoint (técnica HazyBeacon) para dificultar detecção e blocklist. |
| **Domain Generation Algorithm (DGA)** | Gerar domínios C2 dinamicamente usando algoritmo compartilhado com o servidor, dificultando blocklist estática. |
| **Steganografia** | Esconder comandos C2 em imagens, documentos ou tráfego ICMP para evasão de DPI (Deep Packet Inspection). |
| **Multi-Protocol Support** | Suporte a DNS tunneling, HTTPS e protocolo customizado sobre TCP para ambientes restritivos. |

---

## 📚 Referências e Leitura Recomendada

As técnicas e conceitos implementados neste projeto baseiam-se em práticas documentadas de segurança ofensiva e defensiva.

### Frameworks & Conceitos

#### MITRE ATT&CK Framework
Base de conhecimento global sobre táticas e técnicas adversárias:
- **T1059** - Command and Scripting Interpreter
- **T1547** - Boot or Logon Autostart Execution
- **T1027** - Obfuscated Files or Information
- **T1497** - Virtualization/Sandbox Evasion
- **T1070.006** - Indicator Removal on Host: Timestomp
- **T1134.004** - Access Token Manipulation: Parent PID Spoofing

#### LOLBAS Project
Documentação de binários nativos do Windows utilizados para execução de código e persistência:
- [lolbas-project.github.io](https://lolbas-project.github.io/)

### Literatura Técnica (Red Teaming)

- **"Black Hat Go"** (Tom Steele, Chris Patten, Dan Kottmann) - Referência para desenvolvimento de ferramentas de segurança em Go.
- **"The Art of Memory Forensics"** (Michael Hale Ligh et al.) - Fundamentos para entender como técnicas de evasão são detectadas em memória.
- **"Red Team Development and Operations"** (Joe Vest, James Tubberville) - Guia prático de operações de Red Team.
- **Red Team Notes** - Repositório de técnicas de Process Injection, Evasion e Persistência.

### APIs e Documentação

- **Microsoft Win32 API** - Documentação oficial para manipulação de processos e sistema de arquivos (`CreateProcess`, `UpdateProcThreadAttribute`, `InitializeProcThreadAttributeList`).
- **Golang Syscall Package** - Interface para chamadas de baixo nível ao kernel do Windows (`golang.org/x/sys/windows`).
- **PostgreSQL Documentation** - Guias de otimização de schemas e BYTEA handling.

### Frameworks C2 de Referência

- **Sliver** - Framework C2 moderno em Go com suporte a múltiplos protocolos
- **Havoc** - Framework C2 com técnicas avançadas de sleep obfuscation
- **Cobalt Strike** - Framework comercial referência em Red Team operations

---

## 🔧 Operação

### Requisitos

**Para o Backend (Sentinel Core):**
- Java 21 (LTS)
- Docker & Docker Compose
- Maven 3.8+

**Para o Agente (Sentinel Implant):**
- Go 1.22+
- Compilador C (MinGW para cross-compilation Windows)

**Para o Dashboard (Sentinel Vision):**
- Node.js 18+
- npm ou yarn

### 1. Configuração do Backend

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/sentinel-c2.git
cd sentinel-c2

# Inicie o PostgreSQL via Docker
cd backend
docker-compose up -d

# Configure o application.properties
# Defina a chave PSK em: sentinel.security.agent-secret=YOUR_SECRET_KEY

# Compile e execute o backend
mvn clean package
java -jar target/sentinel-core-1.0.6.jar
```

O backend estará disponível em `http://localhost:8080`

### 2. Compilação do Agente (Cross-Compilation)

O agente deve ser compilado na máquina do operador antes de ser implantado. O Go permite compilar para Windows mesmo estando no Linux ou macOS.

```bash
# Na máquina do Operador (Linux/Mac/Windows)
cd agent

# Configurar variáveis de build (editar config.go)
# - C2_SERVER: Endereço do servidor (ws://ip-server:8080/ws-sentinel)
# - PSK_SECRET: Mesma chave configurada no backend

# Compilar para Windows 64-bit
# As flags removem janelas de console e informações de debug
GOOS=windows GOARCH=amd64 go build \
  -ldflags "-H=windowsgui -s -w" \
  -o sentinel.exe main.go

# Resultado: sentinel.exe (~8-12 MB, sem dependências)
```

**Flags de Compilação Explicadas:**
- `-H=windowsgui` - Suprime janela de console (execução em background)
- `-s` - Remove tabela de símbolos (anti-reversing)
- `-w` - Remove informações DWARF de debugging
- `GOOS=windows GOARCH=amd64` - Target Windows 64-bit

### 3. Execução no Alvo

O binário `sentinel.exe` gerado é estático e não possui dependências externas.

**Passos:**
1. Transfira o arquivo para a máquina alvo (USB, email, download, etc)
2. Execute manualmente:
   - Duplo clique no arquivo
   - Ou via terminal: `.\sentinel.exe`
3. O agente iniciará o processo de handshake com o servidor configurado
4. Após autenticação bem-sucedida, aparecerá como **ONLINE** no painel
5. O agente estabelecerá persistência automaticamente na pasta Startup

**Verificação:**
```bash
# No backend, verificar logs
tail -f logs/sentinel-core.log

# Ou consultar via API
curl http://localhost:8080/api/agents
```

### 4. Interface do Operador (Dashboard)

```bash
cd dashboard

# Instalar dependências
npm install

# Configurar endpoint do backend (.env)
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws-dashboard

# Executar em modo desenvolvimento
npm run dev

# Ou build para produção
npm run build
```

Acesse o dashboard em `http://localhost:5173`

---

## 🛡️ Considerações de Segurança

### Defesas Implementadas

- **Autenticação PSK** com hash SHA-256 e timestamp para prevenir replay attacks
- **Ofuscação de strings** sensíveis em memória usando XOR
- **Detecção anti-VM** antes de inicialização
- **Sleep obfuscation** para evasão de memory scanning
- **Compilação sem símbolos** para dificultar engenharia reversa

### Mitigações Recomendadas (Perspectiva Blue Team)

Para detectar e mitigar ferramentas como Sentinel C2:

1. **Network Monitoring:** Monitorar tráfego WebSocket incomum para IPs externos
2. **EDR/XDR:** Soluções modernas detectam PPID Spoofing e process injection
3. **Application Whitelisting:** Bloquear execução de binários não assinados
4. **Behavioral Analysis:** Detectar padrões de beacon (periodicidade na rede)
5. **Memory Scanning:** Ferramentas como PE-Sieve podem detectar código injetado
6. **Sysmon:** Habilitar logging detalhado de criação de processos e conexões de rede

---

## 👤 Autor

**Matheus Grego**  
Assessor de Tecnologia
---

## 📄 Licença

Este projeto é distribuído sob a licença **Educational Use Only – Proprietary Commercial Rights**.

### ❌ Proibido para terceiros:
- Uso em sistemas sem autorização explícita do proprietário
- Distribuição comercial ou inclusão em produtos/serviços pagos
- Uso para atividades ilegais

### ✔️ Permitido para terceiros:
- Pesquisa acadêmica
- Treinamento e estudos
- Testes em ambientes controlados (laboratórios próprios)

### ✔️ Direitos do autor:
- O autor mantém direito exclusivo de comercialização
- O autor pode vender, licenciar ou distribuir comercialmente conforme desejar

---

2025
