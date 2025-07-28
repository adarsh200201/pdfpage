const logger = require("./utils/logger");

// Initialize keep-alive cron job
function initializeCronJobs() {
  try {
    const cronJobService = require("./services/cronJobService");

    // Start the keep-alive cron job
    cronJobService.startKeepAliveCron();

    logger.info("✅ Keep-alive cron job initialized successfully", {
      schedule: "Every 14 minutes",
      serverUrl:
        process.env.RENDER_SERVER_URL || "https://pdf-backend-935131444417.asia-south1.run.app",
      cronitorEnabled: true,
    });

    // Test Cronitor connection
    setTimeout(async () => {
      const testResult = await cronJobService.testCronitor();
      if (testResult.success) {
        logger.info("✅ Cronitor connection test successful");
      } else {
        logger.warn("⚠️ Cronitor connection test failed", {
          error: testResult.error,
        });
      }
    }, 2000);
  } catch (error) {
    logger.error("❌ Failed to initialize cron jobs", { error: error.message });
  }
}

// Only initialize if this is the main module
if (require.main === module) {
  initializeCronJobs();
} else {
  // Export for use in other modules
  module.exports = initializeCronJobs;
}
