@echo off
echo 🚀 Enhanced SEO Automation for PDFPage.in
echo ============================================
echo.

echo 📂 Checking if we're in the right directory...
if not exist "enhancedGeminiSEOAssistant.js" (
    echo ❌ Error: Not in the seo-automation directory
    echo Please navigate to the seo-automation folder first
    pause
    exit /b 1
)

echo ✅ Directory check passed
echo.

:menu
echo 🎯 What would you like to do?
echo.
echo 1. 🔍 Analyze only (safe - no changes)
echo 2. 🔧 Analyze + Apply improvements (modifies files)
echo 3. 🚀 Full automation (Apply + Push to Git)
echo 4. 🧪 Quick test
echo 5. 📖 View help
echo 6. ❌ Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto analyze
if "%choice%"=="2" goto apply
if "%choice%"=="3" goto full
if "%choice%"=="4" goto test
if "%choice%"=="5" goto help
if "%choice%"=="6" goto exit
echo Invalid choice. Please try again.
goto menu

:analyze
echo 🔍 Running SEO analysis only (no changes will be made)...
node runEnhancedSEO.js
goto done

:apply
echo ⚠️ WARNING: This will modify your source files!
echo Backups will be created with .seo-backup extension
set /p confirm="Are you sure? (y/n): "
if /i "%confirm%"=="y" (
    echo 🔧 Running SEO analysis and applying improvements...
    node runEnhancedSEO.js --apply
) else (
    echo 📝 Operation cancelled
)
goto done

:full
echo 🚨 WARNING: This will modify files AND push to GitHub!
echo This is the most aggressive option
set /p confirm="Are you absolutely sure? (y/n): "
if /i "%confirm%"=="y" (
    echo 🚀 Running full SEO automation...
    node runEnhancedSEO.js --apply --push
) else (
    echo 📝 Operation cancelled
)
goto done

:test
echo 🧪 Running quick test of the SEO system...
node testEnhancedSEO.js
goto done

:help
echo 📖 Enhanced SEO Automation Help
echo ================================
echo.
echo This tool uses Gemini AI to analyze and optimize your entire
echo PDFPage.in project for SEO while preserving design and functionality.
echo.
echo Features:
echo ��� Scans all HTML/JSX/TSX/CSS files in your project
echo • Optimizes meta tags, headings, images, and content
echo • Creates automatic backups before making changes
echo • Generates detailed reports for review
echo • Optional Git integration for automatic deployment
echo.
echo Safety:
echo • Option 1 is completely safe - only analyzes
echo • Option 2 modifies files but creates backups
echo • Option 3 includes automatic Git push
echo.
echo Reports are saved as:
echo • comprehensive-seo-report.json (detailed data)
echo • seo-report-readable.md (human-readable)
echo.
pause
goto menu

:done
echo.
echo 📋 Check the generated reports:
echo • comprehensive-seo-report.json
echo • seo-report-readable.md
echo.
echo 🎉 Enhanced SEO automation completed!
pause
goto menu

:exit
echo 👋 Goodbye!
pause
exit /b 0
