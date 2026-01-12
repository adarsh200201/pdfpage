const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow anonymous feedback
    },
    toolUsed: {
      type: String,
      required: true,
      enum: [
        "merge",
        "split",
        "compress",
        "pdf-to-word",
        "pdf-to-excel",
        "word-to-pdf",
        "word-to-pdf-advanced",
        "excel-to-pdf",
        "pdf-to-jpg",
        "jpg-to-pdf",
        "edit-pdf",
        "rotate-pdf",
        "unlock-pdf",
        "protect-pdf",
        "organize-pdf",
        "pdf-to-pdfa",
        "repair-pdf",
        "page-numbers",
        "compare-pdf",
        "redact-pdf",
        "crop-pdf",
      ],
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    // Additional metadata for better analytics
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    isVerified: {
      type: Boolean,
      default: false, // For moderation purposes
    },
    isPublic: {
      type: Boolean,
      default: true, // Whether to show in public reviews
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
feedbackSchema.index({ userId: 1, submittedAt: -1 });
feedbackSchema.index({ toolUsed: 1, rating: -1 });
feedbackSchema.index({ rating: -1, submittedAt: -1 });
feedbackSchema.index({ isPublic: 1, isVerified: 1 });

// Static method to get average rating for a tool
feedbackSchema.statics.getToolRating = async function (toolName) {
  const result = await this.aggregate([
    {
      $match: {
        toolUsed: toolName,
        isVerified: true,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
    {
      $project: {
        averageRating: { $round: ["$averageRating", 2] },
        totalReviews: 1,
        ratingDistribution: {
          $reduce: {
            input: [1, 2, 3, 4, 5],
            initialValue: {},
            in: {
              $mergeObjects: [
                "$$value",
                {
                  $arrayToObject: [
                    [
                      {
                        k: { $toString: "$$this" },
                        v: {
                          $size: {
                            $filter: {
                              input: "$ratingDistribution",
                              cond: { $eq: ["$$item", "$$this"] },
                            },
                          },
                        },
                      },
                    ],
                  ],
                },
              ],
            },
          },
        },
      },
    },
  ]);

  return (
    result[0] || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }
  );
};

// Static method to get recent feedback
feedbackSchema.statics.getRecentFeedback = async function (
  toolName = null,
  limit = 10,
) {
  const query = {
    isPublic: true,
    isVerified: true,
    comment: { $exists: true, $ne: "" },
  };

  if (toolName) {
    query.toolUsed = toolName;
  }

  return await this.find(query)
    .populate("userId", "name profilePicture")
    .sort({ submittedAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get feedback statistics
feedbackSchema.statics.getFeedbackStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$toolUsed",
        averageRating: { $avg: "$rating" },
        totalFeedback: { $sum: 1 },
        lastFeedback: { $max: "$submittedAt" },
      },
    },
    {
      $sort: { averageRating: -1 },
    },
  ]);

  return stats;
};

// Method to mark feedback as helpful
feedbackSchema.methods.markHelpful = function () {
  this.helpfulVotes += 1;
  return this.save();
};

// Method to report feedback
feedbackSchema.methods.report = function () {
  this.reportCount += 1;
  if (this.reportCount >= 5) {
    this.isPublic = false; // Hide from public if reported multiple times
  }
  return this.save();
};

module.exports = mongoose.model("Feedback", feedbackSchema);
