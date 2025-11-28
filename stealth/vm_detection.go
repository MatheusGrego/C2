package stealth

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"syscall"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

// VMDetectionResult armazena resultado da detecção
type VMDetectionResult struct {
	IsVM          bool
	Confidence    int // 0-100
	DetectedBy    []string
	TotalChecks   int
	FailedChecks  int
}

// DetectVM realiza múltiplas verificações para detectar VM/Sandbox
func DetectVM() *VMDetectionResult {
	result := &VMDetectionResult{
		IsVM:         false,
		Confidence:   0,
		DetectedBy:   make([]string, 0),
		TotalChecks:  0,
		FailedChecks: 0,
	}

	checks := []struct {
		name  string
		check func() bool
	}{
		{"CPU Cores", checkCPUCores},
		{"RAM Size", checkRAMSize},
		{"Disk Size", checkDiskSize},
		{"Registry VMware", checkRegistryVMware},
		{"Registry VirtualBox", checkRegistryVirtualBox},
		{"Registry QEMU", checkRegistryQEMU},
		{"MAC Address", checkMACAddress},
		{"BIOS Info", checkBIOSInfo},
		{"System Manufacturer", checkSystemManufacturer},
		{"Firmware Table", checkFirmwareTable},
		{"USB Devices", checkUSBDevices},
		{"Recent Files", checkRecentFiles},
		{"Uptime", checkSystemUptime},
		{"Process List", checkSuspiciousProcesses},
		{"DLL Hooks", checkDLLHooks},
		{"Timing Attack", checkTimingAttack},
		{"CPU Temperature", checkCPUTemperature},
		{"User Interaction", checkUserInteraction},
	}

	for _, c := range checks {
		result.TotalChecks++
		if c.check() {
			result.FailedChecks++
			result.DetectedBy = append(result.DetectedBy, c.name)
		}
	}

	// Calcular confiança (% de checks que falharam)
	result.Confidence = (result.FailedChecks * 100) / result.TotalChecks

	// Se 30% ou mais dos checks indicam VM, considerar como VM
	if result.Confidence >= 30 {
		result.IsVM = true
	}

	return result
}

// checkCPUCores verifica número de cores (VMs geralmente têm poucos)
func checkCPUCores() bool {
	cores := runtime.NumCPU()
	// Máquinas reais modernas geralmente têm 4+ cores
	// VMs/sandboxes geralmente têm 1-2
	return cores < 2
}

// checkRAMSize verifica quantidade de RAM (VMs têm pouca)
func checkRAMSize() bool {
	kernel32 := windows.NewLazySystemDLL("kernel32.dll")
	globalMemoryStatusEx := kernel32.NewProc("GlobalMemoryStatusEx")

	type MEMORYSTATUSEX struct {
		Length               uint32
		MemoryLoad           uint32
		TotalPhys            uint64
		AvailPhys            uint64
		TotalPageFile        uint64
		AvailPageFile        uint64
		TotalVirtual         uint64
		AvailVirtual         uint64
		AvailExtendedVirtual uint64
	}

	var memStatus MEMORYSTATUSEX
	memStatus.Length = uint32(unsafe.Sizeof(memStatus))

	ret, _, _ := globalMemoryStatusEx.Call(uintptr(unsafe.Pointer(&memStatus)))
	if ret == 0 {
		return false
	}

	// RAM em GB
	ramGB := memStatus.TotalPhys / (1024 * 1024 * 1024)

	// Máquinas reais modernas têm 8GB+
	// VMs geralmente têm 2-4GB
	return ramGB < 4
}

