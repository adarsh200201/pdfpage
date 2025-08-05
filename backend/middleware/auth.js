const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  // CORS headers are handled by global middleware

  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Add user to request
      req.user = user;
      req.userId = user._id;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

// Middleware to check if user is premium
const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user has active premium
    if (!req.user.isPremiumActive) {
      return res.status(403).json({
        success: false,
        message: "Premium subscription required",
        upgradeUrl: "/pricing",
      });
    }

    next();
  } catch (error) {
    console.error("Premium middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in premium check",
    });
  }
};

// Middleware to check usage limits
const checkUsageLimit = async (req, res, next) => {
  try {
    // If user is authenticated and premium, allow unlimited usage
    if (req.user && req.user.isPremiumActive) {
      return next();
    }

    // For authenticated free users, allow usage (no daily limits anymore)
    // Usage tracking is now handled by IP-based middleware and frontend
    if (req.user) {
      // Authenticated users get more generous limits handled elsewhere
      return next();
    } else {
      // For anonymous users, limits are handled by IP-based middleware
      // which runs before this middleware in the chain
      return next();
    }
  } catch (error) {
    console.error("Usage limit middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in usage check",
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (user) {
          req.user = user;
          req.userId = user._id;
        }
      } catch (error) {
        // Token invalid, but continue without user
        console.log("Invalid token in optional auth:", error.message);
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // Continue without authentication
  }
};

module.exports = {
  auth,
  requirePremium,
  checkUsageLimit,
  optionalAuth,
};
