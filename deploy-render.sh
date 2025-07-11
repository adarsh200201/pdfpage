#!/bin/bash
# Deploy to Render.com

echo "🚀 Deploying PdfPage to Render..."

# Build and push Docker image to Docker Hub
docker build -t your-dockerhub-username/pdfpage-app .
docker push your-dockerhub-username/pdfpage-app

echo "✅ Docker image pushed to Docker Hub"
echo "🔧 Next steps:"
echo "1. Go to render.com and create new Web Service"
echo "2. Connect your GitHub repository"
echo "3. Use these settings:"
echo "   - Environment: Docker"
echo "   - Dockerfile path: ./Dockerfile"
echo "   - Port: 5000"
echo "4. Add environment variables:"
echo "   - NODE_ENV=production"
echo "   - MONGODB_URI=<your-mongodb-connection-string>"
echo "   - JWT_SECRET=<your-secure-jwt-secret>"
echo "   - ADMIN_EMAIL=<your-admin-email>"
