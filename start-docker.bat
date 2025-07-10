@echo off
title PdfPage Docker Setup

echo ================================
echo   🐳 PdfPage Docker Setup
echo ================================
echo.

echo 🔍 Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✅ Docker is available

echo.
echo 🔍 Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available
    pause
    exit /b 1
)
echo ✅ Docker Compose is available

echo.
echo 🚀 Starting PdfPage application...
echo This will:
echo   - Build backend with LibreOffice support
echo   - Build frontend with hot reload
echo   - Start MongoDB database
echo   - Start Redis cache
echo.

set /p choice=Continue? (y/N): 
if /i "%choice%" neq "y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo 📦 Building and starting services...
docker-compose up --build -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo 🔍 Checking service health...
docker-compose ps

echo.
echo ================================
echo   ✅ PdfPage is now running!
echo ================================
echo.
echo 🌐 Frontend:     http://localhost:3000
echo 🔧 Backend API:  http://localhost:5000
echo 📊 Health Check: http://localhost:5000/api/health
echo 📚 LibreOffice:  http://localhost:5000/api/libreoffice/status
echo 🗄️  MongoDB:     localhost:27017
echo.
echo 📋 Useful commands:
echo   View logs:      docker-compose logs -f
echo   Stop services:  docker-compose down
echo   Restart:        docker-compose restart
echo.
echo 🔧 Testing LibreOffice conversion:
echo   curl -X POST http://localhost:5000/api/libreoffice/status
echo.

set /p open=Open browser? (y/N): 
if /i "%open%" equ "y" (
    start http://localhost:3000
)

echo.
echo Press any key to view logs (Ctrl+C to exit)...
pause >nul
docker-compose logs -f
