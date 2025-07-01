const express = require("express");
const mongoose = require("mongoose");
const logger = require("../utils/logger");

const router = express.Router();

// Basic health check
router.get("/", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Detailed health check with dependencies
router.get("/detailed", async (req, res) => {
  const healthCheck = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
    services: {
      database: {
        status: "unknown",
        responseTime: null,
      },
      memory: {
        used: process.memoryUsage(),
        free: null,
      },
      cpu: {
        loadAverage: require("os").loadavg(),
      },
    },
  };

  // Check database connection
  try {
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - start;

    healthCheck.services.database = {
      status: "healthy",
      responseTime: `${responseTime}ms`,
      connection:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    };
  } catch (error) {
    logger.error("Health check database error", { error: error.message });
    healthCheck.services.database = {
      status: "unhealthy",
      error: error.message,
    };
    healthCheck.status = "ERROR";
  }

  // Memory information
  const totalMemory = require("os").totalmem();
  const freeMemory = require("os").freemem();
  healthCheck.services.memory.free = {
    total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
    free: `${Math.round(freeMemory / 1024 / 1024)}MB`,
    used: `${Math.round((totalMemory - freeMemory) / 1024 / 1024)}MB`,
  };

  // Return appropriate status code
  const statusCode = healthCheck.status === "OK" ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Readiness probe (for Kubernetes/container orchestration)
router.get("/ready", async (req, res) => {
  try {
    // Check if database is ready
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ status: "ready" });
  } catch (error) {
    logger.error("Readiness probe failed", { error: error.message });
    res.status(503).json({ status: "not ready", error: error.message });
  }
});

// Liveness probe (for Kubernetes/container orchestration)
router.get("/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
