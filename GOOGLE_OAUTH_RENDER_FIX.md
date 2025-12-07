# Google OAuth Setup for Render Backend

## Issue Fixed
**Problem:** Google OAuth redirect was trying to use `/api/auth/google` when it should use the full Render backend URL.

**Solution:** Updated environment variables and API configuration to properly handle OAuth redirects.

---

## Required Environment Variables on Render

Add these to your Render service environment variables:

```env
GOOGLE_CLIENT_ID=1073121775472-tlnpgmhm92rjqumsk006e4galuejbdp0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://pdfpage-backend.onrender.com/api/auth/google/callback
```

---

## Google Cloud Console Setup

### 1. Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials

### 2. Configure OAuth Consent Screen
- Go to "OAuth consent screen"
- Add authorized domains:
  - `pdfpage.in`
  - `onrender.com`

### 3. Update OAuth 2.0 Client Credentials
- Go to "Credentials"
- Select your OAuth 2.0 Client ID
- Add Authorized JavaScript origins:
  ```
  https://pdfpage.in
  https://pdfpage-backend.onrender.com
  ```
- Add Authorized redirect URIs:
  ```
  https://pdfpage-backend.onrender.com/api/auth/google/callback
  http://localhost:5002/api/auth/google/callback (for development)
  ```

### 4. Save Changes

---

## Testing OAuth Flow

### 1. Production Test
1. Go to: https://pdfpage.in
2. Click "Sign in with Google"
3. Should redirect to: `https://pdfpage-backend.onrender.com/api/auth/google`
4. Then to Google login
5. Then callback to: `https://pdfpage-backend.onrender.com/api/auth/google/callback`
6. Finally redirect back to: `https://pdfpage.in`

### 2. Local Test
1. Start backend: `npm start`
2. Start frontend: `npm run dev`
3. Go to: http://localhost:48752
4. Click "Sign in with Google"
5. Should redirect to: `http://localhost:5002/api/auth/google`

---

## Files Changed

### Frontend
- `.env.production` - Updated VITE_API_URL (removed /api suffix)
- `src/lib/api-config.ts` - Added getBackendUrl() function
- `src/contexts/AuthContext.tsx` - Use getBackendUrl() for OAuth

### Backend
- `backend/.env.example` - Added GOOGLE_CALLBACK_URL example

---

## How OAuth Flow Works Now

```
User clicks "Sign in with Google" at https://pdfpage.in
↓
Frontend redirects to: https://pdfpage-backend.onrender.com/api/auth/google
↓
Backend redirects to: Google login page
↓
User logs in with Google
↓
Google redirects to: https://pdfpage-backend.onrender.com/api/auth/google/callback
↓
Backend processes authentication, creates JWT token
↓
Backend redirects to: https://pdfpage.in?token=jwt_token_here
↓
Frontend saves token and logs user in
↓
User is authenticated! ✅
```

---

## Troubleshooting

### Error: "Redirect URI mismatch"
**Fix:** Make sure the callback URL in Google Cloud Console matches exactly:
```
https://pdfpage-backend.onrender.com/api/auth/google/callback
```

### Error: "503 Service Unavailable"
**Fix:** Backend is sleeping. Wait 30 seconds and try again.
The retry logic will handle this automatically.

### Error: "Invalid OAuth client"
**Fix:** Check environment variables on Render:
- GOOGLE_CLIENT_ID is correct
- GOOGLE_CLIENT_SECRET is correct

### OAuth works locally but not in production
**Fix:** 
1. Check Render environment variables
2. Verify Google Cloud Console has production URLs
3. Make sure GOOGLE_CALLBACK_URL is set on Render

---

## Deploy Updates

```powershell
cd "e:\Builder-zen-field-main (1)\Builder-zen-field-main"
git add .
git commit -m "Fix Google OAuth for Render backend"
git push origin main
```

Your frontend will auto-deploy with the fixes.

---

## Verify Deployment

1. **Check backend is running:**
   ```
   https://pdfpage-backend.onrender.com/api/health
   ```

2. **Test OAuth redirect:**
   ```
   https://pdfpage-backend.onrender.com/api/auth/google
   ```
   Should redirect to Google login

3. **Test from frontend:**
   - Go to https://pdfpage.in
   - Click "Sign in with Google"
   - Should work! ✅

---

**OAuth should now work correctly with your Render backend!** 🎉
