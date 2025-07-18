#!/bin/bash

echo "🚀 Setting up U²-Net Background Removal Service"
echo "=============================================="

# Create necessary directories
mkdir -p saved_models
mkdir -p logs

# Download U²-Net pre-trained models
echo "📥 Downloading U²-Net pre-trained models..."

# Main U²-Net model (320x320)
if [ ! -f "saved_models/u2net.pth" ]; then
    echo "Downloading u2net.pth..."
    wget -O saved_models/u2net.pth \
        https://github.com/xuebinqin/U-2-Net/releases/download/v1.0/u2net.pth
    echo "✅ Downloaded u2net.pth"
else
    echo "✅ u2net.pth already exists"
fi

# Human segmentation model (optional, for better portrait results)
echo "📥 Do you want to download the human segmentation model? (y/n)"
read -r download_human_seg

if [ "$download_human_seg" = "y" ] || [ "$download_human_seg" = "Y" ]; then
    if [ ! -f "saved_models/u2net_human_seg.pth" ]; then
        echo "Downloading u2net_human_seg.pth..."
        wget -O saved_models/u2net_human_seg.pth \
            https://github.com/xuebinqin/U-2-Net/releases/download/v1.0/u2net_human_seg.pth
        echo "✅ Downloaded u2net_human_seg.pth"
    else
        echo "✅ u2net_human_seg.pth already exists"
    fi
fi

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t u2net-bg-removal .

# Check if Docker Compose is available
if command -v docker-compose &> /dev/null; then
    echo "🚀 Starting U²-Net service with Docker Compose..."
    docker-compose up -d
    
    # Wait for service to be ready
    echo "⏳ Waiting for service to be ready..."
    sleep 10
    
    # Health check
    echo "🔍 Checking service health..."
    if curl -f http://localhost:5001/health > /dev/null 2>&1; then
        echo "✅ U²-Net service is running successfully!"
        echo "🌐 Service available at: http://localhost:5001"
        echo "📋 API endpoints:"
        echo "   - Health: http://localhost:5001/health"
        echo "   - Models: http://localhost:5001/models"
        echo "   - Remove BG: POST http://localhost:5001/remove-bg"
    else
        echo "❌ Service health check failed"
        echo "📋 Check logs with: docker-compose logs u2net-bg-removal"
    fi
else
    echo "🐳 Docker Compose not found. Run manually with:"
    echo "   docker run -d -p 5001:5000 --name u2net-bg-removal u2net-bg-removal"
fi

echo ""
echo "🎉 Setup complete!"
echo "💡 To integrate with your backend, set environment variable:"
echo "   U2NET_SERVICE_URL=http://localhost:5001"
echo ""
echo "📚 Usage examples:"
echo "   curl -X POST -F 'image=@test.jpg' http://localhost:5001/remove-bg"
echo "   curl -X POST -F 'image=@test.jpg' -F 'model=person' http://localhost:5001/remove-bg"
