# Sentinel Vision

> Dashboard de Comando & Controle para o Sentinel C2

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📁 Estrutura

```
src/
├── components/     # Componentes React
│   ├── ui/        # Componentes base (Button, Input, Card...)
│   └── tabs/      # Abas do Command Center
├── hooks/         # Custom hooks
├── layouts/       # Layouts da aplicação
├── pages/         # Páginas (Dashboard, AgentDetails, Login, Settings)
├── services/      # API e WebSocket
├── store/         # Zustand stores
└── utils/         # Utilitários
```

## 🎨 Design System

- **Background:** `#0e0e15` (Deep Void)
- **Accent Primary:** `#eb055a` (Neon Pink)
- **Accent Secondary:** `#4632f0` (Digital Purple)
- **Success:** `#00ff88` (Neon Green)
- **Fonts:** JetBrains Mono (code), Rajdhani (display)

## 🔧 Configuração

Copie `.env.example` para `.env` e configure:

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws-dashboard
```

## 📦 Stack

- React 18 + Vite
- TailwindCSS
- Zustand (state management)
- STOMP.js (WebSocket)
- Recharts (gráficos)
- Lucide React (ícones)
- Sonner (toasts)

---

**Sentinel Vision v1.0.6** | Educational Project
