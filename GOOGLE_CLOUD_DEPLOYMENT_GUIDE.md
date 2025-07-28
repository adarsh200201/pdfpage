# 🚀 Complete Google Cloud Deployment Guide

This guide covers deploying both your Node.js backend and U²-Net AI service to Google Cloud.

## 🎯 Overview

You'll deploy:
1. **Main Backend** (Node.js/Express) → Google Cloud Run
2. **U²-Net AI Service** (Python/Flask) → Google Cloud Run  
3. **Frontend** (React) → Netlify/Vercel (already done)

## 📋 Prerequisites

### 1. Install Google Cloud CLI
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
source ~/.bashrc

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 2. Authenticate and Setup
```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project elite-hangar-467115-g2

# Enable billing (required for Cloud Run)
# Go to: https://console.cloud.google.com/billing
```

### 3. Set Environment Variables
```bash
# Required for backend deployment
export MONGODB_URI="your_mongodb_connection_string"
export JWT_SECRET="your_jwt_secret_key"
```

## 🚀 Deploy Node.js Backend

### Option 1: Quick Deploy (Recommended)
```bash
cd backend

# Deploy directly from source
gcloud run deploy pdfpage-backend \
  --source . \
  --dockerfile Dockerfile.cloudrun \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --port 8080 \
  --set-env-vars "NODE_ENV=production,MONGODB_URI=$MONGODB_URI,JWT_SECRET=$JWT_SECRET,FRONTEND_URL=https://pdfpage.in"
```

### Option 2: Use Deployment Script
```bash
cd backend
chmod +x deploy-backend-cloudrun.sh
./deploy-backend-cloudrun.sh
```

## 🤖 Deploy U²-Net AI Service

### Option 1: Quick Deploy
```bash
cd u2net-service

# Deploy U²-Net service
gcloud run deploy pdfpage-u2net \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1 \
  --timeout 300 \
  --port 8080
```

### Option 2: Use Deployment Script
```bash
cd u2net-service
chmod +x deploy-to-cloud-run.sh
./deploy-to-cloud-run.sh
```

## 🔧 Configuration Details

### Backend Service Specs:
- **Memory**: 2GB (for PDF processing)
- **CPU**: 2 vCPUs
- **Timeout**: 900 seconds (15 minutes)
- **Concurrency**: 100 requests per instance
- **Max Instances**: 10
- **Port**: 8080

### U²-Net Service Specs:
- **Memory**: 2GB (for AI model)
- **CPU**: 1 vCPU
- **Timeout**: 300 seconds (5 minutes)
- **Concurrency**: 10 requests per instance
- **Max Instances**: 5
- **Port**: 8080

## 🌐 Expected URLs

After deployment, you'll get URLs like:
- **Backend**: `https://pdfpage-backend-[hash]-uc.a.run.app`
- **U²-Net**: `https://pdfpage-u2net-[hash]-uc.a.run.app`

## 🧪 Testing Deployment

### Test Backend
```bash
# Health check
curl https://your-backend-url/api/health

# Test CORS
curl https://your-backend-url/api/test-cors

# Test a PDF operation
curl -X POST -F "file=@test.pdf" https://your-backend-url/api/pdf/compress
```

### Test U²-Net
```bash
# Health check
curl https://your-u2net-url/health

# Test background removal
curl -X POST -F "image=@test.jpg" https://your-u2net-url/remove-bg --output result.png
```

## 🔗 Frontend Integration

Update your frontend API configuration to use the new Cloud Run URLs:

```typescript
// In your frontend api-config.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://pdfpage-backend-[your-hash]-uc.a.run.app/api'
  : 'http://localhost:5000/api';

const AI_SERVICE_URL = process.env.NODE_ENV === 'production'
  ? 'https://pdfpage-u2net-[your-hash]-uc.a.run.app'
  : 'http://localhost:5000';
```

## 💰 Cost Estimation

Google Cloud Run pricing (approximate):
- **Backend**: ~$10-30/month (depends on usage)
- **U²-Net**: ~$5-15/month (depends on AI usage)
- **Free tier**: 2 million requests/month

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Google Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - id: 'auth'
        uses: 'google-github-actions/auth@v1'
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'
      
      - name: Deploy Backend
        run: |
          gcloud run deploy pdfpage-backend \
            --source ./backend \
            --region asia-south1 \
            --platform managed
            
  deploy-u2net:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - id: 'auth'
        uses: 'google-github-actions/auth@v1'
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'
      
      - name: Deploy U²-Net
        run: |
          gcloud run deploy pdfpage-u2net \
            --source ./u2net-service \
            --region asia-south1 \
            --platform managed
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails**: Check Dockerfile and ensure all dependencies are correct
2. **Memory Issues**: Increase memory allocation (up to 8GB available)
3. **Timeout Issues**: Increase timeout or optimize code
4. **Authentication**: Ensure gcloud is authenticated

### Debug Commands:
```bash
# Check service status
gcloud run services list

# View logs
gcloud run services logs tail pdfpage-backend --region=asia-south1

# Describe service
gcloud run services describe pdfpage-backend --region=asia-south1
```

## 📝 Next Steps

1. ✅ Deploy both services
2. ✅ Test all endpoints
3. ✅ Update frontend configuration
4. ✅ Set up monitoring (optional)
5. ✅ Configure custom domain (optional)

## 🔒 Security Notes

- Services are configured for public access (required for frontend)
- Use environment variables for sensitive data
- Enable VPC connector for database security (optional)
- Set up IAM roles for production (recommended)
