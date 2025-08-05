# Google OAuth Credentials Updated

## ✅ **Changes Made**

### **1. Updated Production Environment Variables**
- ✅ New Google OAuth Client ID configured
- ✅ New Google OAuth Client Secret configured  
- ✅ Callback URL remains: `https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback`

### **2. Security Improvements**
- ✅ Removed hardcoded credentials from documentation files
- ✅ Updated deployment scripts to use environment variables
- ✅ Credentials are now safely stored in `.env.production` (git-ignored)

### **3. Files Updated**
- `backend/.env.production` - Updated with new credentials (not committed to git)
- `backend/deploy-backend-cloudrun.sh` - Uses environment variables instead of hardcoded values
- Documentation files - Removed sensitive credentials

## 🚀 **Next Steps**

### **Manual Deployment Required**
Since gcloud CLI has permission issues, deploy manually via Google Cloud Console:

1. **Update Google Cloud Run Environment Variables**:
   - Go to: https://console.cloud.google.com/run/detail/asia-south1/pdf-backend/revisions?project=elite-hangar-467115-g2
   - Click "Edit & Deploy New Revision"
   - Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with new values
   - Deploy

2. **Configure Google OAuth Client**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find the new OAuth client
   - Add redirect URIs:
     - `https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback`
     - `https://pdfpage.in/api/auth/google/callback`
     - `http://localhost:5000/api/auth/google/callback`

3. **Test OAuth Flow**:
   - Clear browser cache
   - Test Google Sign In on production site
   - Verify debug endpoint: https://pdf-backend-935131444417.asia-south1.run.app/api/auth/oauth-debug

## 🔒 **Security Notes**
- OAuth credentials are now properly secured
- No sensitive data is committed to git repository
- Environment variables are used for deployment configuration
