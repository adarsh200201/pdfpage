#!/usr/bin/env node

/**
 * React 18 Compatibility Fix Script
 * Fixes createRoot import issues and clears Vite cache
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing React 18 createRoot issues...');

// 1. Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// 2. Clear Vite cache
console.log('🗑️ Clearing Vite cache...');
try {
  const viteCachePath = path.join(__dirname, 'node_modules', '.vite');
  if (fs.existsSync(viteCachePath)) {
    fs.rmSync(viteCachePath, { recursive: true, force: true });
    console.log('✅ Vite cache cleared');
  }
} catch (error) {
  console.warn('⚠️ Could not clear Vite cache:', error.message);
}

// 3. Check React versions
console.log('🔍 Checking React versions...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const reactVersion = packageJson.dependencies.react;
  const reactDomVersion = packageJson.dependencies['react-dom'];
  
  console.log(`   React: ${reactVersion}`);
  console.log(`   React-DOM: ${reactDomVersion}`);
  
  if (reactVersion.includes('18') && reactDomVersion.includes('18')) {
    console.log('✅ React 18 versions detected');
  } else {
    console.warn('⚠️ Not using React 18 - createRoot requires React 18+');
  }
} catch (error) {
  console.error('❌ Could not check React versions:', error.message);
}

// 4. Check main.tsx file
console.log('📝 Checking main.tsx...');
try {
  const mainTsxPath = path.join(__dirname, 'src', 'main.tsx');
  const mainTsxContent = fs.readFileSync(mainTsxPath, 'utf8');
  
  if (mainTsxContent.includes('createRoot')) {
    console.log('✅ createRoot import found in main.tsx');
  } else {
    console.warn('⚠️ createRoot import not found in main.tsx');
  }
  
  if (mainTsxContent.includes('react-dom/client')) {
    console.log('✅ react-dom/client import found');
  } else {
    console.warn('⚠️ react-dom/client import not found');
  }
} catch (error) {
  console.error('❌ Could not check main.tsx:', error.message);
}

// 5. Test TypeScript compilation
console.log('🔍 Testing TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.warn('⚠️ TypeScript compilation issues detected');
  console.log('   This may indicate type declaration problems');
}

console.log('\n🎉 React 18 fix script completed!');
console.log('\n📋 Next steps:');
console.log('1. Restart your development server');
console.log('2. If issues persist, try: npm run dev');
console.log('3. Check browser console for any remaining errors');

console.log('\n🔧 Manual fixes if needed:');
console.log('• Clear browser cache (Ctrl+Shift+R)');
console.log('• Delete node_modules and run npm install');
console.log('• Check for duplicate React versions');
