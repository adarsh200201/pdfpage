#!/bin/bash
# Deploy PdfPage Docker to Render with LibreOffice support

echo "🐳 Deploying PdfPage Docker to Render..."

# 1. Build and tag your Docker image
docker build -t pdfpage-production .
docker tag pdfpage-production registry.render.com/your-app-name/pdfpage-app

# 2. Login to Render registry (get token from Render dashboard)
echo "Login to Render registry:"
echo "docker login registry.render.com"
echo "Username: your-render-username"
echo "Password: your-render-token"

# 3. Push to Render registry
echo "Push to Render:"
echo "docker push registry.render.com/your-app-name/pdfpage-app"

echo ""
echo "🔧 In Render Dashboard, update your service:"
echo "1. Go to your service: https://dashboard.render.com/web/srv-d1albm7gi27c73cqdc1g"
echo "2. Settings → Image URL: registry.render.com/your-app-name/pdfpage-app"
echo "3. Environment Variables:"
echo "   NODE_ENV=production"
echo "   LIBREOFFICE_AVAILABLE=true"
echo "   MONGODB_URI=your-mongodb-connection-string"
echo "   JWT_SECRET=your-jwt-secret"
echo "4. Deploy!"
