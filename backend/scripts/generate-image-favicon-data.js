const mongoose = require("mongoose");
const Usage = require("../models/Usage");
const IpUsageLog = require("../models/IpUsageLog");
const { detectDeviceType } = require("../utils/deviceUtils");

/**
 * Generate sample data specifically for Image and Favicon tools
 * This will populate the admin dashboard with realistic usage data
 */
async function generateImageFaviconSampleData() {
  try {
    console.log("🎨 [IMAGE-FAVICON-DATA] Starting sample data generation...");

    // Image tools with realistic usage patterns
    const imageTools = [
      { name: "img-compress", popularity: 0.35, category: "image" },
      { name: "img-convert", popularity: 0.25, category: "image" },
      { name: "img-crop", popularity: 0.15, category: "image" },
      { name: "img-resize", popularity: 0.12, category: "image" },
      { name: "img-background-removal", popularity: 0.08, category: "image" },
      { name: "img-meme", popularity: 0.03, category: "image" },
      { name: "img-jpg-to-png", popularity: 0.02, category: "image" },
    ];

    // Favicon tools with realistic usage patterns
    const faviconTools = [
      {
        name: "favicon-image-to-favicon",
        popularity: 0.45,
        category: "favicon",
      },
      { name: "favicon-generator", popularity: 0.25, category: "favicon" },
      { name: "favicon-text-to-favicon", popularity: 0.2, category: "favicon" },
      { name: "favicon-logo-to-favicon", popularity: 0.1, category: "favicon" },
    ];

    // Device types with realistic distribution
    const deviceTypes = [
      { type: "desktop", weight: 0.65 },
      { type: "mobile", weight: 0.3 },
      { type: "tablet", weight: 0.05 },
    ];

    // Time distributions for realistic usage patterns
    const timeDistributions = [
      { range: "last-hour", weight: 0.25, timeOffset: 60 * 60 * 1000 }, // Last hour
      { range: "last-6-hours", weight: 0.35, timeOffset: 6 * 60 * 60 * 1000 }, // Last 6 hours
      { range: "today", weight: 0.3, timeOffset: 24 * 60 * 60 * 1000 }, // Today
      { range: "yesterday", weight: 0.1, timeOffset: 48 * 60 * 60 * 1000 }, // Yesterday
    ];

    // Generate sample user IDs for tracking unique users
    const sampleUserIds = [];
    for (let i = 0; i < 50; i++) {
      sampleUserIds.push(new mongoose.Types.ObjectId());
    }

    const usageEntries = [];
    const currentTime = new Date();

    // Generate Image tool usage data
    console.log("🖼️ [IMAGE-FAVICON-DATA] Generating Image tool usage data...");

    for (const imageTool of imageTools) {
      // Calculate number of uses based on popularity (100-500 uses per tool)
      const baseUses = Math.floor(100 + imageTool.popularity * 400);

      for (let i = 0; i < baseUses; i++) {
        // Select random time distribution
        const timeDistribution = selectWeightedRandom(timeDistributions);
        const timeOffset = Math.random() * timeDistribution.timeOffset;
        const usageTime = new Date(currentTime.getTime() - timeOffset);

        // Select random device
        const device = selectWeightedRandom(deviceTypes);

        // Select random user
        const userId =
          sampleUserIds[Math.floor(Math.random() * sampleUserIds.length)];

        // Generate realistic file sizes for images (100KB - 10MB)
        const fileSize = Math.floor(100000 + Math.random() * 9900000);

        // Generate realistic processing times for images (500ms - 5000ms)
        const processingTime = Math.floor(500 + Math.random() * 4500);

        // Generate realistic screen time (30s - 300s)
        const screenTime = Math.floor(30 + Math.random() * 270);

        usageEntries.push({
          userId: userId,
          sessionId: `session_${Date.now()}_${i}`,
          toolUsed: imageTool.name,
          toolCategory: imageTool.category,
          fileCount: Math.floor(Math.random() * 3) + 1, // 1-3 files
          totalFileSize: fileSize,
          processingTime: processingTime,
          screenTimeInSec: screenTime,
          completed: true,
          success: Math.random() > 0.05, // 95% success rate
          deviceType: device.type,
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userAgent:
            device.type === "mobile"
              ? "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
              : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          referrerURL: Math.random() > 0.5 ? "https://google.com" : "direct",
          createdAt: usageTime,
        });
      }
    }

    // Generate Favicon tool usage data
    console.log(
      "🎯 [IMAGE-FAVICON-DATA] Generating Favicon tool usage data...",
    );

    for (const faviconTool of faviconTools) {
      // Calculate number of uses based on popularity (50-200 uses per tool)
      const baseUses = Math.floor(50 + faviconTool.popularity * 150);

      for (let i = 0; i < baseUses; i++) {
        // Select random time distribution
        const timeDistribution = selectWeightedRandom(timeDistributions);
        const timeOffset = Math.random() * timeDistribution.timeOffset;
        const usageTime = new Date(currentTime.getTime() - timeOffset);

        // Select random device
        const device = selectWeightedRandom(deviceTypes);

        // Select random user
        const userId =
          sampleUserIds[Math.floor(Math.random() * sampleUserIds.length)];

        // Generate realistic file sizes for favicons (1KB - 100KB)
        const fileSize = Math.floor(1000 + Math.random() * 99000);

        // Generate realistic processing times for favicons (200ms - 2000ms)
        const processingTime = Math.floor(200 + Math.random() * 1800);

        // Generate realistic screen time (45s - 180s)
        const screenTime = Math.floor(45 + Math.random() * 135);

        usageEntries.push({
          userId: userId,
          sessionId: `session_${Date.now()}_${i}`,
          toolUsed: faviconTool.name,
          toolCategory: faviconTool.category,
          fileCount: 1, // Usually 1 file for favicons
          totalFileSize: fileSize,
          processingTime: processingTime,
          screenTimeInSec: screenTime,
          completed: true,
          success: Math.random() > 0.03, // 97% success rate
          deviceType: device.type,
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userAgent:
            device.type === "mobile"
              ? "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
              : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          referrerURL: Math.random() > 0.5 ? "https://google.com" : "direct",
          createdAt: usageTime,
        });
      }
    }

    // Insert all usage data
    console.log(
      `📊 [IMAGE-FAVICON-DATA] Inserting ${usageEntries.length} usage entries...`,
    );
    await Usage.insertMany(usageEntries);

    // Generate corresponding IP usage logs for active sessions
    console.log("🌐 [IMAGE-FAVICON-DATA] Generating IP usage logs...");

    const uniqueIPs = [
      ...new Set(usageEntries.map((entry) => entry.ipAddress)),
    ];
    const recentTime = new Date(currentTime.getTime() - 60 * 60 * 1000); // 1 hour ago

    for (const ip of uniqueIPs.slice(0, 30)) {
      // Limit to 30 IPs
      try {
        const ipUsage = usageEntries.filter((entry) => entry.ipAddress === ip);
        const deviceType = ipUsage[0].deviceType;
        const userAgent = ipUsage[0].userAgent;

        const ipLog = await IpUsageLog.findOneAndUpdate(
          { ipAddress: ip },
          {
            $setOnInsert: {
              ipAddress: ip,
              usageCount: Math.min(ipUsage.length, 3),
              deviceType: deviceType,
              userAgent: userAgent,
              firstUsageAt: recentTime,
              lastUsageAt: new Date(),
              sessionData: {
                sessionId: `session_${Date.now()}_${ip.replace(/\./g, "_")}`,
                lastActivity: new Date(),
                pagesVisited: ["/img-compress", "/favicon-generator"],
                timeOnSite: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
              },
              toolsUsed: ipUsage.slice(0, 3).map((usage) => ({
                toolName: usage.toolUsed,
                count: 1,
                lastUsed: usage.createdAt,
              })),
            },
            $set: {
              "sessionData.lastActivity": new Date(),
              lastUsageAt: new Date(),
            },
          },
          { upsert: true, new: true },
        );
      } catch (error) {
        console.log(
          `Warning: Could not create IP log for ${ip}:`,
          error.message,
        );
      }
    }

    // Generate summary statistics
    const imageToolsCount = usageEntries.filter(
      (entry) => entry.toolCategory === "image",
    ).length;
    const faviconToolsCount = usageEntries.filter(
      (entry) => entry.toolCategory === "favicon",
    ).length;
    const lastHourCount = usageEntries.filter(
      (entry) =>
        entry.createdAt >= new Date(currentTime.getTime() - 60 * 60 * 1000),
    ).length;

    console.log("✅ [IMAGE-FAVICON-DATA] Sample data generation completed!");
    console.log(`📈 [IMAGE-FAVICON-DATA] Generated data summary:`);
    console.log(`   - Total entries: ${usageEntries.length}`);
    console.log(`   - Image tools: ${imageToolsCount}`);
    console.log(`   - Favicon tools: ${faviconToolsCount}`);
    console.log(`   - Last hour: ${lastHourCount}`);
    console.log(`   - Unique IPs: ${uniqueIPs.length}`);

    return {
      success: true,
      generated: {
        totalEntries: usageEntries.length,
        imageTools: imageToolsCount,
        faviconTools: faviconToolsCount,
        lastHourEntries: lastHourCount,
        uniqueIPs: uniqueIPs.length,
      },
    };
  } catch (error) {
    console.error(
      "❌ [IMAGE-FAVICON-DATA] Error generating sample data:",
      error,
    );
    throw error;
  }
}

// Helper function to select item based on weighted probability
function selectWeightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }

  return items[items.length - 1]; // Fallback
}

module.exports = {
  generateImageFaviconSampleData,
};

// If running directly
if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pdfpage", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("📡 Connected to MongoDB");
      return generateImageFaviconSampleData();
    })
    .then((result) => {
      console.log("🎉 Sample data generation completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error:", error);
      process.exit(1);
    });
}
