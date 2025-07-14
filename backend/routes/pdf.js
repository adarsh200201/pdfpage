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

module.exports = router;
