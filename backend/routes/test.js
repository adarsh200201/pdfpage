const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Usage = require("../models/Usage");
const Feedback = require("../models/Feedback");
const { getRealIPAddress } = require("../utils/ipUtils");
const {
  getDeviceTypeFromRequest,
  getDetailedDeviceInfo,
} = require("../utils/deviceUtils");

// @route   POST /api/test/create-user
// @desc    Create a test user with all new fields
router.post("/create-user", async (req, res) => {
  try {
    const testEmail = `test.user.${Date.now()}@pdfpage.com`;

    const testUser = new User({
      name: "Test User",
      fullName: "Test User Full Name",
      email: testEmail,
      password: "testpassword123",
      country: "United States",
      preferredLanguage: "en",
      premiumPlan: "free",
      planStatus: "active",
      dailyUploadLimit: 3,
      referrerURL: req.headers.referer || "https://pdfpage.com",
    });

    await testUser.save();

    res.json({
      success: true,
      message: "Test user created successfully",
      user: {
        id: testUser._id,
        name: testUser.name,
        fullName: testUser.fullName,
        email: testUser.email,
        country: testUser.country,
        preferredLanguage: testUser.preferredLanguage,
        premiumPlan: testUser.premiumPlan,
        planStatus: testUser.planStatus,
        dailyUploadLimit: testUser.dailyUploadLimit,
        referrerURL: testUser.referrerURL,
        toolStats: testUser.getToolStats(),
        isPremiumActive: testUser.isPremiumActive,
        canUpload: testUser.canUpload(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating test user",
      error: error.message,
    });
  }
});

// @route   POST /api/test/track-usage/:userId
// @desc    Test usage tracking with device detection
router.post("/track-usage/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { toolUsed = "compress" } = req.body;

    // Track usage with real-time detection
    const usage = await Usage.trackOperation({
      userId: userId,
      sessionId: `test-session-${Date.now()}`,
      toolUsed: toolUsed,
      fileCount: 2,
      totalFileSize: 1024000,
      processingTime: 3500,
      screenTimeInSec: 45,
      completed: true,
      userAgent: req.headers["user-agent"],
      ipAddress: getRealIPAddress(req),
      deviceType: getDeviceTypeFromRequest(req),
      referrerURL: req.headers.referer || "https://pdfpage.com",
    });

    // Get updated user with tool stats
    const user = await User.findById(userId);

    res.json({
      success: true,
      message: "Usage tracked successfully",
      usage: {
        id: usage._id,
        toolUsed: usage.toolUsed,
        toolCategory: usage.toolCategory,
        deviceType: usage.deviceType,
        fileCount: usage.fileCount,
        processingTime: usage.processingTime,
        screenTimeInSec: usage.screenTimeInSec,
        completed: usage.completed,
        ipAddress: usage.ipAddress,
        referrerURL: usage.referrerURL,
        createdAt: usage.createdAt,
      },
      userStats: {
        toolStats: user.getToolStats(),
        mostUsedTools: user.getMostUsedTools(),
        totalUploads: user.totalUploads,
      },
      detectedInfo: {
        realIP: getRealIPAddress(req),
        deviceDetails: getDetailedDeviceInfo(req.headers["user-agent"]),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error tracking usage",
      error: error.message,
    });
  }
});

// @route   POST /api/test/create-feedback/:userId
// @desc    Test feedback creation
router.post("/create-feedback/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      toolUsed = "compress",
      rating = 5,
      comment = "Great tool!",
    } = req.body;

    const feedback = new Feedback({
      userId: userId,
      toolUsed: toolUsed,
      rating: rating,
      comment: comment,
      userAgent: req.headers["user-agent"],
      ipAddress: getRealIPAddress(req),
      sessionId: `feedback-session-${Date.now()}`,
    });

    await feedback.save();

    res.json({
      success: true,
      message: "Feedback created successfully",
      feedback: {
        id: feedback._id,
        toolUsed: feedback.toolUsed,
        rating: feedback.rating,
        comment: feedback.comment,
        submittedAt: feedback.submittedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating feedback",
      error: error.message,
    });
  }
});

// @route   GET /api/test/analytics
// @desc    Get analytics and statistics
router.get("/analytics", async (req, res) => {
  try {
    const deviceStats = await Usage.getDeviceStats(30);
    const popularTools = await Usage.getPopularTools(30);
    const toolsByDevice = await Usage.getToolsByDevice(30);

    // Get feedback stats for popular tools
    const feedbackStats = {};
    for (let tool of popularTools.slice(0, 5)) {
      feedbackStats[tool.tool] = await Feedback.getToolRating(tool.tool);
    }

    res.json({
      success: true,
      analytics: {
        deviceDistribution: deviceStats,
        popularTools: popularTools.slice(0, 10),
        toolsByDevice: toolsByDevice.slice(0, 10),
        feedbackRatings: feedbackStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting analytics",
      error: error.message,
    });
  }
});

// @route   GET /api/test/schema-info
// @desc    Get schema information and field definitions
router.get("/schema-info", (req, res) => {
  try {
    const userFields = Object.keys(User.schema.paths).filter(
      (field) => !field.startsWith("_") && field !== "__v",
    );

    const usageFields = Object.keys(Usage.schema.paths).filter(
      (field) => !field.startsWith("_") && field !== "__v",
    );

    const feedbackFields = Object.keys(Feedback.schema.paths).filter(
      (field) => !field.startsWith("_") && field !== "__v",
    );

    res.json({
      success: true,
      schemas: {
        user: {
          fields: userFields,
          newFields: [
            "fullName",
            "country",
            "preferredLanguage",
            "planStatus",
            "dailyUploadLimit",
            "referrerURL",
            "toolStats",
          ],
        },
        usage: {
          fields: usageFields,
          newFields: [
            "toolCategory",
            "screenTimeInSec",
            "completed",
            "deviceType",
            "referrerURL",
          ],
        },
        feedback: {
          fields: feedbackFields,
          isNew: true,
        },
      },
      utilityFunctions: {
        deviceDetection: ["detectDeviceType", "getDetailedDeviceInfo"],
        ipDetection: ["getRealIPAddress"],
        userMethods: ["updateToolStats", "getToolStats", "getMostUsedTools"],
        usageMethods: ["getDeviceStats", "getToolsByDevice", "trackOperation"],
        feedbackMethods: ["getToolRating", "getRecentFeedback"],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting schema info",
      error: error.message,
    });
  }
});

// @route   DELETE /api/test/cleanup/:userId
// @desc    Clean up test data
router.delete("/cleanup/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete test user and associated data
    await User.findByIdAndDelete(userId);
    await Usage.deleteMany({ userId: userId });
    await Feedback.deleteMany({ userId: userId });

    res.json({
      success: true,
      message: "Test data cleaned up successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cleaning up test data",
      error: error.message,
    });
  }
});

module.exports = router;
