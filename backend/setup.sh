#!/bin/bash

echo "🚀 Setting up PdfPage Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env 2>/dev/null || echo "Please create .env file manually"
fi

# Make sure logs directory exists
mkdir -p logs

echo "🎉 Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your credentials"
echo "2. Run 'npm run dev' to start development server"
echo "3. Run 'npm start' to start production server"
echo ""
echo "API will be available at: http://localhost:5000"
echo "Health check: http://localhost:5000/api/health"
echo ""
echo "Happy coding! 💻"
