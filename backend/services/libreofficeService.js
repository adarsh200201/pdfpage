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
    // Check if LibreOffice is explicitly set as available in Docker/production
    if (process.env.LIBREOFFICE_AVAILABLE === "true") {
      console.log("🐳 LibreOffice availability forced by environment variable");
      try {
        const { stdout } = await execAsync("libreoffice --version", {
          timeout: 5000,
        });
        this.isAvailable = true;
        this.version = stdout.trim();
        console.log(`✅ LibreOffice available: ${this.version}`);
        return true;
      } catch (error) {
        // Even if version check fails, trust the environment variable in Docker
        console.log(
          "🐳 LibreOffice version check failed but LIBREOFFICE_AVAILABLE=true, proceeding...",
        );
        this.isAvailable = true;
        this.version = "LibreOffice (Docker)";
        console.log(`✅ LibreOffice available: ${this.version}`);
        return true;
      }
    }

    // Normal availability check for development
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
    // Platform-specific LibreOffice executable paths
    if (process.platform === "win32") {
      // Windows paths (even when LIBREOFFICE_AVAILABLE=true for testing)
      const windowsPaths = [
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
        "soffice.exe",
        "soffice",
        "libreoffice",
      ];
      return windowsPaths[0]; // Try the most common Windows path first
    } else if (
      process.platform === "linux" ||
      process.env.LIBREOFFICE_AVAILABLE === "true"
    ) {
      // Linux/Docker environments
      return "/usr/bin/libreoffice";
    } else if (process.platform === "darwin") {
      // macOS
      return "/Applications/LibreOffice.app/Contents/MacOS/soffice";
    }

    // Fallback to system PATH
    return "libreoffice";
  }

  /**
   * Convert DOCX/DOC to PDF using LibreOffice headless mode
   */
  async convertDocxToPdf(inputPath, outputPath, options = {}) {
    // In Docker production, trust the environment variable
    if (!this.isAvailable && process.env.LIBREOFFICE_AVAILABLE !== "true") {
      throw new Error("LibreOffice is not available");
    }

    const {
      quality = "standard", // standard, high, premium
      preserveFormatting = true,
      timeout = 120000, // 2 minutes
    } = options;

    try {
      console.log(`🚀 Converting DOCX/DOC to PDF: ${path.basename(inputPath)}`);

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

      console.log(`✅ DOCX/DOC to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        quality,
      };
    } catch (error) {
      console.error(`❌ DOCX/DOC to PDF conversion error:`, error);
      throw new Error(`DOCX/DOC to PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert PDF to DOCX using LibreOffice headless mode
   */
  async convertPdfToDocx(inputPath, outputPath, options = {}) {
    if (!this.isAvailable && process.env.LIBREOFFICE_AVAILABLE !== "true") {
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
   * Convert PPTX/PPT to PDF using LibreOffice headless mode
   */
  async convertPptxToPdf(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { quality = "standard", timeout = 120000 } = options;

    try {
      console.log(`🚀 Converting PPTX/PPT to PDF: ${path.basename(inputPath)}`);

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

      console.log(`✅ PPTX/PPT to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        quality,
      };
    } catch (error) {
      console.error(`❌ PPTX/PPT to PDF conversion error:`, error);
      throw new Error(`PPTX/PPT to PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert ODT to PDF using LibreOffice headless mode
   */
  async convertOdtToPdf(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { quality = "standard", timeout = 120000 } = options;

    try {
      console.log(`🚀 Converting ODT to PDF: ${path.basename(inputPath)}`);

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      let command = [executable, "--headless", "--convert-to"];

      // Add quality-specific export options
      if (quality === "premium" || quality === "high") {
        command.push("pdf:writer_pdf_Export");
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

      console.log(`✅ ODT to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        quality,
      };
    } catch (error) {
      console.error(`❌ ODT to PDF conversion error:`, error);
      throw new Error(`ODT to PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert RTF to PDF using LibreOffice headless mode
   */
  async convertRtfToPdf(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { quality = "standard", timeout = 120000 } = options;

    try {
      console.log(`🚀 Converting RTF to PDF: ${path.basename(inputPath)}`);

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      let command = [executable, "--headless", "--convert-to"];

      // Add quality-specific export options
      if (quality === "premium" || quality === "high") {
        command.push("pdf:writer_pdf_Export");
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

      console.log(`✅ RTF to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        quality,
      };
    } catch (error) {
      console.error(`❌ RTF to PDF conversion error:`, error);
      throw new Error(`RTF to PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Universal conversion method - converts any LibreOffice-supported format to PDF
   */
  async convertToPdf(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { quality = "standard", timeout = 120000 } = options;
    const inputExt = path.extname(inputPath).toLowerCase();

    try {
      console.log(
        `🚀 Converting ${inputExt} to PDF: ${path.basename(inputPath)}`,
      );

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      let command = [executable, "--headless", "--convert-to"];

      // Determine the appropriate export filter based on input type and quality
      if (quality === "premium" || quality === "high") {
        if ([".docx", ".doc", ".odt", ".rtf"].includes(inputExt)) {
          command.push("pdf:writer_pdf_Export");
        } else if ([".xlsx", ".xls", ".ods"].includes(inputExt)) {
          command.push("pdf:calc_pdf_Export");
        } else if ([".pptx", ".ppt", ".odp"].includes(inputExt)) {
          command.push("pdf:impress_pdf_Export");
        } else {
          command.push("pdf");
        }
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

      console.log(`✅ ${inputExt} to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        quality,
        inputFormat: inputExt,
      };
    } catch (error) {
      console.error(`❌ ${inputExt} to PDF conversion error:`, error);
      throw new Error(`${inputExt} to PDF conversion failed: ${error.message}`);
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
   * Convert XLSX/XLS to PDF using LibreOffice headless mode
   */
  async convertXlsxToPdf(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { quality = "standard", timeout = 120000 } = options;

    try {
      console.log(`🚀 Converting XLSX/XLS to PDF: ${path.basename(inputPath)}`);

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

      console.log(`✅ XLSX/XLS to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        engine: "LibreOffice",
        quality,
      };
    } catch (error) {
      console.error(`❌ XLSX/XLS to PDF conversion error:`, error);
      throw new Error(`XLSX/XLS to PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert TXT to PDF
   */
  async convertTxtToPdf(inputPath, outputPath, options = {}) {
    return this.convertToPdf(inputPath, outputPath, options);
  }

  /**
   * Convert ODT to PDF
   */
  async convertOdtToPdf(inputPath, outputPath, options = {}) {
    return this.convertToPdf(inputPath, outputPath, options);
  }

  /**
   * Convert RTF to PDF
   */
  async convertRtfToPdf(inputPath, outputPath, options = {}) {
    return this.convertToPdf(inputPath, outputPath, options);
  }

  /**
   * Convert PDF to PPTX
   */
  async convertPdfToPptx(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { preserveLayout = true, timeout = 120000 } = options;

    try {
      console.log(`🚀 Converting PDF to PPTX: ${path.basename(inputPath)}`);

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      // Try multiple conversion approaches for better compatibility
      let command = [
        executable,
        "--headless",
        "--convert-to",
        "pptx:impress_MS_PowerPoint_2007_XML", // Use specific PPTX export filter
        "--outdir",
        outputDir,
        inputPath,
      ];

      let result;
      try {
        result = await this.executeCommand(command, timeout);
      } catch (error) {
        console.warn(
          "First conversion attempt failed, trying fallback method...",
        );

        // Fallback: Use basic pptx format without specific filter
        command = [
          executable,
          "--headless",
          "--convert-to",
          "pptx",
          "--outdir",
          outputDir,
          inputPath,
        ];

        result = await this.executeCommand(command, timeout);
      }

      // Verify output file exists
      const outputExists = await this.fileExists(outputPath);
      if (!outputExists) {
        throw new Error("LibreOffice failed to create output file");
      }

      // Validate the generated PPTX file
      const stats = await fs.stat(outputPath);
      if (stats.size < 1000) {
        throw new Error("Generated PPTX file is suspiciously small");
      }

      // Basic validation: Check if it's a valid ZIP file (PPTX is ZIP-based)
      const fileBuffer = await fs.readFile(outputPath);
      const header = fileBuffer.slice(0, 4);
      if (header[0] !== 0x50 || header[1] !== 0x4b) {
        throw new Error("Generated file is not a valid PPTX format");
      }

      console.log(`✅ PDF to PPTX conversion successful (${stats.size} bytes)`);
      return {
        success: true,
        outputPath,
        fileSize: stats.size,
        conversionMethod: "LibreOffice",
        isValidPptx: true,
      };
    } catch (error) {
      console.error(`❌ PDF to PPTX conversion error:`, error);
      throw new Error(`PDF to PPTX conversion failed: ${error.message}`);
    }
  }

  /**
   * Generic convert to PDF method for various formats
   */
  async convertToPdf(inputPath, outputPath, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { quality = "standard", timeout = 120000 } = options;

    try {
      const inputExtension = path.extname(inputPath).toLowerCase();
      console.log(
        `🚀 Converting ${inputExtension} to PDF: ${path.basename(inputPath)}`,
      );

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      let command = [executable, "--headless", "--convert-to", "pdf"];
      command.push("--outdir", outputDir);
      command.push(inputPath);

      const result = await this.executeCommand(command, timeout);

      // Verify output file exists
      const outputExists = await this.fileExists(outputPath);
      if (!outputExists) {
        throw new Error("LibreOffice failed to create output file");
      }

      console.log(`✅ ${inputExtension} to PDF conversion successful`);
      return {
        success: true,
        outputPath,
        fileSize: (await fs.stat(outputPath)).size,
        conversionMethod: "LibreOffice",
      };
    } catch (error) {
      console.error(
        `❌ ${path.extname(inputPath)} to PDF conversion error:`,
        error,
      );
      throw new Error(
        `${path.extname(inputPath)} to PDF conversion failed: ${error.message}`,
      );
    }
  }

  /**
   * Convert CSV to XLSX
   */
  async convertCsvToXlsx(inputPath, outputPath, options = {}) {
    return this.convertToFormat(inputPath, outputPath, "xlsx", options);
  }

  /**
   * Convert ODT to DOCX
   */
  async convertOdtToDocx(inputPath, outputPath, options = {}) {
    return this.convertToFormat(inputPath, outputPath, "docx", options);
  }

  /**
   * Convert RTF to DOCX
   */
  async convertRtfToDocx(inputPath, outputPath, options = {}) {
    return this.convertToFormat(inputPath, outputPath, "docx", options);
  }

  /**
   * Convert DOCX to ODT
   */
  async convertDocxToOdt(inputPath, outputPath, options = {}) {
    return this.convertToFormat(inputPath, outputPath, "odt", options);
  }

  /**
   * Convert XLS to CSV
   */
  async convertXlsToCsv(inputPath, outputPath, options = {}) {
    return this.convertToFormat(inputPath, outputPath, "csv", options);
  }

  /**
   * Convert XLSX to ODS
   */
  async convertXlsxToOds(inputPath, outputPath, options = {}) {
    return this.convertToFormat(inputPath, outputPath, "ods", options);
  }

  /**
   * Convert PPTX to ODP
   */
  async convertPptxToOdp(inputPath, outputPath, options = {}) {
    return this.convertToFormat(inputPath, outputPath, "odp", options);
  }

  /**
   * Convert PPTX to PNG
   */
  async convertPptxToPng(inputPath, outputPath, options = {}) {
    return this.convertToFormat(inputPath, outputPath, "png", options);
  }

  /**
   * Convert DOC to ODT
   */
  async convertDocToOdt(inputPath, outputPath, options = {}) {
    return this.convertToFormat(inputPath, outputPath, "odt", options);
  }

  /**
   * Generic convert to any format method
   */
  async convertToFormat(inputPath, outputPath, targetFormat, options = {}) {
    if (!this.isAvailable) {
      throw new Error("LibreOffice is not available");
    }

    const { quality = "standard", timeout = 120000 } = options;

    try {
      const inputExtension = path.extname(inputPath).toLowerCase();
      console.log(
        `🚀 Converting ${inputExtension} to ${targetFormat}: ${path.basename(inputPath)}`,
      );

      const outputDir = path.dirname(outputPath);
      const executable = this.getExecutablePath();

      let command = [executable, "--headless", "--convert-to", targetFormat];
      command.push("--outdir", outputDir);
      command.push(inputPath);

      const result = await this.executeCommand(command, timeout);

      // Verify output file exists
      const outputExists = await this.fileExists(outputPath);
      if (!outputExists) {
        throw new Error("LibreOffice failed to create output file");
      }

      console.log(
        `✅ ${inputExtension} to ${targetFormat} conversion successful`,
      );
      return {
        success: true,
        outputPath,
        fileSize: (await fs.stat(outputPath)).size,
        conversionMethod: "LibreOffice",
      };
    } catch (error) {
      console.error(
        `❌ ${path.extname(inputPath)} to ${targetFormat} conversion error:`,
        error,
      );
      throw new Error(
        `${path.extname(inputPath)} to ${targetFormat} conversion failed: ${error.message}`,
      );
    }
  }

  /**
   * Execute LibreOffice command with proper error handling
   */
  async executeCommand(command, timeout = 120000) {
    return new Promise((resolve, reject) => {
      console.log(`🔧 Executing: ${command.join(" ")}`);

      const childProcess = spawn(command[0], command.slice(1), {
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          HOME: "/tmp",
          DISPLAY: ":99", // For headless mode
        },
      });

      let stdout = "";
      let stderr = "";

      childProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      childProcess.on("close", (code) => {
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

      childProcess.on("error", (error) => {
        console.error(`❌ LibreOffice process error:`, error);
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        childProcess.kill("SIGTERM");
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
   * Check if a file format is supported by LibreOffice
   */
  isSupportedFormat(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const supportedFormats = [
      ".docx",
      ".doc",
      ".odt",
      ".rtf",
      ".xlsx",
      ".xls",
      ".ods",
      ".pptx",
      ".ppt",
      ".odp",
      ".pdf",
    ];
    return supportedFormats.includes(extension);
  }

  /**
   * Get the document type from file extension
   */
  getDocumentType(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    if ([".docx", ".doc", ".odt", ".rtf"].includes(extension)) {
      return "text";
    } else if ([".xlsx", ".xls", ".ods"].includes(extension)) {
      return "spreadsheet";
    } else if ([".pptx", ".ppt", ".odp"].includes(extension)) {
      return "presentation";
    } else if (extension === ".pdf") {
      return "pdf";
    }

    return "unknown";
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
      platform: process.platform,
      environment: process.env.NODE_ENV,
      installationNote: !available ? this.getInstallationInstructions() : null,
      supportedConversions: [
        "DOCX/DOC → PDF",
        "PDF → DOCX",
        "PPTX/PPT → PDF",
        "XLSX/XLS → PDF",
        "PDF → XLSX",
        "ODT → PDF",
        "RTF → PDF",
        "ODS → PDF",
        "ODP → PDF",
      ],
      supportedInputFormats: [
        ".docx",
        ".doc",
        ".odt",
        ".rtf",
        ".xlsx",
        ".xls",
        ".ods",
        ".pptx",
        ".ppt",
        ".odp",
        ".pdf",
      ],
    };
  }

  /**
   * Get installation instructions based on platform
   */
  getInstallationInstructions() {
    const platform = process.platform;

    if (platform === "win32") {
      return "LibreOffice not found. Download from: https://www.libreoffice.org/download/download/ or install via winget: 'winget install TheDocumentFoundation.LibreOffice'";
    } else if (platform === "darwin") {
      return "LibreOffice not found. Install via Homebrew: 'brew install --cask libreoffice' or download from: https://www.libreoffice.org/download/download/";
    } else if (platform === "linux") {
      return "LibreOffice not found. Install via package manager: 'sudo apt-get install libreoffice' (Ubuntu/Debian) or 'sudo yum install libreoffice' (CentOS/RHEL)";
    } else {
      return "LibreOffice not found. Please install LibreOffice from: https://www.libreoffice.org/download/download/";
    }
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
