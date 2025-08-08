#!/usr/bin/env node

import GeminiSEOAssistant from './geminiSEOAssistant.js';
import fs from 'fs';
import path from 'path';

/**
 * Main SEO Automation Script for PdfPage.in
 * Uses Gemini AI to analyze and improve SEO
 */

async function main() {
  console.log('🎯 PdfPage.in SEO Automation with Gemini AI');
  console.log('=' .repeat(50));

  // Create SEO automation directory if it doesn't exist
  const seoDir = path.join(process.cwd(), 'seo-automation');
  if (!fs.existsSync(seoDir)) {
    fs.mkdirSync(seoDir, { recursive: true });
  }

  // Initialize Gemini SEO Assistant
  const seoAssistant = new GeminiSEOAssistant();

  try {
    // Run the automation
    const result = await seoAssistant.runAutomation();

    if (result.success) {
      console.log('\n🎉 SEO Automation Completed Successfully!');
      console.log('\n📊 Summary:');
      console.log(`   • Files Analyzed: ${result.report.totalFiles}`);
      console.log(`   • Average SEO Score: ${result.report.averageScore.toFixed(1)}/100`);
      console.log(`   • Total Improvements: ${result.report.totalImprovements}`);
      console.log(`   • Report saved: seo-automation/seo-report.json`);

      // Display top improvements
      if (result.report.files.length > 0) {
        console.log('\n🔧 Top SEO Improvements:');
        result.report.files.forEach((file, index) => {
          if (file.improvements && file.improvements.length > 0) {
            console.log(`\n   ${index + 1}. ${file.file}:`);
            file.improvements.slice(0, 3).forEach(improvement => {
              console.log(`      • ${improvement.type}: ${improvement.issue}`);
            });
          }
        });
      }

      // Ask user if they want to apply changes
      console.log('\n❓ Next Steps:');
      console.log('   1. Review the SEO report: seo-automation/seo-report.json');
      console.log('   2. To apply improvements automatically, uncomment lines in geminiSEOAssistant.js');
      console.log('   3. To push to GitHub automatically, uncomment the push lines');
      
    } else {
      console.error('\n❌ SEO Automation Failed:', result.error);
    }

  } catch (error) {
    console.error('\n💥 Fatal Error:', error);
    process.exit(1);
  }
}

// Run the automation
main().catch(console.error);
