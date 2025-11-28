#!/bin/bash
# Sentinel Implant Build Script
# Uso: ./build.sh [OPTIONS]
#
# Opções:
#   -s, --server URL    URL do servidor C2 (default: ws://localhost:8080/ws-sentinel)
#   -p, --psk KEY       Chave PSK de autenticação (default: SENTINEL_PROJECT_V1_SECRET_KEY)
#   -o, --output FILE   Nome do arquivo de saída (default: sentinel-implant.exe)
#   -d, --debug         Build com símbolos de debug (sem otimizações)
#   -g, --gui           Remover janela de console (modo GUI)
#   -h, --help          Mostrar esta ajuda

set -e

# Valores padrão
SERVER_URL="ws://localhost:8080/ws-sentinel"
PSK="SENTINEL_PROJECT_V1_SECRET_KEY"
OUTPUT="sentinel-implant.exe"
DEBUG=false
GUI=false

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--server)
            SERVER_URL="$2"
            shift 2
            ;;
        -p|--psk)
            PSK="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -g|--gui)
            GUI=true
            shift
            ;;
        -h|--help)
            head -20 "$0" | tail -15
            exit 0
            ;;
        *)
            echo "Opção desconhecida: $1"
            exit 1
            ;;
    esac
done

echo "============================================"
echo "  Sentinel Implant Builder"
echo "============================================"
echo ""
echo "Configuração:"
echo "  Server: $SERVER_URL"
echo "  PSK:    ${PSK:0:10}..."
echo "  Output: $OUTPUT"
echo "  Debug:  $DEBUG"
echo "  GUI:    $GUI"
echo ""

# Construir ldflags
LDFLAGS=""

if [ "$DEBUG" = false ]; then
    # Otimizações de produção
    LDFLAGS="-s -w"
fi

if [ "$GUI" = true ]; then
    # Remover janela de console
    LDFLAGS="$LDFLAGS -H windowsgui"
fi

# Injetar configurações
LDFLAGS="$LDFLAGS -X 'sentinel-implant/config.serverURL=$SERVER_URL'"
LDFLAGS="$LDFLAGS -X 'sentinel-implant/config.psk=$PSK'"

echo "Building for Windows x64..."
echo ""

# Build
GOOS=windows GOARCH=amd64 go build -ldflags="$LDFLAGS" -o "$OUTPUT" .

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build concluído com sucesso!"
    echo ""
    echo "Arquivo gerado: $OUTPUT"
    echo "Tamanho: $(du -h "$OUTPUT" | cut -f1)"
    echo ""
    
    # Calcular hash
    if command -v sha256sum &> /dev/null; then
        echo "SHA256: $(sha256sum "$OUTPUT" | cut -d' ' -f1)"
    fi
else
    echo ""
    echo "✗ Falha no build!"
    exit 1
fi
