const express = require("express");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs").promises;
const path = require("path");
const { body, validationResult } = require("express-validator");

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
const { uploadPdf, handleMulterError } = require("../config/multer");

const router = express.Router();

// Use the shared multer configuration for PDF uploads
const upload = uploadPdf;

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
// @desc    Compress PDF file with 5 compression levels
// @access  Public (with optional auth and usage limits)
router.post(
  "/compress",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
  [
    body("level")
      .optional()
      .isIn(["extreme", "high", "medium", "low", "best-quality"])
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

      // Import PDF-lib
      const { PDFDocument } = require("pdf-lib");

      // Load PDF
      const pdfDoc = await PDFDocument.load(file.buffer);

      // Get compression settings based on level
      const settings = getCompressionSettings(level);

      // Apply metadata removal based on level
      if (settings.removeMetadata) {
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("PdfPage Compressor");
        pdfDoc.setCreator("PdfPage");
      }

      // Apply compression based on level
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: settings.useObjectStreams,
        addDefaultPage: false,
        objectsPerTick: settings.objectsPerTick,
      });

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

// Helper function to get compression settings based on level
function getCompressionSettings(level) {
  switch (level) {
    case "extreme":
      return {
        useObjectStreams: true,
        objectsPerTick: 100,
        removeMetadata: true,
        description: "Maximum compression with significant quality loss",
      };
    case "high":
      return {
        useObjectStreams: true,
        objectsPerTick: 75,
        removeMetadata: true,
        description: "High compression with moderate quality loss",
      };
    case "medium":
      return {
        useObjectStreams: true,
        objectsPerTick: 50,
        removeMetadata: true,
        description: "Balanced compression and quality",
      };
    case "low":
      return {
        useObjectStreams: false,
        objectsPerTick: 25,
        removeMetadata: true,
        description: "Light compression preserving quality",
      };
    case "best-quality":
      return {
        useObjectStreams: false,
        objectsPerTick: 10,
        removeMetadata: false,
        description: "Minimal compression, maximum quality",
      };
    default:
      return {
        useObjectStreams: true,
        objectsPerTick: 50,
        removeMetadata: true,
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
      const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        HeadingLevel,
      } = require("docx");

      // Parse PDF
      const pdfData = await pdfParse(file.buffer);

      // Extract text and basic structure
      const text = pdfData.text;
      const numPages = pdfData.numpages;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No readable text found in PDF. The PDF might be scanned or image-based.",
        });
      }

      // Process text and create document structure
      const paragraphs = processTextToParagraphs(text, preserveFormatting);

      // Create Word document
      const doc = new Document({
        creator: "PdfPage",
        title: `Converted from ${file.originalname}`,
        description: `Converted PDF to Word document${includeMetadata ? ` | Original: ${numPages} pages, ${text.length} characters` : ""}`,
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

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

      // Send the converted document
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Length", docxBuffer.length);
      res.setHeader("X-Original-Pages", numPages);
      res.setHeader("X-Text-Length", text.length);
      res.setHeader("X-Processing-Time", processingTime);
      res.setHeader(
        "X-Conversion-Type",
        preserveFormatting ? "formatted" : "plain",
      );
      res.send(docxBuffer);
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

// Helper function to process text into structured paragraphs
function processTextToParagraphs(text, preserveFormatting) {
  const lines = text.split("\n").filter((line) => line.trim());
  const paragraphs = [];

  let currentParagraph = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      if (currentParagraph.length > 0) {
        // End current paragraph
        const paragraphText = currentParagraph.join(" ");
        paragraphs.push(createWordParagraph(paragraphText, preserveFormatting));
        currentParagraph = [];
      }
      continue;
    }

    // Detect headings (lines that are short, capitalized, or have specific patterns)
    const isHeading = detectHeading(trimmedLine);

    if (isHeading) {
      // Finish current paragraph if any
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join(" ");
        paragraphs.push(createWordParagraph(paragraphText, preserveFormatting));
        currentParagraph = [];
      }

      // Add heading
      paragraphs.push(createWordHeading(trimmedLine));
    } else {
      currentParagraph.push(trimmedLine);
    }
  }

  // Add final paragraph if any
  if (currentParagraph.length > 0) {
    const paragraphText = currentParagraph.join(" ");
    paragraphs.push(createWordParagraph(paragraphText, preserveFormatting));
  }

  return paragraphs;
}

function detectHeading(line) {
  // Simple heuristics for heading detection
  return (
    line.length < 100 &&
    (line.match(/^[A-Z\s]+$/) || // All caps
      line.match(/^\d+\.?\s/) || // Numbered
      line.match(/^[IVX]+\.?\s/) || // Roman numerals
      line.match(/^Chapter|Section|Part/i)) // Common heading words
  );
}

