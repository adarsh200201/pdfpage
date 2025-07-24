// Load environment variables first
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport");

const app = express();

// Trust proxy configuration - more secure for rate limiting
// In development, only trust localhost
// In production, configure for your specific proxy setup
if (process.env.NODE_ENV === "development") {
  app.set("trust proxy", "loopback");
} else {
  // For production, configure based on your deployment setup
  // Options: 'loopback', number of proxies, or specific IPs
  app.set("trust proxy", 1); // Trust first proxy only
}

// Initialize Passport
app.use(passport.initialize());

// Keep-alive middleware for connection stability
const keepAliveMiddleware = require('./middleware/keepAlive');
app.use(keepAliveMiddleware);

// Security middleware
// Security middleware with disabled CSP for frontend compatibility
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
    crossOriginEmbedderPolicy: false,
    // Temporarily disable CSP to fix frontend blocking issues
    contentSecurityPolicy: false,
  }),
);

// Rate limiting completely disabled per user request
// No restrictions on any routes - unlimited requests allowed
console.log(
  "All rate limiting disabled - unlimited requests allowed for all routes",
);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan("combined"));

// IP and Device debugging middleware for development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    const { debugIPDetection } = require("./utils/ipUtils");
    const { debugDeviceDetection } = require("./utils/deviceUtils");
    if (req.path.includes("/api/")) {
      debugIPDetection(req);
      debugDeviceDetection(req);
    }
    next();
  });
}

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8080", // Frontend dev server
      /^http:\/\/localhost:\d+$/, // Allow any localhost port for development
      "https://pdfpage.in", // Primary production domain
      "https://pdfpagee.netlify.app", // Secondary production frontend
      "https://pdfpage-app.onrender.com", // Production backend
      "https://accounts.google.com", // Google OAuth
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control",
      "Pragma",
    ],
    exposedHeaders: [
      "X-Compression-Ratio",
      "X-Original-Size",
      "X-Compressed-Size",
      "X-Size-Saved",
      "X-Compression-Level",
    ],
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false,
  }),
);

// CORS debugging middleware (only in development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`🌐 CORS Request: ${req.method} ${req.path}`);
    console.log(`🌐 Origin: ${req.headers.origin}`);
    console.log(
      `🌐 User-Agent: ${req.headers["user-agent"]?.substring(0, 50)}...`,
    );
    next();
  });
}

// Enhanced CORS preflight handler for all OPTIONS requests
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  console.log(`🔧 OPTIONS preflight from: ${origin}`);

  // Validate origin against allowed origins
  const allowedOrigins = [
    "https://pdfpage.in",
    "https://pdfpagee.netlify.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080"
  ];

  const isAllowedOrigin = allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin);

  if (isAllowedOrigin) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "https://pdfpage.in");
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, X-CSRF-Token",
  );
  res.header(
    "Access-Control-Expose-Headers",
    "X-Compression-Ratio, X-Original-Size, X-Compressed-Size, X-Size-Saved, X-Compression-Level",
  );
  res.header("Access-Control-Max-Age", "86400"); // 24 hours

  // Ensure no caching of preflight
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");

  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Additional CORS middleware for API routes
app.use("/api/*", (req, res, next) => {
  const origin = req.headers.origin;

  // Set CORS headers for all API routes
  if (origin && (origin.includes('pdfpage.in') || origin.includes('netlify.app') || origin.includes('localhost'))) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "https://pdfpage.in");
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");

  next();
});

// Health check routes (should be first, no rate limiting)
app.use("/api/health", require("./routes/health"));

