#!/bin/bash
# Deploy to DigitalOcean Droplet

echo "🌊 Deploying PdfPage to DigitalOcean..."

# SSH into your droplet (replace with your IP)
# ssh root@your-droplet-ip

# On the droplet, run these commands:
echo "Run these commands on your DigitalOcean droplet:"
echo ""
echo "# Install Docker"
echo "curl -fsSL https://get.docker.com -o get-docker.sh"
echo "sh get-docker.sh"
echo ""
echo "# Pull and run your app"
echo "docker pull your-dockerhub-username/pdfpage-app"
echo "docker run -d \\"
echo "  --name pdfpage-app \\"
echo "  -p 80:5000 \\"
echo "  -e NODE_ENV=production \\"
echo "  -e MONGODB_URI=\"mongodb+srv://user:pass@cluster.mongodb.net/pdfpage\" \\"
echo "  -e JWT_SECRET=\"your-jwt-secret\" \\"
echo "  --restart unless-stopped \\"
echo "  your-dockerhub-username/pdfpage-app"
echo ""
echo "# Setup reverse proxy (optional)"
echo "apt update && apt install nginx -y"
