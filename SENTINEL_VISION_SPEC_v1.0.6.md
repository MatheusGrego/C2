# ESPECIFICAÇÃO TÉCNICA: SENTINEL VISION - DASHBOARD (REACT)

**Versão:** 1.0.6  
**Status:** Aprovado  
**Data:** 25 de Outubro de 2025  
**Stack:** React 18 + TailwindCSS + WebSocket (STOMP)

---

## 1. Introdução e Conceito Visual

O **Sentinel Vision** é a interface de operação do sistema C2. Diferente de painéis administrativos tradicionais (Bootstrap/Material UI), o Vision adota uma **estética agressiva inspirada em Game Cheats** (Fatality, Neverlose) e interfaces Sci-Fi (Cyberpunk 2077).

### 1.1 Diretrizes de Design (Visual Identity)

**Tema:** Deep Void (Fundo escuro profundo com acentos neon)

**Paleta de Cores:**

| Elemento | Código Hex | Uso |
|----------|------------|-----|
| **Background Principal** | `#0e0e15` | Fundo da aplicação |
| **Surface/Cards** | `#1c1437` / `#1f1942` | Containers, painéis |
| **Borders** | `#463f6a` | Bordas de elementos |
| **Primary Accent** | `#eb055a` (Rosa Neon) | Botões primários, hover states |
| **Secondary Accent** | `#4632f0` (Roxo Digital) | Gradientes, efeitos de glow |
| **Text Primary** | `#ffffff` | Títulos, labels principais |
| **Text Secondary** | `#68648c` / `#7a7a8e` | Metadados, descrições |
| **Success** | `#00ff88` | Status ONLINE, ações bem-sucedidas |
| **Error** | `#ff4444` | Status OFFLINE, erros |
| **Warning** | `#ffaa00` | Alertas, ações destrutivas |

**Tipografia:**

- **Dados/Código:** JetBrains Mono ou Roboto Mono (fonte monoespaçada)
- **Títulos/Labels:** Rajdhani, Inter ou Josefin Sans (geométrica sem serifa)
- **Tamanhos:** Fontes pequenas (10-12px) para maximizar densidade de informação

**Componentes UI:**

- Bordas finas (1px solid)
- Glow sutil ao hover (`box-shadow: 0 0 10px rgba(235, 5, 90, 0.5)`)
- Transições rápidas (150-200ms) - sem animações lentas
- Background semi-transparente com blur (glassmorphism sutil)
- Efeito de glitch no logo/título principal

**Efeitos Visuais Característicos (Inspirados no Fatality):**

```css
/* Gradient Line */
.gradient-line {
  background: linear-gradient(90deg, #4632f0, #eb055a);
  height: 2px;
  animation: pulse 5s infinite;
}

/* Glitch Effect no Logo */
@keyframes glitch {
  0%, 100% { text-shadow: none; }
  25% { text-shadow: -1.5px -1.5px 0 #eb055a, 1.5px 1.5px 0 #4632f0; }
  50% { text-shadow: 1.5px -1.5px 0 #eb055a, -1.5px 1.5px 0 #4632f0; }
  75% { text-shadow: -1.5px 1.5px 0 #eb055a, 1.5px -1.5px 0 #4632f0; }
}

/* Checkbox/Toggle Customizado */
.control-indicator {
  width: 9px;
  height: 9px;
  background: #19153f;
  border: 1px solid #463f6a;
  transition: 200ms;
}

.control input:checked ~ .control-indicator {
  background: #eb055a;
  border: 1px solid #eb055a;
}

/* Hover States */
.interactive-element:hover {
  border-color: #eb055a;
  box-shadow: 0 0 10px rgba(235, 5, 90, 0.5);
}
```

---

## 2. Arquitetura do Frontend

O projeto será um **SPA (Single Page Application)** React, estruturado para alta performance em atualizações de tempo real via WebSocket.

### 2.1 Stack Tecnológico

| Categoria | Tecnologia | Justificativa |
|-----------|------------|---------------|
| **Core Framework** | React 18 (Vite) | Build rápido, Hot Module Replacement, melhor DX que CRA |
| **Estilização** | TailwindCSS + CSS Modules | Utilitários rápidos + estilos complexos isolados (glow effects) |
| **Estado Global** | Zustand | Mais leve que Redux (~1KB), API simples, ideal para lista de agentes |
| **Comunicação Real-Time** | `@stomp/stompjs` + `sockjs-client` | Protocolo STOMP sobre WebSocket compatível com Spring Boot |
| **Ícones** | Lucide React | Ícones modernos, tree-shakeable, estilo consistente |
| **Gráficos** | Recharts | Biblioteca React-native, boa performance para gráficos de telemetria |
| **Notificações** | Sonner | Toasts modernos e customizáveis |
| **Virtualização** | react-window | Renderização eficiente de listas longas (>100 agentes) |
| **Lightbox (Imagens)** | yet-another-react-lightbox | Visualizador de screenshots otimizado |
| **Routing** | React Router v6 | Navegação entre Dashboard e AgentDetails |

### 2.2 Estrutura de Pastas

```
/sentinel-vision
├── /public
│   ├── fonts/              # JetBrains Mono, Rajdhani
│   └── sounds/             # notification.mp3 (agente conectou)
├── /src
│   ├── /assets
│   │   └── /images         # Logo, ícones customizados
│   ├── /components
│   │   ├── /ui             # Botões, Inputs, Cards, Checkboxes
│   │   ├── AgentCard.jsx
│   │   ├── TerminalView.jsx
│   │   ├── ProcessTable.jsx
│   │   ├── ScreenshotGallery.jsx
│   │   └── CommandModal.jsx
│   ├── /hooks
│   │   ├── useSentinelSocket.js    # WebSocket connection manager
│   │   ├── useAgentStore.js        # Zustand store para agentes
│   │   └── useCommandQueue.js      # Fila de comandos pendentes
│   ├── /layouts
│   │   ├── MainLayout.jsx          # Layout com Header fixa
│   │   └── CommandCenterLayout.jsx # Layout para detalhes do agente
│   ├── /pages
│   │   ├── Dashboard.jsx           # Lobby (Grid de agentes)
│   │   ├── AgentDetails.jsx        # Command Center (Abas)
│   │   ├── Settings.jsx            # Configurações do operador
│   │   └── Login.jsx               # Autenticação JWT
│   ├── /services
│   │   ├── api.js                  # Axios instance para REST API
│   │   ├── websocket.js            # STOMP client setup
│   │   └── commands.js             # Helpers para envio de comandos
│   ├── /store
│   │   ├── agentStore.js           # Zustand: Estado dos agentes
│   │   ├── commandStore.js         # Histórico de comandos
│   │   └── uiStore.js              # Estado da UI (modais, temas)
│   ├── /utils
│   │   ├── formatters.js           # Formatação de dados (bytes, %, timestamps)
│   │   └── validators.js           # Validação de inputs
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                   # Tailwind base + custom CSS
├── tailwind.config.js
├── vite.config.js
└── package.json
```

