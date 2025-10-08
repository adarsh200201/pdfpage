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

    const result = await PDFProtectionService.protectPDF(
      req.file.buffer,
      password,
      {
        permissions: permissions ? JSON.parse(permissions) : {},
      }
    );

    // Check if encryption was successful
    if (!result.success || !result.encrypted) {
      console.error("❌ PDF encryption failed - cannot provide secure protection");
      return res.status(503).json({
        error: "PDF encryption failed",
        message: "Server encryption tools are not available. Cannot provide secure password protection.",
        code: "ENCRYPTION_FAILED"
      });
    }

    // Set response headers for successful encryption
    res.setHeader("Content-Type", "application/pdf");
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

module.exports = router;
