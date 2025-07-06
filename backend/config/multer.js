const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.memoryStorage();

// File filter for image uploads
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// File filter for PDF uploads
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

// File filter for Word document uploads
const wordFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
    "application/vnd.ms-word", // alternative .doc
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only Word documents (.doc, .docx) are allowed"), false);
  }
};

// File filter for Office document uploads (Word, Excel, PowerPoint)
const officeFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Word documents
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
    "application/vnd.ms-word", // alternative .doc
    // Excel spreadsheets
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm
    // PowerPoint presentations
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.ms-powerpoint.presentation.macroEnabled.12", // .pptm
    // OpenDocument formats
    "application/vnd.oasis.opendocument.text", // .odt
    "application/vnd.oasis.opendocument.spreadsheet", // .ods
    "application/vnd.oasis.opendocument.presentation", // .odp
    // RTF
    "text/rtf", // .rtf
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only Office documents (Word, Excel, PowerPoint, OpenDocument, RTF) are allowed",
      ),
      false,
    );
  }
};

// Create upload instances with different configurations
exports.uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
  fileFilter: imageFileFilter,
});

exports.uploadPdf = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for PDFs
  },
  fileFilter: pdfFileFilter,
});

exports.uploadWord = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for Word documents
  },
  fileFilter: wordFileFilter,
});

exports.uploadOffice = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for Office documents
  },
  fileFilter: officeFileFilter,
});

exports.uploadAny = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for any file type
  },
});

// Error handler middleware
exports.handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Please upload a smaller file.",
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || "File upload error",
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Error processing file upload",
    });
  }
  next();
};