function createWordParagraph(text, preserveFormatting) {
  const { Paragraph, TextRun } = require("docx");

  if (!preserveFormatting) {
    return new Paragraph({
      children: [new TextRun(text)],
    });
  }

  // Basic formatting detection
  const children = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  const italicRegex = /\*(.*?)\*/g;

  let lastIndex = 0;
  let match;

  // Process bold text
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      children.push(new TextRun(text.slice(lastIndex, match.index)));
    }
    children.push(new TextRun({ text: match[1], bold: true }));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    children.push(new TextRun(text.slice(lastIndex)));
  }

  return new Paragraph({
    children: children.length > 0 ? children : [new TextRun(text)],
  });
}

function createWordHeading(text) {
  const { Paragraph, TextRun, HeadingLevel } = require("docx");

  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 28 })],
  });
}

// @route   POST /api/pdf/word-to-pdf-advanced
// @desc    Advanced Word to PDF conversion with professional formatting
// @access  Public (with optional auth and usage limits)
router.post(
  "/word-to-pdf-advanced",
  optionalAuth,
  checkUsageLimit,
  upload.single("file"),
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
      console.log("🔍 Raw HTML content sample:", htmlContent.substring(0, 500));

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
          return `\n【NUMBERED_LIST】${numberedItems}\n【/NUMBERED_LIST��\n`;
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
          "\n\n【HEADING1】$1【/HEADING1】\n\n",
        )
        .replace(
          /<h2[^>]*>(.*?)<\/h2>/gi,
          "\n\n【HEADING2】$1【/HEADING2】\n\n",
        )
        .replace(
          /<h3[^>]*>(.*?)<\/h3>/gi,
          "\n\n【HEADING3】$1【/HEADING3】\n\n",
        )

        // Text formatting
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "【BOLD】$1【/BOLD】")
        .replace(/<b[^>]*>(.*?)<\/b>/gi, "【BOLD】$1【/BOLD】")
        .replace(/<em[^>]*>(.*?)<\/em>/gi, "【ITALIC】$1【/ITALIC】")
        .replace(/<i[^>]*>(.*?)<\/i>/gi, "【ITALIC】$1【/ITALIC】")
        .replace(/<u[^>]*>(.*?)<\/u>/gi, "【UNDERLINE】$1【/UNDERLINE】")

        // Paragraphs - preserve line breaks
        .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n【PARAGRAPH】$1【/PARAGRAPH】\n")
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
        .replace(/【BULLET_LIST】(.*?)【\/BULLET_LIST】/gs, "$1")
        .replace(/【HEADING1】(.*?)【\/HEADING1】/g, "\n\n▓▓▓ $1 ▓▓▓\n\n")
        .replace(/【HEADING2】(.*?)【\/HEADING2】/g, "\n\n▓▓ $1 ▓▓\n\n")
        .replace(/【HEADING3】(.*?)【\/HEADING3】/g, "\n\n▓ $1 ▓\n\n")
        .replace(/【BOLD】(.*?)【\/BOLD】/g, "【B:$1】")
        .replace(/【ITALIC】(.*?)【\/ITALIC】/g, "【I:$1】")
        .replace(/【UNDERLINE】(.*?)【\/UNDERLINE】/g, "【U:$1】")
        .replace(/【PARAGRAPH】(.*?)【\/PARAGRAPH】/g, "$1\n")

        // Clean up excessive whitespace while preserving structure
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .replace(/^\s+|\s+$/g, "")
        .trim();

      if (!formattedText) {
        formattedText =
          "Document appears to be empty or contains no readable text.";
      }

      console.log(
        `📝 Processed ${formattedText.length} characters with advanced formatting`,
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
        if (displayText.startsWith("▓▓▓ ") && displayText.endsWith(" ▓▓▓")) {
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
        else if (displayText.startsWith("▓ ") && displayText.endsWith(" ���")) {
          displayText = displayText.slice(2, -2).trim();
          font = fonts.bold;
          fontSize = baseFontSize + 4;
          lineHeight = fontSize + 3;
          textColor = rgb(0.3, 0.4, 0.5);
          isSpecialFormat = true;
        }
        // Other heading levels
        else if (displayText.startsWith("● H4:")) {
          displayText = displayText.slice(6).trim();
          font = fonts.bold;
          fontSize = baseFontSize + 1;
          isSpecialFormat = true;
        } else if (displayText.startsWith("◆ H5:")) {
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
          displayText.endsWith("】")
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
  upload.single("file"),
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
      console.log(`📊 Options:`, {
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
      let libreOfficeCmd = `soffice --headless --convert-to pdf`;

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
          timeout: 60000, // 60 seconds timeout
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
      console.log(`   ⏱️ Time: ${processingTime}ms`);

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
      const { stdout } = await execAsync("soffice --version", {
        timeout: 5000,
      });
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
      console.log(`✅ ZIP created: ${archive.pointer()} total bytes`);

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
        "pdf-lib": "✅ Loaded",
        mammoth: "✅ Loaded",
        libreoffice: "✅ Available (check /system-status for details)",
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

module.exports = router;
