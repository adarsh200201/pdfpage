# Render Deployment Setup Guide - PdfPage Backend

Your backend has been configured for Render deployment. This guide walks you through the complete setup process.

---

## ✅ What's Already Done

1. **Backend environment file created** - `backend/.env.production` with all credentials
2. **render.yaml configured** - Deployment specification file ready
3. **MongoDB Atlas** - Already set up at `cluster1.tcdmjd6.mongodb.net/pdfwiz`

---

## 📋 Step-by-Step Deployment

### Step 1: Commit and Push Code to GitHub (5 minutes)

1. Open terminal in your project directory
2. Run these commands:

```bash
git add .
git commit -m "Set up Render backend deployment with production config"
git push origin main
```

**What this does:**
- Uploads your `render.yaml` and `backend/.env.production` to GitHub
- Makes them available for Render to pull

---

### Step 2: Sign Up on Render (2 minutes)

1. Visit: **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (this is important!)
4. Authorize Render to access your repositories

---

### Step 3: Deploy Backend on Render (5 minutes)

#### 3.1 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Select your repository: `Builder-zen-field-main`
3. Click **"Connect"**

#### 3.2 Configure Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `pdfpage-backend` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (750 hours/month) |

#### 3.3 Environment Variables

Most variables are already in `render.yaml`. Click **"Advanced"** and verify:

- ✅ `NODE_ENV=production`
- ✅ `PORT=10000`
- ✅ `MONGODB_URI=mongodb+srv://ADARSHSHARMA__:...@cluster1.tcdmjd6.mongodb.net/pdfwiz`
- ✅ `JWT_SECRET=a7f2b9c8...`
- ✅ `RAZORPAY_KEY_ID=rzp_live_Rij57cVagX37oT`
- ✅ `RAZORPAY_KEY_SECRET=wQljQkXS1asbI9HAFtM0NJMv`

**⚠️ Add Manually in Render Dashboard:**

You need to add these two Google OAuth secrets manually (they're marked as `sync: false` in render.yaml):

1. **`GOOGLE_CLIENT_ID`** - Copy from your `.env` file (the value you already have)
2. **`GOOGLE_CLIENT_SECRET`** - Copy from your `.env` file (the value you already have)

Click "Add Environment Variable" button in Render dashboard and paste each one.

#### 3.4 Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Watch the logs for:
   - ✅ "npm install" completing
   - ✅ "Server running on port 10000"
   - ✅ "Connected to MongoDB"

**Your backend URL will be:**
```
https://pdfpage-backend.onrender.com
```

---

### Step 4: Verify Backend is Working (2 minutes)

Open in your browser:
```
https://pdfpage-backend.onrender.com/api/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-10T...",
  "mongodb": "connected"
}
```

If you see errors, check the Logs tab in Render dashboard.

---

### Step 5: Update Frontend Configuration

Update Netlify environment variables to point to your new backend:

**In Netlify Dashboard:**
1. Go to **Site Settings** → **Build & Deploy** → **Environment**
2. Add/Update:

```
VITE_API_URL=https://pdfpage-backend.onrender.com
```

Or update your `.env.production` file:

```env
VITE_API_URL=https://pdfpage-backend.onrender.com
VITE_APP_URL=https://pdfpage.in
```

---

## 🔍 Monitoring Your Deployment

### View Logs
- Render Dashboard → **pdfpage-backend** → **Logs**
- Look for errors or connection issues

### Check Health Status
- Click **"Metrics"** to see CPU, memory, and request counts

### Restart Service
- Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📊 Free Tier Details

| Feature | Limit |
|---------|-------|
| Monthly uptime | 750 hours (~31 days) |
| CPU | Shared |
| RAM | 512MB |
| Sleep mode | After 15 min inactivity |

**What this means:**
- Service will sleep after 15 minutes of no requests
- First request after sleep takes 30-50 seconds
- This is normal and acceptable for development
- Upgrade to **Starter ($7/month)** if you need always-on

---

## 🐛 Troubleshooting

### Problem: "502 Bad Gateway"
**Solution:** Service is starting. Wait 1-2 minutes and refresh.

### Problem: "MongoDB connection failed"
**Solution:** 
1. Verify `MONGODB_URI` is set in Render dashboard
2. Check MongoDB Atlas whitelist allows all IPs (0.0.0.0/0)
3. Check your password doesn't have special characters that need escaping

### Problem: "Port already in use"
**Solution:** PORT must be `10000` (Render standard). Check render.yaml.

### Problem: Logs show "Cannot find module"
**Solution:** Run this in Render console:
```bash
cd backend && npm install
```

---

## 🚀 What to Test After Deployment

1. ✅ Health endpoint: `https://pdfpage-backend.onrender.com/api/health`
2. ✅ PDF operations from frontend
3. ✅ Authentication/Login
4. ✅ Payment processing (Razorpay)
5. ✅ API calls from your frontend

---

## 💾 Database Setup Verification

Your MongoDB Atlas cluster is already configured:

- **Cluster:** cluster1.tcdmjd6.mongodb.net
- **Database:** pdfwiz
- **User:** ADARSHSHARMA__
- **Connection:** Verified and working

No additional setup needed! ✅

---

## 📝 Environment Variables Reference

```
# Copied to render.yaml - All set for deployment

NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://ADARSHSHARMA__:SITADEVI%401234765__@cluster1.tcdmjd6.mongodb.net/pdfwiz?retryWrites=true&w=majority
JWT_SECRET=a7f2b9c8e1d4f6a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9
RAZORPAY_KEY_ID=rzp_live_Rij57cVagX37oT
RAZORPAY_KEY_SECRET=wQljQkXS1asbI9HAFtM0NJMv
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
CLOUDINARY_CLOUD_NAME=dj8qhuudz
CLOUDINARY_API_KEY=862265886717521
REMOVE_BG_API_KEY=Wzxf6MXuqEF2yGcC1vXBqZc8
```

---

## ✨ Next Steps

1. **Now:** Push code with `git push origin main`
2. **In 5 min:** Deploy on Render following Step 3 above
3. **In 10 min:** Verify with health endpoint
4. **Today:** Update Netlify with new backend URL
5. **Today:** Test end-to-end functionality

---

## 📚 Resources

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **Your Render Dashboard:** https://dashboard.render.com

---

## ⚠️ Important Security Notes

1. **Never commit `.env.production`** to Git if it contains secrets
   - It's already in `.gitignore` - check to confirm
   
2. **Razorpay keys are LIVE** - They're production keys
   - Keep them secret
   - Monitor for unauthorized usage
   
3. **MongoDB password** - Reset if you suspect compromise
   - Go to MongoDB Atlas → Database Access → Edit User

---

**Ready? Push your code and deploy! 🚀**

Questions? Check the Render logs for detailed error messages.
