const { convertExcelToPdf } = require("./utils/excelToPdfConverter");
const path = require("path");

async function testConverter() {
  try {
    console.log("✅ Excel to PDF converter loaded successfully");
    console.log("📋 Required dependencies:");
    console.log("  - exceljs:", require("exceljs").version || "installed");
    console.log("  - jspdf:", require("jspdf").version || "installed");
    console.log("  - xlsx:", require("xlsx").version || "installed");
    console.log("🎉 All dependencies are available!");
  } catch (error) {
    console.error("❌ Error testing converter:", error.message);
  }
}

testConverter();
