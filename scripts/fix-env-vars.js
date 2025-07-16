#!/usr/bin/env node

/**
 * Fix environment variable usage across codebase
 * Replace process.env.NODE_ENV with import.meta.env.DEV for Vite compatibility
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, "../src");

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Replace process.env.NODE_ENV === "development" with import.meta.env.DEV
    if (content.includes('process.env.NODE_ENV === "development"')) {
      content = content.replace(
        /process\.env\.NODE_ENV === "development"/g,
        "import.meta.env.DEV",
      );
      modified = true;
    }

    // Replace process.env.NODE_ENV !== "development" with !import.meta.env.DEV
    if (content.includes('process.env.NODE_ENV !== "development"')) {
      content = content.replace(
        /process\.env\.NODE_ENV !== "development"/g,
        "!import.meta.env.DEV",
      );
      modified = true;
    }

    // Replace process.env.NODE_ENV === "production" with import.meta.env.PROD
    if (content.includes('process.env.NODE_ENV === "production"')) {
      content = content.replace(
        /process\.env\.NODE_ENV === "production"/g,
        "import.meta.env.PROD",
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.relative(SRC_DIR, filePath)}`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not process: ${filePath}`);
  }
}

function walkDirectory(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      walkDirectory(itemPath);
    } else if (item.endsWith(".ts") || item.endsWith(".tsx")) {
      fixFile(itemPath);
    }
  }
}

console.log("🔧 Fixing environment variable usage in codebase...\n");

if (fs.existsSync(SRC_DIR)) {
  walkDirectory(SRC_DIR);
  console.log("\n✅ Environment variable fixes complete!");
} else {
  console.log("❌ src directory not found");
}
