const mammoth = require("mammoth");
const fs = require("fs").promises;
const path = require("path");

class DocumentConversionService {
  constructor() {
    console.log(
      "🔧 DocumentConversionService initialized (LibreOffice-only mode)",
    );
  }

  async convertWordToPdf(inputPath, outputPath, options = {}) {
    try {
      console.log(
        `🚀 Converting Word to PDF with LibreOffice: ${path.basename(inputPath)}`,
      );

      // Use LibreOffice for conversion - more reliable
      const { spawn } = require("child_process");

      const result = await new Promise((resolve, reject) => {
        const process = spawn("libreoffice", [
          "--headless",
          "--convert-to",
          "pdf",
          "--outdir",
          path.dirname(outputPath),
          inputPath,
        ]);

        let stderr = "";
        process.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        process.on("close", (code) => {
          if (code === 0) {
            console.log(`✅ LibreOffice Word to PDF conversion successful`);
            resolve({ success: true, pageCount: 1 });
          } else {
            reject(new Error(`LibreOffice conversion failed: ${stderr}`));
          }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          process.kill();
          reject(new Error("LibreOffice conversion timed out"));
        }, 30000);
      });

      return result;
    } catch (error) {
      console.error(`❌ Word to PDF conversion error:`, error);
      throw new Error(`Word to PDF conversion failed: ${error.message}`);
    }
  }

  // Stub methods - use LibreOffice endpoints for these
  async convertExcelToPdf(inputPath, outputPath, options = {}) {
    throw new Error("Use /api/pdf/excel-to-pdf-libreoffice endpoint instead");
  }

  async convertPowerpointToPdf(inputPath, outputPath, options = {}) {
    throw new Error(
      "Use /api/pdf/powerpoint-to-pdf-libreoffice endpoint instead",
    );
  }
}

module.exports = new DocumentConversionService();
