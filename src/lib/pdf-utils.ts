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
