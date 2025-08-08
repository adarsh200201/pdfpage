@echo off
echo 🚀 Deploying Backend to Google Cloud Run...

cd backend

echo 📦 Building and deploying...
gcloud run deploy pdf-backend ^
  --source . ^
  --platform managed ^
  --region asia-south1 ^
  --allow-unauthenticated ^
  --set-env-vars NODE_ENV=production,FRONTEND_URL=https://pdfpage.in,GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID,GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_OAUTH_CLIENT_SECRET,GOOGLE_CALLBACK_URL=https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback

echo ✅ Deployment complete!
echo 🌐 Backend URL: https://pdf-backend-935131444417.asia-south1.run.app
echo 🧪 Test OAuth: https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google

pause
