# 🐳 Docker Commands for PdfPage

## Quick Start (Recommended)

### Option 1: Docker Compose (Everything together)

```bash
# Start all services (backend + frontend + database)
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Clean up everything
docker-compose down -v --rmi all
```

## Individual Service Commands

### Option 2: Run Backend Only

```bash
# Build backend with LibreOffice
cd backend
docker build -f Dockerfile.production -t pdfpage-backend .

# Run backend (need MongoDB separately)
docker run -p 5000:5000 \
  -e NODE_ENV=development \
  -e LIBREOFFICE_AVAILABLE=true \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/pdfpage \
  -e JWT_SECRET=your-secret \
  pdfpage-backend
```

### Option 3: Run Frontend Only

```bash
# Build frontend
docker build -f Dockerfile.frontend -t pdfpage-frontend .

# Run frontend
docker run -p 3000:3000 \
  -e VITE_API_URL=http://localhost:5000/api \
  pdfpage-frontend
```

## 🚀 Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health
- **LibreOffice Status**: http://localhost:5000/api/libreoffice/status
- **MongoDB**: localhost:27017

## 🔧 Environment Variables

Create `.env` file in root directory:

```bash
# Backend Configuration
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://mongo:27017/pdfpage
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-key-here

# Frontend Configuration
VITE_API_URL=http://localhost:5000/api

# LibreOffice Configuration
LIBREOFFICE_AVAILABLE=true
LIBREOFFICE_HEADLESS=true
```

## 🛠 Development Tips

### View Container Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild After Changes

```bash
# Rebuild specific service
docker-compose up --build backend

# Rebuild everything
docker-compose up --build
```

### Database Management

```bash
# Connect to MongoDB
docker exec -it pdfpage-mongodb mongosh

# Backup database
docker exec pdfpage-mongodb mongodump --out /backup

# View database files
docker exec -it pdfpage-mongodb ls /data/db
```

### Cleanup Commands

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Nuclear option (removes everything)
docker system prune -a --volumes
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find what's using port 3000
netstat -tulpn | grep :3000

# Kill process using port
sudo fuser -k 3000/tcp
```

### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### LibreOffice Not Working

```bash
# Check LibreOffice in container
docker exec -it pdfpage-backend libreoffice --version

# Check LibreOffice service status
curl http://localhost:5000/api/libreoffice/status
```

### Database Connection Issues

```bash
# Check MongoDB logs
docker-compose logs mongo

# Test database connection
docker exec -it pdfpage-mongodb mongosh --eval "db.adminCommand('ismaster')"
```

## 📊 Test LibreOffice Conversions

Once running, test the new LibreOffice endpoints:

```bash
# Test DOCX to PDF conversion
curl -X POST \
  http://localhost:5000/api/libreoffice/docx-to-pdf \
  -F "file=@test.docx" \
  -F "quality=premium" \
  --output converted.pdf

# Test PDF to DOCX conversion
curl -X POST \
  http://localhost:5000/api/libreoffice/pdf-to-docx \
  -F "file=@test.pdf" \
  --output converted.docx

# Check LibreOffice status
curl http://localhost:5000/api/libreoffice/status
```
