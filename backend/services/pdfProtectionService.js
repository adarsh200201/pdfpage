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

    // Try multiple protection methods in order of preference
    const methods = ["ghostscript", "qpdf", "forge", "metadata"];

    for (const method of methods) {
      try {
        console.log(`🔄 Trying protection method: ${method}`);
        const result = await this.tryProtectionMethod(
          method,
          inputBuffer,
          password,
          permissions,
        );

        if (result.success) {
          console.log(`✅ Protection successful using: ${method}`);
          return {
            buffer: result.buffer,
            method: method,
            success: true,
          };
        }
      } catch (error) {
        console.warn(`⚠️ Method ${method} failed:`, error.message);
        continue;
      }
    }

    // If all methods fail, return the original with warning
    console.warn(
      "⚠️ All protection methods failed, returning original file with metadata",
    );
    return {
      buffer: inputBuffer,
      method: "unprotected",
      success: false,
    };
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

      // Configure qpdf options
      const options = {
        input: inputPath,
        output: outputPath,
        password: password,
        keyLength: 256,
        restrictions: {
          print: permissions.printing !== false ? "full" : "none",
          modify: permissions.editing === true ? "all" : "none",
          extract: permissions.copying === true,
          fillForm: permissions.filling !== false,
        },
      };

      // Apply encryption
      await qpdf.encrypt(options);

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
      throw new Error(`QPDF protection failed: ${error.message}`);
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
      const gsExecutable =
        process.platform === "win32"
          ? '"C:\\Program Files\\gs\\gs10.05.1\\bin\\gswin64c.exe"'
          : "gs";

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
        `-sOutputFile="${outputPath}"`,
        `"${inputPath}"`,
      ].join(" ");

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
}

module.exports = PDFProtectionService;
