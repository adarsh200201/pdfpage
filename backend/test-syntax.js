try {
  require("./routes/pdf.js");
  console.log("✅ PDF routes syntax is valid");
} catch (error) {
  console.error("❌ PDF routes syntax error:", error.message);
  process.exit(1);
}
