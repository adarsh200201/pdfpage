# Google OAuth Diagnosis Report

## Issue Found ❌

The Google OAuth is not working because the backend environment variable `GOOGLE_CALLBACK_URL` is misconfigured.

### Current Configuration (Incorrect)
```
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### Required Configuration (Correct)
```
GOOGLE_CALLBACK_URL=https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback
```

## Root Cause
When users click "Sign in with Google":
1. ✅ Frontend correctly redirects to: `https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google`
2. ✅ Backend receives the request and initializes Google OAuth
3. ❌ **FAILS HERE**: Google OAuth tries to redirect back to `http://localhost:5000/api/auth/google/callback` (which doesn't exist)
4. ❌ User gets an error from Google because the callback URL is unreachable

## Solution
The backend administrator needs to update the environment variable:

```bash
GOOGLE_CALLBACK_URL=https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback
```

## Google OAuth Console Configuration
The Google OAuth client in Google Cloud Console should also have this redirect URI whitelisted:
- `https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback`

## Technical Details
- Frontend API URL: ✅ Correctly set to `https://pdf-backend-935131444417.asia-south1.run.app/api`
- Backend Google Client ID: ✅ Present
- Backend Google Client Secret: ✅ Present
- Backend Callback URL: ❌ Points to localhost instead of production URL
- Frontend Callback Handler: ✅ Ready at `/auth/callback`

## Steps to Fix
1. Update backend environment: `GOOGLE_CALLBACK_URL=https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback`
2. Verify Google OAuth Console has the correct redirect URI
3. Restart the backend service
4. Test Google Sign In again
