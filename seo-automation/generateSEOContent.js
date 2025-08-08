#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI("AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ");

class SEOContentGenerator {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.outputDir = 'seo-output';
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async delay(ms = 2000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateMetaTags() {
    console.log('🏷️ Generating meta tags for PDF tools...');
    
    const prompt = `
    Create SEO-optimized meta tags for these PDF tool pages:

    1. PDF Compress - Reduce PDF file size
    2. PDF Merge - Combine multiple PDFs  
    3. PDF Split - Split PDF into pages
    4. PDF to Word - Convert PDF to Word
    5. PDF to Excel - Convert PDF to Excel
    6. Image to PDF - Convert images to PDF
    7. HTML to PDF - Convert web pages to PDF

    For each tool, provide:
    Title: [max 60 characters, include main keyword]
    Description: [max 160 characters, compelling and informative]
    Keywords: [5-7 relevant keywords separated by commas]

    Format clearly with tool name as header.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      fs.writeFileSync(path.join(this.outputDir, 'meta-tags.txt'), content);
      console.log('✅ Meta tags saved to seo-output/meta-tags.txt');
      return content;
    } catch (error) {
      console.error('❌ Error generating meta tags:', error.message);
      return null;
    }
  }

  async generateFAQs() {
    console.log('❓ Generating FAQ content...');
    
    const prompt = `
    Create 15 frequently asked questions and answers for a PDF tools website.
    
    Cover these topics:
    - File security and privacy
    - Supported file formats
    - File size limitations
    - Quality preservation
    - Processing speed
    - Pricing and free usage
    - Technical troubleshooting
    - Mobile compatibility
    - Batch processing
    - Download issues

    Format as:
    Q: [Question]
    A: [Detailed, helpful answer]

    Make answers informative and reassuring to build trust.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      fs.writeFileSync(path.join(this.outputDir, 'faqs.txt'), content);
      console.log('✅ FAQs saved to seo-output/faqs.txt');
      return content;
    } catch (error) {
      console.error('❌ Error generating FAQs:', error.message);
      return null;
    }
  }

  async generateBlogTopics() {
    console.log('📝 Generating blog topic ideas...');
    
    const prompt = `
    Create 20 blog post ideas for a PDF tools website to improve SEO.
    
    Include:
    - How-to guides for PDF tasks
    - Comparison articles
    - Industry insights
    - Problem-solving content
    - Tips and tricks
    - Tool reviews

    Format as:
    1. [Blog Title] - [Brief description of content]
    
    Focus on topics that would rank well in search engines.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      fs.writeFileSync(path.join(this.outputDir, 'blog-topics.txt'), content);
      console.log('✅ Blog topics saved to seo-output/blog-topics.txt');
      return content;
    } catch (error) {
      console.error('❌ Error generating blog topics:', error.message);
      return null;
    }
  }

  async generateSchemaMarkup() {
    console.log('🏗️ Generating Schema.org markup...');
    
    const prompt = `
    Create Schema.org structured data markup for a PDF tools website.
    
    Include:
    1. Organization schema for the company
    2. WebApplication schema for the PDF tools
    3. FAQ schema for common questions
    4. BreadcrumbList schema for navigation
    5. HowTo schema for using PDF tools

    Provide actual JSON-LD code that can be added to HTML pages.
    Use "pdfpage.in" as the website domain.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      fs.writeFileSync(path.join(this.outputDir, 'schema-markup.txt'), content);
      console.log('✅ Schema markup saved to seo-output/schema-markup.txt');
      return content;
    } catch (error) {
      console.error('❌ Error generating schema markup:', error.message);
      return null;
    }
  }

  async generateSitemapStructure() {
    console.log('🗺️ Generating sitemap structure...');
    
    const prompt = `
    Create a comprehensive sitemap structure for a PDF tools website.
    
    Include these pages with priority and changefreq:
    - Home page
    - All PDF tool pages (compress, merge, split, convert, etc.)
    - About page
    - Contact page
    - Privacy policy
    - Terms of service
    - Blog section
    - Help/FAQ page

    Format as:
    URL: [page URL]
    Priority: [0.1-1.0]
    Changefreq: [always/hourly/daily/weekly/monthly/yearly/never]
    Description: [brief page description]

    Suggest realistic priorities based on page importance.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      fs.writeFileSync(path.join(this.outputDir, 'sitemap-structure.txt'), content);
      console.log('✅ Sitemap structure saved to seo-output/sitemap-structure.txt');
      return content;
    } catch (error) {
      console.error('❌ Error generating sitemap structure:', error.message);
      return null;
    }
  }

  async generateInternalLinkingStrategy() {
    console.log('🔗 Generating internal linking strategy...');
    
    const prompt = `
    Create an internal linking strategy for a PDF tools website.
    
    Suggest:
    1. Which pages should link to each other
    2. Anchor text suggestions for internal links
    3. Related tools recommendations
    4. Blog post to tool page connections
    5. Footer and navigation link structure

    Focus on improving user experience and SEO value.
    Provide specific examples of where to place links.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      fs.writeFileSync(path.join(this.outputDir, 'internal-linking.txt'), content);
      console.log('✅ Internal linking strategy saved to seo-output/internal-linking.txt');
      return content;
    } catch (error) {
      console.error('❌ Error generating internal linking strategy:', error.message);
      return null;
    }
  }

  async generateRobotsTxt() {
    console.log('🤖 Generating robots.txt...');
    
    const prompt = `
    Create an optimized robots.txt file for a PDF tools website (pdfpage.in).
    
    Include:
    - Proper user-agent directives
    - Allow/disallow rules for different sections
    - Sitemap location
    - Crawl delay if needed
    - Rules for different search engines

    Provide the actual robots.txt content.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      fs.writeFileSync(path.join(this.outputDir, 'robots.txt'), content);
      console.log('✅ Robots.txt saved to seo-output/robots.txt');
      return content;
    } catch (error) {
      console.error('❌ Error generating robots.txt:', error.message);
      return null;
    }
  }

  async runCompleteGeneration() {
    console.log('🚀 Starting Complete SEO Content Generation');
    console.log('=' .repeat(60));
    
    const results = {
      timestamp: new Date().toISOString(),
      success: [],
      errors: []
    };

    const tasks = [
      { name: 'Meta Tags', func: () => this.generateMetaTags() },
      { name: 'FAQs', func: () => this.generateFAQs() },
      { name: 'Blog Topics', func: () => this.generateBlogTopics() },
      { name: 'Schema Markup', func: () => this.generateSchemaMarkup() },
      { name: 'Sitemap Structure', func: () => this.generateSitemapStructure() },
      { name: 'Internal Linking', func: () => this.generateInternalLinkingStrategy() },
      { name: 'Robots.txt', func: () => this.generateRobotsTxt() }
    ];

    for (const task of tasks) {
      try {
        await task.func();
        results.success.push(task.name);
        await this.delay(3000); // Wait 3 seconds between requests
      } catch (error) {
        console.error(`❌ ${task.name} failed:`, error.message);
        results.errors.push({ task: task.name, error: error.message });
      }
    }

    // Save summary
    fs.writeFileSync(
      path.join(this.outputDir, 'generation-summary.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('\n🎉 SEO Content Generation Complete!');
    console.log(`📁 All files saved to: ${this.outputDir}/`);
    console.log(`✅ Successful: ${results.success.length}/${tasks.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(error => {
        console.log(`   • ${error.task}: ${error.error}`);
      });
    }

    return results;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new SEOContentGenerator();
  generator.runCompleteGeneration().catch(console.error);
}

export default SEOContentGenerator;
