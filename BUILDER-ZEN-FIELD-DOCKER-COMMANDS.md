# 🚀 BUILDER-ZEN-FIELD PROJECT - Docker Commands with File Names

## 📁 PROJECT STRUCTURE

```
Builder-zen-field-main/
├── src/
├── backend/
├── docker-compose.yml
├── download-docker-images.bat
├── download-docker-images.sh
├── download-essential-images.bat
├── download-essential-images.sh
└── package.json
```

## 📋 SINGLE COMMAND - Copy & Paste (Essential Images)

```bash
cd Builder-zen-field-main && docker pull gotenberg/gotenberg:7 && docker pull dpokidov/imagemagick && docker pull jbarlow83/ocrmypdf && docker pull jrottenberg/ffmpeg:4.4-alpine && docker pull collabora/code && docker pull alekzonder/puppeteer && docker pull h2non/imaginary && docker pull node:18-bullseye
```

## 📋 WINDOWS COMMANDS (Copy & Paste)

```cmd
cd "C:\Users\Adarsh Sharma\Downloads\Builder-zen-field-main (1)\Builder-zen-field-main"
.\download-essential-images.bat
```

## 📋 ALTERNATIVE WINDOWS (If in project folder)

```cmd
cd Builder-zen-field-main
docker pull gotenberg/gotenberg:7 && docker pull dpokidov/imagemagick && docker pull jbarlow83/ocrmypdf && docker pull jrottenberg/ffmpeg:4.4-alpine && docker pull collabora/code && docker pull alekzonder/puppeteer && docker pull h2non/imaginary && docker pull node:18-bullseye
```

## 📋 LINUX/MAC COMMANDS (Copy & Paste)

```bash
cd Builder-zen-field-main
chmod +x download-essential-images.sh
./download-essential-images.sh
```

## 📋 BUILD YOUR PROJECT WITH HEAVY LIBRARIES

```bash
# Navigate to project
cd Builder-zen-field-main

# Build your custom Docker with heavy libraries
docker-compose down
docker-compose build --no-cache backend

# Run with downloaded images as additional services
docker-compose -f docker-compose.heavy-services.yml up
```

## 📋 COMPLETE ALL IMAGES COMMAND (27 images)

```bash
cd Builder-zen-field-main && docker pull gotenberg/gotenberg:7 && docker pull dpokidov/imagemagick && docker pull jbarlow83/ocrmypdf && docker pull jrottenberg/ffmpeg:4.4-alpine && docker pull collabora/code && docker pull alekzonder/puppeteer && docker pull h2non/imaginary && docker pull node:18-bullseye && docker pull tesseractshadow/tesseract4re && docker pull linuxserver/ffmpeg && docker pull mwader/static-ffmpeg && docker pull pandoc/core && docker pull calibre/calibre && docker pull zenika/alpine-chrome && docker pull python:3.11-bullseye && docker pull ubuntu:22.04 && docker pull buildpack-deps:bullseye && docker pull surnet/alpine-wkhtmltopdf && docker pull vibioh/imagemagick && docker pull acleancoder/imagemagick-full && docker pull thecodingmachine/gotenberg && docker pull madnight/docker-alpine-wkhtmltopdf && docker pull hertzg/tesseract-server && docker pull linuxserver/libreoffice && docker pull pandoc/latex && docker pull puplink/pupper && docker pull jupyter/scipy-notebook
```

## 📋 PROJECT-SPECIFIC FILES CREATED

```bash
Builder-zen-field-main/
├── download-docker-images.bat              # Windows - All 27 images
├── download-docker-images.sh               # Linux/Mac - All 27 images
├── download-essential-images.bat           # Windows - 8 essential images
├── download-essential-images.sh            # Linux/Mac - 8 essential images
├── docker-compose.heavy-services.yml       # Use downloaded images
├── backend/Dockerfile.production           # Your custom build with heavy libs
├── backend/Dockerfile                      # Development Dockerfile
├── backend/Dockerfile.libreoffice          # LibreOffice-specific
└── ALL_HEAVY_LIBRARIES_COMPLETE.md         # Documentation
```

## 📋 RUN COMMANDS FOR YOUR PROJECT

```bash
# Method 1: Use your custom build (with all heavy libraries built-in)
cd Builder-zen-field-main
docker-compose up

# Method 2: Use downloaded images as microservices
cd Builder-zen-field-main
docker-compose -f docker-compose.heavy-services.yml up

# Method 3: Rebuild everything from scratch
cd Builder-zen-field-main
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## 📋 VERIFY DOWNLOADS IN YOUR PROJECT

```bash
cd Builder-zen-field-main
docker images | grep -E "(gotenberg|imagemagick|ocrmypdf|ffmpeg|collabora|puppeteer|imaginary|node)"
```

## 📋 PROJECT ACCESS AFTER RUNNING

```bash
# Your PdfPage application
http://localhost:3000

# Additional services (if using heavy-services.yml)
PDF Service: http://localhost:3001
Image Service: http://localhost:3002
Office Service: http://localhost:3003
```

## 📋 WINDOWS BATCH FILE CREATION (In Project Root)

```cmd
cd "C:\Users\Adarsh Sharma\Downloads\Builder-zen-field-main (1)\Builder-zen-field-main"
echo docker pull gotenberg/gotenberg:7 ^&^& docker pull dpokidov/imagemagick ^&^& docker pull jbarlow83/ocrmypdf ^&^& docker pull jrottenberg/ffmpeg:4.4-alpine ^&^& docker pull collabora/code ^&^& docker pull alekzonder/puppeteer ^&^& docker pull h2non/imaginary ^&^& docker pull node:18-bullseye > quick-download.bat
quick-download.bat
```

## 📋 FULL PROJECT PATH COMMANDS

```cmd
# Full path navigation (Windows)
cd "C:\Users\Adarsh Sharma\Downloads\Builder-zen-field-main (1)\Builder-zen-field-main"

# Then run any of these:
.\download-essential-images.bat
.\download-docker-images.bat
docker-compose up
```

## 🎯 RECOMMENDED WORKFLOW FOR YOUR PROJECT

1. **Navigate to project:**

   ```bash
   cd Builder-zen-field-main
   ```

2. **Download essential images:**

   ```bash
   ./download-essential-images.sh  # Linux/Mac
   .\download-essential-images.bat # Windows
   ```

3. **Build and run:**

   ```bash
   docker-compose -f docker-compose.heavy-services.yml up
   ```

4. **Access your PdfPage app:**
   - Main app: http://localhost:5000
   - PDF service: http://localhost:3001
   - Image service: http://localhost:3002

## ✅ RESULT

Your **Builder-zen-field-main** PdfPage project now has access to all heavy processing libraries through both custom builds and downloaded images!
