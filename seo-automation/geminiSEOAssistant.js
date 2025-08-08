import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ");
const git = simpleGit();

class GeminiSEOAssistant {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Analyze React component for SEO improvements
   */
  async analyzeReactComponent(componentPath, componentContent) {
    const prompt = `
    Analyze this React component for SEO best practices and suggest improvements:

    Component: ${componentPath}
    
    Content:
    ${componentContent}

    Please analyze and suggest improvements for:
    1. Meta tags (title, description, keywords)
    2. Heading structure (H1, H2, H3 hierarchy)
    3. Alt tags for images
    4. Semantic HTML structure
    5. Schema.org structured data
    6. Internal linking opportunities
    7. Page loading performance
    8. Accessibility improvements

    Return your response in this JSON format:
    {
      "seoScore": 85,
      "improvements": [
        {
          "type": "meta",
          "issue": "Missing meta description",
          "suggestion": "Add meta description for better SERP display",
          "code": "<meta name='description' content='...' />"
        }
      ],
      "updatedCode": "// Improved component code here"
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseGeminiResponse(response.text());
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      return null;
    }
  }

  /**
   * Analyze entire project for SEO
   */
  async analyzeProject() {
    console.log('🔍 Starting SEO analysis with Gemini AI...');
    
    const results = [];
    const componentsToAnalyze = [
      '../src/pages/Compress.tsx',
      '../src/pages/Convert.tsx',
      '../src/pages/Merge.tsx',
      '../src/pages/Split.tsx',
      '../src/App.tsx',
      '../index.html'
    ];

    for (const componentPath of componentsToAnalyze) {
      const fullPath = path.join(process.cwd(), componentPath);
      
      if (fs.existsSync(fullPath)) {
        console.log(`📄 Analyzing: ${componentPath}`);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const analysis = await this.analyzeReactComponent(componentPath, content);
        
        if (analysis) {
          results.push({
            file: componentPath,
            ...analysis
          });
        }
      }
    }

    return results;
  }

  /**
   * Generate SEO improvements for PDF tools
   */
  async generatePDFToolSEO() {
    const prompt = `
    Create SEO recommendations for a PDF tools website. Focus on these specific improvements:

    1. Meta title suggestions for PDF Compress tool (max 60 characters)
    2. Meta description for PDF Merge tool (max 160 characters)
    3. Three internal linking opportunities between tools
    4. One FAQ question and answer for PDF to Word conversion
    5. Breadcrumb structure for tool pages

    Provide practical, actionable suggestions in simple bullet points.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseGeminiResponse(response.text());
    } catch (error) {
      console.error('❌ PDF Tools SEO Generation Error:', error);
      return null;
    }
  }

  /**
   * Parse Gemini response and extract JSON
   */
  parseGeminiResponse(text) {
    try {
      // Clean the text and try to extract JSON
      let cleanText = text.trim();

      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Try to find JSON object
      const jsonMatch = cleanText.match(/\{[\s\S]*?\}(?=\s*$|\s*\n\s*[^}])/);
      if (jsonMatch) {
        // Clean up common JSON issues
        let jsonStr = jsonMatch[0];
        jsonStr = jsonStr.replace(/\/\/.*$/gm, ''); // Remove comments
        jsonStr = jsonStr.replace(/,\s*}/g, '}'); // Remove trailing commas
        jsonStr = jsonStr.replace(/,\s*]/g, ']'); // Remove trailing commas in arrays

        return JSON.parse(jsonStr);
      }

      // If no JSON found, create structured response from text
      const lines = text.split('\n').filter(line => line.trim());
      const improvements = [];

      lines.forEach((line, index) => {
        if (line.includes('*') || line.includes('-') || line.includes('•')) {
          improvements.push({
            type: "suggestion",
            issue: `Point ${index + 1}`,
            suggestion: line.replace(/[*\-•]\s*/, '').trim(),
            code: ""
          });
        }
      });

      return {
        seoScore: 75,
        improvements: improvements.length > 0 ? improvements : [
          {
            type: "analysis",
            issue: "Gemini analysis",
            suggestion: text.substring(0, 300) + "...",
            code: ""
          }
        ]
      };
    } catch (error) {
      console.error('❌ Response parsing error:', error);
      return {
        seoScore: 60,
        improvements: [
          {
            type: "error",
            issue: "Failed to parse Gemini response",
            suggestion: text.substring(0, 200) + "...",
            code: ""
          }
        ]
      };
    }
  }

  /**
   * Apply SEO improvements to files
   */
  async applyImprovements(analysisResults) {
    console.log('🔧 Applying SEO improvements...');
    
    for (const result of analysisResults) {
      if (result.updatedCode && result.file) {
        const filePath = path.join(process.cwd(), result.file);
        
        try {
          // Backup original file
          const backupPath = `${filePath}.backup`;
          fs.copyFileSync(filePath, backupPath);
          
          // Apply improvements
          fs.writeFileSync(filePath, result.updatedCode);
          console.log(`✅ Updated: ${result.file}`);
        } catch (error) {
          console.error(`❌ Failed to update ${result.file}:`, error);
        }
      }
    }
  }

  /**
   * Generate SEO report
   */
  generateReport(analysisResults) {
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: analysisResults.length,
      averageScore: analysisResults.reduce((sum, r) => sum + (r.seoScore || 0), 0) / analysisResults.length,
      totalImprovements: analysisResults.reduce((sum, r) => sum + (r.improvements?.length || 0), 0),
      files: analysisResults
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'seo-automation', 'seo-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 SEO Report generated:', reportPath);
    return report;
  }

  /**
   * Commit and push changes to GitHub
   */
  async pushToGitHub(message = 'Auto: Applied SEO improvements via Gemini AI') {
    try {
      console.log('📤 Pushing changes to GitHub...');
      
      await git.add('./*');
      await git.commit(message);
      await git.push('origin', 'main');
      
      console.log('✅ Successfully pushed to GitHub!');
      return true;
    } catch (error) {
      console.error('❌ GitHub push failed:', error);
      return false;
    }
  }

  /**
   * Run complete SEO automation workflow
   */
  async runAutomation() {
    console.log('🚀 Starting Gemini SEO Automation for PdfPage...');
    
    try {
      // 1. Analyze project
      const analysisResults = await this.analyzeProject();
      
      // 2. Generate PDF tools specific SEO
      const pdfToolsSEO = await this.generatePDFToolSEO();
      
      // 3. Generate report
      const report = this.generateReport(analysisResults);
      
      // 4. Apply improvements (optional - uncomment to auto-apply)
      // await this.applyImprovements(analysisResults);
      
      // 5. Push to GitHub (optional - uncomment to auto-push)
      // await this.pushToGitHub();
      
      console.log('🎉 SEO automation completed!');
      console.log(`📊 Average SEO Score: ${report.averageScore.toFixed(1)}/100`);
      console.log(`🔧 Total Improvements: ${report.totalImprovements}`);
      
      return {
        success: true,
        report,
        pdfToolsSEO
      };
    } catch (error) {
      console.error('❌ SEO automation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default GeminiSEOAssistant;
