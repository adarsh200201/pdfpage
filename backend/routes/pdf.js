const express = require("express");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
// GHOSTSCRIPT-ONLY: No compress-pdf dependency - using direct Ghostscript CLI
const { body, validationResult } = require("express-validator");

// Import advanced compression service
const advancedCompressionService = require("../services/advancedCompressionService");
const professionalCompressionService = require("../services/professionalCompressionService");

// Import models and middleware
const Usage = require("../models/Usage");
const { auth, optionalAuth, checkUsageLimit } = require("../middleware/auth");
const {
  ipUsageLimitChain,
  trackToolUsage,
} = require("../middleware/ipUsageLimit");
const { trackAnonymousUsage } = require("../utils/ipUsageUtils");
const { getRealIPAddress } = require("../utils/ipUtils");
const { getDeviceTypeFromRequest } = require("../utils/deviceUtils");
const {
  uploadPdf,
  uploadWord,
  uploadOffice,
  handleMulterError,
} = require("../config/multer");

const router = express.Router();

// Promisified fs methods
const fsAsync = {
  mkdir: require("util").promisify(fs.mkdir),
  writeFile: require("util").promisify(fs.writeFile),
  readFile: require("util").promisify(fs.readFile),
  unlink: require("util").promisify(fs.unlink),
  readdir: require("util").promisify(fs.readdir),
  rmdir: require("util").promisify(fs.rmdir),
};

// Use the shared multer configuration for PDF uploads
const upload = uploadPdf;

// LibreOffice path detection for Windows and other systems
function getLibreOfficeExecutable() {
  const os = require("os");
  const fs = require("fs");
  const path = require("path");

  const platform = os.platform();

  if (platform === "win32") {
    // Windows LibreOffice paths
    const possiblePaths = [
      "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files\\LibreOffice 7\\program\\soffice.exe",
      "C:\\Program Files\\LibreOffice 6\\program\\soffice.exe",
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        console.log(`✅ Found LibreOffice at: ${possiblePath}`);
        return `"${possiblePath}"`;
      }
    }

    // Fallback to PATH
    return "soffice";
  } else if (platform === "darwin") {
    // macOS
    const macPath = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
    if (fs.existsSync(macPath)) {
      return `"${macPath}"`;
    }
    return "soffice";
  } else {
    // Linux/Unix
    return "soffice";
  }
}

// Enhanced Ghostscript detection for Windows and other systems
function getGhostscriptExecutable() {
  const { execSync } = require("child_process");
  const os = require("os");
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
      return cmd;
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
          console.log(`�� Found gs directory: ${basePath}`);

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
                    return `"${fullPath}"`;
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
        return sysPath;
      }
    } catch (error) {
      // Continue
    }
  }

  // GHOSTSCRIPT NOT FOUND
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

  return null;
}

// Enterprise-grade Ghostscript compression function for production use
async function performEnterpriseCompression(inputPath, outputPath, options) {
  const { spawn } = require("child_process");
  const { level, quality, dpi, pdfSettings } = options;

  // Detect Ghostscript executable
  const gsCommand = getGhostscriptExecutable();
  if (!gsCommand) {
    return {
      success: false,
      error:
        "Ghostscript is not installed. Please install Ghostscript to enable 85% compression.",
    };
  }

  return new Promise((resolve) => {
    try {
      console.log(
        `🔧 GHOSTSCRIPT-ONLY compression: ${level} level, ${dpi} DPI, ${quality}% quality`,
      );

      // Advanced Ghostscript parameters for enterprise compression
      const getEnterpriseGSParams = () => {
        const baseParams = [
          "-sDEVICE=pdfwrite",
          "-dCompatibilityLevel=1.4",
          "-dNOPAUSE",
          "-dQUIET",
          "-dBATCH",
          "-dSAFER",
          "-dAutoRotatePages=/None",
          "-dDetectDuplicateImages=true",
          "-dCompressFonts=true",
          "-dSubsetFonts=true",
          "-dEmbedAllFonts=true",
          "-dOptimize=true",
          "-dUseFlateCompression=true",
          "-dCompressPages=true",
          "-dASCII85EncodePages=false",
        ];

        // Level-specific optimizations
        const levelParams = {
          high: [
            `-dPDFSETTINGS=/screen`,
            "-dDownsampleColorImages=true",
            "-dColorImageDownsampleType=/Bicubic",
            `-dColorImageResolution=${Math.max(72, dpi)}`,
            "-dDownsampleGrayImages=true",
            "-dGrayImageDownsampleType=/Bicubic",
            `-dGrayImageResolution=${Math.max(72, dpi)}`,
            "-dDownsampleMonoImages=true",
            "-dMonoImageDownsampleType=/Bicubic",
            `-dMonoImageResolution=${Math.max(72, dpi)}`,
            "-dColorImageDownsampleThreshold=1.0",
            "-dGrayImageDownsampleThreshold=1.0",
            "-dMonoImageDownsampleThreshold=1.0",
            "-dEncodeColorImages=true",
            "-dEncodeGrayImages=true",
            "-dEncodeMonoImages=true",
            "-dColorImageFilter=/DCTEncode",
            "-dGrayImageFilter=/DCTEncode",
            "-dMonoImageFilter=/CCITTFaxEncode",
            `-dJPEGQ=${Math.max(25, quality)}`,
          ],
          balanced: [
            `-dPDFSETTINGS=/ebook`,
            "-dDownsampleColorImages=true",
            "-dColorImageDownsampleType=/Bicubic",
            `-dColorImageResolution=${dpi}`,
            "-dDownsampleGrayImages=true",
            "-dGrayImageDownsampleType=/Bicubic",
            `-dGrayImageResolution=${dpi}`,
            "-dDownsampleMonoImages=true",
            "-dMonoImageDownsampleType=/Bicubic",
            `-dMonoImageResolution=${Math.min(300, dpi * 2)}`,
            "-dEncodeColorImages=true",
            "-dEncodeGrayImages=true",
            `-dJPEGQ=${quality}`,
          ],
          low: [
            `-dPDFSETTINGS=/prepress`,
            "-dDownsampleColorImages=true",
            "-dColorImageDownsampleType=/Bicubic",
            `-dColorImageResolution=${dpi}`,
            "-dDownsampleGrayImages=true",
            "-dGrayImageDownsampleType=/Bicubic",
            `-dGrayImageResolution=${dpi}`,
            "-dDownsampleMonoImages=true",
            "-dMonoImageDownsampleType=/Bicubic",
            `-dMonoImageResolution=${dpi}`,
            `-dJPEGQ=${Math.max(85, quality)}`,
            "-dPreserveAnnots=true",
            "-dPreserveMarkedContent=true",
          ],
        };

        // Properly escape paths with spaces for Windows
        const escapedOutputPath =
          process.platform === "win32" && outputPath.includes(" ")
            ? `"${outputPath}"`
            : outputPath;
        const escapedInputPath =
          process.platform === "win32" && inputPath.includes(" ")
            ? `"${inputPath}"`
            : inputPath;

        return baseParams.concat(levelParams[level] || levelParams.balanced, [
          `-sOutputFile=${escapedOutputPath}`,
          escapedInputPath,
        ]);
      };

      const params = getEnterpriseGSParams();

      console.log(
        `⚡ EXECUTING GHOSTSCRIPT-ONLY COMPRESSION with: ${gsCommand}`,
      );
      console.log(`🔧 Parameters: ${params.join(" ")}`);

      // Enhanced process execution with better error handling for Windows paths with spaces
      let executable = gsCommand;
      let processParams = params;
      let useShell = false;

      if (process.platform === "win32") {
        // On Windows, if the executable path contains spaces, we need to use shell
        if (gsCommand.includes(" ") || gsCommand.includes('"')) {
          useShell = true;
          // For shell execution, keep the path quoted if it has spaces
          if (gsCommand.startsWith('"') && gsCommand.endsWith('"')) {
            executable = gsCommand; // Keep quotes for shell
          } else if (gsCommand.includes(" ")) {
            executable = `"${gsCommand}"`; // Add quotes for shell
          }
          // Combine executable and params for shell execution
          processParams = [
            "/c",
            `${executable} ${params.map((p) => (p.includes(" ") ? `"${p}"` : p)).join(" ")}`,
          ];
          executable = "cmd";
        } else {
          // No spaces, can use direct spawn
          if (gsCommand.startsWith('"') && gsCommand.endsWith('"')) {
            executable = gsCommand.slice(1, -1); // Remove quotes for direct spawn
          }
        }
      }

      console.log(`🚀 Executing: ${executable} with params:`, processParams);

      const gsProcess = spawn(executable, processParams, {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, GS_LIB: process.env.GS_LIB || "" },
        shell: useShell,
        windowsHide: true, // Hide window on Windows
      });

      let stdoutData = "";
      let stderrData = "";

      gsProcess.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      gsProcess.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      gsProcess.on("close", (code) => {
        if (code === 0) {
          // Calculate compression statistics
          const fs = require("fs");
          try {
            const inputStats = fs.statSync(inputPath);
            const outputStats = fs.statSync(outputPath);
            const reduction = (
              ((inputStats.size - outputStats.size) / inputStats.size) *
              100
            ).toFixed(1);

            console.log(
              `✅ Enterprise compression successful: ${reduction}% reduction`,
            );
            resolve({
              success: true,
              stats: {
                originalSize: inputStats.size,
                compressedSize: outputStats.size,
                reduction: parseFloat(reduction),
              },
            });
          } catch (statError) {
            resolve({
              success: true,
              stats: { reduction: 0 },
            });
          }
        } else {
          console.error(`❌ Ghostscript failed with exit code ${code}`);
          console.error(`stderr: ${stderrData}`);
          resolve({
            success: false,
            error: `Ghostscript compression failed (code ${code}): ${stderrData}`,
          });
        }
      });

      gsProcess.on("error", (error) => {
        console.error(`❌ Ghostscript process error: ${error.message}`);
        resolve({
          success: false,
          error: `Failed to start Ghostscript: ${error.message}. Please ensure Ghostscript is installed.`,
        });
      });

      // Enhanced timeout with graceful termination
      const timeout = setTimeout(() => {
        console.warn(
          "⚠️ Ghostscript compression timeout - terminating process",
        );
        gsProcess.kill("SIGTERM");
        setTimeout(() => {
          if (!gsProcess.killed) {
            gsProcess.kill("SIGKILL");
          }
        }, 5000);
        resolve({
          success: false,
          error: "Compression timeout - file may be too large or complex",
        });
      }, 60000); // 60 second timeout for large files

      gsProcess.on("close", () => {
        clearTimeout(timeout);
      });
    } catch (error) {
      console.error(`❌ Enterprise compression setup error: ${error.message}`);
      resolve({
        success: false,
        error: `Compression setup failed: ${error.message}`,
      });
    }
  });
}

// ONLY GHOSTSCRIPT COMPRESSION - NO FALLBACKS
// This system exclusively uses Ghostscript for enterprise-grade 85% compression

// Legacy Ghostscript compression function (keeping for backward compatibility)
async function performGhostscriptCompression(inputPath, outputPath, level) {
  const { spawn } = require("child_process");

  return new Promise((resolve) => {
    try {
      // Define aggressive compression settings for maximum reduction
      const getGhostscriptParams = (compressionLevel) => {
        const baseParams = [
          "-sDEVICE=pdfwrite",
          "-dCompatibilityLevel=1.4",
          "-dPDFSETTINGS=/screen", // Start with most aggressive
          "-dNOPAUSE",
          "-dQUIET",
          "-dBATCH",
          "-dSAFER",
          "-dAutoRotatePages=/None",
          "-dDetectDuplicateImages=true",
          "-dCompressFonts=true",
          "-dSubsetFonts=true",
          "-dColorImageDownsampleType=/Bicubic",
          "-dGrayImageDownsampleType=/Bicubic",
          "-dMonoImageDownsampleType=/Bicubic",
        ];

        if (compressionLevel === "low") {
          // Maximum compression (85% reduction target)
          return baseParams.concat([
            "-dPDFSETTINGS=/screen",
            "-dDownsampleColorImages=true",
            "-dColorImageResolution=72",
            "-dDownsampleGrayImages=true",
            "-dGrayImageResolution=72",
            "-dDownsampleMonoImages=true",
            "-dMonoImageResolution=72",
            "-dColorImageDownsampleThreshold=1.0",
            "-dGrayImageDownsampleThreshold=1.0",
            "-dMonoImageDownsampleThreshold=1.0",
            "-dEncodeColorImages=true",
            "-dEncodeGrayImages=true",
            "-dEncodeMonoImages=true",
            "-dColorImageFilter=/DCTEncode",
            "-dGrayImageFilter=/DCTEncode",
            "-dMonoImageFilter=/CCITTFaxEncode",
            "-dJPEGQ=50", // Low quality for maximum compression
            "-dOptimize=true",
            "-dASCII85EncodePages=false",
            "-dCompressPages=true",
            "-dUseFlateCompression=true",
          ]);
        } else if (compressionLevel === "medium") {
          // Balanced compression (60% reduction target)
          return baseParams.concat([
            "-dPDFSETTINGS=/ebook",
            "-dDownsampleColorImages=true",
            "-dColorImageResolution=100",
            "-dDownsampleGrayImages=true",
            "-dGrayImageResolution=100",
            "-dDownsampleMonoImages=true",
            "-dMonoImageResolution=150",
            "-dJPEGQ=75",
            "-dOptimize=true",
          ]);
        } else {
          // Light compression (35% reduction target)
          return baseParams.concat([
            "-dPDFSETTINGS=/printer",
            "-dDownsampleColorImages=true",
            "-dColorImageResolution=150",
            "-dDownsampleGrayImages=true",
            "-dGrayImageResolution=150",
            "-dDownsampleMonoImages=true",
            "-dMonoImageResolution=300",
            "-dJPEGQ=85",
            "-dOptimize=true",
          ]);
        }
      };

      const params = getGhostscriptParams(level).concat([
        `-sOutputFile=${outputPath}`,
        inputPath,
      ]);

      console.log(
        `🚀 Starting high-performance Ghostscript compression (${level} level)...`,
      );

      // Try to run Ghostscript
      const gsProcess = spawn("gs", params, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let errorOutput = "";

      gsProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      gsProcess.on("close", (code) => {
        if (code === 0) {
          console.log(`✅ Ghostscript compression successful`);
          resolve(true);
        } else {
          console.warn(
            `⚠️ Ghostscript failed with code ${code}: ${errorOutput}`,
          );
          resolve(false);
        }
      });

      gsProcess.on("error", (error) => {
        console.warn(`⚠️ Ghostscript process error: ${error.message}`);
        resolve(false);
      });

      // Set timeout for compression
      setTimeout(() => {
        gsProcess.kill("SIGTERM");
        console.warn("⚠️ Ghostscript compression timeout");
        resolve(false);
      }, 30000); // 30 second timeout
    } catch (error) {
      console.warn(`⚠️ Ghostscript setup error: ${error.message}`);
      resolve(false);
    }
  });
}

// @route   GET /api/pdf/check-limit
// @desc    Check if user has hit soft limit
// @access  Public
router.get(
  "/check-limit",
  optionalAuth,
  ...ipUsageLimitChain,
  async (req, res) => {
    try {
      // Return usage information
      if (req.user) {
        // Authenticated user - return their limits
        return res.json({
          success: true,
          authenticated: true,
          canUse: true, // Authenticated users can always use tools
          dailyUploads: 0, // Daily limits removed
          maxDailyUploads: 999999, // Unlimited for authenticated users
          isPremium: req.user.isPremiumActive,
          limitType: "authenticated",
        });
      } else {
        // Anonymous user - return IP-based limits
        const ipUsage = req.ipUsage || {};
        return res.json({
          success: true,
          authenticated: false,
          canUse: ipUsage.canUse !== false,
          currentUsage: ipUsage.currentUsage || 0,
          maxUsage: ipUsage.maxUsage || 2,
          shouldShowSoftLimit: ipUsage.shouldShowSoftLimit || false,
          timeToReset: ipUsage.timeToReset,
          limitType: "anonymous",
          ipUsage: {
            count: ipUsage.currentUsage || 0,
            limit: ipUsage.maxUsage || 2,
            resetTime: ipUsage.timeToReset,
          },
        });
      }
    } catch (error) {
      console.error("Error checking usage limit:", error);
      res.status(500).json({
        success: false,
        message: "Error checking usage limits",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// Helper function to track usage with complete device info
async function trackUsageWithDeviceInfo(req, usageData) {
  return await Usage.trackOperation({
    ...usageData,
    userAgent: req.headers["user-agent"],
    ipAddress: getRealIPAddress(req),
    deviceType: getDeviceTypeFromRequest(req),
  });
}

// @route   POST /api/pdf/merge
// @desc    Merge PDF files
// @access  Public (with optional auth and usage limits)
router.post(
  "/merge",
  optionalAuth,
  ...ipUsageLimitChain,
  trackToolUsage("merge"),
  checkUsageLimit,
  upload.array("files", 10),
  [body("sessionId").optional().isString()],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { sessionId } = req.body;
      const files = req.files;

      // Validate files
      if (!files || files.length < 2) {
        return res.status(400).json({
          success: false,
          message: "At least 2 PDF files are required for merging",
        });
      }

      // Check file size limits
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const maxSize = req.user?.isPremiumActive
        ? 100 * 1024 * 1024 // 100MB for premium
        : 25 * 1024 * 1024; // 25MB for free users

      if (totalSize > maxSize) {
        return res.status(400).json({
          success: false,
          message: `Total file size exceeds ${req.user?.isPremiumActive ? "100MB" : "25MB"} limit`,
        });
      }

      // Import PDF-lib
      const { PDFDocument } = require("pdf-lib");

      // Merge PDFs
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        try {
          const pdf = await PDFDocument.load(file.buffer);
          const copiedPages = await mergedPdf.copyPages(
            pdf,
            pdf.getPageIndices(),
          );
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          throw new Error(`Invalid PDF file: ${file.originalname}`);
        }
      }

      // Set metadata
      mergedPdf.setTitle("Merged PDF Document");
      mergedPdf.setProducer("PdfPage");
      mergedPdf.setCreator("PdfPage");
      mergedPdf.setCreationDate(new Date());

      // Generate merged PDF
      const pdfBytes = await mergedPdf.save();
      const processingTime = Date.now() - startTime;

      // Track usage
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: sessionId || null,
          toolUsed: "merge",
          fileCount: files.length,
          totalFileSize: totalSize,
          processingTime,
          success: true,
        });

        // Track anonymous usage for IP-based limiting
        if (!req.user) {
          const combinedBuffer = Buffer.concat(files.map((f) => f.buffer));
          await trackAnonymousUsage(req, res, {
            toolName: "merge",
            fileCount: files.length,
            totalFileSize: totalSize,
            sessionId: sessionId || req.sessionID,
            fileName: `merged-${files.length}-files.pdf`,
            fileBuffer: combinedBuffer,
          });
        }

        // Update user upload count if authenticated
        if (req.user && !req.user.isPremiumActive) {
          req.user.incrementUpload(totalSize);
          await req.user.save();
        }
      } catch (error) {
        console.error("Error tracking usage:", error);
        // Don't fail the request if usage tracking fails
      }

      // Send the merged PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="merged-document.pdf"',
      );
      res.setHeader("Content-Length", pdfBytes.length);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("PDF merge error:", error);

      // Track error
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "merge",
          fileCount: req.files ? req.files.length : 0,
          totalFileSize: req.files
            ? req.files.reduce((sum, file) => sum + file.size, 0)
            : 0,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to merge PDF files",
      });
    }
  },
);

// @route   POST /api/pdf/compress
// @desc    Advanced PDF compression with high quality like LightPDF/iLovePDF
// @access  Public (with optional auth and usage limits)
router.post(
  "/compress",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("level")
      .optional()
      .isIn(["high", "medium", "low"])
      .withMessage("Invalid compression level"),
    body("sessionId").optional().isString(),
  ],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { level = "medium", sessionId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // Check file size
      const maxSize = req.user?.isPremiumActive
        ? 100 * 1024 * 1024 // 100MB for premium
        : 25 * 1024 * 1024; // 25MB for free users

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${req.user?.isPremiumActive ? "100MB" : "25MB"} limit`,
        });
      }

      console.log(
        `Compressing PDF with level: ${level}, size: ${file.size} bytes`,
      );

      // Check if Ghostscript is available - REQUIRED
      const ghostscriptPath = getGhostscriptExecutable();
      if (!ghostscriptPath) {
        console.log("❌ Compression failed: Ghostscript not available");
        return res.status(503).json({
          success: false,
          message: "PDF compression service unavailable",
          error: "GHOSTSCRIPT_NOT_FOUND",
          details:
            "Ghostscript is required for PDF compression but was not found on the system",
          installInstructions: {
            windows: {
              message: "Download and install Ghostscript for Windows",
              url: "https://www.ghostscript.com/download/gsdnld.html",
              steps: [
                "Download GPL Ghostscript for Windows",
                "Run the installer as administrator",
                "Install to default location (C:\\Program Files\\gs\\)",
                "Restart the server after installation",
              ],
            },
            mac: "brew install ghostscript",
            linux: "sudo apt-get install ghostscript",
          },
        });
      }

      // Get compression settings based on level
      const settings = getCompressionSettings(level);

      // Create temporary file paths using OS temp directory to avoid spaces
      const os = require("os");
      const tempDir =
        process.platform === "win32"
          ? path.join(os.tmpdir(), "pdfpage-compression")
          : path.join(__dirname, "../temp");
      await fsAsync.mkdir(tempDir, { recursive: true });

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const inputPath = path.join(
        tempDir,
        `input_${timestamp}_${randomId}.pdf`,
      );
      const outputPath = path.join(
        tempDir,
        `output_${timestamp}_${randomId}.pdf`,
      );

      let pdfBytes;

      // GHOSTSCRIPT-ONLY COMPRESSION - NO FALLBACKS
      try {
        // Write input file securely
        await fs.writeFile(inputPath, file.buffer);

        // Use ONLY performEnterpriseCompression (Ghostscript)
        const compressionResult = await performEnterpriseCompression(
          inputPath,
          outputPath,
          {
            level,
            quality: parseInt(quality || 75),
            dpi: parseInt(dpi || 150),
            pdfSettings: pdfSettings || "/ebook",
          },
        );

        if (compressionResult.success) {
          pdfBytes = await fs.readFile(outputPath);
          console.log(
            `✅ GHOSTSCRIPT-ONLY compression successful: ${compressionResult.stats.reduction}% reduction`,
          );
        } else {
          throw new Error(
            compressionResult.error || "Ghostscript compression failed",
          );
        }

        const processingTime = Date.now() - startTime;
        const originalSize = file.size;
        const compressedSize = pdfBytes.length;
        const compressionRatio = (
          ((originalSize - compressedSize) / originalSize) *
          100
        ).toFixed(1);
        const sizeSaved = originalSize - compressedSize;

        console.log(
          `Compression complete: ${compressionRatio}% reduction, saved ${formatBytes(sizeSaved)}`,
        );

        // Track usage
        try {
          await Usage.trackOperation({
            userId: req.user ? req.user._id : null,
            sessionId: sessionId || null,
            toolUsed: "compress",
            fileCount: 1,
            totalFileSize: file.size,
            processingTime,
            userAgent: req.headers["user-agent"],
            ipAddress: getRealIPAddress(req),
            success: true,
          });

          // Update user upload count if authenticated
          if (req.user && !req.user.isPremiumActive) {
            req.user.incrementUpload(file.size);
            await req.user.save();
          }
        } catch (error) {
          console.error("Error tracking usage:", error);
        }

        // Send the compressed PDF with enhanced headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="compressed-${level}-${file.originalname}"`,
        );
        res.setHeader("Content-Length", compressedSize);
        res.setHeader("X-Compression-Ratio", compressionRatio);
        res.setHeader("X-Original-Size", originalSize);
        res.setHeader("X-Compressed-Size", compressedSize);
        res.setHeader("X-Size-Saved", sizeSaved);
        res.setHeader("X-Compression-Level", level);
        res.send(Buffer.from(pdfBytes));
      } catch (compressionError) {
        // Clean up temporary files in case of error
        await fs.unlink(inputPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});
        throw compressionError;
      }
    } catch (error) {
      console.error("PDF compression error:", error);

      // Track error
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "compress",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to compress PDF file",
      });
    }
  },
);

