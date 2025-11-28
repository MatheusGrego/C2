package identity

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net"
	"os/exec"
	"runtime"
	"strings"
)

// GetHWID retorna um identificador único e imutável da máquina
func GetHWID() string {
	// Em Windows, tenta obter UUID da placa-mãe
	if runtime.GOOS == "windows" {
		if uuid := getMotherboardUUID(); uuid != "" {
			return formatHWID(uuid)
		}
	}

	// Fallback: hash do MAC address
	if mac := getFirstMACAddress(); mac != "" {
		hash := sha256.Sum256([]byte(mac))
		return formatHWID(hex.EncodeToString(hash[:])[:32])
	}

	// Último recurso: gerar aleatório (não ideal, mas garante funcionamento)
	return generateRandomHWID()
}

// getMotherboardUUID obtém UUID via WMI (Windows)
func getMotherboardUUID() string {
	if runtime.GOOS != "windows" {
		return ""
	}

	cmd := exec.Command("wmic", "csproduct", "get", "uuid")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		// Ignora header e linhas vazias
		if line != "" && line != "UUID" && !strings.HasPrefix(line, "UUID") {
			// Validar que parece um UUID
			if len(line) >= 32 {
				return strings.ReplaceAll(line, "-", "")
			}
		}
	}
	return ""
}

// getFirstMACAddress obtém o MAC da primeira interface válida
func getFirstMACAddress() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return ""
	}

	for _, iface := range interfaces {
		// Pular interfaces sem MAC
		if iface.HardwareAddr == nil || len(iface.HardwareAddr) == 0 {
			continue
		}

		// Pular loopback
		if iface.Flags&net.FlagLoopback != 0 {
			continue
		}

		// Pular interfaces down
		if iface.Flags&net.FlagUp == 0 {
			continue
		}

		return iface.HardwareAddr.String()
	}

	// Segunda tentativa: qualquer interface com MAC
	for _, iface := range interfaces {
		if iface.HardwareAddr != nil && len(iface.HardwareAddr) > 0 {
			if iface.Flags&net.FlagLoopback == 0 {
				return iface.HardwareAddr.String()
			}
		}
	}

	return ""
}

// formatHWID formata para padrão AA-BB-CC-DD-EE-FF
func formatHWID(raw string) string {
	// Remover hífens e converter para maiúsculas
	raw = strings.ToUpper(strings.ReplaceAll(raw, "-", ""))
	raw = strings.ReplaceAll(raw, ":", "")

	// Garantir que temos pelo menos 12 caracteres
	if len(raw) < 12 {
		// Pad com zeros se necessário
		raw = raw + strings.Repeat("0", 12-len(raw))
	}

	// Formatar como AA-BB-CC-DD-EE-FF
	return fmt.Sprintf("%s-%s-%s-%s-%s-%s",
		raw[0:2], raw[2:4], raw[4:6],
		raw[6:8], raw[8:10], raw[10:12])
}

// generateRandomHWID gera um HWID aleatório (último recurso)
func generateRandomHWID() string {
	bytes := make([]byte, 6)
	rand.Read(bytes)
	return fmt.Sprintf("%02X-%02X-%02X-%02X-%02X-%02X",
		bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5])
}
