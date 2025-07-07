#!/usr/bin/env node

// Minimal server test to isolate issues
console.log("🚀 Starting minimal server test...");

try {
  // Load environment variables
  require("dotenv").config();
  console.log("✅ Environment variables loaded");

  // Test Express
  const express = require("express");
  const app = express();
  console.log("✅ Express loaded");

  // Add basic middleware
  app.use(express.json());
  console.log("✅ Basic middleware added");

  // Add a test route
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
    });
  });
  console.log("✅ Test route added");

  // Try to start the server
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`✅ Minimal server started on port ${PORT}`);
    console.log(`🌐 Test URL: http://localhost:${PORT}/api/health`);

    // Auto-shutdown after 5 seconds
    setTimeout(() => {
      console.log("🛑 Shutting down test server...");
      server.close(() => {
        console.log("✅ Test server shutdown complete");
        process.exit(0);
      });
    }, 5000);
  });

  server.on("error", (error) => {
    console.error("❌ Server error:", error.message);
    process.exit(1);
  });
} catch (error) {
  console.error("❌ Startup error:", error.message);
  console.error("Stack trace:", error.stack);
  process.exit(1);
}
