# Quick Deploy to Render - 5 Minute Guide

## 🚀 Fast Track Deployment

### Step 1: Get MongoDB Connection String (2 min)
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create FREE M0 cluster
3. Create database user with password
4. Network Access → Add IP → "Allow from Anywhere"
5. Connect → Get connection string:
   ```
   mongodb+srv://username:PASSWORD@cluster.mongodb.net/pdfpage?retryWrites=true&w=majority
   ```

### Step 2: Push to GitHub (1 min)
```powershell
cd "e:\Builder-zen-field-main (1)\Builder-zen-field-main"
git add .
git commit -m "Deploy to Render"
git push origin main
```

### Step 3: Deploy on Render (2 min)
1. Go to https://render.com
2. Sign up with GitHub
3. New → Web Service → Select your repo
4. Configure:
   - **Name**: pdfpage-backend
   - **Root Directory**: backend
   - **Build**: `npm install`
   - **Start**: `npm start`
   - **Plan**: FREE

5. Add Environment Variables:
   ```
   NODE_ENV = production
   PORT = 10000
   MONGODB_URI = (your connection string from Step 1)
   JWT_SECRET = (random 32 char string)
   RAZORPAY_KEY_ID = (your key)
   RAZORPAY_KEY_SECRET = (your secret)
   ```

6. Click "Create Web Service"

### Step 4: Done! ✅
Your backend URL: `https://pdfpage-backend.onrender.com`

Test: https://pdfpage-backend.onrender.com/api/health

---

## Environment Variables Needed

| Variable | Where to Get | Example |
|----------|--------------|---------|
| MONGODB_URI | MongoDB Atlas | `mongodb+srv://...` |
| JWT_SECRET | Generate random | `8f7d9e2a1b5c4d3e6f0a9b8c...` |
| RAZORPAY_KEY_ID | Razorpay Dashboard | `rzp_test_xxxxx` |
| RAZORPAY_KEY_SECRET | Razorpay Dashboard | `xxxxxxxxxxxxxxxx` |

---

## After Deployment

Update frontend `.env.production`:
```
VITE_API_URL=https://pdfpage-backend.onrender.com
```

---

**Complete guide**: See `RENDER_DEPLOYMENT_GUIDE.md`
