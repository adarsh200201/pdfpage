const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    username: {
      type: String,
      required: false, // We'll generate it if not provided
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-z0-9]+$/, "Username can only contain letters and numbers"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, "Country name cannot exceed 100 characters"],
    },
    preferredLanguage: {
      type: String,
      default: "en",
      enum: ["en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko", "ar"],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password not required if using Google OAuth
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    googleId: {
      type: String,
      sparse: true, // Allows multiple null values
    },
    profilePicture: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumPlan: {
      type: String,
      enum: ["free", "monthly", "yearly", null],
      default: "free",
    },
    premiumStartDate: {
      type: Date,
      default: null,
    },
    premiumExpiryDate: {
      type: Date,
      default: null,
    },
    planStatus: {
      type: String,
      enum: ["active", "expired", "trial", "canceled"],
      default: function () {
        return this.isPremium ? "active" : "active";
      },
    },
    // Removed daily upload limits - now using lifetime anonymous usage limit
    totalUploads: {
      type: Number,
      default: 0,
    },
    totalFileSize: {
      type: Number,
      default: 0,
    },
    toolStats: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    paymentHistory: [
      {
        orderId: String,
        paymentId: String,
        amount: Number,
        currency: String,
        status: String,
        planType: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    loginCount: {
      type: Number,
      default: 0,
    },
    referrerURL: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "not_fetched",
    },
    // Conversion tracking from soft limit
    conversionTracking: {
      referredFromIP: {
        type: String,
        trim: true,
      },
      hitSoftLimitBefore: {
        type: Boolean,
        default: false,
      },
      softLimitTool: {
        type: String,
        trim: true,
      },
      conversionSessionId: {
        type: String,
        trim: true,
      },
      signupSource: {
        type: String,
        enum: ["direct", "soft_limit", "premium_prompt", "tool_redirect"],
        default: "direct",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for checking if premium is active
userSchema.virtual("isPremiumActive").get(function () {
  if (!this.isPremium || !this.premiumExpiryDate) return false;
  return new Date() < this.premiumExpiryDate;
});

// Virtual for days remaining in premium
userSchema.virtual("premiumDaysRemaining").get(function () {
  if (!this.isPremiumActive) return 0;
  const diffTime = this.premiumExpiryDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Index for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ isPremium: 1 });
userSchema.index({ premiumExpiryDate: 1 });

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new) and password exists
  if (!this.isModified("password") || !this.password) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware to reset daily uploads if it's a new day
userSchema.pre("save", function (next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastUploadDate || this.lastUploadDate < today) {
    this.dailyUploads = 0;
  }
  next();
});

// Middleware to auto-update plan status based on expiry date
userSchema.pre("save", function (next) {
  if (this.isPremium && this.premiumExpiryDate) {
    const now = new Date();
    if (now > this.premiumExpiryDate) {
      this.planStatus = "expired";
      this.isPremium = false;
    } else if (this.isPremium && this.planStatus !== "active") {
      this.planStatus = "active";
    }
  } else if (!this.isPremium && this.premiumPlan === "free") {
    this.planStatus = "active";
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // If user signed up with Google OAuth and has no password, return false
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment usage count for authenticated users
userSchema.methods.incrementUsage = function (toolName, fileSize = 0) {
  this.totalUploads += 1;
  this.totalFileSize += fileSize;
  this.lastActiveAt = new Date();

  // Update tool stats
  this.updateToolStats(toolName);
};

// Method to update tool statistics
userSchema.methods.updateToolStats = function (toolName) {
  if (!this.toolStats) {
    this.toolStats = new Map();
  }

  const currentCount = this.toolStats.get(toolName) || 0;
  this.toolStats.set(toolName, currentCount + 1);

  // Mark the field as modified for Mongoose to save the Map changes
  this.markModified("toolStats");
};

// Method to get tool statistics as a plain object
userSchema.methods.getToolStats = function () {
  if (!this.toolStats) {
    return {};
  }

  // Convert Map to plain object for easier JSON serialization
  const statsObject = {};
  for (const [tool, count] of this.toolStats) {
    statsObject[tool] = count;
  }
  return statsObject;
};

// Method to get most used tools
userSchema.methods.getMostUsedTools = function (limit = 5) {
  if (!this.toolStats || this.toolStats.size === 0) {
    return [];
  }

  // Convert Map to array and sort by usage count
  const toolsArray = Array.from(this.toolStats.entries())
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return toolsArray;
};

// Method to upgrade to premium
userSchema.methods.upgradeToPremium = function (planType, paymentData) {
  this.isPremium = true;
  this.premiumPlan = planType;
  this.premiumStartDate = new Date();
  this.planStatus = "active";

  // Set expiry date based on plan
  const expiryDate = new Date();
  if (planType === "yearly") {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  } else {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  }
  this.premiumExpiryDate = expiryDate;

  // Add payment to history
  if (paymentData) {
    this.paymentHistory.push(paymentData);
  }
};

// Method to cancel premium
userSchema.methods.cancelPremium = function () {
  this.isPremium = false;
  this.premiumPlan = "free";
  this.premiumExpiryDate = null;
  this.planStatus = "canceled";
};

// Static method to find users with expired premium
userSchema.statics.findExpiredPremium = function () {
  return this.find({
    isPremium: true,
    premiumExpiryDate: { $lt: new Date() },
  });
};

// Static method to get usage statistics
userSchema.statics.getUsageStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        premiumUsers: {
          $sum: {
            $cond: [{ $eq: ["$isPremium", true] }, 1, 0],
          },
        },
        totalUploads: { $sum: "$totalUploads" },
        totalFileSize: { $sum: "$totalFileSize" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalUsers: 0,
      premiumUsers: 0,
      totalUploads: 0,
      totalFileSize: 0,
    }
  );
};

module.exports = mongoose.model("User", userSchema);
