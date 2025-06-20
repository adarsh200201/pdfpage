# Backend Deployment Guide

## Quick Setup & Deployment

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Make sure `.env` file has all required variables:

```env
MONGODB_URI=mongodb+srv://ADARSHSHARMA__:SITADEVI%401234765__@cluster1.tcdmjd6.mongodb.net/pdfwiz
JWT_SECRET=K8r@Yw94!s@Nz$ePq#1L&uVz7Gp*TjCv
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=urbanride219@gmail.com
SMTP_PASS=xzdlmsvmlzytmzpn
EMAIL_FROM=noreply@pdfpage.com
EMAIL_FROM_NAME=PdfPage

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dj8qhuudz
CLOUDINARY_API_KEY=862265886717521
CLOUDINARY_API_SECRET=jEG7MtWenZDOfC3-iFMYJC_1aaA

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_PnSgiqE2elzEYx
RAZORPAY_KEY_SECRET=RV1PocdlG73ZiDFxneoYcsyQ

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### 3. Local Development

```bash
# Start development server
npm run dev

# OR start production server
npm start
```

### 4. Deploy to Railway (Recommended - Free)

1. **Connect to Railway:**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Initialize project
   railway init
   ```

2. **Deploy:**

   ```bash
   # Deploy from current directory
   railway up
   ```

3. **Add Environment Variables:**

   - Go to Railway dashboard
   - Select your project
   - Go to Variables tab
   - Add all environment variables from your `.env` file

4. **Set Domain:**
   - Go to Settings → Networking
   - Generate domain or add custom domain

### 5. Deploy to Render (Alternative - Free)

1. **Connect GitHub:**

   - Push code to GitHub
   - Connect Render to your GitHub repo

2. **Create Web Service:**

   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

3. **Add Environment Variables:**
   - Add all variables from `.env` file in Render dashboard

### 6. Deploy to Vercel (Serverless)

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Create vercel.json:**

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
         "dest": "/server.js"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### 7. Test Deployment

After deployment, test these endpoints:

```bash
# Health check
curl https://your-api-domain.com/api/health

# Auth test
curl -X POST https://your-api-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123456"}'

# PDF tools list
curl https://your-api-domain.com/api/pdf/tools
```

### 8. Update Frontend

Update your frontend `.env` file:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

### 9. Production Optimizations

1. **Enable MongoDB Atlas IP Whitelist:**

   - Add your server IP to MongoDB Atlas
   - Or use `0.0.0.0/0` for all IPs (less secure)

2. **Enable Cloudinary Upload Presets:**

   - Create upload preset in Cloudinary dashboard
   - Update upload routes to use presets

3. **Setup Monitoring:**
   - Add error tracking (Sentry)
   - Setup uptime monitoring
   - Configure log aggregation

### 10. Security Checklist

- ✅ All sensitive data in environment variables
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Helmet security headers
- ✅ Input validation on all routes
- ✅ File upload limits enforced
- ✅ JWT secret is strong and unique
- ✅ MongoDB connection secured

## API Endpoints Reference

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Payments

- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/plans` - Get available plans
- `GET /api/payments/history` - Payment history
- `GET /api/payments/subscription-status` - Subscription status

### PDF Processing

- `POST /api/pdf/merge` - Merge PDF files
- `POST /api/pdf/compress` - Compress PDF
- `POST /api/pdf/split` - Split PDF pages
- `GET /api/pdf/tools` - Available tools

### Usage Tracking

- `POST /api/usage/track` - Track operation
- `GET /api/usage/daily` - Daily usage stats
- `GET /api/usage/stats` - Usage statistics
- `GET /api/usage/check-limit` - Check usage limits

### User Management

- `GET /api/users/profile` - Detailed profile
- `GET /api/users/dashboard` - Dashboard data
- `GET /api/users/billing` - Billing info
- `DELETE /api/users/account` - Delete account

### File Upload (Premium)

- `POST /api/upload/cloudinary` - Upload to cloud
- `GET /api/upload/files` - List user files
- `DELETE /api/upload/files/:id` - Delete file
- `GET /api/upload/storage-info` - Storage stats

## Monitoring & Maintenance

### Health Checks

```bash
# Check server status
curl https://your-api.com/api/health

# Check MongoDB connection
curl https://your-api.com/api/auth/me -H "Authorization: Bearer invalid-token"
```

### Log Monitoring

```bash
# Railway logs
railway logs

# Render logs
# Check logs in Render dashboard

# Local logs
npm start 2>&1 | tee logs/app.log
```

Your backend is now production-ready and can handle:

- ✅ Real user registrations
- ✅ Payment processing with Razorpay
- ✅ PDF file processing
- ✅ Usage tracking and limits
- ✅ Premium features
- ✅ File uploads to Cloudinary
- ✅ Security and rate limiting

**Total setup time: 30-60 minutes for a complete money-making PDF API!**
