const fs = require("fs").promises;
const path = require("path");

const ensureDirectories = async () => {
  const directories = [
    "uploads",
    "uploads/libreoffice-temp",
    "uploads/libreoffice-temp/output",
    "logs",
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Directory ensured: ${dir}`);
    } catch (error) {
      console.error(`❌ Error creating directory ${dir}:`, error.message);
    }
  }
};

module.exports = { ensureDirectories };