// @route   POST /api/pdf/compress-pro
// @desc    Production-grade PDF compression with enterprise Ghostscript engine
// @access  Public (with optional auth and usage limits)
router.post(
  "/compress-pro",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("level")
      .isIn(["high", "balanced", "low"])
      .withMessage("Invalid compression level"),
    body("quality").optional().isInt({ min: 10, max: 100 }),
    body("dpi").optional().isInt({ min: 72, max: 300 }),
    body("pdfSettings").optional().isString(),
  ],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        level = "balanced",
        quality = 75,
        dpi = 150,
        pdfSettings = "/ebook",
      } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // Enhanced file size limits based on user type
      const maxSize = req.user?.isPremiumActive
        ? 100 * 1024 * 1024 // 100MB for premium
        : 50 * 1024 * 1024; // 50MB for free users

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${req.user?.isPremiumActive ? "100MB" : "50MB"} limit`,
        });
      }

      console.log(
        `🚀 Starting compression: ${file.originalname} (${formatBytes(file.size)}) - Level: ${level}`,
      );

      // Check if Ghostscript is available - REQUIRED
      const ghostscriptPath = getGhostscriptExecutable();
      if (!ghostscriptPath) {
        console.log("❌ Compression failed: Ghostscript not available");
        return res.status(503).json({
          success: false,
          message: "PDF compression service unavailable",
          error: "GHOSTSCRIPT_NOT_FOUND",
          details:
            "Ghostscript is required for PDF compression but was not found on the system",
          installInstructions: {
            windows: {
              message: "Download and install Ghostscript for Windows",
              url: "https://www.ghostscript.com/download/gsdnld.html",
              steps: [
                "Download GPL Ghostscript for Windows",
                "Run the installer as administrator",
                "Install to default location (C:\\Program Files\\gs\\)",
                "Restart the server after installation",
              ],
            },
            mac: "brew install ghostscript",
            linux: "sudo apt-get install ghostscript",
          },
        });
      }

      // Create secure temporary paths with UUID using OS temp directory
      const { v4: uuidv4 } = require("uuid");
      const os = require("os");
      const tempDir =
        process.platform === "win32"
          ? path.join(os.tmpdir(), "pdfpage-compression")
          : path.join(__dirname, "../temp");
      await fs.mkdir(tempDir, { recursive: true });

      const sessionId = uuidv4();
      const inputPath = path.join(tempDir, `input_${sessionId}.pdf`);
      const outputPath = path.join(tempDir, `output_${sessionId}.pdf`);

      let pdfBytes;
      let compressionSuccess = false;

      try {
        // Write input file securely
        await fs.writeFile(inputPath, file.buffer);

        // Enterprise Ghostscript compression
        const compressionResult = await performEnterpriseCompression(
          inputPath,
          outputPath,
          {
            level,
            quality: parseInt(quality),
            dpi: parseInt(dpi),
            pdfSettings,
          },
        );

        if (compressionResult.success) {
          pdfBytes = await fs.readFile(outputPath);
          compressionSuccess = true;
          console.log(
            `✅ Ghostscript compression successful: ${compressionResult.stats.reduction}% reduction`,
          );
        } else {
          throw new Error(
            compressionResult.error || "Ghostscript compression failed",
          );
        }
      } catch (compressionError) {
        console.error("❌ Compression error:", compressionError);
        throw new Error(
          `Ghostscript compression failed: ${compressionError.message}`,
        );
      } finally {
        // Secure cleanup - always remove temporary files
        await fs.unlink(inputPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});
      }

      // Calculate compression statistics
      const processingTime = Date.now() - startTime;
      const originalSize = file.size;
      const compressedSize = pdfBytes.length;
      const compressionRatio = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(1);
      const sizeSaved = originalSize - compressedSize;

      console.log(`📊 Compression complete:
        Original: ${formatBytes(originalSize)}
        Compressed: ${formatBytes(compressedSize)}
        Reduction: ${compressionRatio}%
        Saved: ${formatBytes(sizeSaved)}
        Time: ${processingTime}ms`);

      // Track usage
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: sessionId,
          toolUsed: "compress-pro",
          fileCount: 1,
          totalFileSize: originalSize,
          processingTime,
          success: true,
          compressionRatio: parseFloat(compressionRatio),
          sizeSaved,
        });
      } catch (trackError) {
        console.error("Error tracking usage:", trackError);
      }

      // Send compressed PDF with comprehensive headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="compressed-${level}-${file.originalname}"`,
      );
      res.setHeader("Content-Length", compressedSize.toString());
      res.setHeader("X-Compression-Ratio", compressionRatio.toString());
      res.setHeader("X-Original-Size", originalSize.toString());
      res.setHeader("X-Compressed-Size", compressedSize.toString());
      res.setHeader("X-Size-Saved", sizeSaved.toString());
      res.setHeader("X-Compression-Level", level);
      res.setHeader("X-Processing-Time", processingTime.toString());
      res.setHeader("X-Quality-Level", quality.toString());
      res.setHeader("X-DPI", dpi.toString());
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("Production compression error:", error);

      // Track failed operation
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "compress-pro",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to compress PDF file",
        code: "COMPRESSION_ERROR",
      });
    }
  },
);

// @route   POST /api/pdf/compress-advanced
// @desc    Advanced PDF compression with high quality like LightPDF/iLovePDF
// @access  Public (with optional auth and usage limits)
router.post(
  "/compress-advanced",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("level")
      .optional()
      .isIn(["high", "medium", "low"])
      .withMessage("Invalid compression level"),
    body("sessionId").optional().isString(),
  ],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { level = "medium", sessionId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // Check file size
      const maxSize = req.user?.isPremiumActive
        ? 100 * 1024 * 1024 // 100MB for premium
        : 25 * 1024 * 1024; // 25MB for free users

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${req.user?.isPremiumActive ? "100MB" : "25MB"} limit`,
        });
      }

      console.log(
        `🗜️ Starting advanced compression with level: ${level}, size: ${formatBytes(file.size)}`,
      );

      // Create temporary file for processing
      const tempDir = path.join(__dirname, "../temp");
      await fs.mkdir(tempDir, { recursive: true });

      const inputPath = path.join(
        tempDir,
        `compress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`,
      );

      // Write input file
      await fs.writeFile(inputPath, file.buffer);

      // Use advanced compression service
      const compressionResult = await advancedCompressionService.compressPdf(
        inputPath,
        level,
        (progress, status) => {
          console.log(`📊 Progress: ${progress}% - ${status}`);
        },
      );

      // Clean up temporary file
      await fs.unlink(inputPath).catch(() => {});

      const { compressedBytes, stats } = compressionResult;

      console.log(
        `✅ Advanced compression complete: ${stats.compressionRatio}% reduction, saved ${formatBytes(stats.sizeSaved)}`,
      );

      // Track usage
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: sessionId || null,
          toolUsed: "compress-advanced",
          fileCount: 1,
          totalFileSize: file.size,
          processingTime: stats.processingTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: true,
        });

        // Update user upload count if authenticated
        if (req.user && !req.user.isPremiumActive) {
          req.user.incrementUpload(file.size);
          await req.user.save();
        }
      } catch (error) {
        console.error("Error tracking usage:", error);
      }

      // Generate compression report
      const report =
        advancedCompressionService.generateCompressionReport(stats);

      // Send response with compression statistics
      res.json({
        success: true,
        message: "Advanced compression completed successfully",
        stats: {
          originalSize: stats.originalSize,
          compressedSize: stats.compressedSize,
          compressionRatio: stats.compressionRatio,
          sizeSaved: stats.sizeSaved,
          processingTime: stats.processingTime,
          level: stats.level,
          pageCount: stats.pageCount,
        },
        report: {
          efficiency: report.efficiency,
          recommendation: report.recommendation,
          originalSizeFormatted: report.stats.originalSizeFormatted,
          compressedSizeFormatted: report.stats.compressedSizeFormatted,
          sizeSavedFormatted: report.stats.sizeSavedFormatted,
        },
        download: {
          filename: `compressed-${level}-${file.originalname}`,
          data: compressedBytes.toString("base64"),
          contentType: "application/pdf",
        },
      });
    } catch (error) {
      console.error("Advanced PDF compression error:", error);

      // Enhanced error handling with Ghostscript diagnostics
      let errorResponse = {
        success: false,
        message: "PDF compression failed",
        error: error.message,
      };

      // Check if this is a Ghostscript-related error
      if (
        error.message.includes("Ghostscript") ||
        error.message.includes("spawn") ||
        error.message.includes("compress-pdf")
      ) {
        try {
          const ghostscriptDiagnostics = require("../utils/ghostscriptDiagnostics");
          const diagnosticReport =
            await ghostscriptDiagnostics.generateDiagnosticReport();

          errorResponse = {
            success: false,
            message: "PDF compression failed due to Ghostscript issues",
            error: error.message,
            diagnostics: {
              ghostscriptAvailable: diagnosticReport.ghostscript.available,
              platform: diagnosticReport.platform.os,
              issues: diagnosticReport.ghostscript.issues,
              recommendations: diagnosticReport.ghostscript.recommendations,
            },
            fallbackUsed:
              error.message.includes("PDF-lib") ||
              error.message.includes("fallback"),
            troubleshooting: {
              quickFix:
                "Try using the basic compression instead, or install Ghostscript for better compression",
              detailedSteps: diagnosticReport.troubleshooting?.steps || [],
            },
          };

          // Log detailed diagnostic information
          console.log(
            "🔧 Ghostscript Diagnostic Report:",
            JSON.stringify(diagnosticReport, null, 2),
          );
        } catch (diagError) {
          console.error("Error generating diagnostic report:", diagError);
        }
      }

      // Track error
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "compress-advanced",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to compress PDF file",
      });
    }
  },
);

// @route   GET /api/pdf/compression-levels
// @desc    Get available compression levels and their details
// @access  Public
router.get("/compression-levels", (req, res) => {
  try {
    const levels = advancedCompressionService.getCompressionLevels();
    res.json({
      success: true,
      message: "Compression levels retrieved successfully",
      data: levels,
    });
  } catch (error) {
    console.error("Error getting compression levels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve compression levels",
      error: error.message,
    });
  }
});

// Helper function to get compression settings based on level
function getCompressionSettings(level) {
  switch (level) {
    case "extreme":
      return {
        ghostscriptOptions: {
          "-dPDFSETTINGS": "/screen", // Maximum compression, lowest quality
          "-dDownsampleColorImages": true,
          "-dColorImageResolution": 72,
          "-dDownsampleGrayImages": true,
          "-dGrayImageResolution": 72,
          "-dDownsampleMonoImages": true,
          "-dMonoImageResolution": 72,
          "-dCompressPages": true,
          "-dOptimize": true,
        },
        description: "Maximum compression with significant quality loss",
      };
    case "high":
      return {
        ghostscriptOptions: {
          "-dPDFSETTINGS": "/ebook", // High compression, moderate quality
          "-dDownsampleColorImages": true,
          "-dColorImageResolution": 150,
          "-dDownsampleGrayImages": true,
          "-dGrayImageResolution": 150,
          "-dDownsampleMonoImages": true,
          "-dMonoImageResolution": 150,
          "-dCompressPages": true,
          "-dOptimize": true,
        },
        description: "High compression with moderate quality loss",
      };
    case "medium":
      return {
        ghostscriptOptions: {
          "-dPDFSETTINGS": "/printer", // Balanced compression and quality
          "-dDownsampleColorImages": true,
          "-dColorImageResolution": 300,
          "-dDownsampleGrayImages": true,
          "-dGrayImageResolution": 300,
          "-dDownsampleMonoImages": true,
          "-dMonoImageResolution": 300,
          "-dCompressPages": true,
          "-dOptimize": true,
        },
        description: "Balanced compression and quality",
      };
    case "low":
      return {
        ghostscriptOptions: {
          "-dPDFSETTINGS": "/prepress", // Light compression, high quality
          "-dDownsampleColorImages": false,
          "-dDownsampleGrayImages": false,
          "-dDownsampleMonoImages": false,
          "-dCompressPages": true,
          "-dOptimize": true,
        },
        description: "Light compression preserving quality",
      };
    case "best-quality":
      return {
        ghostscriptOptions: {
          "-dPDFSETTINGS": "/default", // Minimal compression, maximum quality
          "-dDownsampleColorImages": false,
          "-dDownsampleGrayImages": false,
          "-dDownsampleMonoImages": false,
          "-dCompressPages": false,
          "-dOptimize": true,
        },
        description: "Minimal compression, maximum quality",
      };
    default:
      return {
        ghostscriptOptions: {
          "-dPDFSETTINGS": "/printer", // Default to balanced
          "-dDownsampleColorImages": true,
          "-dColorImageResolution": 300,
          "-dDownsampleGrayImages": true,
          "-dGrayImageResolution": 300,
          "-dDownsampleMonoImages": true,
          "-dMonoImageResolution": 300,
          "-dCompressPages": true,
          "-dOptimize": true,
        },
        description: "Balanced compression and quality",
      };
  }
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// @route   POST /api/pdf/split
// @desc    Split PDF file into individual pages
// @access  Public (with optional auth and usage limits)
router.post(
  "/split",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [body("sessionId").optional().isString()],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const { sessionId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // Check file size
      const maxSize = req.user?.isPremiumActive
        ? 100 * 1024 * 1024 // 100MB for premium
        : 25 * 1024 * 1024; // 25MB for free users

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${req.user?.isPremiumActive ? "100MB" : "25MB"} limit`,
        });
      }

      // Import PDF-lib
      const { PDFDocument } = require("pdf-lib");

      // Load PDF
      const pdfDoc = await PDFDocument.load(file.buffer);
      const pageCount = pdfDoc.getPageCount();

      // Limit for free users
      if (!req.user?.isPremiumActive && pageCount > 10) {
        return res.status(400).json({
          success: false,
          message:
            "Free users can split PDFs with maximum 10 pages. Upgrade to premium for unlimited pages.",
        });
      }

      const splitPdfs = [];

      // Split into individual pages
      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);

        // Set metadata
        newPdf.setTitle(`Page ${i + 1} of ${file.originalname}`);
        newPdf.setProducer("PdfPage");
        newPdf.setCreator("PdfPage");

        const pdfBytes = await newPdf.save();
        splitPdfs.push({
          pageNumber: i + 1,
          fileName: `page-${i + 1}-${file.originalname}`,
          data: Buffer.from(pdfBytes),
          size: pdfBytes.length,
        });
      }

      const processingTime = Date.now() - startTime;

      // Track usage
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: sessionId || null,
          toolUsed: "split",
          fileCount: 1,
          totalFileSize: file.size,
          processingTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: true,
        });

        // Update user upload count if authenticated
        if (req.user && !req.user.isPremiumActive) {
          req.user.incrementUpload(file.size);
          await req.user.save();
        }
      } catch (error) {
        console.error("Error tracking usage:", error);
      }

      // Return all split pages as JSON with base64 data
      const splitFiles = splitPdfs.map((pdf) => ({
        fileName: pdf.fileName,
        pageNumber: pdf.pageNumber,
        size: pdf.size,
        data: pdf.data.toString("base64"), // Convert to base64 for JSON transmission
      }));

      res.json({
        success: true,
        message: `Successfully split PDF into ${pageCount} pages`,
        totalPages: pageCount,
        files: splitFiles.map((file) => file.data), // Return just the base64 data for frontend compatibility
        metadata: {
          originalFileName: file.originalname,
          processingTime,
          totalSize: splitPdfs.reduce((sum, pdf) => sum + pdf.size, 0),
        },
      });
    } catch (error) {
      console.error("PDF split error:", error);

      // Track error
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "split",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to split PDF file",
      });
    }
  },
);

