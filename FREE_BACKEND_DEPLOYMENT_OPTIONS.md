# Free Backend Deployment Options for PDFPage.in

Since your Google Cloud free trial has ended, here are several FREE alternatives to deploy your backend:

---

## Option 1: Render.com (RECOMMENDED - Easiest)

**Free Tier:** 750 hours/month, sleeps after 15 mins of inactivity

### Steps:
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** pdfpage-backend
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Instance Type:** Free

6. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

7. Click "Create Web Service"

**Your backend URL:** `https://pdfpage-backend.onrender.com`

---

## Option 2: Railway.app (Best Performance)

**Free Tier:** $5 credit/month (renews monthly)

### Steps:
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Configure:
   - Railway will auto-detect Node.js
   - Set root directory to `backend`
   - Add environment variables (same as above)

**Your backend URL:** Auto-generated (e.g., `https://pdfpage-backend-production.up.railway.app`)

---

## Option 3: Fly.io (Global Edge Network)

**Free Tier:** 3 shared-cpu VMs with 256MB RAM

### Steps:
1. Install Fly CLI:
   ```powershell
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. Sign up and login:
   ```powershell
   fly auth signup
   fly auth login
   ```

3. Navigate to backend:
   ```powershell
   cd backend
   ```

4. Launch app:
   ```powershell
   fly launch
   ```

5. Follow prompts and deploy:
   ```powershell
   fly deploy
   ```

---

## Option 4: Cyclic.sh (Serverless)

**Free Tier:** Unlimited apps, AWS-powered

### Steps:
1. Go to https://cyclic.sh
2. Sign in with GitHub
3. Click "Link App" → Select your repository
4. Configure:
   - Root directory: `backend`
   - Add environment variables
5. Deploy automatically

---

## Option 5: Vercel (Serverless Functions)

**Free Tier:** Unlimited deployments

### Setup:
1. Install Vercel CLI:
   ```powershell
   npm install -g vercel
   ```

2. Create `vercel.json` in backend folder:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

3. Deploy:
   ```powershell
   cd backend
   vercel
   ```

---

## Option 6: Run Locally (Development Only)

### Quick Start:
```powershell
# Terminal 1 - Backend
cd "E:\Builder-zen-field-main (1)\Builder-zen-field-main\backend"
npm install
npm start

# Terminal 2 - Frontend
cd "E:\Builder-zen-field-main (1)\Builder-zen-field-main"
npm install
npm run dev
```

**Access:** http://localhost:3000

---

## Option 7: Koyeb (Global Edge)

**Free Tier:** 1 web service, 512MB RAM

### Steps:
1. Go to https://koyeb.com
2. Sign up with GitHub
3. Create new app from GitHub
4. Configure and deploy

---

## Option 8: Glitch (Instant Deploy)

**Free Tier:** Always-on option available

### Steps:
1. Go to https://glitch.com
2. Click "New Project" → "Import from GitHub"
3. Paste your repo URL
4. Glitch automatically deploys

---

## Recommended Database Options (MongoDB)

Since you need MongoDB:

### MongoDB Atlas (FREE)
- **Free Tier:** 512MB storage
- **Setup:** https://www.mongodb.com/cloud/atlas/register
- **Steps:**
  1. Create free cluster
  2. Get connection string
  3. Add to environment variables

---

## My Recommendation

**For your use case, I recommend:**

1. **Backend:** Render.com (easy, reliable, free)
2. **Database:** MongoDB Atlas (free 512MB)
3. **Frontend:** Keep on current host or use Vercel

This combination gives you:
- ✅ Completely free
- ✅ No credit card required
- ✅ Auto-deploy on git push
- ✅ SSL certificates included
- ✅ Easy environment variable management

---

## After Deployment

Update your frontend API endpoint in:
```typescript
// src/services/paymentService.ts
const API_BASE_URL = "https://your-backend-url.onrender.com";
```

---

## Need Help?

Run this command to test your backend locally first:
```powershell
cd backend
npm install
npm start
```

Then open http://localhost:3000 to verify it works before deploying.
