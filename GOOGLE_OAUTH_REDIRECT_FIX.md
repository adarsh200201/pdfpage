# 🚨 URGENT: Google OAuth Redirect URI Mismatch Fix

## ✅ **Issue Identified**
**Error**: `redirect_uri_mismatch` - Google OAuth cannot redirect to your current domain.

**Current Problem**: OAuth is trying to redirect to `pdfpage-app.onrender.com` but you need redirect URIs for your actual domains.

## 🔧 **IMMEDIATE FIX REQUIRED**

### **Step 1: Add Redirect URIs in Google Cloud Console**

**Go to the Google Cloud Console OAuth client configuration** (as shown in your screenshot) and add these redirect URIs:

#### **For Development:**
```
http://localhost:48752/auth/callback
http://localhost:3000/auth/callback
http://localhost:5173/auth/callback
```

#### **For Production (add your actual domains):**
```
https://your-actual-domain.com/auth/callback
https://your-netlify-domain.netlify.app/auth/callback
https://pdfpage.in/auth/callback
```

### **Step 2: In Google Cloud Console**
1. **Click "ADD URI"** button (visible in your screenshot)
2. **Add each URI one by one**
3. **Click "SAVE"** at the bottom
4. **Wait 5-10 minutes** for changes to propagate

### **Step 3: Test Again**
- **Clear browser cache/cookies**
- **Try Google Sign In again**
- **Should work immediately**

## 📋 **Current OAuth Client Details**
- **Client ID**: `935131444417-s5i4mpl0droaqh5pu49jm52j8dqrv2km.apps.googleusercontent.com`
- **Current Redirect**: `https://pdfpage-app.onrender.com/api/auth/google/callback`
- **Needed Redirect**: `http://localhost:48752/auth/callback` (for development)

## ⚡ **Quick Alternative Solution**

If you can't access Google Cloud Console immediately, temporarily update your auth service to use a working domain:

```typescript
// Temporary fix in src/services/authService.ts
loginWithGoogle: () => {
  // Use a domain that's already authorized
  const googleOAuthUrl = "https://pdfpage-app.onrender.com/api/auth/google";
  
  sessionStorage.setItem("authRedirectUrl", window.location.pathname);
  window.location.href = googleOAuthUrl;
},
```

## 🔄 **Root Cause**
The Google OAuth client was set up for `pdfpage-app.onrender.com` but you're running on `localhost:48752` or a different domain. Google OAuth requires **exact domain matches** for security.

## ✅ **After Fix**
- ✅ Google Sign In will work on your current domain
- ✅ OAuth flow will complete successfully  
- ✅ Users can authenticate properly

---
**Priority: CRITICAL** - This blocks all Google authentication until fixed!
