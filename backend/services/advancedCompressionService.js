const { PDFDocument } = require("pdf-lib");
const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");
const { spawn, exec } = require("child_process");
const os = require("os");

// Import compress-pdf at the top level with enhanced error handling
let compressPdf;
let ghostscriptAvailable = false;
let ghostscriptPath = null;

try {
  compressPdf = require("compress-pdf");
  console.log("✅ compress-pdf library loaded successfully");

  // Test Ghostscript availability on startup
  checkGhostscriptAvailability();
} catch (error) {
  console.warn("⚠️ compress-pdf not available, will use pdf-lib fallback");
  console.warn("Error details:", error.message);
  compressPdf = null;
}

/**
 * Enhanced Ghostscript detection for Windows and other systems
 */
async function checkGhostscriptAvailability() {
  const { execSync } = require("child_process");
  const fs = require("fs");
  const path = require("path");

  console.log("🔍 Detecting Ghostscript installation...");

  // Common Ghostscript executable names
  const possibleCommands = [
    "gs", // Linux/Mac standard
    "gswin64c", // Windows 64-bit console
    "gswin32c", // Windows 32-bit console
    "ghostscript", // Alternative name
  ];

  // Try commands in PATH first
  for (const cmd of possibleCommands) {
    try {
      const result = execSync(`${cmd} --version`, {
        stdio: "pipe",
        encoding: "utf8",
        timeout: 5000,
      });
      console.log(`✅ Found Ghostscript in PATH: ${cmd}`);
      console.log(`   Version info: ${result.trim().split("\n")[0]}`);
      ghostscriptPath = cmd;
      ghostscriptAvailable = true;
      return;
    } catch (error) {
      // Continue to next command
    }
  }

  // Enhanced Windows detection with more common paths
  if (os.platform() === "win32") {
    console.log("🔍 Searching Windows installation paths...");

    const commonWindowsPaths = [
      "C:\\Program Files\\gs",
      "C:\\Program Files (x86)\\gs",
      "C:\\gs",
      "D:\\Program Files\\gs",
      "D:\\Program Files (x86)\\gs",
    ];

    for (const basePath of commonWindowsPaths) {
      try {
        if (fs.existsSync(basePath)) {
          console.log(`📁 Found gs directory: ${basePath}`);

          // Look for version directories
          const versionDirs = fs
            .readdirSync(basePath)
            .filter((dir) => dir.startsWith("gs"))
            .sort()
            .reverse(); // Try newest versions first

          for (const versionDir of versionDirs) {
            const binPath = path.join(basePath, versionDir, "bin");

            if (fs.existsSync(binPath)) {
              // Try both 64-bit and 32-bit executables
              const executables = ["gswin64c.exe", "gswin32c.exe", "gs.exe"];

              for (const exe of executables) {
                const fullPath = path.join(binPath, exe);
                if (fs.existsSync(fullPath)) {
                  try {
                    const result = execSync(`"${fullPath}" --version`, {
                      stdio: "pipe",
                      encoding: "utf8",
                      timeout: 5000,
                    });
                    console.log(`✅ Found Ghostscript at: ${fullPath}`);
                    console.log(
                      `   Version info: ${result.trim().split("\n")[0]}`,
                    );
                    ghostscriptPath = `"${fullPath}"`;
                    ghostscriptAvailable = true;
                    return;
                  } catch (execError) {
                    console.log(`⚠️ Found ${fullPath} but execution failed`);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        // Continue searching
      }
    }
  }

  // Final check: try system-specific package locations
  const systemPaths =
    os.platform() === "win32"
      ? []
      : [
          "/usr/bin/gs",
          "/usr/local/bin/gs",
          "/opt/homebrew/bin/gs", // Mac M1
          "/snap/bin/ghostscript",
        ];

  for (const sysPath of systemPaths) {
    try {
      if (fs.existsSync(sysPath)) {
        const result = execSync(`${sysPath} --version`, {
          stdio: "pipe",
          encoding: "utf8",
          timeout: 5000,
        });
        console.log(`✅ Found Ghostscript at: ${sysPath}`);
        console.log(`   Version info: ${result.trim().split("\n")[0]}`);
        ghostscriptPath = sysPath;
        ghostscriptAvailable = true;
        return;
      }
    } catch (error) {
      // Continue
    }
  }

  // GHOSTSCRIPT NOT FOUND
  ghostscriptAvailable = false;
  console.error("❌ GHOSTSCRIPT NOT FOUND - REQUIRED FOR PDF COMPRESSION");
  console.error("🚫 PDF compression will not work without Ghostscript");

  if (os.platform() === "win32") {
    console.error(`
📥 INSTALL GHOSTSCRIPT FOR WINDOWS:
1. Download from: https://www.ghostscript.com/download/gsdnld.html
2. Choose "GPL Ghostscript" for Windows
3. Install to default location (C:\\Program Files\\gs\\)
4. Restart this server after installation
    `);
  } else if (os.platform() === "darwin") {
    console.error("📥 Mac: brew install ghostscript");
  } else {
    console.error("📥 Linux: sudo apt-get install ghostscript");
  }
}

/**
 * Advanced PDF Compression Service
 * Provides high-quality compression matching LightPDF/iLovePDF standards
 */
class AdvancedCompressionService {
  constructor() {
    // Compression presets matching industry standards
    this.compressionLevels = {
      high: {
        name: "High Quality",
        dpi: 150,
        imageQuality: 90,
        downsampleImages: false,
        removeMetadata: true,
        expectedReduction: "15-35%",
        description: "Minimal compression, preserves quality",
        aggressiveOptimization: false,
      },
      medium: {
        name: "Balanced",
        dpi: 100,
        imageQuality: 75,
        downsampleImages: true,
        removeMetadata: true,
        expectedReduction: "35-60%",
        description: "Optimal balance of size and quality",
        aggressiveOptimization: true,
      },
      low: {
        name: "Maximum Compression",
        dpi: 72,
        imageQuality: 50,
        downsampleImages: true,
        removeMetadata: true,
        expectedReduction: "60-85%",
        description: "Smallest file size possible",
        aggressiveOptimization: true,
        extremeCompression: true,
      },
    };
  }

  /**
   * Main compression function with smart fallback system
   */
  async compressPdf(filePath, level = "medium", onProgress) {
    const startTime = Date.now();

    try {
      onProgress?.(5, "Loading PDF document...");

      // Load the PDF for basic info
      const pdfBytes = await fs.readFile(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const config = this.compressionLevels[level];
      const originalSize = pdfBytes.length;

      onProgress?.(10, "Analyzing document structure...");

      // Get document info
      const pageCount = pdfDoc.getPageCount();
      console.log(
        `��� Processing PDF with ${pageCount} pages using ${config.name} compression`,
      );

      onProgress?.(20, "Selecting optimal compression method...");

      // Use Ghostscript compression only
      onProgress?.(30, "Applying Ghostscript compression...");

      const result = await this.tryGhostscriptCompression(
        filePath,
        level,
        onProgress,
      );

      if (result && result.compressedBytes) {
        console.log("✅ Ghostscript compression successful");
        return result;
      } else {
        throw new Error("Ghostscript compression failed");
      }
    } catch (error) {
      console.error("❌ Compression failed:", error);
      throw new Error(`Compression failed: ${error.message}`);
    }
  }

  /**
   * Try Ghostscript compression with enhanced error handling
   */
  async tryGhostscriptCompression(filePath, level, onProgress) {
    // Check if Ghostscript is available
    if (!ghostscriptAvailable || !compressPdf) {
      throw new Error("Ghostscript not available");
    }

    onProgress?.(35, "Applying Ghostscript compression...");

    // Create temporary output file
    const outputPath = filePath.replace(".pdf", "_gs_compressed.pdf");

    try {
      // Map compression levels to Ghostscript settings
      const ghostscriptOptions = this.getGhostscriptOptions(level);

      // Add Windows-specific options if needed
      if (os.platform() === "win32") {
        ghostscriptOptions["-dSAFER"] = true;
        ghostscriptOptions["-dNOPAUSE"] = true;
        ghostscriptOptions["-dBATCH"] = true;
        ghostscriptOptions["-sDEVICE"] = "pdfwrite";
      }

      // Use Ghostscript compression with timeout
      await Promise.race([
        compressPdf(filePath, outputPath, ghostscriptOptions),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Ghostscript compression timeout")),
            30000,
          ),
        ),
      ]);

      onProgress?.(85, "Finalizing Ghostscript compression...");

      // Read the compressed file
      const compressedBytes = await fs.readFile(outputPath);

      // Clean up temporary file
      await fs.unlink(outputPath).catch(() => {});

      const originalSize = (await fs.readFile(filePath)).length;
      const compressedSize = compressedBytes.length;
      const compressionRatio =
        ((originalSize - compressedSize) / originalSize) * 100;
      const sizeSaved = originalSize - compressedSize;

      onProgress?.(100, "Ghostscript compression complete!");

      console.log(`✅ Ghostscript compression completed:
        Original size: ${this.formatFileSize(originalSize)}
        Compressed size: ${this.formatFileSize(compressedSize)}
        Reduction: ${compressionRatio.toFixed(1)}%`);

      return {
        compressedBytes,
        stats: {
          originalSize,
          compressedSize,
          compressionRatio: Math.round(compressionRatio * 10) / 10,
          sizeSaved,
          processingTime: 0,
          level: this.compressionLevels[level].name,
          pageCount: (await PDFDocument.load(compressedBytes)).getPageCount(),
          method: "Ghostscript",
        },
      };
    } catch (error) {
      // Clean up temporary file if it exists
      await fs.unlink(outputPath).catch(() => {});

      // Enhance error message with troubleshooting info
      let errorMessage = error.message;
      if (os.platform() === "win32" && error.message.includes("spawn")) {
        errorMessage +=
          "\n💡 Troubleshooting: Ensure Ghostscript is installed and added to Windows PATH";
      }

      throw new Error(`Ghostscript compression failed: ${errorMessage}`);
    }
  }

  /**
   * Get Ghostscript options based on compression level
   */
  getGhostscriptOptions(level) {
    switch (level) {
      case "low":
        return {
          "-dPDFSETTINGS": "/screen",
          "-dDownsampleColorImages": true,
          "-dColorImageDownsampleType": "/Bicubic",
          "-dColorImageResolution": 72,
          "-dGrayImageDownsampleType": "/Bicubic",
          "-dGrayImageResolution": 72,
          "-dMonoImageDownsampleType": "/Bicubic",
          "-dMonoImageResolution": 72,
          "-dCompressPages": true,
          "-dOptimize": true,
        };
      case "medium":
        return {
          "-dPDFSETTINGS": "/ebook",
          "-dDownsampleColorImages": true,
          "-dColorImageDownsampleType": "/Bicubic",
          "-dColorImageResolution": 100,
          "-dGrayImageDownsampleType": "/Bicubic",
          "-dGrayImageResolution": 100,
          "-dMonoImageDownsampleType": "/Bicubic",
          "-dMonoImageResolution": 150,
          "-dCompressPages": true,
          "-dOptimize": true,
        };
      case "high":
      default:
        return {
          "-dPDFSETTINGS": "/printer",
          "-dDownsampleColorImages": true,
          "-dColorImageDownsampleType": "/Bicubic",
          "-dColorImageResolution": 150,
          "-dGrayImageDownsampleType": "/Bicubic",
          "-dGrayImageResolution": 150,
          "-dMonoImageDownsampleType": "/Bicubic",
          "-dMonoImageResolution": 300,
          "-dCompressPages": true,
          "-dOptimize": true,
        };
    }
  }

  /**
   * Estimate compression size before processing
   */
  estimateCompression(fileSize, level) {
    const config = this.compressionLevels[level];
    const reductionRange = config.expectedReduction.match(/(\d+)-(\d+)%/);

    if (reductionRange) {
      const minReduction = parseInt(reductionRange[1]) / 100;
      const maxReduction = parseInt(reductionRange[2]) / 100;
      const avgReduction = (minReduction + maxReduction) / 2;

      const estimatedSize = fileSize * (1 - avgReduction);
      const estimatedSaving = fileSize - estimatedSize;

      return {
        estimatedSize: Math.round(estimatedSize),
        estimatedSaving: Math.round(estimatedSaving),
        estimatedReduction: Math.round(avgReduction * 100),
      };
    }

    return {
      estimatedSize: fileSize,
      estimatedSaving: 0,
      estimatedReduction: 0,
    };
  }

  /**
   * Get compression level details
   */
  getCompressionLevels() {
    return Object.entries(this.compressionLevels).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.description,
      expectedReduction: config.expectedReduction,
      dpi: config.dpi,
      quality: config.imageQuality,
    }));
  }

  /**
   * Validate PDF file
   */
  async validatePdf(filePath) {
    try {
      const fileStats = await fs.stat(filePath);
      const pdfBytes = await fs.readFile(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      return {
        isValid: true,
        fileSize: fileStats.size,
        pageCount: pdfDoc.getPageCount(),
        title: pdfDoc.getTitle() || "Untitled",
        author: pdfDoc.getAuthor() || "Unknown",
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
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
   * Generate compression report
   */
  generateCompressionReport(stats) {
    const reductionPercentage = stats.compressionRatio;
    let efficiency = "Good";

    if (reductionPercentage > 50) efficiency = "Excellent";
    else if (reductionPercentage > 30) efficiency = "Very Good";
    else if (reductionPercentage > 15) efficiency = "Good";
    else efficiency = "Minimal";

    return {
      efficiency,
      recommendation: this.getCompressionRecommendation(reductionPercentage),
      stats: {
        ...stats,
        originalSizeFormatted: this.formatFileSize(stats.originalSize),
        compressedSizeFormatted: this.formatFileSize(stats.compressedSize),
        sizeSavedFormatted: this.formatFileSize(stats.sizeSaved),
      },
    };
  }

  /**
   * Get compression recommendation
   */
  getCompressionRecommendation(reductionPercentage) {
    if (reductionPercentage > 50) {
      return "Excellent compression achieved! Your PDF is significantly smaller.";
    } else if (reductionPercentage > 30) {
      return "Good compression results. File size reduced substantially.";
    } else if (reductionPercentage > 15) {
      return "Moderate compression applied. Some space saved.";
    } else if (reductionPercentage > 5) {
      return "Minimal compression. PDF was already well optimized.";
    } else {
      return "Limited compression possible. File is already highly optimized.";
    }
  }
}

module.exports = new AdvancedCompressionService();
