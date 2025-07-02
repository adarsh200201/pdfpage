const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private
router.post(
  "/create-order",
  auth,
  [
    body("planType")
      .isIn(["monthly", "yearly"])
      .withMessage("Plan type must be monthly or yearly"),
    body("amount").isNumeric().withMessage("Amount must be a number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { planType, amount } = req.body;

      // Validate amount based on plan type
      const expectedAmount = planType === "yearly" ? 29900 : 4900; // in paise
      if (amount !== expectedAmount) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount for selected plan",
        });
      }

      // Allow users with existing premium to purchase upgrades - these will be queued
      // and will start after their current plan expires

      const options = {
        amount: amount, // amount in paise
        currency: "INR",
        receipt: `rcpt_${req.userId.toString().slice(-6)}_${Date.now()}`.slice(
          0,
          40,
        ),
        notes: {
          userId: req.userId.toString(),
          planType: planType,
          userEmail: req.user.email,
          userName: req.user.name,
        },
      };

      const order = await razorpay.orders.create(options);

      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create payment order",
      });
    }
  },
);

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post(
  "/verify",
  auth,
  [
    body("razorpay_payment_id").exists().withMessage("Payment ID is required"),
    body("razorpay_order_id").exists().withMessage("Order ID is required"),
    body("razorpay_signature").exists().withMessage("Signature is required"),
    body("planType")
      .isIn(["monthly", "yearly"])
      .withMessage("Plan type must be monthly or yearly"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        planType,
      } = req.body;

      // Verify signature
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed",
        });
      }

      // Get payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);

      if (payment.status !== "captured") {
        return res.status(400).json({
          success: false,
          message: "Payment not captured",
        });
      }

      // Update user to premium
      const user = await User.findById(req.userId);
      const hadActivePremium =
        user.isPremium &&
        user.premiumExpiryDate &&
        user.premiumExpiryDate > new Date();

      const paymentData = {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        planType: planType,
        createdAt: new Date(),
      };

      user.upgradeToPremium(planType, paymentData);
      await user.save();

      // Determine response message based on whether plan was queued
      let message, planActivationDate;
      if (hadActivePremium) {
        message = `Payment verified. Your ${planType} plan will start after your current plan expires.`;
        planActivationDate = user.queuedPlan.scheduledStartDate;
      } else {
        message = "Payment verified and premium activated";
        planActivationDate = user.premiumStartDate;
      }

      res.json({
        success: true,
        message: message,
        planQueued: hadActivePremium,
        planActivationDate: planActivationDate,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isPremium: user.isPremiumActive,
          premiumPlan: user.premiumPlan,
          premiumExpiryDate: user.premiumExpiryDate,
          premiumDaysRemaining: user.premiumDaysRemaining,
          queuedPlan: user.queuedPlan.planType
            ? {
                planType: user.queuedPlan.planType,
                scheduledStartDate: user.queuedPlan.scheduledStartDate,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  },
);

// @route   GET /api/payments/plans
// @desc    Get available plans
// @access  Public
router.get("/plans", (req, res) => {
  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      currency: "INR",
      interval: "forever",
      features: [
        "3 PDF operations per day",
        "Basic PDF merge & split",
        "File size limit: 25MB",
        "Standard processing speed",
        "Community support",
      ],
      limitations: [
        "Limited daily operations",
        "Ads displayed",
        "Smaller file size limit",
      ],
    },
    {
      id: "monthly",
      name: "Premium Monthly",
      price: 49,
      currency: "INR",
      interval: "month",
      popular: true,
      features: [
        "Unlimited PDF operations",
        "All PDF tools available",
        "File size limit: 100MB",
        "Priority processing",
        "No ads or watermarks",
        "Priority email support",
        "Cloud storage integration",
      ],
      savings: null,
    },
    {
      id: "yearly",
      name: "Premium Yearly",
      price: 299,
      currency: "INR",
      interval: "year",
      originalPrice: 588,
      savings: 289,
      bestValue: true,
      features: [
        "Everything in Premium Monthly",
        "2 months free (14 months total)",
        "Advanced OCR features",
        "API access (coming soon)",
        "Priority feature requests",
      ],
    },
  ];

  res.json({
    success: true,
    plans,
  });
});

// @route   GET /api/payments/history
// @desc    Get user's payment history
// @access  Private
router.get("/history", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const paymentHistory = user.paymentHistory.map((payment) => ({
      id: payment._id,
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      amount: payment.amount / 100, // Convert paise to rupees
      currency: payment.currency,
      status: payment.status,
      planType: payment.planType,
      date: payment.createdAt,
    }));

    res.json({
      success: true,
      payments: paymentHistory,
    });
  } catch (error) {
    console.error("Payment history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
    });
  }
});

// @route   POST /api/payments/cancel-subscription
// @desc    Cancel user's premium subscription
// @access  Private
router.post("/cancel-subscription", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user.isPremium) {
      return res.status(400).json({
        success: false,
        message: "No active premium subscription found",
      });
    }

    // Note: For Razorpay, we just mark the subscription as cancelled
    // The user will retain premium until expiry date
    user.premiumPlan = null; // This marks it as cancelled but keeps premium active until expiry

    await user.save();

    res.json({
      success: true,
      message:
        "Subscription cancelled. Premium features will remain active until " +
        user.premiumExpiryDate.toDateString(),
      premiumExpiryDate: user.premiumExpiryDate,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
    });
  }
});

// @route   GET /api/payments/subscription-status
// @desc    Get user's subscription status
// @access  Private
router.get("/subscription-status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const subscriptionStatus = {
      isPremium: user.isPremiumActive,
      planType: user.premiumPlan,
      startDate: user.premiumStartDate,
      expiryDate: user.premiumExpiryDate,
      daysRemaining: user.premiumDaysRemaining,
      isExpiringSoon:
        user.premiumDaysRemaining <= 7 && user.premiumDaysRemaining > 0,
      dailyUploads: 0, // Daily limits removed
      maxDailyUploads: 999999, // Unlimited for all users
      totalUploads: user.totalUploads,
      canUpload: true, // Usage limits handled by IP middleware
    };

    res.json({
      success: true,
      subscription: subscriptionStatus,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription status",
    });
  }
});

module.exports = router;