### 2.3 Configuração do Tailwind

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'void': {
          900: '#0e0e15',
          800: '#1c1437',
          700: '#1f1942',
          600: '#19153f',
        },
        'neon': {
          pink: '#eb055a',
          purple: '#4632f0',
          green: '#00ff88',
          red: '#ff4444',
          orange: '#ffaa00',
        },
        'sentinel': {
          border: '#463f6a',
          text: '#68648c',
          muted: '#7a7a8e',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Roboto Mono', 'monospace'],
        'display': ['Rajdhani', 'Inter', 'sans-serif'],
      },
      animation: {
        'glitch': 'glitch 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient-x': 'gradient-x 5s ease infinite',
      },
      boxShadow: {
        'neon-pink': '0 0 10px rgba(235, 5, 90, 0.5)',
        'neon-purple': '0 0 10px rgba(70, 50, 240, 0.5)',
        'neon-green': '0 0 10px rgba(0, 255, 136, 0.5)',
      }
    },
  },
  plugins: [],
}
```

---

## 3. Funcionalidades e Telas

### 3.1 Dashboard (A "Lobby")

A tela inicial fornece uma **visão tática de toda a botnet**.

**Layout Conceitual:**

```
┌─────────────────────────────────────────────────────────────┐
│  [SENTINEL VISION]            [STATS] [SETTINGS] [PROFILE]  │
├─────────────────────────────────────────────────────────────┤
│  KPIs:                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 15 ONLINE│ │ 3 OFFLINE│ │ 2 ALERTS │ │ SESSION  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│  Agent Grid:                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ ●ONLINE  │ │ ●ONLINE  │ │ ○OFFLINE │ │ ●ONLINE  │       │
│  │ WIN-PC01 │ │ WIN-PC02 │ │ WIN-PC03 │ │ WIN-PC04 │       │
│  │ 12% CPU  │ │ 45% CPU  │ │ --       │ │ 8% CPU   │       │
│  │ 2.1GB RAM│ │ 4.5GB RAM│ │ --       │ │ 1.8GB RAM│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**

#### **Header Bar:**
- Logo "SENTINEL VISION" com efeito glitch (animação CSS)
- Linha gradiente horizontal (`#4632f0` → `#eb055a`) com pulse animation
- Ícones de configurações, perfil do operador (canto superior direito)
- Indicador de conexão WebSocket (verde = conectado, vermelho = desconectado)

#### **KPIs no Topo:**
- 4 Cards com estatísticas em tempo real:
  - **Total ONLINE:** Agentes ativos (verde `#00ff88`)
  - **Total OFFLINE:** Agentes inativos (cinza `#68648c`)
  - **Active Alerts:** Avisos críticos (vermelho `#ff4444`)
  - **Communication Mode:** Badge mostrando `SESSION` ou `BEACON`
- Atualização automática via WebSocket (`/topic/admin/events`)
- Animação de contador ao mudar valores

#### **Grid de Agentes:**
- CSS Grid responsivo:
  - Desktop: 4 colunas
  - Tablet: 2 colunas
  - Mobile: 1 coluna
- Cada Card contém:
  - **Status Indicator:** Bolinha colorida no canto superior esquerdo
    - Verde (`#00ff88`): ONLINE
    - Cinza (`#68648c`): OFFLINE
    - Vermelho (`#ff4444`): DEAD
  - **Ícone do SO:** Logo Windows 10/11 (SVG)
  - **Hostname:** Fonte Rajdhani, 14px, bold, branca
  - **IP Local:** Fonte JetBrains Mono, 10px, cinza (`#7a7a8e`)
  - **Mini Progress Bars:** 
    - CPU: Barra horizontal 4px, fundo `#19153f`, fill `#eb055a`
    - RAM: Mesma estética
  - **Last Seen:** Timestamp relativo ("2 minutos atrás") em 10px cinza
  - **Communication Mode Badge:** `S` (Session) ou `B` (Beacon)
  - **Thumbnail (Opcional):** Screenshot mais recente desfocada como fundo do card
- **Hover State:**
  - Borda muda de `#463f6a` para `#eb055a`
  - Box-shadow neon: `0 0 15px rgba(235, 5, 90, 0.6)`
  - Transição 150ms
- **Click:** Navega para `/agent/{hwid}`

#### **Funcionalidades Interativas:**

**Barra de Ferramentas:**
- **Filtros:** Dropdown customizado (estilo Fatality) para filtrar por:
  - ALL, ONLINE, OFFLINE, DEAD
  - Communication Mode (SESSION, BEACON)
- **Busca:** Input com ícone de lupa, busca por hostname ou IP
  - Placeholder: "Search agents..."
  - Estilo: Background `#1f1942`, border `#463f6a`, texto branco
- **Sort:** Botões para ordenar por:
  - CPU Usage (crescente/decrescente)
  - RAM Usage
  - Last Seen (mais recente primeiro)
  - Hostname (alfabético)
- **Bulk Actions:** 
  - Checkbox para selecionar múltiplos agentes
  - Botão "Send Command to Selected" abre modal
  - Comandos disponíveis: SHUTDOWN, MESSAGE, SWITCH_MODE

---

### 3.2 Command Center (Detalhes do Agente)

Ao clicar em um card, abre-se o **painel de controle dedicado** daquele agente. O layout usa **abas superiores estilo Fatality**.

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ ← BACK | [●] WIN-DESKTOP-01 | 192.168.0.105 | ONLINE       │
├─────────────────────────────────────────────────────────────┤
│ [OVERVIEW] [TERMINAL] [SURVEILLANCE] [PROCESSES] [ACTIONS]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Conteúdo da aba ativa]                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Sistema de Abas (Tab Navigation):**

Inspirado no design do Fatality:
- Abas horizontais no topo
- Aba ativa tem underline animado (`#eb055a`, 2px)
- Hover adiciona efeito glitch sutil no texto
- Transição suave (200ms) ao trocar de aba
- Conteúdo da aba usa fade-in animation

#### **Aba 1: OVERVIEW (Visão Geral)**

**System Information Card:**

