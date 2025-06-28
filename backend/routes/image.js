const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const { body, validationResult } = require("express-validator");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// @route   POST /api/image/crop
// @desc    Crop image with specified coordinates and settings
// @access  Private
router.post(
  "/crop",
  auth,
  upload.single("image"),
  [
    body("x")
      .isInt({ min: 0 })
      .withMessage("X coordinate must be a positive integer"),
    body("y")
      .isInt({ min: 0 })
      .withMessage("Y coordinate must be a positive integer"),
    body("width")
      .isInt({ min: 1 })
      .withMessage("Width must be a positive integer"),
    body("height")
      .isInt({ min: 1 })
      .withMessage("Height must be a positive integer"),
    body("rotation")
      .optional()
      .isFloat()
      .withMessage("Rotation must be a number"),
    body("flipHorizontal")
      .optional()
      .isBoolean()
      .withMessage("Flip horizontal must be boolean"),
    body("flipVertical")
      .optional()
      .isBoolean()
      .withMessage("Flip vertical must be boolean"),
    body("quality")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Quality must be between 1-100"),
    body("format")
      .optional()
      .isIn(["jpeg", "png", "webp"])
      .withMessage("Format must be jpeg, png, or webp"),
  ],
  async (req, res) => {
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
        x,
        y,
        width,
        height,
        rotation = 0,
        flipHorizontal = false,
        flipVertical = false,
        quality = 90,
        format = "jpeg",
      } = req.body;

      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Image file is required",
        });
      }

      // Convert string values to numbers
      const cropX = parseInt(x);
      const cropY = parseInt(y);
      const cropWidth = parseInt(width);
      const cropHeight = parseInt(height);
      const imageQuality = parseInt(quality);
      const rotationAngle = parseFloat(rotation);

      // Process image with Sharp
      let imageProcessor = sharp(file.buffer);

      // Get original image metadata
      const metadata = await imageProcessor.metadata();

      // Validate crop coordinates
      if (
        cropX + cropWidth > metadata.width ||
        cropY + cropHeight > metadata.height
      ) {
        return res.status(400).json({
          success: false,
          message: "Crop area exceeds image boundaries",
        });
      }

      // Apply transformations
      if (rotationAngle !== 0) {
        imageProcessor = imageProcessor.rotate(rotationAngle);
      }

      if (flipHorizontal) {
        imageProcessor = imageProcessor.flop();
      }

      if (flipVertical) {
        imageProcessor = imageProcessor.flip();
      }

      // Extract crop area
      imageProcessor = imageProcessor.extract({
        left: cropX,
        top: cropY,
        width: cropWidth,
        height: cropHeight,
      });

      // Set output format and quality
      switch (format) {
        case "jpeg":
          imageProcessor = imageProcessor.jpeg({ quality: imageQuality });
          break;
        case "png":
          imageProcessor = imageProcessor.png({
            quality: imageQuality,
            compressionLevel: Math.floor((100 - imageQuality) / 10),
          });
          break;
        case "webp":
          imageProcessor = imageProcessor.webp({ quality: imageQuality });
          break;
      }

      // Process the image
      const processedBuffer = await imageProcessor.toBuffer();
      const processedMetadata = await sharp(processedBuffer).metadata();

      // Set response headers
      res.set({
        "Content-Type": `image/${format}`,
        "Content-Length": processedBuffer.length,
        "Content-Disposition": `attachment; filename="cropped-${Date.now()}.${format}"`,
      });

      // Send processed image
      res.send(processedBuffer);
    } catch (error) {
      console.error("Image crop error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to crop image",
        error: error.message,
      });
    }
  },
);

// @route   POST /api/image/resize
// @desc    Resize image while maintaining aspect ratio
// @access  Private
router.post(
  "/resize",
  auth,
  upload.single("image"),
  [
    body("width")
      .optional()
      .isInt({ min: 1, max: 4000 })
      .withMessage("Width must be between 1-4000"),
    body("height")
      .optional()
      .isInt({ min: 1, max: 4000 })
      .withMessage("Height must be between 1-4000"),
    body("fit")
      .optional()
      .isIn(["cover", "contain", "fill", "inside", "outside"])
      .withMessage("Invalid fit option"),
    body("quality")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Quality must be between 1-100"),
    body("format")
      .optional()
      .isIn(["jpeg", "png", "webp"])
      .withMessage("Format must be jpeg, png, or webp"),
  ],
  async (req, res) => {
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
        width,
        height,
        fit = "cover",
        quality = 90,
        format = "jpeg",
      } = req.body;

      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Image file is required",
        });
      }

      // Process image with Sharp
      let imageProcessor = sharp(file.buffer);

      // Resize options
      const resizeOptions = {
        fit: sharp.fit[fit],
        withoutEnlargement: false,
      };

      if (width) resizeOptions.width = parseInt(width);
      if (height) resizeOptions.height = parseInt(height);

      imageProcessor = imageProcessor.resize(resizeOptions);

      // Set output format and quality
      const imageQuality = parseInt(quality);
      switch (format) {
        case "jpeg":
          imageProcessor = imageProcessor.jpeg({ quality: imageQuality });
          break;
        case "png":
          imageProcessor = imageProcessor.png({
            quality: imageQuality,
            compressionLevel: Math.floor((100 - imageQuality) / 10),
          });
          break;
        case "webp":
          imageProcessor = imageProcessor.webp({ quality: imageQuality });
          break;
      }

      // Process the image
      const processedBuffer = await imageProcessor.toBuffer();

      // Set response headers
      res.set({
        "Content-Type": `image/${format}`,
        "Content-Length": processedBuffer.length,
        "Content-Disposition": `attachment; filename="resized-${Date.now()}.${format}"`,
      });

      // Send processed image
      res.send(processedBuffer);
    } catch (error) {
      console.error("Image resize error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to resize image",
        error: error.message,
      });
    }
  },
);

