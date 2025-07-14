const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { spawn } = require("child_process");
const logger = require("../utils/logger");

const router = express.Router();

// LibreOffice conversion tools configuration with strict validation
const LIBREOFFICE_TOOLS = {
  "text-to-pdf": {
    name: "Text → PDF",
    acceptedTypes: [".txt", ".csv"],
    outputType: ".pdf",
    rejectedTypes: [".docx", ".odt", ".doc", ".rtf"],
    libreofficeFormat: "pdf",
  },
  "odt-to-pdf": {
    name: "ODT → PDF",
    acceptedTypes: [".odt"],
    outputType: ".pdf",
    rejectedTypes: [".docx", ".txt", ".pdf", ".doc", ".rtf"],
    libreofficeFormat: "pdf",
  },
  "rtf-to-pdf": {
    name: "RTF → PDF",
    acceptedTypes: [".rtf"],
    outputType: ".pdf",
    rejectedTypes: [".txt", ".doc", ".docx", ".odt"],
    libreofficeFormat: "pdf",
  },
  "csv-to-xlsx": {
    name: "CSV → XLSX",
    acceptedTypes: [".csv"],
    outputType: ".xlsx",
    rejectedTypes: [".xls", ".ods", ".txt"],
    libreofficeFormat: "xlsx",
  },
  "odt-to-docx": {
    name: "ODT → DOCX",
    acceptedTypes: [".odt"],
    outputType: ".docx",
    rejectedTypes: [".doc", ".rtf", ".txt", ".pdf"],
    libreofficeFormat: "docx",
  },
  "rtf-to-docx": {
    name: "RTF → DOCX",
    acceptedTypes: [".rtf"],
    outputType: ".docx",
    rejectedTypes: [".txt", ".odt", ".doc", ".pdf"],
    libreofficeFormat: "docx",
  },
  "docx-to-odt": {
    name: "DOCX → ODT",
    acceptedTypes: [".docx"],
    outputType: ".odt",
    rejectedTypes: [".doc", ".rtf", ".pdf", ".txt"],
    libreofficeFormat: "odt",
  },
  "xls-to-csv": {
    name: "XLS → CSV",
    acceptedTypes: [".xls"],
    outputType: ".csv",
    rejectedTypes: [".xlsx", ".ods", ".txt"],
    libreofficeFormat: "csv",
  },
  "xlsx-to-ods": {
    name: "XLSX → ODS",
    acceptedTypes: [".xlsx"],
    outputType: ".ods",
    rejectedTypes: [".xls", ".csv", ".txt"],
    libreofficeFormat: "ods",
  },
  "pptx-to-odp": {
    name: "PPTX → ODP",
    acceptedTypes: [".pptx"],
    outputType: ".odp",
    rejectedTypes: [".ppt", ".pdf", ".txt"],
    libreofficeFormat: "odp",
  },
  "pptx-to-png": {
    name: "PPTX → PNG",
    acceptedTypes: [".pptx"],
    outputType: ".png",
    rejectedTypes: [".odp", ".ppt", ".pdf", ".jpg", ".jpeg"],
    libreofficeFormat: "png",
  },
  "doc-to-odt": {
    name: "DOC → ODT",
    acceptedTypes: [".doc"],
    outputType: ".odt",
    rejectedTypes: [".docx", ".txt", ".pdf", ".rtf"],
    libreofficeFormat: "odt",
  },
};

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/libreoffice-temp/",
  fileFilter: (req, file, cb) => {
    const toolId = req.body.toolId || req.query.toolId;
    const tool = LIBREOFFICE_TOOLS[toolId];

    if (!tool) {
      return cb(new Error("Invalid conversion tool selected"), false);
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!tool.acceptedTypes.includes(fileExtension)) {
      const error = new Error(
        `❌ Unsupported file format. This tool only accepts ${tool.acceptedTypes.join(", ")}. Please upload the correct file.`,
      );
      error.code = "INVALID_FILE_TYPE";
      return cb(error, false);
    }

    cb(null, true);
  },
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
});

// Strict file validation function
const validateFileType = (fileName, toolId) => {
  const tool = LIBREOFFICE_TOOLS[toolId];
  if (!tool) {
    return {
      isValid: false,
      error: "Invalid tool selected",
    };
  }

  const fileExtension = path.extname(fileName).toLowerCase();

  if (!tool.acceptedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: `❌ Unsupported file format. This tool only accepts ${tool.acceptedTypes.join(", ")}. Please upload the correct file.`,
    };
  }

  return { isValid: true };
};

// LibreOffice conversion function
const convertWithLibreOffice = async (inputPath, outputDir, format) => {
  return new Promise((resolve, reject) => {
    const args = [
      "--headless",
      "--convert-to",
      format,
      "--outdir",
      outputDir,
      inputPath,
    ];

    logger.info("Starting LibreOffice conversion", {
      inputPath,
      outputDir,
      format,
      args,
    });

    const libreoffice = spawn("libreoffice", args);

    let stdout = "";
    let stderr = "";

    libreoffice.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    libreoffice.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    libreoffice.on("close", (code) => {
      if (code === 0) {
        logger.info("LibreOffice conversion successful", {
          stdout,
          stderr: stderr || "No errors",
        });
        resolve({ success: true, stdout, stderr });
      } else {
        logger.error("LibreOffice conversion failed", {
          code,
          stdout,
          stderr,
        });
        reject(
          new Error(
            `LibreOffice conversion failed with code ${code}: ${stderr}`,
          ),
        );
      }
    });

    libreoffice.on("error", (error) => {
      logger.error("LibreOffice spawn error", { error: error.message });
      reject(new Error(`Failed to start LibreOffice: ${error.message}`));
    });
  });
};