```
┌─────────────────────────────────────┐
│ SYSTEM INFORMATION                  │
├─────────────────────────────────────┤
│ OS: Windows 11 Pro 23H2             │
│ HWID: AA-BB-CC-DD-EE-FF             │
│ Hostname: WIN-DESKTOP-01            │
│ IP: 192.168.0.105                   │
│ Uptime: 3d 12h 45m                  │
│ Mode: SESSION                       │
└─────────────────────────────────────┘
```

**Real-Time Telemetry Graphs (Recharts):**

- **CPU Usage Chart:**
  - Tipo: Line Chart
  - Dados: Histórico dos últimos 60 segundos (60 pontos)
  - Cor da linha: `#eb055a`
  - Área sob a linha: Gradiente vertical de `rgba(235,5,90,0.3)` para transparente
  - Grid: `#463f6a`, pontilhado
  - Atualização: A cada 5s via WebSocket (`/topic/admin/telemetry`)
  - Y-axis: 0% a 100%

- **RAM Usage Chart:**
  - Tipo: Area Chart
  - Mostra memória usada vs disponível
  - Cor: `#4632f0` para usado, `#68648c` para livre
  - Tooltip ao hover mostra valores exatos

- **Active Window Monitor:**
  - Card separado mostrando em tempo real:
    - Título da janela em foco
    - Nome do processo (ex: `chrome.exe`)
    - Ícone do aplicativo (se disponível)
  - Útil para saber se o usuário está ativo/ocioso

**Communication Mode Control:**

- Toggle switch estilo Fatality para alternar entre SESSION e BEACON
- Ao clicar em BEACON, abre modal para configurar intervalo:
  - Slider de 30s a 1 hora
  - Valores sugeridos: 30s, 1m, 5m, 15m, 30m, 1h
- Botão "Apply" envia comando `SWITCH_MODE` via WebSocket

#### **Aba 2: TERMINAL (Shell Remoto)**

Interface de linha de comando estilo hacker/Matrix.

**Design Visual:**

```css
.terminal-container {
  background: #000000;
  border: 1px solid #463f6a;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #00ff88;
  padding: 16px;
  height: 600px;
  overflow-y: auto;
}

.terminal-prompt {
  color: #eb055a;
}

.terminal-command {
  color: #7a7a8e;
}

.terminal-output-success {
  color: #00ff88;
}

.terminal-output-error {
  color: #ff4444;
}
```

**Estrutura:**

```
┌──────────────────────────────────────────┐
│ TERMINAL (Shell Execution)               │
├──────────────────────────────────────────┤
│ [12:45:30] C:\> ipconfig /all            │
│ Windows IP Configuration                 │
│    Host Name: WIN-DESKTOP-01             │
│    Primary Dns Suffix: domain.local      │
│    ...                                   │
│                                          │
│ [12:46:15] C:\> systeminfo               │
│ [EXECUTING...]                           │
├──────────────────────────────────────────┤
│ C:\> _                                   │
└──────────────────────────────────────────┘
```

**Funcionalidades:**

1. **Input Field Fixo:**
   - Sempre visível na parte inferior
   - Prompt: `C:\> ` ou `PS> ` dependendo do shell
   - Cursor piscando simulado com animation CSS

2. **Command History:**
   - Setas ↑↓ navegam em comandos anteriores
   - Armazenado em localStorage
   - Máximo 100 comandos

3. **Auto-scroll:**
   - Sempre mostra o output mais recente
   - Smooth scroll animation

4. **Output Formatting:**
   - Timestamp em cada linha: `[HH:MM:SS]`
   - Comandos enviados em cinza claro
   - Respostas bem-sucedidas em verde
   - Erros em vermelho
   - Estados: `[EXECUTING...]`, `[SUCCESS]`, `[ERROR]`

5. **Shell Type Selector:**
   - Toggle no topo: `CMD` | `PowerShell`
   - Muda o formato do payload automaticamente:
     - CMD: `["cmd", "/c", "comando"]`
     - PowerShell: `["powershell", "-c", "comando"]`

**Fluxo de Execução:**

```javascript
// 1. Usuário digita comando e pressiona Enter
const command = "ipconfig /all";

// 2. Frontend envia via WebSocket
socket.send({
  destination: '/app/command',
  body: JSON.stringify({
    type: "SHELL",
    targetHwid: "AA-BB-CC-DD-EE-FF",
    payload: shellType === 'CMD' 
      ? ["cmd", "/c", command]
      : ["powershell", "-c", command]
  })
});

// 3. Adiciona linha no terminal mostrando "EXECUTING..."
appendToTerminal(`[${timestamp}] C:\\> ${command}`);
appendToTerminal(`[EXECUTING...]`);

// 4. Aguarda resposta assíncrona via /app/responses
// 5. Quando receber, renderiza output
socket.subscribe('/app/responses', (response) => {
  const data = JSON.parse(response.body);
  if (data.status === "SUCCESS") {
    appendToTerminal(data.output, 'success');
  } else {
    appendToTerminal(data.output, 'error');
  }
});
```

**Atalhos de Teclado:**

- `Ctrl+L`: Limpa o terminal
- `Ctrl+C`: Cancela comando em execução (envia sinal ao backend)
- `Tab`: Autocomplete de comandos comuns (implementar localmente):
  - Windows: `cd`, `dir`, `ipconfig`, `tasklist`, `netstat`, `systeminfo`
  - PowerShell: `Get-Process`, `Get-Service`, `Get-NetAdapter`

**Features Avançadas (v2.0):**

- Syntax highlighting para PowerShell
- Suporte a comandos multi-linha
- Upload/Download de arquivos via terminal (comandos especiais)

#### **Aba 3: SURVEILLANCE (Espionagem)**

Módulo para captura e visualização de evidências visuais.

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ SURVEILLANCE                                    │
│ [📷 TAKE SCREENSHOT]  [🔄 REFRESH]  [🗑️ CLEAR] │
├─────────────────────────────────────────────────┤
│  Screenshot Gallery (Grid 3x3):                 │
│  ┌───────┐ ┌───────┐ ┌───────┐                 │
│  │ img1  │ │ img2  │ │ img3  │                 │
│  │ 12:45 │ │ 12:40 │ │ 12:35 │                 │
│  │1920x..│ │1920x..│ │1920x..│                 │
│  └───────┘ └───────┘ └───────┘                 │
└─────────────────────────────────────────────────┘
```

**Componentes:**

1. **Action Buttons:**

   **Take Screenshot:**
   - Botão grande estilo Fatality (background `#1f1942`, border `#eb055a`)
   - Ícone de câmera (Lucide: `Camera`)
   - Ao clicar:
     - Envia comando `SCREENSHOT` via WebSocket
     - Mostra loading spinner no botão
     - Toast notification: "Screenshot requested..."
     - Aguarda upload da imagem (2-5s dependendo resolução)
     - Toast success: "Screenshot received!"
     - Adiciona nova imagem no topo da galeria

   **Refresh:**
   - Recarrega lista de screenshots do servidor via REST API
   - Útil se houver múltiplos operadores

   **Clear All:**
   - Modal de confirmação: "Delete all screenshots?"
   - Botão destrutivo (cor vermelha)
   - Envia requisição DELETE para API REST

