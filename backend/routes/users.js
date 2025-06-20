const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Usage = require("../models/Usage");
const { auth, requirePremium } = require("../middleware/auth");
const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile with detailed stats
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Get usage statistics
    const totalUsage = await Usage.countDocuments({ userId: req.userId });
    const todayUsage = await Usage.getDailyUsage(req.userId);

    // Get recent activity
    const recentActivity = await Usage.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("toolUsed fileCount totalFileSize createdAt success");

    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      isPremium: user.isPremiumActive,
      premiumPlan: user.premiumPlan,
      premiumStartDate: user.premiumStartDate,
      premiumExpiryDate: user.premiumExpiryDate,
      premiumDaysRemaining: user.premiumDaysRemaining,
      dailyUploads: user.dailyUploads,
      maxDailyUploads: user.maxDailyUploads,
      totalUploads: user.totalUploads,
      totalFileSize: user.totalFileSize,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount,
      createdAt: user.createdAt,
      stats: {
        totalOperations: totalUsage,
        todayOperations: todayUsage,
        avgFileSize:
          user.totalUploads > 0
            ? Math.round(user.totalFileSize / user.totalUploads)
            : 0,
      },
      recentActivity,
    };

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  auth,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
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

      const { name, email } = req.body;
      const updateData = {};

      if (name) updateData.name = name;

      if (email && email !== req.user.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({
          email,
          _id: { $ne: req.userId },
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email is already taken",
          });
        }
        updateData.email = email;
        updateData.isEmailVerified = false; // Reset email verification
      }

      const user = await User.findByIdAndUpdate(req.userId, updateData, {
        new: true,
        runValidators: true,
      });

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isPremium: user.isPremiumActive,
          premiumPlan: user.premiumPlan,
          premiumExpiryDate: user.premiumExpiryDate,
          premiumDaysRemaining: user.premiumDaysRemaining,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }
  },
);

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete(
  "/account",
  auth,
  [
    body("password")
      .exists()
      .withMessage("Password is required to delete account"),
    body("confirmDelete")
      .equals("DELETE")
      .withMessage("Please type DELETE to confirm account deletion"),
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

      const { password } = req.body;

      // Get user with password
      const user = await User.findById(req.userId).select("+password");

      // Verify password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Password is incorrect",
        });
      }

      // Delete user's usage data
      await Usage.deleteMany({ userId: req.userId });

      // Delete user account
      await User.findByIdAndDelete(req.userId);

      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete account",
      });
    }
  },
);

// @route   GET /api/users/dashboard
// @desc    Get dashboard data
// @access  Private
router.get("/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Get usage statistics for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyUsage = await Usage.find({
      userId: req.userId,
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: 1 });

    // Group usage by day
    const dailyUsage = {};
    const toolUsage = {};

    weeklyUsage.forEach((usage) => {
      const day = usage.createdAt.toISOString().split("T")[0];
      const tool = usage.toolUsed;

      if (!dailyUsage[day]) {
        dailyUsage[day] = 0;
      }
      dailyUsage[day] += 1;

      if (!toolUsage[tool]) {
        toolUsage[tool] = 0;
      }
      toolUsage[tool] += 1;
    });

    // Create array for chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      chartData.push({
        name: dayName,
        operations: dailyUsage[dayKey] || 0,
      });
    }

    // Get today's usage
    const todayUsage = await Usage.getDailyUsage(req.userId);

    const dashboardData = {
      user: {
        name: user.name,
        email: user.email,
        isPremium: user.isPremiumActive,
        premiumPlan: user.premiumPlan,
        premiumExpiryDate: user.premiumExpiryDate,
        premiumDaysRemaining: user.premiumDaysRemaining,
      },
      stats: {
        todayOperations: todayUsage,
        weeklyOperations: weeklyUsage.length,
        totalOperations: user.totalUploads,
        remainingUploads: user.isPremiumActive
          ? "unlimited"
          : Math.max(0, user.maxDailyUploads - user.dailyUploads),
        totalFileSize: user.totalFileSize,
      },
      chartData,
      topTools: Object.entries(toolUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tool, count]) => ({ tool, count })),
      recentActivity: weeklyUsage
        .slice(-5)
        .reverse()
        .map((usage) => ({
          tool: usage.toolUsed,
          fileCount: usage.fileCount,
          fileSize: usage.totalFileSize,
          date: usage.createdAt,
          success: usage.success,
        })),
    };

    res.json({
      success: true,
      dashboard: dashboardData,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
});

// @route   GET /api/users/billing
// @desc    Get billing information
// @access  Private (Premium users only)
router.get("/billing", auth, requirePremium, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const billingInfo = {
      subscription: {
        plan: user.premiumPlan,
        status: user.isPremiumActive ? "active" : "expired",
        startDate: user.premiumStartDate,
        expiryDate: user.premiumExpiryDate,
        daysRemaining: user.premiumDaysRemaining,
        autoRenewal: false, // Since we're using one-time payments
      },
      paymentHistory: user.paymentHistory.map((payment) => ({
        id: payment._id,
        amount: payment.amount / 100, // Convert paise to rupees
        currency: payment.currency,
        planType: payment.planType,
        status: payment.status,
        date: payment.createdAt,
        orderId: payment.orderId,
        paymentId: payment.paymentId,
      })),
      nextBilling: null, // No auto-renewal
      usageStats: {
        currentMonthOperations: user.totalUploads,
        currentMonthFileSize: user.totalFileSize,
      },
    };

    res.json({
      success: true,
      billing: billingInfo,
    });
  } catch (error) {
    console.error("Get billing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch billing information",
    });
  }
});

// @route   GET /api/users/preferences
// @desc    Get user preferences
// @access  Private
router.get("/preferences", auth, async (req, res) => {
  try {
    // For now, return default preferences
    // In the future, you could store these in the User model
    const preferences = {
      notifications: {
        email: true,
        premiumExpiry: true,
        newFeatures: false,
      },
      privacy: {
        analytics: true,
        cookies: true,
      },
      display: {
        theme: "light",
        language: "en",
      },
    };

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch preferences",
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put("/preferences", auth, async (req, res) => {
  try {
    // For now, just return success
    // In the future, store preferences in database

    res.json({
      success: true,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
    });
  }
});

module.exports = router;
