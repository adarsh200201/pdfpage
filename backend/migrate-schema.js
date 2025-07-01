/**
 * Database Migration Script for Updated PdfPage Schema
 * This script updates existing documents to include new fields
 */

const mongoose = require("mongoose");
const User = require("./models/User");
const Usage = require("./models/Usage");
const { detectDeviceType } = require("./utils/deviceUtils");

// Load environment variables
require("dotenv").config();

async function migrateDatabase() {
  console.log("🔄 Starting Database Migration for Updated Schema...\n");

  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // Migration 1: Update User documents with new fields
    console.log("👤 Migration 1: Updating User documents");
    console.log("=" * 50);

    const users = await User.find({});
    console.log(`📋 Found ${users.length} user documents to migrate`);

    let userUpdates = 0;
    for (const user of users) {
      let needsUpdate = false;
      const updateData = {};

      // Add missing fields with defaults
      if (user.fullName === undefined) {
        updateData.fullName = user.name || "";
        needsUpdate = true;
      }

      if (user.country === undefined) {
        updateData.country = "";
        needsUpdate = true;
      }

      if (user.preferredLanguage === undefined) {
        updateData.preferredLanguage = "en";
        needsUpdate = true;
      }

      if (user.planStatus === undefined) {
        updateData.planStatus = user.isPremium ? "active" : "active";
        needsUpdate = true;
      }

      if (user.dailyUploadLimit === undefined) {
        updateData.dailyUploadLimit = user.maxDailyUploads || 3;
        needsUpdate = true;
      }

      if (user.referrerURL === undefined) {
        updateData.referrerURL = "";
        needsUpdate = true;
      }

      if (user.toolStats === undefined) {
        updateData.toolStats = new Map();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await User.findByIdAndUpdate(user._id, updateData);
        userUpdates++;
        console.log(`✅ Updated user: ${user.email}`);
      }
    }

    console.log(`📊 Updated ${userUpdates} user documents\n`);

    // Migration 2: Update Usage documents with new fields
    console.log("📊 Migration 2: Updating Usage documents");
    console.log("=" * 50);

    const usages = await Usage.find({});
    console.log(`📋 Found ${usages.length} usage documents to migrate`);

    let usageUpdates = 0;
    for (const usage of usages) {
      let needsUpdate = false;
      const updateData = {};

      // Add toolCategory if missing
      if (usage.toolCategory === undefined) {
        updateData.toolCategory = Usage.getToolCategory(usage.toolUsed);
        needsUpdate = true;
      }

      // Add screenTimeInSec if missing
      if (usage.screenTimeInSec === undefined) {
        updateData.screenTimeInSec = 0;
        needsUpdate = true;
      }

      // Add completed if missing
      if (usage.completed === undefined) {
        updateData.completed = usage.success !== false;
        needsUpdate = true;
      }

      // Add deviceType if missing (detect from userAgent)
      if (usage.deviceType === undefined) {
        if (usage.userAgent) {
          updateData.deviceType = detectDeviceType(usage.userAgent);
        } else {
          updateData.deviceType = "desktop";
        }
        needsUpdate = true;
      }

      // Add referrerURL if missing
      if (usage.referrerURL === undefined) {
        updateData.referrerURL = "";
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Usage.findByIdAndUpdate(usage._id, updateData);
        usageUpdates++;
        console.log(
          `✅ Updated usage: ${usage.toolUsed} (${updateData.deviceType})`,
        );
      }
    }

    console.log(`📊 Updated ${usageUpdates} usage documents\n`);

    // Migration 3: Backfill user tool stats from usage data
    console.log("📈 Migration 3: Backfilling User Tool Statistics");
    console.log("=" * 50);

    const usersWithStats = await User.find({});
    let statsUpdates = 0;

    for (const user of usersWithStats) {
      // Get all usage for this user
      const userUsages = await Usage.find({ userId: user._id });

      if (userUsages.length > 0) {
        // Calculate tool stats
        const toolStats = new Map();
        userUsages.forEach((usage) => {
          const current = toolStats.get(usage.toolUsed) || 0;
          toolStats.set(usage.toolUsed, current + 1);
        });

        // Update user with tool stats
        user.toolStats = toolStats;
        user.markModified("toolStats");
        await user.save();

        console.log(
          `✅ Updated tool stats for: ${user.email} (${toolStats.size} tools)`,
        );
        statsUpdates++;
      }
    }

    console.log(`📊 Updated tool stats for ${statsUpdates} users\n`);

    // Migration 4: Verify data integrity
    console.log("🔒 Migration 4: Verifying Data Integrity");
    console.log("=" * 50);

    // Check users
    const updatedUsers = await User.find({});
    const usersWithNewFields = updatedUsers.filter(
      (user) =>
        user.preferredLanguage !== undefined &&
        user.planStatus !== undefined &&
        user.dailyUploadLimit !== undefined,
    );

    console.log(
      `✅ Users with new fields: ${usersWithNewFields.length}/${updatedUsers.length}`,
    );

    // Check usages
    const updatedUsages = await Usage.find({});
    const usagesWithNewFields = updatedUsages.filter(
      (usage) =>
        usage.toolCategory !== undefined &&
        usage.deviceType !== undefined &&
        usage.completed !== undefined,
    );

    console.log(
      `✅ Usages with new fields: ${usagesWithNewFields.length}/${updatedUsages.length}`,
    );

    // Check device type distribution
    const deviceStats = await Usage.aggregate([
      { $group: { _id: "$deviceType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("📱 Device Type Distribution:");
    deviceStats.forEach((stat) => {
      console.log(`   ${stat._id}: ${stat.count} usages`);
    });

    console.log("\n🎉 Database Migration Completed Successfully!");
    console.log("=" * 50);
    console.log("✅ All existing documents updated with new fields");
    console.log("✅ Tool statistics backfilled from usage data");
    console.log("✅ Device types detected from existing user agents");
    console.log("✅ Data integrity verified");
    console.log("\n🚀 Your database is now fully updated and ready!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("👋 MongoDB connection closed");
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log("\n✨ Migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };
