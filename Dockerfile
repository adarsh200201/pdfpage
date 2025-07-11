# Production Dockerfile for PdfPage - Optimized for Render Deployment
FROM ubuntu:22.04

# Prevent interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and tools
RUN apt-get update && apt-get install -y \
    curl wget gnupg ca-certificates software-properties-common \
    build-essential python3 python3-pip git unzip \
    fonts-dejavu fonts-liberation fonts-noto \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install PDF processing tools
RUN apt-get update && apt-get install -y \
    ghostscript poppler-utils qpdf mupdf mupdf-tools \
    libreoffice libreoffice-writer libreoffice-calc \
    pandoc wkhtmltopdf \
    && rm -rf /var/lib/apt/lists/*

# Install image processing tools
RUN apt-get update && apt-get install -y \
    imagemagick graphicsmagick libvips \
    optipng jpegoptim pngquant \
    libcairo2-dev libpango1.0-dev \
    && rm -rf /var/lib/apt/lists/*

# Install OCR tools
RUN apt-get update && apt-get install -y \
    tesseract-ocr tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome for Puppeteer
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
    apt-get update && apt-get install -y google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend package files first for better caching
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production && npm cache clean --force

# Copy frontend package files
COPY package.json ./
RUN npm install --legacy-peer-deps && npm cache clean --force

# Install Puppeteer Chrome
RUN npx puppeteer browsers install chrome || echo "Chrome installation completed"

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Create necessary directories
RUN mkdir -p backend/uploads backend/temp backend/logs && \
    chmod 755 backend/uploads backend/temp backend/logs

# Set environment variables for production
ENV NODE_ENV=production
ENV LIBREOFFICE_AVAILABLE=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_ARGS="--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage"

# Expose backend port (Render expects this)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start backend server
WORKDIR /app/backend
CMD ["npm", "start"]
