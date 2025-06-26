// Global PDF.js configuration
// This file should be imported early in the application to configure PDF.js
// before any PDF components are rendered

import { pdfjs } from "react-pdf";

// Flag to track if configuration has been applied
let isConfigured = false;

// Configuration options
interface PDFConfigOptions {
  workerSrc?: string;
  disableWorker?: boolean;
  force?: boolean;
}

// Safe property setter that handles read-only properties
const safeSetProperty = (obj: any, prop: string, value: any): boolean => {
  try {
    // Check if property exists and is writable
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    if (descriptor && (descriptor.writable === false || !descriptor.set)) {
      console.log(`Property ${prop} is read-only, skipping assignment`);
      return false;
    }

    // Attempt assignment
    obj[prop] = value;
    return true;
  } catch (error) {
    console.warn(`Failed to set ${prop}:`, error);
    return false;
  }
};

// Configure react-pdf specifically
export const configureReactPDF = (options: PDFConfigOptions = {}): boolean => {
  try {
    console.log("Configuring react-pdf...");

    // Set worker source
    if (options.workerSrc !== undefined) {
      if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = options.workerSrc;
        console.log("React-PDF worker source set:", options.workerSrc);
      }
    }

    // Set disableWorker if specified
    if (options.disableWorker !== undefined) {
      safeSetProperty(pdfjs, "disableWorker", options.disableWorker);
    }

    return true;
  } catch (error) {
    console.error("React-PDF configuration failed:", error);
    return false;
  }
};

// Configure pdfjs-dist directly (for components that import it separately)
export const configurePDFJSDist = async (
  options: PDFConfigOptions = {},
): Promise<boolean> => {
  try {
    console.log("Configuring pdfjs-dist...");

    // Dynamic import to avoid bundling issues
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source on the direct import
    if (options.workerSrc !== undefined) {
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = options.workerSrc;
        console.log("PDFjs-dist worker source set:", options.workerSrc);
      }
    }

    return true;
  } catch (error) {
    console.warn("PDFjs-dist configuration failed:", error);
    return false;
  }
};

// Unified configuration function
export const configurePDFjs = async (force = false): Promise<void> => {
  if (isConfigured && !force) {
    console.log("PDF.js already configured, skipping...");
    return;
  }

  console.log("Configuring PDF.js globally...");

  try {
    const isDev = import.meta.env.DEV;
    // Always use worker, even in development, to avoid errors
    const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

    const configOptions: PDFConfigOptions = {
      workerSrc,
      disableWorker: false, // Always enable worker
    };

    // Configure both react-pdf and pdfjs-dist
    const reactPdfResult = configureReactPDF(configOptions);
    const pdfjsDistResult = await configurePDFJSDist(configOptions);

    console.log("PDF.js configuration completed:", {
      reactPdf: reactPdfResult,
      pdfjsDist: pdfjsDistResult,
      workerSrc,
      environment: isDev ? "development" : "production",
    });

    isConfigured = true;
  } catch (error) {
    console.error("PDF.js configuration failed:", error);

    // Fallback configuration
    try {
      console.log("Applying fallback configuration...");
      configureReactPDF({ workerSrc: "" });
      await configurePDFJSDist({ workerSrc: "" });
    } catch (fallbackError) {
      console.error("Fallback configuration also failed:", fallbackError);
    }
  }
};

// Safe configuration that won't throw errors
export const safeConfigurePDFjs = async (): Promise<void> => {
  console.log("Safe PDF.js configuration...");

  try {
    await configurePDFjs();
  } catch (error) {
    console.error(
      "Safe PDF.js configuration failed, continuing anyway:",
      error,
    );
  }
};

// Get configuration status
export const getPDFConfigStatus = () => {
  try {
    return {
      version: pdfjs.version,
      workerSrc: pdfjs.GlobalWorkerOptions?.workerSrc || "not set",
      isConfigured,
      environment: import.meta.env.DEV ? "development" : "production",
    };
  } catch (error) {
    console.error("Error getting PDF config status:", error);
    return {
      version: "unknown",
      workerSrc: "error",
      isConfigured: false,
      environment: "unknown",
    };
  }
};

// Initialize configuration immediately but safely
(async () => {
  try {
    await safeConfigurePDFjs();
  } catch (error) {
    console.error("Initial PDF.js configuration failed:", error);
  }
})();

export { pdfjs };
