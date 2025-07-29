#!/bin/bash
# Deploy to Google Cloud Run

echo "🚀 Deploying PdfPage Backend to Google Cloud Run..."

# Set project configuration
PROJECT_ID="pdfpage-backend"
SERVICE_NAME="pdf-backend"
REGION="asia-south1"

# Build and deploy backend
echo "📦 Building and deploying backend..."
cd backend

# Build Docker image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 5000 \
  --memory 2Gi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production" \
  --project $PROJECT_ID

echo "✅ Backend deployed to: https://$SERVICE_NAME-935131444417.$REGION.run.app"

cd ..

# Build and deploy frontend to Netlify
echo "📦 Building frontend..."
npm install
npm run build

echo "🔧 Frontend built successfully!"
echo "📝 Next steps:"
echo "1. Deploy frontend dist/ folder to Netlify"
echo "2. Ensure environment variables are set in Google Cloud Run"
echo "3. Update DNS settings if needed"
echo "4. Test the OAuth flow"

echo "✅ Deployment script completed!"
