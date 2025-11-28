package config

import (
	"os"
	"time"
)

// Config contém todas as configurações do agente
type Config struct {
	// Conexão
	ServerURL string
	PSK       string

	// Intervalos
	HeartbeatInterval time.Duration
	ReconnectMinDelay time.Duration
	ReconnectMaxDelay time.Duration

	// Identidade
	AgentVersion string
}

// Variáveis que podem ser injetadas via ldflags no build
var (
	serverURL = ""
	psk       = ""
)

// Current é a configuração ativa do agente
var Current = Config{
	ServerURL:         getServerURL(),
	PSK:               getPSK(),
	HeartbeatInterval: 5 * time.Second,
	ReconnectMinDelay: 1 * time.Second,
	ReconnectMaxDelay: 60 * time.Second,
	AgentVersion:      "1.0.6",
}

func getServerURL() string {
	// Prioridade: ldflags > env > default
	if serverURL != "" {
		return serverURL
	}
	if value := os.Getenv("SENTINEL_SERVER"); value != "" {
		return value
	}
	return "ws://localhost:8080/ws-sentinel"
}

func getPSK() string {
	// Prioridade: ldflags > env > default
	if psk != "" {
		return psk
	}
	if value := os.Getenv("SENTINEL_PSK"); value != "" {
		return value
	}
	return "SENTINEL_PROJECT_V1_SECRET_KEY"
}
