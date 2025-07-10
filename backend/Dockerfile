# Production Dockerfile for PdfPage Backend with Chrome/Puppeteer support
FROM node:18-bullseye

# Set safe temp directory
ENV TMPDIR=/tmp

# Install system dependencies required for Node.js modules + Chrome
RUN apt-get update && apt-get install -y \
    # 📄 PDF Processing & Document Conversion
    ghostscript \
    poppler-utils \
    qpdf \
    pdftk \
    mupdf-tools \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    unoconv \
    pandoc \
    wkhtmltopdf \
    \
    # 🖼️ Image Processing & Graphics
    imagemagick \
    graphicsmagick \
    libvips \
    libvips-tools \
    optipng \
    jpegoptim \
    pngquant \
    webp \
    libwebp-dev \
    libheif-dev \
    \
    # 🔤 OCR (Essential only)
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-hin \
    gocr \
    \
    # 🖥️ Rendering & Graphics Libraries
    libgl1-mesa-glx \
    libxi6 \
    libxrender1 \
    libxext6 \
    libsm6 \
    libxss1 \
    libdrm2 \
    \
    # 📦 Build Tools & Compilers
    build-essential \
    cmake \
    autoconf \
    pkg-config \
    nasm \
    gcc \
    g++ \
    make \
    \
    # 🐍 Python & Development
    python3 \
    python3-dev \
    python3-pip \
    \
    # 🎨 Canvas & Cairo Dependencies
    libcairo2-dev \
    libpango1.0-dev \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-dev \
    libjpeg-dev \
    libgif-dev \
    libpng-dev \
    librsvg2-dev \
    \
    # 📚 Archive & Compression
    p7zip-full \
    zip \
    unzip \
    xz-utils \
    \
    # 🔧 System Libraries
    libfontconfig1-dev \
    libfreetype6-dev \
    libxml2-dev \
    libssl-dev \
    \
    # System utilities
    wget \
    gnupg \
    ca-certificates \
    procps \
    curl \
    \
    # 🔤 Fonts
    fonts-dejavu \
    fonts-liberation \
    fonts-noto \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    fonts-roboto \
    fonts-open-sans \
    \
    # ☕ Java Runtime
    default-jre-headless \
    openjdk-11-jre-headless \
    \
    # 🎯 Specialized Tools
    calibre \
    antiword \
    catdoc \
    exiftool \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create app directory
WORKDIR /usr/src/app

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs -G audio,video nodejs

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --only=production --legacy-peer-deps && npm cache clean --force

# Pre-install Puppeteer Chrome manually
RUN npx puppeteer browsers install chrome || echo "Chrome installation completed"

# Copy application code
COPY . .

# Setup required folders and permissions
RUN mkdir -p logs temp temp/input temp/output uploads && \
    chown -R nodejs:nodejs /usr/src/app && \
    chmod 755 temp temp/input temp/output uploads

# Environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV CHROME_BIN=/usr/bin/google-chrome-stable
ENV PUPPETEER_ARGS="--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-accelerated-2d-canvas,--no-first-run,--no-zygote,--single-process,--disable-gpu"
ENV HOME=/tmp
ENV LIBREOFFICE_AVAILABLE=true

# Use non-root user
USER nodejs

# Expose backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start server
CMD ["npm", "start"]
