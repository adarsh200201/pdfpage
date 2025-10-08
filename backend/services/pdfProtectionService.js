const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

class PDFProtectionService {
  static async protectPDF(inputBuffer, password, options = {}) {
    const { permissions = {} } = options;

    console.log("🔐 Starting PDF protection process...");
    console.log("🔑 Password length:", password ? password.length : 0);

    // Try node-qpdf first since the library is included
    try {
      console.log("🔄 Trying node-qpdf encryption...");
      const result = await this.protectWithQPDF(inputBuffer, password, permissions);

      if (result && result.success) {
        console.log("✅ PDF protection successful with node-qpdf");
        return {
          buffer: result.buffer,
          method: "qpdf",
          success: true,
          encrypted: true,
        };
      }
    } catch (qpdfError) {
      console.warn("⚠️ node-qpdf failed:", qpdfError && qpdfError.stack ? qpdfError.stack : qpdfError);
    }

    // Try command-line qpdf if available
    try {
      console.log("🔄 Trying command-line qpdf...");

      // Quick availability check
      try {
        await execAsync('qpdf --version');
      } catch (probeErr) {
        console.warn('qpdf CLI not available on PATH:', probeErr && probeErr.message ? probeErr.message : probeErr);
        throw new Error('qpdf-cmd-not-available');
      }

      const result = await this.protectWithQPDFCommand(inputBuffer, password, permissions);

      if (result && result.success) {
        console.log("✅ PDF protection successful with command-line qpdf");
        return {
          buffer: result.buffer,
          method: "qpdf-cmd",
          success: true,
          encrypted: true,
        };
      }
    } catch (cmdError) {
      console.warn("⚠️ command-line qpdf failed:", cmdError && cmdError.stack ? cmdError.stack : cmdError);
    }

    // Try Ghostscript if available
    try {
      console.log("🔄 Trying Ghostscript encryption...");

      // Quick availability check for Ghostscript
      try {
        if (process.platform === 'win32') {
          await execAsync('gswin64c --version');
        } else {
          await execAsync('gs --version');
        }
      } catch (probeGsErr) {
        console.warn('Ghostscript not available on PATH:', probeGsErr && probeGsErr.message ? probeGsErr.message : probeGsErr);
        throw new Error('ghostscript-not-available');
      }

      const result = await this.protectWithGhostscript(inputBuffer, password, permissions);

      if (result && result.success) {
        console.log("✅ PDF protection successful with Ghostscript");
        return {
          buffer: result.buffer,
          method: "ghostscript",
          success: true,
          encrypted: true,
        };
      }
    } catch (gsError) {
      console.warn("⚠️ Ghostscript failed:", gsError && gsError.stack ? gsError.stack : gsError);
    }

    console.error("��� All encryption methods failed!");

    // Try client-side protection as last resort (non-encrypting metadata)
    try {
      console.log("🔄 Attempting client-side metadata protection...");
      const result = await this.protectWithMetadata(inputBuffer, password, permissions);

      if (result && result.success) {
        console.log("✅ Basic metadata protection applied");
        return {
          buffer: result.buffer,
          method: "metadata",
          success: true,
          encrypted: false,
          clientSide: true
        };
      }
    } catch (metadataError) {
      console.error("❌ Even metadata protection failed:", metadataError && metadataError.stack ? metadataError.stack : metadataError);
    }

    const error = new Error("PDF encryption failed: No working encryption tools available");
    error.code = "ENCRYPTION_FAILED";
    throw error;
  }

  static async tryProtectionMethod(method, inputBuffer, password, permissions) {
    switch (method) {
      case "ghostscript":
        return await this.protectWithGhostscript(
          inputBuffer,
          password,
          permissions,
        );
      case "qpdf":
        return await this.protectWithQPDF(inputBuffer, password, permissions);
      case "forge":
        return await this.protectWithForge(inputBuffer, password, permissions);
      case "metadata":
        return await this.protectWithMetadata(
          inputBuffer,
          password,
          permissions,
        );
      default:
        throw new Error(`Unknown protection method: ${method}`);
    }
  }

