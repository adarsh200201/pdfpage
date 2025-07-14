const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const crypto = require("crypto");

/**
 * Professional PDF Compression Service
 * High-quality compression using direct Ghostscript integration
 * Achieves 60-85% compression like iLovePDF/LightPDF
 */
class ProfessionalCompressionService {
  constructor() {
    this.isWindows = os.platform() === "win32";
    this.ghostscriptCommand = this.isWindows ? "gswin64c" : "gs";
    this.tempDir = path.join(__dirname, "../temp");
    this.compressionQueue = [];
    this.activeJobs = new Set();
    this.maxConcurrentJobs = 3; // Limit concurrent Ghostscript processes
    this.jobTimeout = 60000; // 60 seconds timeout per job

    // Ensure temp directory exists
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create temp directory:", error);
    }
  }

  /**
   * Check if Ghostscript is available
   */
  async checkGhostscriptAvailability() {
    return new Promise((resolve) => {
      const process = spawn(this.ghostscriptCommand, ["--version"], {
        stdio: "pipe",
      });

      let output = "";
      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          const version = output.trim().split("\n")[0];
          resolve({
            available: true,
            version,
            command: this.ghostscriptCommand,
          });
        } else {
          resolve({
            available: false,
            error: `Ghostscript not found. Code: ${code}`,
          });
        }
      });

      process.on("error", (error) => {
        resolve({
          available: false,
          error: error.message,
        });
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        process.kill();
        resolve({
          available: false,
          error: "Ghostscript check timeout",
        });
      }, 5000);
    });
  }

  /**
   * Get installation instructions for Ghostscript
   */
  getInstallationInstructions() {
    if (this.isWindows) {
      return {
        platform: "Windows",
        steps: [
          "1. Download Ghostscript from: https://www.ghostscript.com/download/gsdnld.html",
          "2. Choose 'GPL Ghostscript' (free version)",
          "3. Download the Windows 64-bit version: gs10.03.1w64.exe",
          "4. Run the installer as Administrator",
          "5. During installation, make sure to check 'Add to PATH'",
          "6. Restart your Node.js application after installation",
          "7. Test by running: gswin64c --version",
        ],
        downloadUrl:
          "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/latest",
        testCommand: "gswin64c --version",
      };
    } else {
      return {
        platform: os.platform(),
        steps: [
          "Ubuntu/Debian: sudo apt-get install ghostscript",
          "CentOS/RHEL: sudo yum install ghostscript",
          "macOS: brew install ghostscript",
          "Restart your Node.js application after installation",
          "Test by running: gs --version",
        ],
        testCommand: "gs --version",
      };
    }
  }

  /**
   * Get compression settings based on level
   */
  getCompressionSettings(level) {
    const settings = {
      // Maximum compression for web sharing and email
      high: {
        name: "High Compression",
        pdfSettings: "/screen",
        dpi: 72,
        jpegQuality: 40,
        expectedReduction: "70-85%",
        description: "Maximum compression for web sharing",
        parameters: {
          "-dPDFSETTINGS": "/screen",
          "-dDownsampleColorImages": "true",
          "-dColorImageDownsampleType": "/Bicubic",
          "-dColorImageResolution": "72",
          "-dGrayImageDownsampleType": "/Bicubic",
          "-dGrayImageResolution": "72",
          "-dMonoImageDownsampleType": "/Bicubic",
          "-dMonoImageResolution": "72",
          "-dColorImageDownsampleThreshold": "1.2",
          "-dGrayImageDownsampleThreshold": "1.2",
          "-dMonoImageDownsampleThreshold": "1.2",
          "-dCompressPages": "true",
          "-dUseFlateCompression": "true",
          "-dOptimize": "true",
          "-dAutoFilterColorImages": "false",
          "-dAutoFilterGrayImages": "false",
          "-dColorImageFilter": "/DCTEncode",
          "-dGrayImageFilter": "/DCTEncode",
        },
      },

      // Balanced compression and quality
      medium: {
        name: "Balanced",
        pdfSettings: "/ebook",
        dpi: 150,
        jpegQuality: 60,
        expectedReduction: "50-70%",
        description: "Optimal balance of size and quality",
        parameters: {
          "-dPDFSETTINGS": "/ebook",
          "-dDownsampleColorImages": "true",
          "-dColorImageDownsampleType": "/Bicubic",
          "-dColorImageResolution": "150",
          "-dGrayImageDownsampleType": "/Bicubic",
          "-dGrayImageResolution": "150",
          "-dMonoImageDownsampleType": "/Bicubic",
          "-dMonoImageResolution": "300",
          "-dColorImageDownsampleThreshold": "1.2",
          "-dGrayImageDownsampleThreshold": "1.2",
          "-dMonoImageDownsampleThreshold": "1.2",
          "-dCompressPages": "true",
          "-dUseFlateCompression": "true",
          "-dOptimize": "true",
          "-dAutoFilterColorImages": "false",
          "-dAutoFilterGrayImages": "false",
          "-dColorImageFilter": "/DCTEncode",
          "-dGrayImageFilter": "/DCTEncode",
        },
      },

      // Light compression preserving quality
      light: {
        name: "Light Compression",
        pdfSettings: "/printer",
        dpi: 300,
        jpegQuality: 85,
        expectedReduction: "30-50%",
        description: "Light compression preserving quality",
        parameters: {
          "-dPDFSETTINGS": "/printer",
          "-dDownsampleColorImages": "true",
          "-dColorImageDownsampleType": "/Bicubic",
          "-dColorImageResolution": "300",
          "-dGrayImageDownsampleType": "/Bicubic",
          "-dGrayImageResolution": "300",
          "-dMonoImageDownsampleType": "/Bicubic",
          "-dMonoImageResolution": "600",
          "-dColorImageDownsampleThreshold": "1.1",
          "-dGrayImageDownsampleThreshold": "1.1",
          "-dMonoImageDownsampleThreshold": "1.1",
          "-dCompressPages": "true",
          "-dUseFlateCompression": "true",
          "-dOptimize": "true",
          "-dPreserveHalftoneInfo": "true",
          "-dPreserveOPIComments": "false",
          "-dPreserveOverprintSettings": "false",
        },
      },
    };

    return settings[level] || settings.medium;
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return crypto.randomBytes(8).toString("hex");
  }

  /**
   * Add job to queue
   */
  async addToQueue(jobData) {
    return new Promise((resolve, reject) => {
      const job = {
        ...jobData,
        id: this.generateJobId(),
        resolve,
        reject,
        createdAt: Date.now(),
      };

      this.compressionQueue.push(job);
      this.processQueue();
    });
  }

  /**
   * Process compression queue
   */
  async processQueue() {
    // Don't start new jobs if we're at capacity
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    // Get next job from queue
    const job = this.compressionQueue.shift();
    if (!job) {
      return;
    }

    this.activeJobs.add(job.id);

    try {
      const result = await this.executeCompression(job);
      job.resolve(result);
    } catch (error) {
      job.reject(error);
    } finally {
      this.activeJobs.delete(job.id);
      // Process next job in queue
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Execute Ghostscript compression
   */
  async executeCompression(job) {
    const { inputPath, level, onProgress } = job;
    const startTime = Date.now();

    // Check if Ghostscript is available
    const ghostscriptCheck = await this.checkGhostscriptAvailability();
    if (!ghostscriptCheck.available) {
      throw new Error(
        `Ghostscript not available: ${ghostscriptCheck.error}\n\n` +
          `Installation Instructions:\n${this.getInstallationInstructions().steps.join("\n")}`,
      );
    }

    onProgress?.(10, "Initializing compression...");

    // Get compression settings
    const settings = this.getCompressionSettings(level);
    const outputPath = path.join(
      this.tempDir,
      `compressed_${job.id}_${Date.now()}.pdf`,
    );

    onProgress?.(20, `Applying ${settings.name} compression...`);

    // Build Ghostscript command arguments
    const args = [
      "-q", // Quiet mode
      "-dNOPAUSE", // Don't pause for user input
      "-dBATCH", // Exit after processing
      "-dSAFER", // Safer execution
      "-sDEVICE=pdfwrite", // Output device
      `-sOutputFile=${outputPath}`, // Output file
    ];

    // Add compression parameters
    Object.entries(settings.parameters).forEach(([key, value]) => {
      args.push(`${key}=${value}`);
    });

    // Add input file
    args.push(inputPath);

    onProgress?.(40, "Running Ghostscript compression...");

    try {
      await this.runGhostscript(args, onProgress);

      onProgress?.(90, "Finalizing compression...");

      // Check if output file was created
      const outputStats = await fs.stat(outputPath);
      if (!outputStats.isFile()) {
        throw new Error("Ghostscript failed to create output file");
      }

      // Read compressed file
      const compressedBuffer = await fs.readFile(outputPath);

      // Get original file size
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;
      const compressedSize = compressedBuffer.length;

      // Calculate compression statistics
      const compressionRatio =
        ((originalSize - compressedSize) / originalSize) * 100;
      const sizeSaved = originalSize - compressedSize;
      const processingTime = Date.now() - startTime;

      onProgress?.(100, "Compression complete!");

      // Clean up temporary output file
      await fs.unlink(outputPath).catch(() => {});

      console.log(`✅ Professional compression completed:
        Original size: ${this.formatFileSize(originalSize)}
        Compressed size: ${this.formatFileSize(compressedSize)}
        Reduction: ${compressionRatio.toFixed(1)}%
        Time: ${processingTime}ms
        Level: ${settings.name}
        Job ID: ${job.id}`);

      return {
        compressedBuffer,
        stats: {
          originalSize,
          compressedSize,
          compressionRatio: Math.round(compressionRatio * 10) / 10,
          sizeSaved,
          processingTime,
          level: settings.name,
          expectedReduction: settings.expectedReduction,
          actualReduction: `${compressionRatio.toFixed(1)}%`,
          jobId: job.id,
          method: "Ghostscript Professional",
          ghostscriptVersion: ghostscriptCheck.version,
        },
      };
    } catch (error) {
      // Clean up temporary files
      await fs.unlink(outputPath).catch(() => {});
      throw error;
    }
  }

  /**
   * Run Ghostscript process
   */
  async runGhostscript(args, onProgress) {
    return new Promise((resolve, reject) => {
      console.log(
        `🚀 Starting Ghostscript: ${this.ghostscriptCommand} ${args.join(" ")}`,
      );

      const ghostscriptProcess = spawn(this.ghostscriptCommand, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      ghostscriptProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      ghostscriptProcess.stderr.on("data", (data) => {
        stderr += data.toString();
        onProgress?.(60, "Processing PDF content...");
      });

      ghostscriptProcess.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(
            new Error(
              `Ghostscript process failed with code ${code}\nError: ${stderr}\nOutput: ${stdout}`,
            ),
          );
        }
      });

      ghostscriptProcess.on("error", (error) => {
        reject(
          new Error(`Failed to start Ghostscript process: ${error.message}`),
        );
      });

      // Set timeout
      const timeout = setTimeout(() => {
        ghostscriptProcess.kill("SIGTERM");
        reject(new Error("Ghostscript process timeout"));
      }, this.jobTimeout);

      ghostscriptProcess.on("close", () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Main compression method with queue management
   */
  async compressPdf(filePath, level = "medium", onProgress) {
    const jobData = {
      inputPath: filePath,
      level,
      onProgress,
    };

    return this.addToQueue(jobData);
  }

  /**
   * Compress PDF from buffer
   */
  async compressPDF(buffer, filename, options = {}) {
    const { level = "medium" } = options;

    // Write buffer to temporary file
    const inputPath = path.join(
      this.tempDir,
      `input_${this.generateJobId()}_${filename}`,
    );

    try {
      await fs.writeFile(inputPath, buffer);

      // Compress the file
      const result = await this.compressPdf(inputPath, level);

      // Clean up input file
      await fs.unlink(inputPath).catch(() => {});

      return {
        buffer: result.compressedBuffer,
        stats: result.stats,
      };
    } catch (error) {
      // Clean up input file on error
      await fs.unlink(inputPath).catch(() => {});
      throw error;
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      activeJobs: this.activeJobs.size,
      queuedJobs: this.compressionQueue.length,
      maxConcurrentJobs: this.maxConcurrentJobs,
      totalJobs: this.activeJobs.size + this.compressionQueue.length,
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get compression levels info
   */
  getCompressionLevels() {
    return ["high", "medium", "light"].map((level) => {
      const settings = this.getCompressionSettings(level);
      return {
        id: level,
        name: settings.name,
        description: settings.description,
        expectedReduction: settings.expectedReduction,
        dpi: settings.dpi,
        jpegQuality: settings.jpegQuality,
      };
    });
  }

  /**
   * Test compression with a dummy operation
   */
  async testGhostscript() {
    const ghostscriptCheck = await this.checkGhostscriptAvailability();
    if (!ghostscriptCheck.available) {
      return {
        success: false,
        message: ghostscriptCheck.error,
        instructions: this.getInstallationInstructions(),
      };
    }

    try {
      // Test basic Ghostscript functionality
      await this.runGhostscript(["-dNOPAUSE", "-dBATCH", "-sDEVICE=nullpage"]);

      return {
        success: true,
        message: "Ghostscript is working correctly",
        version: ghostscriptCheck.version,
        command: ghostscriptCheck.command,
      };
    } catch (error) {
      return {
        success: false,
        message: `Ghostscript test failed: ${error.message}`,
        instructions: this.getInstallationInstructions(),
      };
    }
  }
}

module.exports = new ProfessionalCompressionService();
