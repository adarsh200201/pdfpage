const mammoth = require("mammoth");
const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");

class DocumentConversionService {
  constructor() {
    // Simple, safe configuration that won't crash the server
    this.puppeteerConfig = {
      headless: true,
      timeout: 60000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
      ignoreHTTPSErrors: true,
    };

    console.log("🔧 DocumentConversionService initialized (safe mode)");
  }

  async launchPuppeteerWithFallbacks() {
    const configs = [
      {
        name: "primary",
        config: this.puppeteerConfig,
      },
      {
        name: "minimal",
        config: {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          timeout: 30000,
        },
      },
    ];

    for (const { name, config } of configs) {
      try {
        console.log(`🚀 Attempting to launch Puppeteer with ${name} config...`);
        const browser = await puppeteer.launch(config);
        console.log(`✅ Puppeteer launched successfully with ${name} config`);
        return browser;
      } catch (error) {
        console.warn(`❌ Failed to launch with ${name} config:`, error.message);

        if (name === "minimal") {
          throw new Error(`Unable to launch browser: ${error.message}`);
        }
      }
    }
  }

  async convertWordToPdf(inputPath, outputPath, options = {}) {
    let browser;
    try {
      console.log(`🚀 Converting Word to PDF: ${path.basename(inputPath)}`);

      // Read the .docx file and convert to HTML using Mammoth
      const result = await mammoth.convertToHtml(
        { path: inputPath },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
          ],
          includeEmbeddedStyleMap: true,
          convertImage: mammoth.images.imgElement(function (image) {
            return image.read("base64").then(function (imageBuffer) {
              return {
                src: "data:" + image.contentType + ";base64," + imageBuffer,
              };
            });
          }),
        },
      );
      const html = result.value;

      // Create styled HTML
      const styledHtml = this.createStyledHtml(html, "word");

      // Launch Puppeteer
      browser = await this.launchPuppeteerWithFallbacks();
      const page = await browser.newPage();

      await page.setDefaultTimeout(30000);
      await page.setViewport({ width: 1280, height: 720 });

      await page.setContent(styledHtml, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait for content to stabilize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.pageSize || "A4",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: {
          top: "1in",
          right: "1in",
          bottom: "1in",
          left: "1in",
        },
        timeout: 30000,
        scale: 1.0,
      });

      // Save the PDF file
      await fs.writeFile(outputPath, pdfBuffer);

      console.log(`✅ Word to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        pageCount: await this.getPdfPageCount(pdfBuffer),
      };
    } catch (error) {
      console.error(`❌ Word to PDF conversion error:`, error);
      throw new Error(`Word to PDF conversion failed: ${error.message}`);
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.warn("Error closing browser:", closeError);
        }
      }
    }
  }

  createStyledHtml(content, type) {
    const baseStyles = `
      @page {
        margin: 1in;
        size: A4;
      }
      body {
        font-family: 'Times New Roman', serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000;
        margin: 0;
        padding: 0;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #000;
        font-weight: bold;
        margin-top: 1.2em;
        margin-bottom: 0.6em;
      }
      h1 { font-size: 18pt; }
      h2 { font-size: 16pt; }
      h3 { font-size: 14pt; }
      p {
        margin-bottom: 0.5em;
      }
      img {
        max-width: 100%;
        height: auto;
      }
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>${baseStyles}</style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }

  async getPdfPageCount(pdfBuffer) {
    try {
      const sizeInMB = pdfBuffer.length / (1024 * 1024);
      return Math.max(1, Math.ceil(sizeInMB * 2));
    } catch (error) {
      return 1;
    }
  }

  // Stub methods for Excel and PowerPoint (implement if needed)
  async convertExcelToPdf(inputPath, outputPath, options = {}) {
    throw new Error("Excel to PDF conversion not implemented in safe mode");
  }

  async convertPowerpointToPdf(inputPath, outputPath, options = {}) {
    throw new Error(
      "PowerPoint to PDF conversion not implemented in safe mode",
    );
  }
}

module.exports = new DocumentConversionService();