2. **Screenshot Gallery:**

   - CSS Grid: 3 colunas em desktop, 2 em tablet, 1 em mobile
   - Cada thumbnail (200x150px) contém:
     - Imagem (object-fit: cover)
     - Overlay escuro ao hover
     - Metadados sobrepostos:
       - Timestamp: `12:45:30`
       - Resolução: `1920x1080`
       - Tamanho: `1.2 MB`
     - Botões de ação ao hover:
       - 🔍 View (abre Lightbox)
       - ⬇️ Download
       - 🗑️ Delete

   - **Hover Animation:**
     - Thumbnail sobe 5px (transform: translateY(-5px))
     - Box-shadow neon rosa
     - Transição 200ms

   - **Lazy Loading:**
     - Usar Intersection Observer
     - Carregar apenas thumbnails visíveis
     - Placeholders blur-hash para melhor UX

3. **Lightbox (Visualizador Fullscreen):**

   Usar biblioteca `yet-another-react-lightbox`:

   - Fundo escuro com blur (`backdrop-filter: blur(10px)`)
   - Imagem centralizada, zoom fit-to-screen
   - Controles:
     - Setas ← → para navegar entre screenshots
     - Zoom com scroll do mouse ou botões +/-
     - Download (ícone ⬇️)
     - Delete (ícone 🗑️)
     - Close (X no canto superior direito)
   - Atalhos:
     - `Esc`: Fechar
     - `←` / `→`: Navegar
     - `Delete`: Remover imagem atual

4. **Storage Management:**

   Card no rodapé da página:
   ```
   ┌──────────────────────────────────────┐
   │ STORAGE: 45.2 MB / 1 GB (4.5%)       │
   │ [████░░░░░░░░░░░░░░] 18 screenshots  │
   │ [⚙️ Manage Storage]                  │
   └──────────────────────────────────────┘
   ```

   - Progress bar mostrando uso de storage
   - Botão "Manage Storage" abre modal:
     - Opção: Delete screenshots older than [30] days
     - Opção: Compress existing screenshots (reduce quality to 60%)
     - Opção: Set max storage limit

#### **Aba 4: PROCESSES (Gerenciador de Processos)**

Tabela interativa de processos em execução no alvo.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ PROCESS MANAGER                                          │
│ [🔄 REFRESH] [🔍 Search...]  [🎯 Kill Selected]          │
├──────────────────────────────────────────────────────────┤
│ ☐ PID   │ NAME            │ USER    │ MEMORY   │ [ACT]   │
├──────────────────────────────────────────────────────────┤
│ ☐ 1234  │ chrome.exe      │ Matheus │ 250 MB   │ [💀]   │
│ ☐ 5678  │ svchost.exe     │ SYSTEM  │ 12 MB    │ [💀]   │
│ ☐ 9012  │ explorer.exe    │ Matheus │ 45 MB    │ [💀]   │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

**Funcionalidades:**

1. **Refresh Button:**
   - Envia comando `PROCESS_LIST` ao agente
   - Mostra loading spinner
   - Aguarda resposta com JSON estruturado (PID, name, user, mem_kb)
   - Atualiza tabela

2. **Search Bar:**
   - Input com ícone de lupa
   - Filtragem client-side em tempo real
   - Busca por: nome do processo, PID, usuário
   - Highlight de resultados

3. **Tabela de Processos:**

   - **Colunas:**
     - Checkbox (para seleção múltipla)
     - PID (número, sortable)
     - Name (string, sortable alfabeticamente)
     - User (string)
     - Memory (formatado: KB, MB, GB, sortable)
     - Actions (botão Kill)

   - **Estilos:**
     - Header: Background `#1f1942`, texto branco bold
     - Linhas alternadas: `#1c1437` e `#19153f` (zebra striping)
     - Hover: Background `#463f6a`, borda lateral rosa
     - Font: JetBrains Mono, 11px

   - **Virtualização:**
     - Usar `react-window` se houver >100 processos
     - Renderizar apenas linhas visíveis para performance

4. **Actions Column:**

   - Botão "Kill" (ícone 💀 ou `X`) ao lado de cada processo
   - Cor vermelha (`#ff4444`)
   - Hover: glow vermelho
   - Click:
     - Modal de confirmação: "Kill process chrome.exe (PID 1234)?"
     - Botão "Confirm" envia comando `KILL_PROC` via WebSocket
     - Toast notification ao receber resposta

5. **Bulk Actions:**

   - Checkbox no header para selecionar todos
   - Botão "Kill Selected" (visível apenas se houver seleção)
   - Envia múltiplos comandos `KILL_PROC` em sequência
   - Progress indicator mostrando quantos foram terminados

6. **Filters & Sorting:**

   - Dropdown para filtrar por usuário (ALL, SYSTEM, Matheus, etc)
   - Botões de sort nas colunas (clicar no header alterna ASC/DESC)
   - Indicador visual de coluna ativa (seta ↑ ou ↓)

7. **Process Details (Expandable Row):**

   - Click no nome do processo expande linha com detalhes:
     - Path completo do executável
     - Command line arguments
     - Parent PID (PPID)
     - CPU usage individual (se disponível)
     - Threads count
   - Botões adicionais: "Open File Location" (envia shell command)

#### **Aba 5: ACTIONS (Comandos Rápidos)**

Painel de ações pré-configuradas para operações comuns.

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ QUICK ACTIONS                                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 🔒 LOCK     │  │ 🔄 RESTART  │  │ ⏻ SHUTDOWN │         │
│  │ Workstation │  │ Computer    │  │ Computer    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 💬 MESSAGE  │  │ 🌐 OPEN URL │  │ 🔀 SWITCH   │         │
│  │ Send Alert  │  │ Browser     │  │ MODE        │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│ COMMAND HISTORY                                             │
│ ─────────────────────────────────────────────────────────── │
│ [14:32:05] SHELL: ipconfig /all                    SUCCESS  │
│ [14:30:12] SCREENSHOT                              SUCCESS  │
│ [14:28:45] PROCESS_LIST                            SUCCESS  │
│ [14:25:00] MESSAGE: "Test Alert"                   SUCCESS  │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**