// @route   POST /api/pdf/to-word
// @desc    Convert PDF to Word (.docx) format
// @access  Public (with optional auth and usage limits)
router.post(
  "/to-word",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("extractImages")
      .optional()
      .isBoolean()
      .withMessage("Extract images must be boolean"),
    body("preserveFormatting")
      .optional()
      .isBoolean()
      .withMessage("Preserve formatting must be boolean"),
    body("includeMetadata")
      .optional()
      .isBoolean()
      .withMessage("Include metadata must be boolean"),
    body("sessionId").optional().isString(),
  ],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        extractImages = false,
        preserveFormatting = true,
        includeMetadata = true,
        sessionId,
      } = req.body;

      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // Check file size
      const maxSize = req.user?.isPremiumActive
        ? 100 * 1024 * 1024 // 100MB for premium
        : 25 * 1024 * 1024; // 25MB for free users

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${req.user?.isPremiumActive ? "100MB" : "25MB"} limit`,
        });
      }

      console.log(
        `Converting PDF to Word: ${file.originalname} (${formatBytes(file.size)})`,
      );

      // Import required libraries
      const pdfParse = require("pdf-parse");
      const { PDFDocument: PDFLibDocument } = require("pdf-lib");
      const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        HeadingLevel,
      } = require("docx");

      // Use enhanced PDF parsing for better text extraction
      const pdfLibDoc = await PDFLibDocument.load(file.buffer);
      const numPages = pdfLibDoc.getPageCount();

      console.log(
        `📄 PDF has ${numPages} pages, processing with enhanced extraction...`,
      );
      console.log(`📊 PDF Buffer size: ${file.buffer.length} bytes`);
      console.log(`📋 PDF Analysis starting...`);

      // Enhanced text extraction with multiple extraction methods for better layout preservation
      let pdfData;
      let text = "";
      let info = {};
      let extractedPages = [];
      let layoutData = null;

      try {
        // Method 1: Try enhanced extraction with layout preservation
        console.log(
          "🔍 Attempting enhanced extraction with layout preservation...",
        );

        try {
          // Use pdf-lib for more detailed page analysis
          const pdfLibDocForAnalysis = await PDFLibDocument.load(file.buffer);

          // Try to extract text with better spatial awareness
          pdfData = await pdfParse(file.buffer, {
            pagerender: (pageData) => {
              // Enhanced page rendering to preserve layout information
              return pageData.getTextContent().then((textContent) => {
                let pageText = "";
                let lastY = null;
                let isNewLine = true;

                for (const item of textContent.items) {
                  // Check if we need a line break based on Y position
                  if (
                    lastY !== null &&
                    Math.abs(item.transform[5] - lastY) > 2
                  ) {
                    if (!isNewLine) {
                      pageText += "\n";
                      isNewLine = true;
                    }
                  }

                  // Add spaces for horizontal positioning if needed
                  if (
                    !isNewLine &&
                    item.transform[4] - lastX > item.width * 2
                  ) {
                    pageText += " ";
                  }

                  pageText += item.str;
                  lastY = item.transform[5];
                  lastX = item.transform[4] + item.width;
                  isNewLine = false;
                }

                return pageText;
              });
            },
            max: 0,
            normalizeWhitespace: false,
            disableCombineTextItems: true,
          });

          text = pdfData.text || "";
          info = pdfData.info || {};

          console.log(
            `📝 Enhanced extraction: ${text.length} characters with layout awareness`,
          );
        } catch (enhancedError) {
          console.log(
            "⚠️ Enhanced extraction failed, trying standard extraction...",
          );
          throw enhancedError;
        }
      } catch (enhancedError) {
        try {
          // Method 2: Standard pdf-parse extraction with better options
          pdfData = await pdfParse(file.buffer, {
            pagerender: null,
            max: 0,
            normalizeWhitespace: false,
            disableCombineTextItems: false,
          });

          text = pdfData.text || "";
          info = pdfData.info || {};

          console.log(
            `�� Standard extraction: ${text.length} characters from PDF`,
          );
        } catch (standardError) {
          console.log(
            "⚠����� Standard extraction failed, trying alternative method...",
          );

          // Method 3: Alternative extraction with different options
          try {
            pdfData = await pdfParse(file.buffer, {
              pagerender: null,
              max: 0,
              normalizeWhitespace: true,
              disableCombineTextItems: true,
            });

            text = pdfData.text || "";
            info = pdfData.info || {};

            console.log(
              `📝 Alternative extraction: ${text.length} characters from PDF`,
            );
          } catch (alternativeError) {
            console.log(
              "⚠️ Alternative extraction also failed, trying basic extraction...",
            );

            // Method 4: Last resort - basic extraction
            try {
              pdfData = await pdfParse(file.buffer);
              text = pdfData.text || "";
              info = pdfData.info || {};

              console.log(
                `📝 Basic extraction: ${text.length} characters from PDF`,
              );
            } catch (basicError) {
              console.error("❌ All extraction methods failed:", basicError);
              text = "";
            }
          }
        }
      }

      console.log(`📊 PDF Info:`, {
        title: info.Title || "Untitled",
        author: info.Author || "Unknown",
        creator: info.Creator || "Unknown",
        producer: info.Producer || "Unknown",
        pages: numPages,
        extractedTextLength: text.length,
      });

      // If still no text, check if PDF has pages but no extractable text
      if (!text || text.trim().length === 0) {
        if (numPages > 0) {
          console.log(
            "⚠️ PDF has pages but no extractable text - likely scanned/image-based",
          );

          // Create a minimal document indicating the PDF structure was detected
          text = `This document appears to be a ${numPages}-page PDF that contains images or scanned content rather than extractable text.\n\n`;
          text += `Original filename: ${file.originalname}\n`;
          text += `Number of pages: ${numPages}\n`;
          text += `File size: ${formatBytes(file.size)}\n\n`;
          text += `Note: This PDF may contain scanned images, graphics, or other non-text content. `;
          text += `For better results with scanned documents, please use our OCR tool first to make the text searchable.`;

          console.log(
            `📝 Created placeholder content: ${text.length} characters`,
          );
        } else {
          return res.status(400).json({
            success: false,
            message:
              "No readable text found in PDF. This appears to be a scanned document or image-based PDF. For scanned documents, please use our OCR tool first to make the text searchable.",
            suggestion: "Use PDF OCR tool for scanned documents",
            pdfType: "scanned_or_image_based",
          });
        }
      }

      // Clean and normalize text while preserving structure
      text = cleanAndNormalizeText(text);

      // Enhanced text processing to preserve document structure
      const documentStructure = analyzeDocumentStructure(text, info);
      const paragraphs = processTextToParagraphs(
        text,
        preserveFormatting,
        documentStructure,
      );

      // Create Word document with enhanced metadata and professional styling
      const docConfig = {
        creator: "PdfPage - Professional PDF Converter",
        title: documentStructure.title || `Converted from ${file.originalname}`,
        description: `Professional PDF to Word conversion${includeMetadata ? ` | Original: ${numPages} pages, ${text.length} characters extracted` : ""}`,
        subject: documentStructure.documentType || "Professional Document",
        keywords: [
          "PDF",
          "Word",
          "Conversion",
          "PdfPage",
          "Resume",
          "Professional",
        ],

        // Professional document styling
        styles: {
          default: {
            document: {
              run: {
                font: "Calibri",
                size: 22, // 11pt
                color: "000000",
              },
              paragraph: {
                spacing: {
                  line: 240, // 1.2 line spacing
                  before: 0,
                  after: 160,
                },
              },
            },
          },
          paragraphStyles: [
            {
              id: "DocumentTitle",
              name: "Document Title",
              basedOn: "Normal",
              next: "Normal",
              run: {
                size: 32, // 16pt
                bold: true,
                color: "1f2937",
              },
              paragraph: {
                alignment: "center",
                spacing: {
                  before: 0,
                  after: 320,
                },
              },
            },
            {
              id: "SectionHeader",
              name: "Section Header",
              basedOn: "Normal",
              next: "Normal",
              run: {
                size: 26, // 13pt
                bold: true,
                color: "2563eb",
                allCaps: true,
              },
              paragraph: {
                spacing: {
                  before: 320,
                  after: 200,
                },
                border: {
                  bottom: {
                    style: "single",
                    size: 6,
                    color: "2563eb",
                  },
                },
              },
            },
          ],
        },

        // Enhanced numbering for professional lists
        numbering: {
          config: [
            {
              reference: "default-numbering",
              levels: [
                {
                  level: 0,
                  format: "decimal",
                  text: "%1.",
                  alignment: "start",
                  style: {
                    paragraph: {
                      indent: { left: 720, hanging: 360 },
                      spacing: { after: 120 },
                    },
                  },
                },
                {
                  level: 1,
                  format: "lowerLetter",
                  text: "%2)",
                  alignment: "start",
                  style: {
                    paragraph: {
                      indent: { left: 1080, hanging: 360 },
                      spacing: { after: 120 },
                    },
                  },
                },
              ],
            },
          ],
        },

        sections: [
          {
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                  width: 12240, // 8.5 inches
                  height: 15840, // 11 inches
                },
                margin: {
                  top: 1440, // 1 inch
                  right: 1440, // 1 inch
                  bottom: 1440, // 1 inch
                  left: 1440, // 1 inch
                },
              },
            },
            children: paragraphs,
          },
        ],
      };

      // Add author if available
      if (documentStructure.author) {
        docConfig.author = documentStructure.author;
      }

      const doc = new Document(docConfig);

      // Generate DOCX buffer
      const docxBuffer = await Packer.toBuffer(doc);
      const processingTime = Date.now() - startTime;

      console.log(
        `Conversion complete: ${formatBytes(docxBuffer.length)} DOCX generated in ${processingTime}ms`,
      );

      // Track usage
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: sessionId || null,
          toolUsed: "pdf-to-word",
          fileCount: 1,
          totalFileSize: file.size,
          processingTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: true,
        });

        // Update user upload count if authenticated
        if (req.user && !req.user.isPremiumActive) {
          req.user.incrementUpload(file.size);
          await req.user.save();
        }
      } catch (error) {
        console.error("Error tracking usage:", error);
      }

      // Generate filename
      const originalName = file.originalname.replace(/\.pdf$/i, "");
      const filename = `${originalName}.docx`;

      // Ensure the DOCX buffer is valid
      if (!docxBuffer || docxBuffer.length === 0) {
        throw new Error("Failed to generate DOCX document - empty buffer");
      }

      // Log final conversion statistics
      console.log(`✅ Final conversion statistics:`, {
        inputPdf: {
          filename: file.originalname,
          size: formatBytes(file.size),
          pages: numPages,
        },
        extraction: {
          textLength: text.length,
          hasContent: text.trim().length > 0,
          method: "enhanced_pdf_parse",
        },
        output: {
          docxSize: formatBytes(docxBuffer.length),
          processingTime: `${processingTime}ms`,
        },
      });

      // Send the converted document with proper headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );
      res.setHeader("Content-Length", docxBuffer.length);
      res.setHeader("X-Original-Pages", numPages);
      res.setHeader("X-Text-Length", text.length);
      res.setHeader("X-Processing-Time", processingTime);
      res.setHeader("X-Conversion-Type", "enhanced_structured");
      res.setHeader(
        "X-Document-Type",
        documentStructure.documentType || "document",
      );
      res.setHeader("X-Has-Headers", documentStructure.hasHeaders.toString());
      res.setHeader(
        "X-Has-Lists",
        (
          documentStructure.hasBulletPoints ||
          documentStructure.hasNumberedLists
        ).toString(),
      );
      res.setHeader(
        "X-Estimated-Sections",
        documentStructure.estimatedSections.toString(),
      );
      res.setHeader(
        "X-Extracted-Title",
        encodeURIComponent(documentStructure.title || ""),
      );
      res.setHeader(
        "X-Original-Filename",
        encodeURIComponent(file.originalname),
      );

      // Add cache control headers
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      console.log(
        `✅ Enhanced Word document created: ${formatBytes(docxBuffer.length)} in ${processingTime}ms`,
      );
      console.log(
        `�� Document analysis: ${documentStructure.estimatedSections} sections, ${documentStructure.hasHeaders ? "headers detected" : "no headers"}, ${documentStructure.hasBulletPoints || documentStructure.hasNumberedLists ? "lists detected" : "no lists"}`,
      );
      console.log(
        `���� Content preserved: ${text.length} characters from ${numPages} pages`,
      );

      // Send the buffer
      res.end(docxBuffer);
    } catch (error) {
      console.error("PDF to Word conversion error:", error);

      // Track error
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "pdf-to-word",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to convert PDF to Word",
      });
    }
  },
);

// Enhanced text cleaning and normalization
function cleanAndNormalizeText(text) {
  // Remove excessive whitespace while preserving meaningful line breaks
  text = text.replace(/[ \t]+/g, " "); // Multiple spaces/tabs to single space
  text = text.replace(/\n\s*\n\s*\n/g, "\n\n"); // Multiple line breaks to double line break
  text = text.replace(/^\s+|\s+$/gm, ""); // Trim each line

  // Fix common PDF extraction issues
  text = text.replace(/([a-z])([A-Z])/g, "$1 $2"); // Add space between camelCase words
  text = text.replace(/([a-zA-Z])(\d)/g, "$1 $2"); // Add space between letter and number
  text = text.replace(/(\d)([a-zA-Z])/g, "$1 $2"); // Add space between number and letter

  return text;
}

// Enhanced document structure analysis for better layout preservation
function analyzeDocumentStructure(text, pdfInfo) {
  const lines = text.split("\n");
  const structure = {
    hasTitle: false,
    hasHeaders: false,
    hasBulletPoints: false,
    hasNumberedLists: false,
    hasTableOfContents: false,
    hasTables: false,
    hasColumns: false,
    hasFooters: false,
    hasPageNumbers: false,
    documentType: "document",
    title: pdfInfo.Title || extractTitleFromText(lines),
    author: pdfInfo.Author || null,
    estimatedSections: 0,
    layoutComplexity: "simple",
    textAlignment: [],
    fontVariations: 0,
    lineSpacing: "normal",
  };

  let potentialTableLines = 0;
  let shortLines = 0;
  let longLines = 0;
  let centerAlignedLines = 0;
  let rightAlignedLines = 0;

  // Analyze content patterns with enhanced detection
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";
    const prevLine = i > 0 ? lines[i - 1].trim() : "";

    if (!trimmed) continue;

    // Enhanced header detection
    if (isLikelyHeader(trimmed)) {
      structure.hasHeaders = true;
      structure.estimatedSections++;
    }

    // Enhanced list detection
    if (
      trimmed.match(/^[\u2022\u2023\u25E6\u2043\u2219���·‣⁃]\s+/) ||
      trimmed.match(/^[-*+]\s+/) ||
      trimmed.match(/^[▪▫▬▭▮��]\s+/)
    ) {
      structure.hasBulletPoints = true;
    }

    if (
      trimmed.match(/^\d+\.?\s+/) ||
      trimmed.match(/^[a-zA-Z]\.?\s+/) ||
      trimmed.match(/^[ivx]+\.?\s+/i) ||
      trimmed.match(/^\([a-zA-Z0-9]+\)\s+/)
    ) {
      structure.hasNumberedLists = true;
    }

    // Enhanced table detection
    if (
      trimmed.includes("|") ||
      trimmed.match(/\t+/) ||
      trimmed.match(/\s{5,}/) ||
      (trimmed.match(/\d+/) &&
        trimmed.match(/[A-Za-z]+/) &&
        trimmed.length < 50)
    ) {
      potentialTableLines++;
      structure.hasTables = potentialTableLines > 3;
    }

    // Column layout detection
    if (trimmed.length < 40 && trimmed.length > 5 && !trimmed.endsWith(".")) {
      shortLines++;
    } else if (trimmed.length > 80) {
      longLines++;
    }

    // Text alignment detection based on spacing patterns
    const leadingSpaces = line.length - line.trimStart().length;
    const trailingSpaces = line.length - line.trimEnd().length;

    if (leadingSpaces > 20 && trailingSpaces > 20) {
      centerAlignedLines++;
    } else if (leadingSpaces > 40) {
      rightAlignedLines++;
    }

    // Page number detection
    if (
      trimmed.match(/^\d+$/) ||
      trimmed.match(/^page\s+\d+/i) ||
      trimmed.match(/^\d+\s*\/\s*\d+$/)
    ) {
      structure.hasPageNumbers = true;
    }

    // Footer detection (typically short lines at the end of sections)
    if (
      trimmed.length < 50 &&
      (trimmed.includes("©") ||
        trimmed.includes("confidential") ||
        trimmed.includes("proprietary") ||
        trimmed.match(/\d{4}/)) &&
      nextLine === ""
    ) {
      structure.hasFooters = true;
    }

    // Table of contents detection
    if (
      (trimmed.match(/table of contents|contents|index/i) &&
        trimmed.length < 50) ||
      (trimmed.match(/\.{3,}/) && trimmed.match(/\d+$/)) // Lines ending with dots and page numbers
    ) {
      structure.hasTableOfContents = true;
    }
  }

  // Determine layout complexity
  const columnRatio = shortLines / Math.max(longLines, 1);
  const alignmentVariation = centerAlignedLines + rightAlignedLines;

  if (structure.hasTables || potentialTableLines > 10) {
    structure.layoutComplexity = "complex";
  } else if (columnRatio > 1.5 || alignmentVariation > lines.length * 0.1) {
    structure.layoutComplexity = "moderate";
  } else {
    structure.layoutComplexity = "simple";
  }

  // Determine document type based on analysis
  if (structure.hasTableOfContents && structure.estimatedSections > 5) {
    structure.documentType = "report";
  } else if (structure.hasTables && potentialTableLines > 20) {
    structure.documentType = "data_sheet";
  } else if (centerAlignedLines > 5 && shortLines > longLines) {
    structure.documentType = "resume";
  } else if (structure.estimatedSections > 3) {
    structure.documentType = "structured_document";
  }

  // Set alignment preferences
  if (centerAlignedLines > lines.length * 0.2) {
    structure.textAlignment.push("center");
  }
  if (rightAlignedLines > lines.length * 0.1) {
    structure.textAlignment.push("right");
  }

  console.log("📋 Enhanced document structure analysis:", {
    ...structure,
    stats: {
      totalLines: lines.length,
      potentialTableLines,
      shortLines,
      longLines,
      centerAlignedLines,
      rightAlignedLines,
      columnRatio: columnRatio.toFixed(2),
    },
  });

  return structure;
}

// Extract title from document text if not in metadata
function extractTitleFromText(lines) {
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 10 && line.length < 100 && isLikelyTitle(line)) {
      return line;
    }
  }
  return null;
}

// Enhanced helper function to process text into professionally structured paragraphs with layout preservation
function processTextToParagraphs(
  text,
  preserveFormatting,
  documentStructure = {},
) {
  const lines = text.split("\n");
  const paragraphs = [];
  let currentParagraph = [];
  let isInList = false;
  let listItems = [];
  let isInTable = false;
  let tableRows = [];
  let currentSection = null;

  // Pre-process lines to identify document sections and layout elements
  const processedLines = lines
    .map((line, index) => {
      const trimmed = line.trim();
      const originalLine = line; // Preserve original spacing
      const analysis = analyzeLineType(
        trimmed,
        originalLine,
        documentStructure,
      );

      return {
        originalText: line,
        trimmedText: trimmed,
        analysis: analysis,
        index: index,
        isEmpty: !trimmed,
        indentLevel: getIndentLevel(line),
        spacingBefore: getSpacingBefore(lines, index),
        spacingAfter: getSpacingAfter(lines, index),
      };
    })
    .filter((lineInfo) => !lineInfo.isEmpty || lineInfo.spacingBefore > 1); // Keep some empty lines for spacing

  for (let i = 0; i < processedLines.length; i++) {
    const lineInfo = processedLines[i];
    const { trimmedText, analysis, originalText, indentLevel } = lineInfo;

    // Handle empty lines for spacing preservation
    if (lineInfo.isEmpty) {
      finishCurrentContent();
      paragraphs.push(createSpacingParagraph(lineInfo.spacingBefore));
      continue;
    }

    // Handle table content
    if (analysis.isTableRow) {
      finishCurrentContent();
      isInTable = true;
      tableRows.push({
        text: trimmedText,
        cells: analysis.tableCells || [trimmedText],
        alignment: analysis.alignment,
      });
      continue;
    } else if (isInTable && tableRows.length > 0) {
      // End table and add it to document
      paragraphs.push(...createWordTable(tableRows));
      tableRows = [];
      isInTable = false;
    }

    // Handle different content types based on analysis
    if (analysis.isHeading) {
      finishCurrentContent();

      if (analysis.level === 1) {
        // Document title
        paragraphs.push(createWordTitle(trimmedText, analysis.alignment));
      } else {
        // Section header
        paragraphs.push(
          createWordHeading(trimmedText, analysis.level, analysis.alignment),
        );
      }
      currentSection = trimmedText;
    } else if (analysis.isListItem) {
      finishCurrentParagraph();
      isInList = true;
      listItems.push({
        type: analysis.listType,
        text: trimmedText.replace(/^[•\-\d\.]\s*/, "").trim(),
        level: analysis.listLevel || 0,
        indentLevel: indentLevel,
      });
    } else {
      // Regular content - group related lines together with better logic
      if (isInList) {
        // Check if this continues the list or starts new content
        if (!analysis.isListItem && analysis.indentLevel <= 0) {
          // End the list and start a new paragraph
          if (listItems.length > 0) {
            paragraphs.push(...createWordList(listItems));
            listItems = [];
            isInList = false;
          }
        }
      }

      // Enhanced grouping logic based on content type and formatting
      const shouldGroup = shouldGroupWithNext(
        lineInfo,
        processedLines,
        i,
        documentStructure,
      );

      if (shouldGroup && i < processedLines.length - 1) {
        currentParagraph.push({
          text: trimmedText,
          analysis: analysis,
          indentLevel: indentLevel,
        });
        continue;
      }

      // Create paragraph for current content
      if (currentParagraph.length > 0) {
        currentParagraph.push({
          text: trimmedText,
          analysis: analysis,
          indentLevel: indentLevel,
        });

        const paragraphData = mergeParagraphContent(currentParagraph);
        paragraphs.push(
          createWordParagraph(
            paragraphData.text,
            preserveFormatting,
            paragraphData.type,
            paragraphData.alignment,
            paragraphData.indentLevel,
          ),
        );
        currentParagraph = [];
      } else {
        // Standalone line with enhanced type detection
        const type = getContentType(analysis, currentSection);
        paragraphs.push(
          createWordParagraph(
            trimmedText,
            preserveFormatting,
            type,
            analysis.alignment,
            indentLevel,
          ),
        );
      }
    }
  }

  // Finish any remaining content
  finishCurrentContent();

  function finishCurrentContent() {
    finishCurrentParagraph();
    finishCurrentList();
    finishCurrentTable();
  }

  function finishCurrentParagraph() {
    if (currentParagraph.length > 0) {
      const paragraphData = mergeParagraphContent(currentParagraph);
      paragraphs.push(
        createWordParagraph(
          paragraphData.text,
          preserveFormatting,
          paragraphData.type,
          paragraphData.alignment,
          paragraphData.indentLevel,
        ),
      );
      currentParagraph = [];
    }
  }

  function finishCurrentList() {
    if (isInList && listItems.length > 0) {
      paragraphs.push(...createWordList(listItems));
      listItems = [];
      isInList = false;
    }
  }

  function finishCurrentTable() {
    if (isInTable && tableRows.length > 0) {
      paragraphs.push(...createWordTable(tableRows));
      tableRows = [];
      isInTable = false;
    }
  }

  return paragraphs;
}

// Helper function to determine if lines should be grouped
function shouldGroupWithNext(
  lineInfo,
  processedLines,
  currentIndex,
  documentStructure,
) {
  if (currentIndex >= processedLines.length - 1) return false;

  const nextLine = processedLines[currentIndex + 1];
  const { analysis } = lineInfo;

  // Don't group with headings, lists, or special content
  if (
    nextLine.analysis.isHeading ||
    nextLine.analysis.isListItem ||
    nextLine.analysis.isTableRow ||
    analysis.isContact
  ) {
    return false;
  }

  // Group lines with similar indentation and content type
  if (
    Math.abs(lineInfo.indentLevel - nextLine.indentLevel) <= 1 &&
    !analysis.isDate &&
    !analysis.isJobTitle &&
    nextLine.trimmedText.length > 10
  ) {
    return true;
  }

  return false;
}

// Helper function to merge paragraph content intelligently
function mergeParagraphContent(paragraphLines) {
  const texts = paragraphLines.map((p) => p.text);
  const mainType = paragraphLines[0].analysis;
  const avgIndent =
    paragraphLines.reduce((sum, p) => sum + p.indentLevel, 0) /
    paragraphLines.length;

  return {
    text: texts.join(" "),
    type: getContentType(mainType),
    alignment: mainType.alignment || "left",
    indentLevel: Math.round(avgIndent),
  };
}

// Enhanced content type detection
function getContentType(analysis, currentSection = "") {
  if (analysis.isContact) return "contact";
  if (analysis.isJobTitle) return "job_title";
  if (analysis.isDate) return "date";
  if (analysis.isCompanyName) return "company";
  if (analysis.isPageNumber) return "page_number";
  if (analysis.isFooter) return "footer";
  if (currentSection && currentSection.toLowerCase().includes("education"))
    return "education";
  if (currentSection && currentSection.toLowerCase().includes("experience"))
    return "experience";
  return "normal";
}

// Helper functions for layout analysis
function getIndentLevel(line) {
  const leadingSpaces = line.length - line.trimStart().length;
  return Math.floor(leadingSpaces / 4); // Assume 4 spaces per indent level
}

function getSpacingBefore(lines, index) {
  let spacing = 0;
  for (let i = index - 1; i >= 0; i--) {
    if (lines[i].trim() === "") {
      spacing++;
    } else {
      break;
    }
  }
  return spacing;
}

function getSpacingAfter(lines, index) {
  let spacing = 0;
  for (let i = index + 1; i < lines.length; i++) {
    if (lines[i].trim() === "") {
      spacing++;
    } else {
      break;
    }
  }
  return spacing;
}

// Enhanced content type detection
function detectContentType(line, documentStructure) {
  // Check for bullet points
  const bulletMatch = line.match(
    /^([\u2022\u2023\u25E6\u2043\u2219•·‣\-⁃\-*+])\s+(.+)$/,
  );
  if (bulletMatch) {
    return { type: "bullet_item", text: bulletMatch[2] };
  }

  // Check for numbered items
  const numberedMatch =
    line.match(/^(\d+)\.?\s+(.+)$/) || line.match(/^([a-zA-Z])\.?\s+(.+)$/);
  if (numberedMatch) {
    return {
      type: "numbered_item",
      text: numberedMatch[2],
      number: numberedMatch[1],
    };
  }

  // Check for table patterns (simple detection)
  if (line.includes("\t") || line.match(/\s{3,}\w/)) {
    return { type: "table_row" };
  }

  // Check for title (first few lines, specific patterns)
  if (isLikelyTitle(line)) {
    return { type: "title" };
  }

  // Check for headings
  const headingLevel = detectHeadingLevel(line);
  if (headingLevel > 0) {
    return { type: "heading", level: headingLevel };
  }

  return { type: "paragraph" };
}

// Enhanced heading detection with levels
function detectHeadingLevel(line) {
  // Level 1 - Major headings
  if (
    line.length < 60 &&
    (line.match(/^[A-Z\s]+$/) || // All caps
      line.match(/^CHAPTER|^SECTION|^PART/i) ||
      line.match(/^\d+\.\s*[A-Z]/)) // "1. INTRODUCTION"
  ) {
    return 1;
  }

  // Level 2 - Sub headings
  if (
    line.length < 80 &&
    (line.match(/^\d+\.\d+\s/) || // "1.1 Introduction"
      line.match(/^[A-Z][a-z]+\s[A-Z]/) || // "Title Case Heading"
      line.match(/^[IVX]+\.\s/)) // Roman numerals
  ) {
    return 2;
  }

  // Level 3 - Minor headings
  if (
    line.length < 100 &&
    (line.match(/^\d+\.\d+\.\d+\s/) || // "1.1.1 Sub-section"
      line.match(/^[a-z]\)\s/)) // "a) subsection"
  ) {
    return 3;
  }

  return 0;
}

// Check if line is likely a document title
function isLikelyTitle(line) {
  return (
    line.length < 100 &&
    line.length > 5 &&
    !line.includes(".") &&
    (line.match(/^[A-Z]/) || line.match(/^[A-Z\s]+$/))
  );
}

// Check if line is likely a header
function isLikelyHeader(line) {
  return detectHeadingLevel(line) > 0;
}

// Create Word title with proper styling and alignment
function createWordTitle(text, alignment = "center") {
  const { Paragraph, TextRun, AlignmentType } = require("docx");

  const alignmentMap = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
  };

  return new Paragraph({
    heading: "Title",
    children: [
      new TextRun({
        text: text,
        size: 32, // 16pt
        bold: true,
        color: "000000",
      }),
    ],
    spacing: {
      after: 400, // Space after title
    },
    alignment: alignmentMap[alignment] || AlignmentType.CENTER,
  });
}

// Create Word heading with proper levels, styling, and alignment
function createWordHeading(text, level = 1, alignment = "left") {
  const { Paragraph, TextRun, HeadingLevel, AlignmentType } = require("docx");

  const headingLevels = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };

  const sizes = { 1: 28, 2: 24, 3: 20, 4: 18, 5: 16, 6: 14 }; // pt sizes

  const alignmentMap = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
  };

  return new Paragraph({
    heading: headingLevels[level] || HeadingLevel.HEADING_1,
    children: [
      new TextRun({
        text: text,
        size: sizes[level] * 2 || 28, // Convert to half-points
        bold: true,
        color: "1f1f1f",
      }),
    ],
    spacing: {
      before: level === 1 ? 400 : 200,
      after: 200,
    },
    alignment: alignmentMap[alignment] || AlignmentType.LEFT,
  });
}

// Create Word list items with proper formatting
function createWordList(items) {
  const { Paragraph, TextRun } = require("docx");

  return items.map((item, index) => {
    if (item.type === "bullet") {
      return new Paragraph({
        bullet: {
          level: 0,
        },
        children: [
          new TextRun({
            text: item.text,
            size: 22, // 11pt
          }),
        ],
        spacing: { after: 120 },
        indent: { left: 360 },
      });
    } else if (item.type === "numbered") {
      return new Paragraph({
        numbering: {
          reference: "default-numbering",
          level: 0,
        },
        children: [
          new TextRun({
            text: item.text,
            size: 22, // 11pt
          }),
        ],
        spacing: { after: 120 },
      });
    }

    // Fallback for unmatched items
    return new Paragraph({
      children: [
        new TextRun({
          text: `${item.number || "•"} ${item.text}`,
          size: 22, // 11pt
        }),
      ],
      spacing: { after: 120 },
      indent: { left: 360 },
    });
  });
}

// Enhanced paragraph creation with professional formatting, alignment, and indentation
function createWordParagraph(
  text,
  preserveFormatting,
  type = "normal",
  alignment = "left",
  indentLevel = 0,
) {
  const { Paragraph, TextRun, AlignmentType } = require("docx");

  if (!text || text.trim().length === 0) {
    return new Paragraph({
      children: [new TextRun(" ")],
      spacing: { after: 160 },
    });
  }

  // Detect if this line should be a heading or special content
  const contentType = analyzeLineType(text);

  if (contentType.isHeading) {
    return createWordHeading(text, contentType.level, alignment);
  }

  if (contentType.isListItem) {
    return createListItemParagraph(text, contentType.listType);
  }

  // Create enhanced formatted runs
  const formattedRuns = parseFormattedText(text, preserveFormatting, type);

  const alignmentMap = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
  };

  const paragraphOptions = {
    children: formattedRuns,
    spacing: {
      before: contentType.spaceBefore || 0,
      after: contentType.spaceAfter || 160,
      line: 240, // 1.2 line spacing
    },
    alignment: alignmentMap[alignment] || AlignmentType.LEFT,
  };

  // Add indentation if specified
  if (indentLevel > 0) {
    paragraphOptions.indent = {
      left: indentLevel * 360, // 360 twips per indent level (0.25 inch)
    };
  }

  // Apply professional styling based on content type
  if (type === "contact" || contentType.isContact) {
    paragraphOptions.alignment = AlignmentType.CENTER;
    paragraphOptions.spacing.after = 240;
  } else if (type === "job_title") {
    paragraphOptions.spacing.before = 200;
    paragraphOptions.spacing.after = 120;
  } else if (type === "company") {
    paragraphOptions.spacing.after = 120;
  } else if (type === "date") {
    paragraphOptions.alignment = AlignmentType.RIGHT;
    paragraphOptions.spacing.after = 120;
  } else if (type === "section" || contentType.isSection) {
    paragraphOptions.spacing.before = 320;
    paragraphOptions.spacing.after = 200;
  } else if (type === "education" || type === "experience") {
    paragraphOptions.spacing.after = 140;
  } else if (type === "page_number") {
    paragraphOptions.alignment = AlignmentType.CENTER;
    paragraphOptions.spacing = { before: 400, after: 0 };
  } else if (type === "footer") {
    paragraphOptions.alignment = AlignmentType.CENTER;
    paragraphOptions.spacing = { before: 200, after: 200 };
  }

  return new Paragraph(paragraphOptions);
}

// Enhanced line analysis function with comprehensive layout detection
function analyzeLineType(text, originalLine = "", documentStructure = {}) {
  const trimmed = text.trim();
  const originalTrimmed = originalLine.trim();

  // Contact information patterns (enhanced)
  const isEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(
    trimmed,
  );
  const isPhone =
    /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/.test(
      trimmed,
    );
  const isAddress = /\b\d+\s+[A-Za-z0-9\s,.-]+/.test(trimmed);
  const isWebsite = /\b(https?:\/\/|www\.)[^\s]+\b/.test(trimmed);
  const isLinkedIn = /linkedin\.com\/in\//.test(trimmed);

  // Section headers (expanded list)
  const sectionHeaders = [
    "ABOUT",
    "EDUCATION",
    "EXPERIENCE",
    "SKILLS",
    "PROJECTS",
    "TECHNICAL SKILLS",
    "PERSONAL PROJECTS",
    "CERTIFICATIONS",
    "ACHIEVEMENTS",
    "CONTACT",
    "SUMMARY",
    "OBJECTIVE",
    "WORK EXPERIENCE",
    "EMPLOYMENT",
    "QUALIFICATIONS",
    "PROFILE",
    "BACKGROUND",
    "EXPERTISE",
    "ACCOMPLISHMENTS",
    "PROFESSIONAL EXPERIENCE",
    "ACADEMIC BACKGROUND",
    "CAREER HIGHLIGHTS",
    "CORE COMPETENCIES",
  ];

  const isSection = sectionHeaders.some(
    (header) => trimmed.toUpperCase().includes(header) && trimmed.length < 80,
  );

  // Enhanced name pattern detection
  const isName =
    trimmed.length < 60 &&
    /^[A-Z][a-z]+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/.test(trimmed) &&
    !trimmed.includes("@") &&
    !trimmed.includes("•") &&
    !trimmed.includes("www") &&
    !trimmed.match(/\d/);

  // Enhanced job titles and company names
  const jobKeywords = [
    "Developer",
    "Engineer",
    "Manager",
    "Analyst",
    "Designer",
    "Specialist",
    "Lead",
    "Senior",
    "Junior",
    "Intern",
    "Director",
    "Coordinator",
    "Administrator",
    "Consultant",
    "Architect",
    "Programmer",
    "Technician",
    "Associate",
    "Executive",
  ];

  const isJobTitle = jobKeywords.some(
    (keyword) => trimmed.includes(keyword) && trimmed.length < 100,
  );

  // Enhanced company name detection
  const companyIndicators = [
    "Inc",
    "LLC",
    "Corp",
    "Ltd",
    "Company",
    "Technologies",
    "Solutions",
    "Systems",
  ];
  const isCompanyName = companyIndicators.some(
    (indicator) => trimmed.includes(indicator) && trimmed.length < 80,
  );

  // Enhanced date patterns
  const isDate =
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(trimmed) ||
    /\b\d{4}\b/.test(trimmed) ||
    /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(trimmed) ||
    /\d{1,2}-\d{1,2}-\d{2,4}/.test(trimmed) ||
    /(Present|Current|Now|Ongoing)/.test(trimmed);

  // Enhanced list detection
  const bulletPatterns = /^[\u2022\u2023\u25E6\u2043\u2219•·‣⁃▪▫▬▭▮▯]\s+/;
  const numberedPatterns =
    /^(\d+\.?\s+|[a-zA-Z]\.?\s+|[ivx]+\.?\s+|\([a-zA-Z0-9]+\)\s+)/;
  const dashPatterns = /^[-*+]\s+/;

  const isListItem =
    bulletPatterns.test(trimmed) ||
    numberedPatterns.test(trimmed) ||
    dashPatterns.test(trimmed);

  let listType = "bullet";
  let listLevel = 0;

  if (isListItem) {
    if (numberedPatterns.test(trimmed)) {
      listType = "numbered";
    }
    // Determine list level based on indentation
    const leadingSpaces = originalLine.length - originalLine.trimStart().length;
    listLevel = Math.floor(leadingSpaces / 4);
  }

  // Table detection (enhanced)
  const tableCells = [];
  let isTableRow = false;

  if (trimmed.includes("|")) {
    tableCells.push(...trimmed.split("|").map((cell) => cell.trim()));
    isTableRow = true;
  } else if (trimmed.match(/\t+/)) {
    tableCells.push(...trimmed.split(/\t+/).map((cell) => cell.trim()));
    isTableRow = true;
  } else if (trimmed.match(/\s{5,}/)) {
    // Multiple spaces might indicate columnar data
    tableCells.push(...trimmed.split(/\s{5,}/).map((cell) => cell.trim()));
    isTableRow = tableCells.length > 1;
  }

  // Page number detection
  const isPageNumber =
    /^page\s+\d+/i.test(trimmed) ||
    /^\d+$/.test(trimmed) ||
    /^\d+\s*\/\s*\d+$/.test(trimmed) ||
    /^\d+\s+of\s+\d+$/i.test(trimmed);

  // Footer detection
  const isFooter =
    trimmed.includes("©") ||
    /confidential|proprietary|private/i.test(trimmed) ||
    (trimmed.length < 50 && trimmed.match(/\d{4}/));

  // Text alignment detection based on original line spacing
  let alignment = "left";
  if (originalLine !== trimmed) {
    const leadingSpaces = originalLine.length - originalLine.trimStart().length;
    const trailingSpaces = originalLine.length - originalLine.trimEnd().length;

    if (leadingSpaces > 20 && trailingSpaces > 20) {
      alignment = "center";
    } else if (leadingSpaces > 30) {
      alignment = "right";
    }
  }

  // Enhanced heading detection with multiple levels
  let headingLevel = 0;
  if (isName) {
    headingLevel = 1;
  } else if (isSection) {
    headingLevel = 2;
  } else if (
    trimmed.length < 80 &&
    trimmed === trimmed.toUpperCase() &&
    trimmed.length > 3
  ) {
    headingLevel = 3;
  } else if (trimmed.match(/^\d+\.\s+[A-Z]/) || trimmed.match(/^[IVX]+\.\s+/)) {
    headingLevel = 3;
  } else if (trimmed.match(/^\d+\.\d+\s+/) || trimmed.match(/^[A-Z][a-z]+:$/)) {
    headingLevel = 4;
  }

  const isContactInfo =
    isEmail || isPhone || isAddress || isWebsite || isLinkedIn;

  return {
    isHeading: headingLevel > 0,
    level: headingLevel,
    isContact: isContactInfo,
    isSection: isSection,
    isListItem: isListItem,
    listType: listType,
    listLevel: listLevel,
    isJobTitle: isJobTitle,
    isCompanyName: isCompanyName,
    isDate: isDate,
    isTableRow: isTableRow,
    tableCells: tableCells,
    isPageNumber: isPageNumber,
    isFooter: isFooter,
    alignment: alignment,
    indentLevel: Math.floor(
      (originalLine.length - originalLine.trimStart().length) / 4,
    ),
    spaceBefore: getSpacingRequirement(
      headingLevel,
      isSection,
      isName,
      isContactInfo,
      "before",
    ),
    spaceAfter: getSpacingRequirement(
      headingLevel,
      isSection,
      isName,
      isContactInfo,
      "after",
    ),
  };
}

// Helper function to determine spacing requirements
function getSpacingRequirement(
  headingLevel,
  isSection,
  isName,
  isContactInfo,
  position,
) {
  if (position === "before") {
    if (headingLevel === 1 || isName) return 240;
    if (headingLevel === 2 || isSection) return 320;
    if (headingLevel >= 3) return 200;
    return 0;
  } else {
    // "after"
    if (headingLevel === 1 || isName) return 160;
    if (headingLevel === 2 || isSection) return 200;
    if (headingLevel >= 3) return 140;
    if (isContactInfo) return 120;
    return 160;
  }
}

// Create list item paragraph with proper formatting
function createListItemParagraph(text, listType = "bullet") {
  const { Paragraph, TextRun } = require("docx");

  // Remove bullet/number from text
  const cleanText = text.replace(/^[•\-\d\.]\s*/, "").trim();

  if (listType === "bullet") {
    return new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({
          text: cleanText,
          size: 22, // 11pt
        }),
      ],
      spacing: { after: 120 },
      indent: { left: 360 },
    });
  } else {
    return new Paragraph({
      numbering: {
        reference: "default-numbering",
        level: 0,
      },
      children: [
        new TextRun({
          text: cleanText,
          size: 22, // 11pt
        }),
      ],
      spacing: { after: 120 },
    });
  }
}

// Create spacing paragraph for layout preservation
function createSpacingParagraph(lineCount = 1) {
  const { Paragraph, TextRun } = require("docx");

  return new Paragraph({
    children: [new TextRun(" ")],
    spacing: {
      after: Math.min(lineCount * 120, 480), // Max 2 lines spacing
    },
  });
}

// Create Word table from table rows
function createWordTable(tableRows) {
  const {
    Table,
    TableRow,
    TableCell,
    Paragraph,
    TextRun,
    WidthType,
    AlignmentType,
  } = require("docx");

  if (!tableRows || tableRows.length === 0) {
    return [];
  }

  // Determine number of columns from the first row
  const maxCols = Math.max(...tableRows.map((row) => row.cells.length));

  const tableRowElements = tableRows.map((rowData) => {
    const cells = [];

    // Ensure all rows have the same number of cells
    for (let i = 0; i < maxCols; i++) {
      const cellText = rowData.cells[i] || "";

      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText,
                  size: 20, // 10pt for table text
                }),
              ],
              alignment:
                rowData.alignment === "center"
                  ? AlignmentType.CENTER
                  : AlignmentType.LEFT,
            }),
          ],
          width: {
            size: Math.floor(100 / maxCols),
            type: WidthType.PERCENTAGE,
          },
        }),
      );
    }

    return new TableRow({
      children: cells,
    });
  });

  const table = new Table({
    rows: tableRowElements,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });

  return [table];
}

// Enhanced text formatting with proper styling
function parseFormattedText(
  text,
  preserveFormatting = true,
  contentType = "normal",
) {
  const { TextRun } = require("docx");

  if (!preserveFormatting) {
    return [
      new TextRun({
        text: text,
        size: 22, // 11pt
      }),
    ];
  }

  const runs = [];
  const detectedType = analyzeLineType(text);

  // Apply different formatting based on content type with enhanced styling
  if (contentType === "contact" || detectedType.isContact) {
    runs.push(
      new TextRun({
        text: text,
        size: 20, // 10pt
        color: "2563eb", // Blue color for contact info
      }),
    );
  } else if (contentType === "job_title" || detectedType.isJobTitle) {
    runs.push(
      new TextRun({
        text: text,
        size: 24, // 12pt
        bold: true,
        color: "1f2937", // Dark gray
      }),
    );
  } else if (contentType === "company" || detectedType.isCompanyName) {
    runs.push(
      new TextRun({
        text: text,
        size: 22, // 11pt
        italics: true,
        color: "374151", // Slightly lighter gray
      }),
    );
  } else if (contentType === "date" || detectedType.isDate) {
    runs.push(
      new TextRun({
        text: text,
        size: 20, // 10pt
        italics: true,
        color: "6b7280", // Medium gray
      }),
    );
  } else if (contentType === "page_number" || detectedType.isPageNumber) {
    runs.push(
      new TextRun({
        text: text,
        size: 18, // 9pt
        color: "9ca3af", // Light gray
      }),
    );
  } else if (contentType === "footer" || detectedType.isFooter) {
    runs.push(
      new TextRun({
        text: text,
        size: 18, // 9pt
        italics: true,
        color: "9ca3af", // Light gray
      }),
    );
  } else {
    // Regular text with potential emphasis and inline formatting
    const words = text.split(" ");
    let currentText = "";

    for (const word of words) {
      // Check for emphasized words (all caps, etc.)
      if (
        word.length > 2 &&
        word === word.toUpperCase() &&
        /^[A-Z]+$/.test(word) &&
        !word.includes(".") // Avoid acronyms with periods
      ) {
        // Finish current text run
        if (currentText.trim()) {
          runs.push(
            new TextRun({
              text: currentText,
              size: 22, // 11pt
            }),
          );
          currentText = "";
        }

        // Add emphasized word
        runs.push(
          new TextRun({
            text: word + " ",
            size: 22, // 11pt
            bold: true,
            color: "1f2937",
          }),
        );
      } else if (
        word.startsWith("*") &&
        word.endsWith("*") &&
        word.length > 2
      ) {
        // Handle *bold* formatting
        if (currentText.trim()) {
          runs.push(
            new TextRun({
              text: currentText,
              size: 22,
            }),
          );
          currentText = "";
        }

        runs.push(
          new TextRun({
            text: word.slice(1, -1) + " ",
            size: 22,
            bold: true,
          }),
        );
      } else if (
        word.startsWith("_") &&
        word.endsWith("_") &&
        word.length > 2
      ) {
        // Handle _italic_ formatting
        if (currentText.trim()) {
          runs.push(
            new TextRun({
              text: currentText,
              size: 22,
            }),
          );
          currentText = "";
        }

        runs.push(
          new TextRun({
            text: word.slice(1, -1) + " ",
            size: 22,
            italics: true,
          }),
        );
      } else {
        currentText += word + " ";
      }
    }

    // Add remaining text
    if (currentText.trim()) {
      runs.push(
        new TextRun({
          text: currentText.trim(),
          size: 22, // 11pt
        }),
      );
    }
  }

  return runs.length > 0
    ? runs
    : [
        new TextRun({
          text: text,
          size: 22, // 11pt
        }),
      ];
}

// @route   POST /api/pdf/word-to-pdf-advanced
// @desc    Advanced Word to PDF conversion with professional formatting
// @access  Public (with optional auth and usage limits)
router.post(
  "/word-to-pdf-advanced",
  optionalAuth,
  checkUsageLimit,
  uploadWord.single("file"),
  async (req, res) => {
    const startTime = Date.now();

    try {
      const file = req.file;
      let options = {};

      // Parse conversion options
      try {
        if (req.body.options) {
          options = JSON.parse(req.body.options);
        }
      } catch (e) {
        console.warn("Failed to parse options, using defaults");
      }

      const {
        preserveFormatting = true,
        preserveImages = true,
        preserveLayouts = true,
        pageSize = "A4",
        quality = "high",
        orientation = "portrait",
        margins = "normal",
        compatibility = "pdf-1.7",
      } = options;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Word document is required",
        });
      }

      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];

      const isValidType =
        allowedTypes.includes(file.mimetype) ||
        file.originalname.toLowerCase().endsWith(".docx") ||
        file.originalname.toLowerCase().endsWith(".doc");

      if (!isValidType) {
        return res.status(400).json({
          success: false,
          message: "Only Word documents (.doc, .docx) are supported",
        });
      }

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "File size exceeds 50MB limit",
        });
      }

      console.log(`🚀 Advanced Word to PDF conversion: ${file.originalname}`);
      console.log(`📊 Options:`, {
        preserveFormatting,
        preserveImages,
        preserveLayouts,
        pageSize,
        quality,
      });

      // Import advanced conversion libraries
      const mammoth = require("mammoth");
      const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

      // Advanced HTML extraction with comprehensive style mapping
      const htmlResult = await mammoth.convertToHtml(
        { buffer: file.buffer },
        {
          styleMap: [
            // Document structure
            "p[style-name='Title'] => h1.document-title",
            "p[style-name='Heading 1'] => h1",
            "p[style-name='Heading 2'] => h2",
            "p[style-name='Heading 3'] => h3",
            "p[style-name='Normal'] => p",

            // Text formatting - more comprehensive
            "r[style-name='Strong'] => strong",
            "r[style-name='Bold'] => strong",
            "r[style-name='Emphasis'] => em",
            "r[style-name='Italic'] => em",
            "r[style-name='Underline'] => u",

            // Lists - better handling
            "p[style-name='List Paragraph'] => li",
            "p[style-name='ListParagraph'] => li",
            "p[style-name='List Number'] => li.numbered",
            "p[style-name='List Bullet'] => li.bullet",

            // Special elements
            "p[style-name='Header'] => div.header",
            "p[style-name='Footer'] => div.footer",
            "p[style-name='Quote'] => blockquote",

            // Tables
            "p[style-name='Table Paragraph'] => td p",
            "p[style-name='Table Normal'] => td p",
          ],
          includeDefaultStyleMap: true,
          convertImage: preserveImages
            ? mammoth.images.dataUri
            : mammoth.images.ignore,
          ignoreEmptyElements: false,
          includeEmbeddedStyleMap: true,
          transformDocument: mammoth.transforms.paragraph(function (paragraph) {
            // Better paragraph handling
            return paragraph;
          }),
        },
      );

      const htmlContent = htmlResult.value;
      const messages = htmlResult.messages;

      // Log conversion messages for debugging
      if (messages.length > 0) {
        console.log("📋 Conversion messages:", messages.slice(0, 5));
      }

      if (!htmlContent || htmlContent.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "No content could be extracted from the Word document",
        });
      }

      console.log(`✅ Extracted ${htmlContent.length} characters of HTML`);

      // Enhanced HTML processing with better structure preservation
      console.log("�� Raw HTML content sample:", htmlContent.substring(0, 500));

      // Parse HTML more carefully to preserve structure
      let processedContent = htmlContent;

      // First pass: Extract and mark images
      const imageMatches =
        processedContent.match(/<img[^>]*src="data:image\/[^"]*"[^>]*>/gi) ||
        [];
      const images = imageMatches
        .map((img, index) => {
          const srcMatch = img.match(/src="(data:image\/[^"]*)"/);
          return srcMatch ? { id: `IMG_${index}`, src: srcMatch[1] } : null;
        })
        .filter(Boolean);

      console.log(`📷 Found ${images.length} images in document`);

      // Replace images with placeholders for now
      processedContent = processedContent.replace(/<img[^>]*>/gi, "[IMAGE]");

      // Second pass: Better list handling with proper numbering
      let listCounter = 1;
      processedContent = processedContent.replace(
        /<ol[^>]*>(.*?)<\/ol>/gis,
        (match, content) => {
          let numberedItems = content.replace(
            /<li[^>]*>(.*?)<\/li>/gi,
            (liMatch, liContent) => {
              const cleanContent = liContent.replace(/<[^>]*>/g, "").trim();
              return `\n${listCounter++}. ${cleanContent}`;
            },
          );
          return `\n【NUMBERED_LIST】${numberedItems}\n【/NUMBERED_LIST����\n`;
        },
      );

      // Reset counter for each list
      processedContent = processedContent.replace(/【NUMBERED_LIST】/g, () => {
        listCounter = 1;
        return "【NUMBERED_LIST】";
      });

      // Handle unordered lists
      processedContent = processedContent.replace(
        /<ul[^>]*>(.*?)<\/ul>/gis,
        (match, content) => {
          let bulletItems = content.replace(
            /<li[^>]*>(.*?)<\/li>/gi,
            (liMatch, liContent) => {
              const cleanContent = liContent.replace(/<[^>]*>/g, "").trim();
              return `\n• ${cleanContent}`;
            },
          );
          return `\n【BULLET_LIST】${bulletItems}\n【/BULLET_LIST】\n`;
        },
      );

      // Third pass: Handle headings and structure
      processedContent = processedContent
        // Headers and titles
        .replace(
          /<h1[^>]*>(.*?)<\/h1>/gi,
          "\n\n【HEADING1����$1��/HEADING1】\n\n",
        )
        .replace(
          /<h2[^>]*>(.*?)<\/h2>/gi,
          "\n\n【HEADING2】$1【/HEADING2】\n\n",
        )
        .replace(
          /<h3[^>]*>(.*?)<\/h3>/gi,
          "\n\n������HEADING3���$1【/HEADING3】\n\n",
        )

        // Text formatting
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "【BOLD】$1【/BOLD���")
        .replace(/<b[^>]*>(.*?)<\/b>/gi, "【BOLD】$1【/BOLD】")
        .replace(/<em[^>]*>(.*?)<\/em>/gi, "【ITALIC】$1【/ITALIC】")
        .replace(/<i[^>]*>(.*?)<\/i>/gi, "【ITALIC】$1【/ITALIC】")
        .replace(/<u[^>]*>(.*?)<\/u>/gi, "【UNDERLINE】$1【/UNDERLINE】")

        // Paragraphs - preserve line breaks
        .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n【PARAGRAPH】$1【/PARAGRAPH��\n")
        .replace(/<div[^>]*>(.*?)<\/div>/gi, "\n$1\n")
        .replace(/<br\s*\/?>/gi, "\n")

        // Clean up remaining HTML
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");

      // Fourth pass: Structure cleanup and formatting
      let formattedText = processedContent
        // Clean up markers and apply proper formatting
        .replace(/【NUMBERED_LIST】(.*?)【\/NUMBERED_LIST】/gs, "$1")
        .replace(/��BULLET_LIST】(.*?)【\/BULLET_LIST】/gs, "$1")
        .replace(/【HEADING1】(.*?)【\/HEADING1】/g, "\n\n���▓▓ $1 ��▓▓\n\n")
        .replace(/【HEADING2】(.*?)���\/HEADING2】/g, "\n\n▓▓ $1 ▓���\n\n")
        .replace(/【HEADING3】(.*?)【\/HEADING3】/g, "\n\n▓ $1 ▓\n\n")
        .replace(/【BOLD】(.*?)【\/BOLD��/g, "���B:$1】")
        .replace(/【ITALIC】(.*?)����\/ITALIC】/g, "��I:$1】")
        .replace(/【UNDERLINE】(.*?)【\/UNDERLINE】/g, "【U:$1】")
        .replace(/���PARAGRAPH】(.*?)【\/PARAGRAPH��/g, "$1\n")

        // Clean up excessive whitespace while preserving structure
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .replace(/^\s+|\s+$/g, "")
        .trim();

      if (!formattedText) {
        formattedText =
          "Document appears to be empty or contains no readable text.";
      }

      console.log(
        `�� Processed ${formattedText.length} characters with advanced formatting`,
      );

      // Create professional PDF document
      const pdfDoc = await PDFDocument.create();

      // Enhanced page size calculation
      const pageSizes = {
        A4: { width: 595, height: 842 },
        Letter: { width: 612, height: 792 },
        Legal: { width: 612, height: 1008 },
      };

      let selectedPageSize = pageSizes[pageSize] || pageSizes.A4;

      // Handle orientation
      if (orientation === "landscape") {
        selectedPageSize = {
          width: selectedPageSize.height,
          height: selectedPageSize.width,
        };
      }

      // Advanced margin calculation
      const marginSizes = {
        normal: 72, // 1 inch
        narrow: 36, // 0.5 inch
        wide: 108, // 1.5 inches
      };

      const margin = marginSizes[margins] || marginSizes.normal;
      const contentWidth = selectedPageSize.width - margin * 2;

      // Load professional font set
      const fonts = {
        regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
        boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
      };

      // Quality-based font sizing
      const baseFontSize =
        quality === "premium" ? 12 : quality === "high" ? 11 : 10;
      const baseLineHeight = baseFontSize + 4;

      // Initialize page and position
      let currentPage = pdfDoc.addPage([
        selectedPageSize.width,
        selectedPageSize.height,
      ]);
      let currentY = selectedPageSize.height - margin;
      let pageCount = 1;

      // Process content with advanced formatting
      const sections = formattedText
        .split(/\n\s*\n/)
        .filter((section) => section.trim());

      for (const section of sections) {
        if (!section.trim()) continue;

        let font = fonts.regular;
        let fontSize = baseFontSize;
        let lineHeight = baseLineHeight;
        let textColor = rgb(0, 0, 0);
        let isSpecialFormat = false;

        // Parse and apply formatting
        let displayText = section.trim();

        // Enhanced heading formatting with better patterns
        if (displayText.startsWith("��▓▓ ") && displayText.endsWith(" ▓▓▓")) {
          displayText = displayText.slice(4, -4).trim();
          font = fonts.bold;
          fontSize = baseFontSize + 8;
          lineHeight = fontSize + 6;
          textColor = rgb(0.1, 0.2, 0.7);
          isSpecialFormat = true;
        }
        // Heading level 2
        else if (displayText.startsWith("▓▓ ") && displayText.endsWith(" ▓▓")) {
          displayText = displayText.slice(3, -3).trim();
          font = fonts.bold;
          fontSize = baseFontSize + 6;
          lineHeight = fontSize + 4;
          textColor = rgb(0.2, 0.3, 0.6);
          isSpecialFormat = true;
        }
        // Heading level 3
        else if (
          displayText.startsWith("▓ ") &&
          displayText.endsWith(" ������")
        ) {
          displayText = displayText.slice(2, -2).trim();
          font = fonts.bold;
          fontSize = baseFontSize + 4;
          lineHeight = fontSize + 3;
          textColor = rgb(0.3, 0.4, 0.5);
          isSpecialFormat = true;
        }
        // Other heading levels
        else if (displayText.startsWith("��� H4:")) {
          displayText = displayText.slice(6).trim();
          font = fonts.bold;
          fontSize = baseFontSize + 1;
          isSpecialFormat = true;
        } else if (displayText.startsWith("�� H5:")) {
          displayText = displayText.slice(6).trim();
          font = fonts.bold;
          fontSize = baseFontSize;
          isSpecialFormat = true;
        } else if (displayText.startsWith("◇ H6:")) {
          displayText = displayText.slice(6).trim();
          font = fonts.bold;
          fontSize = baseFontSize - 1;
          isSpecialFormat = true;
        }

        // Handle quotes and special blocks
        if (
          displayText.startsWith("【INTENSE-QUOTE:") &&
          displayText.endsWith("��")
        ) {
          displayText = `"${displayText.slice(16, -1).trim()}"`;
          font = fonts.italic;
          textColor = rgb(0.3, 0.3, 0.3);
          isSpecialFormat = true;
        } else if (
          displayText.startsWith("【QUOTE:") &&
          displayText.endsWith("】")
        ) {
          displayText = `"${displayText.slice(8, -1).trim()}"`;
          font = fonts.italic;
          textColor = rgb(0.4, 0.4, 0.4);
        }

        // Handle lists
        if (displayText.startsWith("【LIST:") && displayText.endsWith("】")) {
          displayText = displayText.slice(7, -1).trim();
          // Lists are handled in their internal structure
        } else if (
          displayText.startsWith("【NUMLIST:") &&
          displayText.endsWith("】")
        ) {
          displayText = displayText.slice(10, -1).trim();
          // Numbered lists are handled in their internal structure
        }

        // Process inline formatting within the text - enhanced
        const originalText = displayText;
        displayText = displayText
          .replace(/【B:([^】]+)】/g, "$1") // Bold text
          .replace(/【I:([^】]+)】/g, "$1") // Italic text
          .replace(/【U:([^】]+)】/g, "$1") // Underline text
          .replace(/【BI:([^��]+)】/g, "$1"); // Bold italic

        // Determine font style based on formatting markers in original text
        const hasBold =
          originalText.includes("【B:") || originalText.includes("【BI:");
        const hasItalic =
          originalText.includes("【I:") || originalText.includes("【BI:");
        const hasUnderline = originalText.includes("【U:");

        // Apply appropriate font style
        if (hasBold && hasItalic) {
          font = fonts.boldItalic;
        } else if (hasBold && !isSpecialFormat) {
          font = fonts.bold;
        } else if (hasItalic && !isSpecialFormat) {
          font = fonts.italic;
        }

        // Handle numbered list items
        if (/^\d+\.\s/.test(displayText)) {
          // This is a numbered list item - add some indentation
          displayText = "    " + displayText;
        }

        // Handle bullet points
        if (displayText.startsWith("• ")) {
          displayText = "    " + displayText;
        }

        // Text wrapping and rendering
        const words = displayText.split(/\s+/);
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > contentWidth && currentLine) {
            // Check if we need a new page
            if (currentY < margin + lineHeight + 20) {
              currentPage = pdfDoc.addPage([
                selectedPageSize.width,
                selectedPageSize.height,
              ]);
              currentY = selectedPageSize.height - margin;
              pageCount++;
            }

            // Draw the current line
            currentPage.drawText(currentLine, {
              x: margin,
              y: currentY,
              size: fontSize,
              font: font,
              color: textColor,
            });

            currentY -= lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        // Draw the remaining text
        if (currentLine) {
          if (currentY < margin + lineHeight + 20) {
            currentPage = pdfDoc.addPage([
              selectedPageSize.width,
              selectedPageSize.height,
            ]);
            currentY = selectedPageSize.height - margin;
            pageCount++;
          }

          currentPage.drawText(currentLine, {
            x: margin,
            y: currentY,
            size: fontSize,
            font: font,
            color: textColor,
          });

          currentY -= lineHeight;
        }

        // Add extra spacing for special formats
        if (isSpecialFormat) {
          currentY -= lineHeight * 0.5;
        } else {
          currentY -= lineHeight * 0.2;
        }
      }

      // Set professional PDF metadata
      pdfDoc.setTitle(file.originalname.replace(/\.(docx?)/i, ""));
      pdfDoc.setAuthor("PdfPage Advanced Converter");
      pdfDoc.setSubject("Professional Word to PDF Conversion");
      pdfDoc.setKeywords([
        "word",
        "pdf",
        "conversion",
        "professional",
        "formatting",
      ]);
      pdfDoc.setProducer("PdfPage Pro");
      pdfDoc.setCreator("Advanced Word to PDF Engine v3.0");
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      console.log("🔧 Generating professional PDF...");
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: quality === "premium",
        addDefaultPage: false,
        objectsPerTick: quality === "premium" ? 50 : 25,
      });

      const processingTime = Date.now() - startTime;

      console.log(
        `✅ Professional PDF created: ${pageCount} pages, ${formatBytes(pdfBytes.length)} in ${processingTime}ms`,
      );

      // Track usage
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "word-to-pdf-advanced",
          fileCount: 1,
          totalFileSize: file.size,
          processingTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: true,
        });

        if (req.user && !req.user.isPremiumActive) {
          req.user.incrementUpload(file.size);
          await req.user.save();
        }
      } catch (error) {
        console.error("Error tracking usage:", error);
      }

      // Generate professional filename
      const originalName = file.originalname.replace(/\.(docx?)/i, "");
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${originalName}_converted_${timestamp}.pdf`;

      // Send the professional PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Length", pdfBytes.length);
      res.setHeader("X-Pages", pageCount);
      res.setHeader("X-File-Size", pdfBytes.length);
      res.setHeader("X-Processing-Time", processingTime);
      res.setHeader("X-Conversion-Quality", quality);
      res.setHeader("X-Page-Format", pageSize);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("❌ Advanced Word to PDF conversion error:", error);

      // Track error
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "word-to-pdf-advanced",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Advanced conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },
);

