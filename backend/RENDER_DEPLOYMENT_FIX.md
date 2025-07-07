# Render.com Deployment Fix for Chrome/Puppeteer Issues

## Problem

Word to PDF, Excel to PDF, and PowerPoint to PDF conversions are failing with the error:

```
Could not find Chrome (ver. 138.0.7204.92). This can occur if either
1. you did not perform an installation before running the script (e.g. `npx puppeteer browsers install chrome`) or
2. your cache path is incorrectly configured (which is: /opt/render/.cache/puppeteer).
```

## Root Cause

The Render deployment environment doesn't have Chrome browser installed, which is required by Puppeteer for PDF generation.

## Solution

### 1. Update Dockerfile for Chrome Installation

The updated `Dockerfile` now includes:

- Chrome browser installation
- Proper environment variables for Puppeteer
- LibreOffice for alternative conversion methods
- Optimized Chrome flags for containerized environments

### 2. Enhanced Puppeteer Configuration

The `DocumentConversionService` now includes:

- Multiple fallback strategies for launching Chrome
- Environment detection for containerized deployments
- Robust error handling with meaningful error messages
- Chrome executable path detection

### 3. Deployment Steps for Render.com

#### Option A: Use the Updated Dockerfile (Recommended)

1. Deploy with the updated `Dockerfile` which includes Chrome installation
2. Set environment variables in Render dashboard:
   ```
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
   CHROME_BIN=/usr/bin/google-chrome-stable
   NODE_ENV=production
   ```

#### Option B: Alternative Deployment Configuration

If the Dockerfile approach doesn't work, you can use these environment variables in Render:

```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
CHROME_BIN=/usr/bin/google-chrome-stable
RENDER=true
```

### 4. Build Commands for Render

Update your Render service configuration:

**Build Command:**

```bash
npm install && npm run setup:chrome
```

**Start Command:**

```bash
npm start
```

### 5. Testing the Fix

After deployment, test these endpoints:

- `/api/pdf/word-to-pdf` - Primary Puppeteer-based conversion
- `/api/pdf/word-to-pdf-libreoffice` - LibreOffice fallback
- `/api/pdf/excel-to-pdf` - Excel to PDF conversion
- `/api/pdf/powerpoint-to-pdf` - PowerPoint to PDF conversion

### 6. Monitoring and Debugging

The enhanced error handling will provide better error messages:

- Chrome installation status
- Puppeteer configuration details
- Fallback strategy attempts
- Clear error messages for users

### 7. Memory Considerations

Chrome can be memory-intensive. For Render deployments:

- Use the `--single-process` flag (already included)
- Monitor memory usage in Render dashboard
- Consider upgrading to a higher-tier plan if needed

### 8. Troubleshooting

If issues persist:

1. Check Render logs for Chrome installation errors
2. Verify environment variables are set correctly
3. Test with the LibreOffice fallback endpoints
4. Contact Render support if Docker-related issues occur

### 9. Alternative Solutions

If Chrome installation continues to fail:

1. Use LibreOffice-based conversion endpoints exclusively
2. Implement client-side PDF generation for simple documents
3. Use external PDF generation services for complex documents

## Environment Variables Reference

```bash
# Required for Render deployment
NODE_ENV=production
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
CHROME_BIN=/usr/bin/google-chrome-stable

# Optional optimization
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
LIBREOFFICE_AVAILABLE=true
```

This fix ensures robust PDF conversion across all browsers and deployment environments.
