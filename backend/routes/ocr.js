const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { body, validationResult } = require("express-validator");

// Import services and middleware
const ocrService = require("../services/simpleOcrService");
const Usage = require("../models/Usage");
const { auth, optionalAuth, checkUsageLimit } = require("../middleware/auth");
const {
  ipUsageLimitChain,
  trackToolUsage,
} = require("../middleware/ipUsageLimit");
const { trackAnonymousUsage } = require("../utils/ipUsageUtils");
const { getRealIPAddress } = require("../utils/ipUtils");
const { getDeviceTypeFromRequest } = require("../utils/deviceUtils");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../temp/ocr");
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `ocr-${uniqueSuffix}.pdf`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Ensure temp directory exists
const ensureTempDir = async () => {
  const tempDir = path.join(__dirname, "../temp/ocr");
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error("Failed to create temp directory:", error);
  }
};

ensureTempDir();

/**
 * @route   POST /api/ocr/process
 * @desc    Process PDF with OCR for high accuracy text extraction
 * @access  Public (with rate limiting)
 */
router.post(
  "/process",
  optionalAuth,
  ...ipUsageLimitChain,
  upload.single("pdf"),
  [
    body("language")
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage("Invalid language code"),
    body("outputFormat")
      .optional()
      .isIn(["txt", "pdf", "docx", "json"])
      .withMessage("Invalid output format"),
    body("preserveFormatting")
      .optional()
      .isBoolean()
      .withMessage("preserveFormatting must be boolean"),
    body("enhanceQuality")
      .optional()
      .isBoolean()
      .withMessage("enhanceQuality must be boolean"),
    body("detectLanguages")
      .optional()
      .isBoolean()
      .withMessage("detectLanguages must be boolean"),
  ],
  async (req, res) => {
    let filePath = null;

    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No PDF file uploaded",
        });
      }

      filePath = req.file.path;

      // Parse OCR options
      const options = {
        language: req.body.language || "eng",
        outputFormat: req.body.outputFormat || "json",
        preserveFormatting: req.body.preserveFormatting !== "false",
        enhanceQuality: req.body.enhanceQuality !== "false",
        detectLanguages: req.body.detectLanguages === "true",
        multiPass: true, // Enable multi-pass OCR for better accuracy
      };

      // Validate configuration
      const configErrors = ocrService.validateConfig(options);
      if (configErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid OCR configuration",
          errors: configErrors,
        });
      }

      // Track usage before processing
      const realIP = getRealIPAddress(req);
      const deviceType = getDeviceTypeFromRequest(req);

      if (req.user) {
        // Track for authenticated user
        await trackToolUsage("ocr-pdf", req.user._id, realIP, deviceType);
      } else {
        // Track for anonymous user
        await trackAnonymousUsage(realIP, "ocr-pdf", deviceType);
      }

      // Process document with OCR
      console.log(`Starting OCR processing for file: ${req.file.originalname}`);

      const result = await ocrService.processDocument(filePath, options);

      console.log(
        `OCR processing completed. Confidence: ${result.confidence}%, Words: ${result.wordCount}`,
      );

      // Log usage to database
      try {
        const usage = new Usage({
          userId: req.user?._id || null,
          tool: "ocr-pdf",
          ipAddress: realIP,
          deviceType,
          fileSize: req.file.size,
          metadata: {
            originalFilename: req.file.originalname,
            pageCount: result.pageCount,
            confidence: result.confidence,
            language: options.language,
            outputFormat: options.outputFormat,
            processingTime: result.processingTime,
            wordCount: result.wordCount,
            characterCount: result.characterCount,
          },
        });
        await usage.save();
      } catch (dbError) {
        console.error("Failed to log usage:", dbError);
        // Continue without failing the request
      }

      // Prepare response
      const response = {
        success: true,
        message: "OCR processing completed successfully",
        data: {
          extractedText: result.extractedText,
          confidence: result.confidence,
          detectedLanguages: result.detectedLanguages,
          pageCount: result.pageCount,
          processedPages: result.processedPages,
          wordCount: result.wordCount,
          characterCount: result.characterCount,
          qualityScore: result.qualityScore,
          languageConfidence: result.languageConfidence,
          textStructure: result.textStructure,
          processingTime: result.processingTime,
          metadata: result.metadata,
        },
        pagination: {
          totalPages: result.pageCount,
          processedPages: result.processedPages,
        },
      };

      // Include output file info if generated
      if (result.outputFile) {
        const fileName = path.basename(result.outputFile);
        response.data.downloadUrl = `/api/ocr/download/${fileName}`;
        response.data.fileName = fileName;
      }

      res.json(response);
    } catch (error) {
      console.error("OCR processing error:", error);

      res.status(500).json({
        success: false,
        message: "OCR processing failed",
        error: error.message,
      });
    } finally {
      // Clean up uploaded file
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (cleanupError) {
          console.error("Failed to clean up file:", cleanupError);
        }
      }
    }
  },
);

/**
 * @route   GET /api/ocr/languages
 * @desc    Get list of supported languages for OCR
 * @access  Public
 */
router.get("/languages", (req, res) => {
  try {
    const languages = ocrService.getSupportedLanguages();
    res.json({
      success: true,
      message: "Supported languages retrieved successfully",
      data: languages,
    });
  } catch (error) {
    console.error("Error getting languages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve languages",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/ocr/download/:filename
 * @desc    Download processed OCR output file
 * @access  Public (temporary download link)
 */
router.get("/download/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;

    // Validate filename (prevent directory traversal)
    if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(filename)) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const filePath = path.join(__dirname, "../temp/ocr", filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".txt":
        contentType = "text/plain";
        break;
      case ".pdf":
        contentType = "application/pdf";
        break;
      case ".docx":
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Stream file
    const fileStream = require("fs").createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up file after download
    fileStream.on("end", async () => {
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error("Failed to clean up download file:", cleanupError);
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({
      success: false,
      message: "Download failed",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/ocr/analyze
 * @desc    Analyze PDF for OCR suitability and get recommendations
 * @access  Public
 */
router.post(
  "/analyze",
  optionalAuth,
  upload.single("pdf"),
  async (req, res) => {
    let filePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No PDF file uploaded",
        });
      }

      filePath = req.file.path;

      // Basic analysis (would implement actual PDF analysis)
      const analysis = {
        isScanned: true, // Assume scanned for OCR processing
        pageCount: 1, // Would get actual page count
        estimatedAccuracy: 85,
        recommendedLanguages: ["eng"],
        complexity: "medium",
        recommendations: [
          "Use high-quality enhancement for better accuracy",
          "Consider manual review for critical documents",
          "Multiple language detection may improve results",
        ],
      };

      res.json({
        success: true,
        message: "PDF analysis completed",
        data: analysis,
      });
    } catch (error) {
      console.error("PDF analysis error:", error);
      res.status(500).json({
        success: false,
        message: "Analysis failed",
        error: error.message,
      });
    } finally {
      // Clean up file
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (cleanupError) {
          console.error("Failed to clean up analysis file:", cleanupError);
        }
      }
    }
  },
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 50MB",
      });
    }
  }

  if (error.message === "Only PDF files are allowed") {
    return res.status(400).json({
      success: false,
      message: "Only PDF files are allowed",
    });
  }

  res.status(500).json({
    success: false,
    message: "Upload error",
    error: error.message,
  });
});

module.exports = router;
