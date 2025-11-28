package telemetry

import (
	"fmt"
	"net"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"syscall"
	"unsafe"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
)

// Heartbeat contém as métricas de telemetria
type Heartbeat struct {
	HWID         string  `json:"hwid"`
	Hostname     string  `json:"hostname"`
	OSInfo       string  `json:"os_info"`
	IPLocal      string  `json:"ip_local"`
	CPULoad      float64 `json:"cpu_load"`
	RAMUsage     int64   `json:"ram_usage"`
	ActiveWindow string  `json:"active_window"`
}

// CollectHeartbeat coleta todas as métricas do sistema
func CollectHeartbeat(hwid string) Heartbeat {
	hostname, _ := os.Hostname()

	return Heartbeat{
		HWID:         hwid,
		Hostname:     hostname,
		OSInfo:       getOSInfo(),
		IPLocal:      getLocalIP(),
		CPULoad:      getCPUUsage(),
		RAMUsage:     getRAMUsageMB(),
		ActiveWindow: getActiveWindowTitle(),
	}
}

// getCPUUsage retorna a porcentagem de uso da CPU
func getCPUUsage() float64 {
	// Nota: Usar 0 como intervalo pode não ser preciso
	// Idealmente usar um intervalo, mas isso bloquearia
	percentages, err := cpu.Percent(0, false)
	if err != nil || len(percentages) == 0 {
		return 0
	}
	return percentages[0]
}

// getRAMUsageMB retorna a RAM usada em megabytes
func getRAMUsageMB() int64 {
	v, err := mem.VirtualMemory()
	if err != nil {
		return 0
	}
	return int64(v.Used / 1024 / 1024)
}

// getOSInfo retorna informações do sistema operacional
func getOSInfo() string {
	if runtime.GOOS == "windows" {
		return getWindowsVersion()
	}
	return fmt.Sprintf("%s %s", runtime.GOOS, runtime.GOARCH)
}

// getWindowsVersion obtém a versão do Windows via WMI
func getWindowsVersion() string {
	cmd := exec.Command("wmic", "os", "get", "Caption,Version", "/value")
	output, err := cmd.Output()
	if err != nil {
		return "Windows (unknown version)"
	}

	caption := ""
	version := ""

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "Caption=") {
			caption = strings.TrimPrefix(line, "Caption=")
		}
		if strings.HasPrefix(line, "Version=") {
			version = strings.TrimPrefix(line, "Version=")
		}
	}

	if caption != "" {
		if version != "" {
			return fmt.Sprintf("%s (%s)", caption, version)
		}
		return caption
	}

	return "Windows"
}

// getLocalIP retorna o IP local da máquina
func getLocalIP() string {
	// Método 1: Conectar a um endereço externo para obter o IP local preferido
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err == nil {
		defer conn.Close()
		localAddr := conn.LocalAddr().(*net.UDPAddr)
		return localAddr.IP.String()
	}

	// Método 2: Iterar interfaces
	interfaces, err := net.Interfaces()
	if err != nil {
		return "0.0.0.0"
	}

	for _, iface := range interfaces {
		// Pular loopback e interfaces down
		if iface.Flags&net.FlagLoopback != 0 || iface.Flags&net.FlagUp == 0 {
			continue
		}

		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			// Retornar primeiro IPv4 válido
			if ip != nil && ip.To4() != nil && !ip.IsLoopback() {
				return ip.String()
			}
		}
	}

	return "0.0.0.0"
}

// getActiveWindowTitle obtém o título da janela ativa (Windows)
func getActiveWindowTitle() string {
	if runtime.GOOS != "windows" {
		return ""
	}

	user32 := syscall.NewLazyDLL("user32.dll")
	getForegroundWindow := user32.NewProc("GetForegroundWindow")
	getWindowTextW := user32.NewProc("GetWindowTextW")

	hwnd, _, _ := getForegroundWindow.Call()
	if hwnd == 0 {
		return ""
	}

	buf := make([]uint16, 256)
	getWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), 256)

	return syscall.UTF16ToString(buf)
}
