#!/bin/bash

echo "🚀 Starting production deployment for PdfPage..."

# Set production environment
export NODE_ENV=production

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install --legacy-peer-deps

echo "📦 Installing backend dependencies..."
cd backend && npm ci --only=production

echo "🏗️ Building frontend..."
cd ..
npm run build

echo "🔧 Setting up backend directories..."
mkdir -p backend/uploads backend/temp backend/logs
chmod 755 backend/uploads backend/temp backend/logs

echo "🔍 Verifying environment variables..."
if [ -z "$MONGODB_URI" ]; then
    echo "⚠️ Warning: MONGODB_URI not set"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️ Warning: JWT_SECRET not set"
fi

echo "🎯 Starting backend server..."
cd backend
npm start
