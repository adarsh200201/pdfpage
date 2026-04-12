const cron = require("node-cron");
const axios = require("axios");
const logger = require("../utils/logger");

// ============================================================
// CRITICAL FIX: cron was running every 5 SECONDS (*/5 * * * * *)
// That's 12 HTTP calls/min + 24 Cronitor pings = OOM on Render free tier
// Fixed to run every 5 MINUTES (*/5 * * * *) - still prevents sleep
// Render free tier sleeps after 15 min of inactivity, so 5 min is safe
// ============================================================

const SERVER_URL =
  process.env.RENDER_SERVER_URL || "https://pdfpage-backend.onrender.com";

class CronJobService {
  constructor() {
    this.isRunning = false;
    this.lastPingTime = null;
    this.successCount = 0;
    this.errorCount = 0;
    this.cronJob = null;
  }

  // Keep server awake by pinging itself
  async keepServerAwake() {
    const pingUrl = `${SERVER_URL}/api/health/ping`;

    try {
      const startTime = Date.now();
      const response = await axios.get(pingUrl, {
        timeout: 15000,
        headers: {
          "User-Agent": "PdfPage-KeepAlive/1.0",
        },
      });

      const responseTime = Date.now() - startTime;
      this.lastPingTime = new Date();
      this.successCount++;

      logger.info("Keep-alive ping successful", {
        url: pingUrl,
        status: response.status,
        responseTime: `${responseTime}ms`,
        successCount: this.successCount,
        serverUptime: response.data?.uptime,
      });

      return {
        success: true,
        responseTime,
        serverUptime: response.data?.uptime,
        status: response.status,
      };
    } catch (error) {
      this.errorCount++;

      // Only log as warning, not error - 503 during cold start is expected
      const isExpectedError = error.response?.status === 503 || error.code === "ECONNREFUSED";
      if (isExpectedError) {
        logger.warn("Keep-alive ping - server may be cold starting", {
          url: pingUrl,
          error: error.message,
          errorCount: this.errorCount,
        });
      } else {
        logger.error("Keep-alive ping failed", {
          url: pingUrl,
          error: error.message,
          errorCount: this.errorCount,
          errorCode: error.code,
        });
      }

      return {
        success: false,
        error: error.message,
        errorCode: error.code,
      };
    }
  }

  // Start the cron job
  startKeepAliveCron() {
    if (this.isRunning) {
      logger.warn("Keep-alive cron job is already running");
      return;
    }

    // ✅ FIXED: Run every 5 MINUTES - not 5 seconds!
    // Render free tier sleeps after 15 min of inactivity
    // 5-min interval keeps it awake with minimal resource usage
    this.cronJob = cron.schedule(
      "*/5 * * * *",
      async () => {
        try {
          logger.info("Executing keep-alive cron job");
          await this.keepServerAwake();
        } catch (err) {
          // Never let cron callback crash the process
          logger.error("Keep-alive cron callback error (non-fatal)", { error: err.message });
        }
      },
      {
        scheduled: false,
        timezone: "UTC",
      },
    );

    this.cronJob.start();
    this.isRunning = true;

    logger.info("Keep-alive cron job started", {
      schedule: "Every 5 minutes",
      timezone: "UTC",
      serverUrl: SERVER_URL,
      note: "Render free tier sleeps after 15min - 5min interval is sufficient",
    });

    // Send initial ping after 30s startup delay (give server time to fully init)
    setTimeout(() => {
      this.keepServerAwake().catch(err => {
        logger.warn("Initial keep-alive ping failed (non-fatal)", { error: err.message });
      });
    }, 30000);
  }

  // Stop the cron job
  stopKeepAliveCron() {
    if (!this.isRunning) {
      logger.warn("Keep-alive cron job is not running");
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      logger.info("Keep-alive cron job stopped");
    }
  }

  // Get status information
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastPingTime: this.lastPingTime,
      successCount: this.successCount,
      errorCount: this.errorCount,
      serverUrl: SERVER_URL,
      schedule: "Every 5 minutes",
    };
  }

  // Manual ping (useful for testing)
  async manualPing() {
    logger.info("Manual keep-alive ping triggered");
    return await this.keepServerAwake();
  }
}

module.exports = new CronJobService();
