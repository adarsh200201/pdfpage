@echo off
setlocal

cd /d "%~dp0"

:: Start the frontend server if not already running
tasklist /FI "WINDOWTITLE eq npm*" | find /i "node.exe" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    start "Frontend Server" cmd /k "cd /d "%~dp0" && npm run dev"
    timeout /t 5 /nobreak >nul
)

:: Start Builder.io dev tools
start "Builder.io Dev Tools" cmd /k "cd /d "%~dp0" && npx @builder.io/dev-tools@latest"

endlocal
