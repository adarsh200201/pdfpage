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

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://www.google-analytics.com",
          "https://www.googletagmanager.com",
          "https://checkout.razorpay.com",
          "https://pagead2.googlesyndication.com",
          "https://translate.google.com",
          "https://translate.googleapis.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.razorpay.com",
          "https://lumberjack.razorpay.com",
          "https://translate.googleapis.com",
          "https://translate.google.com",
        ],
        frameSrc: [
          "'self'",
          "https://checkout.razorpay.com",
          "https://api.razorpay.com",
          "https://translate.google.com",
          "https://translate.googleapis.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:",
          "https://www.google-analytics.com",
          "https://www.googletagmanager.com",
          "https://checkout.razorpay.com",
        ],
      },
    },
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
      "https://pdfpagee.netlify.app", // Production frontend
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

// Explicit preflight handler for all OPTIONS requests
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  console.log(`🔧 OPTIONS preflight from: ${origin}`);

  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS,HEAD",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,Pragma",
  );
  res.header("Access-Control-Max-Age", "86400"); // 24 hours
  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Health check routes (should be first, no rate limiting)
app.use("/api/health", require("./routes/health"));

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
// app.use("/api/schema-test", require("./routes/schema-test"));

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

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

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
  const server = app.listen(port, () => {
    logger.info(`Server running on port ${port}`, {
      port: port,
      environment: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL,
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
// Restart again
