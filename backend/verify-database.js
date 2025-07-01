/**
 * Database Field Verification Script
 * Checks which fields are missing from existing documents
 */

const mongoose = require("mongoose");
const User = require("./models/User");
const Usage = require("./models/Usage");
const Feedback = require("./models/Feedback");

require("dotenv").config();

async function verifyDatabase() {
  console.log("🔍 Verifying Database Schema Compliance...\n");

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // Check User collection
    console.log("👤 Checking User Collection");
    console.log("=" * 40);

    const userFields = [
      "fullName",
      "country",
      "preferredLanguage",
      "planStatus",
      "dailyUploadLimit",
      "referrerURL",
      "toolStats",
    ];

    const users = await User.find({}).limit(5);
    console.log(`📋 Checking ${users.length} user documents...\n`);

    if (users.length === 0) {
      console.log("⚠️ No users found in database");
    } else {
      const sampleUser = users[0];
      console.log("📊 Sample User Fields Status:");

      userFields.forEach((field) => {
        const hasField = sampleUser[field] !== undefined;
        const status = hasField ? "✅ EXISTS" : "❌ MISSING";
        const value = hasField
          ? typeof sampleUser[field] === "object"
            ? JSON.stringify(sampleUser[field])
            : sampleUser[field]
          : "undefined";
        console.log(`   ${field}: ${status} ${hasField ? `(${value})` : ""}`);
      });

      // Count users missing fields
      const missingCounts = {};
      for (const field of userFields) {
        const count = await User.countDocuments({
          [field]: { $exists: false },
        });
        missingCounts[field] = count;
      }

      console.log("\n📈 Missing Field Counts:");
      Object.entries(missingCounts).forEach(([field, count]) => {
        console.log(`   ${field}: ${count} users missing this field`);
      });
    }

    // Check Usage collection
    console.log("\n📊 Checking Usage Collection");
    console.log("=" * 40);

    const usageFields = [
      "toolCategory",
      "screenTimeInSec",
      "completed",
      "deviceType",
      "referrerURL",
    ];

    const usages = await Usage.find({}).limit(5);
    console.log(`📋 Checking ${usages.length} usage documents...\n`);

    if (usages.length === 0) {
      console.log("⚠️ No usages found in database");
    } else {
      const sampleUsage = usages[0];
      console.log("📊 Sample Usage Fields Status:");

      usageFields.forEach((field) => {
        const hasField = sampleUsage[field] !== undefined;
        const status = hasField ? "✅ EXISTS" : "❌ MISSING";
        const value = hasField ? sampleUsage[field] : "undefined";
        console.log(`   ${field}: ${status} ${hasField ? `(${value})` : ""}`);
      });

      // Count usages missing fields
      const missingUsageCounts = {};
      for (const field of usageFields) {
        const count = await Usage.countDocuments({
          [field]: { $exists: false },
        });
        missingUsageCounts[field] = count;
      }

      console.log("\n📈 Missing Field Counts:");
      Object.entries(missingUsageCounts).forEach(([field, count]) => {
        console.log(`   ${field}: ${count} usages missing this field`);
      });

      // Check device type distribution
      const deviceCounts = await Usage.aggregate([
        { $match: { deviceType: { $exists: true } } },
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      console.log("\n📱 Current Device Type Distribution:");
      if (deviceCounts.length === 0) {
        console.log("   No device types found - needs migration!");
      } else {
        deviceCounts.forEach((stat) => {
          console.log(`   ${stat._id}: ${stat.count} usages`);
        });
      }
    }

    // Check Feedback collection
    console.log("\n💬 Checking Feedback Collection");
    console.log("=" * 40);

    const feedbackCount = await Feedback.countDocuments({});
    console.log(`📋 Total feedback documents: ${feedbackCount}`);

    if (feedbackCount > 0) {
      const sampleFeedback = await Feedback.findOne({});
      console.log("📊 Sample Feedback Fields:");
      const feedbackKeys = Object.keys(sampleFeedback.toObject());
      feedbackKeys.forEach((key) => {
        if (!key.startsWith("_")) {
          console.log(`   ✅ ${key}: ${sampleFeedback[key]}`);
        }
      });
    }

    // Summary
    console.log("\n📋 Verification Summary");
    console.log("=" * 40);

    const totalUsers = await User.countDocuments({});
    const totalUsages = await Usage.countDocuments({});
    const totalFeedbacks = await Feedback.countDocuments({});

    console.log(`📊 Collection Counts:`);
    console.log(`   Users: ${totalUsers}`);
    console.log(`   Usages: ${totalUsages}`);
    console.log(`   Feedbacks: ${totalFeedbacks}`);

    // Check if migration is needed
    const usersNeedingMigration = await User.countDocuments({
      $or: [
        { preferredLanguage: { $exists: false } },
        { planStatus: { $exists: false } },
        { toolStats: { $exists: false } },
      ],
    });

    const usagesNeedingMigration = await Usage.countDocuments({
      $or: [
        { deviceType: { $exists: false } },
        { toolCategory: { $exists: false } },
        { completed: { $exists: false } },
      ],
    });

    console.log(`\n🔄 Migration Status:`);
    console.log(`   Users needing migration: ${usersNeedingMigration}`);
    console.log(`   Usages needing migration: ${usagesNeedingMigration}`);

    if (usersNeedingMigration > 0 || usagesNeedingMigration > 0) {
      console.log("\n⚠️  MIGRATION NEEDED!");
      console.log("Run: npm run migrate");
    } else {
      console.log("\n✅ All documents are up to date!");
    }
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 MongoDB connection closed");
  }
}

if (require.main === module) {
  verifyDatabase();
}

module.exports = { verifyDatabase };
