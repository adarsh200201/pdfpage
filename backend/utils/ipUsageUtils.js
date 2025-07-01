const crypto = require("crypto");
const IpUsageLog = require("../models/IpUsageLog");
const { getRealIPAddress } = require("./ipUtils");
const { detectDeviceType } = require("./deviceUtils");

/**
 * Generate file hash for duplicate detection
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @returns {string} - SHA256 hash
 */
function generateFileHash(fileBuffer, fileName) {
  const hash = crypto.createHash("sha256");
  hash.update(fileBuffer);
  hash.update(fileName);
  return hash.digest("hex");
}

/**
 * Check anonymous usage limit using cookie ID with IP fallback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} - Usage limit check result
 */
async function checkAnonymousUsageLimit(req, res = null) {
  try {
    const { getAnonymousUserIdentifier } = require("./cookieUtils");
    const {
      primaryId: cookieId,
      fallbackId: ipAddress,
      idType,
    } = res
      ? getAnonymousUserIdentifier(req, res)
      : {
          primaryId: null,
          fallbackId: getRealIPAddress(req),
          idType: "ipAddress",
        };

    const usageLog = await IpUsageLog.getOrCreateForIdentifier(
      cookieId,
      ipAddress,
      idType,
    );

    // Update device info if not set
    if (!usageLog.deviceType || usageLog.deviceType === "desktop") {
      usageLog.deviceType = detectDeviceType(req.headers["user-agent"]);
    }

    if (!usageLog.userAgent) {
      usageLog.userAgent = req.headers["user-agent"];
    }

    if (!usageLog.referrerURL || usageLog.referrerURL === "direct") {
      usageLog.referrerURL = req.headers.referer || "direct";
    }

    const result = {
      cookieId,
      ipAddress,
      currentUsage: usageLog.usageCount,
      maxUsage: 2,
      canUse: usageLog.usageCount < 2,
      shouldShowSoftLimit: usageLog.usageCount >= 2,
      isNewUser: usageLog.usageCount === 0,
      isLifetimeLimit: true,
      usageLog,
      trackingMethod: idType,
    };

    // For lifetime limit, no reset time
    result.timeToReset = null;

    return result;
  } catch (error) {
    console.error("Error checking anonymous usage limit:", error);
    // Default to allowing usage on error
    return {
      cookieId: null,
      ipAddress: getRealIPAddress(req),
      currentUsage: 0,
      maxUsage: 2,
      canUse: true,
      shouldShowSoftLimit: false,
      isNewUser: true,
      timeToReset: null,
      ipLog: null,
      error: error.message,
    };
  }
}

/**
 * Track anonymous tool usage with cookie support
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} usageData - Usage data
 * @returns {Promise<Object>} - Tracking result
 */
async function trackAnonymousUsage(req, res, usageData) {
  try {
    const { getAnonymousUserIdentifier } = require("./cookieUtils");
    const {
      primaryId: cookieId,
      fallbackId: ipAddress,
      idType,
    } = getAnonymousUserIdentifier(req, res);

    const usageLog = await IpUsageLog.getOrCreateForIdentifier(
      cookieId,
      ipAddress,
      idType,
    );

    // Check for duplicate file processing
    let isDuplicate = false;
    if (usageData.fileBuffer && usageData.fileName) {
      const fileHash = generateFileHash(
        usageData.fileBuffer,
        usageData.fileName,
      );
      isDuplicate = usageLog.isFileAlreadyProcessed(
        fileHash,
        usageData.toolName,
      );

      if (!isDuplicate) {
        usageLog.addProcessedFile({
          fileHash,
          fileName: usageData.fileName,
          fileSize: usageData.fileSize || 0,
          toolUsed: usageData.toolName,
        });
      }
    }

    // Only increment usage count if not duplicate
    if (!isDuplicate) {
      usageLog.incrementUsage({
        toolName: usageData.toolName,
        fileCount: usageData.fileCount || 1,
        totalFileSize: usageData.totalFileSize || 0,
        sessionId: usageData.sessionId || req.sessionID,
      });

      // Update device and location info
      usageLog.deviceType = detectDeviceType(req.headers["user-agent"]);
      usageLog.userAgent = req.headers["user-agent"];
      usageLog.referrerURL = req.headers.referer || "direct";

      await usageLog.save();
    }

    return {
      success: true,
      isDuplicate,
      currentUsage: usageLog.usageCount,
      hitSoftLimit: usageLog.conversionTracking.hitSoftLimit,
      shouldShowSoftLimit: ipLog.usageCount >= 3, // Show after 2 uses (3rd attempt)
      ipLog,
    };
  } catch (error) {
    console.error("Error tracking anonymous usage:", error);
    return {
      success: false,
      error: error.message,
      isDuplicate: false,
      currentUsage: 0,
      hitSoftLimit: false,
      shouldShowSoftLimit: false,
      ipLog: null,
    };
  }
}

