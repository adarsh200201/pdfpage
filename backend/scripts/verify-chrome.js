#!/usr/bin/env node

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/**
 * Verification script for Chrome/Puppeteer installation
 * Run this after deployment to ensure PDF conversion will work
 */

async function verifyChromeInstallation() {
  console.log("🔍 Verifying Chrome/Puppeteer installation...\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
  console.log(
    `PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH || "not set"}`,
  );
  console.log(`CHROME_BIN: ${process.env.CHROME_BIN || "not set"}`);
  console.log(`RENDER: ${process.env.RENDER || "not set"}`);
  console.log("");

  // Check for Chrome executable
  const possiblePaths = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
  ].filter(Boolean);

  console.log("🔎 Checking Chrome executable paths:");
  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      console.log(`✅ Found: ${chromePath}`);
    } else {
      console.log(`❌ Not found: ${chromePath}`);
    }
  }
  console.log("");

  // Test Puppeteer launch
  console.log("🚀 Testing Puppeteer launch configurations...\n");

  const configs = [
    {
      name: "Production Config",
      config: {
        headless: "new",
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH ||
          "/usr/bin/google-chrome-stable",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--single-process",
          "--disable-gpu",
        ],
      },
    },
    {
      name: "Minimal Config",
      config: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    },
    {
      name: "Default Config",
      config: {
        headless: true,
      },
    },
  ];

  let successfulConfig = null;

  for (const { name, config } of configs) {
    try {
      console.log(`Testing ${name}...`);
      const browser = await puppeteer.launch(config);
      const page = await browser.newPage();

      // Test basic PDF generation
      await page.setContent("<h1>Test PDF</h1><p>Chrome is working!</p>");
      const pdf = await page.pdf({ format: "A4" });

      await browser.close();

      console.log(`✅ ${name}: SUCCESS (PDF size: ${pdf.length} bytes)`);
      successfulConfig = { name, config };
      break;
    } catch (error) {
      console.log(`❌ ${name}: FAILED - ${error.message}`);
    }
  }

  console.log("\n📊 Verification Results:");
  if (successfulConfig) {
    console.log(
      `✅ Chrome/Puppeteer is working with: ${successfulConfig.name}`,
    );
    console.log("✅ PDF conversion services should work properly");

    // Test document conversion service if available
    try {
      const DocumentConversionService = require("../services/documentConversionService");
      console.log("✅ DocumentConversionService loaded successfully");
    } catch (error) {
      console.log(`⚠️ DocumentConversionService error: ${error.message}`);
    }
  } else {
    console.log("❌ Chrome/Puppeteer is not working");
    console.log("❌ PDF conversion services will fail");
    console.log("\n🔧 Troubleshooting steps:");
    console.log(
      "1. Ensure Chrome is installed: apt-get install google-chrome-stable",
    );
    console.log("2. Set PUPPETEER_EXECUTABLE_PATH environment variable");
    console.log("3. Run: npx puppeteer browsers install chrome");
    console.log("4. Check Docker/container configuration");
  }

  console.log("\n🏁 Verification complete!");
  return successfulConfig !== null;
}

// Run verification
if (require.main === module) {
  verifyChromeInstallation()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("💥 Verification failed:", error);
      process.exit(1);
    });
}

module.exports = { verifyChromeInstallation };
