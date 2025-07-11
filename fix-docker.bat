@echo off
echo Checking Docker Desktop status...

:: Check if Docker Desktop is running
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Docker Desktop is running
) else (
    echo Docker Desktop is not running - starting it...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker Desktop to start...
    timeout /t 30 /nobreak > nul
)

:: Test Docker connection
echo Testing Docker connection...
docker version
if %errorlevel% equ 0 (
    echo Docker is working correctly!
    echo You can now run: docker build -t pdfpage-app .
) else (
    echo Docker is still not responding. Try:
    echo 1. Restart your computer
    echo 2. Reinstall Docker Desktop
    echo 3. Run as Administrator
)

pause
