#!/bin/bash

echo "🚀 U²-Net Background Removal - Quick Start"
echo "==========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "🤔 Choose deployment option:"
echo "1) Fast Demo (Simple OpenCV - builds in 2-3 minutes)"
echo "2) CPU-Only U²-Net (Medium - builds in 10-15 minutes)"
echo "3) Full U²-Net with model download (Slow - 20+ minutes)"
echo ""
read -p "Enter your choice (1, 2, or 3): " choice

case $choice in
    1)
        echo "🚀 Starting Fast Demo Mode..."
        echo "This uses simple OpenCV processing for quick testing"
        
        # Create simple dockerfile for demo
        cat > Dockerfile.demo << 'EOF'
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    flask==3.0.0 \
    flask-cors==4.0.0 \
    pillow==10.0.0 \
    numpy==1.24.3 \
    opencv-python-headless==4.8.0.74

COPY app_simple.py app.py

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["python", "app.py"]
EOF
        
        echo "🐳 Building demo image..."
        docker build -f Dockerfile.demo -t u2net-demo .
        
        echo "🚀 Starting demo service..."
        docker run -d -p 5001:5000 --name u2net-demo u2net-demo
        
        sleep 5
        
        if curl -f http://localhost:5001/health > /dev/null 2>&1; then
            echo "✅ Demo service is running!"
            echo "🌐 Available at: http://localhost:5001"
            echo "📝 Note: This is a basic demo using OpenCV"
        else
            echo "❌ Demo service failed to start"
            docker logs u2net-demo
        fi
        ;;
        
    2)
        echo "🚀 Starting CPU-Only U²-Net..."
        echo "This will download a 23MB model and use real U²-Net"
        
        docker-compose -f docker-compose.fast.yml up -d
        
        echo "⏳ Waiting for service to start and download model..."
        sleep 30
        
        if curl -f http://localhost:5001/health > /dev/null 2>&1; then
            echo "✅ CPU U²-Net service is running!"
            echo "🌐 Available at: http://localhost:5001"
        else
            echo "❌ Service failed to start, checking logs..."
            docker-compose -f docker-compose.fast.yml logs
        fi
        ;;
        
    3)
        echo "🚀 Starting Full U²-Net Service..."
        echo "⚠️  This may take 20+ minutes due to large downloads"
        
        docker-compose up -d
        
        echo "⏳ Building and starting (this will take a while)..."
        echo "💡 You can check progress with: docker-compose logs -f"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1, 2, or 3."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup initiated!"
echo ""
echo "📚 Quick test commands:"
echo "  Health check: curl http://localhost:5001/health"
echo "  Test upload:  curl -X POST -F 'image=@test.jpg' http://localhost:5001/remove-bg"
echo ""
echo "🔗 Integration with backend:"
echo "  Set: U2NET_SERVICE_URL=http://localhost:5001"
echo ""
echo "📋 Management commands:"
echo "  View logs:    docker logs u2net-demo  (for demo)"
echo "  Stop:         docker stop u2net-demo  (for demo)"
echo "  Remove:       docker rm u2net-demo    (for demo)"
echo "  Compose logs: docker-compose logs     (for full version)"
echo "  Compose stop: docker-compose down     (for full version)"
