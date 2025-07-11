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
      ".txt",
      ".odt",
      ".rtf",
      ".csv",
      ".ods",
      ".odp",
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

/**
 * @route   POST /api/libreoffice/text-to-pdf
 * @desc    Convert TXT to PDF using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/text-to-pdf",
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

      console.log(`🚀 LibreOffice TXT to PDF: ${req.file.originalname}`);

      const result = await libreofficeService.convertTxtToPdf(
        inputPath,
        outputPath,
        options,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.pdf"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ TXT to PDF completed in ${processingTime}ms`);
    } catch (error) {
      console.error("TXT to PDF conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "TXT to PDF conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/odt-to-pdf
 * @desc    Convert ODT to PDF using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/odt-to-pdf",
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

      console.log(`🚀 LibreOffice ODT to PDF: ${req.file.originalname}`);

      const result = await libreofficeService.convertOdtToPdf(
        inputPath,
        outputPath,
        options,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.pdf"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ ODT to PDF completed in ${processingTime}ms`);
    } catch (error) {
      console.error("ODT to PDF conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "ODT to PDF conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/rtf-to-pdf
 * @desc    Convert RTF to PDF using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/rtf-to-pdf",
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

      console.log(`🚀 LibreOffice RTF to PDF: ${req.file.originalname}`);

      const result = await libreofficeService.convertRtfToPdf(
        inputPath,
        outputPath,
        options,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.pdf"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ RTF to PDF completed in ${processingTime}ms`);
    } catch (error) {
      console.error("RTF to PDF conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "RTF to PDF conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/csv-to-xlsx
 * @desc    Convert CSV to XLSX using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/csv-to-xlsx",
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

      console.log(`🚀 LibreOffice CSV to XLSX: ${req.file.originalname}`);

      const result = await libreofficeService.convertCsvToXlsx(
        inputPath,
        outputPath,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.xlsx"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ CSV to XLSX completed in ${processingTime}ms`);
    } catch (error) {
      console.error("CSV to XLSX conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "CSV to XLSX conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/odt-to-docx
 * @desc    Convert ODT to DOCX using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/odt-to-docx",
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

      console.log(`🚀 LibreOffice ODT to DOCX: ${req.file.originalname}`);

      const result = await libreofficeService.convertOdtToDocx(
        inputPath,
        outputPath,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.docx"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ ODT to DOCX completed in ${processingTime}ms`);
    } catch (error) {
      console.error("ODT to DOCX conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "ODT to DOCX conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/rtf-to-docx
 * @desc    Convert RTF to DOCX using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/rtf-to-docx",
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

      console.log(`🚀 LibreOffice RTF to DOCX: ${req.file.originalname}`);

      const result = await libreofficeService.convertRtfToDocx(
        inputPath,
        outputPath,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.docx"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ RTF to DOCX completed in ${processingTime}ms`);
    } catch (error) {
      console.error("RTF to DOCX conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "RTF to DOCX conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/docx-to-odt
 * @desc    Convert DOCX to ODT using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/docx-to-odt",
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

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.odt`;
      outputPath = path.join(outputDir, outputFilename);

      console.log(`🚀 LibreOffice DOCX to ODT: ${req.file.originalname}`);

      const result = await libreofficeService.convertDocxToOdt(
        inputPath,
        outputPath,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type": "application/vnd.oasis.opendocument.text",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.odt"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ DOCX to ODT completed in ${processingTime}ms`);
    } catch (error) {
      console.error("DOCX to ODT conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "DOCX to ODT conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/xls-to-csv
 * @desc    Convert XLS to CSV using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/xls-to-csv",
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

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.csv`;
      outputPath = path.join(outputDir, outputFilename);

      console.log(`🚀 LibreOffice XLS to CSV: ${req.file.originalname}`);

      const result = await libreofficeService.convertXlsToCsv(
        inputPath,
        outputPath,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.csv"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ XLS to CSV completed in ${processingTime}ms`);
    } catch (error) {
      console.error("XLS to CSV conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "XLS to CSV conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/xlsx-to-ods
 * @desc    Convert XLSX to ODS using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/xlsx-to-ods",
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

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.ods`;
      outputPath = path.join(outputDir, outputFilename);

      console.log(`🚀 LibreOffice XLSX to ODS: ${req.file.originalname}`);

      const result = await libreofficeService.convertXlsxToOds(
        inputPath,
        outputPath,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type": "application/vnd.oasis.opendocument.spreadsheet",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.ods"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ XLSX to ODS completed in ${processingTime}ms`);
    } catch (error) {
      console.error("XLSX to ODS conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "XLSX to ODS conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/pptx-to-odp
 * @desc    Convert PPTX to ODP using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/pptx-to-odp",
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

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.odp`;
      outputPath = path.join(outputDir, outputFilename);

      console.log(`🚀 LibreOffice PPTX to ODP: ${req.file.originalname}`);

      const result = await libreofficeService.convertPptxToOdp(
        inputPath,
        outputPath,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type": "application/vnd.oasis.opendocument.presentation",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.odp"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ PPTX to ODP completed in ${processingTime}ms`);
    } catch (error) {
      console.error("PPTX to ODP conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "PPTX to ODP conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/pptx-to-png
 * @desc    Convert PPTX to PNG using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/pptx-to-png",
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

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.png`;
      outputPath = path.join(outputDir, outputFilename);

      console.log(`🚀 LibreOffice PPTX to PNG: ${req.file.originalname}`);

      const result = await libreofficeService.convertPptxToPng(
        inputPath,
        outputPath,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.png"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ PPTX to PNG completed in ${processingTime}ms`);
    } catch (error) {
      console.error("PPTX to PNG conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "PPTX to PNG conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      const filesToClean = [inputPath, outputPath].filter(Boolean);
      if (filesToClean.length > 0) {
        libreofficeService.cleanup(filesToClean).catch(console.warn);
      }
    }
  },
);

/**
 * @route   POST /api/libreoffice/doc-to-odt
 * @desc    Convert DOC to ODT using LibreOffice
 * @access  Public with rate limiting
 */
router.post(
  "/doc-to-odt",
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

      const outputFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}.odt`;
      outputPath = path.join(outputDir, outputFilename);

      console.log(`🚀 LibreOffice DOC to ODT: ${req.file.originalname}`);

      const result = await libreofficeService.convertDocToOdt(
        inputPath,
        outputPath,
      );

      const stats = await fs.stat(outputPath);
      const fileBuffer = await fs.readFile(outputPath);
      const processingTime = Date.now() - startTime;

      res.set({
        "Content-Type": "application/vnd.oasis.opendocument.text",
        "Content-Disposition": `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.odt"`,
        "Content-Length": stats.size,
        "X-Processing-Time": processingTime.toString(),
        "X-Conversion-Engine": "LibreOffice",
        "X-File-Size": stats.size.toString(),
      });

      res.send(fileBuffer);
      console.log(`✅ DOC to ODT completed in ${processingTime}ms`);
    } catch (error) {
      console.error("DOC to ODT conversion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "DOC to ODT conversion failed",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
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
