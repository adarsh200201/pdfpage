# Running PDFPage.in Locally (After Google Cloud Trial Ended)

## Quick Start (Windows)

### Option 1: Double-click to Start
Simply double-click `start-local.bat` - this will start both backend and frontend automatically!

### Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```powershell
npm install
npm run dev
```

---

## What You Need

1. **Node.js** (v16 or higher) - Already installed ✅
2. **MongoDB** - Options:
   - MongoDB Atlas (Free): https://www.mongodb.com/cloud/atlas/register
   - Local MongoDB: https://www.mongodb.com/try/download/community
3. **Environment Variables** - Create `.env` file in backend folder:

```env
# Backend Configuration
PORT=5002
NODE_ENV=development

# MongoDB (Get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/pdfpage?retryWrites=true&w=majority

# JWT Secret (Any random string)
JWT_SECRET=your_super_secret_jwt_key_here_12345

# Razorpay (For payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Optional: Email Service
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

---

## Access Your Application

- **Frontend:** http://localhost:48752 (or check terminal for actual port)
- **Backend API:** http://localhost:5002
- **Health Check:** http://localhost:5002/api/health

---

## Free MongoDB Setup (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a **Free Cluster** (M0 - 512MB)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Paste into `.env` file as `MONGODB_URI`

---

## Deploy Backend for FREE

### Recommended: Render.com

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your repository
5. Configure:
   - **Name:** pdfpage-backend
   - **Root Directory:** backend
   - **Environment:** Node
   - **Build Command:** npm install
   - **Start Command:** npm start
   - **Instance Type:** Free
6. Add all environment variables from your `.env` file
7. Click "Create Web Service"

**Your backend URL:** `https://pdfpage-backend.onrender.com`

### Update Frontend to Use Deployed Backend

In `.env` file (create if not exists):
```env
VITE_API_URL=https://pdfpage-backend.onrender.com
```

---

## Other Free Backend Options

See `FREE_BACKEND_DEPLOYMENT_OPTIONS.md` for 8 different free hosting options including:
- Railway.app ($5/month free credit)
- Fly.io (3 free VMs)
- Cyclic.sh (Unlimited apps)
- Vercel (Serverless)
- And more...

---

## Troubleshooting

### Backend won't start
```powershell
cd backend
npm install
npm start
```

### Frontend can't connect to backend
1. Make sure backend is running on port 5002
2. Check `vite.config.ts` has correct proxy target
3. Restart frontend dev server

### MongoDB connection error
1. Check your MongoDB Atlas connection string
2. Make sure your IP is whitelisted in MongoDB Atlas
3. Verify username/password are correct

### Port already in use
Kill the process:
```powershell
# Find process on port 5002
netstat -ano | findstr :5002

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F
```

---

## Project Status

✅ Backend running locally on port 5002
✅ Frontend configured to proxy to port 5002
✅ MongoDB Atlas setup guide provided
✅ Multiple free deployment options available
✅ Quick start script created

---

## Next Steps

1. **Now:** Run locally with `start-local.bat`
2. **Today:** Sign up for MongoDB Atlas (free)
3. **This Week:** Deploy backend to Render.com (free)
4. **Bonus:** Set up automatic deployments on git push

---

## Need More Help?

- Check `FREE_BACKEND_DEPLOYMENT_OPTIONS.md` for deployment guides
- Backend logs are in `backend/logs/`
- Frontend console shows API calls and errors
- MongoDB Atlas has built-in monitoring

---

## Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| MongoDB Atlas | M0 (512MB) | FREE |
| Render.com | Free tier | FREE |
| Frontend Hosting | Current | FREE |
| **TOTAL** | | **$0/month** |

You can run your entire application **completely free** forever! 🎉
