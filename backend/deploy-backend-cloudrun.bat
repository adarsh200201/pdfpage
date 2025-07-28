@echo off
REM 🚀 Deploy PdfPage Backend to Google Cloud Run (Windows)
setlocal enabledelayedexpansion

echo 🚀 Deploying PdfPage Backend to Google Cloud Run...

REM Configuration
set PROJECT_ID=elite-hangar-467115-g2
set SERVICE_NAME=pdfpage-backend
set REGION=asia-south1

echo.
echo 📝 Configuration:
echo    Project ID: %PROJECT_ID%
echo    Service Name: %SERVICE_NAME%
echo    Region: %REGION%

REM Step 1: Enable required APIs
echo.
echo 🔧 Enabling required Google Cloud APIs...
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com --project=%PROJECT_ID%

REM Step 2: Set project
echo.
echo 🎯 Setting active project...
gcloud config set project %PROJECT_ID%

REM Step 3: Deploy to Cloud Run
echo.
echo 🚀 Deploying backend to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
  --source . ^
  --dockerfile Dockerfile.cloudrun ^
  --region %REGION% ^
  --platform managed ^
  --allow-unauthenticated ^
  --memory 2Gi ^
  --cpu 2 ^
  --timeout 900 ^
  --concurrency 100 ^
  --max-instances 10 ^
  --port 8080 ^
  --set-env-vars "NODE_ENV=production,FRONTEND_URL=https://pdfpage.in" ^
  --project=%PROJECT_ID%

REM Step 4: Get the service URL
echo.
echo 🔗 Getting service URL...
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)" --project=%PROJECT_ID%') do set SERVICE_URL=%%i

echo.
echo ✅ Backend deployment completed successfully!
echo 🌐 Backend URL: %SERVICE_URL%
echo.
echo 🧪 Test endpoints:
echo    Health check: %SERVICE_URL%/api/health
echo    CORS test: %SERVICE_URL%/api/test-cors
echo    Full API: %SERVICE_URL%/api/*
echo.
echo 🔧 Service configuration:
echo    Memory: 2GB
echo    CPU: 2 vCPUs
echo    Timeout: 900 seconds
echo    Max instances: 10
echo    Authentication: Public
echo.
echo 📝 IMPORTANT: Set environment variables:
echo    - MONGODB_URI: Your MongoDB connection string
echo    - JWT_SECRET: Your JWT secret key
echo.
echo    Use: gcloud run services update %SERVICE_NAME% --set-env-vars "MONGODB_URI=your_uri,JWT_SECRET=your_secret" --region=%REGION%
echo.

pause
