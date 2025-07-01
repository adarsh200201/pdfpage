# PdfPage Development Setup

## 🚀 Quick Start Guide

This project consists of a React frontend and a Node.js backend. Both need to be running for full functionality.

### ✅ Current Status

**Frontend**: ✅ Running on http://localhost:3000
**Backend**: ❌ Needs to be started manually
**Database**: ✅ MongoDB Atlas (cloud-hosted)

### 🔧 Starting the Development Environment

#### 1. Start the Frontend (Already Running)

The frontend is already configured and running. If you need to restart:

```bash
npm run dev
```

#### 2. Start the Backend

Open a new terminal and run:

```bash
cd backend
npm install  # Only needed first time
npm run dev  # Starts backend on port 5000
```

The backend will start on http://localhost:5000 and the frontend proxy will automatically forward `/api` requests to it.

### 🌐 How the Proxy Works

- Frontend runs on: `http://localhost:3000`
- Backend runs on: `http://localhost:5000`
- API calls to `/api/*` are automatically proxied from frontend to backend
- This is configured in `vite.config.ts`

### 🔗 Testing the Full Stack

1. ✅ Frontend: Visit http://localhost:3000
2. ✅ Backend Health Check: Visit http://localhost:5000/api/health
3. ✅ Full Integration: Use any PDF tool on the frontend

### 🛠️ Environment Variables

**Frontend (.env):**

```env
VITE_API_URL=http://localhost:5000/api  # Points to local backend
```

**Backend (.env):**

```env
PORT=5000
NODE_ENV=development  # Change from production to development
MONGODB_URI=mongodb+srv://...  # Already configured
```

### 🐛 Troubleshooting

**Problem**: API calls fail with network errors
**Solution**: Make sure the backend is running on port 5000

**Problem**: MongoDB connection errors
**Solution**: The MongoDB URI is already configured for the cloud database

**Problem**: Authentication doesn't work
**Solution**: Ensure both frontend and backend are running

### 📁 Project Structure

```
pdfpage/
├── src/                    # Frontend React app
├── backend/               # Backend Node.js API
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   └── server.js         # Main server file
├── public/               # Static files
└── vite.config.ts        # Frontend build config
```

### 🚀 Production Deployment

- **Frontend**: Deployed to Netlify
- **Backend**: Deployed to Render/Railway
- **Database**: MongoDB Atlas

### 💡 Quick Commands

```bash
# Start frontend only
npm run dev

# Start backend only (in separate terminal)
cd backend && npm run dev

# Install all dependencies
npm install && cd backend && npm install

# Check backend health
curl http://localhost:5000/api/health
```

### ✨ What's Working

✅ All PDF tools work client-side (no backend needed)
✅ Image processing tools
✅ File uploads and downloads
✅ Real-time PDF processing
✅ User interface and navigation

### 🔑 What Needs Backend

❌ User authentication and registration
❌ Premium subscription payments
❌ Usage tracking and limits
❌ Saved files and history
❌ Email notifications

For basic PDF processing, the frontend works independently!
