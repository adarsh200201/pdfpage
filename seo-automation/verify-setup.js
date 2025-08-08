#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Verification script for Enhanced SEO Automation setup
 */

function verifySetup() {
  console.log('🔍 Verifying Enhanced SEO Automation Setup');
  console.log('=' .repeat(50));

  const checks = [];
  let allGood = true;

  // Check 1: Required files exist
  const requiredFiles = [
    'enhancedGeminiSEOAssistant.js',
    'runEnhancedSEO.js',
    'testEnhancedSEO.js',
    'package.json',
    'README-Enhanced.md'
  ];

  console.log('\n📁 Checking required files...');
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allGood = false;
    checks.push({ check: `File: ${file}`, status: exists });
  });

  // Check 2: Package.json scripts
  console.log('\n📜 Checking package.json scripts...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const requiredScripts = [
      'seo-enhanced',
      'seo-enhanced-apply', 
      'seo-enhanced-full',
      'seo-interactive'
    ];
    
    requiredScripts.forEach(script => {
      const exists = packageJson.scripts && packageJson.scripts[script];
      console.log(`   ${exists ? '✅' : '❌'} ${script}`);
      if (!exists) allGood = false;
      checks.push({ check: `Script: ${script}`, status: exists });
    });
  } catch (error) {
    console.log('   ❌ Error reading package.json');
    allGood = false;
  }

  // Check 3: Dependencies
  console.log('\n📦 Checking dependencies...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const requiredDeps = [
      '@google/generative-ai',
      'simple-git'
    ];
    
    requiredDeps.forEach(dep => {
      const exists = packageJson.dependencies && packageJson.dependencies[dep];
      console.log(`   ${exists ? '✅' : '❌'} ${dep}`);
      if (!exists) allGood = false;
      checks.push({ check: `Dependency: ${dep}`, status: exists });
    });
  } catch (error) {
    console.log('   ❌ Error checking dependencies');
    allGood = false;
  }

  // Check 4: Node modules
  console.log('\n🗂️ Checking node_modules...');
  const nodeModulesExists = fs.existsSync('node_modules');
  console.log(`   ${nodeModulesExists ? '✅' : '❌'} node_modules directory`);
  if (!nodeModulesExists) allGood = false;
  checks.push({ check: 'node_modules', status: nodeModulesExists });

  // Check 5: Project structure
  console.log('\n🏗️ Checking project structure...');
  const srcExists = fs.existsSync('../src');
  const publicExists = fs.existsSync('../public');
  console.log(`   ${srcExists ? '✅' : '❌'} ../src directory`);
  console.log(`   ${publicExists ? '✅' : '❌'} ../public directory`);
  checks.push({ check: 'src directory', status: srcExists });
  checks.push({ check: 'public directory', status: publicExists });

  // Check 6: API Key format (basic validation)
  console.log('\n🔑 Checking API key format...');
  try {
    const content = fs.readFileSync('enhancedGeminiSEOAssistant.js', 'utf-8');
    const hasApiKey = content.includes('AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ');
    console.log(`   ${hasApiKey ? '✅' : '❌'} Gemini API key found`);
    checks.push({ check: 'API key', status: hasApiKey });
  } catch (error) {
    console.log('   ❌ Error checking API key');
    allGood = false;
  }

  // Summary
  console.log('\n📊 Setup Verification Summary');
  console.log('=' .repeat(30));
  
  const passed = checks.filter(c => c.status).length;
  const total = checks.length;
  
  console.log(`✅ Passed: ${passed}/${total} checks`);
  console.log(`❌ Failed: ${total - passed}/${total} checks`);
  
  if (allGood) {
    console.log('\n🎉 SETUP VERIFICATION SUCCESSFUL!');
    console.log('\n🚀 You can now run:');
    console.log('   • npm run seo-enhanced (analyze only)');
    console.log('   • npm run seo-enhanced-apply (analyze + apply)');
    console.log('   • node testEnhancedSEO.js (quick test)');
    console.log('   • run-enhanced-seo.bat (Windows GUI)');
    
    console.log('\n📖 Documentation:');
    console.log('   • README-Enhanced.md (comprehensive guide)');
    console.log('   • package.json (available scripts)');
    
  } else {
    console.log('\n⚠️ SETUP VERIFICATION FAILED');
    console.log('\n🔧 To fix issues:');
    console.log('   1. Run: npm install');
    console.log('   2. Check file permissions');
    console.log('   3. Verify you\'re in the seo-automation directory');
    console.log('   4. Ensure all required files exist');
  }

  return allGood;
}

// Run verification
const success = verifySetup();
process.exit(success ? 0 : 1);
