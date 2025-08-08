#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI("AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ");

class SimpleSEOAnalyzer {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Analyze a single page for SEO improvements
   */
  async analyzePage(pageName, description) {
    const prompt = `
    Analyze SEO for a ${pageName} page on a PDF tools website.
    Page purpose: ${description}

    Provide 5 specific SEO improvements in this format:
    1. [Improvement type]: [Specific suggestion]
    2. [Improvement type]: [Specific suggestion]
    3. [Improvement type]: [Specific suggestion]
    4. [Improvement type]: [Specific suggestion]
    5. [Improvement type]: [Specific suggestion]

    Focus on: meta tags, headings, content structure, internal linking, and user experience.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error(`❌ Error analyzing ${pageName}:`, error.message);
      return `Error analyzing ${pageName}: ${error.message}`;
    }
  }

  /**
   * Generate meta tags for PDF tools
   */
  async generateMetaTags() {
    const prompt = `
    Create SEO-optimized meta tags for these PDF tool pages:

    1. PDF Compress - Reduce PDF file size
    2. PDF Merge - Combine multiple PDFs
    3. PDF Split - Split PDF into pages
    4. PDF to Word - Convert PDF to Word document
    5. Image to PDF - Convert images to PDF

    For each tool, provide:
    - Title (max 60 characters)
    - Description (max 160 characters)
    - Keywords (5-7 relevant keywords)

    Format as simple text, not JSON.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('❌ Error generating meta tags:', error.message);
      return `Error generating meta tags: ${error.message}`;
    }
  }

  /**
   * Generate FAQ content
   */
  async generateFAQs() {
    const prompt = `
    Create 10 frequently asked questions and answers for a PDF tools website.
    
    Focus on common user concerns:
    - File security and privacy
    - Supported formats
    - File size limits
    - Quality preservation
    - Processing time
    - Pricing
    - Technical issues

    Format as:
    Q: [Question]
    A: [Answer]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('❌ Error generating FAQs:', error.message);
      return `Error generating FAQs: ${error.message}`;
    }
  }

  /**
   * Generate sitemap structure
   */
  async generateSitemapStructure() {
    const prompt = `
    Create a sitemap structure for a PDF tools website with these pages:
    - Home
    - PDF Compress
    - PDF Merge  
    - PDF Split
    - PDF to Word
    - PDF to Excel
    - Image to PDF
    - About
    - Contact
    - Privacy Policy

    Suggest priority values (0.1-1.0) and update frequency for each page.
    Format as simple text list.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('❌ Error generating sitemap:', error.message);
      return `Error generating sitemap: ${error.message}`;
    }
  }

  /**
   * Run complete SEO analysis
   */
  async runAnalysis() {
    console.log('🚀 Starting Simple SEO Analysis with Gemini AI...');
    console.log('=' .repeat(60));

    const results = {
      timestamp: new Date().toISOString(),
      analyses: {},
      metaTags: '',
      faqs: '',
      sitemap: ''
    };

    // Define pages to analyze
    const pages = [
      { name: 'PDF Compress', description: 'Tool to reduce PDF file size while maintaining quality' },
      { name: 'PDF Merge', description: 'Tool to combine multiple PDF files into one document' },
      { name: 'PDF Split', description: 'Tool to split PDF into separate pages or sections' },
      { name: 'PDF to Word', description: 'Tool to convert PDF documents to editable Word files' },
      { name: 'Image to PDF', description: 'Tool to convert images (JPG, PNG) to PDF format' }
    ];

    // Analyze each page
    for (const page of pages) {
      console.log(`📄 Analyzing: ${page.name}...`);
      try {
        const analysis = await this.analyzePage(page.name, page.description);
        results.analyses[page.name] = analysis;
        console.log(`✅ Completed: ${page.name}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Failed: ${page.name} - ${error.message}`);
        results.analyses[page.name] = `Error: ${error.message}`;
      }
    }

    // Generate meta tags
    console.log('\n🏷️ Generating meta tags...');
    try {
      results.metaTags = await this.generateMetaTags();
      console.log('✅ Meta tags generated');
    } catch (error) {
      console.error('❌ Meta tags failed:', error.message);
      results.metaTags = `Error: ${error.message}`;
    }

    // Generate FAQs
    console.log('\n❓ Generating FAQs...');
    try {
      results.faqs = await this.generateFAQs();
      console.log('✅ FAQs generated');
    } catch (error) {
      console.error('❌ FAQs failed:', error.message);
      results.faqs = `Error: ${error.message}`;
    }

    // Generate sitemap
    console.log('\n🗺️ Generating sitemap structure...');
    try {
      results.sitemap = await this.generateSitemapStructure();
      console.log('✅ Sitemap generated');
    } catch (error) {
      console.error('❌ Sitemap failed:', error.message);
      results.sitemap = `Error: ${error.message}`;
    }

    // Save results
    this.saveResults(results);

    return results;
  }

  /**
   * Save analysis results
   */
  saveResults(results) {
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save complete results as JSON
    fs.writeFileSync(
      path.join(outputDir, 'seo-analysis-results.json'),
      JSON.stringify(results, null, 2)
    );

    // Save individual sections as text files
    fs.writeFileSync(
      path.join(outputDir, 'meta-tags.txt'),
      results.metaTags
    );

    fs.writeFileSync(
      path.join(outputDir, 'faqs.txt'),
      results.faqs
    );

    fs.writeFileSync(
      path.join(outputDir, 'sitemap-structure.txt'),
      results.sitemap
    );

    // Save page analyses
    Object.entries(results.analyses).forEach(([pageName, analysis]) => {
      const fileName = pageName.toLowerCase().replace(/\s+/g, '-') + '-analysis.txt';
      fs.writeFileSync(
        path.join(outputDir, fileName),
        `SEO Analysis for ${pageName}\n${'='.repeat(40)}\n\n${analysis}`
      );
    });

    console.log(`\n📁 Results saved to: ${outputDir}`);
    console.log('📄 Files created:');
    console.log('   • seo-analysis-results.json (complete results)');
    console.log('   • meta-tags.txt');
    console.log('   • faqs.txt');
    console.log('   • sitemap-structure.txt');
    console.log('   • [page]-analysis.txt (for each page)');
  }
}

// Run the analysis if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new SimpleSEOAnalyzer();
  
  analyzer.runAnalysis()
    .then(() => {
      console.log('\n🎉 SEO Analysis Complete!');
      console.log('📊 Check the output folder for detailed results.');
    })
    .catch(error => {
      console.error('\n💥 Analysis failed:', error);
      process.exit(1);
    });
}

export default SimpleSEOAnalyzer;
