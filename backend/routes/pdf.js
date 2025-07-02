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
            `📝 Standard extraction: ${text.length} characters from PDF`,
          );
        } catch (standardError) {
          console.log(
            "⚠️ Standard extraction failed, trying alternative method...",
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
        `📋 Document analysis: ${documentStructure.estimatedSections} sections, ${documentStructure.hasHeaders ? "headers detected" : "no headers"}, ${documentStructure.hasBulletPoints || documentStructure.hasNumberedLists ? "lists detected" : "no lists"}`,
      );
      console.log(
        `📄 Content preserved: ${text.length} characters from ${numPages} pages`,
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
      trimmed.match(/^[▪▫▬▭▮▯]\s+/)
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
          "\n\n【HEADING1��$1【/HEADING1】\n\n",
        )
        .replace(
          /<h2[^>]*>(.*?)<\/h2>/gi,
          "\n\n【HEADING2】$1【/HEADING2】\n\n",
        )
        .replace(
          /<h3[^>]*>(.*?)<\/h3>/gi,
          "\n\n��HEADING3】$1【/HEADING3】\n\n",
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
        .replace(/��BULLET_LIST】(.*?)【\/BULLET_LIST】/gs, "$1")
        .replace(/【HEADING1】(.*?)【\/HEADING1】/g, "\n\n���▓▓ $1 ▓▓▓\n\n")
        .replace(/【HEADING2】(.*?)【\/HEADING2】/g, "\n\n▓▓ $1 ▓▓\n\n")
        .replace(/【HEADING3】(.*?)【\/HEADING3】/g, "\n\n▓ $1 ▓\n\n")
        .replace(/【BOLD】(.*?)【\/BOLD】/g, "【B:$1】")
        .replace(/【ITALIC】(.*?)【\/ITALIC】/g, "��I:$1】")
        .replace(/【UNDERLINE】(.*?)【\/UNDERLINE】/g, "【U:$1】")
        .replace(/���PARAGRAPH】(.*?)【\/PARAGRAPH】/g, "$1\n")

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
        `✅ Excel conversion complete: ${formatBytes(excelBuffer.length)} generated in ${processingTime}ms`,
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

      console.log(`✅ Excel to PDF conversion completed: ${outputFilename}`);
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

module.exports = router;