// CORS debugging route (for troubleshooting) - temporarily enabled for production
app.use("/api/cors-debug", require("./routes/cors-debug"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/usage", require("./routes/usage"));
app.use("/api/pdf", require("./routes/pdf"));
app.use("/api/ai-pdf", require("./routes/ai-pdf-tools"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/image", require("./routes/image"));
app.use("/api/ocr", require("./routes/ocr"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/diagnostics", require("./routes/ghostscript-diagnostic"));
app.use("/api/libreoffice", require("./routes/libreoffice"));
app.use("/api/libreoffice-strict", require("./routes/libreoffice-strict"));
app.use("/api/schema-test", require("./routes/schema-test"));
app.use("/api/cron", require("./routes/cron-status"));

// Test routes (for schema verification)
if (
  process.env.NODE_ENV === "development" ||
  process.env.ENABLE_TEST_ROUTES === "true"
) {
  app.use("/api/test", require("./routes/test"));

  // Serve test HTML page
  app.get("/test-schema", (req, res) => {
    res.sendFile(__dirname + "/test-schema.html");
  });
}

// This root endpoint will be moved to before the catch-all route

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "PdfPage API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// IP test endpoint for debugging
app.get("/api/test-ip", (req, res) => {
  const { getRealIPAddress, debugIPDetection } = require("./utils/ipUtils");

  debugIPDetection(req);

  res.json({
    realIP: getRealIPAddress(req),
    headers: {
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
      "x-client-ip": req.headers["x-client-ip"],
      "cf-connecting-ip": req.headers["cf-connecting-ip"],
    },
    expressIP: req.ip,
    connectionIP: req.connection.remoteAddress,
    socketIP: req.socket.remoteAddress,
  });
});

// Device detection test endpoint
app.get("/api/test-device", (req, res) => {
  const {
    getDetailedDeviceInfo,
    debugDeviceDetection,
    testDeviceDetection,
  } = require("./utils/deviceUtils");

  debugDeviceDetection(req);

  const deviceInfo = getDetailedDeviceInfo(req.headers["user-agent"]);

  res.json({
    deviceInfo,
    userAgent: req.headers["user-agent"],
    timestamp: new Date().toISOString(),
  });
});

// Global 404 handler for unmatched routes (should be last)
app.use("*", (req, res, next) => {
  // Skip if this request was already handled by other routes
  if (res.headersSent) {
    return next();
  }

  if (req.path.startsWith("/api/")) {
    res.status(404).json({
      message: "API route not found",
      path: req.path,
      method: req.method
    });
  } else {
    res.status(404).json({
      message: "Route not found",
      availableEndpoints: {
        root: "/",
        api: "/api/*",
        health: "/api/health"
      },
      frontend: "https://pdfpage.in"
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error ${err.status || 500}: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : err.message,
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Root endpoint for health checks and basic info (must be before catch-all)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "PdfPage API Server is running",
    api: "/api",
    health: "/api/health",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    environment: process.env.NODE_ENV
  });
});

// Handle non-API routes in production
if (process.env.NODE_ENV === "production") {
  // For frontend routes accessed on backend domain, provide helpful redirect
  const frontendRoutes = [
    "/word-to-pdf",
    "/pdf-to-word",
    "/pdf-to-jpg",
    "/jpg-to-pdf",
    "/compress",
    "/merge",
    "/split",
    "/rotate",
    "/unlock",
    "/protect",
    "/excel-to-pdf",
    "/pdf-to-excel",
    "/powerpoint-to-pdf",
    "/pdf-to-powerpoint",
    "/html-to-pdf",
    "/text-to-pdf",
    "/sign",
    "/watermark",
    "/crop",
    "/libreoffice",
    "/ai-pdf-editor",
    "/ai-pdf-to-ppt",
    "/ai-watermark",
  ];

  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api/")) {
      // Check if this is a frontend route
      const isFrontendRoute = frontendRoutes.some((route) =>
        req.path.startsWith(route),
      );

      if (isFrontendRoute) {
        const frontendUrl = `https://pdfpage.in${req.path}`;
        res.status(200).json({
          message:
            "This is a backend API server. For the web interface, please visit:",
          redirect: frontendUrl,
          info: "The frontend is deployed separately at pdfpage.in",
          backend:
            "This server (pdfpage-app.onrender.com) handles API requests only",
        });
      } else {
        res.status(404).json({
          message: "Route not found",
          availableEndpoints: "/api/*",
          frontend: "https://pdfpage.in",
        });
      }
    } else {
      res.status(404).json({
        message: "API route not found",
      });
    }
  });
}

// Ensure required directories exist
const { ensureDirectories } = require("./utils/ensureDirectories");
ensureDirectories();

// Connect to MongoDB
console.log("🔌 Attempting to connect to MongoDB...");
console.log("   MongoDB URI:", process.env.MONGODB_URI ? "[Set]" : "Not set");
console.log("   JWT Secret:", process.env.JWT_SECRET ? "[Set]" : "Not set");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("Connected to MongoDB", {
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    });
  })
  .catch((err) => {
    logger.error("MongoDB connection error", { error: err.message });
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    logger.error("Error closing MongoDB connection", { error: error.message });
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;

// Handle port conflicts gracefully
function startServer(port) {
  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`Server running on port ${port}`, {
      port: port,
      environment: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL,
    });
    console.log(`🚀 PdfPage API Server is running on port ${port}`);
  });

  // Configure server timeouts for better stability
  server.keepAliveTimeout = 61 * 1000; // 61 seconds (longer than ALB idle timeout)
  server.headersTimeout = 65 * 1000; // 65 seconds (longer than keepAliveTimeout)

  // Handle server shutdown gracefully
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('💀 Process terminated');
    });
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`❌ Port ${port} is already in use`);
      console.log(`🔄 Attempting to kill existing process...`);

      // Try to restart nodemon to kill the previous instance
      if (process.env.NODE_ENV === "development") {
        console.log(`🔄 Nodemon will restart automatically...`);
        process.exit(1); // Let nodemon handle the restart
      } else {
        console.log(`��� Cannot start server - port ${port} is occupied`);
        process.exit(1);
      }
    } else {
      console.error("❌ Server startup error:", err);
      process.exit(1);
    }
  });

  return server;
}

startServer(PORT);

// Initialize cron jobs after server starts
setTimeout(() => {
  require("./init-cron")();
}, 3000);
// Restart again