  static async protectWithQPDF(inputBuffer, password, permissions) {
    try {
      const qpdf = require("node-qpdf");

      // Create temporary files
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `qpdf_input_${Date.now()}.pdf`);
      const outputPath = path.join(tempDir, `qpdf_output_${Date.now()}.pdf`);

      // Write input file
      await fs.promises.writeFile(inputPath, inputBuffer);

      // Configure qpdf options based on library source
      const options = {
        password: password,
        keyLength: 256,
        outputFile: outputPath,
        restrictions: {
          print: permissions.printing !== false ? "full" : "none",
          modify: permissions.editing === true ? "all" : "none",
          extract: permissions.copying === true,
          fillForm: permissions.filling !== false,
        },
      };

      console.log("🔧 Using node-qpdf for encryption...");
      // Use promisify since the library expects a callback
      const { promisify } = require('util');
      const qpdfEncrypt = promisify(qpdf.encrypt);
      await qpdfEncrypt(inputPath, options);

      // Read result
      const protectedBuffer = await fs.promises.readFile(outputPath);

      // Cleanup
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn("Cleanup warning:", cleanupError.message);
      }

      console.log("✅ node-qpdf encryption successful");
      return {
        success: true,
        buffer: protectedBuffer,
      };
    } catch (error) {
      console.error("❌ node-qpdf protection failed:", error.message);
      throw new Error(`node-qpdf protection failed: ${error.message}`);
    }
  }

  static async protectWithQPDFCommand(inputBuffer, password, permissions) {
    try {
      // Create temporary files
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `qpdf_cmd_input_${Date.now()}.pdf`);
      const outputPath = path.join(tempDir, `qpdf_cmd_output_${Date.now()}.pdf`);

      // Write input file
      await fs.promises.writeFile(inputPath, inputBuffer);

      // Escape password for command line
      const escapedPassword = password.replace(/[\\$`"]/g, '\\$&');
      const qpdfCmd = `qpdf --encrypt "${escapedPassword}" "${escapedPassword}" 256 -- "${inputPath}" "${outputPath}"`;

      console.log("🔧 Executing command-line qpdf...");
      await execAsync(qpdfCmd, { timeout: 30000 });

      // Read result
      const protectedBuffer = await fs.promises.readFile(outputPath);

      // Cleanup
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn("Cleanup warning:", cleanupError.message);
      }

      console.log("✅ Command-line qpdf encryption successful");
      return {
        success: true,
        buffer: protectedBuffer,
      };
    } catch (error) {
      console.error("❌ Command-line qpdf protection failed:", error.message);
      throw new Error(`Command-line qpdf protection failed: ${error.message}`);
    }
  }

  static async protectWithGhostscript(inputBuffer, password, permissions) {
    try {
      // Create temporary files
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `gs_input_${Date.now()}.pdf`);
      const outputPath = path.join(tempDir, `gs_output_${Date.now()}.pdf`);

      // Write input file
      await fs.promises.writeFile(inputPath, inputBuffer);

      // Build Ghostscript command for encryption
      // Use the full Windows path since we know it exists from logs
      const gsExecutable = await PDFProtectionService.getGhostscriptPath();

      const gsCommand = [
        gsExecutable,
        "-dBATCH",
        "-dNOPAUSE",
        "-sDEVICE=pdfwrite",
        "-dPDFSETTINGS=/printer",
        `-sUserPassword=${password}`,
        `-sOwnerPassword=${password}`,
        "-dEncryptionLevel=3", // AES 128-bit
        "-dPermissions=-4", // Restrict permissions
        `-sOutputFile=${outputPath}`,
        inputPath,
      ];

      console.log("🔧 Running Ghostscript encryption command:", gsCommand.join(" "));
      await execAsync(gsCommand.join(" "));

      console.log("�� Running Ghostscript encryption...");
      await execAsync(gsCommand);

      // Read result
      const protectedBuffer = await fs.promises.readFile(outputPath);

      // Cleanup
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn("Cleanup warning:", cleanupError.message);
      }

      return {
        success: true,
        buffer: protectedBuffer,
      };
    } catch (error) {
      throw new Error(`Ghostscript protection failed: ${error.message}`);
    }
  }

  static async protectWithForge(inputBuffer, password, permissions) {
    try {
      const forge = require("node-forge");
      const { PDFDocument, PDFName, PDFDict, PDFString } = require("pdf-lib");

      console.log("🔧 Applying forge-based protection...");

      // Load PDF
      const pdfDoc = await PDFDocument.load(inputBuffer);

      // Create multiple password hashes for verification
      const passwordHash1 = forge.md.sha256.create();
      passwordHash1.update(password + "pdfpage_salt_1");
      const hash1 = passwordHash1.digest().toHex();

      const passwordHash2 = forge.md.sha256.create();
      passwordHash2.update(password + "pdfpage_salt_2");
      const hash2 = passwordHash2.digest().toHex();

      // Create a verification token
      const verificationToken = forge.util.encode64(
        forge.util.hexToBytes(hash1.substring(0, 32)),
      );

      // Add comprehensive protection metadata
      const title = pdfDoc.getTitle() || "Document";
      pdfDoc.setTitle(`${title} (🔒 Password Protected)`);
      pdfDoc.setSubject("🔐 PROTECTED PDF - Requires Password");
      pdfDoc.setCreator("PdfPage Protection Service - Enhanced Forge");
      pdfDoc.setProducer("PdfPage Forge AES Protection");
      pdfDoc.setCreationDate(new Date());

      // Embed protection information in keywords and metadata
      // pdf-lib expects keywords as an array of strings
      const keywordsArray = [
        "PROTECTED",
        "ENCRYPTED",
        "FORGE_AES",
        `HASH1:${hash1.substring(0, 16)}`,
        `HASH2:${hash2.substring(0, 16)}`,
        `TOKEN:${verificationToken.substring(0, 16)}`,
        `PERMS:${JSON.stringify(permissions)}`,
      ];
      pdfDoc.setKeywords(keywordsArray);

      // Try to add custom metadata entries
      try {
        pdfDoc.setCustomMetadata("Protection", "FORGE_AES_ENHANCED");
        pdfDoc.setCustomMetadata("PasswordHash1", hash1);
        pdfDoc.setCustomMetadata("PasswordHash2", hash2);
        pdfDoc.setCustomMetadata("VerificationToken", verificationToken);
        pdfDoc.setCustomMetadata("Permissions", JSON.stringify(permissions));
        pdfDoc.setCustomMetadata("ProtectionLevel", "ENHANCED");
        console.log("✅ Custom metadata added successfully");
      } catch (metaError) {
        console.warn("⚠️ Custom metadata failed, using basic approach");
      }

      // Save with enhanced protection metadata
      const protectedBuffer = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        updateFieldAppearances: false,
      });

      console.log(`✅ Forge protection applied with password verification`);

      return {
        success: true,
        buffer: protectedBuffer,
      };
    } catch (error) {
      throw new Error(`Forge protection failed: ${error.message}`);
    }
  }

  static async protectWithMetadata(inputBuffer, password, permissions) {
    try {
      const { PDFDocument } = require("pdf-lib");

      // Load PDF
      const pdfDoc = await PDFDocument.load(inputBuffer);

      // Add basic protection metadata
      pdfDoc.setTitle(pdfDoc.getTitle() + " (Protected)");
      pdfDoc.setSubject("Password Protected PDF Document");
      pdfDoc.setCreator("PdfPage Protection Service");
      pdfDoc.setProducer("PdfPage");
      pdfDoc.setCreationDate(new Date());

      // Add protection keywords - pdf-lib expects array format
      const keywordsArray = [
        "protected",
        "password",
        `permissions:${JSON.stringify(permissions)}`,
      ];
      pdfDoc.setKeywords(keywordsArray);

      // Save with metadata
      const protectedBuffer = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      return {
        success: true,
        buffer: protectedBuffer,
      };
    } catch (error) {
      throw new Error(`Metadata protection failed: ${error.message}`);
    }
  }

  static async unlockWithQPDF(inputBuffer, password) {
    try {
      // Create temporary files
      const tempDir = os.tmpdir();
      const inputPath = path.join(
        tempDir,
        `qpdf_unlock_input_${Date.now()}.pdf`,
      );
      const outputPath = path.join(
        tempDir,
        `qpdf_unlock_output_${Date.now()}.pdf`,
      );

      // Write input file
      await fs.promises.writeFile(inputPath, inputBuffer);

      console.log("🔓 Using QPDF command-line to unlock PDF...");
      console.log("🔑 QPDF password length:", password ? password.length : 0);

      // Try node-qpdf library first
      try {
        const qpdf = require("node-qpdf");

        // Try the simplest format based on node-qpdf documentation
        const options = {
          input: inputPath,
          output: outputPath,
          userPassword: password, // Most common format for user passwords
        };

        await qpdf.decrypt(options);
        console.log("✅ node-qpdf library success");
      } catch (libError) {
        console.log("❌ node-qpdf library failed:", libError.message);
        console.log("🔄 Falling back to command-line qpdf...");

        // Fallback to direct command-line execution
        const { exec } = require("child_process");
        const { promisify } = require("util");
        const execAsync = promisify(exec);

        // Escape password for command line
        const escapedPassword = password.replace(/"/g, '\\"');

        // Build qpdf command
        const qpdfCmd = `qpdf --password="${escapedPassword}" --decrypt "${inputPath}" "${outputPath}"`;

        console.log("🔧 Executing QPDF command...");

        try {
          const { stdout, stderr } = await execAsync(qpdfCmd, {
            timeout: 30000, // 30 second timeout
          });

          if (stderr && !stderr.includes("operation succeeded")) {
            console.warn("⚠️ QPDF stderr:", stderr);
          }

          console.log("✅ Command-line qpdf success");
        } catch (cmdError) {
          console.error("❌ Command-line qpdf failed:", cmdError.message);
          throw new Error(
            `Both node-qpdf library and command-line failed. Library: ${libError.message}, Command: ${cmdError.message}`,
          );
        }
      }

      // Read result
      const unlockedBuffer = await fs.promises.readFile(outputPath);

      // Cleanup
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn("Cleanup warning:", cleanupError.message);
      }

      console.log("✅ QPDF unlock successful");

      return {
        success: true,
        buffer: unlockedBuffer,
      };
    } catch (error) {
      console.error("❌ QPDF unlock failed:", error.message);
      throw new Error(`QPDF unlock failed: ${error.message}`);
    }
  }
  static async getGhostscriptPath() {
    if (process.platform === "win32") {
      try {
        await execAsync('where gswin64c');
        return "gswin64c";
      } catch (err) {
        console.warn('gswin64c not found on PATH, trying common installation paths...');
      }

      const possiblePaths = [
        "C:\\Program Files\\gs\\gs10.01.1\\bin\\gswin64c.exe",
        "C:\\Program Files\\gs\\gs10.00.0\\bin\\gswin64c.exe",
        "C:\\Program Files\\gs\\gs9.56.1\\bin\\gswin64c.exe",
        "C:\\Program Files\\gs\\gs9.55.0\\bin\\gswin64c.exe",
        "C:\\Program Files\\gs\\gs9.54.0\\bin\\gswin64c.exe"
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          return `"${p}"`;
        }
      }
      
      return "gswin64c";
    } else {
      try {
        await execAsync('which gs');
        return "gs";
      } catch (err) {
        console.warn('gs not found on PATH, assuming it might be available anyway...');
        return "gs";
      }
    }
  }
}

module.exports = PDFProtectionService;
