# Deploy Backend to Render.com - Complete Guide

## Prerequisites
- GitHub account (connected to this repository)
- MongoDB Atlas account with connection string
- Razorpay account (for payments)

---

## Step 1: Prepare MongoDB Atlas (5 minutes)

### If you don't have MongoDB Atlas yet:

1. **Sign up**: https://www.mongodb.com/cloud/atlas/register
2. **Create Free Cluster**:
   - Click "Build a Database"
   - Choose "M0 FREE" tier
   - Select region (choose closest to Oregon, USA for best performance with Render)
   - Click "Create Cluster"

3. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `pdfpage-admin`
   - Password: Generate a secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Whitelist IP Addresses**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**:
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string:
   ```
   mongodb+srv://pdfpage-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Add database name: `mongodb+srv://pdfpage-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pdfpage?retryWrites=true&w=majority`

---

## Step 2: Push Code to GitHub

1. **Make sure all changes are committed**:
```powershell
cd "e:\Builder-zen-field-main (1)\Builder-zen-field-main"
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

---

## Step 3: Deploy on Render.com

### 3.1 Sign Up and Connect GitHub

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub
4. Authorize Render to access your repositories

### 3.2 Create New Web Service

1. Click "New +" → "Web Service"
2. Select your repository: `pdfpage` or `Builder-zen-field-main`
3. Configure the service:

   **Basic Settings:**
   - **Name**: `pdfpage-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

   **Instance Type:**
   - Select "Free" (750 hours/month)

### 3.3 Add Environment Variables

Click "Advanced" → Add the following environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `10000` | Render uses this port |
| `MONGODB_URI` | Your MongoDB connection string | From Step 1 |
| `JWT_SECRET` | Generate random string (32+ chars) | Use password generator |
| `RAZORPAY_KEY_ID` | Your Razorpay key | Get from Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret | Get from Razorpay dashboard |
| `GMAIL_USER` | Your Gmail address (optional) | For email notifications |
| `GMAIL_APP_PASSWORD` | Gmail app password (optional) | From Google account settings |

**Generate JWT_SECRET Example:**
```
Use this random string: 8f7d9e2a1b5c4d3e6f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0
```

### 3.4 Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your server
   - Assign a URL like: `https://pdfpage-backend.onrender.com`

3. **Wait 3-5 minutes** for deployment to complete

---

## Step 4: Verify Deployment

### Check Health Endpoint
Open in browser:
```
https://pdfpage-backend.onrender.com/api/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T...",
  "uptime": 123.456,
  "mongodb": "connected"
}
```

### Check Logs
1. In Render dashboard, click "Logs"
2. Look for:
   - ✅ "Server running on port 10000"
   - ✅ "Connected to MongoDB"
   - ❌ No error messages

---

## Step 5: Update Frontend to Use New Backend

### Option A: Update for Production

Create/update `.env.production` file:
```env
VITE_API_URL=https://pdfpage-backend.onrender.com
```

### Option B: Keep Local Development Setup

Create/update `.env.local` file:
```env
VITE_API_URL=http://localhost:5002
```

And `.env.production`:
```env
VITE_API_URL=https://pdfpage-backend.onrender.com
```

---

## Step 6: Test Your Application

1. **Test API directly**:
   ```
   https://pdfpage-backend.onrender.com/api/health
   ```

2. **Test from Frontend**:
   - Deploy your frontend or run locally
   - Try PDF operations
   - Check authentication
   - Test payment flow

---

## Important Notes

### 🔴 Free Tier Limitations

1. **Sleep Mode**: 
   - Service sleeps after 15 minutes of inactivity
   - First request after sleep takes 30-50 seconds
   - Solution: Keep-alive ping (already configured in your backend)

2. **750 Hours/Month**:
   - About 31 days of uptime
   - More than enough for testing/development
   - Upgrade to paid plan ($7/month) for always-on service

3. **Performance**:
   - Shared CPU (512MB RAM)
   - Suitable for low-medium traffic
   - Upgrade if you need better performance

### 🟢 Auto-Deploy

- Render automatically deploys when you push to GitHub
- Any commit to `main` branch triggers deployment
- Check "Logs" tab to monitor deployments

### 🔧 Common Issues

**Issue: MongoDB connection failed**
- Check connection string has correct password
- Verify IP whitelist (0.0.0.0/0)
- Ensure database name is included in connection string

**Issue: Service won't start**
- Check environment variables are set correctly
- Review logs for error messages
- Verify `package.json` has correct start command

**Issue: 502 Bad Gateway**
- Service is probably starting (wait 1 minute)
- Check logs for errors
- Verify PORT environment variable is set to 10000

---

## Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string obtained and tested
- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] GitHub connected to Render
- [ ] Web service created
- [ ] All environment variables added
- [ ] Service deployed successfully
- [ ] Health endpoint returns success
- [ ] Frontend updated with new backend URL
- [ ] End-to-end testing completed

---

## Your Backend URL

After deployment, your backend will be available at:
```
https://pdfpage-backend.onrender.com
```

Use this URL in your frontend configuration!

---

## Monitoring and Management

### View Logs
```
Dashboard → Your Service → Logs
```

### Restart Service
```
Dashboard → Your Service → Manual Deploy → Deploy latest commit
```

### Update Environment Variables
```
Dashboard → Your Service → Environment → Edit
```

### View Metrics
```
Dashboard → Your Service → Metrics
- CPU usage
- Memory usage
- Request count
- Response times
```

---

## Cost Summary

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Render.com | Free tier | $0 |
| MongoDB Atlas | M0 Free | $0 |
| **Total** | | **$0** |

### Upgrade Options (Optional)

| Service | Plan | Cost | Benefits |
|---------|------|------|----------|
| Render | Starter | $7/mo | Always-on, no sleep |
| MongoDB | M2 | $9/mo | 2GB storage, better performance |

---

## Next Steps

1. **Now**: Deploy backend following steps above
2. **Today**: Test all API endpoints
3. **This Week**: Monitor performance and logs
4. **Future**: Consider upgrading if traffic increases

---

## Support

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Your Backend Code**: Check `backend/server.js` for configuration

---

## Quick Deploy Commands

```powershell
# 1. Commit and push changes
cd "e:\Builder-zen-field-main (1)\Builder-zen-field-main"
git add .
git commit -m "Deploy to Render"
git push origin main

# 2. Then go to Render.com and follow steps above

# 3. After deployment, test health endpoint
# Open: https://pdfpage-backend.onrender.com/api/health
```

---

## Environment Variables Template

Copy this and fill in your values:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pdfpage?retryWrites=true&w=majority
JWT_SECRET=your_32_character_random_string_here
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

---

**Ready to deploy? Start with Step 1 above! 🚀**
