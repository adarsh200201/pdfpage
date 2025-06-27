// PDF utilities with proper dependency management
let PDFLib: any = null;

export const loadPDFLib = async () => {
  if (PDFLib) return PDFLib;

  try {
    // Try dynamic import with better error handling
    PDFLib = await import("pdf-lib");
    return PDFLib;
  } catch (error) {
    console.error("Failed to load pdf-lib:", error);

    // Fallback: try loading from CDN
    try {
      await loadScriptFromCDN();
      PDFLib = (window as any).PDFLib;
      return PDFLib;
    } catch (cdnError) {
      console.error("CDN fallback failed:", cdnError);
      throw new Error("Failed to load PDF library");
    }
  }
};

const loadScriptFromCDN = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).PDFLib) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load PDF library from CDN"));
    document.head.appendChild(script);
  });
};

// Helper functions for common PDF operations
export const createPDFDocument = async () => {
  const lib = await loadPDFLib();
  return lib.PDFDocument.create();
};

export const loadPDFDocument = async (arrayBuffer: ArrayBuffer) => {
  const lib = await loadPDFLib();
  return lib.PDFDocument.load(arrayBuffer);
};

export const getRGBColor = async (r: number, g: number, b: number) => {
  const lib = await loadPDFLib();
  return lib.rgb(r, g, b);
};

export const getStandardFonts = async () => {
  const lib = await loadPDFLib();
  return lib.StandardFonts;
};

export const getDegrees = async () => {
  const lib = await loadPDFLib();
  return lib.degrees;
};

// Error-safe PDF operations
export const safePDFOperation = async <T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>,
  operationName = "PDF operation",
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${operationName} failed:`, error);

    if (fallback) {
      console.log(`Attempting ${operationName} fallback...`);
      try {
        return await fallback();
      } catch (fallbackError) {
        console.error(`${operationName} fallback failed:`, fallbackError);
        throw fallbackError;
      }
    }

    throw error;
  }
};

// Get file size in human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Calculate compression ratio
export const calculateCompressionRatio = (
  originalSize: number,
  compressedSize: number,
): number => {
  if (originalSize <= 0) return 0;
  return ((originalSize - compressedSize) / originalSize) * 100;
};

// Validate PDF file
export const validatePDFFile = async (
  arrayBuffer: ArrayBuffer,
): Promise<boolean> => {
  try {
    // Check PDF signature
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfSignature = "%PDF-";
    const headerBytes = new TextDecoder().decode(uint8Array.slice(0, 5));

    if (!headerBytes.startsWith(pdfSignature)) {
      console.error("Invalid PDF file: Missing PDF signature");
      return false;
    }

    // Try to load the PDF to validate structure
    const lib = await loadPDFLib();
    await lib.PDFDocument.load(arrayBuffer);

    return true;
  } catch (error) {
    console.error("PDF validation failed:", error);
    return false;
  }
};

// Optimize PDF for compression
export const optimizePDFStructure = async (pdfDoc: any): Promise<void> => {
  try {
    // Remove unnecessary metadata
    const infoDict = pdfDoc.getInfoDict();
    if (infoDict) {
      // Keep essential metadata only
      const title = infoDict.get("Title");
      const author = infoDict.get("Author");

      // Clear all metadata and re-add essential ones
      infoDict.clear();

      if (title) infoDict.set("Title", title);
      if (author) infoDict.set("Author", author);

      // Add compression info
      infoDict.set("Creator", "PdfPage Compressor");
      infoDict.set("Producer", "PdfPage Advanced Compression Engine");
    }

    // Set creation date to current time to remove historical bloat
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
  } catch (error) {
    console.warn("PDF structure optimization failed:", error);
  }
};

// Check if PDF has images that can be compressed
export const hasCompressibleImages = async (pdfDoc: any): Promise<boolean> => {
  try {
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const resources = page.node.Resources;
      if (resources && resources.XObject) {
        // Check for image XObjects
        const xObjects = resources.XObject;
        for (const [key, value] of Object.entries(xObjects)) {
          if (value && typeof value === "object" && value.Subtype === "Image") {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.warn("Could not check for compressible images:", error);
    return false;
  }
};

// Estimate compression potential
export const estimateCompressionPotential = async (
  arrayBuffer: ArrayBuffer,
): Promise<{
  estimatedReduction: number;
  hasImages: boolean;
  hasText: boolean;
  pageCount: number;
  fileSize: number;
}> => {
  try {
    const pdfDoc = await loadPDFDocument(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    const hasImages = await hasCompressibleImages(pdfDoc);

    // Estimate compression potential based on file characteristics
    let estimatedReduction = 15; // Base 15% reduction

    if (hasImages) {
      estimatedReduction += 30; // Images can be compressed significantly
    }

    if (pageCount > 10) {
      estimatedReduction += 10; // More pages = more optimization opportunity
    }

    if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
      // > 5MB
      estimatedReduction += 15; // Large files often have more redundancy
    }

    // Cap at 70% to be realistic
    estimatedReduction = Math.min(estimatedReduction, 70);

    return {
      estimatedReduction,
      hasImages,
      hasText: true, // Assume most PDFs have text
      pageCount,
      fileSize: arrayBuffer.byteLength,
    };
  } catch (error) {
    console.warn("Could not estimate compression potential:", error);
    return {
      estimatedReduction: 20,
      hasImages: false,
      hasText: true,
      pageCount: 1,
      fileSize: arrayBuffer.byteLength,
    };
  }
};