// checkDiskSize verifica tamanho do disco (VMs têm discos pequenos)
func checkDiskSize() bool {
	var freeBytesAvailable, totalBytes, totalFreeBytes uint64

	pathPtr, _ := syscall.UTF16PtrFromString("C:\\")
	err := windows.GetDiskFreeSpaceEx(
		pathPtr,
		&freeBytesAvailable,
		&totalBytes,
		&totalFreeBytes,
	)

	if err != nil {
		return false
	}

	// Disco em GB
	diskGB := totalBytes / (1024 * 1024 * 1024)

	// Discos reais geralmente 256GB+
	// VMs geralmente 20-100GB
	return diskGB < 80
}

// checkRegistryVMware verifica artefatos VMware no registry
func checkRegistryVMware() bool {
	vmwareKeys := []string{
		`HARDWARE\DEVICEMAP\Scsi\Scsi Port 0\Scsi Bus 0\Target Id 0\Logical Unit Id 0`,
		`SOFTWARE\VMware, Inc.\VMware Tools`,
		`SYSTEM\ControlSet001\Services\vmdebug`,
		`SYSTEM\ControlSet001\Services\vmmouse`,
		`SYSTEM\ControlSet001\Services\VMTools`,
		`SYSTEM\ControlSet001\Services\VMMEMCTL`,
	}

	for _, keyPath := range vmwareKeys {
		if registryKeyExists(registry.LOCAL_MACHINE, keyPath) {
			return true
		}
	}

	// Verificar "Identifier" no SCSI
	key, err := registry.OpenKey(registry.LOCAL_MACHINE,
		`HARDWARE\DEVICEMAP\Scsi\Scsi Port 0\Scsi Bus 0\Target Id 0\Logical Unit Id 0`,
		registry.QUERY_VALUE)
	if err == nil {
		defer key.Close()
		identifier, _, err := key.GetStringValue("Identifier")
		if err == nil {
			if strings.Contains(strings.ToLower(identifier), "vmware") {
				return true
			}
		}
	}

	return false
}

// checkRegistryVirtualBox verifica artefatos VirtualBox
func checkRegistryVirtualBox() bool {
	vboxKeys := []string{
		`HARDWARE\ACPI\DSDT\VBOX__`,
		`HARDWARE\ACPI\FADT\VBOX__`,
		`HARDWARE\ACPI\RSDT\VBOX__`,
		`SOFTWARE\Oracle\VirtualBox Guest Additions`,
		`SYSTEM\ControlSet001\Services\VBoxGuest`,
		`SYSTEM\ControlSet001\Services\VBoxMouse`,
		`SYSTEM\ControlSet001\Services\VBoxService`,
	}

	for _, keyPath := range vboxKeys {
		if registryKeyExists(registry.LOCAL_MACHINE, keyPath) {
			return true
		}
	}

	return false
}

// checkRegistryQEMU verifica artefatos QEMU/KVM
func checkRegistryQEMU() bool {
	key, err := registry.OpenKey(registry.LOCAL_MACHINE,
		`HARDWARE\DEVICEMAP\Scsi\Scsi Port 0\Scsi Bus 0\Target Id 0\Logical Unit Id 0`,
		registry.QUERY_VALUE)
	if err == nil {
		defer key.Close()
		identifier, _, err := key.GetStringValue("Identifier")
		if err == nil {
			lower := strings.ToLower(identifier)
			if strings.Contains(lower, "qemu") || strings.Contains(lower, "virtio") {
				return true
			}
		}
	}

	return false
}

// checkMACAddress verifica endereços MAC conhecidos de VMs
func checkMACAddress() bool {
	// Executar getmac
	cmd := exec.Command("getmac", "/FO", "CSV", "/NH")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false
	}

	macStr := strings.ToUpper(string(output))

	// Prefixos conhecidos de VMs
	vmPrefixes := []string{
		"00:05:69", "00:0C:29", "00:1C:14", "00:50:56", // VMware
		"08:00:27", "52:54:00",                         // VirtualBox, QEMU
		"00:16:3E", "00:15:5D",                         // Xen, Hyper-V
	}

	for _, prefix := range vmPrefixes {
		if strings.Contains(macStr, prefix) {
			return true
		}
	}

	return false
}