// @route   POST /api/libreoffice-strict/convert
// @desc    Convert files using LibreOffice with strict validation
// @access  Public
router.post("/convert", upload.single("file"), async (req, res) => {
  const startTime = Date.now();

  try {
    const { toolId } = req.body;
    const file = req.file;

    logger.info("LibreOffice conversion request", {
      toolId,
      fileName: file?.originalname,
      fileSize: file?.size,
    });

    // Validate tool ID
    const tool = LIBREOFFICE_TOOLS[toolId];
    if (!tool) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversion tool selected",
      });
    }

    // Validate file
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    // Double-check file type validation
    const validation = validateFileType(file.originalname, toolId);
    if (!validation.isValid) {
      // Clean up uploaded file
      await fs.unlink(file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Create output directory
    const outputDir = path.join(file.destination, "output");
    await fs.mkdir(outputDir, { recursive: true });

    try {
      // Convert with LibreOffice
      await convertWithLibreOffice(
        file.path,
        outputDir,
        tool.libreofficeFormat,
      );

      // Find the converted file
      const outputFiles = await fs.readdir(outputDir);
      const baseName = path.basename(
        file.originalname,
        path.extname(file.originalname),
      );

      let outputFile;
      if (tool.outputType === ".png") {
        // For PPTX to PNG, multiple files might be created
        outputFile = outputFiles.find(
          (f) => f.startsWith(baseName) && f.endsWith(".png"),
        );
      } else {
        outputFile = outputFiles.find(
          (f) => f.startsWith(baseName) && f.endsWith(tool.libreofficeFormat),
        );
      }

      if (!outputFile) {
        throw new Error("Converted file not found");
      }

      const outputPath = path.join(outputDir, outputFile);
      const stats = await fs.stat(outputPath);

      // Send the converted file
      const finalFileName = `${baseName}${tool.outputType}`;

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${finalFileName}"`,
      );
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("X-Conversion-Tool", tool.name);
      res.setHeader("X-Processing-Time", `${Date.now() - startTime}ms`);
      res.setHeader("X-Output-Size", stats.size);

      const fileStream = require("fs").createReadStream(outputPath);
      fileStream.pipe(res);

      fileStream.on("end", async () => {
        // Clean up temporary files
        try {
          await fs.unlink(file.path);
          await fs.unlink(outputPath);
          // Try to remove the output directory if empty
          await fs.rmdir(outputDir).catch(() => {});
        } catch (cleanupError) {
          logger.warn("Cleanup error", { error: cleanupError.message });
        }

        logger.info("LibreOffice conversion completed", {
          toolId,
          fileName: file.originalname,
          outputSize: stats.size,
          processingTime: Date.now() - startTime,
        });
      });
    } catch (conversionError) {
      logger.error("LibreOffice conversion error", {
        error: conversionError.message,
        toolId,
        fileName: file.originalname,
      });

      // Clean up files
      await fs.unlink(file.path).catch(() => {});

      return res.status(500).json({
        success: false,
        error:
          "Conversion failed using LibreOffice. Please check file format and try again.",
        details:
          process.env.NODE_ENV === "development"
            ? conversionError.message
            : undefined,
      });
    }
  } catch (error) {
    logger.error("LibreOffice route error", {
      error: error.message,
      stack: error.stack,
    });

    // Clean up uploaded file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    if (error.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error during file conversion",
    });
  }
});

// @route   GET /api/libreoffice-strict/tools
// @desc    Get available LibreOffice conversion tools
// @access  Public
router.get("/tools", (req, res) => {
  const tools = Object.keys(LIBREOFFICE_TOOLS).map((id) => ({
    id,
    ...LIBREOFFICE_TOOLS[id],
  }));

  res.json({
    success: true,
    tools,
    totalTools: tools.length,
    categories: {
      document: tools.filter((t) =>
        [
          "text-to-pdf",
          "odt-to-pdf",
          "rtf-to-pdf",
          "odt-to-docx",
          "rtf-to-docx",
          "docx-to-odt",
          "doc-to-odt",
        ].includes(t.id),
      ),
      spreadsheet: tools.filter((t) =>
        ["csv-to-xlsx", "xls-to-csv", "xlsx-to-ods"].includes(t.id),
      ),
      presentation: tools.filter((t) =>
        ["pptx-to-odp", "pptx-to-png"].includes(t.id),
      ),
    },
  });
});

// @route   POST /api/libreoffice-strict/validate
// @desc    Validate file type for a specific tool
// @access  Public
router.post("/validate", (req, res) => {
  const { fileName, toolId } = req.body;

  if (!fileName || !toolId) {
    return res.status(400).json({
      success: false,
      error: "fileName and toolId are required",
    });
  }

  const validation = validateFileType(fileName, toolId);

  res.json({
    success: true,
    validation,
  });
});

module.exports = router;
