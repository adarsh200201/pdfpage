const mammoth = require("mammoth");
const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");

class DocumentConversionService {
  constructor() {
    // Detect if we're in a containerized environment
    const isContainer =
      process.env.NODE_ENV === "production" ||
      process.env.RENDER ||
      process.env.DOCKER_CONTAINER ||
      process.env.KUBERNETES_SERVICE_HOST;

    // Find Chrome executable dynamically
    const chromeExecutable = this.findChromeExecutable();

    this.puppeteerConfig = {
      headless: "new", // Use new headless mode
      timeout: 60000, // 60 seconds timeout
      executablePath: chromeExecutable,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // Important for containerized environments
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-crash-handler",
        "--no-crash-upload",
        "--memory-pressure-off",
        "--max_old_space_size=4096",
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--hide-scrollbars",
        "--mute-audio",
        "--no-default-browser-check",
        "--no-pings",
        "--password-store=basic",
        "--use-mock-keychain",
        "--disable-background-networking",
        "--disable-background-media",
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    };

    // Simplified config for fallback
    this.fallbackConfig = {
      headless: true,
      executablePath: chromeExecutable,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
      ],
      timeout: 30000,
      ignoreHTTPSErrors: true,
    };

    console.log(
      `🔧 Puppeteer config initialized for ${isContainer ? "containerized" : "local"} environment`,
    );
    if (isContainer) {
      console.log(`🔧 Chrome executable: ${chromeExecutable}`);
    }
  }

  findChromeExecutable() {
    const fs = require("fs");

    // Check environment variables first
    const envPaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_BIN,
      process.env.GOOGLE_CHROME_BIN,
    ].filter(Boolean);

    // Common Chrome installation paths
    const commonPaths = [
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/opt/google/chrome/google-chrome",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    ];

    // Try environment paths first
    for (const path of envPaths) {
      if (fs.existsSync(path)) {
        console.log(`✅ Found Chrome via environment: ${path}`);
        return path;
      }
    }

    // Try common paths
    for (const path of commonPaths) {
      if (fs.existsSync(path)) {
        console.log(`✅ Found Chrome at: ${path}`);
        return path;
      }
    }

    console.log(
      `⚠️ Chrome executable not found, will use Puppeteer's bundled Chromium`,
    );
    return null; // Let Puppeteer use its bundled Chromium
  }

  async launchPuppeteerWithFallbacks() {
    const configs = [
      { name: "primary", config: this.puppeteerConfig },
      { name: "fallback", config: this.fallbackConfig },
      {
        name: "minimal-with-chrome",
        config: {
          headless: true,
          executablePath: this.findChromeExecutable(),
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          timeout: 30000,
        },
      },
      {
        name: "puppeteer-bundled",
        config: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
          ],
          timeout: 30000,
        },
      },
    ];

    for (const { name, config } of configs) {
      try {
        console.log(`🚀 Attempting to launch Puppeteer with ${name} config...`);

        // Skip configs with invalid executablePath
        if (
          config.executablePath &&
          !require("fs").existsSync(config.executablePath)
        ) {
          console.log(
            `⏭️ Skipping ${name} - executable not found: ${config.executablePath}`,
          );
          continue;
        }

        const browser = await puppeteer.launch(config);
        console.log(`✅ Puppeteer launched successfully with ${name} config`);
        return browser;
      } catch (error) {
        console.warn(`❌ Failed to launch with ${name} config:`, error.message);

        if (name === "puppeteer-bundled") {
          // This is the last resort - if this fails, we can't help
          throw new Error(
            `Unable to launch any browser configuration. Please check your deployment environment. ` +
              `Last error: ${error.message}`,
          );
        }
      }
    }
  }

  async convertWordToPdf(inputPath, outputPath, options = {}) {
    let browser;
    try {
      console.log(`🚀 Converting Word to PDF: ${path.basename(inputPath)}`);

      // Read the .docx file and convert to HTML using Mammoth with enhanced options
      const result = await mammoth.convertToHtml(
        { path: inputPath },
        {
          // Enhanced style mapping for better accuracy
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1.title:fresh",
            "p[style-name='Subtitle'] => h2.subtitle:fresh",
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
            "p[style-name='Quote'] => blockquote:fresh",
            "p[style-name='List Paragraph'] => p.list-item:fresh",
          ],
          // Include embedded styles and images
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

      if (result.messages && result.messages.length > 0) {
        console.log(`📝 Mammoth conversion messages:`, result.messages);
      }

      // Create styled HTML for better PDF output
      const styledHtml = this.createStyledHtml(html, "word");

      // Launch Puppeteer with robust error handling and multiple fallback strategies
      browser = await this.launchPuppeteerWithFallbacks();
      const page = await browser.newPage();

      // Set page timeout and viewport
      await page.setDefaultTimeout(30000);
      await page.setViewport({ width: 1280, height: 720 });

      // Set page content and wait for it to load
      await page.setContent(styledHtml, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait a bit for content to stabilize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate PDF with enhanced quality settings
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
        // Use tagged PDF for better accessibility
        tagged: true,
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

      // If Puppeteer fails, try to provide a meaningful error
      if (
        error.message.includes("Target closed") ||
        error.message.includes("Protocol error")
      ) {
        throw new Error(
          "PDF generation failed due to browser instability. Please try again with a smaller document or contact support.",
        );
      } else if (error.message.includes("timeout")) {
        throw new Error(
          "PDF generation timed out. Please try again or contact support.",
        );
      } else {
        throw new Error(`Word to PDF conversion failed: ${error.message}`);
      }
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

  async convertExcelToPdf(inputPath, outputPath, options = {}) {
    let browser;
    try {
      console.log(`🚀 Converting Excel to PDF: ${path.basename(inputPath)}`);

      // Read Excel file using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(inputPath);

      let html = "";

      // Convert each worksheet to HTML table
      workbook.eachSheet((worksheet, sheetId) => {
        html += `<h2>Sheet: ${worksheet.name}</h2>`;
        html += "<table>";

        worksheet.eachRow((row, rowNumber) => {
          html += "<tr>";
          row.eachCell((cell, colNumber) => {
            const cellValue = cell.value || "";
            html += `<td>${this.escapeHtml(cellValue.toString())}</td>`;
          });
          html += "</tr>";
        });

        html += "</table><br>";
      });

      // Create styled HTML for Excel
      const styledHtml = this.createStyledHtml(html, "excel");

      // Launch Puppeteer with robust error handling
      browser = await this.launchPuppeteerWithFallbacks();
      const page = await browser.newPage();

      // Set page timeout and viewport
      await page.setDefaultTimeout(30000);
      await page.setViewport({ width: 1280, height: 720 });

      await page.setContent(styledHtml, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait a bit for content to stabilize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.pageSize || "A4",
        printBackground: true,
        landscape: options.orientation === "landscape",
        preferCSSPageSize: false,
        margin: {
          top: "0.5in",
          right: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
        },
        timeout: 30000,
      });

      await fs.writeFile(outputPath, pdfBuffer);

      console.log(`✅ Excel to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        pageCount: await this.getPdfPageCount(pdfBuffer),
      };
    } catch (error) {
      console.error(`❌ Excel to PDF conversion error:`, error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async convertPowerpointToPdf(inputPath, outputPath, options = {}) {
    let browser;
    try {
      console.log(
        `🚀 Converting PowerPoint to PDF: ${path.basename(inputPath)}`,
      );

      // Extract text content from PowerPoint file
      const pptContent = await this.extractPowerpointContent(inputPath);

      // Create styled HTML for PowerPoint
      const styledHtml = this.createStyledHtml(pptContent.html, "powerpoint");

      browser = await this.launchPuppeteerWithFallbacks();
      const page = await browser.newPage();

      // Set page timeout and viewport
      await page.setDefaultTimeout(30000);
      await page.setViewport({ width: 1280, height: 720 });

      await page.setContent(styledHtml, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait a bit for content to stabilize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const pdfBuffer = await page.pdf({
        format: options.pageSize || "A4",
        printBackground: true,
        landscape: options.orientation === "landscape",
        preferCSSPageSize: false,
        margin: {
          top: "0.5in",
          right: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
        },
        timeout: 30000,
      });

      await fs.writeFile(outputPath, pdfBuffer);

      console.log(`✅ PowerPoint to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        pageCount: pptContent.slideCount,
      };
    } catch (error) {
      console.error(`❌ PowerPoint to PDF conversion error:`, error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async extractPowerpointContent(inputPath) {
    try {
      const data = await fs.readFile(inputPath);
      const zip = await JSZip.loadAsync(data);

      let html = "";
      let slideCount = 0;

      // Extract slide content
      const slideFiles = Object.keys(zip.files).filter(
        (name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"),
      );

      slideCount = slideFiles.length;

      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = zip.files[slideFiles[i]];
        if (slideFile) {
          const slideXml = await slideFile.async("text");
          const slideText = this.extractTextFromSlideXml(slideXml);

          html += `
            <div class="powerpoint-slide">
              <h2>Slide ${i + 1}</h2>
              <div class="slide-content">
                ${slideText}
              </div>
            </div>
            <div style="page-break-after: always;"></div>
          `;
        }
      }

      if (slideCount === 0) {
        // Fallback content
        const fileName = path.basename(inputPath, path.extname(inputPath));
        html = `
          <div class="powerpoint-slide">
            <h1>PowerPoint Document</h1>
            <p><strong>File:</strong> ${fileName}</p>
            <p>This PowerPoint file has been converted to PDF format.</p>
            <p>Some formatting and animations may not be preserved in this conversion.</p>
          </div>
        `;
        slideCount = 1;
      }

      return {
        html,
        slideCount,
      };
    } catch (error) {
      console.warn(
        "Could not extract PowerPoint content, using fallback:",
        error.message,
      );
      const fileName = path.basename(inputPath, path.extname(inputPath));
      return {
        html: `
          <div class="powerpoint-slide">
            <h1>PowerPoint Document</h1>
            <p><strong>File:</strong> ${fileName}</p>
            <p>This PowerPoint file has been converted to PDF format.</p>
          </div>
        `,
        slideCount: 1,
      };
    }
  }

  extractTextFromSlideXml(xml) {
    // Simple XML text extraction - removes XML tags and gets text content
    let text = xml.replace(/<[^>]*>/g, " ");
    text = text.replace(/\s+/g, " ").trim();

    // Split into paragraphs and format as HTML
    const paragraphs = text.split(/[.!?]+/).filter((p) => p.trim().length > 0);

    if (paragraphs.length === 0) {
      return "<p>Slide content</p>";
    }

    return paragraphs
      .map((p) => `<p>${this.escapeHtml(p.trim())}</p>`)
      .join("");
  }

  createStyledHtml(content, type) {
    const baseStyles = `
      @page {
        margin: 1in;
        size: A4;
      }
      body {
        font-family: 'Times New Roman', 'Liberation Serif', serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000;
        margin: 0;
        padding: 0;
        text-align: justify;
        hyphens: auto;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #000;
        font-weight: bold;
        page-break-after: avoid;
        margin-top: 1.2em;
        margin-bottom: 0.6em;
        line-height: 1.2;
      }
      h1 { font-size: 18pt; }
      h2 { font-size: 16pt; }
      h3 { font-size: 14pt; }
      h4 { font-size: 13pt; }
      h5 { font-size: 12pt; }
      h6 { font-size: 11pt; }
      h1.title {
        text-align: center;
        font-size: 20pt;
        margin-bottom: 1em;
      }
      h2.subtitle {
        text-align: center;
        font-size: 16pt;
        color: #666;
        margin-bottom: 1.5em;
      }
      p {
        margin-bottom: 0.5em;
        text-indent: 0;
        orphans: 2;
        widows: 2;
      }
      p.list-item {
        margin-left: 1.5em;
        text-indent: -1.5em;
      }
      ul, ol {
        margin: 0.5em 0;
        padding-left: 2em;
      }
      li {
        margin-bottom: 0.3em;
      }
      strong, b {
        font-weight: bold;
      }
      em, i {
        font-style: italic;
      }
      blockquote {
        margin: 1em 2em;
        padding: 0.5em 1em;
        border-left: 4px solid #ccc;
        font-style: italic;
        background-color: #f9f9f9;
      }
      img {
        max-width: 100%;
        height: auto;
        page-break-inside: avoid;
      }
      table {
        border-collapse: collapse;
        margin: 1em 0;
        page-break-inside: avoid;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .page-break {
        page-break-before: always;
      }
    `;

    const excelStyles = `
      table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 1em;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      tr:nth-child(even) {
        background-color: #f9f9f9;
      }
    `;

    const powerpointStyles = `
      .powerpoint-slide {
        min-height: 90vh;
        padding: 2em;
        border: 1px solid #ddd;
        margin-bottom: 2em;
        background-color: #ffffff;
        page-break-inside: avoid;
      }
      .powerpoint-slide h2 {
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
        padding-bottom: 0.5em;
        margin-bottom: 1em;
      }
      .slide-content {
        text-align: left;
        line-height: 1.8;
      }
      .slide-content p {
        margin-bottom: 0.8em;
      }
    `;

    let additionalStyles = "";
    if (type === "excel") {
      additionalStyles = excelStyles;
    } else if (type === "powerpoint") {
      additionalStyles = powerpointStyles;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            ${baseStyles}
            ${additionalStyles}
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  async getPdfPageCount(pdfBuffer) {
    try {
      // Simple page count estimation based on buffer size
      // For accurate page counting, you might want to use pdf-parse
      const sizeInMB = pdfBuffer.length / (1024 * 1024);
      return Math.max(1, Math.ceil(sizeInMB * 2)); // Rough estimate
    } catch (error) {
      return 1; // Default fallback
    }
  }
}

module.exports = new DocumentConversionService();
