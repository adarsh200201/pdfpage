# Production Docker Commands for PdfPage

## Quick Start

```bash
# Make script executable
chmod +x docker-production.sh

# Build production images
./docker-production.sh build

# Deploy to production
./docker-production.sh deploy
```

## Available Commands

### 1. Build Production Images

```bash
./docker-production.sh build
```

- Builds optimized backend and frontend images
- Uses multi-stage builds for smaller image sizes
- Includes all necessary production dependencies

### 2. Deploy Production Environment

```bash
./docker-production.sh deploy
```

- Creates production docker-compose configuration
- Sets up MongoDB, backend, frontend, and nginx
- Includes resource limits and health checks
- Auto-restart policies for reliability

### 3. Scale for High Traffic

```bash
./docker-production.sh scale
```

- Scales backend to 3 instances
- Scales frontend to 2 instances
- Load balancing handled by nginx

### 4. Monitor Logs

```bash
./docker-production.sh logs
```

- Shows real-time logs from all services
- Tail last 100 lines for quick debugging

### 5. Health Check

```bash
./docker-production.sh health
```

- Checks backend API health endpoint
- Checks frontend availability
- Shows container status

### 6. Backup Data

```bash
./docker-production.sh backup
```

- Creates timestamped backup directory
- Backs up MongoDB database
- Backs up uploaded files and temporary data

### 7. Clean System

```bash
./docker-production.sh clean
```

- Removes unused Docker images
- Cleans up stopped containers
- Frees disk space

## Manual Docker Commands

### Build Individual Images

```bash
# Backend
cd backend
docker build -f Dockerfile.production -t pdfpage-backend:latest .

# Frontend (production optimized)
docker build -f Dockerfile.frontend.prod -t pdfpage-frontend:latest .
```

### Run Individual Containers

```bash
# MongoDB
docker run -d --name mongo \
  -p 27017:27017 \
  -v mongo_data:/data/db \
  mongo:7

# Backend
docker run -d --name backend \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://mongo:27017/pdfpage \
  --link mongo:mongo \
  pdfpage-backend:latest

# Frontend
docker run -d --name frontend \
  -p 80:80 \
  --link backend:backend \
  pdfpage-frontend:latest
```

### Docker Compose Commands

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes
docker-compose -f docker-compose.prod.yml down -v
```

## Environment Variables

Create `.env` file for production:

```bash
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret
MONGODB_URI=mongodb://mongo:27017/pdfpage
```

## Production Optimizations

- **Multi-stage builds** for smaller images
- **Resource limits** to prevent container overuse
- **Health checks** for automatic restart
- **Nginx reverse proxy** for better performance
- **Gzip compression** for faster loading
- **Static file caching** for reduced bandwidth
- **Security headers** for protection
- **Non-root users** for security

## Monitoring

Check container health:

```bash
docker ps
docker stats
docker logs <container_name>
```

## Backup & Recovery

```bash
# Create backup
./docker-production.sh backup

# Restore from backup
docker run --rm -v pdfpage_mongo_data:/data -v $(pwd)/backup-20240101-120000:/backup alpine tar xzf /backup/mongo_data.tar.gz -C /data
```
