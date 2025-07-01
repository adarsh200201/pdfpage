const express = require("express");
const router = express.Router();
const Usage = require("../models/Usage");
const User = require("../models/User");
const IpUsageLog = require("../models/IpUsageLog");

// @route   GET /api/stats/dashboard
// @desc    Get real-time dashboard statistics
// @access  Public (cached heavily)
router.get("/dashboard", async (req, res) => {
  try {
    // Set cache headers for 5 minutes
    res.set("Cache-Control", "public, max-age=300");

    // Get usage statistics (PDFs processed)
    const totalUsageCount = await Usage.countDocuments({});

    // Get actual registered users count
    const totalRegisteredUsers = await User.countDocuments({});

    // Get countries served (from IP geolocation data)
    const uniqueCountries = await IpUsageLog.distinct("country");
    const countriesCount = uniqueCountries.filter(
      (country) => country && country !== "Unknown",
    ).length;

    // Calculate system uptime (based on error rates and availability)
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const totalRequests = await Usage.countDocuments({
      createdAt: { $gte: last30Days },
    });

    const failedRequests = await Usage.countDocuments({
      createdAt: { $gte: last30Days },
      processingStatus: "failed",
    });

    const uptime =
      totalRequests > 0
        ? Math.max(
            95,
            Math.min(
              99.99,
              ((totalRequests - failedRequests) / totalRequests) * 100,
            ),
          )
        : 99.9;

    // Format the response
    const stats = {
      pdfsProcessed: Math.max(totalUsageCount, 0),
      registeredUsers: Math.max(totalRegisteredUsers, 0), // Show actual registered users
      countries: Math.max(countriesCount, 1),
      uptime: Math.round(uptime * 100) / 100,
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: stats,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);

    // Return fallback stats instead of error
    res.json({
      success: true,
      data: {
        pdfsProcessed: 0,
        registeredUsers: 0,
        countries: 1,
        uptime: 99.9,
        lastUpdated: new Date().toISOString(),
      },
      cached: false,
      error: "Using fallback data",
      timestamp: new Date().toISOString(),
    });
  }
});

// @route   GET /api/stats/usage
// @desc    Get detailed usage statistics
// @access  Public
router.get("/usage", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get usage stats for the period
    const usageStats = await Usage.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalProcessed: { $sum: 1 },
          totalFileSize: { $sum: "$fileSizeBytes" },
          avgProcessingTime: { $avg: "$processingTimeMs" },
          successfulProcessed: {
            $sum: {
              $cond: [{ $ne: ["$processingStatus", "failed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stats = usageStats[0] || {
      totalProcessed: 0,
      totalFileSize: 0,
      avgProcessingTime: 0,
      successfulProcessed: 0,
    };

    // Calculate success rate
    stats.successRate =
      stats.totalProcessed > 0
        ? (stats.successfulProcessed / stats.totalProcessed) * 100
        : 100;

    res.json({
      success: true,
      data: stats,
      period: `${days} days`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving usage statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/stats/realtime
// @desc    Get real-time system metrics
// @access  Public
router.get("/realtime", async (req, res) => {
  try {
    // Get stats for the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const realtimeStats = await Usage.aggregate([
      {
        $match: {
          createdAt: { $gte: oneHourAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d %H",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
          avgTime: { $avg: "$processingTimeMs" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get active users (users who processed files in last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await Usage.distinct("userId", {
      createdAt: { $gte: twentyFourHoursAgo },
      userId: { $exists: true },
    });

    const activeIPs = await Usage.distinct("ipAddress", {
      createdAt: { $gte: twentyFourHoursAgo },
    });

    res.json({
      success: true,
      data: {
        hourlyActivity: realtimeStats,
        activeUsers24h: activeUsers.length,
        activeIPs24h: activeIPs.length,
        currentLoad:
          realtimeStats.length > 0
            ? realtimeStats[realtimeStats.length - 1].count
            : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching realtime stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving realtime statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