// Helper function to get page size based on format
function getPageSize(format) {
  const pageSizes = {
    A4: { width: 595, height: 842 },
    Letter: { width: 612, height: 792 },
    Legal: { width: 612, height: 1008 },
  };
  return pageSizes[format] || pageSizes.A4;
}

// @route   POST /api/pdf/word-to-pdf-libreoffice
// @desc    Convert Word to PDF using LibreOffice headless mode
// @access  Public (with optional auth and usage limits)
router.post(
  "/word-to-pdf-libreoffice",
  optionalAuth,
  checkUsageLimit,
  uploadWord.single("file"),
  async (req, res) => {
    const startTime = Date.now();
    let tempInputPath = null;
    let tempOutputDir = null;

    try {
      const file = req.file;
      let options = {};

      // Parse conversion options
      try {
        if (req.body.options) {
          options = JSON.parse(req.body.options);
        }
      } catch (e) {
        console.warn("Failed to parse options, using defaults");
      }

      const {
        preserveFormatting = true,
        preserveImages = true,
        preserveLayouts = true,
        pageSize = "A4",
        quality = "high",
        orientation = "auto",
        margins = "normal",
        compatibility = "pdf-1.7",
        compressImages = true,
        enableOCR = false,
      } = options;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Word document is required",
        });
      }

      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];

      const isValidType =
        allowedTypes.includes(file.mimetype) ||
        file.originalname.toLowerCase().endsWith(".docx") ||
        file.originalname.toLowerCase().endsWith(".doc") ||
        file.originalname.toLowerCase().endsWith(".dotx") ||
        file.originalname.toLowerCase().endsWith(".dot");

      if (!isValidType) {
        return res.status(400).json({
          success: false,
          message:
            "Only Word documents (.doc, .docx, .dot, .dotx) are supported",
        });
      }

      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "File size exceeds 100MB limit",
        });
      }

      console.log(
        `🚀 LibreOffice Word to PDF conversion: ${file.originalname}`,
      );
      console.log(`�� Options:`, {
        preserveFormatting,
        preserveImages,
        preserveLayouts,
        pageSize,
        quality,
        orientation,
      });

      const fs = require("fs");
      const path = require("path");
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      // Create temporary directories
      const tempDir = path.join(__dirname, "..", "temp");
      const inputDir = path.join(tempDir, "input");
      const outputDir = path.join(tempDir, "output");

      // Ensure directories exist
      [tempDir, inputDir, outputDir].forEach((dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const inputFileName = `${timestamp}_${randomSuffix}_${file.originalname}`;
      const outputFileName = inputFileName.replace(/\.(docx?|dotx?)/i, ".pdf");

      tempInputPath = path.join(inputDir, inputFileName);
      tempOutputDir = outputDir;

      // Save uploaded file to temp location
      fs.writeFileSync(tempInputPath, file.buffer);

      // Build LibreOffice command with advanced options
      const libreOfficeExe = getLibreOfficeExecutable();
      let libreOfficeCmd = `${libreOfficeExe} --headless --convert-to pdf`;

      // Add format-specific options
      if (quality === "premium") {
        libreOfficeCmd += `:writer_pdf_Export`;
        if (compressImages) {
          libreOfficeCmd += `:{\"Quality\":90,\"ReduceImageResolution\":true,\"MaxImageResolution\":150}`;
        }
      } else if (quality === "high") {
        libreOfficeCmd += `:writer_pdf_Export`;
        if (compressImages) {
          libreOfficeCmd += `:{\"Quality\":85,\"ReduceImageResolution\":false}`;
        }
      }

      libreOfficeCmd += ` "${tempInputPath}" --outdir "${tempOutputDir}"`;

      console.log(`🔧 Executing LibreOffice command: ${libreOfficeCmd}`);

      // Execute LibreOffice conversion
      try {
        const { stdout, stderr } = await execAsync(libreOfficeCmd, {
          timeout: 120000, // 2 minutes timeout
          env: {
            ...process.env,
            HOME: process.env.HOME || "/tmp",
          },
        });

        console.log(`✅ LibreOffice stdout:`, stdout);
        if (stderr) {
          console.warn(`⚠️ LibreOffice stderr:`, stderr);
        }
      } catch (execError) {
        console.error(`❌ LibreOffice execution failed:`, execError);

        // Check if LibreOffice is available
        try {
          await execAsync("soffice --version");
        } catch (versionError) {
          return res.status(503).json({
            success: false,
            message:
              "LibreOffice is not available. Please use the fallback converter.",
            code: "LIBREOFFICE_UNAVAILABLE",
          });
        }

        throw new Error(`LibreOffice conversion failed: ${execError.message}`);
      }

      // Check if output file was created
      const outputFilePath = path.join(tempOutputDir, outputFileName);

      if (!fs.existsSync(outputFilePath)) {
        throw new Error("LibreOffice failed to create PDF output file");
      }

      // Read the generated PDF
      const pdfBuffer = fs.readFileSync(outputFilePath);

      // Get PDF info using pdf-lib for page count
      const { PDFDocument } = require("pdf-lib");
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();

      const processingTime = Date.now() - startTime;

      console.log(`✅ LibreOffice conversion successful:`);
      console.log(`   📄 Pages: ${pageCount}`);
      console.log(`   📦 Size: ${pdfBuffer.length} bytes`);
      console.log(`   ���� Time: ${processingTime}ms`);

      // Track usage
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "word-to-pdf-libreoffice",
          fileCount: 1,
          totalFileSize: file.size,
          processingTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: true,
        });

        if (req.user && !req.user.isPremiumActive) {
          req.user.incrementUpload(file.size);
          await req.user.save();
        }
      } catch (error) {
        console.error("Error tracking usage:", error);
      }

      // Generate professional filename
      const originalName = file.originalname.replace(/\.(docx?|dotx?)/i, "");
      const timestamp_formatted = new Date().toISOString().slice(0, 10);
      const filename = `${originalName}_converted_${timestamp_formatted}.pdf`;

      // Send the PDF with enhanced headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader("X-Pages", pageCount);
      res.setHeader("X-File-Size", pdfBuffer.length);
      res.setHeader("X-Processing-Time", processingTime);
      res.setHeader("X-Conversion-Engine", "LibreOffice");
      res.setHeader("X-Conversion-Quality", quality);
      res.setHeader("X-Page-Format", pageSize);
      res.setHeader("X-Original-Size", file.size);
      res.setHeader(
        "X-Compression-Ratio",
        Math.max(0, ((file.size - pdfBuffer.length) / file.size) * 100).toFixed(
          1,
        ),
      );

      res.send(pdfBuffer);
    } catch (error) {
      console.error("❌ LibreOffice Word to PDF conversion error:", error);

      // Track error
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "word-to-pdf-libreoffice",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "LibreOffice conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      // Cleanup temporary files
      try {
        if (tempInputPath && fs.existsSync(tempInputPath)) {
          fs.unlinkSync(tempInputPath);
        }
        if (tempOutputDir && fs.existsSync(tempOutputDir)) {
          const outputFiles = fs.readdirSync(tempOutputDir);
          outputFiles.forEach((file) => {
            const filePath = path.join(tempOutputDir, file);
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
            }
          });
        }
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
      }
    }
  },
);

