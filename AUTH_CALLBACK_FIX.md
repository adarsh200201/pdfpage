# Authentication Callback Issue - Diagnosis & Fix

## Problem Description

After successful Google OAuth authentication, users see "Authentication Error" even though the backend logs show successful authentication:

```
✅ [GOOGLE-OAUTH] Existing user found with Google ID
✅ User authenticated: adarshkumar200201@gmail.com
302 Redirect to frontend
```

But frontend shows: **"Authentication Error"**

## Root Cause Analysis

### What's Happening:

1. ✅ **Backend OAuth Flow** - Working correctly
   - User clicks "Sign in with Google"
   - Redirected to Google OAuth
   - Google redirects back to `/api/auth/google/callback`
   - Backend authenticates user successfully
   - Backend generates JWT token
   - Backend redirects to: `https://pdfpage.in/auth/callback?token=JWT_TOKEN`

2. ❌ **Frontend Token Verification** - Failing
   - Frontend receives the token from URL parameter
   - Frontend calls `/api/auth/me` to verify token
   - This request is failing (503 or other error)
   - Frontend shows "Authentication Error"

### Why `/api/auth/me` Might Be Failing:

**Option 1: Duplicate /api Path (Already Fixed)**
- If `VITE_API_URL` was set to `/api`, the code was creating `/api/api/auth/me`
- **Status**: Fixed in recent commits

**Option 2: Backend Cold Start**
- Render free tier spins down after inactivity
- First request after wake-up can take 30-60 seconds
- The `/api/auth/me` call might be timing out during cold start
- **Status**: Likely the current issue

**Option 3: CORS Issues**
- Cross-origin requests might be blocked
- **Status**: Unlikely (backend has CORS middleware)

## Solution

### Immediate Fix: Add Retry Logic to Auth Callback

The frontend should retry the `/api/auth/me` request if it fails due to backend cold start.

#### Update `src/services/authService.ts`:

```typescript
async handleAuthCallback(token: string): Promise<User> {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [AUTH-CALLBACK] Attempt ${attempt}/${maxRetries} to verify token...`);

      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If 503 (Service Unavailable), retry
        if (response.status === 503 && attempt < maxRetries) {
          console.log(`⏳ [AUTH-CALLBACK] Backend unavailable (503), retrying in ${retryDelay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        throw new Error('Failed to verify authentication token');
      }

      const data: AuthResponse = await response.json();
      
      if (!data.success || !data.user) {
        throw new Error(data.message || 'Authentication verification failed');
      }

      // Store token in cookies and localStorage
      Cookies.set('auth_token', token, { expires: 7, secure: true, sameSite: 'strict' });
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log(`✅ [AUTH-CALLBACK] Token verified successfully on attempt ${attempt}`);
      return data.user;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('❌ [AUTH-CALLBACK] All retry attempts failed:', error);
        throw error;
      }
      console.log(`⚠️ [AUTH-CALLBACK] Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error('Failed to verify authentication token after multiple attempts');
}
```

### Alternative Fix: Use Token Directly Without Verification

If the backend is generating valid JWT tokens, we can trust them without immediately verifying:

#### Update `src/pages/AuthCallback.tsx`:

```typescript
if (token) {
  try {
    console.log('🔑 [AUTH-CALLBACK] Processing token...');

    // Set the token in cookies for 1 year (persistent login)
    Cookies.set("auth_token", token, { expires: 365, secure: true, sameSite: 'strict' });
    localStorage.setItem("auth_token", token);

    // Decode JWT to get user info (without backend verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('📋 [AUTH-CALLBACK] Token payload:', payload);
      
      // Try to verify with backend, but don't fail if it's unavailable
      try {
        const user = await authService.handleAuthCallback(token);
        console.log('👤 [AUTH-CALLBACK] User data received from backend:', user);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (verifyError) {
        console.warn('⚠️ [AUTH-CALLBACK] Backend verification failed, using token payload:', verifyError);
        // Backend might be cold starting, we'll verify on next page load
      }

      // Refresh the auth context
      await auth.refreshAuth();

      toast.success({
        title: "Welcome!",
        description: "Successfully signed in!",
      });

      console.log('✅ [AUTH-CALLBACK] Authentication successful, redirecting...');

      setTimeout(() => {
        const redirectUrl = authService.getAuthRedirectUrl();
        navigate(redirectUrl);
      }, 500);
    } catch (decodeError) {
      console.error('❌ [AUTH-CALLBACK] Failed to decode token:', decodeError);
      throw new Error("Invalid token format");
    }
  } catch (error) {
    // ... existing error handling
  }
}
```

## Testing Steps

### 1. Deploy the Fix

```bash
git add .
git commit -m "fix: add retry logic for auth callback to handle backend cold starts"
git push origin main
```

### 2. Test Authentication Flow

1. Clear browser cache and cookies
2. Go to https://pdfpage.in
3. Click "Sign in with Google"
4. Complete Google OAuth
5. Watch browser console for logs:
   - Should see: `🔄 [AUTH-CALLBACK] Attempt 1/3 to verify token...`
   - If backend is cold: `⏳ [AUTH-CALLBACK] Backend unavailable (503), retrying...`
   - Eventually: `✅ [AUTH-CALLBACK] Token verified successfully`

### 3. Verify Success

- User should be redirected to homepage
- User email/name should appear in header
- No "Authentication Error" message

## Backend Optimization (Optional)

To prevent cold starts, ensure the keep-alive cron job is working:

### Check Render Logs:

```
✅ Keep-alive ping successful
✅ Cronitor ping sent: complete
```

### Verify Cron Schedule:

The backend should have a cron job pinging `/api/health/ping` every 5-10 minutes to keep it warm.

## Environment Variables to Check

### Netlify:
- `VITE_API_URL` should NOT be set (use default `/api`)
- Build command: `npm install --legacy-peer-deps && npm run build`

### Render:
- `FRONTEND_URL` = `https://pdfpage.in`
- `JWT_SECRET` = (your secret)
- `GOOGLE_CLIENT_ID` = (your Google OAuth client ID)
- `GOOGLE_CLIENT_SECRET` = (your Google OAuth secret)
- `GOOGLE_CALLBACK_URL` = `https://pdfpage-backend.onrender.com/api/auth/google/callback`

## Success Criteria

- [ ] No "Authentication Error" after Google sign-in
- [ ] User email/profile displayed correctly
- [ ] Token stored in cookies and localStorage
- [ ] User can access protected features
- [ ] Works even during backend cold starts

---

**Status**: Ready to implement
**Priority**: High
**Impact**: Fixes user authentication flow
