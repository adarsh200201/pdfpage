# Google OAuth Local Development Setup

## 🔧 Issue Identified and Fixed

The Google Sign-In authentication was failing because the frontend was hardcoded to use production backend URLs even in local development, and the Google Cloud Console was missing localhost redirect URIs.

## ✅ Changes Made

### Backend Configuration (.env)
```env
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### Frontend Configuration (authService.ts)
- Updated to detect development environment and use localhost backend
- Changed from hardcoded production URLs to dynamic URL selection

## 🌐 Required Google Cloud Console Configuration

**IMPORTANT**: You need to add these redirect URIs to your Google Cloud Console OAuth client:

### Current OAuth Client Details
- **Client ID**: `935131444417-s5i4mpl0droaqh5pu49jm52j8dqrv2km.apps.googleusercontent.com`
- **Client Secret**: `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`

### Required Authorized Redirect URIs

Add these URIs to your Google Cloud Console OAuth client configuration:

#### Production URIs (Already Configured)
```
https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback
https://pdfpage.in/api/auth/google/callback
```

#### Development URIs (NEED TO BE ADDED)
```
http://localhost:5000/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

### Steps to Add Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID: `935131444417-s5i4mpl0droaqh5pu49jm52j8dqrv2km.apps.googleusercontent.com`
4. In the **Authorized redirect URIs** section, click **+ ADD URI**
5. Add these two URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback`
6. Click **SAVE**

## 🧪 Testing the OAuth Flow

### 1. Test Backend OAuth Endpoint
```bash
curl http://localhost:5000/api/auth/google
```
This should redirect to Google's OAuth page with localhost callback URL.

### 2. Test Frontend Integration
1. Open http://localhost:3000
2. Click on any Google Sign-In button
3. Should redirect to Google OAuth page
4. After authentication, should redirect back to localhost:3000

## 🔄 OAuth Flow Diagram

```
Frontend (localhost:3000) 
    ↓ User clicks "Sign in with Google"
    ↓ authService.loginWithGoogle()
    ↓
Backend (localhost:5000/api/auth/google)
    ↓ Redirects to Google OAuth
    ↓
Google OAuth (accounts.google.com)
    ↓ User authenticates
    ↓ Redirects to callback URL
    ↓
Backend (localhost:5000/api/auth/google/callback)
    ↓ Processes OAuth response
    ↓ Generates JWT token
    ↓ Redirects to frontend with token
    ↓
Frontend (localhost:3000/auth/callback?token=...)
    ↓ Stores token and user data
    ↓ User is authenticated
```

## 🚨 Current Status

- ✅ Backend OAuth configuration updated for localhost
- ✅ Frontend OAuth service updated for localhost
- ✅ CORS configuration allows localhost origins
- ❌ **Google Cloud Console redirect URIs need to be added**

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch"
This means the redirect URI in the request doesn't match what's configured in Google Cloud Console.

**Solution**: Add the localhost redirect URIs to Google Cloud Console as documented above.

### Error: "invalid_client"
This means the client ID or secret is incorrect.

**Solution**: Verify the client ID and secret in the .env file match your Google Cloud Console configuration.

## 📝 Next Steps

1. **Add localhost redirect URIs to Google Cloud Console** (Required)
2. Test the complete OAuth flow
3. Verify user authentication works in local development

Once the redirect URIs are added to Google Cloud Console, the Google Sign-In should work perfectly in local development!
