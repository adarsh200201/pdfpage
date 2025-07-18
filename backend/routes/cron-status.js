const express = require("express");
const logger = require("../utils/logger");

const router = express.Router();

// Get cron job status
router.get("/status", (req, res) => {
  try {
    const cronJobService = require("../services/cronJobService");
    const status = cronJobService.getStatus();

    res.json({
      success: true,
      ...status,
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting cron status", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Manual ping trigger (for testing)
router.post("/ping", async (req, res) => {
  try {
    const cronJobService = require("../services/cronJobService");
    const result = await cronJobService.manualPing();

    res.json({
      success: true,
      message: "Manual ping executed",
      result,
    });
  } catch (error) {
    logger.error("Error executing manual ping", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test Cronitor connection
router.post("/test-cronitor", async (req, res) => {
  try {
    const cronJobService = require("../services/cronJobService");
    const result = await cronJobService.testCronitor();

    res.json({
      success: true,
      message: "Cronitor test executed",
      result,
    });
  } catch (error) {
    logger.error("Error testing Cronitor", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start cron job
router.post("/start", (req, res) => {
  try {
    const cronJobService = require("../services/cronJobService");
    cronJobService.startKeepAliveCron();

    res.json({
      success: true,
      message: "Cron job started",
    });
  } catch (error) {
    logger.error("Error starting cron job", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Stop cron job
router.post("/stop", (req, res) => {
  try {
    const cronJobService = require("../services/cronJobService");
    cronJobService.stopKeepAliveCron();

    res.json({
      success: true,
      message: "Cron job stopped",
    });
  } catch (error) {
    logger.error("Error stopping cron job", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
