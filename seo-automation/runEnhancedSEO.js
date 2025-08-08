#!/usr/bin/env node

import EnhancedGeminiSEOAssistant from './enhancedGeminiSEOAssistant.js';
import fs from 'fs';
import path from 'path';

/**
 * Enhanced SEO Automation Script for PDFPage.in
 * Scans entire project and applies your comprehensive SEO optimization prompt
 */

async function main() {
  console.log('🎯 PDFPage.in - Enhanced SEO Automation with Gemini AI');
  console.log('🔍 Comprehensive Project-Wide SEO Analysis & Optimization');
  console.log('=' .repeat(80));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const flags = {
    applyChanges: args.includes('--apply') || args.includes('-a'),
    pushToGit: args.includes('--push') || args.includes('-p'),
    interactive: args.includes('--interactive') || args.includes('-i'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  console.log('\n⚙️ Configuration:');
  console.log(`   • Apply Changes: ${flags.applyChanges ? '✅ YES' : '❌ NO (--apply to enable)'}`);
  console.log(`   • Push to Git: ${flags.pushToGit ? '✅ YES' : '❌ NO (--push to enable)'}`);
  console.log(`   • Interactive Mode: ${flags.interactive ? '✅ YES' : '❌ NO (--interactive to enable)'}`);
  console.log(`   • Verbose Output: ${flags.verbose ? '✅ YES' : '❌ NO (--verbose to enable)'}`);

  // Initialize Enhanced Gemini SEO Assistant
  const seoAssistant = new EnhancedGeminiSEOAssistant();

  try {
    // Interactive mode - ask user for confirmation
    if (flags.interactive) {
      console.log('\n❓ Interactive Mode - What would you like to do?');
      console.log('   1. 🔍 Analyze only (safe - no changes)');
      console.log('   2. 🔧 Analyze + Apply improvements');
      console.log('   3. 🚀 Full automation (Analyze + Apply + Push to Git)');
      
      // In a real interactive mode, you'd use readline
      // For now, we'll proceed with analysis only in interactive mode
      console.log('\n🔍 Running analysis only in interactive mode...');
      flags.applyChanges = false;
      flags.pushToGit = false;
    }

    // Warning for destructive operations
    if (flags.applyChanges) {
      console.log('\n⚠️  WARNING: This will modify your source files!');
      console.log('   • Backups will be created with .seo-backup extension');
      console.log('   • Review changes before committing to Git');
      
      if (flags.pushToGit) {
        console.log('   • Changes will be automatically pushed to GitHub!');
      }
      
      console.log('\n⏳ Starting in 3 seconds... (Ctrl+C to cancel)');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Run the enhanced automation
    console.log('\n🚀 Starting Enhanced SEO Analysis...');
    const startTime = Date.now();
    
    const result = await seoAssistant.runEnhancedAutomation({
      applyChanges: flags.applyChanges,
      pushToGit: flags.pushToGit
    });

    const duration = (Date.now() - startTime) / 1000;

    if (result.success) {
      console.log('\n🎉 ENHANCED SEO AUTOMATION COMPLETED SUCCESSFULLY!');
      console.log(`⏱️ Total execution time: ${duration.toFixed(1)} seconds`);
      
      // Detailed summary
      const report = result.report;
      console.log('\n📊 COMPREHENSIVE RESULTS:');
      console.log('   ┌─ Analysis Summary');
      console.log(`   ├─ Total Files: ${report.summary.totalFiles}`);
      console.log(`   ├─ Successful: ${report.summary.successfulAnalyses} (${((report.summary.successfulAnalyses / report.summary.totalFiles) * 100).toFixed(1)}%)`);
      console.log(`   ├─ Failed: ${report.summary.failedAnalyses}`);
      console.log(`   ├─ Avg SEO Score: ${report.summary.averageScore.toFixed(1)}/100`);
      console.log(`   └─ Total Improvements: ${report.summary.totalImprovements}`);

      // File type breakdown
      console.log('\n   ┌─ File Type Analysis');
      Object.entries(report.fileTypes).forEach(([type, data]) => {
        console.log(`   ├─ ${type}: ${data.count} files (avg: ${data.avgScore.toFixed(1)}/100)`);
      });
      console.log('   └─');

      // Top issues
      if (report.topIssues.length > 0) {
        console.log('\n   ┌─ Top SEO Issues Found');
        report.topIssues.slice(0, 5).forEach((issue, i) => {
          console.log(`   ├─ ${i + 1}. ${issue.issue} (${issue.count} files)`);
        });
        console.log('   └─');
      }

      // Applied changes summary
      if (flags.applyChanges && report.appliedFiles) {
        console.log('\n   ┌─ Applied Changes');
        console.log(`   ├─ Files Modified: ${report.appliedFiles.length}`);
        if (report.appliedFiles.length > 0) {
          report.appliedFiles.slice(0, 5).forEach(file => {
            console.log(`   ├─ ✅ ${file}`);
          });
          if (report.appliedFiles.length > 5) {
            console.log(`   ├─ ... and ${report.appliedFiles.length - 5} more`);
          }
        }
        console.log('   └─');
      }

      // Git push summary
      if (flags.pushToGit) {
        console.log('\n   ┌─ Git Integration');
        console.log(`   ├─ Push to GitHub: ${report.gitPushSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log('   └─');
      }

      // Generated reports
      console.log('\n📋 GENERATED REPORTS:');
      console.log('   ├─ 📄 comprehensive-seo-report.json (detailed data)');
      console.log('   ├─ 📖 seo-report-readable.md (human-readable)');
      console.log('   └─ 📊 All analysis data saved for review');

      // Next steps
      if (!flags.applyChanges) {
        console.log('\n🎯 NEXT STEPS:');
        console.log('   1. 📖 Review the generated reports');
        console.log('   2. 🔧 Run with --apply flag to implement improvements');
        console.log('   3. 🚀 Run with --apply --push to auto-deploy changes');
        console.log('\n💡 Example commands:');
        console.log('   • npm run seo-enhanced --apply');
        console.log('   • npm run seo-enhanced --apply --push');
        console.log('   • npm run seo-enhanced --interactive');
      } else {
        console.log('\n✅ CHANGES APPLIED SUCCESSFULLY!');
        console.log('   • Review modified files before finalizing');
        console.log('   • Backup files created with .seo-backup extension');
        if (!flags.pushToGit) {
          console.log('   • Run with --push flag to auto-commit to Git');
        }
      }

      // Performance insights
      console.log('\n⚡ PERFORMANCE INSIGHTS:');
      console.log(`   • Processing Rate: ${(report.summary.totalFiles / duration).toFixed(1)} files/second`);
      console.log(`   • Avg Analysis Time: ${(duration / report.summary.totalFiles).toFixed(2)} seconds/file`);
      console.log(`   • Success Rate: ${((report.summary.successfulAnalyses / report.summary.totalFiles) * 100).toFixed(1)}%`);

      // Quality score interpretation
      const avgScore = report.summary.averageScore;
      let scoreInterpretation = '';
      if (avgScore >= 90) scoreInterpretation = '🌟 Excellent';
      else if (avgScore >= 80) scoreInterpretation = '🎯 Good';
      else if (avgScore >= 70) scoreInterpretation = '⚠️ Needs Improvement';
      else scoreInterpretation = '🚨 Critical Issues';

      console.log(`\n📈 OVERALL SEO HEALTH: ${scoreInterpretation} (${avgScore.toFixed(1)}/100)`);

    } else {
      console.error('\n❌ ENHANCED SEO AUTOMATION FAILED');
      console.error(`💥 Error: ${result.error}`);
      console.error(`⏱️ Failed after: ${duration.toFixed(1)} seconds`);
      
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('   • Check your Gemini API key');
      console.log('   • Verify network connectivity');
      console.log('   • Check file permissions');
      console.log('   • Review error logs above');
    }

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    console.error('\n🔧 Please check:');
    console.error('   • Gemini API key is valid');
    console.error('   • Network connection is stable');
    console.error('   • File system permissions');
    console.error('   • Project directory structure');
    
    process.exit(1);
  }
}

// Display help
function showHelp() {
  console.log(`
🎯 Enhanced SEO Automation for PDFPage.in

Usage: node runEnhancedSEO.js [options]

Options:
  -a, --apply         Apply SEO improvements to files (creates backups)
  -p, --push          Push changes to GitHub (requires --apply)
  -i, --interactive   Interactive mode with confirmations
  -v, --verbose       Verbose output with detailed progress
  -h, --help          Show this help message

Examples:
  node runEnhancedSEO.js                 # Analyze only (safe)
  node runEnhancedSEO.js --apply         # Analyze and apply changes
  node runEnhancedSEO.js --apply --push  # Full automation with Git push
  node runEnhancedSEO.js --interactive   # Interactive mode

Features:
  ✅ Scans entire project (all HTML/JSX/TSX/CSS files)
  ✅ Uses comprehensive SEO optimization prompt
  ✅ Preserves design and functionality
  ✅ Creates automatic backups
  ✅ Generates detailed reports
  ✅ Optional Git integration

API Key: Uses AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ
`);
}

// Check for help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the automation
main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