1. **Action Buttons Grid:**

   Cada botão é um card clicável:

   | Ação | Ícone | Comando | Modal Input |
   |------|-------|---------|-------------|
   | Lock Workstation | 🔒 | `SHELL` + `rundll32.exe user32.dll,LockWorkStation` | Confirmação simples |
   | Restart Computer | 🔄 | `SHUTDOWN` + restart flag | Confirmação com timer (5s countdown) |
   | Shutdown Computer | ⏻ | `SHUTDOWN` | Confirmação com timer (5s countdown) |
   | Send Message | 💬 | `MESSAGE` | Input para Título e Mensagem |
   | Open URL | 🌐 | `OPEN_URL` | Input para URL (validação de formato) |
   | Switch Mode | 🔀 | `SWITCH_MODE` | Toggle Session/Beacon + intervalo |

   **Estilos dos Botões:**
   - Background: `#1f1942`
   - Border: `1px solid #463f6a`
   - Ícone centralizado, grande (24px)
   - Label abaixo do ícone
   - Hover: Border `#eb055a`, glow rosa
   - Ações destrutivas (Restart/Shutdown): Border vermelha ao hover

2. **Modal de Confirmação (Para ações destrutivas):**

   ```
   ┌────────────────────────────────────┐
   │ ⚠️ CONFIRM SHUTDOWN                │
   ├────────────────────────────────────┤
   │ This will shut down the target     │
   │ machine. This action cannot be     │
   │ undone remotely.                   │
   │                                    │
   │ Executing in: [5] seconds          │
   │                                    │
   │ [CANCEL]              [CONFIRM]    │
   └────────────────────────────────────┘
   ```

   - Countdown de 5 segundos antes de habilitar o botão Confirm
   - Fundo vermelho escuro para ações destrutivas
   - Botão Cancel sempre disponível

