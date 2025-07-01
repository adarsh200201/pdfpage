const mongoose = require("mongoose");

const ipUsageLogSchema = new mongoose.Schema(
  {
    // Primary identifier - cookie ID (more reliable)
    cookieId: {
      type: String,
      index: true,
    },
    // Fallback identifier - IP address
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    // Type of identifier used for this record
    idType: {
      type: String,
      enum: ["cookieId", "ipAddress"],
      default: "ipAddress",
    },
    usageCount: {
      type: Number,
      default: 1,
      min: 0,
    },
    firstUsageAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    lastUsageAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    deviceType: {
      type: String,
      enum: ["mobile", "tablet", "desktop"],
      default: "desktop",
    },
    referrerURL: {
      type: String,
      trim: true,
      default: "direct",
    },
    userAgent: {
      type: String,
      trim: true,
    },
    location: {
      country: String,
      city: String,
      timezone: String,
    },
    toolsUsed: [
      {
        toolName: {
          type: String,
          required: true,
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        fileCount: {
          type: Number,
          default: 1,
        },
        totalFileSize: {
          type: Number,
          default: 0,
        },
      },
    ],
    // Track if user signed up after hitting limit
    conversionTracking: {
      hitSoftLimit: {
        type: Boolean,
        default: false,
      },
      hitSoftLimitAt: {
        type: Date,
      },
      softLimitToolName: {
        type: String,
      },
      convertedToUser: {
        type: Boolean,
        default: false,
      },
      convertedAt: {
        type: Date,
      },
      convertedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      conversionSessionId: {
        type: String,
      },
    },
    // File hash tracking to prevent duplicates
    processedFiles: [
      {
        fileHash: String,
        fileName: String,
        fileSize: Number,
        toolUsed: String,
        processedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Session tracking
    sessionData: {
      sessionId: String,
      lastActivity: {
        type: Date,
        default: Date.now,
      },
      pagesVisited: [String],
      timeOnSite: {
        type: Number,
        default: 0, // in seconds
      },
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
ipUsageLogSchema.index({ cookieId: 1 });
ipUsageLogSchema.index({ ipAddress: 1, firstUsageAt: 1 });
ipUsageLogSchema.index({ cookieId: 1, "conversionTracking.hitSoftLimit": 1 });
ipUsageLogSchema.index({ ipAddress: 1, "conversionTracking.hitSoftLimit": 1 });
ipUsageLogSchema.index({
  "conversionTracking.convertedToUser": 1,
  createdAt: -1,
});

// Virtual to check lifetime usage (no reset for lifetime limit)
ipUsageLogSchema.virtual("isAtLifetimeLimit").get(function () {
  return this.usageCount >= 2;
});

// Static method to get or create usage log (lifetime tracking)
ipUsageLogSchema.statics.getOrCreateForIdentifier = async function (
  cookieId,
  ipAddress,
  idType = "cookieId",
) {
  const now = new Date();

  // First try to find by cookie ID (more reliable)
  let usageLog = null;
  if (cookieId) {
    usageLog = await this.findOne({ cookieId });
  }

  // If no cookie-based log found, try IP address
  if (!usageLog && ipAddress) {
    usageLog = await this.findOne({ ipAddress, cookieId: { $exists: false } });

    // If found by IP, update with cookie ID for future tracking
    if (usageLog && cookieId) {
      usageLog.cookieId = cookieId;
      usageLog.idType = "cookieId";
    }
  }

  // If no existing log found, create new one
  if (!usageLog) {
    usageLog = new this({
      cookieId,
      ipAddress,
      idType,
      usageCount: 0,
      firstUsageAt: now,
      lastUsageAt: now,
      toolsUsed: [],
      processedFiles: [],
    });
  }

  return usageLog;
};

// Backwards compatibility method
ipUsageLogSchema.statics.getOrCreateForIP = async function (ipAddress) {
  return this.getOrCreateForIdentifier(null, ipAddress, "ipAddress");
};

// Method to increment usage count
ipUsageLogSchema.methods.incrementUsage = function (toolData = {}) {
  this.usageCount += 1;
  this.lastUsageAt = new Date();

  // Add tool usage if provided
  if (toolData.toolName) {
    this.toolsUsed.push({
      toolName: toolData.toolName,
      usedAt: new Date(),
      fileCount: toolData.fileCount || 1,
      totalFileSize: toolData.totalFileSize || 0,
    });
  }

  // Update session data if provided
  if (toolData.sessionId) {
    this.sessionData.sessionId = toolData.sessionId;
    this.sessionData.lastActivity = new Date();
  }

  // Mark as hit soft limit if usage count reaches 2 (lifetime limit)
  if (this.usageCount >= 2 && !this.conversionTracking.hitSoftLimit) {
    this.conversionTracking.hitSoftLimit = true;
    this.conversionTracking.hitSoftLimitAt = new Date();
    this.conversionTracking.softLimitToolName = toolData.toolName;
  }
};

// Method to check if file was already processed
ipUsageLogSchema.methods.isFileAlreadyProcessed = function (
  fileHash,
  toolName,
) {
  return this.processedFiles.some(
    (file) => file.fileHash === fileHash && file.toolUsed === toolName,
  );
};

// Method to add processed file
ipUsageLogSchema.methods.addProcessedFile = function (fileData) {
  this.processedFiles.push({
    fileHash: fileData.fileHash,
    fileName: fileData.fileName,
    fileSize: fileData.fileSize,
    toolUsed: fileData.toolUsed,
    processedAt: new Date(),
  });

  // Keep only last 20 processed files to prevent doc growth
  if (this.processedFiles.length > 20) {
    this.processedFiles = this.processedFiles.slice(-20);
  }
};

// Method to mark conversion
ipUsageLogSchema.methods.markConversion = function (userId, sessionId) {
  this.conversionTracking.convertedToUser = true;
  this.conversionTracking.convertedAt = new Date();
  this.conversionTracking.convertedUserId = userId;
  this.conversionTracking.conversionSessionId = sessionId;
};

// Static method to get conversion stats
ipUsageLogSchema.statics.getConversionStats = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalIPs: { $sum: 1 },
        ipsHitSoftLimit: {
          $sum: {
            $cond: ["$conversionTracking.hitSoftLimit", 1, 0],
          },
        },
        ipsConverted: {
          $sum: {
            $cond: ["$conversionTracking.convertedToUser", 1, 0],
          },
        },
        avgUsageCount: { $avg: "$usageCount" },
        totalToolUsage: { $sum: { $size: "$toolsUsed" } },
      },
    },
    {
      $project: {
        totalIPs: 1,
        ipsHitSoftLimit: 1,
        ipsConverted: 1,
        avgUsageCount: 1,
        totalToolUsage: 1,
        conversionRate: {
          $cond: [
            { $gt: ["$ipsHitSoftLimit", 0] },
            {
              $multiply: [
                { $divide: ["$ipsConverted", "$ipsHitSoftLimit"] },
                100,
              ],
            },
            0,
          ],
        },
        softLimitRate: {
          $cond: [
            { $gt: ["$totalIPs", 0] },
            {
              $multiply: [{ $divide: ["$ipsHitSoftLimit", "$totalIPs"] }, 100],
            },
            0,
          ],
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalIPs: 0,
      ipsHitSoftLimit: 0,
      ipsConverted: 0,
      avgUsageCount: 0,
      totalToolUsage: 0,
      conversionRate: 0,
      softLimitRate: 0,
    }
  );
};

// Static method to get popular tools before signup
ipUsageLogSchema.statics.getToolsBeforeSignup = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        "conversionTracking.convertedToUser": true,
        "conversionTracking.convertedAt": { $gte: startDate },
      },
    },
    { $unwind: "$toolsUsed" },
    {
      $group: {
        _id: "$toolsUsed.toolName",
        count: { $sum: 1 },
        avgFileSize: { $avg: "$toolsUsed.totalFileSize" },
        uniqueIPs: { $addToSet: "$ipAddress" },
      },
    },
    {
      $project: {
        tool: "$_id",
        count: 1,
        avgFileSize: 1,
        uniqueIPCount: { $size: "$uniqueIPs" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Static method to get most active IPs
ipUsageLogSchema.statics.getMostActiveIPs = async function (
  days = 7,
  limit = 10,
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$ipAddress",
        totalUsage: { $sum: "$usageCount" },
        uniqueTools: { $addToSet: "$toolsUsed.toolName" },
        lastActivity: { $max: "$lastUsageAt" },
        hitSoftLimit: { $max: "$conversionTracking.hitSoftLimit" },
        converted: { $max: "$conversionTracking.convertedToUser" },
        location: { $first: "$location" },
        deviceType: { $first: "$deviceType" },
      },
    },
    {
      $project: {
        ipAddress: "$_id",
        totalUsage: 1,
        uniqueToolCount: { $size: "$uniqueTools" },
        lastActivity: 1,
        hitSoftLimit: 1,
        converted: 1,
        location: 1,
        deviceType: 1,
      },
    },
    { $sort: { totalUsage: -1 } },
    { $limit: limit },
  ]);
};

module.exports = mongoose.model("IpUsageLog", ipUsageLogSchema);