// checkBIOSInfo verifica informações da BIOS
func checkBIOSInfo() bool {
	biosKeys := []string{
		`HARDWARE\DESCRIPTION\System\BIOS`,
		`HARDWARE\DESCRIPTION\System\SystemBiosVersion`,
	}

	suspiciousStrings := []string{
		"vmware", "virtualbox", "vbox", "qemu", "xen",
		"parallels", "hyper-v", "hyperv", "virtual",
	}

	for _, keyPath := range biosKeys {
		key, err := registry.OpenKey(registry.LOCAL_MACHINE, keyPath, registry.QUERY_VALUE)
		if err != nil {
			continue
		}
		defer key.Close()

		// Ler todos os valores
		valueNames, err := key.ReadValueNames(0)
		if err != nil {
			continue
		}

		for _, valueName := range valueNames {
			value, _, err := key.GetStringValue(valueName)
			if err != nil {
				continue
			}

			valueLower := strings.ToLower(value)
			for _, suspicious := range suspiciousStrings {
				if strings.Contains(valueLower, suspicious) {
					return true
				}
			}
		}
	}

	return false
}

// checkSystemManufacturer verifica fabricante do sistema
func checkSystemManufacturer() bool {
	key, err := registry.OpenKey(registry.LOCAL_MACHINE,
		`SYSTEM\CurrentControlSet\Control\SystemInformation`,
		registry.QUERY_VALUE)
	if err != nil {
		return false
	}
	defer key.Close()

	manufacturer, _, err := key.GetStringValue("SystemManufacturer")
	if err != nil {
		return false
	}

	manuLower := strings.ToLower(manufacturer)
	vmManufacturers := []string{
		"vmware", "virtualbox", "qemu", "microsoft corporation",
		"xen", "parallels", "innotek", "oracle",
	}

	for _, vm := range vmManufacturers {
		if strings.Contains(manuLower, vm) {
			return true
		}
	}

	return false
}

// checkFirmwareTable verifica tabela de firmware (SMBIOS)
func checkFirmwareTable() bool {
	// Tentar detectar via WMI (simplificado)
	cmd := exec.Command("wmic", "computersystem", "get", "manufacturer")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false
	}

	outStr := strings.ToLower(string(output))
	vmStrings := []string{"vmware", "virtualbox", "qemu", "microsoft corporation", "xen"}

	for _, vm := range vmStrings {
		if strings.Contains(outStr, vm) {
			return true
		}
	}

	return false
}

// checkUSBDevices verifica se há dispositivos USB (VMs geralmente não têm)
func checkUSBDevices() bool {
	cmd := exec.Command("wmic", "path", "Win32_USBHub", "get", "DeviceID")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false
	}

	// Se não tem nenhum USB, provável VM
	return !strings.Contains(string(output), "USB")
}

// checkRecentFiles verifica se há arquivos recentes (sandbox nova não tem)
func checkRecentFiles() bool {
	recentPath := os.Getenv("APPDATA") + "\\Microsoft\\Windows\\Recent"
	files, err := os.ReadDir(recentPath)
	if err != nil {
		return false
	}

	// Se tem menos de 10 arquivos recentes, pode ser sandbox
	return len(files) < 10
}

// checkSystemUptime verifica uptime do sistema (sandbox é recém iniciada)
func checkSystemUptime() bool {
	kernel32 := windows.NewLazySystemDLL("kernel32.dll")
	getTickCount := kernel32.NewProc("GetTickCount64")

	ret, _, _ := getTickCount.Call()
	uptimeMS := ret

	// Uptime em minutos
	uptimeMin := uptimeMS / (1000 * 60)

	// Se uptime menor que 10 minutos, provável sandbox
	return uptimeMin < 10
}

