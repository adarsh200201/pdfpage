/**
 * Verification Script for Optional Fields
 * This script checks the current status of optional fields in the database
 * Use this before and after running the migration to see the impact
 */

const mongoose = require("mongoose");
const User = require("./models/User");
const Usage = require("./models/Usage");

// Load environment variables
require("dotenv").config();

/**
 * Check the status of optional fields in the database
 */
async function verifyOptionalFields() {
  console.log("🔍 Verifying Optional Fields Status...\n");

  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // ========================================
    // USERS COLLECTION ANALYSIS
    // ========================================
    console.log("👤 Users Collection Analysis");
    console.log("=" * 50);

    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users: ${totalUsers}`);

    if (totalUsers > 0) {
      // Check preferredLanguage field
      const usersWithoutPreferredLanguage = await User.countDocuments({
        $or: [
          { preferredLanguage: { $in: [null, undefined] } },
          { preferredLanguage: { $exists: false } },
        ],
      });

      // Check country field
      const usersWithoutCountry = await User.countDocuments({
        $or: [
          { country: { $in: [null, undefined] } },
          { country: { $exists: false } },
        ],
      });

      // Check ipAddress field
      const usersWithoutIpAddress = await User.countDocuments({
        $or: [
          { ipAddress: { $in: [null, undefined] } },
          { ipAddress: { $exists: false } },
        ],
      });

      // Get distribution of preferredLanguage values
      const languageDistribution = await User.aggregate([
        { $group: { _id: "$preferredLanguage", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Get distribution of country values
      const countryDistribution = await User.aggregate([
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }, // Top 10 countries
      ]);

      console.log("\n📈 Field Status:");
      console.log(
        `   - Missing preferredLanguage: ${usersWithoutPreferredLanguage}/${totalUsers} (${((usersWithoutPreferredLanguage / totalUsers) * 100).toFixed(1)}%)`,
      );
      console.log(
        `   - Missing country: ${usersWithoutCountry}/${totalUsers} (${((usersWithoutCountry / totalUsers) * 100).toFixed(1)}%)`,
      );
      console.log(
        `   - Missing ipAddress: ${usersWithoutIpAddress}/${totalUsers} (${((usersWithoutIpAddress / totalUsers) * 100).toFixed(1)}%)`,
      );

      console.log("\n🗣️  Language Distribution:");
      languageDistribution.forEach((lang) => {
        console.log(
          `   - ${lang._id || "null/undefined"}: ${lang.count} users`,
        );
      });

      console.log("\n🌍 Top Countries:");
      countryDistribution.slice(0, 5).forEach((country) => {
        console.log(
          `   - ${country._id || "null/undefined"}: ${country.count} users`,
        );
      });
    }

    console.log("");

    // ========================================
    // USAGES COLLECTION ANALYSIS
    // ========================================
    console.log("📊 Usages Collection Analysis");
    console.log("=" * 50);

    const totalUsages = await Usage.countDocuments();
    console.log(`📊 Total usages: ${totalUsages}`);

    if (totalUsages > 0) {
      // Check screenTimeInSec field
      const usagesWithoutScreenTime = await Usage.countDocuments({
        $or: [
          { screenTimeInSec: { $in: [null, undefined] } },
          { screenTimeInSec: { $exists: false } },
        ],
      });

      // Check ipAddress field
      const usagesWithoutIpAddress = await Usage.countDocuments({
        $or: [
          { ipAddress: { $in: [null, undefined] } },
          { ipAddress: { $exists: false } },
        ],
      });

      // Check deviceType field
      const usagesWithoutDeviceType = await Usage.countDocuments({
        $or: [
          { deviceType: { $in: [null, undefined] } },
          { deviceType: { $exists: false } },
        ],
      });

      // Check referrerURL field
      const usagesWithoutReferrerURL = await Usage.countDocuments({
        $or: [
          { referrerURL: { $in: [null, undefined] } },
          { referrerURL: { $exists: false } },
        ],
      });

      // Get distribution of deviceType values
      const deviceDistribution = await Usage.aggregate([
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Get distribution of referrerURL values (top 10)
      const referrerDistribution = await Usage.aggregate([
        { $group: { _id: "$referrerURL", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      console.log("\n📈 Field Status:");
      console.log(
        `   - Missing screenTimeInSec: ${usagesWithoutScreenTime}/${totalUsages} (${((usagesWithoutScreenTime / totalUsages) * 100).toFixed(1)}%)`,
      );
      console.log(
        `   - Missing ipAddress: ${usagesWithoutIpAddress}/${totalUsages} (${((usagesWithoutIpAddress / totalUsages) * 100).toFixed(1)}%)`,
      );
      console.log(
        `   - Missing deviceType: ${usagesWithoutDeviceType}/${totalUsages} (${((usagesWithoutDeviceType / totalUsages) * 100).toFixed(1)}%)`,
      );
      console.log(
        `   - Missing referrerURL: ${usagesWithoutReferrerURL}/${totalUsages} (${((usagesWithoutReferrerURL / totalUsages) * 100).toFixed(1)}%)`,
      );

      console.log("\n📱 Device Type Distribution:");
      deviceDistribution.forEach((device) => {
        console.log(
          `   - ${device._id || "null/undefined"}: ${device.count} usages`,
        );
      });

      console.log("\n🔗 Top Referrer URLs:");
      referrerDistribution.slice(0, 5).forEach((referrer) => {
        const url = referrer._id || "null/undefined";
        const displayUrl = url.length > 50 ? url.substring(0, 47) + "..." : url;
        console.log(`   - ${displayUrl}: ${referrer.count} usages`);
      });
    }

    console.log("");

    // ========================================
    // MIGRATION READINESS ASSESSMENT
    // ========================================
    console.log("🎯 Migration Readiness Assessment");
    console.log("=" * 50);

    const totalMissingFieldsUsers =
      (await User.countDocuments({
        $or: [
          { preferredLanguage: { $in: [null, undefined] } },
          { preferredLanguage: { $exists: false } },
          { country: { $in: [null, undefined] } },
          { country: { $exists: false } },
          { ipAddress: { $in: [null, undefined] } },
          { ipAddress: { $exists: false } },
        ],
      })) || 0;

    const totalMissingFieldsUsages =
      (await Usage.countDocuments({
        $or: [
          { screenTimeInSec: { $in: [null, undefined] } },
          { screenTimeInSec: { $exists: false } },
          { ipAddress: { $in: [null, undefined] } },
          { ipAddress: { $exists: false } },
          { deviceType: { $in: [null, undefined] } },
          { deviceType: { $exists: false } },
          { referrerURL: { $in: [null, undefined] } },
          { referrerURL: { $exists: false } },
        ],
      })) || 0;

    console.log(`📋 Users requiring migration: ${totalMissingFieldsUsers}`);
    console.log(`📋 Usages requiring migration: ${totalMissingFieldsUsages}`);

    if (totalMissingFieldsUsers === 0 && totalMissingFieldsUsages === 0) {
      console.log(
        "\n✅ No migration needed - all optional fields are populated!",
      );
    } else {
      console.log(
        "\n🔄 Migration recommended to populate missing optional fields",
      );
      console.log("   Run: npm run migrate:optional-fields");
    }

    console.log("");
    console.log("🎉 Verification completed successfully!");
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("👋 MongoDB connection closed");
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyOptionalFields()
    .then(() => {
      console.log("\n✨ Verification completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Verification failed:", error);
      process.exit(1);
    });
}

module.exports = { verifyOptionalFields };
