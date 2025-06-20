const express = require("express");
const { body, validationResult } = require("express-validator");
const Usage = require("../models/Usage");
const User = require("../models/User");
const { auth, optionalAuth } = require("../middleware/auth");
const router = express.Router();

// @route   POST /api/usage/track
// @desc    Track usage of PDF tools
// @access  Public (with optional auth)
router.post(
  "/track",
  optionalAuth,
  [
    body("toolUsed")
      .isIn([
        "merge",
        "split",
        "compress",
        "pdf-to-word",
        "pdf-to-powerpoint",
        "pdf-to-excel",
        "word-to-pdf",
        "powerpoint-to-pdf",
        "excel-to-pdf",
        "pdf-to-jpg",
        "jpg-to-pdf",
        "edit-pdf",
        "sign-pdf",
        "watermark",
        "rotate-pdf",
        "html-to-pdf",
        "unlock-pdf",
        "protect-pdf",
        "organize-pdf",
        "pdf-to-pdfa",
        "repair-pdf",
        "page-numbers",
        "scan-to-pdf",
        "ocr-pdf",
        "compare-pdf",
        "redact-pdf",
        "crop-pdf",
      ])
      .withMessage("Invalid tool name"),
    body("fileCount")
      .isInt({ min: 1, max: 10 })
      .withMessage("File count must be between 1 and 10"),
    body("totalFileSize")
      .isInt({ min: 0 })
      .withMessage("Total file size must be a positive number"),
    body("processingTime")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Processing time must be a positive number"),
    body("sessionId")
      .optional()
      .isString()
      .withMessage("Session ID must be a string"),
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
        toolUsed,
        fileCount,
        totalFileSize,
        processingTime = 0,
        sessionId,
      } = req.body;

      // Check usage limits
      if (req.user) {
        // For authenticated users
        if (!req.user.isPremiumActive && !req.user.canUpload()) {
          return res.status(429).json({
            success: false,
            message: "Daily upload limit exceeded",
            remainingUploads: 0,
            upgradeUrl: "/pricing",
          });
        }

        // Update user's upload count if not premium
        if (!req.user.isPremiumActive) {
          req.user.incrementUpload(totalFileSize);
          await req.user.save();
        }
      } else {
        // For anonymous users, check session-based limits
        if (sessionId) {
          const dailyUsage = await Usage.getDailyUsage(null, sessionId);
          if (dailyUsage >= 3) {
            return res.status(429).json({
              success: false,
              message:
                "Daily limit exceeded. Please sign up for more operations.",
              remainingUploads: 0,
              signupUrl: "/auth",
            });
          }
        }
      }

      // Get client info
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Create usage record
      const usageData = {
        userId: req.user ? req.user._id : null,
        sessionId: sessionId || null,
        toolUsed,
        fileCount,
        totalFileSize,
        processingTime,
        userAgent,
        ipAddress,
        success: true,
      };

      const usage = await Usage.trackOperation(usageData);

      // Calculate remaining uploads
      let remainingUploads = "unlimited";
      if (!req.user || !req.user.isPremiumActive) {
        if (req.user) {
          remainingUploads = Math.max(
            0,
            req.user.maxDailyUploads - req.user.dailyUploads,
          );
        } else if (sessionId) {
          const dailyUsage = await Usage.getDailyUsage(null, sessionId);
          remainingUploads = Math.max(0, 3 - dailyUsage);
        }
      }

      res.json({
        success: true,
        message: "Usage tracked successfully",
        remainingUploads,
        usageId: usage._id,
      });
    } catch (error) {
      console.error("Track usage error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to track usage",
      });
    }
  },
);

