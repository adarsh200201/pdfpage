# Google Cloud OAuth Configuration Guide

## Current OAuth Client Configuration

**Client ID:** `YOUR_GOOGLE_OAUTH_CLIENT_ID`
**Client Secret:** `YOUR_GOOGLE_OAUTH_CLIENT_SECRET`

## Required Redirect URIs in Google Cloud Console

To fix the OAuth redirect mismatch error, ensure these URIs are configured in Google Cloud Console:

### Production URIs
```
https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback
https://pdfpage.in/api/auth/google/callback
```

### Development URIs
```
http://localhost:5000/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

## Steps to Configure in Google Cloud Console

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/apis/credentials
   - Select your project

2. **Find Your OAuth Client**
   - Look for: `935131444417-s5i4mpl0droaqh5pu49jm52j8dqrv2km.apps.googleusercontent.com`
   - Click on the client name to edit

3. **Update Authorized Redirect URIs**
   - Add all the URIs listed above
   - Remove any old Render.com URLs if present
   - Save the configuration

4. **Verify Authorized Origins**
   - Add: `https://pdfpage.in`
   - Add: `http://localhost:3000` (for development)

## Current Backend Configuration

The backend is configured to use these callback URLs:
- **Production:** `https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback`
- **Development:** `http://localhost:5000/api/auth/google/callback`

## Frontend Configuration

The frontend uses proxy URLs via Netlify:
- **Production:** `/api/auth/google` (proxied to Google Cloud backend)
- **Development:** `http://localhost:5000/api/auth/google` (direct to local backend)

## Testing OAuth Configuration

1. **Test Page:** http://localhost:3000/test-oauth.html
2. **Clear browser cache before testing**
3. **Check network tab for redirect URLs**

## Common Issues

### Error: `redirect_uri_mismatch`
- **Cause:** Redirect URI not configured in Google Cloud Console
- **Solution:** Add the exact redirect URI to Google Cloud Console

### Error: `invalid_client`
- **Cause:** Wrong client ID or client secret
- **Solution:** Verify credentials in environment variables

### Error: `access_blocked`
- **Cause:** App not verified or restricted
- **Solution:** Configure OAuth consent screen properly

## Environment Variables

Ensure these are set correctly:
```bash
GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_CALLBACK_URL=https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback
FRONTEND_URL=https://pdfpage.in
```
