const express = require("express");
const router = express.Router();

// Basic health check route
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "PDF routes are working",
    timestamp: new Date().toISOString(),
  });
});

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "PDF test route working",
  });
});

module.exports = router;
