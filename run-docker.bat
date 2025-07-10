@echo off
echo 🐳 Building PdfPage Docker containers...

echo 📦 Building backend with LibreOffice...
cd backend
docker build -f Dockerfile.production -t pdfpage-backend .
cd ..

echo 📦 Building frontend...
docker build -f Dockerfile.frontend -t pdfpage-frontend .

echo 🚀 Starting backend with LibreOffice...
docker run -d --name pdfpage-backend ^
  -p 5000:5000 ^
  -e NODE_ENV=development ^
  -e LIBREOFFICE_AVAILABLE=true ^
  -e LIBREOFFICE_HEADLESS=true ^
  -e MONGODB_URI=mongodb://host.docker.internal:27017/pdfpage ^
  -e JWT_SECRET=your-development-jwt-secret ^
  -e SESSION_SECRET=your-development-session-secret ^
  pdfpage-backend

echo 🚀 Starting frontend...
docker run -d --name pdfpage-frontend ^
  -p 3000:3000 ^
  -e VITE_API_URL=http://localhost:5000/api ^
  pdfpage-frontend

echo ✅ PdfPage is running with LibreOffice support!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo.
echo To stop containers:
echo docker stop pdfpage-backend pdfpage-frontend
echo docker rm pdfpage-backend pdfpage-frontend
pause
