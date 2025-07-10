@echo off
echo Testing Docker setup with heavy libraries...
echo.

echo 1. Building backend with all native libraries...
cd backend
docker build -f Dockerfile.production -t pdfpage-backend-full .

if %errorlevel% neq 0 (
    echo Build failed! Check the error above.
    pause
    exit /b 1
)

echo.
echo 2. Testing container with library verification...
docker run -d --name test-libs -p 5000:5000 -e NODE_ENV=development -e LIBREOFFICE_AVAILABLE=true pdfpage-backend-full

echo.
echo 3. Waiting for container to start...
timeout /t 15 /nobreak >nul

echo.
echo 4. Testing installed libraries...
echo Testing Ghostscript...
docker exec test-libs ghostscript --version

echo.
echo Testing ImageMagick...
docker exec test-libs convert --version

echo.
echo Testing Poppler utilities...
docker exec test-libs pdftoppm -v

echo.
echo Testing Tesseract OCR...
docker exec test-libs tesseract --version

echo.
echo Testing QPDF...
docker exec test-libs qpdf --version

echo.
echo Testing LibreOffice...
docker exec test-libs libreoffice --version

echo.
echo 5. Testing API endpoints...
curl http://localhost:5000/api/health
echo.
curl http://localhost:5000/api/libreoffice/status

echo.
echo 6. Cleanup...
docker stop test-libs
docker rm test-libs

echo.
echo Library test completed! All libraries should be available.
pause
