@echo off
echo Starting PdfPage in production Docker container...

:: Stop any existing container
docker stop pdfpage-container 2>nul
docker rm pdfpage-container 2>nul

:: Run the newly built image
docker run -d ^
  --name pdfpage-container ^
  -p 5000:5000 ^
  -e NODE_ENV=production ^
  -e MONGODB_URI=mongodb://localhost:27017/pdfpage ^
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production ^
  pdfpage-app:latest

echo Container started! The app should be available at:
echo Backend API: http://localhost:5000
echo.
echo To check logs: docker logs pdfpage-container
echo To stop: docker stop pdfpage-container
echo.

:: Show initial logs
timeout /t 5 /nobreak > nul
echo Initial container logs:
docker logs pdfpage-container

pause
