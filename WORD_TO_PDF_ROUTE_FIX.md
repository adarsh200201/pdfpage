# Word to PDF Route Fix

## Problem

The frontend is calling `/api/pdf/word-to-pdf-libreoffice` but this route doesn't exist in the backend, causing a 404 error.

## Root Cause

- Frontend expects: `POST /api/pdf/word-to-pdf-libreoffice`
- Backend has: `POST /api/libreoffice/docx-to-pdf` (working)
- Missing route alias in `backend/routes/pdf.js`

## Solution Applied

Added the missing route `/api/pdf/word-to-pdf-libreoffice` to `backend/routes/pdf.js` that uses the same LibreOffice service as the working route.

## Files Modified

- `backend/routes/pdf.js` - Added missing route and required dependencies

## Route Details

```javascript
POST /api/pdf/word-to-pdf-libreoffice
- Accepts: DOCX, DOC files
- Returns: PDF file
- Uses: LibreOffice service
- Rate limiting: Applied
- Auth: Optional
```

## Deployment Required

The backend server needs to be restarted to apply the changes:

1. **For Render deployment:**

   ```bash
   # Redeploy the backend service on Render
   ```

2. **For local testing:**
   ```bash
   cd backend
   npm run dev
   ```

## Testing

After deployment, test with:

```bash
curl -X POST https://pdf-backend-935131444417.asia-south1.run.app/api/pdf/word-to-pdf-libreoffice \
  -F "file=@test.docx" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Backend Logs to Verify

Look for:

- `🚀 LibreOffice Word to PDF: filename.docx`
- `✅ Word to PDF completed in XXXms`

## Status

✅ Route code added - **DEPLOYMENT NEEDED**
