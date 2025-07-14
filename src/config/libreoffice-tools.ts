// LibreOffice-Only Conversion Tools Configuration
// Strict file type validation with no fallback libraries

export interface LibreOfficeToolConfig {
  id: string;
  name: string;
  description: string;
  acceptedTypes: string[];
  outputType: string;
  rejectedTypes: string[];
  icon: string;
  category: "document" | "spreadsheet" | "presentation";
}

export const LIBREOFFICE_TOOLS: LibreOfficeToolConfig[] = [
  // Text to PDF
  {
    id: "text-to-pdf",
    name: "Text → PDF",
    description: "Convert text files to PDF using LibreOffice",
    acceptedTypes: [".txt", ".csv"],
    outputType: ".pdf",
    rejectedTypes: [".docx", ".odt", ".doc", ".rtf"],
    icon: "FileText",
    category: "document",
  },

  // ODT to PDF
  {
    id: "odt-to-pdf",
    name: "ODT → PDF",
    description: "Convert OpenDocument Text to PDF",
    acceptedTypes: [".odt"],
    outputType: ".pdf",
    rejectedTypes: [".docx", ".txt", ".pdf", ".doc", ".rtf"],
    icon: "FileText",
    category: "document",
  },

  // RTF to PDF
  {
    id: "rtf-to-pdf",
    name: "RTF → PDF",
    description: "Convert Rich Text Format to PDF",
    acceptedTypes: [".rtf"],
    outputType: ".pdf",
    rejectedTypes: [".txt", ".doc", ".docx", ".odt"],
    icon: "FileText",
    category: "document",
  },

  // CSV to XLSX
  {
    id: "csv-to-xlsx",
    name: "CSV → XLSX",
    description: "Convert CSV to Excel format",
    acceptedTypes: [".csv"],
    outputType: ".xlsx",
    rejectedTypes: [".xls", ".ods", ".txt"],
    icon: "FileSpreadsheet",
    category: "spreadsheet",
  },

  // ODT to DOCX
  {
    id: "odt-to-docx",
    name: "ODT → DOCX",
    description: "Convert OpenDocument Text to Word format",
    acceptedTypes: [".odt"],
    outputType: ".docx",
    rejectedTypes: [".doc", ".rtf", ".txt", ".pdf"],
    icon: "FileText",
    category: "document",
  },

  // RTF to DOCX
  {
    id: "rtf-to-docx",
    name: "RTF → DOCX",
    description: "Convert Rich Text Format to Word format",
    acceptedTypes: [".rtf"],
    outputType: ".docx",
    rejectedTypes: [".txt", ".odt", ".doc", ".pdf"],
    icon: "FileText",
    category: "document",
  },

  // DOCX to ODT
  {
    id: "docx-to-odt",
    name: "DOCX → ODT",
    description: "Convert Word format to OpenDocument Text",
    acceptedTypes: [".docx"],
    outputType: ".odt",
    rejectedTypes: [".doc", ".rtf", ".pdf", ".txt"],
    icon: "FileText",
    category: "document",
  },

  // XLS to CSV
  {
    id: "xls-to-csv",
    name: "XLS → CSV",
    description: "Convert Excel 97-2003 to CSV format",
    acceptedTypes: [".xls"],
    outputType: ".csv",
    rejectedTypes: [".xlsx", ".ods", ".txt"],
    icon: "FileSpreadsheet",
    category: "spreadsheet",
  },

  // XLSX to ODS
  {
    id: "xlsx-to-ods",
    name: "XLSX → ODS",
    description: "Convert Excel to OpenDocument Spreadsheet",
    acceptedTypes: [".xlsx"],
    outputType: ".ods",
    rejectedTypes: [".xls", ".csv", ".txt"],
    icon: "FileSpreadsheet",
    category: "spreadsheet",
  },

  // PPTX to ODP
  {
    id: "pptx-to-odp",
    name: "PPTX → ODP",
    description: "Convert PowerPoint to OpenDocument Presentation",
    acceptedTypes: [".pptx"],
    outputType: ".odp",
    rejectedTypes: [".ppt", ".pdf", ".txt"],
    icon: "Presentation",
    category: "presentation",
  },

  // PPTX to PNG
  {
    id: "pptx-to-png",
    name: "PPTX → PNG",
    description: "Convert PowerPoint slides to PNG images",
    acceptedTypes: [".pptx"],
    outputType: ".png",
    rejectedTypes: [".odp", ".ppt", ".pdf", ".jpg", ".jpeg"],
    icon: "Image",
    category: "presentation",
  },

  // DOC to ODT
  {
    id: "doc-to-odt",
    name: "DOC → ODT",
    description: "Convert Word 97-2003 to OpenDocument Text",
    acceptedTypes: [".doc"],
    outputType: ".odt",
    rejectedTypes: [".docx", ".txt", ".pdf", ".rtf"],
    icon: "FileText",
    category: "document",
  },
];

// Validation functions
export const validateFileType = (
  fileName: string,
  toolId: string,
): { isValid: boolean; error?: string } => {
  const tool = LIBREOFFICE_TOOLS.find((t) => t.id === toolId);
  if (!tool) {
    return { isValid: false, error: "Invalid tool selected" };
  }

  const fileExtension = fileName
    .toLowerCase()
    .substring(fileName.lastIndexOf("."));

  if (!tool.acceptedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: `❌ Unsupported file format. This tool only accepts ${tool.acceptedTypes.join(", ")}. Please upload the correct file.`,
    };
  }

  return { isValid: true };
};

export const getToolByAcceptedType = (
  fileExtension: string,
): LibreOfficeToolConfig[] => {
  return LIBREOFFICE_TOOLS.filter((tool) =>
    tool.acceptedTypes.includes(fileExtension.toLowerCase()),
  );
};

export const getToolsByCategory = (
  category: LibreOfficeToolConfig["category"],
): LibreOfficeToolConfig[] => {
  return LIBREOFFICE_TOOLS.filter((tool) => tool.category === category);
};
