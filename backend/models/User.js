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
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumPlan: {
      type: String,
      enum: ["monthly", "yearly", null],
      default: null,
    },
    premiumStartDate: {
      type: Date,
      default: null,
    },
    premiumExpiryDate: {
      type: Date,
      default: null,
    },
    dailyUploads: {
      type: Number,
      default: 0,
    },
    maxDailyUploads: {
      type: Number,
      default: 3,
    },
    lastUploadDate: {
      type: Date,
      default: null,
    },
    totalUploads: {
      type: Number,
      default: 0,
    },
    totalFileSize: {
      type: Number,
      default: 0,
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
userSchema.index({ email: 1 });
userSchema.index({ isPremium: 1 });
userSchema.index({ premiumExpiryDate: 1 });

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

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

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can upload
userSchema.methods.canUpload = function () {
  if (this.isPremiumActive) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reset daily uploads if it's a new day
  if (!this.lastUploadDate || this.lastUploadDate < today) {
    this.dailyUploads = 0;
  }

  return this.dailyUploads < this.maxDailyUploads;
};

// Method to increment upload count
userSchema.methods.incrementUpload = function (fileSize = 0) {
  this.dailyUploads += 1;
  this.totalUploads += 1;
  this.totalFileSize += fileSize;
  this.lastUploadDate = new Date();
};

// Method to upgrade to premium
userSchema.methods.upgradeToPremium = function (planType, paymentData) {
  this.isPremium = true;
  this.premiumPlan = planType;
  this.premiumStartDate = new Date();

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
  this.premiumPlan = null;
  this.premiumExpiryDate = null;
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
