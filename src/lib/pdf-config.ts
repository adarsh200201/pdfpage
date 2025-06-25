// Global PDF.js configuration
// This file should be imported early in the application to configure PDF.js
// before any PDF components are rendered

import { pdfjs } from "react-pdf";

// Configure PDF.js to avoid CORS/fetch issues in development
export const configurePDFjs = () => {
  console.log("Configuring PDF.js globally...");

  try {
    if (import.meta.env.DEV) {
      // In development, completely disable worker to avoid any fetch/CORS issues
      console.log("Development mode: Disabling worker completely");
      pdfjs.GlobalWorkerOptions.workerSrc = "";
      // Also disable worker globally for development
      pdfjs.disableWorker = true;
    } else {
      // In production, use the CDN worker
      console.log("Production mode: Using CDN worker");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      pdfjs.disableWorker = false;
    }

    console.log("PDF.js configured successfully:", {
      version: pdfjs.version,
      workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
      disableWorker: pdfjs.disableWorker,
      environment: import.meta.env.DEV ? "development" : "production",
    });
  } catch (error) {
    console.warn("PDF.js configuration warning:", error);
    // Fallback: disable worker completely
    console.log("Falling back to worker-disabled mode");
    pdfjs.GlobalWorkerOptions.workerSrc = "";
    pdfjs.disableWorker = true;
  }
};

// Auto-configure when this module is imported
configurePDFjs();

export { pdfjs };
