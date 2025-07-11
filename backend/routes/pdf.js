const express = require("express");
const router = express.Router();
const libreofficeService = require("../services/libreofficeService");

// Basic health check route
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "PDF routes are working",
    timestamp: new Date().toISOString(),
  });
});

// System status route - includes LibreOffice availability
router.get("/system-status", async (req, res) => {
  try {
    const libreofficeStatus = await libreofficeService.getStatus();

    res.json({
      success: true,
      libreoffice: libreofficeStatus.available,
      system: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
      services: {
        libreoffice: libreofficeStatus,
      },
    });
  } catch (error) {
    console.error("System status check error:", error);
    res.status(500).json({
      success: false,
      libreoffice: false,
      message: "Failed to check system status",
      error: error.message,
    });
  }
});

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "PDF test route working",
  });
});

module.exports = router;
