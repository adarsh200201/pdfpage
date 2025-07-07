# Backend Debug Guide - "Unable to connect to backend"

## Immediate Debug Steps

### 1. Check Server Status

Run these diagnostic scripts to identify the issue:

```bash
# Navigate to backend directory
cd backend

# Test 1: Check basic syntax and dependencies
node diagnose-server.js

# Test 2: Try minimal server startup
node minimal-server-test.js
```

### 2. Check Server Logs

If you're on Render.com:

1. Go to your Render dashboard
2. Select your backend service
3. Click on "Logs" tab
4. Look for error messages during startup

### 3. Common Issues and Fixes

#### Issue A: MongoDB Connection Failed

**Symptoms:**

- Server logs show "MongoDB connection error"
- Can't connect to database

**Fix:**

```bash
# Check if MONGODB_URI is set correctly
echo $MONGODB_URI

# Test MongoDB connection manually
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'your-uri-here')
  .then(() => { console.log('✅ MongoDB OK'); process.exit(0); })
  .catch(err => { console.log('❌ MongoDB Error:', err.message); process.exit(1); });
"
```

#### Issue B: Port Already in Use

**Symptoms:**

- "EADDRINUSE" error
- "Port 5000 is already in use"

**Fix:**

```bash
# Kill processes on port 5000
pkill -f "node.*server.js"
# OR
lsof -ti:5000 | xargs kill

# Start fresh
npm start
```

#### Issue C: Missing Dependencies

**Symptoms:**

- "Cannot find module" errors
- Import/require failures

**Fix:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Specific Chrome/Puppeteer fix
npm run setup:chrome
```

#### Issue D: Environment Variables Missing

**Symptoms:**

- "Not set" in environment check
- Authentication errors

**Fix:**

```bash
# Check .env file exists and has content
cat .env

# For Render deployment, verify in dashboard:
# - NODE_ENV=production
# - MONGODB_URI=[your database]
# - JWT_SECRET=[your secret]
```

#### Issue E: Syntax Errors in Code

**Symptoms:**

- Server crashes immediately
- Syntax error messages

**Fix:**

```bash
# Check specific files for syntax errors
node -c services/documentConversionService.js
node -c routes/pdf.js
node -c server.js
```

### 4. Emergency Fixes

#### Quick Fix 1: Revert DocumentConversionService

If the Chrome fix caused issues, temporarily revert:

```javascript
// In services/documentConversionService.js, comment out the findChromeExecutable call
constructor() {
  // const chromeExecutable = this.findChromeExecutable();
  const chromeExecutable = null; // Use Puppeteer's bundled Chrome
  // ... rest of constructor
}
```

#### Quick Fix 2: Use Backup Server Configuration

Create a minimal server.js backup:

```javascript
require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backup server running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backup server running on port ${PORT}`);
});
```

### 5. Deployment-Specific Issues

#### For Render.com:

1. **Build Logs**: Check build logs for installation failures
2. **Environment**: Verify all environment variables are set
3. **Resource Limits**: Check if you've hit memory/CPU limits
4. **Dockerfile**: Ensure Docker build completes successfully

#### For Local Development:

1. **Node Version**: Ensure you're using Node.js 16+
2. **Network**: Check if localhost:5000 is accessible
3. **Firewall**: Verify no firewall blocking the port

### 6. Test Commands

```bash
# Test 1: Basic connectivity
curl -I http://localhost:5000/api/health

# Test 2: Check server process
ps aux | grep node

# Test 3: Check port usage
netstat -tulpn | grep :5000

# Test 4: Check logs
tail -f logs/combined.log
```

### 7. Recovery Steps

1. **Stop all processes**: `pkill -f node`
2. **Clear temp files**: `rm -rf temp/* logs/*`
3. **Reinstall**: `npm install`
4. **Start fresh**: `npm start`

### 8. If Nothing Works

**Immediate Workaround:**

1. Use the LibreOffice endpoint directly: `/api/pdf/word-to-pdf-libreoffice`
2. Deploy without the Chrome modifications
3. Roll back to previous working version

**Long-term Fix:**

1. Check Render service settings
2. Verify Docker configuration
3. Test with minimal configuration first
4. Gradually add features back

## Contact Information

If issues persist, provide these details:

- Error messages from server logs
- Output from `node diagnose-server.js`
- Environment (local/Render/other)
- Recent changes made to the codebase
