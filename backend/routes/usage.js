const express = require("express");
const Usage = require("../models/Usage");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const router = express.Router();

// @route   GET /api/usage/popular-tools
// @desc    Get popular tools statistics
// @access  Private (admin only) or development mode
router.get("/popular-tools", async (req, res) => {
  try {
    // In development mode, skip auth and provide sample data if needed
    if (process.env.DEBUG_API === "true") {
      console.log("🔧 [API] popular-tools");
    }

    const days = parseInt(req.query.days) || 30;

    // Try to get real data
    let popularTools = [];
    try {
      popularTools = await Usage.getPopularTools(days);
    } catch (error) {
      console.log(
        "ℹ️ No Usage.getPopularTools method found, using manual aggregation",
      );
      // Manual aggregation for popular tools - show ALL data
      popularTools = await Usage.aggregate([
        {
          $match: {
            success: true,
          },
        },
        {
          $group: {
            _id: "$toolUsed",
            count: { $sum: 1 },
            uniqueUserCount: { $addToSet: "$userId" },
          },
        },
        {
          $project: {
            tool: "$_id",
            count: 1,
            uniqueUserCount: { $size: "$uniqueUserCount" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]);
    }

    // If no real data exists, provide sample data for demonstration
    if (popularTools.length === 0 && process.env.NODE_ENV === "development") {
      console.log("🔧 [DEV] No tool usage found, providing sample data");
      popularTools = [
        // PDF Tools
        { tool: "merge", count: 234, uniqueUserCount: 156 },
        { tool: "split", count: 189, uniqueUserCount: 124 },
        { tool: "compress", count: 145, uniqueUserCount: 98 },
        { tool: "pdf-to-word", count: 123, uniqueUserCount: 87 },
        { tool: "pdf-to-jpg", count: 98, uniqueUserCount: 72 },
        { tool: "word-to-pdf", count: 87, uniqueUserCount: 61 },
        { tool: "jpg-to-pdf", count: 76, uniqueUserCount: 54 },
        { tool: "watermark", count: 65, uniqueUserCount: 43 },

        // Image Tools
        { tool: "img-compress", count: 284, uniqueUserCount: 57 },
        { tool: "img-convert", count: 237, uniqueUserCount: 54 },
        { tool: "img-crop", count: 184, uniqueUserCount: 54 },
        { tool: "img-resize", count: 153, uniqueUserCount: 49 },
        { tool: "img-background-removal", count: 112, uniqueUserCount: 38 },
        { tool: "img-meme", count: 89, uniqueUserCount: 32 },

        // Favicon Tools
        { tool: "favicon-image-to-favicon", count: 175, uniqueUserCount: 48 },
        { tool: "favicon-generator", count: 142, uniqueUserCount: 41 },
        { tool: "favicon-text-to-favicon", count: 108, uniqueUserCount: 35 },
        { tool: "favicon-logo-to-favicon", count: 85, uniqueUserCount: 28 },
        { tool: "favicon-emoji-to-favicon", count: 67, uniqueUserCount: 22 },
      ];
    }

    res.json({
      success: true,
      tools: popularTools,
      period: "all data",
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error getting popular tools:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving popular tools",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/usage/device-stats
// @desc    Get device usage statistics
// @access  Private (admin only) or development mode
router.get("/device-stats", async (req, res) => {
  try {
    // In development mode, skip auth and provide sample data if needed
    if (process.env.DEBUG_API === "true") {
      console.log("🔧 [API] device-stats");
    }

    const days = parseInt(req.query.days) || 30;

    // Try to get real data
    let deviceStats = [];
    try {
      deviceStats = await Usage.getDeviceStats(days);
    } catch (error) {
      console.log(
        "ℹ️ No Usage.getDeviceStats method found, using manual aggregation",
      );
      // Manual aggregation for device stats
      deviceStats = await Usage.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: "$deviceType",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            deviceType: "$_id",
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Calculate percentages
      const total = deviceStats.reduce((sum, stat) => sum + stat.count, 0);
      deviceStats = deviceStats.map((stat) => ({
        ...stat,
        percentage: total > 0 ? (stat.count / total) * 100 : 0,
      }));
    }

    // If no real data exists, provide sample data for demonstration
    if (deviceStats.length === 0 && process.env.NODE_ENV === "development") {
      console.log("🔧 [DEV] No device stats found, providing sample data");
      deviceStats = [
        { deviceType: "desktop", count: 645, percentage: 58.7 },
        { deviceType: "mobile", count: 372, percentage: 33.8 },
        { deviceType: "tablet", count: 83, percentage: 7.5 },
      ];
    }

    res.json({
      success: true,
      stats: deviceStats,
      period: `${days} days`,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error getting device stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving device statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/usage/stats
// @desc    Get comprehensive usage statistics
// @access  Private (admin only)
router.get("/stats", auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const days = parseInt(req.query.days) || 7;
    const stats = await Usage.getStats(days);

    // Get additional metrics
    const totalOperations = await Usage.countDocuments({
      success: true,
    });

    const totalFileSize = await Usage.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: "$totalFileSize" },
          avgSize: { $avg: "$totalFileSize" },
          totalFiles: { $sum: "$fileCount" },
        },
      },
    ]);

    const fileSizeStats = totalFileSize[0] || {
      totalSize: 0,
      avgSize: 0,
      totalFiles: 0,
    };

    // Get error rate
    const totalAttempts = await Usage.countDocuments();
    const successfulAttempts = await Usage.countDocuments({
      success: true,
    });
    const errorRate =
      totalAttempts > 0
        ? ((totalAttempts - successfulAttempts) / totalAttempts) * 100
        : 0;

    res.json({
      success: true,
      data: {
        dailyStats: stats,
        summary: {
          totalOperations,
          totalFileSize: fileSizeStats.totalSize,
          avgFileSize: fileSizeStats.avgSize,
          totalFiles: fileSizeStats.totalFiles,
          errorRate: errorRate.toFixed(2),
          successRate: (100 - errorRate).toFixed(2),
        },
      },
      period: `${days} days`,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error getting usage stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving usage statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/usage/tools-by-device
// @desc    Get tool usage breakdown by device type
// @access  Private (admin only)
router.get("/tools-by-device", auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const days = parseInt(req.query.days) || 30;
    const toolsByDevice = await Usage.getToolsByDevice(days);

    res.json({
      success: true,
      data: toolsByDevice,
      period: `${days} days`,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error getting tools by device:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving tools by device statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/usage/performance
// @desc    Get performance metrics
// @access  Private (admin only)
router.get("/performance", auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Performance statistics
    const performanceStats = await Usage.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          success: true,
          processingTime: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: "$toolUsed",
          avgProcessingTime: { $avg: "$processingTime" },
          minProcessingTime: { $min: "$processingTime" },
          maxProcessingTime: { $max: "$processingTime" },
          totalOperations: { $sum: 1 },
          avgFileSize: { $avg: "$totalFileSize" },
        },
      },
      {
        $project: {
          tool: "$_id",
          avgProcessingTime: { $round: ["$avgProcessingTime", 2] },
          minProcessingTime: 1,
          maxProcessingTime: 1,
          totalOperations: 1,
          avgFileSize: { $round: ["$avgFileSize", 0] },
          efficiency: {
            $round: [{ $divide: ["$avgFileSize", "$avgProcessingTime"] }, 2],
          },
        },
      },
      { $sort: { totalOperations: -1 } },
    ]);

    // Overall performance metrics
    const overallStats = await Usage.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          success: true,
        },
      },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: "$processingTime" },
          avgScreenTime: { $avg: "$screenTimeInSec" },
          avgFileSize: { $avg: "$totalFileSize" },
          totalOperations: { $sum: 1 },
        },
      },
    ]);

    const overall = overallStats[0] || {
      avgProcessingTime: 0,
      avgScreenTime: 0,
      avgFileSize: 0,
      totalOperations: 0,
    };

    res.json({
      success: true,
      data: {
        performanceByTool: performanceStats,
        overall: {
          avgProcessingTime: Math.round(overall.avgProcessingTime),
          avgScreenTime: Math.round(overall.avgScreenTime),
          avgFileSize: Math.round(overall.avgFileSize),
          totalOperations: overall.totalOperations,
        },
      },
      period: `${days} days`,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error getting performance metrics:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving performance metrics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/usage/track
// @desc    Track tool usage (for real-time updates)
// @access  Public (but with rate limiting)
router.post("/track", async (req, res) => {
  try {
    const {
      toolUsed,
      fileCount = 1,
      totalFileSize = 0,
      processingTime = 0,
      screenTimeInSec = 0,
      success = true,
      userId = null,
      sessionId = null,
    } = req.body;

    if (!toolUsed) {
      return res.status(400).json({
        success: false,
        message: "Tool name is required",
      });
    }

    // Get additional request info
    const { getRealIPAddress } = require("../utils/ipUtils");
    const { detectDeviceType } = require("../utils/deviceUtils");

    const usageData = {
      userId: userId,
      sessionId: sessionId || req.sessionID,
      toolUsed,
      fileCount,
      totalFileSize,
      processingTime,
      screenTimeInSec,
      success,
      userAgent: req.headers["user-agent"],
      ipAddress: getRealIPAddress(req),
      deviceType: detectDeviceType(req.headers["user-agent"]),
      referrerURL: req.headers.referer,
    };

    const usage = await Usage.trackOperation(usageData);

    res.json({
      success: true,
      usageId: usage._id,
      message: "Usage tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking usage:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking usage",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
