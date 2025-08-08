#!/bin/bash

echo "🚀 Starting U²-Net Background Removal Service"
echo "============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "📍 Current directory: $(pwd)"

# Navigate to u2net-service directory
if [ ! -d "u2net-service" ]; then
    echo "❌ u2net-service directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

cd u2net-service

echo "🔍 Checking for existing U²-Net service..."

# Stop existing containers
if docker ps -q --filter "name=u2net" | grep -q .; then
    echo "🛑 Stopping existing U²-Net containers..."
    docker stop $(docker ps -q --filter "name=u2net")
    docker rm $(docker ps -a -q --filter "name=u2net")
fi

# Check if models exist
if [ ! -f "saved_models/u2net.pth" ]; then
    echo "📦 U²-Net model not found. Creating models directory..."
    mkdir -p saved_models
    
    echo "⬇️ Downloading U²-Net model (this may take a few minutes)..."
    wget -O saved_models/u2net.pth \
        https://github.com/xuebinqin/U-2-Net/releases/download/v1.0/u2net.pth
    
    if [ $? -eq 0 ]; then
        echo "✅ U²-Net model downloaded successfully"
    else
        echo "❌ Failed to download U²-Net model"
        exit 1
    fi
else
    echo "✅ U²-Net model already exists"
fi

echo "🐳 Building U²-Net Docker image..."
docker build -f Dockerfile.production -t u2net-ai .

if [ $? -ne 0 ]; then
    echo "❌ Failed to build Docker image"
    exit 1
fi

echo "🚀 Starting U²-Net AI service..."
docker run -d \
    --name u2net-ai \
    -p 5001:5000 \
    -v $(pwd)/saved_models:/app/saved_models \
    --restart unless-stopped \
    u2net-ai

if [ $? -eq 0 ]; then
    echo "✅ U²-Net service started successfully!"
    echo ""
    echo "🔗 Service URL: http://localhost:5001"
    echo "🩺 Health check: curl http://localhost:5001/health"
    echo "📋 View logs: docker logs -f u2net-ai"
    echo ""
    echo "⏳ Waiting for service to be ready..."
    
    # Wait for service to be healthy
    for i in {1..30}; do
        if curl -s http://localhost:5001/health > /dev/null 2>&1; then
            echo "✅ U²-Net service is ready!"
            echo ""
            echo "🔧 Backend configuration:"
            echo "   Add to your backend .env file:"
            echo "   U2NET_SERVICE_URL=http://localhost:5001"
            echo ""
            echo "🧪 Test the service:"
            echo "   Visit: http://localhost:3000/img/remove-bg"
            break
        fi
        echo "⏳ Waiting for service... ($i/30)"
        sleep 2
    done
    
    if [ $i -eq 30 ]; then
        echo "⚠️ Service may not be fully ready yet. Check logs:"
        echo "   docker logs u2net-ai"
    fi
else
    echo "❌ Failed to start U²-Net service"
    exit 1
fi
