@echo off
echo ========================================
echo PDFPage.in - Quick Start Script
echo ========================================
echo.

echo Starting Backend Server on Port 5002...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Dev Server...
start "Frontend Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Both servers are starting...
echo.
echo Backend: http://localhost:5002
echo Frontend: http://localhost:48752 (or the port shown in terminal)
echo.
echo Close this window when you're done.
echo ========================================
