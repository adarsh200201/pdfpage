/**
 * Database Migration Script for Missing Optional Fields
 * This script updates documents that have missing optional fields with appropriate defaults
 * Only targets documents where fields are null, undefined, or entirely missing
 */

const mongoose = require("mongoose");
const User = require("./models/User");
const Usage = require("./models/Usage");

// Load environment variables
require("dotenv").config();

/**
 * Migration function to update missing optional fields
 */
async function migrateOptionalFields() {
  console.log("🔄 Starting Migration for Missing Optional Fields...\n");

  const migrationResults = {
    users: {
      processed: 0,
      updated: 0,
      fields: {
        preferredLanguage: 0,
        country: 0,
        ipAddress: 0,
      },
    },
    usages: {
      processed: 0,
      updated: 0,
      fields: {
        screenTimeInSec: 0,
        ipAddress: 0,
        deviceType: 0,
        referrerURL: 0,
      },
    },
  };

  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // ========================================
    // USERS COLLECTION MIGRATION
    // ========================================
    console.log("👤 Migrating Users Collection");
    console.log("=" * 50);

    // Find users with missing optional fields
    const usersQuery = {
      $or: [
        { preferredLanguage: { $in: [null, undefined] } },
        { preferredLanguage: { $exists: false } },
        { country: { $in: [null, undefined] } },
        { country: { $exists: false } },
        { ipAddress: { $in: [null, undefined] } },
        { ipAddress: { $exists: false } },
      ],
    };

    const usersToUpdate = await User.find(usersQuery);
    migrationResults.users.processed = usersToUpdate.length;

    console.log(
      `📋 Found ${usersToUpdate.length} users with missing optional fields`,
    );

    if (usersToUpdate.length > 0) {
      // Prepare bulk write operations for efficiency
      const userBulkOps = [];

      for (const user of usersToUpdate) {
        const updateFields = {};
        let hasUpdates = false;

        // Check and set preferredLanguage
        if (
          !user.preferredLanguage ||
          user.preferredLanguage === null ||
          user.preferredLanguage === undefined
        ) {
          updateFields.preferredLanguage = "en";
          migrationResults.users.fields.preferredLanguage++;
          hasUpdates = true;
        }

        // Check and set country
        if (
          !user.country ||
          user.country === null ||
          user.country === undefined
        ) {
          updateFields.country = "unknown";
          migrationResults.users.fields.country++;
          hasUpdates = true;
        }

        // Check and set ipAddress (add field if it doesn't exist in schema)
        if (
          !user.ipAddress ||
          user.ipAddress === null ||
          user.ipAddress === undefined
        ) {
          updateFields.ipAddress = "not_fetched";
          migrationResults.users.fields.ipAddress++;
          hasUpdates = true;
        }

        if (hasUpdates) {
          userBulkOps.push({
            updateOne: {
              filter: { _id: user._id },
              update: { $set: updateFields },
            },
          });
          migrationResults.users.updated++;
        }
      }

      // Execute bulk update for users
      if (userBulkOps.length > 0) {
        const userBulkResult = await User.bulkWrite(userBulkOps);
        console.log(
          `✅ Updated ${userBulkResult.modifiedCount} user documents`,
        );

        // Log field-specific updates
        console.log("   Field updates:");
        console.log(
          `   - preferredLanguage: ${migrationResults.users.fields.preferredLanguage} users`,
        );
        console.log(
          `   - country: ${migrationResults.users.fields.country} users`,
        );
        console.log(
          `   - ipAddress: ${migrationResults.users.fields.ipAddress} users`,
        );
      }
    } else {
      console.log("✅ No users need updates for optional fields");
    }

    console.log("");

    // ========================================
    // USAGES COLLECTION MIGRATION
    // ========================================
    console.log("📊 Migrating Usages Collection");
    console.log("=" * 50);

    // Find usages with missing optional fields
    const usagesQuery = {
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
    };

    const usagesToUpdate = await Usage.find(usagesQuery);
    migrationResults.usages.processed = usagesToUpdate.length;

    console.log(
      `📋 Found ${usagesToUpdate.length} usages with missing optional fields`,
    );

    if (usagesToUpdate.length > 0) {
      // Prepare bulk write operations for efficiency
      const usageBulkOps = [];

      for (const usage of usagesToUpdate) {
        const updateFields = {};
        let hasUpdates = false;

        // Check and set screenTimeInSec
        if (
          usage.screenTimeInSec === null ||
          usage.screenTimeInSec === undefined
        ) {
          updateFields.screenTimeInSec = 0;
          migrationResults.usages.fields.screenTimeInSec++;
          hasUpdates = true;
        }

        // Check and set ipAddress
        if (
          !usage.ipAddress ||
          usage.ipAddress === null ||
          usage.ipAddress === undefined
        ) {
          updateFields.ipAddress = "not_fetched";
          migrationResults.usages.fields.ipAddress++;
          hasUpdates = true;
        }

        // Check and set deviceType (try to parse from userAgent, otherwise set to unknown)
        if (
          !usage.deviceType ||
          usage.deviceType === null ||
          usage.deviceType === undefined
        ) {
          if (usage.userAgent) {
            // Try to detect device type from user agent
            try {
              const { detectDeviceType } = require("./utils/deviceUtils");
              updateFields.deviceType = detectDeviceType(usage.userAgent);
            } catch (error) {
              // If detection fails, use unknown
              updateFields.deviceType = "unknown";
            }
          } else {
            updateFields.deviceType = "unknown";
          }
          migrationResults.usages.fields.deviceType++;
          hasUpdates = true;
        }

        // Check and set referrerURL
        if (
          !usage.referrerURL ||
          usage.referrerURL === null ||
          usage.referrerURL === undefined
        ) {
          updateFields.referrerURL = "direct";
          migrationResults.usages.fields.referrerURL++;
          hasUpdates = true;
        }

        if (hasUpdates) {
          usageBulkOps.push({
            updateOne: {
              filter: { _id: usage._id },
              update: { $set: updateFields },
            },
          });
          migrationResults.usages.updated++;
        }
      }

      // Execute bulk update for usages
      if (usageBulkOps.length > 0) {
        const usageBulkResult = await Usage.bulkWrite(usageBulkOps);
        console.log(
          `✅ Updated ${usageBulkResult.modifiedCount} usage documents`,
        );

        // Log field-specific updates
        console.log("   Field updates:");
        console.log(
          `   - screenTimeInSec: ${migrationResults.usages.fields.screenTimeInSec} usages`,
        );
        console.log(
          `   - ipAddress: ${migrationResults.usages.fields.ipAddress} usages`,
        );
        console.log(
          `   - deviceType: ${migrationResults.usages.fields.deviceType} usages`,
        );
        console.log(
          `   - referrerURL: ${migrationResults.usages.fields.referrerURL} usages`,
        );
      }
    } else {
      console.log("✅ No usages need updates for optional fields");
    }

    console.log("");

    // ========================================
    // VERIFICATION AND SUMMARY
    // ========================================
    console.log("🔍 Verification and Summary");
    console.log("=" * 50);

    // Verify users collection
    const usersAfterMigration = await User.countDocuments({
      $or: [
        { preferredLanguage: { $in: [null, undefined] } },
        { preferredLanguage: { $exists: false } },
        { country: { $in: [null, undefined] } },
        { country: { $exists: false } },
      ],
    });

    // Verify usages collection
    const usagesAfterMigration = await Usage.countDocuments({
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
    });

    console.log("📊 Migration Results Summary:");
    console.log(`   Users processed: ${migrationResults.users.processed}`);
    console.log(`   Users updated: ${migrationResults.users.updated}`);
    console.log(`   Users still missing fields: ${usersAfterMigration}`);
    console.log(`   Usages processed: ${migrationResults.usages.processed}`);
    console.log(`   Usages updated: ${migrationResults.usages.updated}`);
    console.log(`   Usages still missing fields: ${usagesAfterMigration}`);

    // Log detailed field statistics
    console.log("\n📈 Detailed Field Updates:");
    console.log("   Users:");
    Object.entries(migrationResults.users.fields).forEach(([field, count]) => {
      console.log(`     - ${field}: ${count} documents`);
    });
    console.log("   Usages:");
    Object.entries(migrationResults.usages.fields).forEach(([field, count]) => {
      console.log(`     - ${field}: ${count} documents`);
    });

    if (usersAfterMigration === 0 && usagesAfterMigration === 0) {
      console.log("\n🎉 Migration Completed Successfully!");
      console.log(
        "✅ All missing optional fields have been populated with defaults",
      );
    } else {
      console.log(
        "\n⚠️  Migration completed with some remaining missing fields",
      );
      console.log(
        "   This might be due to documents created during migration or data consistency issues",
      );
    }

    return migrationResults;
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 MongoDB connection closed");
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateOptionalFields()
    .then((results) => {
      console.log("\n✨ Optional fields migration completed!");
      console.log("📋 Summary:", JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Optional fields migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateOptionalFields };
