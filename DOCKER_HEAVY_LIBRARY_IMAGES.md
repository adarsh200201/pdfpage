# 🐳 Heavy Library Docker Images - Complete Download List

## Pre-Built Docker Images with Heavy Libraries

Instead of building from scratch, you can pull these pre-built images that already contain heavy processing libraries:

## 📄 PDF Processing Images

### 1. **gotenberg/gotenberg** - PDF Generation Service

```bash
docker pull gotenberg/gotenberg:7
```

**Contains**: Chromium, LibreOffice, Pandoc, wkhtmltopdf, PDFtk
**Use case**: HTML/Office to PDF conversion service

### 2. **thecodingmachine/gotenberg** - Alternative PDF Service

```bash
docker pull thecodingmachine/gotenberg
```

**Contains**: Complete PDF processing toolkit

### 3. **surnet/alpine-wkhtmltopdf** - Lightweight PDF Generator

```bash
docker pull surnet/alpine-wkhtmltopdf
```

**Contains**: wkhtmltopdf, fonts, minimal Alpine base

### 4. **madnight/docker-alpine-wkhtmltopdf**

```bash
docker pull madnight/docker-alpine-wkhtmltopdf
```

**Contains**: wkhtmltopdf with Chinese font support

## 🖼️ Image Processing Images

### 5. **dpokidov/imagemagick** - Complete ImageMagick

```bash
docker pull dpokidov/imagemagick
```

**Contains**: ImageMagick with all delegates, HEIF, WebP, AVIF support

### 6. **acleancoder/imagemagick-full** - Full ImageMagick Stack

```bash
docker pull acleancoder/imagemagick-full
```

**Contains**: ImageMagick + GraphicsMagick + libvips + modern formats

### 7. **h2non/imaginary** - Fast Image Processing API

```bash
docker pull h2non/imaginary
```

**Contains**: libvips-based image processing service

### 8. **vibioh/imagemagick** - Modern ImageMagick

```bash
docker pull vibioh/imagemagick
```

**Contains**: Latest ImageMagick with WebP, HEIF, AVIF

## 🔤 OCR Processing Images

### 9. **tesseractshadow/tesseract4re** - Complete Tesseract

```bash
docker pull tesseractshadow/tesseract4re
```

**Contains**: Tesseract 4+ with ALL language packs

### 10. **jbarlow83/ocrmypdf** - Advanced OCR

```bash
docker pull jbarlow83/ocrmypdf
```

**Contains**: OCRmyPDF, Tesseract, Ghostscript, complete OCR pipeline

### 11. **hertzg/tesseract-server** - OCR API Service

```bash
docker pull hertzg/tesseract-server
```

**Contains**: Tesseract with REST API

## 🎥 Video/Media Processing Images

### 12. **jrottenberg/ffmpeg** - Complete FFmpeg

```bash
docker pull jrottenberg/ffmpeg:4.4-alpine
```

**Contains**: FFmpeg with all codecs, libx264, libx265

### 13. **linuxserver/ffmpeg** - Enhanced FFmpeg

```bash
docker pull linuxserver/ffmpeg
```

**Contains**: FFmpeg + additional tools and codecs

### 14. **mwader/static-ffmpeg** - Static FFmpeg Build

```bash
docker pull mwader/static-ffmpeg
```

**Contains**: Statically compiled FFmpeg with everything

## 📚 LibreOffice Images

### 15. **collabora/code** - LibreOffice Online

```bash
docker pull collabora/code
```

**Contains**: Complete LibreOffice suite for document conversion

### 16. **linuxserver/libreoffice** - Desktop LibreOffice

```bash
docker pull linuxserver/libreoffice
```

**Contains**: Full LibreOffice installation

## 🛠️ Multi-Purpose Heavy Images

### 17. **ubuntu:22.04** - Build Your Own Base

```bash
docker pull ubuntu:22.04
```

**Use**: Custom build like your current setup

### 18. **node:18-bullseye** - Node.js with Build Tools

```bash
docker pull node:18-bullseye
```

**Contains**: Node.js + build-essential + basic libraries

### 19. **buildpack-deps:bullseye** - Build Dependencies

```bash
docker pull buildpack-deps:bullseye
```

**Contains**: Comprehensive build tools and libraries

## 🎯 Specialized Processing Images

### 20. **pandoc/core** - Document Conversion

```bash
docker pull pandoc/core
```

**Contains**: Pandoc for universal document conversion

### 21. **pandoc/latex** - Document + LaTeX

```bash
docker pull pandoc/latex
```

**Contains**: Pandoc + complete LaTeX installation

### 22. **calibre/calibre** - E-book Processing

```bash
docker pull calibre/calibre
```

**Contains**: Complete Calibre e-book toolkit

### 23. **puplink/pupper** - Puppeteer Ready

```bash
docker pull puplink/pupper
```

**Contains**: Node.js + Puppeteer + Chrome + dependencies

## 🔧 Graphics & Canvas Images

### 24. **zenika/alpine-chrome** - Headless Chrome

```bash
docker pull zenika/alpine-chrome
```

**Contains**: Chrome + canvas rendering dependencies

### 25. **alekzonder/puppeteer** - Puppeteer Environment

```bash
docker pull alekzonder/puppeteer
```

**Contains**: Puppeteer + Chrome + Node.js canvas support

## 🐍 Python-Based Processing Images

### 26. **python:3.11-bullseye** - Python with System Libraries

```bash
docker pull python:3.11-bullseye
```

**Use**: For Python-based PDF/image processing

### 27. **jupyter/scipy-notebook** - Scientific Python

```bash
docker pull jupyter/scipy-notebook
```

**Contains**: NumPy, SciPy, matplotlib, image processing libraries

## 📊 Usage Examples

### Quick PDF Processing Setup:

```bash
# Pull ready-made PDF service
docker pull gotenberg/gotenberg:7
docker run -p 3000:3000 gotenberg/gotenberg:7
```

### Quick Image Processing:

```bash
# Pull ImageMagick service
docker pull dpokidov/imagemagick
docker run -v /your/images:/images dpokidov/imagemagick convert input.jpg output.webp
```

### Quick OCR Setup:

```bash
# Pull OCR service
docker pull jbarlow83/ocrmypdf
docker run -v /your/pdfs:/pdfs jbarlow83/ocrmypdf input.pdf output.pdf
```

## 🎛️ Docker Compose with Pre-built Images

```yaml
version: "3.8"
services:
  # Your existing backend
  backend:
    build: ./backend

  # Pre-built PDF service
  pdf-service:
    image: gotenberg/gotenberg:7
    ports:
      - "3001:3000"

  # Pre-built image service
  image-service:
    image: h2non/imaginary
    ports:
      - "3002:9000"

  # Pre-built OCR service
  ocr-service:
    image: jbarlow83/ocrmypdf
    volumes:
      - ./temp:/tmp
```

## 🏎️ Performance Comparison

| Image Type               | Size   | Boot Time | CPU Usage | Memory    |
| ------------------------ | ------ | --------- | --------- | --------- |
| **Your Custom Build**    | ~6-8GB | 30s       | High      | 4-8GB     |
| **gotenberg/gotenberg**  | ~2GB   | 10s       | Medium    | 1-2GB     |
| **dpokidov/imagemagick** | ~500MB | 5s        | Medium    | 512MB-1GB |
| **jbarlow83/ocrmypdf**   | ~1.5GB | 15s       | Medium    | 1-3GB     |

## 🎯 Recommendations

### For Production:

1. **Use specialized images** for specific tasks
2. **Combine multiple services** rather than one giant container
3. **Microservices approach** with dedicated containers

### For Development:

1. **Keep your current comprehensive build** for maximum flexibility
2. **Add specialized services** for performance-critical operations

### Best of Both Worlds:

```yaml
services:
  # Your comprehensive backend (for complex operations)
  backend:
    build: ./backend

  # Specialized fast services (for common operations)
  quick-pdf:
    image: gotenberg/gotenberg:7
  quick-images:
    image: h2non/imaginary
  quick-ocr:
    image: jbarlow83/ocrmypdf
```

## 🚀 Download Commands Summary

```bash
# PDF Processing
docker pull gotenberg/gotenberg:7
docker pull surnet/alpine-wkhtmltopdf

# Image Processing
docker pull dpokidov/imagemagick
docker pull h2non/imaginary

# OCR
docker pull tesseractshadow/tesseract4re
docker pull jbarlow83/ocrmypdf

# Video
docker pull jrottenberg/ffmpeg:4.4-alpine

# Multi-purpose
docker pull pandoc/core
docker pull collabora/code
```

These pre-built images can either **replace** your custom Docker build or **complement** it for specific high-performance operations!
