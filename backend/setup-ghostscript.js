#!/usr/bin/env node

/**
 * Ghostscript Setup and Verification Script
 * For PdfPage Enterprise PDF Compression
 */

const { execSync, spawn } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");

console.log("🚀 PdfPage Ghostscript Setup Utility\n");

// Detect operating system
const platform = os.platform();
console.log(`📋 Detected OS: ${platform}`);

// Check if Ghostscript is installed
function checkGhostscript() {
  const commands = ["gs", "gswin64c", "gswin32c", "ghostscript"];

  for (const cmd of commands) {
    try {
      const version = execSync(`${cmd} --version`, {
        stdio: "pipe",
        encoding: "utf8",
      });
      console.log(`✅ Ghostscript found: ${cmd} (version ${version.trim()})`);
      return { found: true, command: cmd, version: version.trim() };
    } catch (error) {
      // Continue checking
    }
  }

  return { found: false };
}

// Provide installation instructions
function showInstallInstructions() {
  console.log(
    "\n❌ Ghostscript not found. Installation required for 85% compression:\n",
  );

  switch (platform) {
    case "win32":
      console.log("📥 Windows Installation:");
      console.log(
        "1. Download Ghostscript from: https://www.ghostscript.com/download/gsdnld.html",
      );
      console.log("2. Download the Windows installer (GPL Ghostscript)");
      console.log("3. Run the installer as administrator");
      console.log("4. Add to PATH or restart your terminal");
      console.log("5. Restart your Node.js server");
      break;

    case "darwin":
      console.log("📥 macOS Installation:");
      console.log("Option 1 - Homebrew (recommended):");
      console.log("  brew install ghostscript");
      console.log("\nOption 2 - MacPorts:");
      console.log("  sudo port install ghostscript");
      console.log("\nOption 3 - Download:");
      console.log("  https://www.ghostscript.com/download/gsdnld.html");
      break;

    case "linux":
      console.log("📥 Linux Installation:");
      console.log("Ubuntu/Debian:");
      console.log("  sudo apt-get update");
      console.log("  sudo apt-get install ghostscript");
      console.log("\nCentOS/RHEL/Fedora:");
      console.log("  sudo yum install ghostscript");
      console.log("  # or");
      console.log("  sudo dnf install ghostscript");
      console.log("\nArch Linux:");
      console.log("  sudo pacman -S ghostscript");
      break;

    default:
      console.log("📥 Generic Installation:");
      console.log("Visit: https://www.ghostscript.com/download/gsdnld.html");
      console.log("Or use your system's package manager");
  }

  console.log(
    "\n🔄 After installation, restart your Node.js server to detect Ghostscript",
  );
}

// Test compression capability
async function testCompression(gsCommand) {
  console.log("\n🧪 Testing compression capability...");

  // Create a simple test PDF
  const testPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000209 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
301
%%EOF`;

  const testDir = path.join(__dirname, "temp");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const inputPath = path.join(testDir, "test-input.pdf");
  const outputPath = path.join(testDir, "test-output.pdf");

  try {
    // Write test PDF
    fs.writeFileSync(inputPath, testPdfContent);

    // Run compression test
    const params = [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/screen",
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      "-dSAFER",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ];

    const gsProcess = spawn(gsCommand, params, { stdio: "pipe" });

    return new Promise((resolve) => {
      gsProcess.on("close", (code) => {
        try {
          if (code === 0 && fs.existsSync(outputPath)) {
            const inputSize = fs.statSync(inputPath).size;
            const outputSize = fs.statSync(outputPath).size;
            console.log(`✅ Compression test successful!`);
            console.log(`📊 Test: ${inputSize} bytes → ${outputSize} bytes`);

            // Cleanup
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            resolve(true);
          } else {
            console.log(`❌ Compression test failed (exit code: ${code})`);
            resolve(false);
          }
        } catch (error) {
          console.log(`❌ Compression test error: ${error.message}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.log(`❌ Test setup failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  const result = checkGhostscript();

  if (result.found) {
    console.log(`\n🎉 Ghostscript is properly installed!`);
    console.log(`📋 Command: ${result.command}`);
    console.log(`📋 Version: ${result.version}`);

    // Test compression
    const testResult = await testCompression(result.command);

    if (testResult) {
      console.log("\n✅ Your system is ready for 85% PDF compression!");
      console.log(
        "🚀 Start your Node.js server to begin using enterprise compression.",
      );
    } else {
      console.log("\n⚠️ Ghostscript found but compression test failed.");
      console.log("Check your Ghostscript installation and permissions.");
    }
  } else {
    showInstallInstructions();
    console.log(
      "\n📝 Note: The system will use JavaScript fallback compression (up to 25% reduction) until Ghostscript is installed.",
    );
  }

  console.log("\n🔧 For support, visit: https://pdfpage.com/support");
}

// Run the setup
main().catch(console.error);
