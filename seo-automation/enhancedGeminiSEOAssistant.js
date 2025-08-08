import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI("AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ");
const git = simpleGit();

class EnhancedGeminiSEOAssistant {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.projectRoot = path.join(__dirname, '..');
  }

  /**
   * Comprehensive SEO Analysis Prompt - Based on your detailed requirements
   */
  getComprehensiveSEOPrompt(filePath, fileContent) {
    return `
You are an expert SEO strategist and full-stack web developer. 
Your job is to analyze and optimize this file for SEO without breaking its design or functionality.

FILE: ${filePath}
CONTENT:
${fileContent}

---

### OBJECTIVES:
1. Perform a **full SEO audit** of the provided HTML/JSX/TSX/CSS file.
2. Identify and fix all SEO-related issues while preserving the site's design, layout, and branding.
3. Suggest improvements to text, meta tags, headings, and content for higher search rankings.

---

### TASKS TO PERFORM:

#### 1. Meta & Head Improvements
- Add or improve <title> and <meta name="description"> tags for every page.
- Use primary and secondary keywords relevant to the page's purpose.
- Add <meta name="keywords"> only if useful for the niche.
- Insert canonical tags to avoid duplicate content issues.
- Add Open Graph tags (og:title, og:description, og:image, og:url).
- Add Twitter Card tags for social media sharing.

#### 2. Headings & Content Structure
- Ensure each page has **only one H1 tag** with a clear keyword.
- Optimize heading hierarchy (H1 → H2 → H3).
- Use descriptive, keyword-rich headings that match search intent.
- Avoid keyword stuffing — maintain natural readability.

#### 3. Images & Media
- Add meaningful, descriptive alt attributes to all <img> tags.
- Compress large images without reducing visible quality (keep code reference intact).
- Ensure filenames are SEO-friendly (e.g., seo-audit-report.jpg).

#### 4. Internal Linking
- Add internal links to relevant pages where appropriate.
- Use descriptive anchor text that improves SEO.

#### 5. Technical SEO
- Ensure mobile responsiveness (meta viewport tag if missing).
- Optimize loading speed by suggesting minification of CSS/JS where possible.
- Add structured data/schema markup for products, articles, or local business (as applicable).
- Ensure robots.txt and sitemap.xml are configured properly.

#### 6. Content Enhancement
- Suggest better keyword usage in paragraphs.
- Improve CTA wording for higher engagement.
- Ensure important keywords appear in the first 100 words of each page.
- Add FAQ sections with structured data where beneficial.

#### 7. Accessibility
- Ensure ARIA roles where needed for screen readers.
- Improve color contrast if necessary (do not alter design drastically).

---

### OUTPUT FORMAT - Return JSON:
{
  "seoScore": 85,
  "fileType": "tsx|jsx|html|css",
  "improvements": [
    {
      "type": "meta|headings|images|content|technical|accessibility",
      "priority": "high|medium|low",
      "issue": "Specific issue found",
      "suggestion": "Detailed improvement suggestion",
      "before": "Current code snippet",
      "after": "Improved code snippet",
      "keywords": ["relevant", "keywords"]
    }
  ],
  "updatedCode": "COMPLETE IMPROVED FILE CONTENT HERE - Keep design identical, only optimize for SEO",
  "structuredData": "Schema.org markup if applicable",
  "metaTags": {
    "title": "Optimized page title",
    "description": "Optimized meta description",
    "keywords": "relevant, keywords, list",
    "canonical": "canonical-url",
    "openGraph": {
      "title": "OG title",
      "description": "OG description",
      "image": "OG image URL",
      "url": "Page URL"
    }
  }
}

---

### EXAMPLE IMPROVEMENTS:
- Before: <title>Home</title>
- After: <title>PDFPage – Free Online PDF Tools for Merge, Split, and Edit PDFs</title>

- Before: <img src="logo.png">
- After: <img src="logo.png" alt="PDFPage Logo – Free PDF Tools">

- Before: <h1>Tools</h1><h1>Features</h1>
- After: <h1>Free PDF Tools</h1><h2>Key Features</h2>

---

Now analyze and optimize this file to meet modern SEO best practices while keeping the website visually identical.
Return ONLY the JSON response with the complete updated code.
`;
  }

  /**
   * Scan entire project for files to optimize
   */
  scanProjectFiles() {
    const filesToScan = [];
    const srcDir = path.join(this.projectRoot, 'src');
    const publicDir = path.join(this.projectRoot, 'public');
    
    // Define file extensions to scan
    const extensions = ['.tsx', '.jsx', '.js', '.html', '.css'];
    
    // Recursively scan directories
    const scanDirectory = (dir, relativePath = '') => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativeFilePath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other irrelevant directories
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
            scanDirectory(fullPath, relativeFilePath);
          }
        } else if (extensions.some(ext => item.endsWith(ext))) {
          filesToScan.push({
            fullPath,
            relativePath: relativeFilePath,
            extension: path.extname(item),
            size: stat.size
          });
        }
      }
    };
    
    // Scan src directory
    if (fs.existsSync(srcDir)) {
      scanDirectory(srcDir, 'src');
    }
    
    // Scan public directory for HTML files
    if (fs.existsSync(publicDir)) {
      scanDirectory(publicDir, 'public');
    }
    
    // Add main files
    const mainFiles = ['index.html', 'App.tsx', 'main.tsx'];
    mainFiles.forEach(file => {
      const fullPath = path.join(this.projectRoot, file);
      if (fs.existsSync(fullPath)) {
        filesToScan.push({
          fullPath,
          relativePath: file,
          extension: path.extname(file),
          size: fs.statSync(fullPath).size
        });
      }
    });
    
    console.log(`📁 Found ${filesToScan.length} files to analyze`);
    return filesToScan;
  }

  /**
   * Analyze single file with comprehensive SEO prompt
   */
  async analyzeFile(fileInfo) {
    try {
      const content = fs.readFileSync(fileInfo.fullPath, 'utf-8');
      
      // Skip binary files or very large files
      if (fileInfo.size > 1024 * 1024) { // 1MB limit
        console.log(`⚠️ Skipping large file: ${fileInfo.relativePath}`);
        return null;
      }
      
      const prompt = this.getComprehensiveSEOPrompt(fileInfo.relativePath, content);
      
      console.log(`🔍 Analyzing: ${fileInfo.relativePath}`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = this.parseGeminiResponse(response.text());
      
      return {
        ...fileInfo,
        analysis,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error analyzing ${fileInfo.relativePath}:`, error.message);
      return {
        ...fileInfo,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze entire project
   */
  async analyzeEntireProject() {
    console.log('🚀 Starting comprehensive SEO analysis of entire project...');
    
    const files = this.scanProjectFiles();
    const results = [];
    
    // Process files in batches to avoid API rate limits
    const batchSize = 3;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(files.length/batchSize)}`);
      
      const batchPromises = batch.map(file => this.analyzeFile(file));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults.filter(result => result !== null));
      
      // Rate limiting - wait between batches
      if (i + batchSize < files.length) {
        console.log('⏳ Waiting to avoid rate limits...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  /**
   * Parse Gemini response with enhanced error handling
   */
  parseGeminiResponse(text) {
    try {
      // Clean the text
      let cleanText = text.trim();
      
      // Remove markdown code blocks
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try to extract JSON
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        
        // Clean common JSON issues
        jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        
        const parsed = JSON.parse(jsonStr);
        
        // Validate required fields
        if (!parsed.seoScore) parsed.seoScore = 70;
        if (!parsed.improvements) parsed.improvements = [];
        
        return parsed;
      }
      
      // Fallback parsing
      return this.createFallbackResponse(text);
      
    } catch (error) {
      console.warn('⚠️ JSON parsing failed, creating fallback response');
      return this.createFallbackResponse(text);
    }
  }

  /**
   * Create fallback response when JSON parsing fails
   */
  createFallbackResponse(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const improvements = [];
    
    lines.forEach((line, index) => {
      if (line.includes('•') || line.includes('-') || line.includes('*')) {
        improvements.push({
          type: "general",
          priority: "medium",
          issue: `Improvement ${index + 1}`,
          suggestion: line.replace(/[•\-*]\s*/, '').trim(),
          before: "",
          after: "",
          keywords: []
        });
      }
    });
    
    return {
      seoScore: 65,
      fileType: "unknown",
      improvements,
      rawResponse: text.substring(0, 500) + "...",
      metaTags: {
        title: "Needs optimization",
        description: "SEO analysis required"
      }
    };
  }

  /**
   * Apply improvements to files
   */
  async applyImprovements(analysisResults, autoApply = false) {
    if (!autoApply) {
      console.log('💡 To apply improvements, set autoApply=true');
      return;
    }
    
    console.log('🔧 Applying SEO improvements...');
    
    const appliedFiles = [];
    
    for (const result of analysisResults) {
      if (result.analysis?.updatedCode && result.fullPath) {
        try {
          // Create backup
          const backupPath = `${result.fullPath}.seo-backup`;
          fs.copyFileSync(result.fullPath, backupPath);
          
          // Apply improvements
          fs.writeFileSync(result.fullPath, result.analysis.updatedCode);
          
          appliedFiles.push(result.relativePath);
          console.log(`✅ Updated: ${result.relativePath}`);
          
        } catch (error) {
          console.error(`❌ Failed to update ${result.relativePath}:`, error.message);
        }
      }
    }
    
    return appliedFiles;
  }

  /**
   * Generate comprehensive SEO report
   */
  generateComprehensiveReport(analysisResults) {
    const successfulAnalyses = analysisResults.filter(r => r.analysis && !r.error);
    const failedAnalyses = analysisResults.filter(r => r.error);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: analysisResults.length,
        successfulAnalyses: successfulAnalyses.length,
        failedAnalyses: failedAnalyses.length,
        averageScore: successfulAnalyses.length > 0 
          ? successfulAnalyses.reduce((sum, r) => sum + (r.analysis.seoScore || 0), 0) / successfulAnalyses.length 
          : 0,
        totalImprovements: successfulAnalyses.reduce((sum, r) => sum + (r.analysis.improvements?.length || 0), 0)
      },
      fileTypes: this.analyzeFileTypes(analysisResults),
      topIssues: this.extractTopIssues(successfulAnalyses),
      recommendations: this.generateRecommendations(successfulAnalyses),
      detailedResults: analysisResults,
      errors: failedAnalyses.map(r => ({
        file: r.relativePath,
        error: r.error
      }))
    };
    
    // Save report
    const reportPath = path.join(__dirname, 'comprehensive-seo-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Save human-readable report
    const readableReport = this.generateReadableReport(report);
    const readablePath = path.join(__dirname, 'seo-report-readable.md');
    fs.writeFileSync(readablePath, readableReport);
    
    console.log('📊 Comprehensive SEO Report generated:');
    console.log(`   • JSON: ${reportPath}`);
    console.log(`   • Readable: ${readablePath}`);
    
    return report;
  }

  /**
   * Analyze file types distribution
   */
  analyzeFileTypes(results) {
    const types = {};
    results.forEach(r => {
      const ext = r.extension || 'unknown';
      if (!types[ext]) {
        types[ext] = { count: 0, avgScore: 0, totalScore: 0 };
      }
      types[ext].count++;
      if (r.analysis?.seoScore) {
        types[ext].totalScore += r.analysis.seoScore;
        types[ext].avgScore = types[ext].totalScore / types[ext].count;
      }
    });
    return types;
  }

  /**
   * Extract top SEO issues across all files
   */
  extractTopIssues(results) {
    const issueCount = {};
    
    results.forEach(r => {
      if (r.analysis?.improvements) {
        r.analysis.improvements.forEach(improvement => {
          const key = `${improvement.type}: ${improvement.issue}`;
          issueCount[key] = (issueCount[key] || 0) + 1;
        });
      }
    });
    
    return Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, count }));
  }

  /**
   * Generate project-wide recommendations
   */
  generateRecommendations(results) {
    const recommendations = [
      'Implement consistent meta tag strategy across all pages',
      'Optimize heading hierarchy (H1-H6) throughout the site',
      'Add alt tags to all images for better accessibility',
      'Create internal linking strategy between related pages',
      'Implement structured data markup for PDF tools',
      'Optimize page loading speed and Core Web Vitals',
      'Ensure mobile responsiveness across all components'
    ];
    
    return recommendations;
  }

  /**
   * Generate human-readable report
   */
  generateReadableReport(report) {
    return `# SEO Analysis Report - PDFPage.in

**Generated:** ${new Date(report.timestamp).toLocaleString()}

## Executive Summary
- **Total Files Analyzed:** ${report.summary.totalFiles}
- **Successfully Analyzed:** ${report.summary.successfulAnalyses}
- **Failed Analysis:** ${report.summary.failedAnalyses}
- **Average SEO Score:** ${report.summary.averageScore.toFixed(1)}/100
- **Total Improvements Identified:** ${report.summary.totalImprovements}

## File Type Analysis
${Object.entries(report.fileTypes).map(([type, data]) => 
  `- **${type}**: ${data.count} files (avg score: ${data.avgScore.toFixed(1)})`
).join('\n')}

## Top SEO Issues
${report.topIssues.map((issue, i) => 
  `${i + 1}. ${issue.issue} (found in ${issue.count} files)`
).join('\n')}

## Recommendations
${report.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## Detailed Results
${report.detailedResults.slice(0, 5).map(r => `
### ${r.relativePath}
- **SEO Score:** ${r.analysis?.seoScore || 'N/A'}/100
- **Improvements:** ${r.analysis?.improvements?.length || 0}
- **File Size:** ${(r.size / 1024).toFixed(1)}KB
`).join('')}

---
*Report generated by Enhanced Gemini SEO Assistant*
`;
  }

  /**
   * Commit and push changes to GitHub
   */
  async pushToGitHub(message = '🔍 SEO: Applied Gemini AI optimizations across entire project') {
    try {
      console.log('📤 Committing and pushing changes to GitHub...');
      
      await git.add('./*');
      const status = await git.status();
      
      if (status.files.length === 0) {
        console.log('📝 No changes to commit');
        return true;
      }
      
      await git.commit(message);
      await git.push('origin', 'main');
      
      console.log('✅ Successfully pushed to GitHub!');
      return true;
    } catch (error) {
      console.error('❌ GitHub push failed:', error.message);
      return false;
    }
  }

  /**
   * Run complete enhanced SEO automation workflow
   */
  async runEnhancedAutomation({ applyChanges = false, pushToGit = false } = {}) {
    console.log('🚀 Starting Enhanced Gemini SEO Automation for Entire Project...');
    console.log('=' .repeat(70));
    
    try {
      // 1. Analyze entire project
      console.log('\n📊 Phase 1: Comprehensive Project Analysis');
      const analysisResults = await this.analyzeEntireProject();
      
      // 2. Generate comprehensive report
      console.log('\n📋 Phase 2: Generating Comprehensive Report');
      const report = this.generateComprehensiveReport(analysisResults);
      
      // 3. Apply improvements (if requested)
      if (applyChanges) {
        console.log('\n🔧 Phase 3: Applying SEO Improvements');
        const appliedFiles = await this.applyImprovements(analysisResults, true);
        report.appliedFiles = appliedFiles;
      }
      
      // 4. Push to GitHub (if requested)
      if (pushToGit && applyChanges) {
        console.log('\n📤 Phase 4: Pushing to GitHub');
        const pushSuccess = await this.pushToGitHub();
        report.gitPushSuccess = pushSuccess;
      }
      
      // 5. Display results
      console.log('\n🎉 Enhanced SEO Automation Completed!');
      console.log('\n📊 FINAL SUMMARY:');
      console.log(`   • Files Analyzed: ${report.summary.totalFiles}`);
      console.log(`   • Success Rate: ${((report.summary.successfulAnalyses / report.summary.totalFiles) * 100).toFixed(1)}%`);
      console.log(`   • Average SEO Score: ${report.summary.averageScore.toFixed(1)}/100`);
      console.log(`   • Total Improvements: ${report.summary.totalImprovements}`);
      
      if (applyChanges) {
        console.log(`   • Files Updated: ${report.appliedFiles?.length || 0}`);
      }
      
      console.log('\n📋 Reports Generated:');
      console.log('   • comprehensive-seo-report.json (detailed data)');
      console.log('   • seo-report-readable.md (human-readable)');
      
      if (!applyChanges) {
        console.log('\n💡 Next Steps:');
        console.log('   • Review the generated reports');
        console.log('   • Run with { applyChanges: true } to apply improvements');
        console.log('   • Run with { pushToGit: true } to auto-commit changes');
      }
      
      return {
        success: true,
        report,
        analysisResults
      };
      
    } catch (error) {
      console.error('\n💥 Enhanced SEO Automation Failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default EnhancedGeminiSEOAssistant;
