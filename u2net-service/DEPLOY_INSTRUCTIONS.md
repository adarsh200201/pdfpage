# 🚀 Google Cloud Run Deployment Instructions

## Quick Deploy Commands

### Option 1: Direct source deployment (recommended)
```bash
# Navigate to the u2net-service directory
cd u2net-service

# Deploy directly from source (this will build automatically)
gcloud run deploy pdfpage-u2net \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1 \
  --timeout 300 \
  --concurrency 10 \
  --max-instances 5 \
  --port 8080 \
  --set-env-vars "FLASK_ENV=production,PYTHONUNBUFFERED=1" \
  --project=elite-hangar-467115-g2
```

### Option 2: Use deployment scripts
```bash
# Linux/Mac
chmod +x deploy-to-cloud-run.sh
./deploy-to-cloud-run.sh

# Windows
deploy-to-cloud-run.bat
```

## Prerequisites

1. **Install Google Cloud CLI:**
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use: `curl https://sdk.cloud.google.com | bash`

2. **Authenticate:**
   ```bash
   gcloud auth login
   gcloud config set project elite-hangar-467115-g2
   ```

3. **Enable APIs (one-time setup):**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

## Expected Output

After successful deployment, you'll get a URL like:
```
https://pdfpage-u2net-[hash]-uc.a.run.app
```

## Testing the Deployment

1. **Health Check:**
   ```bash
   curl https://your-service-url/health
   ```

2. **Test Background Removal:**
   ```bash
   curl -X POST \
     -F "image=@test-image.jpg" \
     -F "model=general" \
     https://your-service-url/remove-bg \
     --output result.png
   ```

## Integration Notes

- ✅ Service runs on port 8080 (Google Cloud Run standard)
- ✅ Uses $PORT environment variable
- ✅ Includes health check endpoint at `/health`
- ✅ No authentication required (public access)
- ✅ Auto-scales from 0 to 5 instances
- ✅ 2GB memory, 1 vCPU per instance
- ✅ 300-second timeout for long processing

## Troubleshooting

If deployment fails:

1. **Check authentication:**
   ```bash
   gcloud auth list
   ```

2. **Verify project:**
   ```bash
   gcloud config get-value project
   ```

3. **Check logs:**
   ```bash
   gcloud run services logs tail pdfpage-u2net --region=asia-south1
   ```

4. **View build logs:**
   ```bash
   gcloud builds list --limit=5
   ```
