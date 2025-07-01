const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

// Enhanced security middleware for production
const securityMiddleware = (app) => {
  // Enhanced helmet configuration for production
  if (process.env.NODE_ENV === "production") {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'", // Required for some React features
              "https://www.google-analytics.com",
              "https://www.googletagmanager.com",
              "https://checkout.razorpay.com",
            ],
            connectSrc: [
              "'self'",
              "https://api.razorpay.com",
              "https://lumberjack.razorpay.com",
              "https://www.google-analytics.com",
            ],
            frameSrc: [
              "'self'",
              "https://checkout.razorpay.com",
              "https://api.razorpay.com",
            ],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://fonts.googleapis.com",
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            mediaSrc: ["'self'", "data:", "blob:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        },
        crossOriginEmbedderPolicy: false, // Required for some features
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      }),
    );
  }

  // Enhanced rate limiting for production
  const createRateLimit = (
    windowMs,
    max,
    message,
    skipSuccessfulRequests = false,
  ) => {
    return rateLimit({
      windowMs,
      max,
      message: { error: message },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests,
      keyGenerator: (req) => {
        // Use IP + user agent for better security
        return `${req.ip}|${req.headers["user-agent"] || ""}`;
      },
      onLimitReached: (req, res, options) => {
        logger.warn("Rate limit reached", {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          path: req.path,
        });
      },
    });
  };

  // Strict rate limiting for authentication routes
  app.use(
    "/api/auth",
    createRateLimit(
      15 * 60 * 1000,
      5,
      "Too many authentication attempts",
      true,
    ),
  );

  // Moderate rate limiting for file upload routes
  app.use(
    ["/api/pdf", "/api/image", "/api/upload"],
    createRateLimit(60 * 1000, 10, "Too many file uploads"),
  );

  // General API rate limiting
  if (process.env.NODE_ENV === "production") {
    app.use(
      "/api",
      createRateLimit(15 * 60 * 1000, 100, "Too many API requests"),
    );
  }

  // Request size limiting
  app.use((req, res, next) => {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 25000000; // 25MB default

    if (
      req.headers["content-length"] &&
      parseInt(req.headers["content-length"]) > maxSize
    ) {
      return res.status(413).json({
        error: "Request entity too large",
        maxSize: `${maxSize / 1000000}MB`,
      });
    }
    next();
  });

  // Security headers middleware
  app.use((req, res, next) => {
    // Remove server identification
    res.removeHeader("X-Powered-By");

    // Add security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    }

    next();
  });

  logger.info("Security middleware configured", {
    environment: process.env.NODE_ENV,
    helmetEnabled: process.env.NODE_ENV === "production",
    rateLimitEnabled: true,
  });
};

module.exports = securityMiddleware;
