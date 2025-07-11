const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");

class DocumentConversionService {
  constructor() {
    console.log(
      "🔧 DocumentConversionService initialized (LibreOffice-only mode)",
    );
    this.libreofficeService = require("./libreofficeService");
  }

  async convertWordToPdf(inputPath, outputPath, options = {}) {
    try {
      console.log(
        `🚀 Converting Word to PDF with LibreOffice: ${path.basename(inputPath)}`,
      );

      // Use the enhanced LibreOffice service for all Word conversions
      const result = await this.libreofficeService.convertToPdf(
        inputPath,
        outputPath,
        options,
      );

      console.log(`✅ LibreOffice Word to PDF conversion successful`);
      return {
        success: true,
        pageCount: 1,
        engine: "LibreOffice",
        ...result,
      };
    } catch (error) {
      console.error(`❌ Word to PDF conversion error:`, error);
      throw new Error(`Word to PDF conversion failed: ${error.message}`);
    }
  }

  // LibreOffice-only methods for Excel and PowerPoint
  async convertExcelToPdf(inputPath, outputPath, options = {}) {
    try {
      console.log(
        `🚀 Converting Excel to PDF with LibreOffice: ${path.basename(inputPath)}`,
      );

      const result = await this.libreofficeService.convertToPdf(
        inputPath,
        outputPath,
        options,
      );

      console.log(`✅ LibreOffice Excel to PDF conversion successful`);
      return {
        success: true,
        pageCount: 1,
        engine: "LibreOffice",
        ...result,
      };
    } catch (error) {
      console.error(`❌ Excel to PDF conversion error:`, error);
      throw new Error(`Excel to PDF conversion failed: ${error.message}`);
    }
  }

  async convertPowerpointToPdf(inputPath, outputPath, options = {}) {
    try {
      console.log(
        `🚀 Converting PowerPoint to PDF with LibreOffice: ${path.basename(inputPath)}`,
      );

      const result = await this.libreofficeService.convertToPdf(
        inputPath,
        outputPath,
        options,
      );

      console.log(`✅ LibreOffice PowerPoint to PDF conversion successful`);
      return {
        success: true,
        pageCount: 1,
        engine: "LibreOffice",
        ...result,
      };
    } catch (error) {
      console.error(`❌ PowerPoint to PDF conversion error:`, error);
      throw new Error(`PowerPoint to PDF conversion failed: ${error.message}`);
    }
  }

  // Universal conversion method using LibreOffice
  async convertToPdf(inputPath, outputPath, options = {}) {
    try {
      const extension = path.extname(inputPath).toLowerCase();
      console.log(
        `🚀 Converting ${extension} to PDF with LibreOffice: ${path.basename(inputPath)}`,
      );

      if (!this.libreofficeService.isSupportedFormat(inputPath)) {
        throw new Error(`Unsupported file format: ${extension}`);
      }

      const result = await this.libreofficeService.convertToPdf(
        inputPath,
        outputPath,
        options,
      );

      console.log(`✅ LibreOffice ${extension} to PDF conversion successful`);
      return {
        success: true,
        pageCount: 1,
        engine: "LibreOffice",
        ...result,
      };
    } catch (error) {
      console.error(`❌ Document to PDF conversion error:`, error);
      throw new Error(`Document to PDF conversion failed: ${error.message}`);
    }
  }
}

module.exports = new DocumentConversionService();
