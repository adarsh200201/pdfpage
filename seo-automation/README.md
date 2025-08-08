# 🚀 Gemini AI SEO Automation for PdfPage.in

Automated SEO analysis and optimization using Google's Gemini AI for your PDF tools website.

## 🎯 Features

- **AI-Powered SEO Analysis**: Uses Gemini Pro to analyze React components
- **Automated Improvements**: Suggests and applies SEO optimizations
- **PDF Tools Specific**: Tailored for PDF conversion and manipulation tools
- **GitHub Integration**: Automatically commits and pushes improvements
- **Comprehensive Reports**: Detailed SEO scoring and recommendations

## 🛠️ Setup

### 1. Install Dependencies
```bash
cd seo-automation
npm install
```

### 2. Run Setup Script (Windows)
```bash
setup.bat
```

### 3. Manual Setup
```bash
npm run setup
npm run seo
```

## 📊 What It Analyzes

### React Components
- Meta tags optimization
- Heading structure (H1, H2, H3)
- Image alt tags
- Semantic HTML
- Schema.org structured data
- Internal linking
- Accessibility features

### PDF Tools Specific
- Tool-specific meta descriptions
- FAQ sections for each tool
- How-to guides
- Breadcrumb navigation
- Related tools linking

## 🎮 Usage

### Run Complete SEO Automation
```bash
npm run seo
```

### Generate PDF Tools SEO Assets
```bash
node pdfToolsSEOGenerator.js
```

### Analyze Specific Component
```javascript
import GeminiSEOAssistant from './geminiSEOAssistant.js';

const seo = new GeminiSEOAssistant();
const result = await seo.analyzeReactComponent('src/pages/Compress.tsx', componentContent);
```

## 📁 Output Files

### Generated Assets (`seo-automation/generated/`)
- `meta-tags.json` - SEO meta tags for all tools
- `sitemap.xml` - Complete website sitemap
- `robots.txt` - Search engine directives
- `faqs.json` - FAQ sections with structured data

### Reports (`seo-automation/`)
- `seo-report.json` - Comprehensive SEO analysis report

## 🔧 Configuration

### Auto-Apply Changes
Uncomment these lines in `geminiSEOAssistant.js`:
```javascript
// await this.applyImprovements(analysisResults);
```

### Auto-Push to GitHub
Uncomment these lines in `geminiSEOAssistant.js`:
```javascript
// await this.pushToGitHub();
```

## 📈 SEO Improvements Generated

### Meta Tags
- Optimized titles (max 60 characters)
- Compelling descriptions (max 160 characters)
- Relevant keywords
- Open Graph tags
- Twitter Card tags

### Structured Data
- Tool-specific Schema.org markup
- FAQ structured data
- Breadcrumb markup
- Organization markup

### Content Optimization
- Heading hierarchy improvements
- Internal linking suggestions
- Image optimization
- Accessibility enhancements

## 🎯 PDF Tools Covered

- PDF Compress
- PDF Merge
- PDF Split
- PDF to Word
- PDF to Excel
- PDF to PowerPoint
- Image to PDF
- HTML to PDF

## 🔍 Example Output

```json
{
  "seoScore": 85,
  "improvements": [
    {
      "type": "meta",
      "issue": "Missing meta description",
      "suggestion": "Add compelling meta description",
      "code": "<meta name='description' content='Compress PDF files online for free. Reduce file size while maintaining quality. Fast, secure, and easy to use.' />"
    }
  ]
}
```

## 🚀 Advanced Features

### Custom Prompts
Modify prompts in `geminiSEOAssistant.js` to focus on specific SEO aspects.

### Batch Processing
The system automatically processes multiple components in parallel.

### GitHub Integration
Automatically commits improvements with descriptive messages.

## 🛡️ Security

- API key is used securely (consider using environment variables)
- No sensitive data is sent to Gemini
- Backup files are created before applying changes

## 📞 Support

For issues or questions:
1. Check the generated `seo-report.json`
2. Review console output for errors
3. Verify Gemini API key is valid

## 🎉 Next Steps

1. Run the automation: `npm run seo`
2. Review the SEO report
3. Apply improvements manually or enable auto-apply
4. Monitor SEO performance improvements

---

**Powered by Google Gemini AI** 🤖
