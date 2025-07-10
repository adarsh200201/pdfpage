@echo off
echo Testing Docker setup...
echo.

echo 1. Building backend with LibreOffice...
cd backend
docker build -f Dockerfile.production -t pdfpage-backend .

if %errorlevel% neq 0 (
    echo Build failed! Check the error above.
    pause
    exit /b 1
)

echo.
echo 2. Testing bare Docker run...
docker run -d --name test-backend -p 5000:5000 -e NODE_ENV=development -e LIBREOFFICE_AVAILABLE=true pdfpage-backend

echo.
echo 3. Waiting for container to start...
timeout /t 10 /nobreak >nul

echo.
echo 4. Testing LibreOffice status...
curl http://localhost:5000/api/libreoffice/status

echo.
echo 5. Cleanup...
docker stop test-backend
docker rm test-backend

echo.
echo Test completed! If you saw LibreOffice status, it's working.
pause
