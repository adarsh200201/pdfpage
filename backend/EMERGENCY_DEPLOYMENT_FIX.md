# EMERGENCY DEPLOYMENT FIX

## Current Issue

❌ **Backend server crashed/not responding** (`net::ERR_FAILED`)  
❌ **CORS errors** from production frontend (`https://pdfpagee.netlify.app`)  
❌ **Word to PDF conversion failing**

## Immediate Fix Applied

✅ **Replaced DocumentConversionService** with LibreOffice-only version  
✅ **Removed all Puppeteer dependencies** that were causing crashes  
✅ **CORS already configured** for `pdfpagee.netlify.app`  
✅ **Simplified codebase** for maximum stability

## Deploy This Fix NOW

### Option 1: Git Deploy (Fastest)

```bash
git add .
git commit -m "EMERGENCY: Replace Puppeteer with LibreOffice - fix server crash"
git push origin main
```

### Option 2: Manual Render Deploy

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select "pdfpage-backend" service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete (3-5 minutes)

### Option 3: Rollback (If needed)

If this doesn't work, rollback to previous working version:

1. In Render dashboard → "Events" tab
2. Find last successful deployment
3. Click "Redeploy"

## What This Fix Does

### 1. Eliminates Server Crashes

- **Removed Puppeteer** completely from main conversion service
- **Uses LibreOffice** which is already installed and working
- **No complex Chrome detection** that was causing startup failures

### 2. Maintains Functionality

- **Word to PDF** now uses LibreOffice (same quality)
- **All other tools** continue working normally
- **API endpoints** remain the same

### 3. Fixes CORS Issues

- **Production frontend** (`pdfpagee.netlify.app`) is whitelisted
- **Proper headers** configured for cross-origin requests
- **Server will respond** instead of crashing

## Test After Deployment

1. **Check server health**: Visit `https://pdfpage.onrender.com/api/health`
2. **Test CORS**: Should see proper headers in response
3. **Test Word to PDF**: Upload a document from production frontend
4. **Monitor logs**: Look for "LibreOffice-only mode" in startup logs

## Expected Timeline

- **Deploy**: 30 seconds to push
- **Build**: 2-3 minutes on Render
- **Available**: Frontend should work immediately after

## Success Indicators

```
✅ Server responds to health checks
✅ CORS headers present in responses
✅ Word to PDF conversion works via LibreOffice
✅ No more "net::ERR_FAILED" errors
✅ Frontend can connect successfully
```

## Backup Plan

If LibreOffice conversion doesn't work:

1. **Check LibreOffice installation** in Dockerfile
2. **Use alternative route**: `/api/pdf/word-to-pdf-libreoffice`
3. **Contact Render support** if deployment issues persist

## What We Removed

- ❌ Puppeteer Chrome detection
- ❌ Complex browser launching
- ❌ Chrome installation dependencies
- ❌ Memory-intensive PDF generation

## What We Kept

- ✅ LibreOffice conversion (reliable)
- ✅ All other PDF tools
- ✅ CORS configuration
- ✅ API compatibility
- ✅ Error handling

This is a **stability-first** approach. Once the server is stable, we can gradually re-add Puppeteer features if needed.

## URGENT: Deploy this now to restore service!
