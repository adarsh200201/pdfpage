# 2-Free-Lifetime-Usage + Persistent Login System

## ✅ System Overview

This system allows anonymous users to use **2 tools total** (lifetime limit), after which they must log in to continue. Once logged in, users stay persistently logged in until they manually log out.

## 🔄 User Flow

### Anonymous Users (Not Logged In)

1. **First Visit**: User can use any tool (count: 1/2)
2. **Second Use**: User can use another tool (count: 2/2)
3. **Third Attempt**: System shows login modal with message: _"You've reached your free usage limit. Please log in to continue using unlimited tools — it's free!"_

### Authenticated Users

1. **After Login**: Unlimited access to all tools
2. **Persistent Session**: Login cookie expires after 1 year
3. **Automatic Login**: Users stay logged in across browser sessions
4. **Welcome Message**: _"Welcome back, [Name]! You're already logged in — enjoy unlimited access to all tools."_

## 🔧 Technical Implementation

### Backend Changes

#### 1. **Cookie-Based Tracking**

- **Primary ID**: `cookieId` (32-byte hex string, 1-year expiry)
- **Fallback ID**: `ipAddress` (when cookies are blocked)
- **Cookie Name**: `pdfpage_session`
- **Security**: HttpOnly, Secure (in production), SameSite

#### 2. **Database Schema Updates**

```javascript
// IpUsageLog Model
{
  cookieId: String,        // Primary tracking identifier
  ipAddress: String,       // Fallback identifier
  idType: String,          // "cookieId" or "ipAddress"
  usageCount: Number,      // Lifetime usage count (max 2 for anonymous)
  isLifetimeLimit: Boolean // Always true for new system
}
```

#### 3. **Removed Daily Logic**

- ❌ Removed: `dailyUploads`, `dailyUploadLimit`, `maxDailyUploads`
- ❌ Removed: Daily reset timers and expiry logic
- ✅ Added: Lifetime usage tracking with no reset

#### 4. **Updated Methods**

```javascript
// New method signature
await checkAnonymousUsageLimit(req, res);
await trackAnonymousUsage(req, res, usageData);

// Database methods
IpUsageLog.getOrCreateForIdentifier(cookieId, ipAddress, idType);
```

### Frontend Changes

#### 1. **Persistent Login**

```javascript
// 1-year cookie expiry for persistent login
Cookies.set("token", token, { expires: 365 });
```

#### 2. **Updated Modal Message**

- **Title**: "Free Usage Complete" (instead of "Daily Limit Reached")
- **Message**: "You've reached your free usage limit. Please log in to continue using unlimited tools — it's free!"
- **Visual**: Blue gradient (instead of orange) with crown icon

#### 3. **Usage Display**

- **Counter**: "2/2 lifetime" (instead of "2/2 today")
- **Message**: "✨ Login once for unlimited access to all tools!"

## 📊 Tracking Logic

### Cookie ID Generation

```javascript
function getOrCreateCookieId(req, res) {
  let cookieId = req.cookies["pdfpage_session"];

  if (!cookieId) {
    cookieId = crypto.randomBytes(32).toString("hex");
    res.cookie("pdfpage_session", cookieId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return cookieId;
}
```

### Usage Tracking Flow

```javascript
// 1. Get or create tracking identifier
const { cookieId, ipAddress, idType } = getAnonymousUserIdentifier(req, res);

// 2. Find or create usage log
const usageLog = await IpUsageLog.getOrCreateForIdentifier(
  cookieId,
  ipAddress,
  idType,
);

// 3. Check lifetime limit
const canUse = usageLog.usageCount < 2;
const shouldShowSoftLimit = usageLog.usageCount >= 2;

// 4. Track usage if allowed
if (!shouldShowSoftLimit) {
  usageLog.incrementUsage(toolData);
  await usageLog.save();
}
```

## 🔒 Security Features

### 1. **Fallback Tracking**

- If cookies are disabled/blocked, falls back to IP tracking
- Seamlessly upgrades IP tracking to cookie tracking when possible

### 2. **Migration Support**

- Existing IP-based logs are preserved
- When cookie ID is available, IP logs are upgraded with cookie ID

### 3. **Cookie Security**

- HttpOnly (prevents XSS access)
- Secure flag in production (HTTPS only)
- SameSite policy for CSRF protection
- 1-year expiry for persistent tracking

## 🚀 Benefits

### For Users

- **Simple**: Just 2 free uses, then one-time login
- **Persistent**: Stay logged in across sessions
- **Fair**: Lifetime limit instead of daily reset gaming
- **Clear**: Obvious value proposition for signup

### For Business

- **Higher Conversion**: Clear value after 2 uses
- **Better Tracking**: Cookie-based is more reliable than IP
- **User Retention**: Persistent login reduces friction
- **Anti-Gaming**: No daily reset to exploit

## 📈 Analytics & Monitoring

### Key Metrics to Track

- **Conversion Rate**: % of users who signup after hitting limit
- **Usage Patterns**: Which tools trigger signup most
- **Retention**: How many users return after signup
- **Tracking Accuracy**: Cookie vs IP tracking success rates

### Database Queries

```javascript
// Users who hit lifetime limit
db.ipUsageLogs.find({
  usageCount: { $gte: 2 },
  "conversionTracking.hitSoftLimit": true,
});

// Conversion rate
db.ipUsageLogs.aggregate([
  { $match: { "conversionTracking.hitSoftLimit": true } },
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      converted: {
        $sum: { $cond: ["$conversionTracking.convertedToUser", 1, 0] },
      },
    },
  },
]);
```

## 🔧 Maintenance & Configuration

### Environment Variables

```env
# Cookie configuration
COOKIE_SECRET=your_secret_key
COOKIE_DOMAIN=.pdfpage.com  # For production

# Usage limits
ANONYMOUS_USAGE_LIMIT=2     # Can be adjusted
TRACKING_COOKIE_NAME=pdfpage_session
```

### Database Indexes

```javascript
// Recommended indexes for performance
db.ipUsageLogs.createIndex({ cookieId: 1 });
db.ipUsageLogs.createIndex({ ipAddress: 1 });
db.ipUsageLogs.createIndex({ cookieId: 1, usageCount: 1 });
```

## 🧪 Testing Checklist

### Anonymous User Flow

- [ ] First tool use works without login
- [ ] Second tool use works without login
- [ ] Third tool use shows login modal
- [ ] Modal shows correct lifetime usage message
- [ ] Cookie is set properly on first visit

### Authenticated User Flow

- [ ] Login sets persistent cookie (1 year)
- [ ] User stays logged in after browser restart
- [ ] Unlimited tool access after login
- [ ] Welcome back message appears

### Edge Cases

- [ ] Works with cookies disabled (IP fallback)
- [ ] Handles cookie/IP migration properly
- [ ] Works across different browsers
- [ ] Handles concurrent requests correctly

---

**Implementation Status**: ✅ **COMPLETE**
**Last Updated**: January 1, 2025
**Version**: 2.0.0 - Lifetime Usage System
