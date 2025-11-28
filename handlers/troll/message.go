package troll

import (
	"fmt"
	"runtime"
	"syscall"
	"unsafe"
)

// MessageBox flags
const (
	MB_OK                = 0x00000000
	MB_OKCANCEL          = 0x00000001
	MB_YESNO             = 0x00000004
	MB_ICONINFORMATION   = 0x00000040
	MB_ICONWARNING       = 0x00000030
	MB_ICONERROR         = 0x00000010
	MB_ICONQUESTION      = 0x00000020
	MB_TOPMOST           = 0x00040000
	MB_SETFOREGROUND     = 0x00010000
)

// MessageHandler exibe uma MessageBox nativa do Windows
// params: ["Título", "Mensagem"]
// params opcionais: ["Título", "Mensagem", "tipo"] onde tipo pode ser:
//   - "info" (default)
//   - "warning"
//   - "error"
//   - "question"
func MessageHandler(params []interface{}) (string, error) {
	if len(params) < 2 {
		return "", fmt.Errorf("message requires title and text (got %d params)", len(params))
	}

	title := fmt.Sprintf("%v", params[0])
	text := fmt.Sprintf("%v", params[1])

	// Tipo de ícone (opcional)
	iconFlag := uint32(MB_ICONINFORMATION)
	if len(params) >= 3 {
		switch fmt.Sprintf("%v", params[2]) {
		case "warning":
			iconFlag = MB_ICONWARNING
		case "error":
			iconFlag = MB_ICONERROR
		case "question":
			iconFlag = MB_ICONQUESTION
		}
	}

	// Flags combinados
	flags := MB_OK | iconFlag | MB_TOPMOST | MB_SETFOREGROUND

	if runtime.GOOS == "windows" {
		return showMessageBoxWindows(title, text, uint32(flags))
	}

	// Em outros sistemas, apenas retornar confirmação
	return fmt.Sprintf("Message would be displayed: [%s] %s", title, text), nil
}

// showMessageBoxWindows usa a API Win32 para exibir a MessageBox
func showMessageBoxWindows(title, text string, flags uint32) (string, error) {
	user32 := syscall.NewLazyDLL("user32.dll")
	messageBox := user32.NewProc("MessageBoxW")

	titlePtr, err := syscall.UTF16PtrFromString(title)
	if err != nil {
		return "", fmt.Errorf("failed to convert title: %v", err)
	}

	textPtr, err := syscall.UTF16PtrFromString(text)
	if err != nil {
		return "", fmt.Errorf("failed to convert text: %v", err)
	}

	// MessageBoxW(hWnd, lpText, lpCaption, uType)
	// hWnd = 0 (sem janela pai)
	ret, _, _ := messageBox.Call(
		0,
		uintptr(unsafe.Pointer(textPtr)),
		uintptr(unsafe.Pointer(titlePtr)),
		uintptr(flags),
	)

	// Retornar qual botão foi clicado
	buttonText := "Unknown"
	switch ret {
	case 1: // IDOK
		buttonText = "OK"
	case 2: // IDCANCEL
		buttonText = "Cancel"
	case 6: // IDYES
		buttonText = "Yes"
	case 7: // IDNO
		buttonText = "No"
	}

	return fmt.Sprintf("Message displayed, user clicked: %s", buttonText), nil
}
