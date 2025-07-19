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
              "'unsafe-eval'", // Required for Google Translate
              "blob:",
              "data:",
              "https://www.google-analytics.com",
              "https://www.googletagmanager.com",
              "https://cdn.jsdelivr.net",
              "https://unpkg.com",
              "https://checkout.razorpay.com",
              "https://translate.google.com",
              "https://translate.googleapis.com",
            ],
            connectSrc: [
              "'self'",
              "https://pdfpage-app.onrender.com",
              "https://www.google-analytics.com",
              "https://analytics.google.com",
              "https://api.razorpay.com",
              "https://lumberjack.razorpay.com",
              "https://api.mixpanel.com",
              "https://translate.googleapis.com",
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

  // Rate limiting completely disabled per user request
  // No restrictions on authentication, file uploads, or API requests
  console.log("Rate limiting disabled - unlimited requests allowed");

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
