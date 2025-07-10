@echo off
echo 🚀 PdfPage - Comprehensive Docker Setup
echo =======================================

if "%1"=="" goto HELP
if "%1"=="start" goto START
if "%1"=="stop" goto STOP
if "%1"=="build" goto BUILD
if "%1"=="logs" goto LOGS
if "%1"=="clean" goto CLEAN
if "%1"=="restart" goto RESTART
goto HELP

:START
echo 🐳 Starting PdfPage with all libraries...
docker-compose -f docker-compose.comprehensive.yml up -d
echo.
echo ✅ PdfPage is starting up!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo 📊 MongoDB: localhost:27017
echo.
echo Use 'docker-run.bat logs' to see logs
goto END

:STOP
echo 🛑 Stopping PdfPage...
docker-compose -f docker-compose.comprehensive.yml down
echo ✅ PdfPage stopped!
goto END

:BUILD
echo 🔨 Building PdfPage with all libraries (this may take 10-15 minutes)...
docker-compose -f docker-compose.comprehensive.yml build --no-cache
echo ✅ Build completed!
goto END

:LOGS
echo 📋 PdfPage logs (Press Ctrl+C to exit):
docker-compose -f docker-compose.comprehensive.yml logs -f
goto END

:CLEAN
echo 🧹 Cleaning Docker system...
docker-compose -f docker-compose.comprehensive.yml down -v
docker system prune -f
docker volume prune -f
echo ✅ Cleanup completed!
goto END

:RESTART
echo 🔄 Restarting PdfPage...
docker-compose -f docker-compose.comprehensive.yml down
docker-compose -f docker-compose.comprehensive.yml up -d
echo ✅ PdfPage restarted!
goto END

:HELP
echo Usage: docker-run.bat [command]
echo.
echo Commands:
echo   start     - Start PdfPage (builds if needed)
echo   stop      - Stop PdfPage
echo   build     - Build images with all libraries
echo   logs      - View real-time logs
echo   clean     - Clean all Docker data
echo   restart   - Restart PdfPage
echo.
echo Examples:
echo   docker-run.bat start     ^<-- Start everything
echo   docker-run.bat logs      ^<-- View logs
echo   docker-run.bat stop      ^<-- Stop everything

:END
