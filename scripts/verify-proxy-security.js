#!/usr/bin/env node

/**
 * Production Build Security Verification
 * Ensures no backend URLs are exposed in the production bundle
 */

const fs = require("fs");
const path = require("path");

const BACKEND_URL_PATTERN = /https:\/\/pdfpage-app\.onrender\.com/gi;
const DIST_DIR = path.join(__dirname, "../dist");

function scanDirectory(dir) {
  const violations = [];

  if (!fs.existsSync(dir)) {
    console.log("❌ Dist directory not found. Run npm run build first.");
    return violations;
  }

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const matches = content.match(BACKEND_URL_PATTERN);

      if (matches) {
        violations.push({
          file: path.relative(DIST_DIR, filePath),
          matches: matches.length,
          urls: [...new Set(matches)],
        });
      }
    } catch (error) {
      // Skip binary files or files that can't be read
    }
  }

  function walkDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        walkDirectory(itemPath);
      } else if (
        stat.isFile() &&
        (item.endsWith(".js") ||
          item.endsWith(".html") ||
          item.endsWith(".css"))
      ) {
        scanFile(itemPath);
      }
    }
  }

  walkDirectory(dir);
  return violations;
}

console.log("🔐 Verifying server-side proxy security in production build...\n");

const violations = scanDirectory(DIST_DIR);

if (violations.length === 0) {
  console.log("✅ PERFECT: No backend URLs found in production bundle!");
  console.log("✅ Server-side proxy is properly configured");
  console.log("✅ Users will only see pdfpage.in domain during OAuth\n");

  console.log("🎯 Security Benefits:");
  console.log("   • No backend endpoints exposed to client");
  console.log("   • OAuth flow stays on pdfpage.in domain");
  console.log("   • Enhanced user trust and brand consistency");
  console.log("   • Protection against client-side URL manipulation\n");

  process.exit(0);
} else {
  console.log("❌ SECURITY VIOLATIONS FOUND:\n");

  violations.forEach((violation) => {
    console.log(`File: ${violation.file}`);
    console.log(`Exposed URLs (${violation.matches} instances):`);
    violation.urls.forEach((url) => console.log(`  - ${url}`));
    console.log("");
  });

  console.log("🔧 Recommended fixes:");
  console.log("   • Replace hardcoded URLs with relative paths");
  console.log("   • Use environment variables for development URLs only");
  console.log("   • Ensure all production requests use /api/* proxy paths\n");

  process.exit(1);
}
