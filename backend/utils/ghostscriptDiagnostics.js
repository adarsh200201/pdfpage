const { exec } = require("child_process");
const os = require("os");
const fs = require("fs").promises;
const path = require("path");

/**
 * Ghostscript Diagnostic Utility
 * Provides comprehensive Ghostscript installation checking and troubleshooting
 */
class GhostscriptDiagnostics {
  constructor() {
    this.isWindows = os.platform() === "win32";
    this.commonWindowsPaths = [
      "C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe",
      "C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe",
      "C:\\Program Files\\gs\\gs10.01.1\\bin\\gswin64c.exe",
      "C:\\Program Files (x86)\\gs\\gs10.03.1\\bin\\gswin32c.exe",
      "C:\\Program Files (x86)\\gs\\gs10.02.1\\bin\\gswin32c.exe",
      "C:\\Program Files (x86)\\gs\\gs10.01.1\\bin\\gswin32c.exe",
      "C:\\gs\\gs10.03.1\\bin\\gswin64c.exe",
      "C:\\gs\\gs10.02.1\\bin\\gswin64c.exe",
    ];
  }

  /**
   * Comprehensive Ghostscript availability check
   */
  async checkGhostscriptAvailability() {
    const result = {
      available: false,
      executablePath: null,
      version: null,
      method: null,
      issues: [],
      recommendations: [],
    };

    // Method 1: Check PATH
    const pathResult = await this.checkInPath();
    if (pathResult.found) {
      result.available = true;
      result.executablePath = pathResult.executable;
      result.version = pathResult.version;
      result.method = "PATH";
      return result;
    } else {
      result.issues.push(...pathResult.issues);
    }

    // Method 2: Check common installation paths (Windows)
    if (this.isWindows) {
      const commonPathResult = await this.checkCommonPaths();
      if (commonPathResult.found) {
        result.available = true;
        result.executablePath = commonPathResult.executable;
        result.version = commonPathResult.version;
        result.method = "Common Path";
        result.recommendations.push(
          "Add Ghostscript to PATH for better performance",
        );
        return result;
      } else {
        result.issues.push(...commonPathResult.issues);
      }
    }

    // Method 3: Registry check (Windows)
    if (this.isWindows) {
      const registryResult = await this.checkWindowsRegistry();
      if (registryResult.found) {
        result.available = true;
        result.executablePath = registryResult.executable;
        result.version = registryResult.version;
        result.method = "Registry";
        result.recommendations.push(
          "Add Ghostscript to PATH for better performance",
        );
        return result;
      } else {
        result.issues.push(...registryResult.issues);
      }
    }

    // If not found, provide installation recommendations
    result.recommendations = this.getInstallationRecommendations();

    return result;
  }

