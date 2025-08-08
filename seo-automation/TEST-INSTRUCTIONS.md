# 🧪 PowerShell Testing Instructions for Enhanced SEO Automation

## Quick Test (Recommended)

### Option 1: Simple Batch File
```cmd
cd Builder-zen-field-main\seo-automation
test-quick.bat
```

### Option 2: PowerShell Script
```powershell
cd Builder-zen-field-main\seo-automation
.\test-seo-powershell.ps1
```

### Option 3: Direct Node.js
```cmd
cd Builder-zen-field-main\seo-automation
node simple-test.js
```

## Step-by-Step Manual Testing

### 1. Open PowerShell as Administrator
```powershell
# Navigate to the project
cd "path\to\your\Builder-zen-field-main\seo-automation"

# Check Node.js
node --version
npm --version
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Run Basic Tests
```powershell
# Test 1: Verify setup
node verify-setup.js

# Test 2: Simple functionality test  
node simple-test.js

# Test 3: Quick system test
node testEnhancedSEO.js
```

### 4. Run SEO Analysis (Safe)
```powershell
# This only analyzes, makes no changes
npm run seo-enhanced
```

### 5. Check Generated Reports
```powershell
# List generated files
dir *.json
dir *.md

# View readable report (if generated)
Get-Content seo-report-readable.md
```

## Expected Output

### ✅ Successful Test Output:
```
🧪 Simple Test - Enhanced SEO Automation
==================================================

📁 Checking required files...
   ✅ enhancedGeminiSEOAssistant.js
   ✅ runEnhancedSEO.js
   ✅ package.json

📜 Checking package.json...
   ✅ Package name: pdfpage-seo-automation
   ✅ Scripts available: 8

🏗️ Checking project structure...
   ✅ src directory
   ✅ public directory

🔍 Scanning files for analysis...
   📊 Found XX files that would be analyzed

🔑 Checking API configuration...
   ✅ API key configured

🎉 SIMPLE TEST SUCCESSFUL!
```

### ❌ Common Issues and Solutions:

#### Issue: "Node.js not found"
```powershell
# Solution: Install Node.js
# Download from: https://nodejs.org/
# Then restart PowerShell
```

#### Issue: "Cannot find path"
```powershell
# Solution: Navigate to correct directory
cd "Builder-zen-field-main\seo-automation"
```

#### Issue: "Permission denied"
```powershell
# Solution: Run PowerShell as Administrator
# Or change execution policy:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Issue: "Module not found"
```powershell
# Solution: Install dependencies
npm install

# Or clean install:
rm -rf node_modules
npm install
```

## Full Testing Workflow

### 1. Basic System Test
```powershell
cd Builder-zen-field-main\seo-automation
node simple-test.js
```

### 2. Enhanced System Test
```powershell
node testEnhancedSEO.js
```

### 3. Safe SEO Analysis
```powershell
npm run seo-enhanced
```

### 4. Review Results
```powershell
# Check if reports were generated
ls *.json
ls *.md

# View summary (if generated)
type seo-report-readable.md
```

### 5. Apply Changes (Optional)
```powershell
# ⚠️ WARNING: This modifies files!
npm run seo-enhanced-apply
```

## Interactive Testing

For interactive testing with menu options:
```cmd
run-enhanced-seo.bat
```

Or:
```powershell
.\test-seo-powershell.ps1
```

## Verification Checklist

- [ ] Node.js and npm are installed
- [ ] All required files exist
- [ ] Dependencies are installed
- [ ] API key is configured
- [ ] Project structure is detected
- [ ] Files are scannable
- [ ] Basic test passes
- [ ] Enhanced test passes
- [ ] SEO analysis runs
- [ ] Reports are generated

## API Testing

The system uses your Gemini API key: `AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ`

To test API connectivity:
```powershell
# This will attempt to analyze a small file
node testEnhancedSEO.js
```

## Performance Expectations

- **File Scanning**: Should be instant
- **Setup Verification**: 1-2 seconds
- **API Test**: 5-10 seconds (network dependent)
- **Full Analysis**: 1-3 minutes for entire project
- **Report Generation**: 1-2 seconds

## Success Indicators

✅ All tests pass
✅ Files are detected and counted
✅ API key is properly configured
✅ Dependencies are installed
✅ Reports are generated (if analysis runs)
✅ No critical errors

---

**Ready to test? Start with:**
```cmd
cd Builder-zen-field-main\seo-automation
test-quick.bat
```
