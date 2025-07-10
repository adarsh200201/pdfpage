const { exec, spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");

const execAsync = promisify(exec);

class LibreOfficeService {
  constructor() {
    this.isAvailable = false;
    this.version = null;
    this.tempDir = path.join(__dirname, "../temp");
    this.inputDir = path.join(this.tempDir, "input");
    this.outputDir = path.join(this.tempDir, "output");

    this.init();
  }

  async init() {
    try {
      await this.checkAvailability();
      await this.ensureDirectories();
      console.log("🔧 LibreOfficeService initialized successfully");
    } catch (error) {
      console.error("❌ LibreOfficeService initialization failed:", error);
    }
  }

  async checkAvailability() {
    try {
      const { stdout } = await execAsync("libreoffice --version", {
        timeout: 5000,
      });

      this.isAvailable = true;
      this.version = stdout.trim();
      console.log(`✅ LibreOffice available: ${this.version}`);
      return true;
    } catch (error) {
      console.error("❌ LibreOffice not available:", error.message);
      this.isAvailable = false;
      return false;
    }
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.inputDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error("Error creating directories:", error);
    }
  }

  getExecutablePath() {
    // Try different possible LibreOffice paths
    const possiblePaths = [
      "libreoffice",
      "/usr/bin/libreoffice",
      "/opt/libreoffice/program/soffice",
      "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    ];

    return possiblePaths[0]; // Default to system PATH
  }

  /**
   * Convert DOCX to PDF using LibreOffice headless mode
   */
  async convertDocxToPdf(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const {
      quality = "standard", // standard, high, premium
      preserveFormatting = true,
      timeout = 120000, // 2 minutes
    } = options;

    try {
      console.log(`🚀 Converting DOCX to PDF: ${path.basename(inputPath)}`);

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      let command = [executable, "--headless", "--convert-to", "pdf"];

      // Add quality-specific export options
      if (quality === "premium") {
        command.push(
          "--outdir",
          outputDir,
          "--convert-to",
          "pdf:writer_pdf_Export",
        );
      } else if (quality === "high") {
        command.push(
          "--outdir",
          outputDir,
          "--convert-to",
          "pdf:writer_pdf_Export",
        );
      } else {
        command.push("--outdir", outputDir);
      }

      command.push(inputPath);

      const result = await this.executeCommand(command, timeout);

      // Verify output file exists
      const outputExists = await this.fileExists(outputPath);
      if (!outputExists) {
        throw new Error("LibreOffice failed to create output file");
      }

      console.log(`✅ DOCX to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        quality,
      };
    } catch (error) {
      console.error(`❌ DOCX to PDF conversion error:`, error);
      throw new Error(`DOCX to PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert PDF to DOCX using LibreOffice headless mode
   */
  async convertPdfToDocx(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { preserveLayout = true, timeout = 120000 } = options;

    try {
      console.log(`🚀 Converting PDF to DOCX: ${path.basename(inputPath)}`);

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      const command = [
        executable,
        "--headless",
        "--convert-to",
        "docx:MS Word 2007 XML",
        "--outdir",
        outputDir,
        inputPath,
      ];

      const result = await this.executeCommand(command, timeout);

      // Verify output file exists
      const outputExists = await this.fileExists(outputPath);
      if (!outputExists) {
        throw new Error("LibreOffice failed to create output file");
      }

      console.log(`✅ PDF to DOCX conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        preserveLayout,
      };
    } catch (error) {
      console.error(`❌ PDF to DOCX conversion error:`, error);
      throw new Error(`PDF to DOCX conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert PPTX to PDF using LibreOffice headless mode
   */
  async convertPptxToPdf(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { quality = "standard", timeout = 120000 } = options;

    try {
      console.log(`🚀 Converting PPTX to PDF: ${path.basename(inputPath)}`);

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      let command = [executable, "--headless", "--convert-to"];

      // Add quality-specific export options
      if (quality === "premium" || quality === "high") {
        command.push("pdf:impress_pdf_Export");
      } else {
        command.push("pdf");
      }

      command.push("--outdir", outputDir, inputPath);

      const result = await this.executeCommand(command, timeout);

      // Verify output file exists
      const outputExists = await this.fileExists(outputPath);
      if (!outputExists) {
        throw new Error("LibreOffice failed to create output file");
      }

      console.log(`✅ PPTX to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        quality,
      };
    } catch (error) {
      console.error(`❌ PPTX to PDF conversion error:`, error);
      throw new Error(`PPTX to PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert PDF to XLSX using LibreOffice headless mode
   */
  async convertPdfToXlsx(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { timeout = 120000, preserveFormatting = true } = options;

    try {
      console.log(`🚀 Converting PDF to XLSX: ${path.basename(inputPath)}`);

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      const command = [
        executable,
        "--headless",
        "--convert-to",
        "xlsx:Calc MS Excel 2007 XML",
        "--outdir",
        outputDir,
        inputPath,
      ];

      const result = await this.executeCommand(command, timeout);

      // Verify output file exists
      const outputExists = await this.fileExists(outputPath);
      if (!outputExists) {
        throw new Error("LibreOffice failed to create output file");
      }

      console.log(`✅ PDF to XLSX conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        preserveFormatting,
      };
    } catch (error) {
      console.error(`❌ PDF to XLSX conversion error:`, error);
      throw new Error(`PDF to XLSX conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert XLSX to PDF using LibreOffice headless mode
   */
  async convertXlsxToPdf(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { quality = "standard", timeout = 120000 } = options;

    try {
      console.log(`🚀 Converting XLSX to PDF: ${path.basename(inputPath)}`);

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      let command = [executable, "--headless", "--convert-to"];

      // Add quality-specific export options
      if (quality === "premium" || quality === "high") {
        command.push("pdf:calc_pdf_Export");
      } else {
        command.push("pdf");
      }

      command.push("--outdir", outputDir, inputPath);

      const result = await this.executeCommand(command, timeout);

      // Verify output file exists
      const outputExists = await this.fileExists(outputPath);
      if (!outputExists) {
        throw new Error("LibreOffice failed to create output file");
      }

      console.log(`✅ XLSX to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        quality,
      };
    } catch (error) {
      console.error(`❌ XLSX to PDF conversion error:`, error);
      throw new Error(`XLSX to PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Execute LibreOffice command with proper error handling
   */
  async executeCommand(command, timeout = 120000) {
    return new Promise((resolve, reject) => {
      console.log(`🔧 Executing: ${command.join(" ")}`);

      const process = spawn(command[0], command.slice(1), {
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          HOME: "/tmp",
          DISPLAY: ":99", // For headless mode
        },
      });

      let stdout = "";
      let stderr = "";

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          console.log(`✅ LibreOffice command completed successfully`);
          if (stdout) console.log(`stdout: ${stdout}`);
          resolve({ stdout, stderr, code });
        } else {
          console.error(`❌ LibreOffice command failed with code ${code}`);
          console.error(`stderr: ${stderr}`);
          reject(
            new Error(
              `LibreOffice command failed: ${stderr || `Exit code ${code}`}`,
            ),
          );
        }
      });

      process.on("error", (error) => {
        console.error(`❌ LibreOffice process error:`, error);
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        process.kill("SIGTERM");
        reject(new Error("LibreOffice command timed out"));
      }, timeout);
    });
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get system status
   */
  async getStatus() {
    const available = await this.checkAvailability();
    return {
      available,
      version: this.version,
      tempDir: this.tempDir,
      supportedConversions: [
        "DOCX → PDF",
        "PDF → DOCX",
        "PPTX → PDF",
        "XLSX → PDF",
        "PDF → XLSX",
      ],
    };
  }

  /**
   * Clean up temporary files
   */
  async cleanup(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        console.log(`🗑️ Cleaned up: ${path.basename(filePath)}`);
      } catch (error) {
        console.warn(`⚠️ Could not clean up ${filePath}:`, error.message);
      }
    }
  }
}

module.exports = new LibreOfficeService();
