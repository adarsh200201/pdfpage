#!/bin/bash

# LibreOffice Installation Script for PdfPage Backend
# Supports Ubuntu/Debian systems

echo "🚀 Installing LibreOffice for PdfPage Word to PDF conversion..."

# Update package manager
echo "📦 Updating package manager..."
sudo apt-get update

# Install LibreOffice and required packages
echo "📥 Installing LibreOffice and dependencies..."
sudo apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-draw \
    fonts-liberation \
    fonts-dejavu \
    fonts-noto \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    default-jre \
    curl \
    wget

# Verify installation
echo "🔍 Verifying LibreOffice installation..."
if command -v soffice &> /dev/null; then
    LIBREOFFICE_VERSION=$(soffice --version)
    echo "✅ LibreOffice installed successfully: $LIBREOFFICE_VERSION"
else
    echo "❌ LibreOffice installation failed"
    exit 1
fi

# Test headless conversion
echo "🧪 Testing headless conversion..."
TEMP_DIR="/tmp/libreoffice-test"
mkdir -p "$TEMP_DIR"

# Create a simple test document
cat > "$TEMP_DIR/test.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Test Document</title>
</head>
<body>
    <h1>LibreOffice Test</h1>
    <p>This is a test document for LibreOffice conversion.</p>
    <p><strong>Bold text</strong> and <em>italic text</em>.</p>
</body>
</html>
EOF

# Test conversion
if soffice --headless --convert-to pdf "$TEMP_DIR/test.html" --outdir "$TEMP_DIR" > /dev/null 2>&1; then
    if [ -f "$TEMP_DIR/test.pdf" ]; then
        echo "✅ LibreOffice headless conversion test successful"
        rm -rf "$TEMP_DIR"
    else
        echo "❌ LibreOffice conversion test failed - no output file"
        exit 1
    fi
else
    echo "❌ LibreOffice conversion test failed"
    exit 1
fi

# Create LibreOffice config directory for the app user
echo "⚙️ Setting up LibreOffice configuration..."
LIBREOFFICE_CONFIG_DIR="$HOME/.config/libreoffice"
mkdir -p "$LIBREOFFICE_CONFIG_DIR"

# Set permissions
chmod 755 "$LIBREOFFICE_CONFIG_DIR"

# Create a simple configuration to suppress dialogs
cat > "$LIBREOFFICE_CONFIG_DIR/user.conf" << EOF
[General]
NoSplash=true
NoFirstStartWizard=true
EOF

echo "🎉 LibreOffice installation and configuration completed successfully!"
echo ""
echo "📋 Installation Summary:"
echo "   LibreOffice Version: $LIBREOFFICE_VERSION"
echo "   Headless Mode: ✅ Working"
echo "   PDF Conversion: ✅ Working"
echo "   Configuration: ✅ Set up"
echo ""
echo "🔧 You can now restart your PdfPage backend to enable LibreOffice support."
echo "💡 The backend will automatically detect LibreOffice availability."
