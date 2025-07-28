#!/bin/bash

# 🚀 Deploy PdfPage Backend to Google Cloud Run
set -e

echo "🚀 Deploying PdfPage Backend to Google Cloud Run..."

# Configuration
PROJECT_ID="elite-hangar-467115-g2"
SERVICE_NAME="pdfpage-backend"
REGION="asia-south1"

echo "📝 Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Service Name: $SERVICE_NAME"
echo "   Region: $REGION"

# Step 1: Enable required APIs
echo ""
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project=$PROJECT_ID

# Step 2: Set project
echo ""
echo "🎯 Setting active project..."
gcloud config set project $PROJECT_ID

# Step 3: Deploy to Cloud Run using source
echo ""
echo "🚀 Deploying backend to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --dockerfile Dockerfile.cloudrun \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 100 \
  --max-instances 10 \
  --port 8080 \
  --set-env-vars "NODE_ENV=production,MONGODB_URI=$MONGODB_URI,JWT_SECRET=$JWT_SECRET,FRONTEND_URL=https://pdfpage.in" \
  --project=$PROJECT_ID

# Step 4: Get the service URL
echo ""
echo "🔗 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format="value(status.url)" \
  --project=$PROJECT_ID)

echo ""
echo "✅ Backend deployment completed successfully!"
echo "🌐 Backend URL: $SERVICE_URL"
echo ""
echo "🧪 Test endpoints:"
echo "   Health check: $SERVICE_URL/api/health"
echo "   CORS test: $SERVICE_URL/api/test-cors"
echo "   Full API: $SERVICE_URL/api/*"
echo ""
echo "🔧 Service configuration:"
echo "   Memory: 2GB"
echo "   CPU: 2 vCPUs"
echo "   Timeout: 900 seconds"
echo "   Max instances: 10"
echo "   Authentication: Public"
echo ""
echo "📝 Next steps:"
echo "   1. Update your frontend to use: $SERVICE_URL/api"
echo "   2. Set environment variables for MongoDB and JWT"
echo "   3. Test all API endpoints"
echo ""
