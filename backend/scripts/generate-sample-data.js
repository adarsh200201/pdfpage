require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Usage = require("../models/Usage");
const IpUsageLog = require("../models/IpUsageLog");
const Feedback = require("../models/Feedback");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected for sample data generation");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Generate sample users
const generateSampleUsers = async () => {
  console.log("👥 Generating sample users...");

  const sampleUsers = [
    {
      name: "Rahul Sharma",
      email: "rahul.demo@example.com",
      password: "password123",
      isPremium: true,
      premiumPlan: "yearly",
      premiumStartDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      premiumExpiryDate: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000),
      totalUploads: 45,
      loginCount: 12,
    },
    {
      name: "Priya Patel",
      email: "priya.demo@example.com",
      password: "password123",
      isPremium: false,
      totalUploads: 23,
      loginCount: 8,
    },
    {
      name: "Amit Kumar",
      email: "amit.demo@example.com",
      password: "password123",
      isPremium: true,
      premiumPlan: "monthly",
      premiumStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      premiumExpiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      totalUploads: 67,
      loginCount: 24,
    },
    {
      name: "Sneha Singh",
      email: "sneha.demo@example.com",
      password: "password123",
      isPremium: false,
      totalUploads: 12,
      loginCount: 3,
    },
    {
      name: "Vikash Yadav",
      email: "vikash.demo@example.com",
      password: "password123",
      isPremium: true,
      premiumPlan: "monthly",
      premiumStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      premiumExpiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      totalUploads: 89,
      loginCount: 31,
    },
  ];

  const createdUsers = [];
  for (const userData of sampleUsers) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`✅ Created user: ${userData.name}`);
      } else {
        createdUsers.push(existingUser);
        console.log(`ℹ️  User already exists: ${userData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.name}:`, error.message);
    }
  }

  return createdUsers;
};

// Generate sample usage data
const generateSampleUsage = async (users) => {
  console.log("📊 Generating sample usage data...");

  const tools = [
    // PDF Tools
    "merge",
    "split",
    "compress",
    "pdf-to-word",
    "pdf-to-jpg",
    "word-to-pdf",
    "jpg-to-pdf",
    "edit-pdf",
    "watermark",
    "protect-pdf",
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
  ];

  const deviceTypes = ["desktop", "mobile", "tablet"];

  for (let i = 0; i < 100; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomTool = tools[Math.floor(Math.random() * tools.length)];
    const randomDevice =
      deviceTypes[Math.floor(Math.random() * deviceTypes.length)];

    const usageData = {
      userId: randomUser._id,
      toolUsed: randomTool,
      toolCategory: Usage.getToolCategory(randomTool),
      fileCount: Math.floor(Math.random() * 3) + 1,
      totalFileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB to 5MB
      processingTime: Math.floor(Math.random() * 5000) + 500, // 0.5 to 5.5 seconds
      screenTimeInSec: Math.floor(Math.random() * 300) + 30, // 30 to 330 seconds
      completed: true,
      success: Math.random() > 0.05, // 95% success rate
      deviceType: randomDevice,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      location: {
        country: "India",
        city: "Mumbai",
        timezone: "Asia/Kolkata",
      },
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      ), // Random date in last 30 days
    };

    try {
      await Usage.trackOperation(usageData);
    } catch (error) {
      console.error("❌ Error creating usage record:", error.message);
    }
  }

  console.log("✅ Generated 100 sample usage records");
};

// Generate sample IP usage logs
const generateSampleIpLogs = async () => {
  console.log("🌐 Generating sample IP usage logs...");

  for (let i = 0; i < 20; i++) {
    const ipAddress = `203.0.113.${Math.floor(Math.random() * 254) + 1}`;
    const usageCount = Math.floor(Math.random() * 5) + 1;

    const ipLog = new IpUsageLog({
      ipAddress,
      usageCount,
      firstUsageAt: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      ),
      lastUsageAt: new Date(),
      deviceType: ["desktop", "mobile", "tablet"][
        Math.floor(Math.random() * 3)
      ],
      toolsUsed: [
        {
          toolName: "pdf-to-word",
          usedAt: new Date(),
          fileCount: 1,
          totalFileSize: 1024000,
        },
      ],
      conversionTracking: {
        hitSoftLimit: usageCount >= 3,
        hitSoftLimitAt: usageCount >= 3 ? new Date() : null,
        convertedToUser: Math.random() > 0.7, // 30% conversion rate
      },
    });

    try {
      await ipLog.save();
    } catch (error) {
      console.error("❌ Error creating IP log:", error.message);
    }
  }

  console.log("✅ Generated 20 sample IP usage logs");
};

// Generate sample feedback
const generateSampleFeedback = async (users) => {
  console.log("💬 Generating sample feedback...");

  const tools = [
    "merge",
    "split",
    "compress",
    "pdf-to-word",
    "jpg-to-pdf",
    "img-compress",
    "img-convert",
    "favicon-image-to-favicon",
    "favicon-generator",
  ];
  const comments = [
    "Great tool, works perfectly!",
    "Very fast and reliable",
    "Easy to use interface",
    "Saved me a lot of time",
    "Excellent quality output",
    "Simple and effective",
    "Would recommend to others",
  ];

  for (let i = 0; i < 25; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomTool = tools[Math.floor(Math.random() * tools.length)];
    const randomComment = comments[Math.floor(Math.random() * comments.length)];

    const feedback = new Feedback({
      userId: randomUser._id,
      toolUsed: randomTool,
      rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
      comment: randomComment,
      isVerified: true,
      isPublic: true,
      submittedAt: new Date(
        Date.now() - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000),
      ),
    });

    try {
      await feedback.save();
    } catch (error) {
      console.error("❌ Error creating feedback:", error.message);
    }
  }

  console.log("✅ Generated 25 sample feedback records");
};

// Main function
const generateAllSampleData = async () => {
  try {
    await connectDB();

    console.log("🚀 Starting sample data generation...\n");

    // Generate users first
    const users = await generateSampleUsers();

    // Generate usage data
    await generateSampleUsage(users);

    // Generate IP logs
    await generateSampleIpLogs();

    // Generate feedback
    await generateSampleFeedback(users);

    console.log("\n✅ Sample data generation completed successfully!");
    console.log(
      "📊 You can now view real data in the admin dashboard at /jEG7MtWenZDOfC3-iFMYJC_1aaA",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error generating sample data:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  generateAllSampleData();
}

module.exports = { generateAllSampleData };