3. **Modal de Input (Para MESSAGE e OPEN_URL):**

   **Message Modal:**
   ```
   ┌────────────────────────────────────┐
   │ 💬 SEND MESSAGE                    │
   ├────────────────────────────────────┤
   │ Title:                             │
   │ [________________________]         │
   │                                    │
   │ Message:                           │
   │ [________________________]         │
   │ [________________________]         │
   │ [________________________]         │
   │                                    │
   │ Icon: [ℹ️ Info ▼]                  │
   │                                    │
   │ [CANCEL]              [SEND]       │
   └────────────────────────────────────┘
   ```

   - Dropdown para tipo de ícone: Info, Warning, Error
   - Textarea para mensagem (multiline)
   - Preview do MessageBox (opcional)

   **URL Modal:**
   ```
   ┌────────────────────────────────────┐
   │ 🌐 OPEN URL                        │
   ├────────────────────────────────────┤
   │ URL:                               │
   │ [https://__________________]       │
   │                                    │
   │ ⚠️ URL will open in default       │
   │    browser on target machine       │
   │                                    │
   │ [CANCEL]              [OPEN]       │
   └────────────────────────────────────┘
   ```

   - Validação de URL (deve começar com http:// ou https://)
   - Warning sobre privacidade

4. **Command History (Log de Ações):**

   - Lista scrollable dos últimos 50 comandos enviados
   - Cada entrada mostra:
     - Timestamp `[HH:MM:SS]`
     - Tipo do comando
     - Payload resumido (se houver)
     - Status: `SUCCESS` (verde), `ERROR` (vermelho), `PENDING` (amarelo)
   - Click em uma entrada expande detalhes (payload completo, response)
   - Filtro por tipo de comando
   - Botão "Clear History"

---

## 4. Comunicação WebSocket (STOMP)

### 4.1 Configuração do Cliente STOMP

```javascript
// services/websocket.js
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws-dashboard';

class SentinelWebSocket {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  connect(token) {
    this.client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        if (import.meta.env.DEV) console.log('[STOMP]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: this.onConnect.bind(this),
      onDisconnect: this.onDisconnect.bind(this),
      onStompError: this.onError.bind(this),
    });

    this.client.activate();
  }

  onConnect(frame) {
    console.log('[WS] Connected to Sentinel Core');
    this.reconnectAttempts = 0;
    
    // Subscribe to admin events (agent status changes)
    this.subscribe('/topic/admin/events', this.handleAdminEvent);
    
    // Subscribe to telemetry updates
    this.subscribe('/topic/admin/telemetry', this.handleTelemetry);
    
    // Subscribe to command responses
    this.subscribe('/user/queue/responses', this.handleCommandResponse);
  }

  subscribe(destination, callback) {
    if (this.client && this.client.connected) {
      const subscription = this.client.subscribe(destination, (message) => {
        const data = JSON.parse(message.body);
        callback(data);
      });
      this.subscriptions.set(destination, subscription);
    }
  }

  sendCommand(type, targetHwid, payload = []) {
    const commandId = crypto.randomUUID();
    const message = {
      id: commandId,
      type: type,
      targetHwid: targetHwid,
      payload: payload,
      timestamp: new Date().toISOString(),
    };

    this.client.publish({
      destination: '/app/command',
      body: JSON.stringify(message),
    });

    return commandId;
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}

export const sentinelSocket = new SentinelWebSocket();
```

### 4.2 Tópicos e Handlers

| Tópico | Direção | Descrição | Handler no Frontend |
|--------|---------|-----------|---------------------|
| `/topic/admin/events` | Server → Client | Eventos globais (agente conectou/desconectou) | Atualiza lista de agentes |
| `/topic/admin/telemetry` | Server → Client | Telemetria de todos os agentes | Atualiza cards e gráficos |
| `/user/queue/responses` | Server → Client | Respostas de comandos do operador | Atualiza terminal/histórico |
| `/app/command` | Client → Server | Envio de comandos | N/A |

### 4.3 Formato das Mensagens

**Evento de Admin (Agent Status Change):**
```json
{
  "eventType": "AGENT_STATUS_CHANGE",
  "hwid": "AA-BB-CC-DD-EE-FF",
  "oldStatus": "OFFLINE",
  "newStatus": "ONLINE",
  "timestamp": "2025-10-25T14:32:05Z"
}
```

**Telemetria (Heartbeat Broadcast):**
```json
{
  "hwid": "AA-BB-CC-DD-EE-FF",
  "hostname": "WIN-DESKTOP-01",
  "cpuLoad": 12.5,
  "ramUsage": 4096,
  "activeWindow": "Chrome - Gmail",
  "communicationMode": "SESSION",
  "timestamp": "2025-10-25T14:32:05Z"
}
```

**Resposta de Comando:**
```json
{
  "commandId": "550e8400-e29b-41d4-a716-446655440000",
  "hwid": "AA-BB-CC-DD-EE-FF",
  "status": "SUCCESS",
  "output": "Windows IP Configuration...",
  "executedAt": "2025-10-25T14:32:10Z"
}
```

---

## 5. Estado Global (Zustand Stores)

### 5.1 Agent Store

```javascript
// store/agentStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useAgentStore = create(
  devtools((set, get) => ({
    agents: [],
    selectedAgent: null,
    filter: 'ALL',
    searchQuery: '',
    sortBy: 'hostname',
    sortOrder: 'asc',

    // Actions
    setAgents: (agents) => set({ agents }),
    
    updateAgent: (hwid, updates) => set((state) => ({
      agents: state.agents.map((agent) =>
        agent.hwid === hwid ? { ...agent, ...updates } : agent
      ),
    })),

    addAgent: (agent) => set((state) => ({
      agents: [...state.agents, agent],
    })),

    removeAgent: (hwid) => set((state) => ({
      agents: state.agents.filter((a) => a.hwid !== hwid),
    })),

    selectAgent: (hwid) => set((state) => ({
      selectedAgent: state.agents.find((a) => a.hwid === hwid) || null,
    })),

    setFilter: (filter) => set({ filter }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSortBy: (sortBy) => set({ sortBy }),
    toggleSortOrder: () => set((state) => ({
      sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),

    // Computed (via selector)
    getFilteredAgents: () => {
      const { agents, filter, searchQuery, sortBy, sortOrder } = get();
      
      let filtered = agents;
      
      // Filter by status
      if (filter !== 'ALL') {
        filtered = filtered.filter((a) => a.status === filter);
      }
      
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.hostname.toLowerCase().includes(query) ||
            a.ipLocal.toLowerCase().includes(query)
        );
      }
      
      // Sort
      filtered.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'hostname') {
          comparison = a.hostname.localeCompare(b.hostname);
        } else if (sortBy === 'cpuLoad') {
          comparison = a.cpuLoad - b.cpuLoad;
        } else if (sortBy === 'ramUsage') {
          comparison = a.ramUsage - b.ramUsage;
        } else if (sortBy === 'lastSeen') {
          comparison = new Date(b.lastSeen) - new Date(a.lastSeen);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      return filtered;
    },

    // Stats
    getStats: () => {
      const { agents } = get();
      return {
        total: agents.length,
        online: agents.filter((a) => a.status === 'ONLINE').length,
        offline: agents.filter((a) => a.status === 'OFFLINE').length,
        dead: agents.filter((a) => a.status === 'DEAD').length,
        sessionMode: agents.filter((a) => a.communicationMode === 'SESSION').length,
        beaconMode: agents.filter((a) => a.communicationMode === 'BEACON').length,
      };
    },
  }))
);
```

### 5.2 Command Store

```javascript
// store/commandStore.js
import { create } from 'zustand';

export const useCommandStore = create((set, get) => ({
  pendingCommands: [],
  commandHistory: [],
  terminalOutput: {},

  // Actions
  addPendingCommand: (command) => set((state) => ({
    pendingCommands: [...state.pendingCommands, {
      ...command,
      status: 'PENDING',
      sentAt: new Date().toISOString(),
    }],
  })),

  updateCommandStatus: (commandId, status, output = null) => set((state) => {
    const pending = state.pendingCommands.find((c) => c.id === commandId);
    if (pending) {
      const completed = {
        ...pending,
        status,
        output,
        completedAt: new Date().toISOString(),
      };
      return {
        pendingCommands: state.pendingCommands.filter((c) => c.id !== commandId),
        commandHistory: [completed, ...state.commandHistory].slice(0, 100),
      };
    }
    return state;
  }),

  appendTerminalOutput: (hwid, line, type = 'output') => set((state) => ({
    terminalOutput: {
      ...state.terminalOutput,
      [hwid]: [
        ...(state.terminalOutput[hwid] || []),
        { text: line, type, timestamp: new Date().toISOString() },
      ].slice(-500), // Keep last 500 lines
    },
  })),

  clearTerminal: (hwid) => set((state) => ({
    terminalOutput: {
      ...state.terminalOutput,
      [hwid]: [],
    },
  })),

  getTerminalOutput: (hwid) => get().terminalOutput[hwid] || [],
  
  getCommandHistoryForAgent: (hwid) => 
    get().commandHistory.filter((c) => c.targetHwid === hwid),
}));
```

### 5.3 UI Store

```javascript
// store/uiStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      // Theme
      theme: 'dark', // Only dark theme, but keeping for future
      
      // Modals
      activeModal: null,
      modalData: null,
      
      // Sidebar
      sidebarCollapsed: false,
      
      // Notifications
      soundEnabled: true,
      notificationsEnabled: true,
      
      // Connection
      wsConnected: false,
      
      // Actions
      openModal: (modalType, data = null) => set({
        activeModal: modalType,
        modalData: data,
      }),
      
      closeModal: () => set({
        activeModal: null,
        modalData: null,
      }),
      
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed,
      })),
      
      setWsConnected: (connected) => set({ wsConnected: connected }),
      
      toggleSound: () => set((state) => ({
        soundEnabled: !state.soundEnabled,
      })),
      
      toggleNotifications: () => set((state) => ({
        notificationsEnabled: !state.notificationsEnabled,
      })),
    }),
    {
      name: 'sentinel-ui-settings',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        notificationsEnabled: state.notificationsEnabled,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
```

---

## 6. API REST (Axios)

### 6.1 Configuração Base

```javascript
// services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
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

### 6.2 Endpoints da API

| Método | Endpoint | Descrição | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| `POST` | `/auth/login` | Autenticação | `{ username, password }` | `{ token, expiresIn }` |
| `GET` | `/agents` | Lista todos os agentes | - | `Agent[]` |
| `GET` | `/agents/{hwid}` | Detalhes de um agente | - | `Agent` |
| `DELETE` | `/agents/{hwid}` | Remove agente (soft delete) | - | `204 No Content` |
| `GET` | `/agents/{hwid}/screenshots` | Lista screenshots | - | `Screenshot[]` |
| `GET` | `/agents/{hwid}/screenshots/{id}` | Download de screenshot | - | `Binary (JPEG)` |
| `DELETE` | `/agents/{hwid}/screenshots/{id}` | Remove screenshot | - | `204 No Content` |
| `DELETE` | `/agents/{hwid}/screenshots` | Remove todos screenshots | - | `204 No Content` |
| `GET` | `/commands` | Histórico de comandos | `?hwid=&status=&limit=` | `Command[]` |
| `GET` | `/stats` | Estatísticas gerais | - | `Stats` |

### 6.3 Service Functions

```javascript
// services/agents.js
import api from './api';

export const agentService = {
  getAll: () => api.get('/agents'),
  getById: (hwid) => api.get(`/agents/${hwid}`),
  delete: (hwid) => api.delete(`/agents/${hwid}`),
  
  getScreenshots: (hwid) => api.get(`/agents/${hwid}/screenshots`),
  getScreenshot: (hwid, id) => api.get(`/agents/${hwid}/screenshots/${id}`, {
    responseType: 'blob',
  }),
  deleteScreenshot: (hwid, id) => api.delete(`/agents/${hwid}/screenshots/${id}`),
  deleteAllScreenshots: (hwid) => api.delete(`/agents/${hwid}/screenshots`),
};

// services/auth.js
export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => {
    localStorage.removeItem('sentinel_token');
    window.location.href = '/login';
  },
  isAuthenticated: () => !!localStorage.getItem('sentinel_token'),
};
```

---

## 7. Componentes Reutilizáveis (UI Kit)

### 7.1 Catálogo de Componentes

| Componente | Arquivo | Props | Uso |
|------------|---------|-------|-----|
| `Button` | `ui/Button.jsx` | `variant, size, loading, disabled, icon` | Botões principais e secundários |
| `Input` | `ui/Input.jsx` | `type, placeholder, icon, error` | Campos de texto |
| `Card` | `ui/Card.jsx` | `title, className, hoverable` | Containers com borda |
| `Badge` | `ui/Badge.jsx` | `variant, size` | Status indicators |
| `Modal` | `ui/Modal.jsx` | `isOpen, onClose, title, size` | Diálogos modais |
| `Dropdown` | `ui/Dropdown.jsx` | `options, value, onChange` | Selects customizados |
| `Toggle` | `ui/Toggle.jsx` | `checked, onChange, label` | Switches on/off |
| `ProgressBar` | `ui/ProgressBar.jsx` | `value, max, color` | Barras de progresso |
| `Spinner` | `ui/Spinner.jsx` | `size, color` | Loading indicator |
| `Tooltip` | `ui/Tooltip.jsx` | `content, position` | Dicas contextuais |
| `Table` | `ui/Table.jsx` | `columns, data, sortable` | Tabelas interativas |
| `Tabs` | `ui/Tabs.jsx` | `tabs, activeTab, onChange` | Navegação por abas |

### 7.2 Exemplo de Componente (Button)

```jsx
// components/ui/Button.jsx
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-neon-pink hover:bg-neon-pink/80 text-white border-neon-pink',
  secondary: 'bg-void-700 hover:bg-void-600 text-white border-sentinel-border',
  danger: 'bg-neon-red/20 hover:bg-neon-red/40 text-neon-red border-neon-red',
  ghost: 'bg-transparent hover:bg-void-700 text-sentinel-text border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-display font-medium',
        'border rounded transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-neon-pink/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}
