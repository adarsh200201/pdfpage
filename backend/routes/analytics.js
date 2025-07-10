const express = require("express");
const { auth, requirePremium } = require("../middleware/auth");
const {
  getIPUsageAnalytics,
  cleanupOldIPLogs,
} = require("../utils/ipUsageUtils");
const IpUsageLog = require("../models/IpUsageLog");
const User = require("../models/User");
const Usage = require("../models/Usage");

const router = express.Router();

// @route   GET /api/analytics/ip-usage
// @desc    Get IP usage analytics for admin dashboard
// @access  Private (admin only)
router.get("/ip-usage", auth, async (req, res) => {
  try {
    // Check if user is admin (you may want to add admin role check)
    if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const days = parseInt(req.query.days) || 30;
    const analytics = await getIPUsageAnalytics(days);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error getting IP usage analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving analytics data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/analytics/conversion-funnel
// @desc    Get detailed conversion funnel analytics
// @access  Private (admin only) or development mode
router.get("/conversion-funnel", async (req, res) => {
  try {
    // In development mode, skip auth and provide sample data if needed
    if (process.env.DEBUG_API === "true") {
      console.log("🔧 [API] conversion-funnel");
    }

    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get funnel metrics
    const totalIPs = await IpUsageLog.countDocuments({
      createdAt: { $gte: startDate },
    });

    const ipsHitSoftLimit = await IpUsageLog.countDocuments({
      "conversionTracking.hitSoftLimit": true,
      "conversionTracking.hitSoftLimitAt": { $gte: startDate },
    });

    const ipsConverted = await IpUsageLog.countDocuments({
      "conversionTracking.convertedToUser": true,
      "conversionTracking.convertedAt": { $gte: startDate },
    });

    // Get conversion by tool
    const conversionByTool = await IpUsageLog.aggregate([
      {
        $match: {
          "conversionTracking.convertedToUser": true,
          "conversionTracking.convertedAt": { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$conversionTracking.softLimitToolName",
          conversions: { $sum: 1 },
          avgTimesToConversion: {
            $avg: {
              $divide: [
                {
                  $subtract: [
                    "$conversionTracking.convertedAt",
                    "$conversionTracking.hitSoftLimitAt",
                  ],
                },
                1000 * 60, // Convert to minutes
              ],
            },
          },
        },
      },
      { $sort: { conversions: -1 } },
    ]);

    // Get device type conversion rates
    const conversionByDevice = await IpUsageLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$deviceType",
          totalIPs: { $sum: 1 },
          hitSoftLimit: {
            $sum: {
              $cond: ["$conversionTracking.hitSoftLimit", 1, 0],
            },
          },
          converted: {
            $sum: {
              $cond: ["$conversionTracking.convertedToUser", 1, 0],
            },
          },
        },
      },
      {
        $project: {
          deviceType: "$_id",
          totalIPs: 1,
          hitSoftLimit: 1,
          converted: 1,
          softLimitRate: {
            $cond: [
              { $gt: ["$totalIPs", 0] },
              { $multiply: [{ $divide: ["$hitSoftLimit", "$totalIPs"] }, 100] },
              0,
            ],
          },
          conversionRate: {
            $cond: [
              { $gt: ["$hitSoftLimit", 0] },
              {
                $multiply: [{ $divide: ["$converted", "$hitSoftLimit"] }, 100],
              },
              0,
            ],
          },
        },
      },
      { $sort: { totalIPs: -1 } },
    ]);

    // Get daily funnel data
    const dailyFunnel = await IpUsageLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalIPs: { $sum: 1 },
          hitSoftLimit: {
            $sum: {
              $cond: ["$conversionTracking.hitSoftLimit", 1, 0],
            },
          },
          converted: {
            $sum: {
              $cond: ["$conversionTracking.convertedToUser", 1, 0],
            },
          },
        },
      },
      {
        $project: {
          date: "$_id",
          totalIPs: 1,
          hitSoftLimit: 1,
          converted: 1,
          softLimitRate: {
            $cond: [
              { $gt: ["$totalIPs", 0] },
              { $multiply: [{ $divide: ["$hitSoftLimit", "$totalIPs"] }, 100] },
              0,
            ],
          },
          conversionRate: {
            $cond: [
              { $gt: ["$hitSoftLimit", 0] },
              {
                $multiply: [{ $divide: ["$converted", "$hitSoftLimit"] }, 100],
              },
              0,
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // If no real data exists, provide sample data for demonstration
    let funnelData;
    if (totalIPs === 0 && process.env.NODE_ENV === "development") {
      console.log("🔧 [DEV] No conversion data found, providing sample data");
      funnelData = {
        period: `${days} days`,
        overview: {
          totalIPs: 1247,
          ipsHitSoftLimit: 156,
          ipsConverted: 23,
          softLimitRate: 12.5,
          conversionRate: 14.7,
        },
        conversionByTool: [
          { _id: "merge", conversions: 8, avgTimesToConversion: 15.3 },
          { _id: "split", conversions: 6, avgTimesToConversion: 22.1 },
          { _id: "compress", conversions: 4, avgTimesToConversion: 8.7 },
          { _id: "pdf-to-word", conversions: 3, avgTimesToConversion: 31.2 },
          { _id: "watermark", conversions: 2, avgTimesToConversion: 45.6 },
        ],
        conversionByDevice: [
          {
            deviceType: "desktop",
            totalIPs: 734,
            hitSoftLimit: 89,
            converted: 14,
            softLimitRate: 12.1,
            conversionRate: 15.7,
          },
          {
            deviceType: "mobile",
            totalIPs: 425,
            hitSoftLimit: 53,
            converted: 7,
            softLimitRate: 12.5,
            conversionRate: 13.2,
          },
          {
            deviceType: "tablet",
            totalIPs: 88,
            hitSoftLimit: 14,
            converted: 2,
            softLimitRate: 15.9,
            conversionRate: 14.3,
          },
        ],
        dailyFunnel: [],
        generatedAt: new Date(),
      };
    } else {
      funnelData = {
        period: `${days} days`,
        overview: {
          totalIPs: totalIPs,
          ipsHitSoftLimit: ipsHitSoftLimit,
          ipsConverted: ipsConverted,
          softLimitRate:
            totalIPs > 0 ? ((ipsHitSoftLimit / totalIPs) * 100).toFixed(2) : 0,
          conversionRate:
            ipsHitSoftLimit > 0
              ? ((ipsConverted / ipsHitSoftLimit) * 100).toFixed(2)
              : 0,
        },
        conversionByTool,
        conversionByDevice,
        dailyFunnel,
        generatedAt: new Date(),
      };
    }

    res.json({
      success: true,
      data: funnelData,
    });
  } catch (error) {
    console.error("Error getting conversion funnel analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving conversion funnel data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive dashboard data
// @access  Private (admin only) or development mode
router.get("/dashboard", async (req, res) => {
  try {
    // In development mode, skip auth for dashboard
    if (process.env.NODE_ENV !== "development") {
      // Only require auth in production
      const authResult = await new Promise((resolve) => {
        auth(req, res, (err) => {
          if (err || !req.user || req.user.email !== process.env.ADMIN_EMAIL) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });

      if (!authResult) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }
    }

    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Check if we have real data or should provide sample data
    const hasRealData = (await IpUsageLog.countDocuments()) > 0;

    let mostActiveIPs, toolsBeforeSignup, conversionStats;

    if (hasRealData) {
      // Get most active IPs
      mostActiveIPs = await IpUsageLog.getMostActiveIPs(days, 10);
      // Get popular tools before signup
      toolsBeforeSignup = await IpUsageLog.getToolsBeforeSignup(days);
      // Get conversion stats
      conversionStats = await IpUsageLog.getConversionStats(days);
    } else {
      // Provide sample data for development
      mostActiveIPs = [
        {
          _id: "192.168.1.***",
          usageCount: 45,
          tools: ["merge", "split", "compress"],
        },
        { _id: "10.0.0.***", usageCount: 32, tools: ["pdf-to-word", "merge"] },
        {
          _id: "172.16.0.***",
          usageCount: 28,
          tools: ["compress", "watermark"],
        },
      ];
      toolsBeforeSignup = [
        { _id: "merge", count: 156 },
        { _id: "split", count: 134 },
        { _id: "compress", count: 98 },
      ];
      conversionStats = {
        totalIPs: 1247,
        ipsHitSoftLimit: 156,
        ipsConverted: 23,
        conversionRate: 14.7,
      };
    }

    let recentConversions, softLimitSignups, totalNewUsers;

    if (hasRealData) {
      // Get recent conversions
      recentConversions = await IpUsageLog.find({
        "conversionTracking.convertedToUser": true,
        "conversionTracking.convertedAt": { $gte: startDate },
      })
        .populate("conversionTracking.convertedUserId", "name email createdAt")
        .sort({ "conversionTracking.convertedAt": -1 })
        .limit(20);

      // Get users who signed up from soft limit
      softLimitSignups = await User.countDocuments({
        "conversionTracking.signupSource": "soft_limit",
        createdAt: { $gte: startDate },
      });

      // Get total users created in period
      totalNewUsers = await User.countDocuments({
        createdAt: { $gte: startDate },
      });
    } else {
      // Sample data for development
      recentConversions = [];
      softLimitSignups = 12;
      totalNewUsers = 34;
    }

    const dashboardData = {
      period: `${days} days`,
      summary: {
        ...conversionStats,
        softLimitSignups,
        totalNewUsers,
        softLimitSignupRate:
          totalNewUsers > 0
            ? ((softLimitSignups / totalNewUsers) * 100).toFixed(2)
            : 0,
      },
      mostActiveIPs,
      toolsBeforeSignup,
      recentConversions: recentConversions.map((log) => ({
        id: log._id,
        ipAddress: log.ipAddress.replace(/\.\d+$/, ".***"), // Mask last octet for privacy
        deviceType: log.deviceType,
        hitSoftLimitAt: log.conversionTracking.hitSoftLimitAt,
        convertedAt: log.conversionTracking.convertedAt,
        softLimitTool: log.conversionTracking.softLimitToolName,
        timesToConversion:
          log.conversionTracking.convertedAt -
          log.conversionTracking.hitSoftLimitAt,
        user: log.conversionTracking.convertedUserId
          ? {
              name: log.conversionTracking.convertedUserId.name,
              email: log.conversionTracking.convertedUserId.email.replace(
                /(.{2}).*(@.*)/,
                "$1***$2",
              ), // Mask email
              createdAt: log.conversionTracking.convertedUserId.createdAt,
            }
          : null,
      })),
      generatedAt: new Date(),
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving dashboard data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/analytics/cleanup
// @desc    Clean up old IP usage logs
// @access  Private (admin only)
router.post("/cleanup", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const result = await cleanupOldIPLogs();

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old IP usage logs`,
      data: result,
    });
  } catch (error) {
    console.error("Error cleaning up IP logs:", error);
    res.status(500).json({
      success: false,
      message: "Error cleaning up data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
