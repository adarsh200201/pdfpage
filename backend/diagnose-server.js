#!/usr/bin/env node

console.log("🔍 Diagnosing server startup issues...\n");

// Test 1: Check Node.js version
console.log("1️⃣ Node.js version:", process.version);

// Test 2: Check environment variables
console.log("2️⃣ Environment check:");
console.log("   NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("   PORT:", process.env.PORT || "not set");
console.log(
  "   MONGODB_URI:",
  process.env.MONGODB_URI ? "✅ Set" : "❌ Not set",
);

// Test 3: Test basic dependencies
console.log("\n3️⃣ Testing core dependencies:");

const dependencies = ["express", "mongoose", "dotenv", "cors", "helmet"];

for (const dep of dependencies) {
  try {
    require(dep);
    console.log(`   ✅ ${dep}`);
  } catch (error) {
    console.log(`   ❌ ${dep}: ${error.message}`);
  }
}

// Test 4: Test our custom modules
console.log("\n4️⃣ Testing custom modules:");

const customModules = [
  "./utils/logger",
  "./config/passport",
  "./services/documentConversionService",
];

for (const mod of customModules) {
  try {
    require(mod);
    console.log(`   ✅ ${mod}`);
  } catch (error) {
    console.log(`   ❌ ${mod}: ${error.message}`);
  }
}

// Test 5: Test route files
console.log("\n5️⃣ Testing route files:");

const routes = ["./routes/pdf.js", "./routes/auth.js", "./routes/analytics.js"];

for (const route of routes) {
  try {
    require(route);
    console.log(`   ✅ ${route}`);
  } catch (error) {
    console.log(`   ❌ ${route}: ${error.message}`);
  }
}

// Test 6: Check if we can start Express
console.log("\n6️⃣ Testing Express startup:");

try {
  const express = require("express");
  const app = express();

  // Try to create a basic server
  const server = app.listen(0, () => {
    const port = server.address().port;
    console.log(`   ✅ Express can start on port ${port}`);
    server.close();
  });
} catch (error) {
  console.log(`   ❌ Express startup failed: ${error.message}`);
}

// Test 7: MongoDB connection test
console.log("\n7️⃣ Testing MongoDB connection:");

if (process.env.MONGODB_URI) {
  const mongoose = require("mongoose");

  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("   ✅ MongoDB connection successful");
      mongoose.disconnect();
    })
    .catch((error) => {
      console.log(`   ❌ MongoDB connection failed: ${error.message}`);
    });
} else {
  console.log("   ⚠️ MONGODB_URI not set, skipping connection test");
}

console.log("\n🏁 Diagnosis complete!");
console.log(
  "\nIf any items show ❌, those need to be fixed before the server can start.",
);
