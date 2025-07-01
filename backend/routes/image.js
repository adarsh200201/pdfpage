const express = require("express");
const sharp = require("sharp");
const archiver = require("archiver");
const { body, validationResult } = require("express-validator");
const { auth, optionalAuth } = require("../middleware/auth");
const { uploadImage, handleMulterError } = require("../config/multer");
const router = express.Router();

// Use the shared multer configuration for image uploads
const upload = uploadImage;

// @route   POST /api/image/compress
// @desc    Compress image(s) with different compression levels
// @access  Public
router.post(
  "/compress",
  optionalAuth,
  upload.array("images", 20), // Allow up to 20 images
  [
    body("level")
      .optional()
      .isIn(["extreme", "high", "medium", "low", "best-quality"])
      .withMessage("Invalid compression level"),
    body("format")
      .optional()
      .isIn(["jpeg", "png", "webp"])
      .withMessage("Format must be jpeg, png, or webp"),
    body("maxWidth")
      .optional()
      .isInt({ min: 100, max: 4000 })
      .withMessage("Max width must be between 100-4000"),
    body("maxHeight")
      .optional()
      .isInt({ min: 100, max: 4000 })
      .withMessage("Max height must be between 100-4000"),
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
        level = "medium",
        format,
        maxWidth = 2000,
        maxHeight = 2000,
      } = req.body;

      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one image file is required",
        });
      }

      // Get compression settings based on level
      const settings = getCompressionSettings(level);

      const processedImages = [];
      let totalOriginalSize = 0;
      let totalCompressedSize = 0;

      // Process each image
      for (const file of files) {
        try {
          const originalMetadata = await sharp(file.buffer).metadata();
          totalOriginalSize += file.size;

          // Determine output format
          let outputFormat =
            format ||
            (originalMetadata.format === "png" && originalMetadata.hasAlpha
              ? "png"
              : "jpeg");

          // Convert PNG to JPEG if no transparency for better compression
          if (
            originalMetadata.format === "png" &&
            !originalMetadata.hasAlpha &&
            !format
          ) {
            outputFormat = "jpeg";
          }

          let imageProcessor = sharp(file.buffer);

          // Auto-resize if image is too large
          const shouldResize =
            originalMetadata.width > maxWidth ||
            originalMetadata.height > maxHeight;

          if (shouldResize) {
            imageProcessor = imageProcessor.resize({
              width: parseInt(maxWidth),
              height: parseInt(maxHeight),
              fit: "inside",
              withoutEnlargement: false,
            });
          }

          // Apply compression based on format and level
          switch (outputFormat) {
            case "jpeg":
              imageProcessor = imageProcessor.jpeg({
                quality: settings.quality,
                progressive: settings.progressive,
                mozjpeg: settings.mozjpeg,
              });
              break;
            case "png":
              imageProcessor = imageProcessor.png({
                quality: settings.quality,
                compressionLevel: settings.pngCompression,
                progressive: settings.progressive,
              });
              break;
            case "webp":
              imageProcessor = imageProcessor.webp({
                quality: settings.quality,
                effort: settings.effort,
              });
              break;
          }

          const processedBuffer = await imageProcessor.toBuffer();
          const processedMetadata = await sharp(processedBuffer).metadata();

          totalCompressedSize += processedBuffer.length;

          // Generate filename
          const originalName = file.originalname.split(".")[0];
          const newFilename = `compressed_${originalName}.${outputFormat}`;

          processedImages.push({
            filename: newFilename,
            buffer: processedBuffer,
            originalSize: file.size,
            compressedSize: processedBuffer.length,
            compressionRatio: Math.round(
              ((file.size - processedBuffer.length) / file.size) * 100,
            ),
            originalDimensions: {
              width: originalMetadata.width,
              height: originalMetadata.height,
            },
            compressedDimensions: {
              width: processedMetadata.width,
              height: processedMetadata.height,
            },
            format: outputFormat,
            wasResized: shouldResize,
          });
        } catch (error) {
          console.error(`Error processing image ${file.originalname}:`, error);
          // Continue with other images
        }
      }

      if (processedImages.length === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to process any images",
        });
      }

      // If single image, return the image directly
      if (processedImages.length === 1) {
        const image = processedImages[0];

        res.set({
          "Content-Type": `image/${image.format}`,
          "Content-Length": image.buffer.length,
          "Content-Disposition": `attachment; filename="${image.filename}"`,
          "X-Original-Size": image.originalSize,
          "X-Compressed-Size": image.compressedSize,
          "X-Compression-Ratio": image.compressionRatio,
          "X-Was-Resized": image.wasResized,
        });

        return res.send(image.buffer);
      }

      // For multiple images, create a ZIP archive
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Maximum compression for ZIP
      });

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="compressed_images.zip"',
        "X-Total-Original-Size": totalOriginalSize,
        "X-Total-Compressed-Size": totalCompressedSize,
        "X-Total-Images": processedImages.length,
        "X-Overall-Compression-Ratio": Math.round(
          ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100,
        ),
      });

      archive.pipe(res);

      // Add each processed image to the archive
      processedImages.forEach((image) => {
        archive.append(image.buffer, { name: image.filename });
      });

      // Add compression report
      const report = {
        compressionLevel: level,
        totalImages: processedImages.length,
        totalOriginalSize: formatBytes(totalOriginalSize),
        totalCompressedSize: formatBytes(totalCompressedSize),
        overallCompressionRatio: Math.round(
          ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100,
        ),
        images: processedImages.map((img) => ({
          filename: img.filename,
          originalSize: formatBytes(img.originalSize),
          compressedSize: formatBytes(img.compressedSize),
          compressionRatio: img.compressionRatio,
          originalDimensions: img.originalDimensions,
          compressedDimensions: img.compressedDimensions,
          wasResized: img.wasResized,
          format: img.format,
        })),
      };

      archive.append(JSON.stringify(report, null, 2), {
        name: "compression_report.json",
      });

      await archive.finalize();
    } catch (error) {
      console.error("Image compression error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to compress images",
        error: error.message,
      });
    }
  },
);