// @route   POST /api/usage/track-error
// @desc    Track failed operations
// @access  Public (with optional auth)
router.post(
  "/track-error",
  optionalAuth,
  [
    body("toolUsed").exists().withMessage("Tool name is required"),
    body("errorMessage").exists().withMessage("Error message is required"),
    body("fileCount").optional().isInt({ min: 1 }),
    body("totalFileSize").optional().isInt({ min: 0 }),
    body("sessionId").optional().isString(),
  ],
  async (req, res) => {
    try {
      const {
        toolUsed,
        errorMessage,
        fileCount = 1,
        totalFileSize = 0,
        sessionId,
      } = req.body;

      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip || req.connection.remoteAddress;

      const usageData = {
        userId: req.user ? req.user._id : null,
        sessionId: sessionId || null,
        toolUsed,
        fileCount,
        totalFileSize,
        userAgent,
        ipAddress,
        success: false,
        errorMessage,
      };

      await Usage.trackOperation(usageData);

      res.json({
        success: true,
        message: "Error tracked successfully",
      });
    } catch (error) {
      console.error("Track error usage error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to track error",
      });
    }
  },
);

// @route   GET /api/usage/daily
// @desc    Get daily usage for current user
// @access  Private
router.get("/daily", auth, async (req, res) => {
  try {
    const dailyUsage = await Usage.getDailyUsage(req.userId);
    const remainingUploads = req.user.isPremiumActive
      ? "unlimited"
      : Math.max(0, req.user.maxDailyUploads - req.user.dailyUploads);

    res.json({
      success: true,
      dailyUsage,
      remainingUploads,
      maxDailyUploads: req.user.maxDailyUploads,
      isPremium: req.user.isPremiumActive,
    });
  } catch (error) {
    console.error("Get daily usage error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily usage",
    });
  }
});

// @route   GET /api/usage/stats
// @desc    Get usage statistics for current user
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Get user's usage stats
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const userUsage = await Usage.find({
      userId: req.userId,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });

    // Group by day and tool
    const dailyStats = {};
    const toolStats = {};

    userUsage.forEach((usage) => {
      const day = usage.createdAt.toISOString().split("T")[0];
      const tool = usage.toolUsed;

      // Daily stats
      if (!dailyStats[day]) {
        dailyStats[day] = { operations: 0, fileSize: 0 };
      }
      dailyStats[day].operations += 1;
      dailyStats[day].fileSize += usage.totalFileSize;

      // Tool stats
      if (!toolStats[tool]) {
        toolStats[tool] = { count: 0, fileSize: 0 };
      }
      toolStats[tool].count += 1;
      toolStats[tool].fileSize += usage.totalFileSize;
    });

    res.json({
      success: true,
      totalOperations: userUsage.length,
      dailyStats,
      toolStats,
      recentUsage: userUsage.slice(0, 10), // Last 10 operations
    });
  } catch (error) {
    console.error("Get usage stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch usage statistics",
    });
  }
});

// @route   GET /api/usage/popular-tools
// @desc    Get popular tools (public stats)
// @access  Public
router.get("/popular-tools", async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const popularTools = await Usage.getPopularTools(parseInt(days));

    res.json({
      success: true,
      popularTools: popularTools.slice(0, 10), // Top 10 tools
    });
  } catch (error) {
    console.error("Get popular tools error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular tools",
    });
  }
});

// @route   GET /api/usage/check-limit
// @desc    Check if user can perform operation
// @access  Public (with optional auth)
router.get("/check-limit", optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.query;

    let canUpload = true;
    let remainingUploads = "unlimited";
    let message = "You can perform operations";

    if (req.user) {
      // Authenticated user
      if (req.user.isPremiumActive) {
        remainingUploads = "unlimited";
      } else {
        canUpload = req.user.canUpload();
        remainingUploads = Math.max(
          0,
          req.user.maxDailyUploads - req.user.dailyUploads,
        );

        if (!canUpload) {
          message =
            "Daily limit reached. Upgrade to premium for unlimited access.";
        }
      }
    } else {
      // Anonymous user
      if (sessionId) {
        const dailyUsage = await Usage.getDailyUsage(null, sessionId);
        remainingUploads = Math.max(0, 3 - dailyUsage);
        canUpload = remainingUploads > 0;

        if (!canUpload) {
          message = "Daily limit reached. Sign up for more operations.";
        }
      } else {
        remainingUploads = 3; // Default for new anonymous users
      }
    }

    res.json({
      success: true,
      canUpload,
      remainingUploads,
      message,
      isPremium: req.user ? req.user.isPremiumActive : false,
    });
  } catch (error) {
    console.error("Check limit error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check usage limit",
    });
  }
});

module.exports = router;
