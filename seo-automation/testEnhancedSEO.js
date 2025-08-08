#!/usr/bin/env node

import EnhancedGeminiSEOAssistant from './enhancedGeminiSEOAssistant.js';

/**
 * Quick test runner for Enhanced SEO Automation
 * Tests the system with a small subset of files
 */

async function runQuickTest() {
  console.log('🧪 Quick Test - Enhanced SEO Automation');
  console.log('=' .repeat(50));

  const seoAssistant = new EnhancedGeminiSEOAssistant();

  try {
    console.log('📁 Testing file scanning...');
    const files = seoAssistant.scanProjectFiles();
    
    console.log(`✅ Found ${files.length} files to analyze`);
    console.log('📝 Sample files:');
    files.slice(0, 5).forEach((file, i) => {
      console.log(`   ${i + 1}. ${file.relativePath} (${(file.size / 1024).toFixed(1)}KB)`);
    });

    if (files.length > 5) {
      console.log(`   ... and ${files.length - 5} more files`);
    }

    console.log('\n🔍 Testing Gemini API with a sample file...');
    
    // Test with first small file
    const testFile = files.find(f => f.size < 50000) || files[0]; // Find file under 50KB
    
    if (testFile) {
      console.log(`📄 Testing with: ${testFile.relativePath}`);
      const result = await seoAssistant.analyzeFile(testFile);
      
      if (result && result.analysis) {
        console.log('✅ Gemini API test successful!');
        console.log(`📊 SEO Score: ${result.analysis.seoScore}/100`);
        console.log(`🔧 Improvements: ${result.analysis.improvements?.length || 0}`);
        
        if (result.analysis.improvements?.length > 0) {
          console.log('💡 Sample improvements:');
          result.analysis.improvements.slice(0, 3).forEach((imp, i) => {
            console.log(`   ${i + 1}. ${imp.type}: ${imp.issue}`);
          });
        }
      } else {
        console.log('⚠️ Gemini API test had issues, but basic scanning works');
      }
    }

    console.log('\n🎉 Quick test completed successfully!');
    console.log('\n🚀 Ready to run full automation:');
    console.log('   • npm run seo-enhanced (analyze only)');
    console.log('   • npm run seo-enhanced-apply (analyze + apply)');
    console.log('   • npm run seo-enhanced-full (analyze + apply + push)');

  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('\n🔑 API Key Issue:');
      console.log('   • Check if your Gemini API key is valid');
      console.log('   • Verify network connectivity');
    }
    
    if (error.message.includes('file') || error.message.includes('path')) {
      console.log('\n📁 File System Issue:');
      console.log('   • Check if running from correct directory');
      console.log('   • Verify file permissions');
    }
  }
}

// Run the quick test
console.log('🔍 Starting quick test of Enhanced SEO system...\n');
runQuickTest().catch(error => {
  console.error('💥 Test failed with unexpected error:', error);
  process.exit(1);
});