// @route   POST /api/image/analyze
// @desc    Analyze image and return metadata
// @access  Private
router.post("/analyze", auth, upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    // Analyze image with Sharp
    const metadata = await sharp(file.buffer).metadata();
    const stats = await sharp(file.buffer).stats();

    // Calculate additional metrics
    const aspectRatio = metadata.width / metadata.height;
    const megapixels = (metadata.width * metadata.height) / 1000000;

    // Detect if image is primarily dark or light
    const averageBrightness =
      stats.channels.reduce((sum, channel) => sum + channel.mean, 0) /
      stats.channels.length;
    const isDark = averageBrightness < 128;

    // Calculate histogram for color analysis
    const histogram = await sharp(file.buffer)
      .resize(100, 100) // Reduce size for faster processing
      .raw()
      .toBuffer();

    const analysis = {
      dimensions: {
        width: metadata.width,
        height: metadata.height,
        aspectRatio: Math.round(aspectRatio * 100) / 100,
        megapixels: Math.round(megapixels * 100) / 100,
      },
      format: {
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        hasProfile: metadata.hasProfile,
      },
      quality: {
        averageBrightness: Math.round(averageBrightness),
        isDark,
        isColor: metadata.channels >= 3,
        fileSize: file.size,
        fileSizeFormatted: formatBytes(file.size),
      },
      stats: {
        channels: stats.channels.map((channel) => ({
          min: channel.min,
          max: channel.max,
          sum: channel.sum,
          squaresSum: channel.squaresSum,
          mean: Math.round(channel.mean * 100) / 100,
          stdev: Math.round(channel.stdev * 100) / 100,
        })),
        entropy: stats.entropy,
        sharpness: stats.sharpness,
      },
      recommendations: {
        suggestedFormats: getSuggestedFormats(metadata, stats),
        cropSuggestions: getCropSuggestions(metadata),
        qualityRecommendation: getQualityRecommendation(
          metadata,
          averageBrightness,
        ),
      },
    };

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze image",
      error: error.message,
    });
  }
});

// Helper functions
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getSuggestedFormats(metadata, stats) {
  const suggestions = [];

  if (metadata.hasAlpha) {
    suggestions.push({ format: "png", reason: "Image has transparency" });
  }

  if (metadata.channels >= 3) {
    suggestions.push({ format: "jpeg", reason: "Good for photos" });
    suggestions.push({
      format: "webp",
      reason: "Modern format with better compression",
    });
  }

  if (stats.entropy < 4) {
    suggestions.push({ format: "png", reason: "Low complexity image" });
  }

  return suggestions;
}

function getCropSuggestions(metadata) {
  const suggestions = [];
  const aspectRatio = metadata.width / metadata.height;

  // Common aspect ratios
  const commonRatios = [
    {
      ratio: 1,
      name: "Square (1:1)",
      width: Math.min(metadata.width, metadata.height),
    },
    { ratio: 4 / 3, name: "Standard (4:3)" },
    { ratio: 16 / 9, name: "Widescreen (16:9)" },
    { ratio: 3 / 2, name: "Photo (3:2)" },
  ];

  commonRatios.forEach((targetRatio) => {
    if (Math.abs(aspectRatio - targetRatio.ratio) > 0.1) {
      let cropWidth, cropHeight;

      if (aspectRatio > targetRatio.ratio) {
        // Image is wider than target
        cropHeight = metadata.height;
        cropWidth = Math.round(cropHeight * targetRatio.ratio);
      } else {
        // Image is taller than target
        cropWidth = metadata.width;
        cropHeight = Math.round(cropWidth / targetRatio.ratio);
      }

      if (cropWidth <= metadata.width && cropHeight <= metadata.height) {
        suggestions.push({
          name: targetRatio.name,
          ratio: targetRatio.ratio,
          width: cropWidth,
          height: cropHeight,
          x: Math.round((metadata.width - cropWidth) / 2),
          y: Math.round((metadata.height - cropHeight) / 2),
        });
      }
    }
  });

  return suggestions;
}

function getQualityRecommendation(metadata, averageBrightness) {
  let quality = 85; // Default

  if (metadata.channels === 1) {
    quality = 90; // Grayscale images can handle higher quality
  } else if (averageBrightness < 50) {
    quality = 80; // Dark images can use lower quality
  } else if (metadata.width * metadata.height > 2000000) {
    quality = 75; // Large images should use lower quality for file size
  }

  return {
    recommended: quality,
    reasoning: getQualityReasoning(quality, metadata, averageBrightness),
  };
}

function getQualityReasoning(quality, metadata, averageBrightness) {
  if (metadata.channels === 1)
    return "Higher quality recommended for grayscale images";
  if (averageBrightness < 50) return "Lower quality acceptable for dark images";
  if (metadata.width * metadata.height > 2000000)
    return "Lower quality recommended for large images to reduce file size";
  return "Standard quality for balanced file size and visual quality";
}

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
  }

  if (error.message === "Only image files are allowed") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed.",
    });
  }

  next(error);
});

module.exports = router;
