# LibreOffice Docker Setup for PdfPage Backend

This document describes the comprehensive Docker-based LibreOffice setup for headless document conversion.

## 🐳 Docker Configuration

### Dockerfile.production

- **Base Image**: Ubuntu 22.04 (as requested)
- **Node.js**: LTS v18 installation
- **LibreOffice**: Full suite with headless support
- **Security**: Non-root user execution
- **Fonts**: Comprehensive font support for better rendering
- **Health Check**: Built-in health monitoring

### Key Features

- ✅ LibreOffice headless mode for server environments
- ✅ Comprehensive font support (Liberation, DejaVu, Noto)
- ✅ Java runtime for LibreOffice functionality
- ✅ ImageMagick and Ghostscript for image processing
- ✅ Non-root user for security
- ✅ Proper file permissions and directory structure

## 🚀 Deployment Configuration

### render.yaml

Complete Render.com deployment configuration with:

- Docker-based backend service
- Static frontend deployment
- MongoDB database integration
- Environment variable management
- Health check monitoring

## 📋 Available Endpoints

The LibreOffice service provides the following conversion endpoints:

### Document Conversions

1. **DOCX → PDF**: `POST /api/libreoffice/docx-to-pdf`
2. **PDF → DOCX**: `POST /api/libreoffice/pdf-to-docx`
3. **PPTX → PDF**: `POST /api/libreoffice/pptx-to-pdf`
4. **XLSX → PDF**: `POST /api/libreoffice/xlsx-to-pdf`
5. **PDF → XLSX**: `POST /api/libreoffice/pdf-to-xlsx`

### System Status

- **Status Check**: `GET /api/libreoffice/status`

## 🔧 API Usage Examples

### Convert DOCX to PDF

```bash
curl -X POST \
  https://pdf-backend-935131444417.asia-south1.run.app/api/libreoffice/docx-to-pdf \
  -F "file=@document.docx" \
  -F "quality=premium" \
  -F "preserveFormatting=true" \
  --output converted.pdf
```

### Convert PDF to DOCX

```bash
curl -X POST \
  https://pdf-backend-935131444417.asia-south1.run.app/api/libreoffice/pdf-to-docx \
  -F "file=@document.pdf" \
  -F "preserveLayout=true" \
  --output converted.docx
```

### Check LibreOffice Status

```bash
curl https://pdf-backend-935131444417.asia-south1.run.app/api/libreoffice/status
```

## 🛠 Technical Implementation

### LibreOfficeService Class

- **Initialization**: Automatic availability checking
- **Command Execution**: Secure child process management
- **Error Handling**: Comprehensive error reporting
- **File Management**: Automatic cleanup
- **Timeout Protection**: Prevents hanging processes

### Security Features

- **File Size Limits**: 50MB maximum upload
- **File Type Validation**: Only allowed extensions
- **Rate Limiting**: IP-based usage limits
- **Authentication**: Optional user authentication
- **Process Isolation**: Sandboxed LibreOffice execution

### Quality Options

- **Standard**: Basic conversion
- **High**: Enhanced quality settings
- **Premium**: Maximum quality with advanced export options

## 🔄 Conversion Process Flow

1. **File Upload**: Multer handles multipart form data
2. **Validation**: File type and size checking
3. **Preprocessing**: Temporary file creation
4. **Conversion**: LibreOffice headless execution
5. **Validation**: Output file verification
6. **Response**: File stream with metadata headers
7. **Cleanup**: Automatic temporary file removal

## 📊 Response Headers

All conversion endpoints include useful metadata:

- `X-Processing-Time`: Conversion duration (ms)
- `X-Conversion-Engine`: Always "LibreOffice"
- `X-File-Size`: Output file size
- `X-Conversion-Quality`: Quality setting used
- `Content-Type`: Appropriate MIME type
- `Content-Disposition`: Download filename

## 🚨 Error Handling

### Common Error Scenarios

- LibreOffice not available
- Unsupported file format
- File size too large
- Conversion timeout
- Corrupt input file
- Insufficient disk space

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Detailed error info (development only)"
}
```

## 🔍 Monitoring & Debugging

### Health Check

The `/api/libreoffice/status` endpoint provides:

```json
{
  "success": true,
  "status": {
    "available": true,
    "version": "LibreOffice 7.x.x",
    "tempDir": "/usr/src/app/temp",
    "supportedConversions": [
      "DOCX → PDF",
      "PDF → DOCX",
      "PPTX → PDF",
      "XLSX → PDF",
      "PDF → XLSX"
    ]
  }
}
```

### Logging

- Detailed conversion logging
- Processing time tracking
- Error reporting with stack traces
- File operation logging

## 🚀 Deployment Instructions

### For Render.com

1. Push code to GitHub repository
2. Connect repository to Render
3. Use the provided `render.yaml` configuration
4. Set required environment variables
5. Deploy using Docker build

### Environment Variables

```bash
NODE_ENV=production
PORT=5000
LIBREOFFICE_AVAILABLE=true
LIBREOFFICE_HEADLESS=true
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### Docker Build Command

```bash
docker build -f Dockerfile.production -t pdfpage-backend .
docker run -p 5000:5000 -e NODE_ENV=production pdfpage-backend
```

## 🔧 Integration with Frontend

The frontend can use these endpoints with CORS support:

- All endpoints support cross-origin requests
- Proper CORS headers included
- FormData upload support
- Progress tracking capabilities

## 📈 Performance Considerations

- **Concurrent Processing**: Multiple LibreOffice instances
- **Memory Management**: Automatic cleanup
- **Timeout Protection**: 2-minute conversion limit
- **File Size Limits**: 50MB maximum
- **Rate Limiting**: Prevents abuse

## 🛡 Security Best Practices

- Non-root container execution
- File type validation
- Size limitations
- Process sandboxing
- Temporary file cleanup
- Input sanitization

This setup provides a robust, production-ready LibreOffice conversion service that can handle high-volume document processing with excellent reliability and security.
