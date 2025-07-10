#!/bin/bash

echo "🐳 Building PdfPage Docker containers..."

# Build the backend Docker image
echo "📦 Building backend with LibreOffice..."
cd backend
docker build -f Dockerfile.production -t pdfpage-backend .
cd ..

# Create a docker-compose.yml for easy local development
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.production
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - LIBREOFFICE_AVAILABLE=true
      - LIBREOFFICE_HEADLESS=true
      - MONGODB_URI=mongodb://mongo:27017/pdfpage
      - JWT_SECRET=your-development-jwt-secret
      - SESSION_SECRET=your-development-session-secret
    volumes:
      - ./backend:/usr/src/app
      - /usr/src/app/node_modules
    depends_on:
      - mongo
    command: npm run dev

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5000/api
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=pdfpage

volumes:
  mongo_data:
EOF

echo "🚀 Starting all services with Docker Compose..."
docker-compose up --build

echo "✅ PdfPage is running with LibreOffice support!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo "📊 MongoDB: localhost:27017"
