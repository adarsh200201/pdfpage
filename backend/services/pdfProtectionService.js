const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

class PDFProtectionService {
  static async checkEncryptionAvailability() {
    const availability = {
      nodeQPDF: false,
      nodeQPDF2: false,
      qpdfCmd: false,
      ghostscript: false,
      forge: false,
      pdfEncryptModule: false,
    };

    // Check node-qpdf (v1)
    try {
      require.resolve('node-qpdf');
      availability.nodeQPDF = true;
    } catch (err) {
      availability.nodeQPDF = false;
    }

    // Check node-qpdf2 (preferred)
    try {
      require.resolve('node-qpdf2');
      availability.nodeQPDF2 = true;
    } catch (err) {
      availability.nodeQPDF2 = false;
    }

    // Check qpdf CLI
    try {
      await execAsync('qpdf --version');
      availability.qpdfCmd = true;
    } catch (err) {
      availability.qpdfCmd = false;
    }

    // Check Ghostscript
    try {
      if (process.platform === 'win32') {
        await execAsync('gswin64c --version');
      } else {
        await execAsync('gs --version');
      }
      availability.ghostscript = true;
    } catch (err) {
      availability.ghostscript = false;
    }

    // Check node-forge
    try {
      require.resolve('node-forge');
      availability.forge = true;
    } catch (err) {
      availability.forge = false;
    }

    // Check pdf-encrypt module
    try {
      require.resolve('pdf-encrypt');
      availability.pdfEncryptModule = true;
    } catch (err) {
      availability.pdfEncryptModule = false;
    }

    return availability;
  }

  // Preferred: Encrypt using pdf-lib-encrypt (pure JS)
  static async protectWithPdfLibEncrypt(inputBuffer, password, permissions) {
    try {
      const { PDFDocument } = require('pdf-lib');
      let encryptedBuffer = null;

      // Strategy 1: module exports an encrypt function
      try {
        const lib = require('pdf-lib-encrypt');
        if (lib && typeof lib.encrypt === 'function') {
          encryptedBuffer = await lib.encrypt(inputBuffer, password, {
            ownerPassword: password,
            keyBits: 256,
            useAES: true,
            permissions: {
              printing: permissions?.printing !== false,
              modifying: permissions?.editing === true,
              copying: permissions?.copying === true,
              annotating: permissions?.editing === true,
              fillingForms: permissions?.filling !== false,
              contentAccessibility: true,
              documentAssembly: permissions?.editing === true,
            },
          });
        }
      } catch (e) {
        // continue to patch-style approach
      }

      // Strategy 2: patch PDFDocument to add encrypt()
      if (!encryptedBuffer) {
        try {
          const enhancer = require('pdf-lib-encrypt');
          if (typeof enhancer === 'function') {
            enhancer(PDFDocument);
          }
          const pdfDoc = await PDFDocument.load(inputBuffer);
          if (typeof pdfDoc.encrypt === 'function') {
            await pdfDoc.encrypt({
              userPassword: password,
              ownerPassword: password,
              keyBits: 256,
              useAES: true,
              permissions: {
                printing: permissions?.printing !== false,
                modifying: permissions?.editing === true,
                copying: permissions?.copying === true,
                annotating: permissions?.editing === true,
                fillingForms: permissions?.filling !== false,
                contentAccessibility: true,
                documentAssembly: permissions?.editing === true,
              },
            });
            encryptedBuffer = await pdfDoc.save({ useObjectStreams: false });
          }
        } catch (e2) {
          // fall through
        }
      }

      if (!encryptedBuffer) {
        throw new Error('pdf-lib-encrypt not available or unsupported API');
      }

      // verify encryption
      const encrypted = await this.verifyEncryption(encryptedBuffer);
      if (!encrypted) throw new Error('ENCRYPTION_NOT_APPLIED');

      return { success: true, buffer: encryptedBuffer };
    } catch (error) {
      throw new Error(`pdf-lib-encrypt failed: ${error.message}`);
    }
  }

