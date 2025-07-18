# Use Python 3.10 with CUDA support (or CPU-only for lighter deployment)
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Upgrade pip and install Python dependencies with timeout handling
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --timeout 300 -r requirements.txt

# Install PyTorch CPU version (much faster, smaller, and more reliable)
RUN pip install --no-cache-dir --timeout 300 \
    torch==2.1.0+cpu \
    torchvision==0.16.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Copy application files
COPY . .

# Create directory for model weights
RUN mkdir -p saved_models

# Download U²-Net pre-trained models
RUN wget -O saved_models/u2net.pth \
    https://github.com/xuebinqin/U-2-Net/releases/download/v1.0/u2net.pth

# Optional: Download human segmentation model (larger but better for portraits)
# RUN wget -O saved_models/u2net_human_seg.pth \
#     https://github.com/xuebinqin/U-2-Net/releases/download/v1.0/u2net_human_seg.pth

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--threads", "2", "--timeout", "120", "app:app"]
