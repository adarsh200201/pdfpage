import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI("AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ");

class PDFToolsSEOGenerator {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Generate SEO-optimized React components for PDF tools
   */
  async generateToolSEOComponent(toolName, toolDescription) {
    const prompt = `
    Generate a complete SEO-optimized React component for a PDF tool with these specifications:

    Tool: ${toolName}
    Description: ${toolDescription}

    The component should include:
    1. SEO-optimized meta tags (title, description, keywords)
    2. Structured data (Schema.org)
    3. Breadcrumb navigation
    4. FAQ section
    5. How-to guide
    6. Internal linking to related tools
    7. Accessibility features
    8. Performance optimizations

    Return a complete React component with TypeScript, following modern best practices.
    Include imports for necessary dependencies.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error(`❌ Error generating SEO component for ${toolName}:`, error);
      return null;
    }
  }

  /**
   * Generate sitemap for PDF tools
   */
  async generateSitemap() {
    const prompt = `
    Generate a comprehensive XML sitemap for a PDF tools website with these pages:
    - Home page
    - PDF Compress
    - PDF Merge
    - PDF Split
    - PDF to Word
    - PDF to Excel
    - PDF to PowerPoint
    - Image to PDF
    - HTML to PDF
    - About
    - Contact
    - Privacy Policy
    - Terms of Service

    Include proper priority, changefreq, and lastmod values.
    Return valid XML sitemap format.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('❌ Error generating sitemap:', error);
      return null;
    }
  }

  /**
   * Generate robots.txt
   */
  async generateRobotsTxt() {
    const prompt = `
    Generate an SEO-optimized robots.txt file for a PDF tools website (pdfpage.in).
    Include proper directives for search engines, sitemap location, and crawl delays.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('❌ Error generating robots.txt:', error);
      return null;
    }
  }

  /**
   * Generate meta tags for all PDF tools
   */
  async generateAllMetaTags() {
    const tools = [
      { name: 'PDF Compress', description: 'Reduce PDF file size while maintaining quality' },
      { name: 'PDF Merge', description: 'Combine multiple PDF files into one document' },
      { name: 'PDF Split', description: 'Split PDF into separate pages or sections' },
      { name: 'PDF to Word', description: 'Convert PDF documents to editable Word files' },
      { name: 'PDF to Excel', description: 'Extract data from PDF to Excel spreadsheets' },
      { name: 'PDF to PowerPoint', description: 'Convert PDF to PowerPoint presentations' },
      { name: 'Image to PDF', description: 'Convert images (JPG, PNG) to PDF format' },
      { name: 'HTML to PDF', description: 'Convert web pages and HTML to PDF documents' }
    ];

    const metaTags = {};

    for (const tool of tools) {
      console.log(`🏷️ Generating meta tags for: ${tool.name}`);
      
      const prompt = `
      Generate SEO-optimized meta tags for a ${tool.name} tool page.
      Description: ${tool.description}

      Return JSON format with:
      {
        "title": "SEO optimized title (max 60 chars)",
        "description": "Meta description (max 160 chars)",
        "keywords": "relevant keywords",
        "ogTitle": "Open Graph title",
        "ogDescription": "Open Graph description",
        "twitterTitle": "Twitter card title",
        "twitterDescription": "Twitter card description"
      }
      `;

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        
        // Extract JSON from response
        const jsonMatch = response.text().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          metaTags[tool.name] = JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error(`❌ Error generating meta tags for ${tool.name}:`, error);
      }
    }

    return metaTags;
  }

  /**
   * Generate FAQ sections for PDF tools
   */
  async generateFAQs() {
    const prompt = `
    Generate comprehensive FAQ sections for PDF tools website.
    Include questions about:
    - File security and privacy
    - Supported file formats
    - File size limits
    - Processing time
    - Quality concerns
    - Pricing and usage
    - Technical issues

    Return as JSON with structured data markup for each FAQ.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('❌ Error generating FAQs:', error);
      return null;
    }
  }

  /**
   * Run complete PDF tools SEO generation
   */
  async generateAllSEOAssets() {
    console.log('🚀 Generating SEO assets for PDF tools...');

    const results = {
      metaTags: null,
      sitemap: null,
      robotsTxt: null,
      faqs: null,
      components: {}
    };

    try {
      // Generate meta tags
      console.log('🏷️ Generating meta tags...');
      results.metaTags = await this.generateAllMetaTags();

      // Generate sitemap
      console.log('🗺️ Generating sitemap...');
      results.sitemap = await this.generateSitemap();

      // Generate robots.txt
      console.log('🤖 Generating robots.txt...');
      results.robotsTxt = await this.generateRobotsTxt();

      // Generate FAQs
      console.log('❓ Generating FAQs...');
      results.faqs = await this.generateFAQs();

      // Save results
      const outputDir = path.join(process.cwd(), 'seo-automation', 'generated');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save meta tags
      if (results.metaTags) {
        fs.writeFileSync(
          path.join(outputDir, 'meta-tags.json'),
          JSON.stringify(results.metaTags, null, 2)
        );
      }

      // Save sitemap
      if (results.sitemap) {
        fs.writeFileSync(
          path.join(outputDir, 'sitemap.xml'),
          results.sitemap
        );
      }

      // Save robots.txt
      if (results.robotsTxt) {
        fs.writeFileSync(
          path.join(outputDir, 'robots.txt'),
          results.robotsTxt
        );
      }

      // Save FAQs
      if (results.faqs) {
        fs.writeFileSync(
          path.join(outputDir, 'faqs.json'),
          results.faqs
        );
      }

      console.log('✅ SEO assets generated successfully!');
      console.log(`📁 Output directory: ${outputDir}`);

      return results;

    } catch (error) {
      console.error('❌ Error generating SEO assets:', error);
      return null;
    }
  }
}

export default PDFToolsSEOGenerator;
