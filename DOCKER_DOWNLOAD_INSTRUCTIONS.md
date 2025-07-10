# 🚀 Docker Heavy Libraries Auto-Download Scripts

## 📁 Scripts Created

I've created **4 automated scripts** to download all heavy library Docker images:

### 🖥️ Windows Scripts

1. **`download-docker-images.bat`** - Downloads ALL 27 heavy library images (~30-60 minutes)
2. **`download-essential-images.bat`** - Downloads 8 essential images (~10-15 minutes)

### 🐧 Linux/Mac Scripts

3. **`download-docker-images.sh`** - Downloads ALL 27 heavy library images (~30-60 minutes)
4. **`download-essential-images.sh`** - Downloads 8 essential images (~10-15 minutes)

## 🚀 How to Use

### Windows Users:

```cmd
# Download all heavy libraries (full setup)
./download-docker-images.bat

# OR download only essentials (quick setup)
./download-essential-images.bat
```

### Linux/Mac Users:

```bash
# Make scripts executable first
chmod +x download-docker-images.sh
chmod +x download-essential-images.sh

# Download all heavy libraries (full setup)
./download-docker-images.sh

# OR download only essentials (quick setup)
./download-essential-images.sh
```

## 📦 What Gets Downloaded

### 🎯 Essential Images (8 total - ~5GB):

1. **gotenberg/gotenberg:7** - PDF processing service
2. **dpokidov/imagemagick** - Complete ImageMagick
3. **jbarlow83/ocrmypdf** - Advanced OCR pipeline
4. **jrottenberg/ffmpeg:4.4-alpine** - Video processing
5. **collabora/code** - LibreOffice document conversion
6. **alekzonder/puppeteer** - Graphics rendering
7. **h2non/imaginary** - Fast image API
8. **node:18-bullseye** - Node.js base

### 🎯 Full Images (27 total - ~15GB):

All essential images PLUS:

- Additional PDF tools (wkhtmltopdf, pandoc)
- More image processors (GraphicsMagick variations)
- Extra OCR engines (Tesseract variants)
- Video codecs (x264, x265)
- Python environments
- Specialized tools (Calibre, etc.)

## 🎛️ Using Downloaded Images

### Option 1: Replace Your Custom Build

Edit your `docker-compose.yml`:

```yaml
services:
  backend:
    image: gotenberg/gotenberg:7 # Instead of building custom
    ports:
      - "5000:3000"
```

### Option 2: Use as Additional Services

Use the provided `docker-compose.heavy-services.yml`:

```bash
# Run your backend + downloaded services
docker-compose -f docker-compose.heavy-services.yml up
```

This gives you:

- Your custom backend (port 5000)
- PDF service (port 3001)
- Image service (port 3002)
- Office service (port 3003)

## 🔧 Manual Download Commands

If you prefer manual control:

```bash
# Essential PDF processing
docker pull gotenberg/gotenberg:7

# Essential image processing
docker pull dpokidov/imagemagick

# Essential OCR
docker pull jbarlow83/ocrmypdf

# Essential video
docker pull jrottenberg/ffmpeg:4.4-alpine

# Fast image API
docker pull h2non/imaginary
```

## 🎯 API Endpoints After Download

Once running with `docker-compose.heavy-services.yml`:

### PDF Service (port 3001):

```bash
# Convert HTML to PDF
curl -X POST http://localhost:3001/forms/chromium/convert/html \
  -F "files=@index.html" \
  -o result.pdf
```

### Image Service (port 3002):

```bash
# Resize image
curl "http://localhost:3002/resize?width=300&height=200&url=https://example.com/image.jpg" \
  -o resized.jpg
```

### Office Service (port 3003):

```bash
# Access LibreOffice Online
# Open browser: http://localhost:3003
```

## ⚡ Performance Comparison

| Approach              | Build Time | Container Size | Memory Use | Boot Time |
| --------------------- | ---------- | -------------- | ---------- | --------- |
| **Your Custom Build** | 20-30 min  | ~8GB           | 4-8GB      | 30s       |
| **Downloaded Images** | 0 min      | ~15GB total    | 1-2GB each | 5-10s     |
| **Essential Only**    | 0 min      | ~5GB total     | 1-2GB each | 5-10s     |

## 🎯 Recommendations

### For Development:

```bash
# Quick start with essentials
./download-essential-images.bat
docker-compose -f docker-compose.heavy-services.yml up
```

### For Production:

```bash
# Full download for maximum capabilities
./download-docker-images.bat
# Then customize docker-compose as needed
```

### Best Performance:

- Use **downloaded images** for common operations (faster boot)
- Keep **your custom build** for complex/custom processing
- **Microservices approach** = best of both worlds

## 🛠️ Troubleshooting

### If download fails:

```bash
# Check Docker is running
docker --version

# Check internet connection
ping hub.docker.com

# Retry individual image
docker pull gotenberg/gotenberg:7
```

### Check downloaded images:

```bash
# List all Docker images
docker images

# Check image details
docker inspect gotenberg/gotenberg:7
```

## 🎉 Result

After running the scripts, you'll have **instant access** to heavy processing capabilities without the 30-minute build time!

**No more waiting for Docker builds!** 🚀
