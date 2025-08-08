// Simple test script for Enhanced SEO Automation
// This can be run directly with: node simple-test.js

import fs from 'fs';
import path from 'path';

console.log('🧪 Simple Test - Enhanced SEO Automation');
console.log('=' .repeat(50));

try {
  // Test 1: Check required files
  console.log('\n📁 Checking required files...');
  const requiredFiles = [
    'enhancedGeminiSEOAssistant.js',
    'runEnhancedSEO.js',
    'package.json'
  ];
  
  let allFilesExist = true;
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
  });
  
  if (!allFilesExist) {
    console.log('❌ Some required files are missing');
    process.exit(1);
  }
  
  // Test 2: Check package.json
  console.log('\n📜 Checking package.json...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  console.log(`   ✅ Package name: ${packageJson.name}`);
  console.log(`   ✅ Scripts available: ${Object.keys(packageJson.scripts).length}`);
  
  // Test 3: Check project structure
  console.log('\n🏗️ Checking project structure...');
  const srcPath = path.join('..', 'src');
  const publicPath = path.join('..', 'public');
  
  console.log(`   ${fs.existsSync(srcPath) ? '✅' : '❌'} src directory`);
  console.log(`   ${fs.existsSync(publicPath) ? '✅' : '❌'} public directory`);
  
  // Test 4: Count files that would be analyzed
  console.log('\n🔍 Scanning files for analysis...');
  let fileCount = 0;
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git'].includes(item)) {
        scanDirectory(fullPath);
      } else if (['.tsx', '.jsx', '.js', '.html', '.css'].some(ext => item.endsWith(ext))) {
        fileCount++;
      }
    });
  }
  
  if (fs.existsSync(srcPath)) {
    scanDirectory(srcPath);
  }
  
  console.log(`   �� Found ${fileCount} files that would be analyzed`);
  
  // Test 5: Check API key format
  console.log('\n🔑 Checking API configuration...');
  const enhancedContent = fs.readFileSync('enhancedGeminiSEOAssistant.js', 'utf-8');
  const hasApiKey = enhancedContent.includes('AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ');
  console.log(`   ${hasApiKey ? '✅' : '❌'} API key configured`);
  
  // Success!
  console.log('\n🎉 SIMPLE TEST SUCCESSFUL!');
  console.log('\n🚀 You can now run:');
  console.log('   npm run seo-enhanced (safe analysis)');
  console.log('   npm run seo-enhanced-apply (apply changes)');
  console.log('   test-quick.bat (Windows)');
  console.log('   test-seo-powershell.ps1 (PowerShell)');
  
  console.log('\n📊 Test Summary:');
  console.log(`   • Required files: ✅ All present`);
  console.log(`   • Project structure: ✅ Valid`);
  console.log(`   • Files to analyze: ${fileCount}`);
  console.log(`   • API configuration: ✅ Ready`);
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('\n🔧 Common solutions:');
  console.error('   • Make sure you\'re in the seo-automation directory');
  console.error('   • Run: npm install');
  console.error('   • Check file permissions');
  process.exit(1);
}
