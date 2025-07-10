const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");
const libreofficeService = require("../services/libreofficeService");
const { optionalAuth } = require("../middleware/auth");
const { ipUsageLimitChain } = require("../middleware/ipUsageLimit");

const router = express.Router();

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
    const allowedExtensions = [
      ".docx",
      ".pdf",
      ".pptx",
      ".xlsx",
      ".doc",
      ".ppt",
      ".xls",
    ];
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${extension}`));
    }
  },
});

/**
 * @route   GET /api/libreoffice/status
 * @desc    Get LibreOffice service status
 * @access  Public
 */
router.get("/status", async (req, res) => {
  try {
    const status = await libreofficeService.getStatus();
    res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error("LibreOffice status check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check LibreOffice status",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/libreoffice/docx-to-pdf
 * @desc    Convert DOCX to PDF using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/docx-to-pdf",
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

      console.log(`🚀 LibreOffice DOCX to PDF: ${req.file.originalname}`);

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
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, ".docx")}.pdf"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);

      console.log(`✅ DOCX to PDF completed in ${processingTime}ms`);
    } catch (error) {
      console.error("DOCX to PDF conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "DOCX to PDF conversion failed",
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
 * @route   POST /api/libreoffice/pdf-to-docx
 * @desc    Convert PDF to DOCX using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/pdf-to-docx",
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

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.docx`;
      outputPath = path.join(outputDir, outputFilename);

      const options = {
        preserveLayout: req.body.preserveLayout !== "false",
      };

      console.log(`🚀 LibreOffice PDF to DOCX: ${req.file.originalname}`);

      const result = await libreofficeService.convertPdfToDocx(
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
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, ".pdf")}.docx"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);

      console.log(`✅ PDF to DOCX completed in ${processingTime}ms`);
    } catch (error) {
      console.error("PDF to DOCX conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "PDF to DOCX conversion failed",
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
 * @route   POST /api/libreoffice/pptx-to-pdf
 * @desc    Convert PPTX to PDF using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/pptx-to-pdf",
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

      console.log(`🚀 LibreOffice PPTX to PDF: ${req.file.originalname}`);

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
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, ".pptx")}.pdf"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);

      console.log(`✅ PPTX to PDF completed in ${processingTime}ms`);
    } catch (error) {
      console.error("PPTX to PDF conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "PPTX to PDF conversion failed",
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
 * @route   POST /api/libreoffice/xlsx-to-pdf
 * @desc    Convert XLSX to PDF using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/xlsx-to-pdf",
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

      console.log(`🚀 LibreOffice XLSX to PDF: ${req.file.originalname}`);

      const result = await libreofficeService.convertXlsxToPdf(
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
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, ".xlsx")}.pdf"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);

      console.log(`✅ XLSX to PDF completed in ${processingTime}ms`);
    } catch (error) {
      console.error("XLSX to PDF conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "XLSX to PDF conversion failed",
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
 * @route   POST /api/libreoffice/pdf-to-xlsx
 * @desc    Convert PDF to XLSX using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/pdf-to-xlsx",
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

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.xlsx`;
      outputPath = path.join(outputDir, outputFilename);

      const options = {
        preserveFormatting: req.body.preserveFormatting !== "false",
      };

      console.log(`🚀 LibreOffice PDF to XLSX: ${req.file.originalname}`);

      const result = await libreofficeService.convertPdfToXlsx(
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
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, ".pdf")}.xlsx"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);

      console.log(`✅ PDF to XLSX completed in ${processingTime}ms`);
    } catch (error) {
      console.error("PDF to XLSX conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "PDF to XLSX conversion failed",
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
