const express = require("express");
const multer = require("multer");
const router = express.Router();
const ProfessionalCompressionService = require("../services/professionalCompressionService");

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// @route   POST /api/pdf/compress-pro
// @desc    Compress PDF using professional Ghostscript compression
// @access  Public
router.post("/compress-pro", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded",
      });
    }

    const { level = "balanced", quality, dpi, pdfSettings } = req.body;

    console.log("🔄 Starting PDF compression:", {
      filename: req.file.originalname,
      size: req.file.size,
      level,
    });

    const compressionService = ProfessionalCompressionService;

    // Check if Ghostscript is available
    const isGhostscriptAvailable =
      await compressionService.checkGhostscriptAvailability();

    if (!isGhostscriptAvailable) {
      return res.status(503).json({
        success: false,
        message:
          "GHOSTSCRIPT service unavailable. PDF compression requires Ghostscript to be installed on the server.",
        error: "GHOSTSCRIPT_NOT_AVAILABLE",
      });
    }

    // Prepare compression options
    const compressionOptions = {
      level: level,
      quality: quality ? parseInt(quality) : undefined,
      dpi: dpi ? parseInt(dpi) : undefined,
      pdfSettings: pdfSettings,
    };

    // Compress the PDF
    const result = await compressionService.compressPDF(
      req.file.buffer,
      req.file.originalname,
      compressionOptions,
    );

    // Set compression stats in headers
    res.setHeader("X-Original-Size", req.file.size);
    res.setHeader("X-Compressed-Size", result.buffer.length);
    res.setHeader(
      "X-Compression-Ratio",
      (((req.file.size - result.buffer.length) / req.file.size) * 100).toFixed(
        1,
      ),
    );

    // Send compressed PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="compressed-${req.file.originalname}"`,
    );

    console.log("✅ PDF compression completed:", {
      originalSize: req.file.size,
      compressedSize: result.buffer.length,
      compressionRatio:
        (
          ((req.file.size - result.buffer.length) / req.file.size) *
          100
        ).toFixed(1) + "%",
    });

    res.send(result.buffer);
  } catch (error) {
    console.error("❌ PDF compression error:", error);

    let errorMessage = "Failed to compress PDF";
    let statusCode = 500;

    if (error.message.includes("GHOSTSCRIPT")) {
      errorMessage = "GHOSTSCRIPT service unavailable";
      statusCode = 503;
    } else if (error.message.includes("timeout")) {
      errorMessage = "Compression timeout - file may be too large or complex";
      statusCode = 408;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
});

