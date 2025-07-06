const express = require("express");
const router = express.Router();
const ghostscriptDiagnostics = require("../utils/ghostscriptDiagnostics");

// @route   GET /api/diagnostics/ghostscript
// @desc    Check Ghostscript installation and provide troubleshooting info
// @access  Public
router.get("/ghostscript", async (req, res) => {
  try {
    console.log("🔧 Running Ghostscript diagnostics...");

    const diagnosticReport =
      await ghostscriptDiagnostics.generateDiagnosticReport();

    // Add Windows-specific troubleshooting if Ghostscript is not available
    if (
      !diagnosticReport.ghostscript.available &&
      diagnosticReport.platform.os === "win32"
    ) {
      diagnosticReport.windowsTroubleshooting = {
        commonIssues: [
          {
            issue: "Ghostscript downloaded but not installed",
            solution:
              "Run the downloaded .exe file as Administrator to install",
            checkCommand: "Double-click the .exe file you downloaded",
          },
          {
            issue: "Ghostscript installed but not in PATH",
            solution: "Add Ghostscript to Windows PATH environment variable",
            checkCommand: "Open Command Prompt and type: gswin64c --version",
          },
          {
            issue: "Wrong architecture (32-bit vs 64-bit)",
            solution: "Download the correct version for your system",
            checkCommand: "Check if you have 64-bit or 32-bit Windows",
          },
          {
            issue: "Installation location not standard",
            solution:
              "Reinstall to default location or add custom path to PATH",
            checkCommand: "Check C:\\Program Files\\gs\\ folder",
          },
        ],
        stepByStepFix: [
          "1. Open Windows Settings → Apps → Apps & features",
          "2. Search for 'Ghostscript' to see if it's installed",
          "3. If not installed, run the downloaded .exe file as Administrator",
          "4. During installation, check 'Add to PATH' if available",
          "5. After installation, open Command Prompt and test: gswin64c --version",
          "6. If still not working, manually add to PATH:",
          "   - Open System Properties → Environment Variables",
          "   - Add C:\\Program Files\\gs\\gs10.xx.x\\bin to PATH",
          "   - Restart Command Prompt and test again",
          "7. Restart your PDF application/server",
        ],
        downloadLinks: {
          ghostscript64:
            "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10031/gs10031w64.exe",
          ghostscript32:
            "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10031/gs10031w32.exe",
          officialSite: "https://www.ghostscript.com/download/gsdnld.html",
        },
      };
    }

    res.json({
      success: true,
      data: diagnosticReport,
      message: diagnosticReport.ghostscript.available
        ? "Ghostscript is properly installed and accessible"
        : "Ghostscript installation issues detected",
    });
  } catch (error) {
    console.error("Error running Ghostscript diagnostics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to run diagnostics",
      error: error.message,
    });
  }
});

// @route   POST /api/diagnostics/ghostscript/test
// @desc    Test Ghostscript with a simple operation
// @access  Public
router.post("/ghostscript/test", async (req, res) => {
  try {
    const diagnosticReport =
      await ghostscriptDiagnostics.checkGhostscriptAvailability();

    if (!diagnosticReport.available) {
      return res.json({
        success: false,
        message: "Ghostscript not available for testing",
        diagnostics: diagnosticReport,
      });
    }

    // Test Ghostscript operation
    const testResult = await ghostscriptDiagnostics.testGhostscriptOperation(
      diagnosticReport.executablePath,
    );

    res.json({
      success: testResult.success,
      message: testResult.message,
      executablePath: diagnosticReport.executablePath,
      version: diagnosticReport.version,
      method: diagnosticReport.method,
    });
  } catch (error) {
    console.error("Error testing Ghostscript:", error);
    res.status(500).json({
      success: false,
      message: "Ghostscript test failed",
      error: error.message,
    });
  }
});

module.exports = router;