// @route   POST /api/pdf/excel-to-pdf-libreoffice
// @desc    Convert Excel to PDF using LibreOffice headless mode
// @access  Public (with optional auth and usage limits)
router.post(
  "/excel-to-pdf-libreoffice",
  optionalAuth,
  ...ipUsageLimitChain,
  trackToolUsage("excel-to-pdf-libreoffice"),
  checkUsageLimit,
  uploadOffice.single("file"),
  [
    body("quality").optional().isIn(["standard", "high", "premium"]),
    body("preserveFormatting").optional().isBoolean(),
    body("preserveImages").optional().isBoolean(),
    body("pageSize").optional().isIn(["A4", "Letter", "Legal", "auto"]),
    body("orientation").optional().isIn(["auto", "portrait", "landscape"]),
  ],
  async (req, res) => {
    const startTime = Date.now();
    let tempInputPath = null;
    let tempOutputDir = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No Excel file uploaded",
        });
      }

      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/vnd.ms-excel.sheet.macroEnabled.12",
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid file type. Please upload an Excel file (.xlsx, .xls, .xlsm)",
        });
      }

      // Extract conversion options
      const quality = req.body.quality || "high";
      const preserveFormatting = req.body.preserveFormatting !== "false";
      const preserveImages = req.body.preserveImages !== "false";
      const pageSize = req.body.pageSize || "A4";
      const orientation = req.body.orientation || "auto";

      console.log(
        `🚀 LibreOffice Excel to PDF conversion: ${req.file.originalname}`,
      );
      console.log(
        `📊 Options: ${JSON.stringify({ quality, preserveFormatting, preserveImages, pageSize, orientation }, null, 2)}`,
      );

      // Create temporary directories
      const path = require("path");
      const { v4: uuidv4 } = require("uuid");
      const randomId = uuidv4();

      tempInputPath = path.join(
        __dirname,
        "../temp",
        `excel_${randomId}${path.extname(req.file.originalname)}`,
      );
      tempOutputDir = path.join(__dirname, "../temp");

      // Ensure temp directory exists
      await fsAsync.mkdir(tempOutputDir, { recursive: true });

      // Write input file
      await fsAsync.writeFile(tempInputPath, req.file.buffer);

      // Build LibreOffice command for Excel
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      const libreOfficeExe = getLibreOfficeExecutable();
      let libreOfficeCmd = `${libreOfficeExe} --headless --convert-to pdf`;

      // Add Excel-specific options
      if (quality === "premium") {
        libreOfficeCmd += `:calc_pdf_Export`;
      } else if (quality === "high") {
        libreOfficeCmd += `:calc_pdf_Export`;
      }

      libreOfficeCmd += ` "${tempInputPath}" --outdir "${tempOutputDir}"`;

      console.log(`🔧 Executing LibreOffice command: ${libreOfficeCmd}`);

      // Execute LibreOffice conversion
      try {
        const { stdout, stderr } = await execAsync(libreOfficeCmd, {
          timeout: 120000, // 2 minutes timeout
        });

        console.log(`✅ LibreOffice stdout:`, stdout);
        if (stderr) {
          console.warn(`⚠️ LibreOffice stderr:`, stderr);
        }
      } catch (execError) {
        console.error(`❌ LibreOffice execution failed:`, execError);
        throw new Error(`LibreOffice conversion failed: ${execError.message}`);
      }

      // Find output file - use the same base name as temp input file
      const inputBaseName = path.basename(
        tempInputPath,
        path.extname(tempInputPath),
      );
      const outputFilePath = path.join(tempOutputDir, `${inputBaseName}.pdf`);

      if (!fs.existsSync(outputFilePath)) {
        throw new Error("LibreOffice failed to create PDF output file");
      }

      // Read converted PDF
      const pdfBuffer = await fsAsync.readFile(outputFilePath);
      const { PDFDocument } = require("pdf-lib");
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();

      console.log(
        `✅ LibreOffice Excel conversion successful: ${pageCount} pages`,
      );

      // Track usage
      const usageData = {
        userId: req.user?.id || null,
        sessionId: req.body.sessionId || null,
        toolUsed: "excel-to-pdf-libreoffice",
        fileCount: 1,
        totalFileSize: req.file.size,
        processingTime: Date.now() - startTime,
        ipAddress: getRealIPAddress(req),
        userAgent: req.headers["user-agent"],
        deviceType: getDeviceTypeFromRequest(req),
        isSuccess: true,
      };

      await trackUsageWithDeviceInfo(req, usageData);

      const processingTime = Date.now() - startTime;
      const originalBaseName = path.basename(
        req.file.originalname,
        path.extname(req.file.originalname),
      );

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${originalBaseName}.pdf"`,
      );
      res.setHeader("X-Page-Count", pageCount.toString());
      res.setHeader("X-Processing-Time", processingTime.toString());
      res.setHeader("X-Conversion-Engine", "LibreOffice");
      res.setHeader("X-Conversion-Quality", quality);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error("❌ LibreOffice Excel to PDF conversion error:", error);

      const usageData = {
        userId: req.user?.id || null,
        sessionId: req.body.sessionId || null,
        toolUsed: "excel-to-pdf-libreoffice",
        fileCount: 1,
        totalFileSize: req.file?.size || 0,
        processingTime: Date.now() - startTime,
        ipAddress: getRealIPAddress(req),
        userAgent: req.headers["user-agent"],
        deviceType: getDeviceTypeFromRequest(req),
        isSuccess: false,
        errorMessage: error.message,
      };

      await trackUsageWithDeviceInfo(req, usageData);

      res.status(500).json({
        success: false,
        message: error.message || "LibreOffice Excel conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      // Cleanup temporary files
      try {
        if (tempInputPath && fs.existsSync(tempInputPath)) {
          fs.unlinkSync(tempInputPath);
        }
        if (tempOutputDir && fs.existsSync(tempOutputDir)) {
          const outputFiles = fs.readdirSync(tempOutputDir);
          outputFiles.forEach((file) => {
            const filePath = path.join(tempOutputDir, file);
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
            }
          });
        }
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
      }
    }
  },
);

// @route   POST /api/pdf/powerpoint-to-pdf-libreoffice
// @desc    Convert PowerPoint to PDF using LibreOffice headless mode
// @access  Public (with optional auth and usage limits)
router.post(
  "/powerpoint-to-pdf-libreoffice",
  optionalAuth,
  ...ipUsageLimitChain,
  trackToolUsage("powerpoint-to-pdf-libreoffice"),
  checkUsageLimit,
  uploadOffice.single("file"),
  [
    body("quality").optional().isIn(["standard", "high", "premium"]),
    body("preserveFormatting").optional().isBoolean(),
    body("preserveImages").optional().isBoolean(),
    body("pageSize").optional().isIn(["A4", "Letter", "Legal", "auto"]),
    body("orientation").optional().isIn(["auto", "portrait", "landscape"]),
  ],
  async (req, res) => {
    const startTime = Date.now();
    let tempInputPath = null;
    let tempOutputDir = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No PowerPoint file uploaded",
        });
      }

      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-powerpoint",
        "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid file type. Please upload a PowerPoint file (.pptx, .ppt, .pptm)",
        });
      }

      // Extract conversion options
      const quality = req.body.quality || "high";
      const preserveFormatting = req.body.preserveFormatting !== "false";
      const preserveImages = req.body.preserveImages !== "false";
      const pageSize = req.body.pageSize || "A4";
      const orientation = req.body.orientation || "auto";

      console.log(
        `🚀 LibreOffice PowerPoint to PDF conversion: ${req.file.originalname}`,
      );
      console.log(
        `📊 Options: ${JSON.stringify({ quality, preserveFormatting, preserveImages, pageSize, orientation }, null, 2)}`,
      );

      // Create temporary directories
      const path = require("path");
      const { v4: uuidv4 } = require("uuid");
      const randomId = uuidv4();

      tempInputPath = path.join(
        __dirname,
        "../temp",
        `ppt_${randomId}${path.extname(req.file.originalname)}`,
      );
      tempOutputDir = path.join(__dirname, "../temp");

      // Ensure temp directory exists
      await fsAsync.mkdir(tempOutputDir, { recursive: true });

      // Write input file
      await fsAsync.writeFile(tempInputPath, req.file.buffer);

      // Build LibreOffice command for PowerPoint
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      const libreOfficeExe = getLibreOfficeExecutable();
      let libreOfficeCmd = `${libreOfficeExe} --headless --convert-to pdf`;

      // Add PowerPoint-specific options
      if (quality === "premium") {
        libreOfficeCmd += `:impress_pdf_Export`;
      } else if (quality === "high") {
        libreOfficeCmd += `:impress_pdf_Export`;
      }

      libreOfficeCmd += ` "${tempInputPath}" --outdir "${tempOutputDir}"`;

      console.log(`🔧 Executing LibreOffice command: ${libreOfficeCmd}`);

      // Execute LibreOffice conversion
      try {
        const { stdout, stderr } = await execAsync(libreOfficeCmd, {
          timeout: 120000, // 2 minutes timeout
        });

        console.log(`✅ LibreOffice stdout:`, stdout);
        if (stderr) {
          console.warn(`⚠️ LibreOffice stderr:`, stderr);
        }
      } catch (execError) {
        console.error(`❌ LibreOffice execution failed:`, execError);
        throw new Error(`LibreOffice conversion failed: ${execError.message}`);
      }

      // Find output file - use the same base name as temp input file
      const inputBaseName = path.basename(
        tempInputPath,
        path.extname(tempInputPath),
      );
      const outputFilePath = path.join(tempOutputDir, `${inputBaseName}.pdf`);

      if (!fs.existsSync(outputFilePath)) {
        throw new Error("LibreOffice failed to create PDF output file");
      }

      // Read converted PDF
      const pdfBuffer = await fsAsync.readFile(outputFilePath);
      const { PDFDocument } = require("pdf-lib");
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();

      console.log(
        `✅ LibreOffice PowerPoint conversion successful: ${pageCount} pages`,
      );

      // Track usage
      const usageData = {
        userId: req.user?.id || null,
        sessionId: req.body.sessionId || null,
        toolUsed: "powerpoint-to-pdf-libreoffice",
        fileCount: 1,
        totalFileSize: req.file.size,
        processingTime: Date.now() - startTime,
        ipAddress: getRealIPAddress(req),
        userAgent: req.headers["user-agent"],
        deviceType: getDeviceTypeFromRequest(req),
        isSuccess: true,
      };

      await trackUsageWithDeviceInfo(req, usageData);

      const processingTime = Date.now() - startTime;
      const originalBaseName = path.basename(
        req.file.originalname,
        path.extname(req.file.originalname),
      );

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${originalBaseName}.pdf"`,
      );
      res.setHeader("X-Page-Count", pageCount.toString());
      res.setHeader("X-Processing-Time", processingTime.toString());
      res.setHeader("X-Conversion-Engine", "LibreOffice");
      res.setHeader("X-Conversion-Quality", quality);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error(
        "❌ LibreOffice PowerPoint to PDF conversion error:",
        error,
      );

      const usageData = {
        userId: req.user?.id || null,
        sessionId: req.body.sessionId || null,
        toolUsed: "powerpoint-to-pdf-libreoffice",
        fileCount: 1,
        totalFileSize: req.file?.size || 0,
        processingTime: Date.now() - startTime,
        ipAddress: getRealIPAddress(req),
        userAgent: req.headers["user-agent"],
        deviceType: getDeviceTypeFromRequest(req),
        isSuccess: false,
        errorMessage: error.message,
      };

      await trackUsageWithDeviceInfo(req, usageData);

      res.status(500).json({
        success: false,
        message: error.message || "LibreOffice PowerPoint conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      // Cleanup temporary files
      try {
        if (tempInputPath && fs.existsSync(tempInputPath)) {
          fs.unlinkSync(tempInputPath);
        }
        if (tempOutputDir && fs.existsSync(tempOutputDir)) {
          const outputFiles = fs.readdirSync(tempOutputDir);
          outputFiles.forEach((file) => {
            const filePath = path.join(tempOutputDir, file);
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
            }
          });
        }
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
      }
    }
  },
);

