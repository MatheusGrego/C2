package executor

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"runtime"
	"syscall"
	"time"
)

const (
	// CommandTimeout é o tempo máximo de execução de um comando
	CommandTimeout = 30 * time.Second
)

// ShellHandler executa comandos no shell do sistema
// params: ["cmd", "/c", "comando"] ou ["powershell", "-c", "comando"]
// Em Linux: ["bash", "-c", "comando"]
func ShellHandler(params []interface{}) (string, error) {
	if len(params) < 1 {
		return "", fmt.Errorf("shell command requires at least 1 param")
	}

	// Converter params para []string
	args := make([]string, len(params))
	for i, p := range params {
		args[i] = fmt.Sprintf("%v", p)
	}

	// Criar contexto com timeout
	ctx, cancel := context.WithTimeout(context.Background(), CommandTimeout)
	defer cancel()

	// Criar comando
	var cmd *exec.Cmd
	if len(args) == 1 {
		// Comando simples - usar shell padrão do sistema
		if runtime.GOOS == "windows" {
			cmd = exec.CommandContext(ctx, "cmd", "/c", args[0])
		} else {
			cmd = exec.CommandContext(ctx, "sh", "-c", args[0])
		}
	} else {
		cmd = exec.CommandContext(ctx, args[0], args[1:]...)
	}

	// CRÍTICO: Ocultar janela do console no Windows
	if runtime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: 0x08000000, // CREATE_NO_WINDOW
		}
	}

	// Capturar output
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	// Executar
	err := cmd.Run()

	// Montar output
	output := stdout.String()
	if stderr.Len() > 0 {
		if output != "" {
			output += "\n"
		}
		output += "[STDERR]\n" + stderr.String()
	}

	// Verificar timeout
	if ctx.Err() == context.DeadlineExceeded {
		return output, fmt.Errorf("command timed out after %v", CommandTimeout)
	}

	if err != nil {
		return output, fmt.Errorf("command failed: %v", err)
	}

	return output, nil
}
