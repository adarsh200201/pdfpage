@echo off
echo 🧪 Quick Test - Enhanced SEO Automation
echo ========================================

:: Check if we're in the right directory
if not exist "enhancedGeminiSEOAssistant.js" (
    echo ❌ Error: Not in seo-automation directory
    echo Please navigate to Builder-zen-field-main\seo-automation first
    pause
    exit /b 1
)

:: Check Node.js
echo 📦 Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is installed

:: Check dependencies
echo 📦 Checking dependencies...
if not exist "node_modules" (
    echo 🔄 Installing dependencies...
    npm install
)
echo ✅ Dependencies ready

:: Run verification
echo 🔍 Running setup verification...
node verify-setup.js
if %errorlevel% neq 0 (
    echo ⚠️ Verification had issues, but continuing...
)

:: Run quick test
echo 🧪 Running quick test...
node testEnhancedSEO.js

echo.
echo 🎉 Quick test completed!
echo.
echo 🚀 Ready to run:
echo   npm run seo-enhanced           (safe analysis)
echo   npm run seo-enhanced-apply     (apply changes)
echo   run-enhanced-seo.bat           (interactive GUI)
echo.
pause
