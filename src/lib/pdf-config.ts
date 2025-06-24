// Global PDF.js configuration
// This file should be imported early in the application to configure PDF.js
// before any PDF components are rendered

import { pdfjs } from "react-pdf";

// Configure PDF.js by completely disabling workers to avoid fetch issues
export const configurePDFjs = () => {
  console.log("Configuring PDF.js globally...");

  try {
    // Safely configure GlobalWorkerOptions
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = "";
    }

    // Use getDocument API options instead of global properties
    // These will be applied when calling getDocument
    console.log("PDF.js configured successfully:", {
      version: pdfjs.version,
      globalWorkerOptionsSet: !!pdfjs.GlobalWorkerOptions,
    });
  } catch (error) {
    console.warn("PDF.js configuration warning:", error);
  }
};

// Auto-configure when this module is imported
configurePDFjs();

export { pdfjs };