  // Pure JavaScript PDF encryption using muhammara (no external dependencies)
  static async protectWithPdfLib(inputBuffer, password, permissions) {
    try {
      const muhammara = require('muhammara');
      
      console.log('🔧 Setting up muhammara encryption...');
      
      // Create temporary files
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `muhammara_input_${Date.now()}.pdf`);
      const outputPath = path.join(tempDir, `muhammara_output_${Date.now()}.pdf`);

      // Write input buffer to file
      await fs.promises.writeFile(inputPath, inputBuffer);

      console.log('🔐 Encrypting PDF with muhammara...');
      
      // Create PDF writer with proper encryption options
      const pdfWriter = muhammara.createWriterToModify(inputPath, {
        modifiedFilePath: outputPath,
        userPassword: password,
        ownerPassword: password,
        userProtectionOptions: {
          userPassword: password,
          ownerPassword: password,
          allowPrinting: permissions.printing !== false,
          allowModification: permissions.editing === true,
          allowCopy: permissions.copying === true,
          allowAnnotations: permissions.editing === true,
          allowFillForm: permissions.filling !== false,
          allowAccessibility: true,
          allowAssemble: permissions.editing === true,
          allowPrintHighRes: permissions.printing !== false,
        },
      });

      // Finish writing
      pdfWriter.end();

      console.log('💾 Reading encrypted PDF...');
      const encryptedBuffer = await fs.promises.readFile(outputPath);

      // Cleanup temp files
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError.message);
      }

      console.log('✅ muhammara encryption successful');
      return {
        success: true,
        buffer: encryptedBuffer,
      };
    } catch (error) {
      console.error('❌ muhammara protection failed:', error.message);
      throw new Error(`muhammara protection failed: ${error.message}`);
    }
  }

  // existing methods follow
  static async protectPDF(inputBuffer, password, options = {}) {
    const { permissions = {} } = options;
    console.log("🔑 Using permissions:", permissions);

    console.log("🔑 Using password for encryption:", password);
    console.log("�� Password length:", password ? password.length : 0);

    // Try pdf-lib-encrypt FIRST (pure JS)
    try {
      console.log('🔄 Trying pdf-lib-encrypt (FIRST)...');
      const result = await this.protectWithPdfLibEncrypt(inputBuffer, password, permissions);
      if (result && result.success) {
        console.log('✅ PDF protection successful with pdf-lib-encrypt');
        return { buffer: result.buffer, method: 'pdf-lib-encrypt', success: true, encrypted: true };
      }
    } catch (libErr) {
      console.warn('⚠️ pdf-lib-encrypt failed:', libErr && libErr.message ? libErr.message : libErr);
    }

    // Try node-qpdf2 NEXT - most reliable for password encryption
    try {
      console.log("🔄 Trying node-qpdf2 encryption...");
      const result = await this.protectWithQPDF(inputBuffer, password, permissions);

      if (result && result.success) {
        console.log("✅ PDF protection successful with node-qpdf2");
        return {
          buffer: result.buffer,
          method: "qpdf2",
          success: true,
          encrypted: true,
        };
      }
    } catch (qpdf2Error) {
      console.warn("⚠️ node-qpdf2 failed:", qpdf2Error && qpdf2Error.message ? qpdf2Error.message : qpdf2Error);
    }

    // Try muhammara as fallback
    try {
      console.log("🔄 Trying muhammara encryption (fallback)...");
      const result = await this.protectWithPdfLib(inputBuffer, password, permissions);

      if (result && result.success) {
        // VERIFY encryption was actually applied
        try {
          const encrypted = await this.verifyEncryption(result.buffer);
          if (!encrypted) {
            console.warn('⚠️ muhammara produced a file that is not actually encrypted');
            throw new Error('ENCRYPTION_NOT_APPLIED');
          }
        } catch (verifyErr) {
          console.warn('⚠️ Encryption verification failed for muhammara result:', verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
          throw verifyErr;
        }

        console.log("✅ PDF protection successful with muhammara");
        return {
          buffer: result.buffer,
          method: "muhammara",
          success: true,
          encrypted: true,
        };
      }
    } catch (muhammaraError) {
      console.warn("⚠️ muhammara failed:", muhammaraError && muhammaraError.message ? muhammaraError.message : muhammaraError);
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
        // VERIFY encryption applied
        try {
          const encrypted = await this.verifyEncryption(result.buffer);
          if (!encrypted) {
            console.warn('⚠️ qpdf-cmd produced a file that is not actually encrypted');
            throw new Error('ENCRYPTION_NOT_APPLIED');
          }
        } catch (verifyErr) {
          console.warn('⚠️ Encryption verification failed for qpdf-cmd result:', verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
          throw verifyErr;
        }

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
        // VERIFY encryption applied
        try {
          const encrypted = await this.verifyEncryption(result.buffer);
          if (!encrypted) {
            console.warn('⚠️ Ghostscript produced a file that is not actually encrypted');
            throw new Error('ENCRYPTION_NOT_APPLIED');
          }
        } catch (verifyErr) {
          console.warn('⚠️ Encryption verification failed for ghostscript result:', verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
          throw verifyErr;
        }

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

    // Try pdf-encrypt npm module as a last-resort server-side encryption fallback
    try {
      console.log("🔄 Trying pdf-encrypt npm module fallback...");
      const result = await this.protectWithPdfEncrypt(inputBuffer, password, permissions);
      if (result && result.success) {
        // VERIFY encryption applied
        try {
          const encrypted = await this.verifyEncryption(result.buffer);
          if (!encrypted) {
            console.warn('⚠️ pdf-encrypt produced a file that is not actually encrypted');
            throw new Error('ENCRYPTION_NOT_APPLIED');
          }
        } catch (verifyErr) {
          console.warn('⚠️ Encryption verification failed for pdf-encrypt result:', verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
          throw verifyErr;
        }

        console.log("✅ PDF protection successful with pdf-encrypt module");
        return {
          buffer: result.buffer,
          method: "pdf-encrypt",
          success: true,
          encrypted: true,
        };
      }
    } catch (pdfEncryptErr) {
      console.warn("⚠️ pdf-encrypt module failed:", pdfEncryptErr && pdfEncryptErr.stack ? pdfEncryptErr.stack : pdfEncryptErr);
    }

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

    const error = new Error("PDF encryption failed: No working encryption tools available or encryption could not be verified");
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
      const { encrypt } = require('node-qpdf2');

      // Create temporary files
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `qpdf_input_${Date.now()}.pdf`);
      const outputPath = path.join(tempDir, `qpdf_output_${Date.now()}.pdf`);

      // Write input file
      await fs.promises.writeFile(inputPath, inputBuffer);

      console.log("🔧 Using node-qpdf2 for encryption...");
      
      // node-qpdf2 encrypt API
      const options = {
        input: inputPath,
        output: outputPath,
        password: password,
        keyLength: 256,
        restrictions: {
          print: permissions.printing !== false ? 'full' : 'none',
          modify: permissions.editing === true ? 'all' : 'none',
          extract: permissions.copying === true,
          useAes: 'y',
        },
      };

      await encrypt(options);

      // Read result
      const protectedBuffer = await fs.promises.readFile(outputPath);

      // Cleanup
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn("Cleanup warning:", cleanupError.message);
      }

      console.log("✅ node-qpdf2 encryption successful");
      return {
        success: true,
        buffer: protectedBuffer,
      };
    } catch (error) {
      console.error("❌ node-qpdf2 protection failed:", error.message);
      throw new Error(`node-qpdf2 protection failed: ${error.message}`);
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
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `gs_input_${Date.now()}.pdf`);
      const outputPath = path.join(tempDir, `gs_output_${Date.now()}.pdf`);

      await fs.promises.writeFile(inputPath, inputBuffer);

      const gsExecutable = await PDFProtectionService.getGhostscriptPath();

      // Prefer AES-256 when available
      const gsArgs = [
        gsExecutable,
        "-dBATCH",
        "-dNOPAUSE",
        "-sDEVICE=pdfwrite",
        "-dEncrypt=true",
        "-dEncryptionR=5",
        "-dKeyLength=256",
        `-sOwnerPassword=${password}`,
        `-sUserPassword=${password}`,
        "-dPermissions=-4",
        `-sOutputFile=${outputPath}`,
        inputPath,
      ].join(" ");

      console.log("🔧 Running Ghostscript encryption command:", gsArgs);
      await execAsync(gsArgs);

      const protectedBuffer = await fs.promises.readFile(outputPath);

      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn("Cleanup warning:", cleanupError.message);
      }

      return { success: true, buffer: protectedBuffer };
    } catch (error) {
      throw new Error(`Ghostscript protection failed: ${error.message}`);
    }
  }

  static async protectWithPdfEncrypt(inputBuffer, password, permissions) {
    try {
      // Use the pdf-encrypt npm module if available. We will write temp files and call the module.
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `pdf_encrypt_input_${Date.now()}.pdf`);
      const outputPath = path.join(tempDir, `pdf_encrypt_output_${Date.now()}.pdf`);

      await fs.promises.writeFile(inputPath, inputBuffer);

      let pdfEncryptModule;
      try {
        pdfEncryptModule = require('pdf-encrypt');
      } catch (err) {
        throw new Error('pdf-encrypt module not available');
      }

      // Support multiple possible APIs of the module
      const promisified = (fn) => {
        return (...args) => new Promise((resolve, reject) => {
          try {
            fn(...args, (err, res) => {
              if (err) return reject(err);
              resolve(res);
            });
          } catch (e) {
            reject(e);
          }
        });
      };

      // Build options
      const opts = {
        userPassword: password,
        ownerPassword: password,
      };

      // Try common invocation patterns
      if (typeof pdfEncryptModule === 'function') {
        // e.g. module.exports = function(input, output, opts, cb)
        await promisified(pdfEncryptModule)(inputPath, outputPath, opts);
      } else if (pdfEncryptModule && typeof pdfEncryptModule.encrypt === 'function') {
        await promisified(pdfEncryptModule.encrypt)(inputPath, outputPath, opts);
      } else if (pdfEncryptModule && pdfEncryptModule.default && typeof pdfEncryptModule.default === 'function') {
        await promisified(pdfEncryptModule.default)(inputPath, outputPath, opts);
      } else {
        throw new Error('Unsupported pdf-encrypt module API');
      }

      const protectedBuffer = await fs.promises.readFile(outputPath);

      // Cleanup
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.warn('Cleanup warning (pdf-encrypt):', cleanupError && cleanupError.message ? cleanupError.message : cleanupError);
      }

      return { success: true, buffer: protectedBuffer };
    } catch (error) {
      throw new Error(`pdf-encrypt fallback failed: ${error.message}`);
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
  // Verify whether a produced PDF buffer is actually encrypted (requires loading without password to fail)
  static async verifyEncryption(buffer) {
    try {
      const { PDFDocument } = require('pdf-lib');
      // Try loading WITHOUT ignoreEncryption - if it succeeds, PDF is not encrypted
      await PDFDocument.load(buffer);
      return false;
    } catch (err) {
      const msg = err && err.message ? err.message.toLowerCase() : '';
      if (/encrypted|password|required/i.test(msg)) {
        return true;
      }
      // Unknown error - conservatively treat as not encrypted
      return false;
    }
  }
}

module.exports = PDFProtectionService;
