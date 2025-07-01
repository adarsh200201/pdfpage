@echo off
echo Stopping any existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Waiting 2 seconds...
timeout /T 2 /NOBREAK >nul

echo Starting backend server...
cd backend
start "Backend Server" npm start

echo Backend restart initiated!
echo Check the new window for backend logs.
pause
