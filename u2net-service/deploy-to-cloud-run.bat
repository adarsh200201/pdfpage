@echo off
REM 🚀 Google Cloud Run Deployment Script for PdfPage U²-Net Service (Windows)
REM This script deploys the U²-Net AI background removal service to Google Cloud Run

setlocal enabledelayedexpansion

echo 🚀 Starting deployment to Google Cloud Run...

REM Configuration
set PROJECT_ID=elite-hangar-467115-g2
set SERVICE_NAME=pdfpage-u2net
set REGION=asia-south1
set IMAGE_TAG=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo.
echo 📝 Configuration:
echo    Project ID: %PROJECT_ID%
echo    Service Name: %SERVICE_NAME%
echo    Region: %REGION%
echo    Image Tag: %IMAGE_TAG%

REM Step 1: Enable required APIs
echo.
echo 🔧 Enabling required Google Cloud APIs...
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com --project=%PROJECT_ID%

REM Step 2: Set project
echo.
echo 🎯 Setting active project...
gcloud config set project %PROJECT_ID%

REM Step 3: Build and push the container image
echo.
echo 🏗️  Building and pushing container image...
gcloud builds submit --tag %IMAGE_TAG% .

REM Step 4: Deploy to Cloud Run
echo.
echo 🚀 Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
  --image %IMAGE_TAG% ^
  --region %REGION% ^
  --platform managed ^
  --allow-unauthenticated ^
  --memory 2Gi ^
  --cpu 1 ^
  --timeout 300 ^
  --concurrency 10 ^
  --max-instances 5 ^
  --port 8080 ^
  --set-env-vars "FLASK_ENV=production,PYTHONUNBUFFERED=1" ^
  --project=%PROJECT_ID%

REM Step 5: Get the service URL
echo.
echo 🔗 Getting service URL...
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)" --project=%PROJECT_ID%') do set SERVICE_URL=%%i

echo.
echo ✅ Deployment completed successfully!
echo 🌐 Service URL: %SERVICE_URL%
echo.
echo 🧪 Test endpoints:
echo    Health check: %SERVICE_URL%/health
echo    Models info: %SERVICE_URL%/models
echo    Background removal: %SERVICE_URL%/remove-bg (POST)
echo.
echo 🔧 Service configuration:
echo    Memory: 2GB
echo    CPU: 1 vCPU
echo    Timeout: 300 seconds
echo    Max instances: 5
echo    Authentication: Public (no auth required)
echo.
echo 📝 Integration notes:
echo    - Use this URL in your frontend for API calls
echo    - The service will auto-scale based on traffic
echo    - Models are loaded on first request (may take ~30s)
echo.

pause
