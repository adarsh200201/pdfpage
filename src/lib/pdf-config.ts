// Global PDF.js configuration
// This file should be imported early in the application to configure PDF.js
// before any PDF components are rendered

import { pdfjs } from "react-pdf";

// Configure PDF.js by completely disabling workers to avoid fetch issues
export const configurePDFjs = () => {
  console.log("Configuring PDF.js globally...");

  // Completely disable worker to avoid any CDN/network issues
  pdfjs.disableWorker = true;

  // Clear any worker source
  pdfjs.GlobalWorkerOptions.workerSrc = "";

  // Disable streaming and auto-fetch for additional stability
  pdfjs.disableStream = true;
  pdfjs.disableAutoFetch = true;

  // Set verbosity to reduce console noise
  pdfjs.verbosity = pdfjs.VerbosityLevel.ERRORS;

  console.log("PDF.js configured successfully:", {
    version: pdfjs.version,
    workerDisabled: pdfjs.disableWorker,
    streamDisabled: pdfjs.disableStream,
    autoFetchDisabled: pdfjs.disableAutoFetch,
  });
};

// Auto-configure when this module is imported
configurePDFjs();

export { pdfjs };
