# Deployment Fix - Duplicate /api Path Issue

## Problem Identified

The live site at https://pdfpage.in was experiencing **503 Service Unavailable** errors with duplicate `/api` paths in the URLs:

### Issues Found:
1. ❌ `/api/api/auth/google` (should be `/api/auth/google`)
2. ❌ `/api/api/api/stats/dashboard` (should be `/api/stats/dashboard`)
3. ❌ `/api/api/auth/me` (should be `/api/auth/me`)

### Root Cause:
The `VITE_API_URL` environment variable was set to `/api` in `netlify.toml`, but the code was appending another `/api` to it, creating duplicate paths.

## Fixes Applied

### 1. Fixed `src/lib/api-config.ts`
**Before:**
```typescript
if (!import.meta.env.DEV && import.meta.env.VITE_API_URL) {
  return `${import.meta.env.VITE_API_URL}/api`;
}
```

**After:**
```typescript
if (!import.meta.env.DEV && import.meta.env.VITE_API_URL) {
  const apiUrl = import.meta.env.VITE_API_URL;
  // Don't append /api if it's already there
  return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
}
```

### 2. Fixed `src/contexts/AuthContext.tsx`
**Before:**
```typescript
authUrl = `${import.meta.env.VITE_API_URL}/api/auth/google`;
```

**After:**
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
// Don't append /api if it's already there
const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
authUrl = `${baseUrl}/auth/google`;
```

### 3. Fixed `src/services/statsService.ts`
**Before:**
```typescript
fetch(`${this.API_BASE}/api/stats/dashboard`, {
```

**After:**
```typescript
fetch(`${this.API_BASE}/stats/dashboard`, {
```

### 4. Updated `netlify.toml`
Commented out `VITE_API_URL` from build environment to use default relative paths:
```toml
# VITE_API_URL = "/api"  # Removed - using relative /api paths with Netlify proxy
```

## How It Works Now

1. **Frontend**: Uses relative paths like `/api/auth/google`
2. **Netlify Proxy**: Redirects `/api/*` → `https://pdfpage-backend.onrender.com/api/:splat`
3. **Backend**: Receives correct paths without duplicates

## Deployment Steps

### Option 1: Redeploy on Netlify (Recommended)
1. Commit these changes to your repository
2. Push to your main branch
3. Netlify will automatically rebuild and deploy
4. The fixes will be live in ~2-3 minutes

### Option 2: Manual Environment Variable Update
If you have `VITE_API_URL` set in Netlify's environment variables:
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Remove or comment out `VITE_API_URL`
3. Trigger a manual redeploy

## Backend Status Check

The 503 errors also indicate your Render backend might be:
- **Sleeping** (free tier spins down after inactivity)
- **Starting up** (cold start takes 30-60 seconds)
- **Down** (check Render dashboard)

### To Check Backend Health:
```bash
curl https://pdfpage-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-17T15:36:26.000Z"
}
```

## Testing After Deployment

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Open DevTools** (F12) → Network tab
3. **Try Google Sign In**
4. **Verify URLs** in Network tab:
   - ✅ Should see: `/api/auth/google`
   - ❌ Should NOT see: `/api/api/auth/google`

## Additional Notes

- The frontend now defaults to relative `/api` paths
- Netlify's proxy handles routing to the backend
- No hardcoded backend URLs in the frontend (security best practice)
- OAuth redirects work correctly with the proxy setup

## If Issues Persist

1. Check Render backend logs for errors
2. Verify Render backend is running (not sleeping)
3. Check Netlify build logs for any errors
4. Verify environment variables in Netlify dashboard
5. Test the backend directly: `https://pdfpage-backend.onrender.com/api/health`

---

**Status**: ✅ Fixes applied and ready for deployment
**Impact**: High - Fixes authentication and API calls
**Risk**: Low - Only path construction logic changed
