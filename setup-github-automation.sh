#!/bin/bash

# 🚀 Quick Setup Script for GitHub Actions SEO Automation
# Run this script to set up automated SEO optimization

echo "🚀 Setting up GitHub Actions SEO Automation..."
echo "=" * 60

# Check if we're in the right directory
if [ ! -d "seo-automation" ]; then
    echo "❌ Error: seo-automation directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Check if .github/workflows directory exists
if [ ! -d ".github/workflows" ]; then
    echo "📁 Creating .github/workflows directory..."
    mkdir -p .github/workflows
else
    echo "✅ .github/workflows directory exists"
fi

# Check if workflow files exist
WORKFLOWS=(
    ".github/workflows/seo-automation.yml"
    ".github/workflows/pr-seo-check.yml"
)

echo "📋 Checking workflow files..."
for workflow in "${WORKFLOWS[@]}"; do
    if [ -f "$workflow" ]; then
        echo "✅ $workflow exists"
    else
        echo "❌ $workflow missing"
        echo "Please ensure all workflow files are created"
        exit 1
    fi
done

# Test SEO automation setup
echo "🧪 Testing SEO automation setup..."
cd seo-automation

if [ ! -f "package.json" ]; then
    echo "❌ SEO automation not properly set up"
    exit 1
fi

echo "✅ SEO automation files verified"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is available"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing SEO automation dependencies..."
    npm install
fi

echo "✅ Dependencies ready"

cd ..

# Display next steps
echo ""
echo "🎉 GitHub Actions SEO Automation Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Add GitHub Secret: GEMINI_API_KEY = AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ"
echo "2. (Optional) Add PAT_TOKEN for auto-commits"
echo "3. Push workflow files to GitHub:"
echo ""
echo "   git add .github/workflows/"
echo "   git commit -m \"feat: Add automated SEO optimization\""
echo "   git push origin main"
echo ""
echo "4. Test with a pull request:"
echo ""
echo "   git checkout -b test-seo-automation"
echo "   echo \"// SEO test\" >> src/App.tsx"
echo "   git add . && git commit -m \"test: SEO automation\""
echo "   git push origin test-seo-automation"
echo ""
echo "📖 See GITHUB-ACTIONS-SETUP.md for detailed instructions"
echo ""
echo "🚀 Your SEO automation is ready to improve your code automatically!"
