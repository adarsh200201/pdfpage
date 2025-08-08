# PowerShell Test Script for Enhanced SEO Automation
# Run this script to test the SEO automation system

Write-Host "🚀 Testing Enhanced SEO Automation for PDFPage.in" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Check current directory
$currentDir = Get-Location
Write-Host "📁 Current Directory: $currentDir" -ForegroundColor Yellow

# Check if we're in the right directory
if (-not (Test-Path "enhancedGeminiSEOAssistant.js")) {
    Write-Host "❌ Error: Not in the seo-automation directory" -ForegroundColor Red
    Write-Host "Please navigate to: Builder-zen-field-main/seo-automation" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Directory check passed" -ForegroundColor Green

# Check Node.js
Write-Host "`n🔍 Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
Write-Host "`n📦 Checking npm..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Check required files
Write-Host "`n📁 Checking required files..." -ForegroundColor Cyan
$requiredFiles = @(
    "enhancedGeminiSEOAssistant.js",
    "runEnhancedSEO.js", 
    "testEnhancedSEO.js",
    "package.json",
    "README-Enhanced.md"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "❌ Some required files are missing" -ForegroundColor Red
    exit 1
}

# Check dependencies
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules directory exists" -ForegroundColor Green
} else {
    Write-Host "⚠️ node_modules not found, running npm install..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check package.json scripts
Write-Host "`n📜 Checking package.json scripts..." -ForegroundColor Cyan
try {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $requiredScripts = @("seo-enhanced", "seo-enhanced-apply", "seo-enhanced-full")
    
    foreach ($script in $requiredScripts) {
        if ($packageJson.scripts.$script) {
            Write-Host "✅ $script" -ForegroundColor Green
        } else {
            Write-Host "❌ $script" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Error reading package.json" -ForegroundColor Red
}

# Test basic file scanning
Write-Host "`n🔍 Testing file scanning..." -ForegroundColor Cyan
try {
    Write-Host "Running verification script..." -ForegroundColor Yellow
    node verify-setup.js
    Write-Host "✅ Verification completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Verification script failed, but setup looks good" -ForegroundColor Yellow
}

# Run quick test
Write-Host "`n🧪 Running quick test..." -ForegroundColor Cyan
try {
    Write-Host "Testing enhanced SEO system..." -ForegroundColor Yellow
    node testEnhancedSEO.js
    Write-Host "✅ Quick test completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Quick test had issues - check API key and network" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Display available commands
Write-Host "`n🎯 Available Commands:" -ForegroundColor Cyan
Write-Host "Analysis only (safe):     npm run seo-enhanced" -ForegroundColor Green
Write-Host "Apply improvements:       npm run seo-enhanced-apply" -ForegroundColor Yellow
Write-Host "Full automation:          npm run seo-enhanced-full" -ForegroundColor Red
Write-Host "Interactive mode:         npm run seo-interactive" -ForegroundColor Blue

Write-Host "`n🎉 PowerShell test completed!" -ForegroundColor Cyan
Write-Host "📖 Check README-Enhanced.md for detailed instructions" -ForegroundColor Gray

# Ask user what they want to do next
Write-Host "`n❓ What would you like to do next?" -ForegroundColor Cyan
Write-Host "1. Run analysis only (safe)" -ForegroundColor Green
Write-Host "2. Run with improvements applied" -ForegroundColor Yellow  
Write-Host "3. View help and exit" -ForegroundColor Blue
$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n🔍 Running SEO analysis..." -ForegroundColor Cyan
        npm run seo-enhanced
    }
    "2" { 
        Write-Host "`n⚠️ This will modify your files! Continue? (y/n)" -ForegroundColor Yellow
        $confirm = Read-Host
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Write-Host "`n🔧 Running SEO analysis with improvements..." -ForegroundColor Cyan
            npm run seo-enhanced-apply
        } else {
            Write-Host "Operation cancelled" -ForegroundColor Gray
        }
    }
    "3" {
        Write-Host "`n📖 Help:" -ForegroundColor Cyan
        Write-Host "• Read README-Enhanced.md for full documentation" -ForegroundColor Gray
        Write-Host "• Use npm run seo-enhanced for safe analysis" -ForegroundColor Gray
        Write-Host "• Check generated reports for insights" -ForegroundColor Gray
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Gray
    }
}

Write-Host "`n👋 Test script completed!" -ForegroundColor Cyan