  /**
   * Check if Ghostscript is available in PATH
   */
  async checkInPath() {
    const commands = this.isWindows
      ? ["gswin64c", "gswin32c", "gs"]
      : ["gs", "ghostscript"];

    const result = {
      found: false,
      executable: null,
      version: null,
      issues: [],
    };

    for (const cmd of commands) {
      try {
        const versionOutput = await this.execCommand(`${cmd} --version`);
        const whichOutput = this.isWindows
          ? await this.execCommand(`where ${cmd}`)
          : await this.execCommand(`which ${cmd}`);

        result.found = true;
        result.executable = whichOutput.trim().split("\n")[0];
        result.version = versionOutput.trim();
        return result;
      } catch (error) {
        result.issues.push(`${cmd} not found in PATH: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Check common Windows installation paths
   */
  async checkCommonPaths() {
    const result = {
      found: false,
      executable: null,
      version: null,
      issues: [],
    };

    if (!this.isWindows) {
      return result;
    }

    for (const gsPath of this.commonWindowsPaths) {
      try {
        await fs.access(gsPath);
        const version = await this.execCommand(`"${gsPath}" --version`);

        result.found = true;
        result.executable = gsPath;
        result.version = version.trim();
        return result;
      } catch (error) {
        result.issues.push(`${gsPath} not accessible: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Check Windows registry for Ghostscript installation
   */
  async checkWindowsRegistry() {
    const result = {
      found: false,
      executable: null,
      version: null,
      issues: [],
    };

    if (!this.isWindows) {
      return result;
    }

    try {
      // Check common registry paths
      const registryPaths = [
        "HKEY_LOCAL_MACHINE\\SOFTWARE\\GPL Ghostscript",
        "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\GPL Ghostscript",
        "HKEY_LOCAL_MACHINE\\SOFTWARE\\AFPL Ghostscript",
        "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\AFPL Ghostscript",
      ];

      for (const regPath of registryPaths) {
        try {
          const regOutput = await this.execCommand(`reg query "${regPath}"`);
          // Parse registry output to find installation path
          // This is a simplified approach - in production, you might want more robust parsing
          const lines = regOutput.split("\n");
          for (const line of lines) {
            if (line.includes("GS_DLL") || line.includes("GS_LIB")) {
              // Extract path information
              const pathMatch = line.match(/([A-Z]:\\[^\\r\\n]+)/);
              if (pathMatch) {
                const installPath = pathMatch[1];
                const binPath = path.join(installPath, "bin");

                // Look for executables in bin directory
                const executables = ["gswin64c.exe", "gswin32c.exe", "gs.exe"];
                for (const exe of executables) {
                  const fullPath = path.join(binPath, exe);
                  try {
                    await fs.access(fullPath);
                    const version = await this.execCommand(
                      `"${fullPath}" --version`,
                    );

                    result.found = true;
                    result.executable = fullPath;
                    result.version = version.trim();
                    return result;
                  } catch (exeError) {
                    continue;
                  }
                }
              }
            }
          }
        } catch (regError) {
          result.issues.push(
            `Registry path ${regPath} not found: ${regError.message}`,
          );
        }
      }
    } catch (error) {
      result.issues.push(`Registry check failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Execute command with promise wrapper
   */
  execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${error.message}`));
        } else {
          resolve(stdout || stderr);
        }
      });
    });
  }

  /**
   * Get installation recommendations based on platform
   */
  getInstallationRecommendations() {
    if (this.isWindows) {
      return [
        "💡 Download Ghostscript from: https://www.ghostscript.com/download/gsdnld.html",
        '📝 Choose "GPL Ghostscript" (free version)',
        '⚙️ During installation, check "Add to PATH" option',
        "🔄 After installation, restart the Node.js application",
        "📂 Common installation paths to check manually:",
        ...this.commonWindowsPaths.map((p) => `   - ${p}`),
        "🛠️ If already installed, add Ghostscript bin folder to Windows PATH",
        "🔍 Verify installation by opening Command Prompt and typing: gswin64c --version",
      ];
    } else {
      return [
        "🐧 Ubuntu/Debian: sudo apt-get install ghostscript",
        "🍎 macOS: brew install ghostscript",
        "🔴 CentOS/RHEL: sudo yum install ghostscript",
        "🔄 After installation, restart the Node.js application",
        "🔍 Verify installation by typing: gs --version",
      ];
    }
  }

  /**
   * Generate diagnostic report
   */
  async generateDiagnosticReport() {
    const report = {
      timestamp: new Date().toISOString(),
      platform: {
        os: os.platform(),
        arch: os.arch(),
        version: os.version ? os.version() : "Unknown",
      },
      ghostscript: await this.checkGhostscriptAvailability(),
      nodejs: {
        version: process.version,
        execPath: process.execPath,
      },
    };

    // Add troubleshooting steps
    if (!report.ghostscript.available) {
      report.troubleshooting = {
        steps: [
          "1. Check if Ghostscript is installed",
          "2. Verify Ghostscript is in PATH",
          "3. Try installing/reinstalling Ghostscript",
          "4. Restart the application after installation",
          "5. Check file permissions and antivirus software",
        ],
        commonIssues: [
          "Ghostscript not installed",
          "Ghostscript not in PATH environment variable",
          "Wrong architecture (32-bit vs 64-bit)",
          "Antivirus blocking execution",
          "Insufficient file permissions",
        ],
      };
    }

    return report;
  }

  /**
   * Test Ghostscript with a simple PDF operation
   */
  async testGhostscriptOperation(gsPath) {
    if (!gsPath) {
      throw new Error("No Ghostscript executable path provided");
    }

    try {
      // Test basic PDF info extraction
      const testCommand = `"${gsPath}" -dNOPAUSE -dBATCH -sDEVICE=nullpage -q`;
      await this.execCommand(testCommand);

      return {
        success: true,
        message: "Ghostscript basic test passed",
      };
    } catch (error) {
      return {
        success: false,
        message: `Ghostscript test failed: ${error.message}`,
      };
    }
  }
}

module.exports = new GhostscriptDiagnostics();
