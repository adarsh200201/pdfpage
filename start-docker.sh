#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================"
echo "  🐳 PdfPage Docker Setup"
echo "================================"
echo

# Check if Docker is installed
echo "🔍 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✅ Docker is available${NC}"

# Check if Docker Compose is available
echo "🔍 Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose is available${NC}"

echo
echo "🚀 Starting PdfPage application..."
echo "This will:"
echo "  - Build backend with LibreOffice support"
echo "  - Build frontend with hot reload"
echo "  - Start MongoDB database"
echo "  - Start Redis cache"
echo

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

echo
echo "📦 Building and starting services..."
docker-compose up --build -d

echo
echo "⏳ Waiting for services to start..."
sleep 10

echo
echo "🔍 Checking service health..."
docker-compose ps

echo
echo "================================"
echo -e "  ${GREEN}✅ PdfPage is now running!${NC}"
echo "================================"
echo
echo -e "${BLUE}🌐 Frontend:${NC}     http://localhost:3000"
echo -e "${BLUE}🔧 Backend API:${NC}  http://localhost:5000"
echo -e "${BLUE}📊 Health Check:${NC} http://localhost:5000/api/health"
echo -e "${BLUE}📚 LibreOffice:${NC}  http://localhost:5000/api/libreoffice/status"
echo -e "${BLUE}🗄️  MongoDB:${NC}     localhost:27017"
echo
echo "📋 Useful commands:"
echo "  View logs:      docker-compose logs -f"
echo "  Stop services:  docker-compose down"
echo "  Restart:        docker-compose restart"
echo
echo "🔧 Testing LibreOffice conversion:"
echo "  curl -X POST http://localhost:5000/api/libreoffice/status"
echo

read -p "Open browser? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open &> /dev/null; then
        open http://localhost:3000
    else
        echo "Please open http://localhost:3000 manually"
    fi
fi

echo
echo "Press Enter to view logs (Ctrl+C to exit)..."
read
docker-compose logs -f
