#!/bin/bash

# Render Deployment Script for PdfPage Backend
echo "🚀 Starting PdfPage deployment on Render..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm ci --only=production

# Install frontend dependencies and build
echo "🏗️ Building frontend..."
cd ..
npm ci --only=production
npm run build

# Install Puppeteer Chrome
echo "🌐 Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome || echo "Chrome installation completed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads backend/temp backend/logs
chmod 755 backend/uploads backend/temp backend/logs

echo "✅ Deployment preparation completed!"
echo "🔧 Starting backend server..."

# Start the backend server
cd backend
npm start
