const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { body, validationResult } = require("express-validator");
const { auth, requirePremium } = require("../middleware/auth");
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF files for premium users
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed for upload"), false);
    }
  },
});

// @route   POST /api/upload/cloudinary
// @desc    Upload file to Cloudinary (Premium feature)
// @access  Private (Premium only)
router.post(
  "/cloudinary",
  auth,
  requirePremium,
  upload.single("file"),
  [
    body("folder").optional().isString().withMessage("Folder must be a string"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
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

      const { folder = "pdf-uploads", tags = [] } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "File is required",
        });
      }

      // Upload to Cloudinary
      const uploadOptions = {
        resource_type: "auto",
        folder: `pdfpage/${folder}`,
        tags: [...tags, "pdfpage", req.user._id.toString()],
        context: {
          userId: req.user._id.toString(),
          userName: req.user.name,
          uploadDate: new Date().toISOString(),
        },
      };

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(file.buffer);
      });

      // Update user's total file size
      req.user.totalFileSize += file.size;
      await req.user.save();

      res.json({
        success: true,
        message: "File uploaded successfully",
        file: {
          id: result.public_id,
          url: result.secure_url,
          originalName: file.originalname,
          size: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
          pages: result.pages,
          createdAt: result.created_at,
        },
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/upload/files
// @desc    Get user's uploaded files from Cloudinary
// @access  Private (Premium only)
router.get("/files", auth, requirePremium, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Search for user's files
    const searchResult = await cloudinary.search
      .expression(`tags:${req.user._id.toString()}`)
      .sort_by([["created_at", "desc"]])
      .max_results(parseInt(limit))
      .next_cursor(page > 1 ? req.query.cursor : undefined)
      .execute();

    const files = searchResult.resources.map((resource) => ({
      id: resource.public_id,
      url: resource.secure_url,
      size: resource.bytes,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      pages: resource.pages,
      createdAt: resource.created_at,
      tags: resource.tags,
      context: resource.context,
    }));

    res.json({
      success: true,
      files,
      totalCount: searchResult.total_count,
      hasMore: !!searchResult.next_cursor,
      nextCursor: searchResult.next_cursor,
    });
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch files",
    });
  }
});

// @route   DELETE /api/upload/files/:fileId
// @desc    Delete file from Cloudinary
// @access  Private (Premium only)
router.delete("/files/:fileId", auth, requirePremium, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file details first to verify ownership
    const resource = await cloudinary.api.resource(fileId);

    // Check if user owns this file
    const userTag = req.user._id.toString();
    if (!resource.tags.includes(userTag)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this file",
      });
    }

    // Delete the file
    await cloudinary.uploader.destroy(fileId);

    // Update user's total file size
    req.user.totalFileSize = Math.max(
      0,
      req.user.totalFileSize - resource.bytes,
    );
    await req.user.save();

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    if (error.http_code === 404) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
});

// @route   POST /api/upload/share/:fileId
// @desc    Generate shareable link for file
// @access  Private (Premium only)
router.post("/share/:fileId", auth, requirePremium, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { expiresIn = 24 } = req.body; // Hours

    // Get file details
    const resource = await cloudinary.api.resource(fileId);

    // Check ownership
    const userTag = req.user._id.toString();
    if (!resource.tags.includes(userTag)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to share this file",
      });
    }

    // Generate time-limited URL
    const expiryTimestamp = Math.floor(Date.now() / 1000) + expiresIn * 3600;

    const shareableUrl = cloudinary.utils.private_download_link_url(
      fileId,
      resource.format,
      {
        expires_at: expiryTimestamp,
      },
    );

    res.json({
      success: true,
      shareableUrl,
      expiresAt: new Date(expiryTimestamp * 1000),
      expiresIn: `${expiresIn} hours`,
    });
  } catch (error) {
    console.error("Share file error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create shareable link",
    });
  }
});

// @route   GET /api/upload/storage-info
// @desc    Get storage usage information
// @access  Private (Premium only)
router.get("/storage-info", auth, requirePremium, async (req, res) => {
  try {
    // Get usage statistics
    const usage = await cloudinary.api.usage();

    // Get user's file count
    const userFiles = await cloudinary.search
      .expression(`tags:${req.user._id.toString()}`)
      .aggregate("count")
      .execute();

    const storageInfo = {
      totalFiles: userFiles.total_count,
      totalSize: req.user.totalFileSize,
      totalSizeFormatted: formatBytes(req.user.totalFileSize),
      cloudinaryUsage: {
        credits: usage.credits,
        creditsUsed: usage.credits_used,
        creditsRemaining: usage.credits - usage.credits_used,
        bandwidth: usage.bandwidth,
        bandwidthUsed: usage.bandwidth_used,
        storage: usage.storage,
        storageUsed: usage.storage_used,
      },
    };

    res.json({
      success: true,
      storage: storageInfo,
    });
  } catch (error) {
    console.error("Storage info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch storage information",
    });
  }
});

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

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

  if (error.message === "Only PDF files are allowed for upload") {
    return res.status(400).json({
      success: false,
      message: "Only PDF files are allowed.",
    });
  }

  next(error);
});

module.exports = router;
