# Deployment Checklist - API Path Fix

## ✅ Changes Made

- [x] Fixed `src/lib/api-config.ts` - Smart /api path handling
- [x] Fixed `src/contexts/AuthContext.tsx` - Google OAuth URL construction
- [x] Fixed `src/services/statsService.ts` - Stats endpoint path
- [x] Updated `netlify.toml` - Removed VITE_API_URL environment variable
- [x] Backend health check passed ✅ (https://pdfpage-backend.onrender.com/api/health)

## 🚀 Deployment Steps

### 1. Test Build Locally (Optional but Recommended)
```bash
npm run build
```
This ensures there are no TypeScript or build errors.

### 2. Commit and Push Changes
```bash
git add .
git commit -m "fix: resolve duplicate /api path issue in production

- Fixed API URL construction in api-config.ts
- Fixed Google OAuth URL in AuthContext.tsx  
- Fixed stats service endpoint path
- Removed VITE_API_URL from netlify.toml to use relative paths
- All API calls now use /api/* which Netlify proxies to backend"

git push origin main
```

### 3. Monitor Netlify Deployment
1. Go to https://app.netlify.com
2. Find your site (pdfpage.in)
3. Watch the deploy progress
4. Should complete in 2-3 minutes

### 4. Verify Deployment
After deployment completes:

#### A. Clear Browser Cache
- Press `Ctrl + Shift + Delete`
- Clear cached images and files
- Or use incognito/private window

#### B. Test API Endpoints
Open DevTools (F12) → Network tab and test:

1. **Homepage Load**
   - Should see: `GET /api/health` (200 OK)
   - Should NOT see: `/api/api/health`

2. **Google Sign In**
   - Click "Sign in with Google"
   - Should redirect to: `/api/auth/google`
   - Should NOT see: `/api/api/auth/google`

3. **Stats Dashboard**
   - Should see: `GET /api/stats/dashboard` (200 OK)
   - Should NOT see: `/api/api/api/stats/dashboard`

#### C. Expected Network Calls
```
✅ /api/health → 200 OK
✅ /api/auth/google → 302 Redirect to Google
✅ /api/stats/dashboard → 200 OK
✅ /api/auth/me → 200 OK (when authenticated)
```

## 🔍 Troubleshooting

### If you still see duplicate /api paths:
1. **Hard refresh**: `Ctrl + Shift + R`
2. **Check Netlify environment variables**:
   - Go to Site Settings → Environment Variables
   - Ensure `VITE_API_URL` is NOT set
   - If it exists, delete it and redeploy

### If you see 503 errors:
1. **Backend cold start**: Wait 30-60 seconds and retry
2. **Check Render backend**: https://dashboard.render.com
3. **Verify backend health**: https://pdfpage-backend.onrender.com/api/health

### If OAuth doesn't work:
1. Check Google Cloud Console OAuth settings
2. Verify authorized redirect URIs include:
   - `https://pdfpage.in/auth/callback`
   - `https://pdfpage-backend.onrender.com/api/auth/google/callback`

## 📊 Success Criteria

- [ ] No duplicate `/api` paths in Network tab
- [ ] Google Sign In redirects correctly
- [ ] Stats load without errors
- [ ] No 503 errors (or only during initial cold start)
- [ ] All API calls return proper responses

## 🎯 Next Steps After Deployment

1. **Monitor for 24 hours**: Check for any new errors
2. **Test all features**:
   - PDF upload/conversion
   - User authentication
   - Payment processing (if applicable)
   - All PDF tools

3. **Performance check**:
   - Initial page load time
   - API response times
   - Backend cold start behavior

## 📝 Notes

- **Backend**: Render free tier has cold starts (~30-60s)
- **Frontend**: Netlify serves static files + proxies API
- **Proxy**: Netlify redirects `/api/*` → `https://pdfpage-backend.onrender.com/api/*`
- **Security**: No hardcoded backend URLs in frontend code ✅

---

**Last Updated**: 2025-12-17
**Status**: Ready for deployment
**Priority**: High (Fixes critical authentication issue)