// @route   POST /api/image/crop
// @desc    Crop image with specified coordinates and settings
// @access  Public
router.post(
  "/crop",
  optionalAuth,
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
        rotation,
        flipHorizontal,
        flipVertical,
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
      const rotationAngle = rotation ? parseFloat(rotation) : 0;

      // Process image with Sharp
      let imageProcessor = sharp(file.buffer);

      // Auto-rotate based on EXIF orientation and get metadata
      imageProcessor = imageProcessor.rotate();
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

      // First extract crop area (before transformations)
      imageProcessor = imageProcessor.extract({
        left: cropX,
        top: cropY,
        width: cropWidth,
        height: cropHeight,
      });

      // Apply additional rotation only if specified (beyond EXIF auto-rotation)
      if (rotationAngle !== 0) {
        imageProcessor = imageProcessor.rotate(rotationAngle, {
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        });
      }

      if (flipHorizontal === true || flipHorizontal === "true") {
        imageProcessor = imageProcessor.flop();
      }

      if (flipVertical === true || flipVertical === "true") {
        imageProcessor = imageProcessor.flip();
      }

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
// @access  Public
router.post(
  "/resize",
  optionalAuth,
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
// @access  Public
router.post(
  "/analyze",
  optionalAuth,
  upload.single("image"),
  async (req, res) => {
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
  },
);

// Helper functions
function getCompressionSettings(level) {
  const settings = {
    extreme: {
      quality: 40,
      progressive: true,
      mozjpeg: true,
      pngCompression: 9,
      effort: 6,
    },
    high: {
      quality: 60,
      progressive: true,
      mozjpeg: true,
      pngCompression: 8,
      effort: 5,
    },
    medium: {
      quality: 75,
      progressive: true,
      mozjpeg: false,
      pngCompression: 6,
      effort: 4,
    },
    low: {
      quality: 85,
      progressive: false,
      mozjpeg: false,
      pngCompression: 4,
      effort: 3,
    },
    "best-quality": {
      quality: 95,
      progressive: false,
      mozjpeg: false,
      pngCompression: 2,
      effort: 2,
    },
  };

  return settings[level] || settings["medium"];
}

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

// Use the shared multer error handler
router.use(handleMulterError);

module.exports = router;