/**
 * Mark conversion when user signs up after hitting soft limit
 * @param {string} ipAddress - IP address
 * @param {string} userId - New user ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - Conversion tracking result
 */
async function markConversionFromSoftLimit(ipAddress, userId, sessionId) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find recent IP log that hit soft limit
    const ipLog = await IpUsageLog.findOne({
      ipAddress,
      "conversionTracking.hitSoftLimit": true,
      "conversionTracking.hitSoftLimitAt": { $gte: oneDayAgo },
      "conversionTracking.convertedToUser": false,
    }).sort({ "conversionTracking.hitSoftLimitAt": -1 });

    if (ipLog) {
      ipLog.markConversion(userId, sessionId);
      await ipLog.save();

      return {
        success: true,
        converted: true,
        softLimitTool: ipLog.conversionTracking.softLimitToolName,
        timeSinceLimit: now - ipLog.conversionTracking.hitSoftLimitAt,
        ipLog,
      };
    }

    return {
      success: true,
      converted: false,
      message: "No recent soft limit hit found for this IP",
    };
  } catch (error) {
    console.error("Error marking conversion from soft limit:", error);
    return {
      success: false,
      error: error.message,
      converted: false,
    };
  }
}

/**
 * Get usage summary for IP address
 * @param {string} ipAddress - IP address
 * @returns {Promise<Object>} - Usage summary
 */
async function getIPUsageSummary(ipAddress) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const ipLog = await IpUsageLog.findOne({
      ipAddress,
      firstUsageAt: { $gte: oneDayAgo },
    });

    if (!ipLog) {
      return {
        ipAddress,
        usageCount: 0,
        maxUsage: 2,
        canUse: true,
        toolsUsed: [],
        timeToReset: null,
        hitSoftLimit: false,
        converted: false,
      };
    }

    const resetTime = new Date(
      ipLog.firstUsageAt.getTime() + 24 * 60 * 60 * 1000,
    );

    return {
      ipAddress,
      usageCount: ipLog.usageCount,
      maxUsage: 2,
      canUse: ipLog.usageCount < 2,
      toolsUsed: ipLog.toolsUsed.map((tool) => ({
        toolName: tool.toolName,
        usedAt: tool.usedAt,
        fileCount: tool.fileCount,
      })),
      timeToReset: resetTime,
      hitSoftLimit: ipLog.conversionTracking.hitSoftLimit,
      converted: ipLog.conversionTracking.convertedToUser,
      deviceType: ipLog.deviceType,
      firstUsageAt: ipLog.firstUsageAt,
      lastUsageAt: ipLog.lastUsageAt,
    };
  } catch (error) {
    console.error("Error getting IP usage summary:", error);
    return {
      ipAddress,
      usageCount: 0,
      maxUsage: 2,
      canUse: true,
      toolsUsed: [],
      timeToReset: null,
      hitSoftLimit: false,
      converted: false,
      error: error.message,
    };
  }
}

/**
 * Clean up old IP usage logs (older than 7 days)
 * @returns {Promise<Object>} - Cleanup result
 */
async function cleanupOldIPLogs() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await IpUsageLog.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
      "conversionTracking.convertedToUser": false, // Keep converted users for analytics
    });

    console.log(`Cleaned up ${result.deletedCount} old IP usage logs`);

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error("Error cleaning up old IP logs:", error);
    return {
      success: false,
      error: error.message,
      deletedCount: 0,
    };
  }
}

/**
 * Get analytics data for admin dashboard
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} - Analytics data
 */
async function getIPUsageAnalytics(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get conversion stats
    const conversionStats = await IpUsageLog.getConversionStats(days);

    // Get popular tools before signup
    const toolsBeforeSignup = await IpUsageLog.getToolsBeforeSignup(days);

    // Get most active IPs
    const mostActiveIPs = await IpUsageLog.getMostActiveIPs(days, 20);

    // Get daily usage trends
    const dailyTrends = await IpUsageLog.aggregate([
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
          totalUsage: { $sum: "$usageCount" },
          softLimitHits: {
            $sum: {
              $cond: ["$conversionTracking.hitSoftLimit", 1, 0],
            },
          },
          conversions: {
            $sum: {
              $cond: ["$conversionTracking.convertedToUser", 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get device type distribution
    const deviceDistribution = await IpUsageLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$deviceType",
          count: { $sum: 1 },
          avgUsage: { $avg: "$usageCount" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      success: true,
      period: `${days} days`,
      conversionStats,
      toolsBeforeSignup,
      mostActiveIPs,
      dailyTrends,
      deviceDistribution,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error getting IP usage analytics:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  generateFileHash,
  checkAnonymousUsageLimit,
  trackAnonymousUsage,
  markConversionFromSoftLimit,
  getIPUsageSummary,
  cleanupOldIPLogs,
  getIPUsageAnalytics,
};
