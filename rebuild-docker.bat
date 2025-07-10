@echo off
title PdfPage - Rebuild with Heavy Libraries

echo ================================
echo   🐳 Rebuilding PdfPage Docker
echo   📚 With Heavy Native Libraries
echo ================================
echo.

echo This will rebuild Docker with:
echo ✅ Ghostscript (PDF compression)
echo ✅ ImageMagick (Image processing)
echo ✅ Poppler Utils (PDF rendering)
echo ✅ Tesseract OCR (Text extraction)
echo ✅ QPDF (PDF manipulation)
echo ✅ LibreOffice (Document conversion)
echo ✅ Canvas/Cairo (Graphics rendering)
echo ✅ Multiple language OCR support
echo.

set /p choice=Continue with rebuild? (y/N): 
if /i "%choice%" neq "y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo 🛑 Stopping existing containers...
docker-compose down

echo.
echo 🗑️ Cleaning Docker cache...
docker system prune -f

echo.
echo 📦 Building with no cache (this may take 5-10 minutes)...
docker-compose build --no-cache

echo.
echo 🚀 Starting services...
docker-compose up -d

echo.
echo ⏳ Waiting for services to initialize...
timeout /t 30 /nobreak >nul

echo.
echo 🔍 Testing library availability...
echo.
echo Ghostscript:
docker exec pdfpage-backend ghostscript --version 2>nul || echo "  ❌ Not available"

echo.
echo ImageMagick:
docker exec pdfpage-backend convert --version 2>nul || echo "  ❌ Not available"

echo.
echo LibreOffice:
docker exec pdfpage-backend libreoffice --version 2>nul || echo "  ❌ Not available"

echo.
echo Tesseract OCR:
docker exec pdfpage-backend tesseract --version 2>nul || echo "  ❌ Not available"

echo.
echo 🌐 Testing API endpoints...
curl -s http://localhost:5000/api/health
echo.
curl -s http://localhost:5000/api/libreoffice/status

echo.
echo ================================
echo   ✅ Rebuild Complete!
echo ================================
echo.
echo 🌐 Frontend:     http://localhost:3000
echo 🔧 Backend:      http://localhost:5000
echo 📊 Health:       http://localhost:5000/api/health
echo 📚 LibreOffice:  http://localhost:5000/api/libreoffice/status
echo.
echo 📋 View logs:    docker-compose logs -f
echo 📋 Stop:         docker-compose down
echo.

set /p open=Open browser? (y/N): 
if /i "%open%" equ "y" (
    start http://localhost:3000
)

echo.
echo Press any key to view logs...
pause >nul
docker-compose logs -f
