const express = require("express");
const router = express.Router();
const libreofficeService = require("../services/libreofficeService");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");
const { optionalAuth } = require("../middleware/auth");
const { ipUsageLimitChain } = require("../middleware/ipUsageLimit");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../temp/input");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".docx", ".doc", ".pptx", ".ppt", ".pdf"];
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${extension}`));
    }
  },
});

// Basic health check route
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "PDF routes are working",
    timestamp: new Date().toISOString(),
  });
});

// System status route - includes LibreOffice availability
router.get("/system-status", async (req, res) => {
  try {
    const libreofficeStatus = await libreofficeService.getStatus();

    res.json({
      success: true,
      libreoffice: libreofficeStatus.available,
      system: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
      services: {
        libreoffice: libreofficeStatus,
      },
    });
  } catch (error) {
    console.error("System status check error:", error);
    res.status(500).json({
      success: false,
      libreoffice: false,
      message: "Failed to check system status",
      error: error.message,
    });
  }
});

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "PDF test route working",
  });
});

/**
 * @route   POST /api/pdf/word-to-pdf-libreoffice
 * @desc    Convert Word documents to PDF using LibreOffice (alias for docx-to-pdf)
 * @access  Public with rate limiting
 */
router.post(
  "/word-to-pdf-libreoffice",
  optionalAuth,
  ...ipUsageLimitChain,
  upload.single("file"),
  async (req, res) => {
    let inputPath = null;
    let outputPath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const startTime = Date.now();
      inputPath = req.file.path;
      const outputDir = path.join(__dirname, "../temp/output");
      await fs.mkdir(outputDir, { recursive: true });

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.pdf`;
      outputPath = path.join(outputDir, outputFilename);

      const options = {
        quality: req.body.quality || "standard",
        preserveFormatting: req.body.preserveFormatting !== "false",
      };

      console.log(`🚀 LibreOffice Word to PDF: ${req.file.originalname}`);

      const result = await libreofficeService.convertDocxToPdf(
        inputPath,
        outputPath,
        options,
      );

      // Check output file size and read for response
      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);

      const processingTime = Date.now() - startTime;

      // Set response headers
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.pdf"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);

      console.log(`✅ Word to PDF completed in ${processingTime}ms`);
    } catch (error) {
      console.error("Word to PDF conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Word to PDF conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      // Cleanup files
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/pdf/pdf-to-powerpoint-libreoffice
 * @desc    Convert PDF to PowerPoint using LibreOffice (alias for pdf-to-pptx)
 * @access  Public with rate limiting
 */
router.post(
  "/pdf-to-powerpoint-libreoffice",
  optionalAuth,
  ...ipUsageLimitChain,
  upload.single("file"),
  async (req, res) => {
    let inputPath = null;
    let outputPath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const startTime = Date.now();
      inputPath = req.file.path;
      const outputDir = path.join(__dirname, "../temp/output");
      await fs.mkdir(outputDir, { recursive: true });

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.pptx`;
      outputPath = path.join(outputDir, outputFilename);

      const options = {
        preserveLayout: req.body.preserveLayout !== "false",
      };

      console.log(`🚀 LibreOffice PDF to PowerPoint: ${req.file.originalname}`);

      const result = await libreofficeService.convertPdfToPptx(
        inputPath,
        outputPath,
        options,
      );

      // Check output file size and read for response
      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);

      const processingTime = Date.now() - startTime;

      // Set response headers
      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, ".pdf")}.pptx"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);

      console.log(`✅ PDF to PowerPoint completed in ${processingTime}ms`);
    } catch (error) {
      console.error("PDF to PowerPoint conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "PDF to PowerPoint conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      // Cleanup files
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/pdf/powerpoint-to-pdf-libreoffice
 * @desc    Convert PowerPoint presentations to PDF using LibreOffice (alias for pptx-to-pdf)
 * @access  Public with rate limiting
 */
router.post(
  "/powerpoint-to-pdf-libreoffice",
  optionalAuth,
  ...ipUsageLimitChain,
  upload.single("file"),
  async (req, res) => {
    let inputPath = null;
    let outputPath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const startTime = Date.now();
      inputPath = req.file.path;
      const outputDir = path.join(__dirname, "../temp/output");
      await fs.mkdir(outputDir, { recursive: true });

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.pdf`;
      outputPath = path.join(outputDir, outputFilename);

      const options = {
        quality: req.body.quality || "standard",
      };

      console.log(`🚀 LibreOffice PowerPoint to PDF: ${req.file.originalname}`);

      const result = await libreofficeService.convertPptxToPdf(
        inputPath,
        outputPath,
        options,
      );

      // Check output file size and read for response
      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);

      const processingTime = Date.now() - startTime;

      // Set response headers
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.pdf"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);

      console.log(`✅ PowerPoint to PDF completed in ${processingTime}ms`);
    } catch (error) {
      console.error("PowerPoint to PDF conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "PowerPoint to PDF conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      // Cleanup files
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
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
        message: "File too large. Maximum size is 50MB.",
      });
    }
  }

  res.status(400).json({
    success: false,
    message: error.message || "File upload error",
  });
});

module.exports = router;
