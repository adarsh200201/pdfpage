const { checkAnonymousUsageLimit } = require("../utils/ipUsageUtils");

/**
 * Middleware to check IP usage limits for anonymous users
 * This creates a soft limit that shows a login prompt instead of blocking access
 */
const checkIPUsageLimit = async (req, res, next) => {
  try {
    // Skip check for authenticated users
    if (req.user) {
      return next();
    }

    // Check anonymous usage limit (pass res for cookie handling)
    const usageCheck = await checkAnonymousUsageLimit(req, res);

    // Add usage info to request for use in routes
    req.ipUsage = usageCheck;

    // For routes that specifically require the soft limit check
    if (req.query.checkSoftLimit === "true" || req.body.checkSoftLimit) {
      if (usageCheck.shouldShowSoftLimit) {
        return res.status(200).json({
          success: false,
          requiresAuth: true,
          softLimit: true,
          message:
            "You've reached your free usage limit. Please log in to continue using unlimited tools — it's free!",
          usageInfo: {
            currentUsage: usageCheck.currentUsage,
            maxUsage: usageCheck.maxUsage,
            isLifetimeLimit: true,
          },
          authAction: "softLimit",
        });
      }
    }

    // For normal requests, always allow but include usage info
    next();
  } catch (error) {
    console.error("IP Usage Limit middleware error:", error);
    // On error, allow the request to proceed
    req.ipUsage = {
      error: error.message,
      canUse: true,
      shouldShowSoftLimit: false,
    };
    next();
  }
};

/**
 * Middleware to track tool usage (should be used after processing)
 */
const trackToolUsage = (toolName) => {
  return async (req, res, next) => {
    try {
      // Skip for authenticated users (they have their own tracking)
      if (req.user) {
        return next();
      }

      // Add tool usage tracking info to request
      req.toolUsageData = {
        toolName,
        timestamp: new Date(),
        ipAddress: req.ipUsage?.ipAddress,
        shouldTrack: !req.user, // Only track for anonymous users
      };

      next();
    } catch (error) {
      console.error("Track Tool Usage middleware error:", error);
      next();
    }
  };
};

/**
 * Middleware to handle soft limit responses
 * This should be used in routes that want to check soft limits
 */
const handleSoftLimit = async (req, res, next) => {
  try {
    // Skip for authenticated users
    if (req.user) {
      return next();
    }

    if (!req.ipUsage) {
      // If no IP usage check was done, do it now
      req.ipUsage = await checkAnonymousUsageLimit(req);
    }

    // If soft limit should be shown, return appropriate response
    if (req.ipUsage.shouldShowSoftLimit) {
      return res.status(200).json({
        success: false,
        requiresAuth: true,
        softLimit: true,
        message:
          "After 2 tools, please create a free account to continue. All tools remain unlimited!",
        usageInfo: {
          currentUsage: req.ipUsage.currentUsage,
          maxUsage: req.ipUsage.maxUsage,
          timeToReset: req.ipUsage.timeToReset,
        },
        authAction: "softLimit",
        benefits: [
          "Continue unlimited tool usage",
          "Save your work progress",
          "Access to all features",
          "No interruptions",
          "Free forever",
        ],
        featuredTools: [
          "PDF to Word conversion",
          "Advanced compression",
          "Batch processing",
          "Cloud storage integration",
        ],
      });
    }

    next();
  } catch (error) {
    console.error("Handle Soft Limit middleware error:", error);
    next();
  }
};

/**
 * Middleware to add usage limit headers to responses
 */
const addUsageLimitHeaders = (req, res, next) => {
  try {
    if (req.ipUsage && !req.user) {
      res.set({
        "X-Usage-Count": req.ipUsage.currentUsage || 0,
        "X-Usage-Limit": req.ipUsage.maxUsage || 2,
        "X-Usage-Remaining": Math.max(
          0,
          (req.ipUsage.maxUsage || 2) - (req.ipUsage.currentUsage || 0),
        ),
        "X-Soft-Limit-Active": req.ipUsage.shouldShowSoftLimit
          ? "true"
          : "false",
      });

      if (req.ipUsage.timeToReset) {
        res.set("X-Usage-Reset-Time", req.ipUsage.timeToReset.toISOString());
      }
    }

    next();
  } catch (error) {
    console.error("Add Usage Limit Headers middleware error:", error);
    next();
  }
};

/**
 * Combine all IP usage middlewares for easy use
 */
const ipUsageLimitChain = [checkIPUsageLimit, addUsageLimitHeaders];

/**
 * Chain for routes that should handle soft limits
 */
const softLimitChain = [
  checkIPUsageLimit,
  handleSoftLimit,
  addUsageLimitHeaders,
];

module.exports = {
  checkIPUsageLimit,
  trackToolUsage,
  handleSoftLimit,
  addUsageLimitHeaders,
  ipUsageLimitChain,
  softLimitChain,
};