```

---

## 8. Autenticação e Segurança

### 8.1 Fluxo de Login

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  Login  │  POST   │ Backend │  JWT    │  Store  │
│  Page   │ ──────> │  /auth  │ ──────> │  Token  │
└─────────┘         └─────────┘         └─────────┘
     │                                       │
     │              Redirect                 │
     └───────────────────────────────────────┘
                    Dashboard
```

### 8.2 Protected Routes

```jsx
// components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';

export function ProtectedRoute({ children }) {
  const location = useLocation();
  
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}
```

### 8.3 Armazenamento de Token

- Token JWT armazenado em `localStorage`
- Token enviado em todas as requisições via header `Authorization: Bearer <token>`
- Token verificado pelo interceptor do Axios
- Logout automático em caso de `401 Unauthorized`

---

## 9. Performance e Otimizações

### 9.1 Virtualização de Listas

Para o grid de agentes com mais de 100 itens:

```jsx
// components/AgentGrid.jsx
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

export function AgentGrid({ agents }) {
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 180;
  const GAP = 16;

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnsCount + columnIndex;
    const agent = agents[index];
    
    if (!agent) return null;
    
    return (
      <div style={{ ...style, padding: GAP / 2 }}>
        <AgentCard agent={agent} />
      </div>
    );
  };

  return (
    <AutoSizer>
      {({ height, width }) => {
        const columnsCount = Math.floor(width / (CARD_WIDTH + GAP));
        const rowsCount = Math.ceil(agents.length / columnsCount);
        
        return (
          <FixedSizeGrid
            columnCount={columnsCount}
            columnWidth={CARD_WIDTH + GAP}
            height={height}
            rowCount={rowsCount}
            rowHeight={CARD_HEIGHT + GAP}
            width={width}
          >
            {Cell}
          </FixedSizeGrid>
        );
      }}
    </AutoSizer>
  );
}
```

### 9.2 Debounce em Busca

```javascript
// hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### 9.3 Lazy Loading de Screenshots

```jsx
// components/ScreenshotGallery.jsx
import { useInView } from 'react-intersection-observer';

function ScreenshotThumbnail({ screenshot }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className="aspect-video bg-void-800 rounded">
      {inView ? (
        <img
          src={`/api/agents/${screenshot.agentHwid}/screenshots/${screenshot.id}`}
          alt={`Screenshot ${screenshot.id}`}
          className="w-full h-full object-cover rounded"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full animate-pulse bg-void-700 rounded" />
      )}
    </div>
  );
}
```

### 9.4 Memoização de Componentes

```jsx
// components/AgentCard.jsx
import { memo } from 'react';

export const AgentCard = memo(function AgentCard({ agent, onClick }) {
  // ... component code
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.agent.hwid === nextProps.agent.hwid &&
    prevProps.agent.status === nextProps.agent.status &&
    prevProps.agent.cpuLoad === nextProps.agent.cpuLoad &&
    prevProps.agent.ramUsage === nextProps.agent.ramUsage &&
    prevProps.agent.lastSeen === nextProps.agent.lastSeen
  );
});
```

---

## 10. Notificações e Feedback

### 10.1 Toast Notifications (Sonner)

```jsx
// App.jsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f1942',
            border: '1px solid #463f6a',
            color: '#ffffff',
          },
        }}
      />
    </>
  );
}
```

### 10.2 Uso das Notificações

```javascript
import { toast } from 'sonner';

