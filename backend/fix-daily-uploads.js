const fs = require("fs");
const path = require("path");

const authFilePath = path.join(__dirname, "routes", "auth.js");

// Read the auth.js file
fs.readFile(authFilePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading auth.js:", err);
    return;
  }

  // Replace all occurrences of the daily upload fields
  let fixedData = data.replace(
    /dailyUploads: user\.dailyUploads,/g,
    "dailyUploads: 0, // Daily limits removed",
  );

  fixedData = fixedData.replace(
    /maxDailyUploads: user\.maxDailyUploads,/g,
    "maxDailyUploads: 999999, // Unlimited for authenticated users",
  );

  // Write the fixed file back
  fs.writeFile(authFilePath, fixedData, "utf8", (err) => {
    if (err) {
      console.error("Error writing auth.js:", err);
      return;
    }
    console.log("✅ Fixed auth.js daily upload references");
  });
});