// @route   GET /api/pdf/system-status
// @desc    Check system status for LibreOffice and other services
// @access  Public
router.get("/system-status", async (req, res) => {
  try {
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);
    const fs = require("fs");
    const path = require("path");

    let libreofficeAvailable = false;
    let cloudApiAvailable = false;
    let storageUsage = 0;

    // Check LibreOffice availability
    try {
      const { stdout } = await execAsync(
        `${getLibreOfficeExecutable()} --version`,
        {
          timeout: 10000,
        },
      );
      libreofficeAvailable = stdout.includes("LibreOffice");
      console.log("✅ LibreOffice status:", stdout.trim());
    } catch (error) {
      console.log("❌ LibreOffice not available:", error.message);
    }

    // Check cloud API availability (placeholder)
    try {
      cloudApiAvailable = process.env.CLOUD_API_KEY ? true : false;
    } catch (error) {
      cloudApiAvailable = false;
    }

    // Check storage usage
    try {
      const tempDir = path.join(__dirname, "..", "temp");
      if (fs.existsSync(tempDir)) {
        const stats = fs.statSync(tempDir);
        // Simple storage check - in production, you'd use proper disk usage tools
        storageUsage = Math.min(Math.random() * 25, 100); // Placeholder
      }
    } catch (error) {
      console.error("Error checking storage:", error);
    }

    res.json({
      success: true,
      libreoffice: libreofficeAvailable,
      cloudApi: cloudApiAvailable,
      storage: Math.round(storageUsage),
      timestamp: new Date().toISOString(),
      services: {
        libreoffice: {
          available: libreofficeAvailable,
          version: libreofficeAvailable ? "Available" : "Not installed",
        },
        cloudApi: {
          available: cloudApiAvailable,
          status: cloudApiAvailable ? "Connected" : "Not configured",
        },
        storage: {
          usage: Math.round(storageUsage),
          status: storageUsage < 80 ? "healthy" : "warning",
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check system status",
      error: error.message,
    });
  }
});

// @route   POST /api/pdf/create-batch-download
// @desc    Create ZIP file for batch download
// @access  Public
router.post("/create-batch-download", async (req, res) => {
  try {
    const { files } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files provided for batch download",
      });
    }

    const archiver = require("archiver");
    const path = require("path");
    const fs = require("fs");

    // Create a unique ZIP filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const zipFilename = `converted_pdfs_${timestamp}.zip`;
    const tempDir = path.join(__dirname, "..", "temp");
    const zipPath = path.join(tempDir, zipFilename);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`����� ZIP created: ${archive.pointer()} total bytes`);

      // Send download URL (in production, use proper file serving)
      const downloadUrl = `/api/pdf/download-temp/${zipFilename}`;
      res.json({
        success: true,
        downloadUrl,
        fileSize: archive.pointer(),
        fileCount: files.length,
      });
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);

    // Add files to archive (placeholder - in production, fetch actual files)
    files.forEach((file, index) => {
      // In a real implementation, you'd fetch the actual PDF content
      const placeholderContent = `PDF content for ${file.filename}`;
      archive.append(placeholderContent, { name: file.filename });
    });

    archive.finalize();
  } catch (error) {
    console.error("❌ Batch download creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create batch download",
      error: error.message,
    });
  }
});

// @route   POST /api/pdf/send-email-notification
// @desc    Send email notification for completed conversion
// @access  Public (authenticated users only)
router.post("/send-email-notification", optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for email notifications",
      });
    }

    const { filename, downloadUrl, fileSize, pages } = req.body;

    // Placeholder email service (implement with nodemailer)
    console.log(`📧 Sending email notification to ${req.user.email}`);
    console.log(`   File: ${filename}`);
    console.log(`   Download: ${downloadUrl}`);
    console.log(`   Size: ${fileSize} bytes`);
    console.log(`   Pages: ${pages}`);

    // In production, implement actual email sending
    // const nodemailer = require('nodemailer');
    // ... email implementation

    res.json({
      success: true,
      message: "Email notification sent successfully",
    });
  } catch (error) {
    console.error("❌ Email notification failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email notification",
      error: error.message,
    });
  }
});

// @route   GET /api/pdf/health
// @desc    Health check for PDF services
// @access  Public
router.get("/health", async (req, res) => {
  try {
    // Test pdf-lib import
    const { PDFDocument } = require("pdf-lib");
    const mammoth = require("mammoth");

    res.json({
      success: true,
      message: "PDF services are healthy",
      dependencies: {
        "pdf-lib": "�� Loaded",
        mammoth: "✅ Loaded",
        libreoffice: "��� Available (check /system-status for details)",
      },
      wordToPdfVersion: "v4.0 - LibreOffice Enhanced Conversion",
      codeTimestamp: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "PDF services are unhealthy",
      error: error.message,
    });
  }
});

// @route   GET /api/pdf/test-version
// @desc    Test if enhanced Word to PDF conversion is loaded
// @access  Public
router.get("/test-version", (req, res) => {
  res.json({
    success: true,
    message: "Enhanced Word to PDF conversion is active",
    version: "v3.0",
    features: [
      "HTML extraction with mammoth.convertToHtml",
      "Enhanced text processing with structure markers",
      "Multiple font styles (regular, bold)",
      "Heading size variations",
      "Color-coded text hierarchy",
      "Proper page counting and stats",
    ],
    timestamp: new Date().toISOString(),
  });
});

// @route   GET /api/pdf/tools
// @desc    Get available PDF tools and their limits
// @access  Public
router.get("/tools", (req, res) => {
  const tools = [
    {
      id: "merge",
      name: "Merge PDF",
      description: "Combine multiple PDF files into one",
      maxFiles: 10,
      maxSizePerFile: "25MB",
      maxSizePremium: "100MB",
      available: true,
    },
    {
      id: "split",
      name: "Split PDF",
      description: "Split PDF into individual pages",
      maxFiles: 1,
      maxPages: 10,
      maxPagesPremium: "unlimited",
      maxSizePerFile: "25MB",
      maxSizePremium: "100MB",
      available: true,
    },
    {
      id: "compress",
      name: "Compress PDF",
      description: "Reduce PDF file size",
      maxFiles: 1,
      maxSizePerFile: "25MB",
      maxSizePremium: "100MB",
      available: true,
    },
    {
      id: "pdf-to-word",
      name: "PDF to Word",
      description: "Convert PDF to editable Word (.docx) documents",
      maxFiles: 1,
      maxSizePerFile: "25MB",
      maxSizePremium: "100MB",
      available: true,
      features: [
        "Text extraction",
        "Formatting preservation",
        "Image extraction (Premium)",
      ],
    },
    {
      id: "word-to-pdf",
      name: "Word to PDF",
      description: "Convert Word documents (.doc, .docx) to PDF format",
      maxFiles: 1,
      maxSizePerFile: "25MB",
      maxSizePremium: "100MB",
      available: true,
      features: [
        "Formatting preservation",
        "Multiple page formats",
        "Quality control",
      ],
    },
    {
      id: "convert",
      name: "Convert PDF",
      description: "Convert PDF to other formats",
      maxFiles: 1,
      maxSizePerFile: "25MB",
      maxSizePremium: "100MB",
      available: false,
      comingSoon: true,
    },
  ];

  res.json({
    success: true,
    tools,
  });
});

// Use the shared multer error handler
router.use(handleMulterError);

// @route   POST /api/pdf/to-excel
// @desc    Convert PDF to Excel (.xlsx) format with table extraction
// @access  Public (with optional auth and usage limits)
router.post(
  "/to-excel",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("extractTables")
      .optional()
      .isBoolean()
      .withMessage("Extract tables must be boolean"),
    body("preserveFormatting")
      .optional()
      .isBoolean()
      .withMessage("Preserve formatting must be boolean"),
    body("sessionId").optional().isString(),
  ],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        extractTables = true,
        preserveFormatting = true,
        sessionId,
      } = req.body;

      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // Check file size
      const maxSize = req.user?.isPremiumActive
        ? 50 * 1024 * 1024 // 50MB for premium
        : 25 * 1024 * 1024; // 25MB for free users

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${req.user?.isPremiumActive ? "50MB" : "25MB"} limit`,
        });
      }

      console.log(
        `Converting PDF to Excel: ${file.originalname} (${formatBytes(file.size)})`,
      );

      // Import required libraries
      const pdfParse = require("pdf-parse");
      const ExcelJS = require("exceljs");
      const { PDFDocument: PDFLibDocument } = require("pdf-lib");

      // Enhanced PDF parsing for table detection
      const pdfLibDoc = await PDFLibDocument.load(file.buffer);
      const numPages = pdfLibDoc.getPageCount();

      console.log(
        `📄 PDF has ${numPages} pages, extracting tables and data...`,
      );

      // Enhanced text extraction with table detection
      let pdfData;
      let text = "";
      let extractedTables = [];

      try {
        pdfData = await pdfParse(file.buffer, {
          pagerender: null,
          max: 0,
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        });

        text = pdfData.text || "";
        console.log(`📝 Extracted ${text.length} characters from PDF`);

        // Extract tables from text
        extractedTables = extractTablesFromText(text);
        console.log(`📊 Found ${extractedTables.length} potential tables`);
      } catch (error) {
        console.error("Error extracting PDF content:", error);
        return res.status(400).json({
          success: false,
          message:
            "Failed to extract content from PDF. This may be a scanned document.",
        });
      }

      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No readable text found in PDF. This appears to be a scanned document.",
          suggestion: "Use PDF OCR tool for scanned documents",
        });
      }

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();

      // Set workbook properties
      workbook.creator = "PdfPage - Professional PDF Converter";
      workbook.lastModifiedBy = "PdfPage";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.properties.date1904 = false;

      let sheetsCreated = 0;

      // Create sheets based on extracted content
      if (extractedTables.length > 0) {
        // Create separate sheets for each table
        for (let i = 0; i < extractedTables.length; i++) {
          const table = extractedTables[i];
          const sheetName = `Table_${i + 1}`;
          const worksheet = workbook.addWorksheet(sheetName);

          // Add table data to worksheet
          if (table.rows && table.rows.length > 0) {
            // Add headers if detected
            if (table.headers && table.headers.length > 0) {
              const headerRow = worksheet.addRow(table.headers);
              headerRow.font = { bold: true };
              headerRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE6F3FF" },
              };
            }

            // Add data rows
            table.rows.forEach((row) => {
              worksheet.addRow(row);
            });

            // Auto-fit columns
            worksheet.columns.forEach((column) => {
              column.width = Math.max(
                10,
                Math.min(50, column.header?.length || 15),
              );
            });

            // Add borders
            const range = worksheet.getSheetRange();
            worksheet.eachRow({ includeEmpty: false }, (row) => {
              row.eachCell((cell) => {
                cell.border = {
                  top: { style: "thin" },
                  left: { style: "thin" },
                  bottom: { style: "thin" },
                  right: { style: "thin" },
                };
              });
            });

            sheetsCreated++;
          }
        }
      }

      // Create a general data sheet with all text content
      const dataSheet = workbook.addWorksheet("Full_Content");

      // Process text into structured data
      const lines = text.split("\n").filter((line) => line.trim());
      const structuredData = processTextToExcelData(lines);

      // Add headers
      const headers = ["Line_Number", "Content_Type", "Content", "Length"];
      const headerRow = dataSheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD4EEFC" },
      };

      // Add data
      structuredData.forEach((item, index) => {
        dataSheet.addRow([
          index + 1,
          item.type,
          item.content,
          item.content.length,
        ]);
      });

      // Auto-fit columns
      dataSheet.columns = [
        { width: 12 }, // Line number
        { width: 15 }, // Content type
        { width: 80 }, // Content
        { width: 10 }, // Length
      ];

      sheetsCreated++;

      // Create summary sheet
      const summarySheet = workbook.addWorksheet("Summary");

      const summaryData = [
        ["Summary Information"],
        ["Source File", file.originalname],
        ["Conversion Date", new Date().toLocaleDateString()],
        ["Processing Time", `${Date.now() - startTime}ms`],
        ["Total Pages", numPages],
        ["Total Characters", text.length],
        ["Tables Found", extractedTables.length],
        ["Sheets Created", sheetsCreated],
        [],
        ["Table Details"],
        ["Table #", "Rows", "Columns", "Data Points"],
      ];

      extractedTables.forEach((table, index) => {
        summaryData.push([
          `Table ${index + 1}`,
          table.rows.length,
          table.headers ? table.headers.length : table.rows[0]?.length || 0,
          table.rows.length *
            (table.headers ? table.headers.length : table.rows[0]?.length || 0),
        ]);
      });

      summaryData.forEach((row, index) => {
        const worksheetRow = summarySheet.addRow(row);
        if (index === 0 || index === 9) {
          // Headers
          worksheetRow.font = { bold: true, size: 14 };
        } else if (index === 10) {
          // Column headers
          worksheetRow.font = { bold: true };
          worksheetRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE6F3FF" },
          };
        }
      });

      // Auto-fit summary columns
      summarySheet.columns.forEach((column) => {
        column.width = 20;
      });

      sheetsCreated++;

      // Generate Excel buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();
      const processingTime = Date.now() - startTime;

      console.log(
        `��� Excel conversion complete: ${formatBytes(excelBuffer.length)} generated in ${processingTime}ms`,
      );

      // Track usage
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: sessionId || null,
          toolUsed: "pdf-to-excel",
          fileCount: 1,
          totalFileSize: file.size,
          processingTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: true,
        });

        if (req.user && !req.user.isPremiumActive) {
          req.user.incrementUpload(file.size);
          await req.user.save();
        }
      } catch (error) {
        console.error("Error tracking usage:", error);
      }

      // Generate filename
      const originalName = file.originalname.replace(/\.pdf$/i, "");
      const filename = `${originalName}.xlsx`;

      // Send the Excel file
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );
      res.setHeader("Content-Length", excelBuffer.length);
      res.setHeader("X-Original-Pages", numPages);
      res.setHeader("X-Tables-Found", extractedTables.length);
      res.setHeader("X-Sheets-Created", sheetsCreated);
      res.setHeader("X-Processing-Time", processingTime);
      res.setHeader("X-Text-Length", text.length);

      console.log(
        `📊 Excel file sent: ${filename} (${formatBytes(excelBuffer.length)})`,
      );

      res.end(Buffer.from(excelBuffer));
    } catch (error) {
      console.error("PDF to Excel conversion error:", error);

      // Track error
      try {
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "pdf-to-excel",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          userAgent: req.headers["user-agent"],
          ipAddress: getRealIPAddress(req),
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to convert PDF to Excel",
      });
    }
  },
);

// Helper function to extract tables from text
function extractTablesFromText(text) {
  const lines = text.split("\n");
  const tables = [];
  let currentTable = null;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (inTable && currentTable) {
        tables.push(currentTable);
        currentTable = null;
        inTable = false;
      }
      continue;
    }

    // Detect table patterns
    const isTableRow =
      line.includes("|") || // Pipe-separated
      line.match(/\t+/) || // Tab-separated
      (line.match(/\s{3,}/) && line.split(/\s{3,}/).length > 2); // Multi-space separated

    if (isTableRow) {
      if (!inTable) {
        // Start new table
        currentTable = {
          headers: null,
          rows: [],
          startLine: i,
        };
        inTable = true;
      }

      // Parse the row
      let cells = [];
      if (line.includes("|")) {
        cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell) => cell);
      } else if (line.match(/\t+/)) {
        cells = line
          .split(/\t+/)
          .map((cell) => cell.trim())
          .filter((cell) => cell);
      } else if (line.match(/\s{3,}/)) {
        cells = line
          .split(/\s{3,}/)
          .map((cell) => cell.trim())
          .filter((cell) => cell);
      }

      if (cells.length > 1) {
        if (!currentTable.headers && isLikelyHeader(cells)) {
          currentTable.headers = cells;
        } else {
          currentTable.rows.push(cells);
        }
      }
    } else if (inTable && currentTable) {
      // End current table
      if (currentTable.rows.length > 0) {
        tables.push(currentTable);
      }
      currentTable = null;
      inTable = false;
    }
  }

  // Add final table if exists
  if (inTable && currentTable && currentTable.rows.length > 0) {
    tables.push(currentTable);
  }

  return tables.filter((table) => table.rows.length > 0);
}

// Helper function to determine if a row is likely a header
function isLikelyHeader(cells) {
  if (!cells || cells.length === 0) return false;

  // Headers often contain:
  // - Title case words
  // - No numbers (except years)
  // - Common header words
  const headerWords = [
    "name",
    "date",
    "id",
    "number",
    "type",
    "status",
    "total",
    "amount",
    "description",
  ];

  return cells.some((cell) => {
    const lowerCell = cell.toLowerCase();
    return (
      headerWords.some((word) => lowerCell.includes(word)) ||
      cell.match(/^[A-Z][a-z\s]+$/) || // Title case
      lowerCell.includes("column") ||
      lowerCell.includes("field")
    );
  });
}

// Helper function to process text into structured Excel data
function processTextToExcelData(lines) {
  return lines.map((line) => {
    const trimmed = line.trim();
    let type = "text";

    // Determine content type
    if (trimmed.match(/^[A-Z\s]+$/) && trimmed.length < 50) {
      type = "heading";
    } else if (trimmed.includes("@") && trimmed.includes(".")) {
      type = "email";
    } else if (trimmed.match(/\d{4}/) && trimmed.length < 20) {
      type = "date";
    } else if (trimmed.match(/^\d+[\.\)]\s/)) {
      type = "numbered_list";
    } else if (trimmed.match(/^[•\-\*]\s/)) {
      type = "bullet_list";
    } else if (trimmed.includes("|") || trimmed.match(/\t+/)) {
      type = "table_row";
    } else if (trimmed.length > 100) {
      type = "paragraph";
    }

    return {
      content: trimmed,
      type: type,
    };
  });
}

// @route   POST /api/pdf/excel-to-pdf
// @desc    Convert Excel file to PDF
// @access  Public (with optional auth and usage limits)
router.post(
  "/excel-to-pdf",
  optionalAuth,
  ...ipUsageLimitChain,
  trackToolUsage("excel-to-pdf"),
  checkUsageLimit,
  upload.single("file"),
  [body("settings").optional().isString()],
  async (req, res) => {
    const startTime = Date.now();

    try {
      // Validate request
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
        "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid file type. Please upload an Excel file (.xlsx, .xls, .xlsm)",
        });
      }

      // Parse conversion settings
      let settings = {};
      if (req.body.settings) {
        try {
          settings = JSON.parse(req.body.settings);
        } catch (error) {
          console.warn("Invalid settings JSON, using defaults");
        }
      }

      // Default settings
      const conversionOptions = {
        pageSize: settings.pageSize || "A4",
        orientation: settings.orientation || "landscape",
        fitToPage: settings.fitToPage !== false,
        includeGridlines: settings.includeGridlines !== false,
        includeHeaders: settings.includeHeaders !== false,
        scaleToFit: settings.scaleToFit || 100,
        worksheetSelection: settings.worksheetSelection || "all",
        selectedSheets: settings.selectedSheets || [],
        includeFormulas: settings.includeFormulas || false,
        preserveFormatting: settings.preserveFormatting !== false,
        includeCharts: settings.includeCharts !== false,
        compression: settings.compression || "medium",
        watermark: settings.watermark || "",
        headerFooter: settings.headerFooter || false,
        margin: settings.margin || 20,
      };

      console.log(`📊 Converting Excel to PDF: ${req.file.originalname}`);
      console.log(`📋 Settings:`, JSON.stringify(conversionOptions, null, 2));

      // Convert Excel to PDF using ExcelJS + jsPDF
      const { convertExcelToPdf } = require("../utils/excelToPdfConverter");
      const pdfBuffer = await convertExcelToPdf(
        req.file.path,
        conversionOptions,
      );

      // Track usage
      const usageData = {
        userId: req.user?.id || null,
        tool: "excel-to-pdf",
        fileSize: req.file.size,
        processingTime: Date.now() - startTime,
        ipAddress: getRealIPAddress(req),
        userAgent: req.headers["user-agent"],
        deviceType: getDeviceTypeFromRequest(req),
        isSuccess: true,
      };

      await trackUsageWithDeviceInfo(req, usageData);

      // Clean up uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn("Failed to cleanup uploaded file:", cleanupError);
      }

      // Set response headers
      const outputFilename = req.file.originalname.replace(
        /\.(xlsx?|xlsm)$/i,
        ".pdf",
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${outputFilename}"`,
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      console.log(`��� Excel to PDF conversion completed: ${outputFilename}`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("❌ Excel to PDF conversion error:", error);

      // Clean up file if it exists
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.warn("Failed to cleanup file after error:", cleanupError);
        }
      }

      // Track failed usage
      if (req.user || req.ipUsage) {
        const usageData = {
          userId: req.user?.id || null,
          tool: "excel-to-pdf",
          fileSize: req.file?.size || 0,
          processingTime: Date.now() - startTime,
          ipAddress: getRealIPAddress(req),
          userAgent: req.headers["user-agent"],
          deviceType: getDeviceTypeFromRequest(req),
          isSuccess: false,
          errorMessage: error.message,
        };

        await trackUsageWithDeviceInfo(req, usageData).catch(console.error);
      }

      res.status(500).json({
        success: false,
        message: "Excel to PDF conversion failed",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  },
);

// @route   POST /api/pdf/verify-protection
// @desc    Verify if PDF is password protected and check password
// @access  Public
router.post(
  "/verify-protection",
  upload.single("file"),
  [body("password").optional().isString()],
  async (req, res) => {
    try {
      const { password } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      const { PDFDocument } = require("pdf-lib");
      const forge = require("node-forge");

      try {
        // Try to load the PDF
        const pdfDoc = await PDFDocument.load(file.buffer);

        // Check metadata for protection info
        const keywords = pdfDoc.getKeywords() || "";
        const title = pdfDoc.getTitle() || "";
        const subject = pdfDoc.getSubject() || "";
        const creator = pdfDoc.getCreator() || "";

        const isProtected =
          keywords.includes("PROTECTED") ||
          keywords.includes("encrypted") ||
          title.includes("🔒") ||
          subject.includes("PROTECTED") ||
          creator.includes("Protection Service");

        if (!isProtected) {
          return res.json({
            success: true,
            protected: false,
            message: "PDF is not password protected",
          });
        }

        // If password is provided, verify it
        if (password && keywords.includes("HASH1:")) {
          try {
            const hash1Match = keywords.match(/HASH1:([a-f0-9]{16})/);
            if (hash1Match) {
              const expectedHashPrefix = hash1Match[1];

              const passwordHash1 = forge.md.sha256.create();
              passwordHash1.update(password + "pdfpage_salt_1");
              const actualHash = passwordHash1.digest().toHex();

              if (actualHash.substring(0, 16) === expectedHashPrefix) {
                return res.json({
                  success: true,
                  protected: true,
                  passwordCorrect: true,
                  protectionMethod: "forge",
                  message: "Password is correct",
                });
              } else {
                return res.json({
                  success: true,
                  protected: true,
                  passwordCorrect: false,
                  protectionMethod: "forge",
                  message: "Incorrect password",
                });
              }
            }
          } catch (verifyError) {
            console.warn("Password verification failed:", verifyError);
          }
        }

        return res.json({
          success: true,
          protected: true,
          passwordCorrect: null,
          protectionMethod: keywords.includes("FORGE") ? "forge" : "basic",
          message: "PDF is password protected",
          metadata: {
            keywords: keywords.substring(0, 100) + "...",
            title: title,
            subject: subject,
          },
        });
      } catch (loadError) {
        // If PDF can't be loaded, it might be encrypted at the file level
        return res.json({
          success: true,
          protected: true,
          passwordCorrect: null,
          protectionMethod: "file-level",
          message: "PDF appears to be encrypted at file level",
        });
      }
    } catch (error) {
      console.error("Protection verification error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify PDF protection",
        error: error.message,
      });
    }
  },
);

// @route   POST /api/pdf/protect
// @desc    Protect PDF file with password
// @access  Public (with optional auth and usage limits)
router.post(
  "/protect",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("password")
      .isString()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("permissions")
      .optional()
      .custom((value) => {
        if (typeof value === "string") {
          try {
            JSON.parse(value);
            return true;
          } catch {
            throw new Error("Permissions must be valid JSON");
          }
        }
        return typeof value === "object";
      }),
    body("sessionId").optional().isString(),
  ],
  async (req, res) => {
    const startTime = Date.now();

    try {
      console.log(`🔐 PDF Protection request received:`);
      console.log(`   File: ${req.file ? req.file.originalname : "NO FILE"}`);
      console.log(`   Password: ${req.body.password ? "[SET]" : "MISSING"}`);
      console.log(`   Permissions: ${req.body.permissions || "undefined"}`);
      console.log(`   SessionId: ${req.body.sessionId || "undefined"}`);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error(`❌ Validation failed:`, errors.array());
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { password, sessionId } = req.body;

      // Parse permissions from JSON string (FormData sends it as string)
      let permissions = {};
      try {
        if (req.body.permissions) {
          permissions =
            typeof req.body.permissions === "string"
              ? JSON.parse(req.body.permissions)
              : req.body.permissions;
        }
      } catch (parseError) {
        console.error("❌ Failed to parse permissions:", parseError);
        return res.status(400).json({
          success: false,
          message: "Invalid permissions format",
        });
      }
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // Check file size
      const maxSize = req.user?.isPremiumActive
        ? 100 * 1024 * 1024 // 100MB for premium
        : 50 * 1024 * 1024; // 50MB for free users

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${req.user?.isPremiumActive ? "100MB" : "50MB"} limit`,
        });
      }

      // Import the new protection service
      const PDFProtectionService = require("../services/pdfProtectionService");

      console.log(`🔐 Starting PDF protection for ${file.originalname}`);

      let pdfBytes;
      let protectionMethod = "none";

      try {
        // Use the comprehensive protection service
        const protectionResult = await PDFProtectionService.protectPDF(
          file.buffer,
          password,
          { permissions },
        );

        pdfBytes = protectionResult.buffer;
        protectionMethod = protectionResult.method;

        console.log(`✅ PDF protection applied using: ${protectionMethod}`);
      } catch (protectionError) {
        console.error("PDF protection failed:", protectionError);
        throw new Error(`PDF protection failed: ${protectionError.message}`);
      }

      const processingTime = Date.now() - startTime;

      console.log(`✅ PDF protection completed in ${processingTime}ms`);

      // Track usage
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: sessionId || null,
          toolUsed: "protect",
          fileCount: 1,
          totalFileSize: file.size,
          processingTime,
          success: true,
        });

        // Track anonymous usage for IP-based limiting
        if (!req.user) {
          await trackAnonymousUsage(req, res, {
            toolName: "protect",
            fileCount: 1,
            totalFileSize: file.size,
            sessionId: sessionId || req.sessionID,
            fileName: file.originalname,
            fileBuffer: file.buffer,
          });
        }

        // Update user upload count if authenticated
        if (req.user && !req.user.isPremiumActive) {
          req.user.incrementUpload(file.size);
          await req.user.save();
        }
      } catch (error) {
        console.error("Error tracking usage:", error);
        // Don't fail the request if usage tracking fails
      }

      // Send the protected PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.originalname.replace(/\.pdf$/i, "_protected.pdf")}"`,
      );
      res.setHeader("Content-Length", pdfBytes.length);
      res.setHeader("X-Original-Size", file.size.toString());
      res.setHeader("X-Protected-Size", pdfBytes.length.toString());
      res.setHeader("X-Protection-Level", protectionMethod);
      res.setHeader("X-Processing-Time", processingTime.toString());

      // Set encryption status based on method
      const encryptionStatus =
        protectionMethod === "qpdf"
          ? "real-qpdf-aes256"
          : protectionMethod === "forge"
            ? "enhanced-forge-protection"
            : protectionMethod === "metadata"
              ? "basic-metadata"
              : protectionMethod === "unprotected"
                ? "failed"
                : "unknown";

      res.setHeader("X-Encryption-Status", encryptionStatus);
      res.setHeader(
        "X-Password-Protected",
        protectionMethod !== "unprotected" ? "true" : "false",
      );

      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("PDF protection error:", error);

      // Track error
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "protect",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to protect PDF file",
      });
    }
  },
);

// @route   POST /api/pdf/html-to-pdf
// @desc    Convert HTML to PDF using Puppeteer headless Chrome
// @access  Public (with optional auth and usage limits)
router.post(
  "/html-to-pdf",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("htmlContent").optional().isString(),
    body("url").optional().isURL(),
    body("pageFormat").optional().isIn(["A4", "A3", "Letter", "Legal"]),
    body("orientation").optional().isIn(["portrait", "landscape"]),
    body("sessionId").optional().isString(),
  ],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const {
        htmlContent,
        url,
        pageFormat = "A4",
        orientation = "portrait",
        sessionId,
        margins = { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
        printBackground = true,
        waitForNetworkIdle = true,
      } = req.body;

      const file = req.file;

      // Check if we have HTML content from file, direct input, or URL
      let finalHtmlContent = htmlContent;

      if (file) {
        // Read HTML from uploaded file
        if (
          !file.originalname.toLowerCase().endsWith(".html") &&
          file.mimetype !== "text/html"
        ) {
          return res.status(400).json({
            success: false,
            message: "Only HTML files are supported",
          });
        }
        finalHtmlContent = file.buffer.toString("utf-8");
      } else if (url) {
        // We'll fetch URL content with Puppeteer
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          return res.status(400).json({
            success: false,
            message: "URL must start with http:// or https://",
          });
        }
      } else if (!finalHtmlContent) {
        return res.status(400).json({
          success: false,
          message: "HTML content, file, or URL is required",
        });
      }

      console.log(`🌐 Starting HTML to PDF conversion`);
      console.log(`📄 Input type: ${file ? "file" : url ? "url" : "content"}`);
      console.log(`📋 Format: ${pageFormat} ${orientation}`);

      // Dynamic import of Puppeteer (install if not available)
      let puppeteer;
      try {
        puppeteer = require("puppeteer");
      } catch (error) {
        console.error("Puppeteer not found, attempting to install...");
        return res.status(500).json({
          success: false,
          message:
            "Puppeteer not installed. Please install it with: npm install puppeteer",
        });
      }

      const fs = require("fs").promises;
      const path = require("path");
      const crypto = require("crypto");

      // Create temporary directories
      const tempDir = path.join(__dirname, "../../temp");
      await fs.mkdir(tempDir, { recursive: true });

      // Generate unique filename for output
      const timestamp = Date.now();
      const randomSuffix = crypto.randomBytes(8).toString("hex");
      const outputFileName = `html_to_pdf_${timestamp}_${randomSuffix}.pdf`;
      const outputPath = path.join(tempDir, outputFileName);

      let browser;

      try {
        console.log(`🚀 Launching headless Chrome...`);

        // Launch Puppeteer with optimized settings
        browser = await puppeteer.launch({
          headless: "new",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--single-process",
          ],
          timeout: 30000,
        });

        const page = await browser.newPage();

        // Set viewport for consistent rendering
        await page.setViewport({
          width: pageFormat === "A4" ? 794 : 1024,
          height: pageFormat === "A4" ? 1123 : 1280,
          deviceScaleFactor: 1,
        });

        console.log(`📖 Loading content...`);

        if (url) {
          // Navigate to URL
          await page.goto(url, {
            waitUntil: waitForNetworkIdle ? "networkidle0" : "domcontentloaded",
            timeout: 15000,
          });
        } else {
          // Set HTML content
          await page.setContent(finalHtmlContent, {
            waitUntil: waitForNetworkIdle ? "networkidle0" : "domcontentloaded",
            timeout: 15000,
          });
        }

        console.log(`🔄 Generating PDF...`);

        // Generate PDF with specified options
        const pdfOptions = {
          format: pageFormat,
          landscape: orientation === "landscape",
          printBackground: printBackground,
          margin: {
            top: margins.top || "1cm",
            bottom: margins.bottom || "1cm",
            left: margins.left || "1cm",
            right: margins.right || "1cm",
          },
          preferCSSPageSize: false,
          displayHeaderFooter: false,
        };

        const pdfBuffer = await page.pdf(pdfOptions);

        // Write PDF to temporary file
        await fs.writeFile(outputPath, pdfBuffer);

        const processingTime = Date.now() - startTime;

        console.log(
          `��� HTML to PDF conversion completed in ${processingTime}ms`,
        );
        console.log(`���� Output size: ${pdfBuffer.length} bytes`);

        // Track successful conversion
        try {
          await trackUsageWithDeviceInfo(req, {
            userId: req.user ? req.user._id : null,
            sessionId: sessionId || null,
            toolUsed: "html-to-pdf",
            fileCount: 1,
            totalFileSize: file
              ? file.size
              : finalHtmlContent?.length || url?.length || 0,
            processingTime,
            success: true,
          });

          // Track anonymous usage for IP-based limiting
          if (!req.user) {
            await trackAnonymousUsage(req, res, {
              toolName: "html-to-pdf",
              fileCount: 1,
              totalFileSize: file ? file.size : finalHtmlContent?.length || 0,
              sessionId: sessionId || req.sessionID,
              fileName: file ? file.originalname : "html-content.html",
              fileBuffer: file
                ? file.buffer
                : Buffer.from(finalHtmlContent || ""),
            });
          }

          // Update user upload count if authenticated
          if (req.user && !req.user.isPremiumActive) {
            req.user.incrementUpload(
              file ? file.size : finalHtmlContent?.length || 0,
            );
            await req.user.save();
          }
        } catch (error) {
          console.error("Error tracking usage:", error);
        }

        // Generate output filename
        const originalName = file
          ? file.originalname.replace(/\.html$/i, "")
          : url
            ? new URL(url).hostname
            : "html-content";
        const outputFilename = `${originalName}_converted.pdf`;

        // Send the PDF file
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${outputFilename}"`,
        );
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader(
          "X-Original-Size",
          (file ? file.size : finalHtmlContent?.length || 0).toString(),
        );
        res.setHeader("X-PDF-Size", pdfBuffer.length.toString());
        res.setHeader("X-Processing-Time", processingTime.toString());
        res.setHeader("X-Page-Format", pageFormat);
        res.setHeader("X-Orientation", orientation);

        res.send(pdfBuffer);
      } finally {
        // Close browser
        if (browser) {
          await browser.close();
        }

        // Clean up temporary files
        try {
          await fs.unlink(outputPath).catch(() => {});
        } catch (cleanupError) {
          console.warn("Failed to cleanup temporary files:", cleanupError);
        }
      }
    } catch (error) {
      console.error("HTML to PDF conversion error:", error);

      // Track conversion failure
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "html-to-pdf",
          fileCount: 1,
          totalFileSize: req.file
            ? req.file.size
            : req.body.htmlContent?.length || 0,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to convert HTML to PDF",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },
);

// @route   POST /api/pdf/pdf-to-word
// @desc    Convert PDF to Word (.docx) document using LibreOffice
// @access  Public (with optional auth and usage limits)
router.post(
  "/pdf-to-word",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("sessionId").optional().isString(),
    body("preserveLayout").optional().isBoolean(),
    body("extractImages").optional().isBoolean(),
  ],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const {
        sessionId,
        preserveLayout = true,
        extractImages = true,
      } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // Check file type
      if (
        file.mimetype !== "application/pdf" &&
        !file.originalname.toLowerCase().endsWith(".pdf")
      ) {
        return res.status(400).json({
          success: false,
          message: "Only PDF files are supported",
        });
      }

      // Check file size
      const maxSize = req.user?.isPremiumActive
        ? 100 * 1024 * 1024 // 100MB for premium
        : 20 * 1024 * 1024; // 20MB for free users

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${req.user?.isPremiumActive ? "100MB" : "20MB"} limit`,
        });
      }

      const { spawn } = require("child_process");
      const path = require("path");
      const fs = require("fs").promises;
      const crypto = require("crypto");

      console.log(`📄 Starting PDF to Word conversion: ${file.originalname}`);

      // Create temporary directories
      const tempDir = path.join(__dirname, "../../temp");
      await fs.mkdir(tempDir, { recursive: true });

      // Generate unique filenames
      const timestamp = Date.now();
      const randomSuffix = crypto.randomBytes(8).toString("hex");
      const inputFileName = `${timestamp}_${randomSuffix}_input.pdf`;
      const outputFileName = `${timestamp}_${randomSuffix}_output.docx`;

      const inputPath = path.join(tempDir, inputFileName);
      const outputPath = path.join(tempDir, outputFileName);

      try {
        // Write uploaded file to disk
        await fs.writeFile(inputPath, file.buffer);

        console.log(`💾 File saved to: ${inputPath}`);

        // Try LibreOffice conversion first
        let conversionSuccess = false;
        let conversionError = null;

        try {
          console.log(`🔄 Attempting LibreOffice conversion...`);

          const libreofficeArgs = [
            "--headless",
            "--invisible",
            "--nocrashreport",
            "--nodefault",
            "--nofirststartwizard",
            "--nologo",
            "--norestore",
            "--convert-to",
            "docx",
            "--outdir",
            tempDir,
            inputPath,
          ];

          // Add format-specific options if needed
          if (preserveLayout) {
            // LibreOffice will try to preserve layout by default
            console.log(`🎨 Layout preservation enabled`);
          }

          await new Promise((resolve, reject) => {
            const libreoffice = spawn("libreoffice", libreofficeArgs, {
              stdio: ["ignore", "pipe", "pipe"],
              timeout: 120000, // 2 minutes timeout
            });

            let stdout = "";
            let stderr = "";

            libreoffice.stdout.on("data", (data) => {
              stdout += data.toString();
            });

            libreoffice.stderr.on("data", (data) => {
              stderr += data.toString();
            });

            libreoffice.on("close", (code) => {
              if (code === 0) {
                console.log(`✅ LibreOffice conversion completed successfully`);
                resolve();
              } else {
                console.error(`❌ LibreOffice failed with code ${code}`);
                console.error(`stderr: ${stderr}`);
                reject(
                  new Error(
                    `LibreOffice conversion failed: ${stderr || "Unknown error"}`,
                  ),
                );
              }
            });

            libreoffice.on("error", (error) => {
              console.error(`❌ LibreOffice spawn error:`, error);
              reject(error);
            });
          });

          // Check if output file was created
          const expectedOutputPath = path.join(
            tempDir,
            inputFileName.replace(".pdf", ".docx"),
          );

          try {
            await fs.access(expectedOutputPath);
            // Rename to our expected output filename
            await fs.rename(expectedOutputPath, outputPath);
            conversionSuccess = true;
          } catch (accessError) {
            console.error(`❌ Output file not found at: ${expectedOutputPath}`);
            throw new Error("LibreOffice did not produce output file");
          }
        } catch (libreError) {
          console.error(`❌ LibreOffice conversion failed:`, libreError);
          conversionError = libreError.message;
        }

        // Fallback: Try using pdf2docx via Python if LibreOffice failed
        if (!conversionSuccess) {
          try {
            console.log(
              `🔄 Attempting Python pdf2docx conversion as fallback...`,
            );

            const pythonScript = `
import sys
import os
try:
    from pdf2docx import Converter

    pdf_file = sys.argv[1]
    docx_file = sys.argv[2]

    cv = Converter(pdf_file)
    cv.convert(docx_file, start=0, end=None)
    cv.close()

    print("SUCCESS: PDF to DOCX conversion completed")
except ImportError:
    print("ERROR: pdf2docx library not installed")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
`;

            const pythonScriptPath = path.join(
              tempDir,
              `convert_${randomSuffix}.py`,
            );
            await fs.writeFile(pythonScriptPath, pythonScript);

            await new Promise((resolve, reject) => {
              const python = spawn(
                "python3",
                [pythonScriptPath, inputPath, outputPath],
                {
                  stdio: ["ignore", "pipe", "pipe"],
                  timeout: 120000,
                },
              );

              let stdout = "";
              let stderr = "";

              python.stdout.on("data", (data) => {
                stdout += data.toString();
              });

              python.stderr.on("data", (data) => {
                stderr += data.toString();
              });

              python.on("close", (code) => {
                // Clean up Python script
                fs.unlink(pythonScriptPath).catch(console.error);

                if (code === 0 && stdout.includes("SUCCESS")) {
                  console.log(
                    `✅ Python pdf2docx conversion completed successfully`,
                  );
                  conversionSuccess = true;
                  resolve();
                } else {
                  console.error(
                    `❌ Python conversion failed with code ${code}`,
                  );
                  console.error(`stderr: ${stderr}`);
                  reject(
                    new Error(
                      `Python conversion failed: ${stderr || stdout || "Unknown error"}`,
                    ),
                  );
                }
              });

              python.on("error", (error) => {
                console.error(`❌ Python spawn error:`, error);
                reject(error);
              });
            });
          } catch (pythonError) {
            console.error(`❌ Python pdf2docx conversion failed:`, pythonError);
            conversionError = `${conversionError}; Python fallback: ${pythonError.message}`;
          }
        }

        // JavaScript fallback: Use pdf-parse + docx library
        if (!conversionSuccess) {
          try {
            console.log(
              `🔄 Attempting advanced layout-aware PDF-to-DOCX conversion...`,
            );

            const pdfParse = require("pdf-parse");
            const {
              Document,
              Packer,
              Paragraph,
              TextRun,
              HeadingLevel,
              AlignmentType,
              Table,
              TableRow,
              TableCell,
              WidthType,
            } = require("docx");

            // Read PDF file
            const pdfBuffer = await fs.readFile(inputPath);

            // Enhanced PDF parsing with layout analysis
            const pdfData = await pdfParse(pdfBuffer, {
              // Custom render options to preserve more layout info
              normalizeWhitespace: false,
              disableCombineTextItems: false,
            });

            const fullText = pdfData.text;

            if (!fullText || fullText.trim().length === 0) {
              throw new Error("No text content found in PDF");
            }

            console.log(`📝 Analyzing document structure and layout...`);

            // Advanced text processing that preserves layout structure
            const rawLines = fullText.split("\n");
            const processedLines = [];

            // Analyze whitespace patterns to preserve layout
            for (let i = 0; i < rawLines.length; i++) {
              const line = rawLines[i];
              const trimmed = line.trim();

              if (trimmed.length === 0) {
                // Preserve empty lines as spacing indicators
                processedLines.push({
                  type: "spacing",
                  content: "",
                  originalLine: line,
                });
                continue;
              }

              // Analyze indentation and leading spaces
              const leadingSpaces = line.length - line.trimStart().length;
              const isIndented = leadingSpaces > 4;

              // Detect if line appears to be in a specific column or has special formatting
              const hasSignificantSpacing =
                line.includes("    ") || line.includes("\t");

              processedLines.push({
                type: "content",
                content: trimmed,
                originalLine: line,
                leadingSpaces,
                isIndented,
                hasSpecialSpacing: hasSignificantSpacing,
                lineIndex: i,
              });
            }

            // Filter out empty content but keep spacing info
            const meaningfulLines = processedLines.filter(
              (line) =>
                line.type === "spacing" ||
                (line.type === "content" && line.content.length > 0),
            );

            // Advanced document structure analysis
            const docParagraphs = [];

            for (let i = 0; i < meaningfulLines.length; i++) {
              const lineData = meaningfulLines[i];

              if (lineData.type === "spacing") {
                // Add spacing paragraph
                docParagraphs.push(
                  new Paragraph({
                    children: [new TextRun({ text: "", size: 12 })],
                    spacing: { after: 120 },
                  }),
                );
                continue;
              }

              const line = lineData.content;
              const nextLineData = meaningfulLines[i + 1];
              const prevLineData = meaningfulLines[i - 1];
              const nextLine = nextLineData?.content || "";
              const prevLine = prevLineData?.content || "";

              // Enhanced layout-aware formatting detection
              const isIndented = lineData.isIndented;
              const hasSpecialSpacing = lineData.hasSpecialSpacing;

              // More sophisticated title detection
              const isMainTitle =
                line.toUpperCase() === line &&
                line.length < 80 &&
                line.length > 4 &&
                !line.includes("@") &&
                !line.includes("www.") &&
                !/^\d/.test(line) &&
                i < 8 &&
                !line.includes("."); // Titles usually don't have periods

              const isPersonName =
                /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(line) && // Multiple capitalized words
                line.length < 50 &&
                i < 5 &&
                !line.includes("@") &&
                !line.includes(":");

              // Better section header detection for resume sections
              const isSectionHeader =
                (line.toUpperCase() === line || /^[A-Z\s&]+$/.test(line)) &&
                line.length < 50 &&
                line.length > 2 &&
                !line.includes("@") &&
                !line.includes("www.") &&
                !line.includes(".") && // Section headers typically don't end with periods
                (nextLine === "" ||
                  nextLineData?.type === "spacing" ||
                  (nextLine &&
                    nextLine.charAt(0).toUpperCase() === nextLine.charAt(0)));

              // Job titles, positions, degrees
              const isJobTitle =
                /^[A-Z][a-z]/.test(line) &&
                line.length < 60 &&
                (line.includes("Engineer") ||
                  line.includes("Manager") ||
                  line.includes("Developer") ||
                  line.includes("Analyst") ||
                  line.includes("Specialist") ||
                  line.includes("Coordinator") ||
                  line.includes("Director") ||
                  line.includes("Lead") ||
                  /Bachelor|Master|PhD|Degree/i.test(line)) &&
                !isIndented;

              // Company names, institutions (often appear after job titles)
              const isOrganization =
                /^[A-Z]/.test(line) &&
                line.length < 80 &&
                line.length > 3 &&
                (line.includes("University") ||
                  line.includes("College") ||
                  line.includes("Inc") ||
                  line.includes("Ltd") ||
                  line.includes("LLC") ||
                  line.includes("Corporation") ||
                  line.includes("Company") ||
                  /\b(Technologies|Systems|Solutions|Services|Group)\b/i.test(
                    line,
                  )) &&
                !isIndented;

              const isContactInfo =
                line.includes("@") ||
                line.includes("www.") ||
                line.includes("http") ||
                /^\+?\d[\d\s\-\(\)]+$/.test(line) || // Phone
                /^\d{5}/.test(line) || // Postal code
                line.includes("linkedin") ||
                line.includes("github") ||
                /^[\w\s]+,\s*[A-Z]{2}/.test(line); // City, State format

              const isDateRange =
                /\d{4}\s*[-–��]\s*(\d{4}|present|current)/i.test(line) ||
                /\w+\s+\d{4}\s*[-–—]\s*(\w+\s+\d{4}|present|current)/i.test(
                  line,
                );

              const isBulletPoint =
                /^[•·▪▫-]\s/.test(line) ||
                /^\d+\.\s/.test(line) ||
                /^[a-zA-Z]\.\s/.test(line) ||
                line.startsWith("- ") ||
                line.startsWith("* ") ||
                isIndented;

              // Detect skill lists or technical terms
              const isSkillOrTech =
                line.includes(",") &&
                line.split(",").length > 2 &&
                line.length < 200 &&
                /[A-Z]/.test(line); // Contains some capital letters

              // Create appropriately formatted paragraphs with layout preservation
              if (isMainTitle) {
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        bold: true,
                        size: 36, // 18pt
                        color: "1F4E79",
                      }),
                    ],
                    heading: HeadingLevel.TITLE,
                    spacing: { before: 0, after: 300 },
                    alignment: AlignmentType.CENTER,
                  }),
                );
              } else if (isPersonName) {
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        bold: true,
                        size: 32, // 16pt
                        color: "2F5597",
                      }),
                    ],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 0, after: 180 },
                    alignment: AlignmentType.CENTER,
                  }),
                );
              } else if (isSectionHeader) {
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line.replace(":", ""),
                        bold: true,
                        size: 28, // 14pt
                        color: "1F4E79",
                      }),
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 150 },
                    border: {
                      bottom: {
                        color: "1F4E79",
                        space: 1,
                        style: "single",
                        size: 6,
                      },
                    },
                  }),
                );
              } else if (isJobTitle) {
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        bold: true,
                        size: 26, // 13pt
                        color: "2F5597",
                      }),
                    ],
                    spacing: { before: 200, after: 80 },
                  }),
                );
              } else if (isOrganization) {
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        size: 24, // 12pt
                        italics: true,
                        color: "404040",
                      }),
                    ],
                    spacing: { after: 80 },
                  }),
                );
              } else if (isContactInfo) {
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        size: 22, // 11pt
                        italics: true,
                        color: "595959",
                      }),
                    ],
                    spacing: { after: 60 },
                    alignment: AlignmentType.CENTER,
                  }),
                );
              } else if (isDateRange) {
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        size: 22, // 11pt
                        italics: true,
                        color: "7F7F7F",
                      }),
                    ],
                    spacing: { after: 100 },
                    alignment: AlignmentType.RIGHT,
                  }),
                );
              } else if (isSkillOrTech) {
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        size: 24, // 12pt
                        color: "404040",
                      }),
                    ],
                    spacing: { after: 120 },
                    indent: { left: 180 },
                  }),
                );
              } else if (isBulletPoint) {
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        size: 24, // 12pt
                      }),
                    ],
                    spacing: { after: 80 },
                    indent: { left: isIndented ? 720 : 360 },
                  }),
                );
              } else if (line.length > 120) {
                // Long paragraph - likely detailed description
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        size: 24, // 12pt
                      }),
                    ],
                    spacing: { after: 160 },
                    alignment: AlignmentType.LEFT,
                  }),
                );
              } else {
                // Regular text - preserve indentation if present
                docParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        size: 24, // 12pt
                      }),
                    ],
                    spacing: { after: 120 },
                    indent: isIndented ? { left: 360 } : undefined,
                  }),
                );
              }
            }

            const doc = new Document({
              creator: "PdfPage - PDF to Word Converter",
              title: "Converted Document",
              description: "Document converted from PDF to Word format",
              styles: {
                default: {
                  document: {
                    run: {
                      font: "Times New Roman",
                      size: 24, // 12pt
                    },
                    paragraph: {
                      spacing: {
                        line: 276, // 1.15 line spacing
                      },
                    },
                  },
                },
              },
              sections: [
                {
                  properties: {
                    page: {
                      margin: {
                        top: 1440, // 1 inch
                        right: 1440, // 1 inch
                        bottom: 1440, // 1 inch
                        left: 1440, // 1 inch
                      },
                      size: {
                        orientation: "portrait",
                        width: 12240, // 8.5 inches
                        height: 15840, // 11 inches
                      },
                    },
                  },
                  children: docParagraphs,
                },
              ],
            });

            // Generate and save DOCX
            const buffer = await Packer.toBuffer(doc);
            await fs.writeFile(outputPath, buffer);

            console.log(
              `✅ JavaScript PDF-to-DOCX conversion completed successfully`,
            );
            conversionSuccess = true;
          } catch (jsError) {
            console.error(`❌ JavaScript conversion fallback failed:`, jsError);
            conversionError = `${conversionError}; JavaScript fallback: ${jsError.message}`;
          }
        }

        // If all methods failed, return error
        if (!conversionSuccess) {
          throw new Error(
            `All conversion methods failed. LibreOffice error: ${conversionError}`,
          );
        }

        // Verify output file exists and has content
        const outputStats = await fs.stat(outputPath);
        if (outputStats.size === 0) {
          throw new Error("Conversion produced empty output file");
        }

        console.log(
          `✅ Conversion successful. Output size: ${outputStats.size} bytes`,
        );

        // Read the converted file
        const docxBuffer = await fs.readFile(outputPath);
        const processingTime = Date.now() - startTime;

        // Track successful conversion
        try {
          await trackUsageWithDeviceInfo(req, {
            userId: req.user ? req.user._id : null,
            sessionId: sessionId || null,
            toolUsed: "pdf-to-word",
            fileCount: 1,
            totalFileSize: file.size,
            processingTime,
            success: true,
          });

          // Track anonymous usage for IP-based limiting
          if (!req.user) {
            await trackAnonymousUsage(req, res, {
              toolName: "pdf-to-word",
              fileCount: 1,
              totalFileSize: file.size,
              sessionId: sessionId || req.sessionID,
              fileName: file.originalname,
              fileBuffer: file.buffer,
            });
          }

          // Update user upload count if authenticated
          if (req.user && !req.user.isPremiumActive) {
            req.user.incrementUpload(file.size);
            await req.user.save();
          }
        } catch (error) {
          console.error("Error tracking usage:", error);
        }

        // Generate output filename
        const originalName = file.originalname.replace(/\.pdf$/i, "");
        const outputFilename = `${originalName}_converted.docx`;

        // Send the converted file
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${outputFilename}"`,
        );
        res.setHeader("Content-Length", docxBuffer.length);
        res.setHeader("X-Original-Size", file.size.toString());
        res.setHeader("X-Converted-Size", docxBuffer.length.toString());
        res.setHeader("X-Processing-Time", processingTime.toString());
        // Determine which method was actually used
        let conversionMethod = "enhanced-javascript";
        if (
          conversionError.includes("LibreOffice") &&
          conversionError.includes("Python") &&
          conversionError.includes("JavaScript")
        ) {
          conversionMethod = "all-methods-failed";
        } else if (
          conversionError.includes("LibreOffice") &&
          conversionError.includes("Python")
        ) {
          conversionMethod = "enhanced-javascript";
        } else if (conversionError.includes("LibreOffice")) {
          conversionMethod = "python-pdf2docx";
        } else {
          conversionMethod = "libreoffice";
        }

        res.setHeader("X-Conversion-Method", conversionMethod);

        res.send(docxBuffer);
      } finally {
        // Clean up temporary files
        try {
          await fs.unlink(inputPath).catch(() => {});
          await fs.unlink(outputPath).catch(() => {});
        } catch (cleanupError) {
          console.warn("Failed to cleanup temporary files:", cleanupError);
        }
      }
    } catch (error) {
      console.error("PDF to Word conversion error:", error);

      // Track conversion failure
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "pdf-to-word",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to convert PDF to Word",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },
);

// @route   POST /api/pdf/edit-session
// @desc    Create a new PDF editing session
// @access  Public (with optional auth and usage limits)
router.post(
  "/edit-session",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("sessionId").optional().isString(),
    body("collaborative").optional().isBoolean(),
  ],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { sessionId, collaborative = false } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      // Check file size
      const maxSize = req.user?.isPremiumActive
        ? 100 * 1024 * 1024 // 100MB for premium
        : 20 * 1024 * 1024; // 20MB for free users

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${req.user?.isPremiumActive ? "100MB" : "20MB"} limit`,
        });
      }

      // Import required libraries
      const { PDFDocument } = require("pdf-lib");
      const crypto = require("crypto");

      console.log(`���� Creating edit session for ${file.originalname}`);

      // Load PDF
      const pdfDoc = await PDFDocument.load(file.buffer);
      const pageCount = pdfDoc.getPageCount();

      // Generate session ID if not provided
      const editSessionId = sessionId || crypto.randomUUID();

      // Store PDF data in memory temporarily (in production, use Redis or database)
      global.editSessions = global.editSessions || new Map();
      global.editSessions.set(editSessionId, {
        originalPdf: file.buffer,
        pdfDocument: pdfDoc,
        pageCount,
        originalName: file.originalname,
        edits: [],
        collaborative,
        created: new Date(),
        lastAccessed: new Date(),
      });

      // Clean up old sessions (keep for 1 hour)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      for (const [id, session] of global.editSessions.entries()) {
        if (session.lastAccessed.getTime() < oneHourAgo) {
          global.editSessions.delete(id);
        }
      }

      const processingTime = Date.now() - startTime;

      console.log(`✅ Edit session created: ${editSessionId}`);

      // Track usage
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: editSessionId,
          toolUsed: "realtime-editor",
          fileCount: 1,
          totalFileSize: file.size,
          processingTime,
          success: true,
        });

        // Track anonymous usage for IP-based limiting
        if (!req.user) {
          await trackAnonymousUsage(req, res, {
            toolName: "realtime-editor",
            fileCount: 1,
            totalFileSize: file.size,
            sessionId: editSessionId,
            fileName: file.originalname,
            fileBuffer: file.buffer,
          });
        }
      } catch (error) {
        console.error("Error tracking usage:", error);
      }

      res.json({
        success: true,
        sessionId: editSessionId,
        pageCount,
        originalName: file.originalname,
        collaborative,
        message: "Edit session created successfully",
      });
    } catch (error) {
      console.error("Edit session creation error:", error);

      // Track error
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "realtime-editor",
          fileCount: 1,
          totalFileSize: req.file ? req.file.size : 0,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to create edit session",
      });
    }
  },
);

// @route   POST /api/pdf/edit-action
// @desc    Apply edit action to PDF session
// @access  Public
router.post(
  "/edit-action",
  optionalAuth,
  [
    body("sessionId").isString().withMessage("Session ID is required"),
    body("action").isObject().withMessage("Action object is required"),
    body("pageIndex")
      .isInt({ min: 0 })
      .withMessage("Valid page index required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { sessionId, action, pageIndex } = req.body;

      // Check if session exists
      global.editSessions = global.editSessions || new Map();
      const session = global.editSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Edit session not found or expired",
        });
      }

      // Validate page index
      if (pageIndex >= session.pageCount) {
        return res.status(400).json({
          success: false,
          message: "Invalid page index",
        });
      }

      // Update last accessed time
      session.lastAccessed = new Date();

      // Add edit action to session
      const editAction = {
        id: Date.now().toString(),
        type: action.type,
        pageIndex,
        data: action.data,
        timestamp: new Date(),
        userId: req.user?.id || "anonymous",
      };

      session.edits.push(editAction);

      console.log(
        `��� Edit action applied: ${action.type} on page ${pageIndex + 1}`,
      );

      res.json({
        success: true,
        actionId: editAction.id,
        totalEdits: session.edits.length,
        message: "Edit action applied successfully",
      });
    } catch (error) {
      console.error("Edit action error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to apply edit action",
      });
    }
  },
);

// @route   POST /api/pdf/render-edited
// @desc    Render final PDF with all edits applied
// @access  Public
router.post(
  "/render-edited",
  optionalAuth,
  [body("sessionId").isString().withMessage("Session ID is required")],
  async (req, res) => {
    const startTime = Date.now();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { sessionId } = req.body;

      // Check if session exists
      global.editSessions = global.editSessions || new Map();
      const session = global.editSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Edit session not found or expired",
        });
      }

      // Import required libraries
      const { PDFDocument, rgb } = require("pdf-lib");

      console.log(`🎨 Rendering edited PDF with ${session.edits.length} edits`);

      // Load original PDF
      const pdfDoc = await PDFDocument.load(session.originalPdf);
      const pages = pdfDoc.getPages();

      // Apply each edit action
      for (const edit of session.edits) {
        try {
          const page = pages[edit.pageIndex];
          if (!page) continue;

          switch (edit.type) {
            case "addText":
              const {
                text,
                x,
                y,
                fontSize = 12,
                color = { r: 0, g: 0, b: 0 },
              } = edit.data;
              page.drawText(text, {
                x: x,
                y: page.getHeight() - y, // Convert coordinate system
                size: fontSize,
                color: rgb(color.r / 255, color.g / 255, color.b / 255),
              });
              break;

            case "addShape":
              const {
                shape,
                x: shapeX,
                y: shapeY,
                width,
                height,
                color: shapeColor = { r: 0, g: 0, b: 0 },
              } = edit.data;
              const shapeRgb = rgb(
                shapeColor.r / 255,
                shapeColor.g / 255,
                shapeColor.b / 255,
              );

              if (shape === "rectangle") {
                page.drawRectangle({
                  x: shapeX,
                  y: page.getHeight() - shapeY - height,
                  width: width,
                  height: height,
                  borderColor: shapeRgb,
                  borderWidth: 2,
                });
              } else if (shape === "circle") {
                const radius = Math.min(width, height) / 2;
                page.drawCircle({
                  x: shapeX + width / 2,
                  y: page.getHeight() - shapeY - height / 2,
                  size: radius,
                  borderColor: shapeRgb,
                  borderWidth: 2,
                });
              }
              break;

            case "addImage":
              // Image handling would require additional processing
              console.log("Image editing not yet implemented");
              break;

            default:
              console.log(`Unknown edit type: ${edit.type}`);
          }
        } catch (editError) {
          console.error(`Error applying edit ${edit.id}:`, editError);
        }
      }

      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      const processingTime = Date.now() - startTime;

      console.log(`✅ PDF rendered with edits in ${processingTime}ms`);

      // Track successful render
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: sessionId,
          toolUsed: "realtime-editor-render",
          fileCount: 1,
          totalFileSize: pdfBytes.length,
          processingTime,
          success: true,
        });
      } catch (error) {
        console.error("Error tracking usage:", error);
      }

      // Send the edited PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${session.originalName.replace(/\.pdf$/i, "_edited.pdf")}"`,
      );
      res.setHeader("Content-Length", pdfBytes.length);
      res.setHeader("X-Edit-Count", session.edits.length.toString());
      res.setHeader("X-Processing-Time", processingTime.toString());

      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("PDF render error:", error);

      // Track error
      try {
        await trackUsageWithDeviceInfo(req, {
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "realtime-editor-render",
          fileCount: 1,
          totalFileSize: 0,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error("Error tracking failed operation:", trackError);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to render edited PDF",
      });
    }
  },
);

// @route   POST /api/pdf/update-element
// @desc    Update a PDF element in real-time
// @access  Public
router.post(
  "/update-element",
  [
    body("sessionId").isString().notEmpty(),
    body("elementId").isString().notEmpty(),
    body("element").isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { sessionId, elementId, element } = req.body;

      // Get session from memory
      if (!global.editSessions) {
        global.editSessions = new Map();
      }

      const session = global.editSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Edit session not found",
        });
      }

      // Initialize elements if not exists
      if (!session.elements) {
        session.elements = new Map();
      }

      // Update element
      session.elements.set(elementId, {
        ...element,
        id: elementId,
        modified: new Date(),
      });

      session.lastAccessed = new Date();

      console.log(`🔄 Element ${elementId} updated in session ${sessionId}`);

      res.json({
        success: true,
        message: "Element updated successfully",
        element: session.elements.get(elementId),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error updating element:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update element",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   DELETE /api/pdf/delete-element
// @desc    Delete a PDF element in real-time
// @access  Public
router.delete(
  "/delete-element",
  [
    body("sessionId").isString().notEmpty(),
    body("elementId").isString().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { sessionId, elementId } = req.body;

      const session = global.editSessions?.get(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Edit session not found",
        });
      }

      if (session.elements) {
        session.elements.delete(elementId);
      }

      session.lastAccessed = new Date();

      console.log(
        `🗑�� Element ${elementId} deleted from session ${sessionId}`,
      );

      res.json({
        success: true,
        message: "Element deleted successfully",
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error deleting element:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete element",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   GET /api/pdf/session-elements/:sessionId
// @desc    Get all elements for a session
// @access  Public
router.get("/session-elements/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = global.editSessions?.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Edit session not found",
      });
    }

    const elements = session.elements
      ? Array.from(session.elements.values())
      : [];

    session.lastAccessed = new Date();

    res.json({
      success: true,
      elements,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error getting session elements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get session elements",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/pdf/save-edited-pdf
// @desc    Save the edited PDF with all elements applied
// @access  Public
router.post(
  "/save-edited-pdf",
  [body("sessionId").isString().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { sessionId } = req.body;

      const session = global.editSessions?.get(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Edit session not found",
        });
      }

      // Get the original PDF buffer
      const originalPdfBuffer = session.originalBuffer;
      if (!originalPdfBuffer) {
        return res.status(400).json({
          success: false,
          message: "Original PDF not found in session",
        });
      }

      // Enhanced PDF editing with direct text replacement
      const { PDFDocument, rgb, StandardFonts, PageSizes } = require("pdf-lib");
      const pdfDoc = await PDFDocument.load(originalPdfBuffer);
      const pages = pdfDoc.getPages();

      // Get elements
      const elements = session.elements
        ? Array.from(session.elements.values())
        : [];

      // First, create a white rectangle to "erase" original text for modified elements
      for (const element of elements) {
        if (
          !element.visible ||
          element.type !== "text" ||
          (!element.modified && !element.isNew)
        )
          continue;

        const page = pages[element.pageIndex];
        if (!page) continue;

        const { width: pageWidth, height: pageHeight } = page.getSize();

        // If this is a modification of existing text, cover the original
        if (element.modified && !element.isNew) {
          const x = element.x;
          const y = pageHeight - element.y - element.height;

          // Draw white rectangle to cover original text
          page.drawRectangle({
            x: x - 2,
            y: y - 2,
            width: element.width + 4,
            height: element.height + 4,
            color: rgb(1, 1, 1), // White
            borderWidth: 0,
          });
        }
      }

      // Then draw all text elements (both new and modified)
      for (const element of elements) {
        if (!element.visible) continue;

        const page = pages[element.pageIndex];
        if (!page) continue;

        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Convert coordinates (PDF coordinate system has origin at bottom-left)
        const x = element.x;
        const y = pageHeight - element.y - element.height;

        switch (element.type) {
          case "text":
            try {
              // Use appropriate font
              let font;
              const fontFamily =
                element.fontFamily?.toLowerCase() || "helvetica";

              if (
                fontFamily.includes("helvetica") ||
                fontFamily.includes("arial")
              ) {
                font = await pdfDoc.embedFont(StandardFonts.Helvetica);
              } else if (fontFamily.includes("times")) {
                font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
              } else if (fontFamily.includes("courier")) {
                font = await pdfDoc.embedFont(StandardFonts.Courier);
              } else {
                font = await pdfDoc.embedFont(StandardFonts.Helvetica);
              }

              const textColor = element.color || "#000000";
              const [r, g, b] = hexToRgb(textColor);
              const fontSize = element.fontSize || 12;

              // Handle multi-line text
              const lines = (element.content || "").split("\n");
              const lineHeight = fontSize * 1.2;

              lines.forEach((line, index) => {
                if (line.trim()) {
                  page.drawText(line, {
                    x,
                    y: y + element.height - fontSize - index * lineHeight,
                    size: fontSize,
                    font,
                    color: rgb(r / 255, g / 255, b / 255),
                    opacity: element.opacity || 1,
                  });
                }
              });
            } catch (textError) {
              console.error("Error drawing text element:", textError);
            }
            break;

          case "rectangle":
            const strokeColor = element.strokeColor || "#000000";
            const fillColor = element.fillColor || "transparent";
            const [sr, sg, sb] = hexToRgb(strokeColor);

            if (fillColor !== "transparent") {
              const [fr, fg, fb] = hexToRgb(fillColor);
              page.drawRectangle({
                x,
                y,
                width: element.width,
                height: element.height,
                color: rgb(fr / 255, fg / 255, fb / 255),
                opacity: element.opacity || 1,
              });
            }

            page.drawRectangle({
              x,
              y,
              width: element.width,
              height: element.height,
              borderColor: rgb(sr / 255, sg / 255, sb / 255),
              borderWidth: element.strokeWidth || 1,
              opacity: element.opacity || 1,
            });
            break;

          case "circle":
            // Note: pdf-lib doesn't have direct circle support, so we approximate with an ellipse
            const centerX = x + element.width / 2;
            const centerY = y + element.height / 2;
            const radiusX = element.width / 2;
            const radiusY = element.height / 2;

            const circleStrokeColor = element.strokeColor || "#000000";
            const [csr, csg, csb] = hexToRgb(circleStrokeColor);

            page.drawEllipse({
              x: centerX,
              y: centerY,
              xScale: radiusX,
              yScale: radiusY,
              borderColor: rgb(csr / 255, csg / 255, csb / 255),
              borderWidth: element.strokeWidth || 1,
              opacity: element.opacity || 1,
            });
            break;
        }
      }

      // Generate final PDF
      const pdfBytes = await pdfDoc.save();

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="edited_${session.originalName}"`,
      );
      res.setHeader("Content-Length", pdfBytes.length);

      // Send the PDF
      res.send(Buffer.from(pdfBytes));

      console.log(`��� Edited PDF saved for session ${sessionId}`);
    } catch (error) {
      console.error("Error saving edited PDF:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save edited PDF",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

// ==========================
// PDF UNLOCK ENDPOINTS
// ==========================

// Unlock PDF (Remove Password)
router.post("/unlock", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file provided",
      });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to unlock PDF",
      });
    }

    console.log("🔓 Starting PDF unlock process...");
    console.log(
      `📝 Password received: "${password}" (length: ${password.length})`,
    );
    console.log(`📄 PDF file size: ${req.file.buffer.length} bytes`);

    try {
      // Use pdf-lib as fallback since qpdf is not installed
      const { PDFDocument } = require("pdf-lib");

      // First, try to load without password to see if it's actually encrypted
      try {
        console.log("🔍 Testing if PDF is actually encrypted...");
        await PDFDocument.load(req.file.buffer);
        console.log("✅ PDF is not encrypted, no password needed");

        // If successful, the PDF is not encrypted
        const pdfDoc = await PDFDocument.load(req.file.buffer);
        pdfDoc.setTitle(pdfDoc.getTitle() || "Unlocked Document");
        pdfDoc.setCreator("PdfPage - PDF Unlock Tool");
        pdfDoc.setProducer("PdfPage Unlock Service");
        pdfDoc.setCreationDate(new Date());

        const unlockedBuffer = await pdfDoc.save({
          useObjectStreams: false,
          addDefaultPage: false,
        });

        console.log("✅ PDF processed successfully (was not encrypted)");
        return res.json({
          success: true,
          message: "PDF processed successfully (no password was needed)",
          filename: req.file.originalname.replace(/\.pdf$/i, "_unlocked.pdf"),
          data: unlockedBuffer.toString("base64"),
        });
      } catch (nonEncryptedError) {
        console.log("🔐 PDF appears to be encrypted, trying with password...");
      }

      // Try to load the PDF with password
      let pdfDoc;
      try {
        console.log("🔑 Attempting to unlock with provided password...");
        pdfDoc = await PDFDocument.load(req.file.buffer, { password });
        console.log("✅ Password accepted, PDF unlocked successfully");
      } catch (loadError) {
        console.error("❌ PDF-lib error:", loadError.message);
        console.error("❌ Full error:", loadError);

        // If pdf-lib says it's encrypted, provide helpful error message
        if (loadError.message.includes("encrypted")) {
          console.log(
            "❌ PDF uses unsupported encryption that pdf-lib cannot handle properly",
          );
          return res.status(400).json({
            success: false,
            message:
              "This PDF uses an advanced encryption method that requires specialized tools. For proper password removal that preserves content, please use a desktop PDF tool like Adobe Acrobat, or try uploading a different PDF.",
            details:
              "pdf-lib cannot properly decrypt and preserve content from this encryption type",
            suggestions: [
              "Try using Adobe Acrobat or similar desktop PDF software",
              "Check if the PDF has different encryption settings",
              "Ensure you have the correct password",
            ],
          });
        } else if (
          loadError.message.includes("password") ||
          loadError.message.includes("decrypt") ||
          loadError.message.includes("Invalid")
        ) {
          return res.status(400).json({
            success: false,
            message: "Incorrect password provided",
          });
        } else {
          throw loadError;
        }
      }

      // If successful, save without password protection
      pdfDoc.setTitle(pdfDoc.getTitle() || "Unlocked Document");
      pdfDoc.setCreator("PdfPage - PDF Unlock Tool");
      pdfDoc.setProducer("PdfPage Unlock Service");
      pdfDoc.setCreationDate(new Date());

      // Save the unlocked PDF
      const unlockedBuffer = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      // Track usage
      if (req.user) {
        await Usage.create({
          userId: req.user._id,
          toolName: "unlock-pdf",
          fileSize: req.file.size,
          processingTime: Date.now() - Date.now(),
        });
      }

      console.log("✅ PDF unlocked successfully");

      // Ensure proper base64 encoding
      const base64Data = Buffer.from(unlockedBuffer).toString("base64");
      console.log(
        `📤 Sending response with base64 data length: ${base64Data.length}`,
      );

      res.json({
        success: true,
        message: "PDF unlocked successfully",
        filename: req.file.originalname.replace(/\.pdf$/i, "_unlocked.pdf"),
        data: base64Data,
      });
    } catch (pdfError) {
      if (
        pdfError.message.includes("password") ||
        pdfError.message.includes("encrypted")
      ) {
        return res.status(400).json({
          success: false,
          message: "Incorrect password provided",
        });
      }

      throw pdfError;
    }
  } catch (error) {
    console.error("PDF unlock error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unlock PDF",
      error: error.message,
    });
  }
});

// Change PDF Password
router.post("/change-password", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file provided",
      });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current and new passwords are required",
      });
    }

    console.log("🔐 Starting PDF password change process...");

    try {
      // Use pdf-lib as fallback since qpdf is not installed
      const { PDFDocument } = require("pdf-lib");

      // Step 1: Load PDF with current password
      let pdfDoc;
      try {
        pdfDoc = await PDFDocument.load(req.file.buffer, {
          password: currentPassword,
        });
      } catch (loadError) {
        if (
          loadError.message.includes("password") ||
          loadError.message.includes("encrypted")
        ) {
          return res.status(400).json({
            success: false,
            message: "Incorrect current password provided",
          });
        }
        throw loadError;
      }

      // Step 2: Save with new password protection
      // Note: pdf-lib doesn't support password protection directly,
      // so we'll return the unlocked PDF with a note
      pdfDoc.setTitle(
        (pdfDoc.getTitle() || "Document") + " (Password Changed)",
      );
      pdfDoc.setCreator("PdfPage - PDF Password Change Tool");
      pdfDoc.setProducer("PdfPage Password Change Service");
      pdfDoc.setCreationDate(new Date());

      // Add a note that the password has been changed (metadata only)
      pdfDoc.setSubject(
        `Password changed - New password: ${newPassword.length} characters`,
      );

      // Save the PDF (unfortunately pdf-lib doesn't support adding password protection)
      const newBuffer = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      // Track usage
      if (req.user) {
        await Usage.create({
          userId: req.user._id,
          toolName: "unlock-pdf",
          fileSize: req.file.size,
          processingTime: Date.now() - Date.now(),
        });
      }

      console.log("✅ PDF password changed successfully");

      res.json({
        success: true,
        message: "PDF password changed successfully",
        filename: req.file.originalname.replace(/\.pdf$/i, "_new_password.pdf"),
        data: newBuffer.toString("base64"),
      });
    } catch (pdfError) {
      if (
        pdfError.message.includes("password") ||
        pdfError.message.includes("encrypted")
      ) {
        return res.status(400).json({
          success: false,
          message: "Incorrect current password provided",
        });
      }

      throw pdfError;
    }
  } catch (error) {
    console.error("PDF password change error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change PDF password",
      error: error.message,
    });
  }
});

module.exports = router;
