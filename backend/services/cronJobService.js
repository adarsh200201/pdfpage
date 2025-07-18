const cron = require("node-cron");
const axios = require("axios");
const logger = require("../utils/logger");

// Cronitor configuration
const CRONITOR_API_KEY =
  process.env.CRONITOR_API_KEY || "b612058cd75c4f23a6f7674fb9e8c09c";
const MONITOR_KEY = process.env.CRONITOR_MONITOR_KEY || "render-keep-alive"; // You'll get this from Cronitor dashboard
const SERVER_URL =
  process.env.RENDER_SERVER_URL || "https://pdfpage-app.onrender.com";

// Cronitor ping URLs
const CRONITOR_BASE_URL = `https://cronitor.link/${MONITOR_KEY}`;

class CronJobService {
  constructor() {
    this.isRunning = false;
    this.lastPingTime = null;
    this.successCount = 0;
    this.errorCount = 0;
  }

  // Send state to Cronitor
  async sendCronitorPing(state, message = "") {
    try {
      const url = `${CRONITOR_BASE_URL}/${state}`;
      const params = message ? { msg: message } : {};

      await axios.get(url, {
        params,
        timeout: 5000,
        headers: {
          "User-Agent": "PdfPage-KeepAlive/1.0",
        },
      });

      logger.info(`Cronitor ping sent: ${state}`, { message });
    } catch (error) {
      logger.error("Failed to send Cronitor ping", {
        state,
        error: error.message,
      });
    }
  }

  // Keep server awake by pinging itself
  async keepServerAwake() {
    const pingUrl = `${SERVER_URL}/api/health/ping`;

    try {
      // Send "run" state to Cronitor
      await this.sendCronitorPing("run", "Starting keep-alive ping");

      const startTime = Date.now();
      const response = await axios.get(pingUrl, {
        timeout: 10000,
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

      // Send "complete" state to Cronitor
      await this.sendCronitorPing(
        "complete",
        `Ping successful in ${responseTime}ms. Server uptime: ${response.data?.uptime}s`,
      );

      return {
        success: true,
        responseTime,
        serverUptime: response.data?.uptime,
        status: response.status,
      };
    } catch (error) {
      this.errorCount++;

      logger.error("Keep-alive ping failed", {
        url: pingUrl,
        error: error.message,
        errorCount: this.errorCount,
        errorCode: error.code,
      });

      // Send "fail" state to Cronitor
      await this.sendCronitorPing("fail", `Ping failed: ${error.message}`);

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

    // Run every 14 minutes (*/14 * * * *)
    this.cronJob = cron.schedule(
      "*/14 * * * *",
      async () => {
        logger.info("Executing keep-alive cron job");
        await this.keepServerAwake();
      },
      {
        scheduled: false,
        timezone: "UTC",
      },
    );

    this.cronJob.start();
    this.isRunning = true;

    logger.info("Keep-alive cron job started", {
      schedule: "Every 14 minutes",
      timezone: "UTC",
      serverUrl: SERVER_URL,
      cronitorMonitor: MONITOR_KEY,
    });

    // Send initial ping to confirm service is working
    setTimeout(() => {
      this.keepServerAwake();
    }, 5000); // Wait 5 seconds after startup
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
      cronitorMonitor: MONITOR_KEY,
      schedule: "Every 14 minutes",
    };
  }

  // Manual ping (useful for testing)
  async manualPing() {
    logger.info("Manual keep-alive ping triggered");
    return await this.keepServerAwake();
  }

  // Test Cronitor connection
  async testCronitor() {
    try {
      await this.sendCronitorPing("run", "Testing Cronitor connection");
      await this.sendCronitorPing("complete", "Cronitor test successful");
      return { success: true, message: "Cronitor connection test successful" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CronJobService();
