package troll

import (
	"fmt"
	"os/exec"
	"runtime"
	"strings"
	"syscall"
)

// OpenURLHandler abre uma URL no navegador padrão do sistema
// params: ["https://example.com"]
func OpenURLHandler(params []interface{}) (string, error) {
	if len(params) < 1 {
		return "", fmt.Errorf("URL required")
	}

	url := fmt.Sprintf("%v", params[0])

	// Validação básica de URL
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}

	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "windows":
		// Windows: usar cmd /c start
		cmd = exec.Command("cmd", "/c", "start", url)
		// Ocultar janela
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: 0x08000000, // CREATE_NO_WINDOW
		}

	case "darwin":
		// macOS: usar open
		cmd = exec.Command("open", url)

	default:
		// Linux: tentar xdg-open
		cmd = exec.Command("xdg-open", url)
	}

	err := cmd.Start()
	if err != nil {
		return "", fmt.Errorf("failed to open URL: %v", err)
	}

	return fmt.Sprintf("Opened URL: %s", url), nil
}

// OpenMultipleURLs abre várias URLs (para uso futuro)
func OpenMultipleURLs(urls []string) (string, error) {
	opened := 0
	failed := 0

	for _, url := range urls {
		_, err := OpenURLHandler([]interface{}{url})
		if err != nil {
			failed++
		} else {
			opened++
		}
	}

	return fmt.Sprintf("Opened %d URLs, %d failed", opened, failed), nil
}
