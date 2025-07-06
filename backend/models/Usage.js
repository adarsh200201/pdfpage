const mongoose = require("mongoose");

const usageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow anonymous usage tracking
    },
    sessionId: {
      type: String,
      required: false, // For anonymous users
    },
    toolUsed: {
      type: String,
      required: true,
      enum: [
        // PDF Tools
        "merge",
        "split",
        "compress",
        "compress-advanced",
        "compress-pro",
        "pdf-to-word",
        "pdf-to-powerpoint",
        "pdf-to-excel",
        "word-to-pdf",
        "word-to-pdf-advanced",
        "word-to-pdf-libreoffice",
        "powerpoint-to-pdf",
        "powerpoint-to-pdf-libreoffice",
        "excel-to-pdf",
        "excel-to-pdf-libreoffice",
        "pdf-to-jpg",
        "jpg-to-pdf",
        "edit-pdf",
        "sign-pdf",
        "watermark",
        "rotate-pdf",
        "html-to-pdf",
        "unlock-pdf",
        "protect-pdf",
        "organize-pdf",
        "pdf-to-pdfa",
        "repair-pdf",
        "page-numbers",
        "scan-to-pdf",
        "ocr-pdf",
        "compare-pdf",
        "redact-pdf",
        "crop-pdf",
        // Image Tools
        "img-compress",
        "img-convert",
        "img-crop",
        "img-meme",
        "img-jpg-to-png",
        "img-png-to-jpg",
        "img-resize",
        "img-background-removal",
        "img-to-pdf",
        // Favicon Tools
        "favicon-image-to-favicon",
        "favicon-text-to-favicon",
        "favicon-emoji-to-favicon",
        "favicon-logo-to-favicon",
        "favicon-generator",
      ],
    },
    toolCategory: {
      type: String,
      enum: [
        "edit",
        "convert",
        "compress",
        "organize",
        "security",
        "advanced",
        "image",
        "favicon",
      ],
      required: false,
    },
    fileCount: {
      type: Number,
      required: true,
      min: 1,
    },
    totalFileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    processingTime: {
      type: Number, // in milliseconds
      default: 0,
    },
    screenTimeInSec: {
      type: Number, // time spent on tool page in seconds
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    userAgent: String,
    ipAddress: String,
    deviceType: {
      type: String,
      enum: ["mobile", "tablet", "desktop"],
      default: "desktop",
    },
    referrerURL: {
      type: String,
      trim: true,
    },
    location: {
      country: String,
      city: String,
      timezone: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
usageSchema.index({ userId: 1, createdAt: -1 });
usageSchema.index({ toolUsed: 1, createdAt: -1 });
usageSchema.index({ sessionId: 1, createdAt: -1 });
usageSchema.index({ deviceType: 1, createdAt: -1 });
usageSchema.index({ createdAt: -1 });

// Static method to get daily usage for a user
usageSchema.statics.getDailyUsage = async function (userId, sessionId = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const query = {
    createdAt: { $gte: today, $lt: tomorrow },
  };

  if (userId) {
    query.userId = userId;
  } else if (sessionId) {
    query.sessionId = sessionId;
  }

  return await this.countDocuments(query);
};

// Static method to get usage statistics
usageSchema.statics.getStats = async function (days = 7) {
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
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          tool: "$toolUsed",
        },
        count: { $sum: 1 },
        totalFileSize: { $sum: "$totalFileSize" },
        avgProcessingTime: { $avg: "$processingTime" },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        tools: {
          $push: {
            tool: "$_id.tool",
            count: "$count",
            totalFileSize: "$totalFileSize",
            avgProcessingTime: "$avgProcessingTime",
          },
        },
        totalOperations: { $sum: "$count" },
        totalFileSize: { $sum: "$totalFileSize" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return stats;
};

// Static method to get popular tools
usageSchema.statics.getPopularTools = async function (days = null) {
  // Show all data regardless of days parameter
  return await this.aggregate([
    {
      $match: {
        success: true,
      },
    },
    {
      $group: {
        _id: "$toolUsed",
        count: { $sum: 1 },
        totalFileSize: { $sum: "$totalFileSize" },
        avgProcessingTime: { $avg: "$processingTime" },
        uniqueUsers: { $addToSet: "$userId" },
      },
    },
    {
      $project: {
        tool: "$_id",
        count: 1,
        totalFileSize: 1,
        avgProcessingTime: 1,
        uniqueUserCount: { $size: "$uniqueUsers" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

// Static method to get device statistics
usageSchema.statics.getDeviceStats = async function (days = 30) {
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
        _id: "$deviceType",
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: "$userId" },
        tools: { $addToSet: "$toolUsed" },
      },
    },
    {
      $project: {
        deviceType: "$_id",
        count: 1,
        uniqueUserCount: { $size: "$uniqueUsers" },
        uniqueToolsCount: { $size: "$tools" },
        percentage: {
          $multiply: [{ $divide: ["$count", { $sum: "$count" }] }, 100],
        },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

// Static method to get tool usage by device
usageSchema.statics.getToolsByDevice = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        success: true,
      },
    },
    {
      $group: {
        _id: {
          tool: "$toolUsed",
          device: "$deviceType",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.tool",
        devices: {
          $push: {
            deviceType: "$_id.device",
            count: "$count",
          },
        },
        totalCount: { $sum: "$count" },
      },
    },
    {
      $sort: { totalCount: -1 },
    },
  ]);
};

// Method to determine tool category based on tool name
usageSchema.statics.getToolCategory = function (toolName) {
  const categories = {
    edit: ["edit-pdf", "rotate-pdf", "crop-pdf", "page-numbers", "watermark"],
    convert: [
      "pdf-to-word",
      "pdf-to-powerpoint",
      "pdf-to-excel",
      "word-to-pdf",
      "word-to-pdf-advanced",
      "word-to-pdf-libreoffice",
      "powerpoint-to-pdf",
      "powerpoint-to-pdf-libreoffice",
      "excel-to-pdf",
      "excel-to-pdf-libreoffice",
      "pdf-to-jpg",
      "jpg-to-pdf",
      "html-to-pdf",
      "pdf-to-pdfa",
    ],
    compress: ["compress"],
    organize: ["merge", "split", "organize-pdf"],
    security: ["unlock-pdf", "protect-pdf", "sign-pdf", "redact-pdf"],
    advanced: ["scan-to-pdf", "ocr-pdf", "compare-pdf", "repair-pdf"],
    image: [
      "img-compress",
      "img-convert",
      "img-crop",
      "img-meme",
      "img-jpg-to-png",
      "img-png-to-jpg",
      "img-resize",
      "img-background-removal",
      "img-to-pdf",
    ],
    favicon: [
      "favicon-image-to-favicon",
      "favicon-text-to-favicon",
      "favicon-emoji-to-favicon",
      "favicon-logo-to-favicon",
      "favicon-generator",
    ],
  };

  for (const [category, tools] of Object.entries(categories)) {
    if (tools.includes(toolName)) {
      return category;
    }
  }
  return "edit"; // default category
};

// Method to track user operation
usageSchema.statics.trackOperation = async function (data) {
  try {
    // Auto-determine tool category if not provided
    if (!data.toolCategory && data.toolUsed) {
      data.toolCategory = this.getToolCategory(data.toolUsed);
    }

    // Auto-determine device type from user agent if not provided
    if (!data.deviceType && data.userAgent) {
      const { detectDeviceType } = require("../utils/deviceUtils");
      data.deviceType = detectDeviceType(data.userAgent);
    }

    const usage = new this(data);
    await usage.save();

    // Update user's tool statistics if userId is provided
    if (data.userId && data.toolUsed) {
      // Run user stats update in background to avoid blocking
      setImmediate(async () => {
        try {
          const User = require("./User");
          const user = await User.findById(data.userId);
          if (user) {
            user.updateToolStats(data.toolUsed);
            await user.save();
          }
        } catch (userUpdateError) {
          console.error("Error updating user tool stats:", userUpdateError);
          // Don't fail the main operation if user stats update fails
        }
      });
    }

    return usage;
  } catch (error) {
    console.error("Error tracking usage:", error);
    throw error;
  }
};

module.exports = mongoose.model("Usage", usageSchema);
