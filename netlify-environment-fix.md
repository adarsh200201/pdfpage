# 🚨 NETLIFY ENVIRONMENT VARIABLE CONFLICT DETECTED

## The Problem ❌

Your Netlify deployment has **CONFLICTING** VITE_API_URL environment variables:

1. **Variable 1**: `VITE_API_URL = https://pdf-backend-935131444417.asia-south1.run.app/api`
2. **Variable 2**: `VITE_API_URL = https://pdfpage.in`

This is causing OAuth redirect URI mismatches because your frontend doesn't know which API URL to use.

## The Solution ✅

### Step 1: Clean Up Netlify Environment Variables

1. **Go to Netlify Dashboard** → Your Site → Site Settings → Environment Variables
2. **DELETE the duplicate VITE_API_URL** with value `https://pdfpage.in`
3. **KEEP ONLY** the one with: `https://pdf-backend-935131444417.asia-south1.run.app/api`

### Step 2: Update Google OAuth Console

Add BOTH redirect URIs to your Google OAuth client to cover all scenarios:

```
https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback
https://your-netlify-site.netlify.app/api/auth/google/callback
https://pdfpage.in/api/auth/google/callback
```

### Step 3: Configure Netlify Redirects

Create a `_redirects` file in your build output (`dist` or `build` folder):

```
# Proxy API calls to Google Cloud Run backend
/api/* https://pdf-backend-935131444417.asia-south1.run.app/api/:splat 200!
```

## Why This Is Happening

1. **Duplicate Environment Variables**: Netlify allows multiple variables with the same name, causing conflicts
2. **OAuth Confusion**: The frontend sends requests to different backends depending on which variable loads first
3. **Redirect URI Mismatch**: Google OAuth expects consistent redirect URIs

## Quick Fix Steps

1. **Remove duplicate VITE_API_URL from Netlify**
2. **Add all possible redirect URIs to Google OAuth Console**
3. **Deploy with _redirects file for API proxying**
4. **Test OAuth flow again**

This will resolve the redirect URI mismatch error immediately!
