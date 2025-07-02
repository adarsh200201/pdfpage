// PDF Debugging Utility for troubleshooting conversion issues

export interface PDFDebugInfo {
  fileName: string;
  fileSize: number;
  fileType: string;
  isValidPDF: boolean;
  hasSignature: boolean;
  estimatedPages: number;
  estimatedContentLength: number;
}

export async function debugPDFFile(file: File): Promise<PDFDebugInfo> {
  const debugInfo: PDFDebugInfo = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    isValidPDF: false,
    hasSignature: false,
    estimatedPages: 0,
    estimatedContentLength: 0,
  };

  try {
    // Check if file has PDF signature
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Check for PDF signature (%PDF)
    const pdfSignature = [0x25, 0x50, 0x44, 0x46]; // %PDF
    debugInfo.hasSignature = pdfSignature.every(
      (byte, index) => uint8Array[index] === byte,
    );

    debugInfo.isValidPDF = debugInfo.hasSignature;

    if (debugInfo.hasSignature) {
      // Try to estimate pages by counting page objects
      const pdfContent = new TextDecoder("latin1").decode(uint8Array);
      const pageMatches = pdfContent.match(/\/Type\s*\/Page[\s\n]/g);
      debugInfo.estimatedPages = pageMatches ? pageMatches.length : 0;

      // Estimate content by looking for text streams
      const textMatches = pdfContent.match(/BT[\s\S]*?ET/g);
      debugInfo.estimatedContentLength = textMatches
        ? textMatches.join("").length
        : 0;
    }
  } catch (error) {
    console.warn("PDF debug analysis failed:", error);
  }

  return debugInfo;
}

export function validatePDFForConversion(debugInfo: PDFDebugInfo): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!debugInfo.hasSignature) {
    warnings.push("File doesn't have a valid PDF signature");
    recommendations.push("Ensure the file is a genuine PDF document");
  }

  if (debugInfo.fileSize < 1000) {
    warnings.push("File size is very small - may be corrupted");
    recommendations.push("Try re-saving or re-exporting the PDF");
  }

  if (debugInfo.estimatedPages === 0) {
    warnings.push("No pages detected - may be a damaged PDF");
    recommendations.push(
      "Try opening the PDF in a viewer to verify it's readable",
    );
  }

  if (debugInfo.estimatedContentLength === 0) {
    warnings.push("No text content detected - may be image-based or scanned");
    recommendations.push("For scanned PDFs, try using our OCR tool first");
  }

  const isValid = debugInfo.hasSignature && debugInfo.fileSize > 1000;

  return { isValid, warnings, recommendations };
}

export function formatDebugInfo(debugInfo: PDFDebugInfo): string {
  const validation = validatePDFForConversion(debugInfo);

  let report = `PDF Debug Report for "${debugInfo.fileName}"\n`;
  report += `==========================================\n`;
  report += `File Size: ${(debugInfo.fileSize / 1024 / 1024).toFixed(2)} MB\n`;
  report += `File Type: ${debugInfo.fileType}\n`;
  report += `Has PDF Signature: ${debugInfo.hasSignature ? "Yes" : "No"}\n`;
  report += `Estimated Pages: ${debugInfo.estimatedPages}\n`;
  report += `Estimated Content Length: ${debugInfo.estimatedContentLength}\n`;
  report += `Valid for Conversion: ${validation.isValid ? "Yes" : "No"}\n\n`;

  if (validation.warnings.length > 0) {
    report += `Warnings:\n`;
    validation.warnings.forEach((warning) => {
      report += `- ${warning}\n`;
    });
    report += `\n`;
  }

  if (validation.recommendations.length > 0) {
    report += `Recommendations:\n`;
    validation.recommendations.forEach((rec) => {
      report += `- ${rec}\n`;
    });
  }

  return report;
}
