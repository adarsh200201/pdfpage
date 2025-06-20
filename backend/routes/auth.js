const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  console.log("🔑 [JWT] Generating token for user:", user._id);
  
  try {
    const token = generateToken(user._id);
    console.log("✅ [JWT] Token generated successfully");

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      isPremium: user.isPremiumActive,
      premiumPlan: user.premiumPlan,
      premiumExpiryDate: user.premiumExpiryDate,
      dailyUploads: user.dailyUploads,
      maxDailyUploads: user.maxDailyUploads,
      totalUploads: user.totalUploads,
      premiumDaysRemaining: user.premiumDaysRemaining,
    };

    console.log("📤 [JWT] Sending response with user data");
    res.status(statusCode).json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    console.error("🔴 [JWT] Error generating token:", error);
    throw error; // This will be caught by the try-catch in the route handler
  }
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
  ],
  async (req, res) => {
    console.log("🔵 [REGISTER] Request received:", {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password ? "[PROVIDED]" : "[MISSING]",
    });

    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("🔴 [REGISTER] Validation failed:", errors.array());
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      console.log("🔍 [REGISTER] Checking for existing user with email:", email);
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log("🔴 [REGISTER] User already exists:", email);
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      console.log("🔄 [REGISTER] Creating new user:", { name, email });
      
      // Create user with a generated username if not provided
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + 
        Math.floor(1000 + Math.random() * 9000); // Add random 4-digit number
        
      const user = new User({
        name,
        email,
        username, // Add the generated username
        password,
      });

      console.log("💾 [REGISTER] Saving user to database...");
      await user.save();
      console.log("✅ [REGISTER] User saved successfully");

      // Update login stats
      user.loginCount += 1;
      user.lastLogin = new Date();
      await user.save();

      console.log("🔑 [REGISTER] Generating JWT token...");
      sendTokenResponse(user, 201, res);
    } catch (error) {
      console.error("🔴 [REGISTER] Error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during registration",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Check for user
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Update login stats
      user.loginCount += 1;
      user.lastLogin = new Date();
      await user.save();

      sendTokenResponse(user, 200, res);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during login",
      });
    }
  },
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      isPremium: user.isPremiumActive,
      premiumPlan: user.premiumPlan,
      premiumExpiryDate: user.premiumExpiryDate,
      dailyUploads: user.dailyUploads,
      maxDailyUploads: user.maxDailyUploads,
      totalUploads: user.totalUploads,
      totalFileSize: user.totalFileSize,
      premiumDaysRemaining: user.premiumDaysRemaining,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put(
  "/update-profile",
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
      if (email) {
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
      }

      const user = await User.findByIdAndUpdate(req.userId, updateData, {
        new: true,
        runValidators: true,
      });

      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremiumActive,
        premiumPlan: user.premiumPlan,
        premiumExpiryDate: user.premiumExpiryDate,
        dailyUploads: user.dailyUploads,
        maxDailyUploads: user.maxDailyUploads,
        totalUploads: user.totalUploads,
        premiumDaysRemaining: user.premiumDaysRemaining,
      };

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: userData,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  "/change-password",
  auth,
  [
    body("currentPassword")
      .exists()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "New password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
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

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.userId).select("+password");

      // Check current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post("/logout", auth, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;
