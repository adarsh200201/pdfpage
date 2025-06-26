const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const {
  sendOTPEmail,
  sendPasswordResetConfirmation,
} = require("../services/emailService");
const passport = require("../config/passport");
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
      console.log(
        "🔍 [REGISTER] Checking for existing user with email:",
        email,
      );
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
      const username =
        email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") + Math.floor(1000 + Math.random() * 9000); // Add random 4-digit number

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
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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

// @route   POST /api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
  ],
  async (req, res) => {
    console.log("🔵 [FORGOT-PASSWORD] Request received:", req.body.email);

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({
          success: true,
          message:
            "If an account with that email exists, an OTP has been sent.",
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in user document
      user.passwordResetToken = otp;
      user.passwordResetExpires = otpExpires;
      await user.save();

      console.log("✅ [FORGOT-PASSWORD] OTP generated:", {
        email,
        otp,
        expires: otpExpires,
      });

      // Send OTP via email
      try {
        await sendOTPEmail(email, otp, user.name);
        console.log(
          "✅ [FORGOT-PASSWORD] OTP email sent successfully to:",
          email,
        );

        res.json({
          success: true,
          message: "OTP sent to your email address. Please check your inbox.",
        });
      } catch (emailError) {
        console.error("🔴 [FORGOT-PASSWORD] Email sending failed:", emailError);

        // Clean up the OTP from database if email fails
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(500).json({
          success: false,
          message: "Failed to send OTP email. Please try again later.",
        });
      }
    } catch (error) {
      console.error("🔴 [FORGOT-PASSWORD] Error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post(
  "/verify-otp",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  async (req, res) => {
    console.log("🔵 [VERIFY-OTP] Request received:", {
      email: req.body.email,
      otp: req.body.otp,
    });

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, otp } = req.body;

      // Find user with valid OTP
      const user = await User.findOne({
        email,
        passwordResetToken: otp,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        console.log("🔴 [VERIFY-OTP] Invalid or expired OTP:", { email, otp });
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      console.log("✅ [VERIFY-OTP] OTP verified successfully:", email);

      res.json({
        success: true,
        message: "OTP verified successfully",
      });
    } catch (error) {
      console.error("🔴 [VERIFY-OTP] Error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post(
  "/reset-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
  ],
  async (req, res) => {
    console.log("🔵 [RESET-PASSWORD] Request received:", {
      email: req.body.email,
    });

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, otp, newPassword } = req.body;

      // Find user with valid OTP
      const user = await User.findOne({
        email,
        passwordResetToken: otp,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        console.log("🔴 [RESET-PASSWORD] Invalid or expired OTP:", {
          email,
          otp,
        });
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      // Update password and clear reset tokens
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      console.log("✅ [RESET-PASSWORD] Password reset successfully:", email);

      // Send confirmation email (non-blocking)
      sendPasswordResetConfirmation(email, user.name)
        .then(() => {
          console.log("✅ [RESET-PASSWORD] Confirmation email sent to:", email);
        })
        .catch((emailError) => {
          console.error(
            "🔴 [RESET-PASSWORD] Confirmation email failed:",
            emailError,
          );
          // Don't fail the request if confirmation email fails
        });

      res.json({
        success: true,
        message:
          "Password reset successfully. You can now log in with your new password.",
      });
    } catch (error) {
      console.error("🔴 [RESET-PASSWORD] Error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      console.log("🔵 [GOOGLE-CALLBACK] User authenticated:", req.user.email);

      // Update login stats
      req.user.loginCount += 1;
      req.user.lastLogin = new Date();
      await req.user.save();

      // Generate JWT token
      const token = generateToken(req.user._id);

      // Redirect to frontend with token
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendURL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("🔴 [GOOGLE-CALLBACK] Error:", error);
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendURL}/auth/callback?error=authentication_failed`);
    }
  },
);

module.exports = router;
