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
        "merge",
        "split",
        "compress",
        "pdf-to-word",
        "pdf-to-powerpoint",
        "pdf-to-excel",
        "word-to-pdf",
        "powerpoint-to-pdf",
        "excel-to-pdf",
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
      ],
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
usageSchema.statics.getPopularTools = async function (days = 30) {
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

// Method to track user operation
usageSchema.statics.trackOperation = async function (data) {
  try {
    const usage = new this(data);
    await usage.save();
    return usage;
  } catch (error) {
    console.error("Error tracking usage:", error);
    throw error;
  }
};

module.exports = mongoose.model("Usage", usageSchema);