// @route   POST /api/pdf/protect
// @desc    Protect PDF with password and permissions
// @access  Public
router.post("/protect", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded",
      });
    }

    const { password, permissions } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required for protection",
      });
    }

    console.log("🔐 Starting PDF protection:", {
      filename: req.file.originalname,
      size: req.file.size,
      hasPassword: !!password,
      permissions: permissions ? JSON.parse(permissions) : {},
    });

    const PDFProtectionService = require("../services/pdfProtectionService");

    // Pre-check available encryption methods to fail fast with details
    try {
      const availability = await PDFProtectionService.checkEncryptionAvailability();
      // nodeQPDF2 depends on the qpdf CLI; require qpdfCmd as well for nodeQPDF2 to be usable
    const usable = (availability.nodeQPDF2 && availability.qpdfCmd) || availability.nodeQPDF || availability.qpdfCmd || availability.ghostscript || availability.pdfEncryptModule;
      if (!usable) {
        console.error('❌ No encryption methods available on server', availability);
        return res.status(503).json({
          success: false,
          error: "PDF encryption failed",
          message: "Server has no available encryption tools (qpdf/ghostscript/pdf-encrypt).",
          code: "ENCRYPTION_FAILED",
          availability,
        });
      }
    } catch (availErr) {
      console.warn('Could not determine encryption availability:', availErr && availErr.message ? availErr.message : availErr);
    }

    const result = await PDFProtectionService.protectPDF(
      req.file.buffer,
      password,
      {
        permissions: permissions ? JSON.parse(permissions) : {},
      }
    );

    // If the operation failed completely, return 503
    if (!result.success) {
      console.error("❌ PDF encryption failed - operation failed completely");
      let availability = null;
      try {
        availability = await PDFProtectionService.checkEncryptionAvailability();
      } catch (e) {
        // ignore
      }
      return res.status(503).json({
        success: false,
        error: "PDF encryption failed",
        message: "Server encryption failed. Please try again later.",
        code: "ENCRYPTION_FAILED",
        availability,
      });
    }

    // Normalize buffer
    let outBuffer = result.buffer;
    if (!Buffer.isBuffer(outBuffer)) {
      outBuffer = Buffer.from(outBuffer);
    }

    // Validate it's a PDF by checking header and trying to load with pdf-lib
    const { PDFDocument } = require('pdf-lib');
    let isValidPdf = false;
    try {
      if (outBuffer.slice(0,4).toString() === '%PDF') {
        // attempt to parse
        await PDFDocument.load(outBuffer);
        isValidPdf = true;
      }
    } catch (pdfErr) {
      console.error('Produced file is not a valid PDF or is corrupted:', pdfErr && pdfErr.message ? pdfErr.message : pdfErr);
      isValidPdf = false;
    }

    if (!isValidPdf) {
      console.error('❌ Validation failed: produced PDF is corrupted or invalid.');
      // return diagnostic error instead of sending a broken file
      return res.status(500).json({
        success: false,
        error: 'INVALID_PDF_PRODUCED',
        message: 'Server produced an invalid or corrupted PDF. Please check server logs for details or try again.',
      });
    }

    // If not truly encrypted, fail instead of returning an unprotected file
    if (!result.encrypted) {
      console.warn('⚠️ PDF processed but not encrypted. Failing with ENCRYPTION_FAILED.');
      let availability = null;
      try {
        availability = await PDFProtectionService.checkEncryptionAvailability();
      } catch (e) {
        // ignore
      }
      return res.status(503).json({
        success: false,
        error: "PDF encryption failed",
        message: "Server could not apply real encryption. Please try again later.",
        code: "ENCRYPTION_FAILED",
        availability,
      });
    }

    // Set response headers for successful encryption
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${req.file.originalname.replace('.pdf', '_protected.pdf')}"`);
    res.setHeader("X-Protection-Level", result.method || 'aes');
    res.setHeader("X-Encryption-Method", result.method || 'aes');
    res.setHeader("X-Original-Size", req.file.size.toString());
    res.setHeader("X-Protected-Size", outBuffer.length.toString());
    res.setHeader("X-Encrypted", "true");

    console.log("✅ PDF protection completed with real encryption:", {
      method: result.method,
      originalSize: req.file.size,
      protectedSize: outBuffer.length,
      encrypted: true,
    });

    return res.send(outBuffer);
    res.setHeader("Content-Disposition", `attachment; filename="${req.file.originalname.replace('.pdf', '_protected.pdf')}"`);
    res.setHeader("X-Protection-Level", result.method);
    res.setHeader("X-Encryption-Method", result.method);
    res.setHeader("X-Original-Size", req.file.size.toString());
    res.setHeader("X-Protected-Size", result.buffer.length.toString());
    res.setHeader("X-Encrypted", "true");

    console.log("✅ PDF protection completed with real encryption:", {
      method: result.method,
      originalSize: req.file.size,
      protectedSize: result.buffer.length,
      encrypted: true,
    });

    res.send(result.buffer);
  } catch (error) {
    // Log full stack for debugging
    console.error("❌ PDF protection failed:", error && error.stack ? error.stack : error);

    let errorMessage = "Failed to protect PDF";
    let statusCode = 500;
    let code = null;

    if (error && error.code === 'ENCRYPTION_FAILED') {
      errorMessage = "Server encryption tools unavailable. Cannot provide secure password protection.";
      statusCode = 503;
      code = 'ENCRYPTION_FAILED';
    } else if (error && /password/i.test(error.message)) {
      errorMessage = "Invalid password or protection settings";
      statusCode = 400;
    } else if (error && /timeout/i.test(error.message)) {
      errorMessage = "Protection timeout - file may be too large or complex";
      statusCode = 408;
    }

    const payload = {
      success: false,
      message: errorMessage,
      error: error && error.message ? error.message : String(error),
    };

    if (code) payload.code = code;

    res.status(statusCode).json(payload);
  }
});

// New route: GET /api/pdf/protect-status
router.get('/protect-status', async (req, res) => {
  try {
    const PDFProtectionService = require('../services/pdfProtectionService');
    const availability = await PDFProtectionService.checkEncryptionAvailability();
    // nodeQPDF2 depends on the qpdf CLI; require qpdfCmd as well for nodeQPDF2 to be usable
    const usable = (availability.nodeQPDF2 && availability.qpdfCmd) || availability.nodeQPDF || availability.qpdfCmd || availability.ghostscript || availability.pdfEncryptModule;

    res.json({
      success: true,
      usable,
      availability,
    });
  } catch (error) {
    console.error('Error checking protect status:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

module.exports = router;