// checkSuspiciousProcesses verifica processos de análise/debug
func checkSuspiciousProcesses() bool {
	cmd := exec.Command("tasklist")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false
	}

	outStr := strings.ToLower(string(output))

	suspiciousProcs := []string{
		"vmsrvc", "vmusrvc", "vboxtray", "vmtoolsd",
		"wireshark", "fiddler", "processhacker", "procmon",
		"x64dbg", "x32dbg", "ollydbg", "ida", "windbg",
		"httpdebugger", "tcpview", "autorunsc",
	}

	for _, proc := range suspiciousProcs {
		if strings.Contains(outStr, proc) {
			return true
		}
	}

	return false
}

// checkDLLHooks verifica se há hooks em DLLs (EDR/Sandbox)
func checkDLLHooks() bool {
	// Verificação básica: checar se ntdll.dll tem instruções suspeitas
	// Implementação completa requer análise de bytes da DLL
	// Por ora, retornar false (placeholder para implementação futura)
	return false
}

// checkTimingAttack verifica timing de instruções (emulação é lenta)
func checkTimingAttack() bool {
	iterations := 10
	var totalDuration time.Duration

	for i := 0; i < iterations; i++ {
		start := time.Now()

		// Operação simples
		sum := 0
		for j := 0; j < 100000; j++ {
			sum += j
		}

		duration := time.Since(start)
		totalDuration += duration
	}

	avgDuration := totalDuration / time.Duration(iterations)

	// Se média > 5ms, provável emulação/sandbox
	return avgDuration > 5*time.Millisecond
}

// checkCPUTemperature verifica se consegue ler temperatura (VMs não têm)
func checkCPUTemperature() bool {
	// VMs não têm sensores de temperatura reais
	// Tentar ler via WMI MSAcpi_ThermalZoneTemperature
	cmd := exec.Command("wmic", "/namespace:\\\\root\\wmi", "PATH",
		"MSAcpi_ThermalZoneTemperature", "GET", "CurrentTemperature")
	output, err := cmd.CombinedOutput()

	if err != nil || !strings.Contains(string(output), "CurrentTemperature") {
		// Não conseguiu ler temperatura = provável VM
		return true
	}

	return false
}

// checkUserInteraction verifica sinais de interação humana real
func checkUserInteraction() bool {
	// Verificar se há histórico de navegação, downloads, documentos recentes
	userProfile := os.Getenv("USERPROFILE")

	// Verificar downloads
	downloads := userProfile + "\\Downloads"
	files, err := os.ReadDir(downloads)
	if err != nil || len(files) < 5 {
		return true // Poucos downloads = provável sandbox
	}

	// Verificar documentos
	documents := userProfile + "\\Documents"
	docs, err := os.ReadDir(documents)
	if err != nil || len(docs) < 3 {
		return true
	}

	return false
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções auxiliares
// ─────────────────────────────────────────────────────────────────────────────

// registryKeyExists verifica se uma chave existe no registry
func registryKeyExists(root registry.Key, path string) bool {
	key, err := registry.OpenKey(root, path, registry.QUERY_VALUE)
	if err != nil {
		return false
	}
	defer key.Close()
	return true
}

// IsVirtualEnvironment verifica se está rodando em VM (função pública)
func IsVirtualEnvironment() bool {
	result := DetectVM()
	return result.IsVM
}

// GetVMDetectionReport retorna relatório detalhado
func GetVMDetectionReport() string {
	result := DetectVM()

	report := fmt.Sprintf(`
VM Detection Report
═══════════════════════════════════════
Virtual Machine: %v
Confidence Level: %d%%
Failed Checks: %d / %d

Detected by:
`, result.IsVM, result.Confidence, result.FailedChecks, result.TotalChecks)

	if len(result.DetectedBy) == 0 {
		report += "  [None - appears to be real hardware]\n"
	} else {
		for _, check := range result.DetectedBy {
			report += fmt.Sprintf("  ✗ %s\n", check)
		}
	}

	return report
}
