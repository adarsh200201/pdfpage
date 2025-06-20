const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const { optionalAuth, checkUsageLimit } = require("../middleware/auth");
const Usage = require("../models/Usage");
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10, // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// @route   POST /api/pdf/merge
// @desc    Merge PDF files
// @access  Public (with optional auth and usage limits)
router.post(
  "/merge",
  optionalAuth,
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

      // Import PDF-lib dynamically (since it's ESM)
      const { PDFDocument } = await import("pdf-lib");

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
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: sessionId || null,
          toolUsed: "merge",
          fileCount: files.length,
          totalFileSize: totalSize,
          processingTime,
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip || req.connection.remoteAddress,
          success: true,
        });

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
        await Usage.trackOperation({
          userId: req.user ? req.user._id : null,
          sessionId: req.body.sessionId || null,
          toolUsed: "merge",
          fileCount: req.files ? req.files.length : 0,
          totalFileSize: req.files
            ? req.files.reduce((sum, file) => sum + file.size, 0)
            : 0,
          processingTime: Date.now() - startTime,
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip || req.connection.remoteAddress,
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
// @desc    Compress PDF file
// @access  Public (with optional auth and usage limits)
router.post(
  "/compress",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("quality")
      .optional()
      .isFloat({ min: 0.1, max: 1.0 })
      .withMessage("Quality must be between 0.1 and 1.0"),
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

      const { quality = 0.7, sessionId } = req.body;
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
      const { PDFDocument } = await import("pdf-lib");

      // Load and compress PDF
      const pdfDoc = await PDFDocument.load(file.buffer);

      // Basic compression: remove metadata and optimize
      pdfDoc.setTitle("");
      pdfDoc.setAuthor("");
      pdfDoc.setSubject("");
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer("PdfPage Compressor");
      pdfDoc.setCreator("PdfPage");

      // Save with compression options
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      const processingTime = Date.now() - startTime;
      const compressionRatio = (
        ((file.size - pdfBytes.length) / file.size) *
        100
      ).toFixed(1);

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
          ipAddress: req.ip || req.connection.remoteAddress,
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

      // Send the compressed PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="compressed-${file.originalname}"`,
      );
      res.setHeader("Content-Length", pdfBytes.length);
      res.setHeader("X-Compression-Ratio", compressionRatio);
      res.send(Buffer.from(pdfBytes));
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
          ipAddress: req.ip || req.connection.remoteAddress,
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
      const { PDFDocument } = await import("pdf-lib");

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
          ipAddress: req.ip || req.connection.remoteAddress,
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

      // For now, return the first page as an example
      // In production, you might want to create a ZIP file or return download links
      const firstPage = splitPdfs[0];

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${firstPage.fileName}"`,
      );
      res.setHeader("X-Total-Pages", pageCount);
      res.setHeader("X-Page-Number", "1");
      res.send(firstPage.data);
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
          ipAddress: req.ip || req.connection.remoteAddress,
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

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 100MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum is 10 files.",
      });
    }
  }

  if (error.message === "Only PDF files are allowed") {
    return res.status(400).json({
      success: false,
      message: "Only PDF files are allowed.",
    });
  }

  next(error);
});

module.exports = router;