// Success
toast.success('Screenshot captured successfully');

// Error
toast.error('Failed to execute command');

// Info
toast.info('Agent WIN-PC01 came online');

// Promise (para operações async)
toast.promise(agentService.delete(hwid), {
  loading: 'Removing agent...',
  success: 'Agent removed',
  error: 'Failed to remove agent',
});
```

### 10.3 Áudio de Notificação

```javascript
// hooks/useNotificationSound.js
import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/uiStore';

export function useNotificationSound() {
  const audioRef = useRef(null);
  const soundEnabled = useUIStore((state) => state.soundEnabled);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  return playSound;
}
```

---

## 11. Testes e Qualidade

### 11.1 Stack de Testes

| Ferramenta | Uso |
|------------|-----|
| Vitest | Unit tests para hooks e utils |
| React Testing Library | Component tests |
| MSW (Mock Service Worker) | Mocking de API |
| Playwright | E2E tests |

### 11.2 Estrutura de Testes

```
/src
├── /components
│   └── AgentCard.jsx
│   └── AgentCard.test.jsx
├── /hooks
│   └── useDebounce.js
│   └── useDebounce.test.js
├── /utils
│   └── formatters.js
│   └── formatters.test.js
└── /e2e
    └── dashboard.spec.js
    └── agent-details.spec.js
```

### 11.3 Exemplo de Teste de Componente

```jsx
// components/AgentCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentCard } from './AgentCard';

const mockAgent = {
  hwid: 'AA-BB-CC-DD-EE-FF',
  hostname: 'WIN-TEST-01',
  status: 'ONLINE',
  ipLocal: '192.168.0.100',
  cpuLoad: 25.5,
  ramUsage: 4096,
  lastSeen: new Date().toISOString(),
  communicationMode: 'SESSION',
};

describe('AgentCard', () => {
  it('renders agent information correctly', () => {
    render(<AgentCard agent={mockAgent} />);
    
    expect(screen.getByText('WIN-TEST-01')).toBeInTheDocument();
    expect(screen.getByText('192.168.0.100')).toBeInTheDocument();
    expect(screen.getByText('25.5%')).toBeInTheDocument();
  });

  it('shows green indicator for ONLINE status', () => {
    render(<AgentCard agent={mockAgent} />);
    
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('bg-neon-green');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<AgentCard agent={mockAgent} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(mockAgent.hwid);
  });
});
```

---

## 12. Deploy e Build

### 12.1 Scripts do package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .js,.jsx",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test"
  }
}
```

### 12.2 Variáveis de Ambiente

```bash
# .env.development
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws-dashboard

# .env.production
VITE_API_URL=https://sentinel-api.example.com/api
VITE_WS_URL=wss://sentinel-api.example.com/ws-dashboard
```

### 12.3 Build para Produção

```bash
# Gerar build otimizado
npm run build

# O output estará em /dist
# Servir com Nginx ou integrar ao backend Spring Boot
```

### 12.4 Configuração Nginx (Exemplo)

```nginx
server {
    listen 80;
    server_name sentinel.example.com;

    root /var/www/sentinel-vision/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # WebSocket proxy
    location /ws-dashboard {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 13. Roadmap de Funcionalidades (v2.0+)

### 13.1 Funcionalidades Planejadas

| Feature | Prioridade | Complexidade | Descrição |
|---------|------------|--------------|-----------|
| **Dark/Light Theme** | Baixa | Baixa | Toggle de tema (manter visual escuro como padrão) |
| **File Manager** | Alta | Alta | Navegação e transferência de arquivos bidirecionais |
| **Keylogger Viewer** | Média | Média | Visualização de logs de keylogger em tempo real |
| **Network Map** | Média | Alta | Mapa visual da rede com agentes detectados |
| **Multi-Select Actions** | Alta | Média | Executar comandos em múltiplos agentes simultaneamente |
| **Export Reports** | Média | Média | Exportar histórico de comandos em PDF/CSV |
| **Webhook Integrations** | Baixa | Média | Notificações via Discord, Telegram, Slack |
| **Custom Scripts** | Alta | Alta | Biblioteca de scripts reutilizáveis |
| **Agent Groups** | Média | Média | Agrupar agentes por tags/categorias |
| **Dashboard Widgets** | Baixa | Alta | Widgets customizáveis no dashboard |

### 13.2 Melhorias de UX

- **Onboarding Tour:** Guia interativo para novos operadores
- **Keyboard Shortcuts:** Atalhos globais para ações comuns
- **Command Palette:** Ctrl+K para busca rápida de agentes e comandos
- **Responsive Mobile:** Layout otimizado para tablets
- **Offline Mode:** Cache de dados básicos para visualização offline

---

## 14. Referências de Design

### 14.1 Inspirações Visuais

- **Fatality.win** - Interface de cheat para CS2 com estética gaming agressiva
- **Neverlose.cc** - Dark UI com acentos neon
- **Cyberpunk 2077 UI** - Elementos Sci-Fi, glitch effects
- **Havoc C2** - Interface de C2 framework moderno

### 14.2 Bibliotecas de Componentes de Referência

- **Radix UI** - Primitives acessíveis
- **Headless UI** - Componentes sem estilo
- **Framer Motion** - Animações fluidas

### 14.3 Recursos de Ícones e Fontes

- **Lucide Icons** - https://lucide.dev
- **JetBrains Mono** - https://www.jetbrains.com/lp/mono/
- **Rajdhani** - Google Fonts

---

## 15. Considerações Finais

### 15.1 Boas Práticas de Desenvolvimento

1. **Componentização:** Manter componentes pequenos e focados
2. **Type Safety:** Considerar migração para TypeScript em v2.0
3. **Acessibilidade:** Manter atributos ARIA e navegação por teclado
4. **Performance:** Monitorar re-renders desnecessários com React DevTools
5. **Código Limpo:** Seguir ESLint rules e Prettier para formatação

### 15.2 Segurança do Frontend

- Nunca armazenar dados sensíveis em localStorage além do JWT
- Sanitizar inputs antes de enviar ao backend
- Implementar rate limiting visual para ações destrutivas
- Validar URLs antes de executar OPEN_URL

### 15.3 Monitoramento

- Integrar com serviço de error tracking (Sentry)
- Implementar analytics básico para uso de features
- Logs de debug apenas em ambiente de desenvolvimento

---

**Documento Finalizado**

*Sentinel Vision v1.0.6 - Interface de Operação do Sistema C2*

*© 2025 - Projeto Educacional*
