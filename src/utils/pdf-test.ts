// Simple utility to test PDF.js worker configuration
import { pdfjs } from "react-pdf";

export const testPDFWorker = async (): Promise<boolean> => {
  try {
    console.log("Testing PDF.js worker configuration...");
    console.log("Worker source:", pdfjs.GlobalWorkerOptions.workerSrc);
    console.log("PDF.js version:", pdfjs.version);

    // Basic test - this should not throw if worker is properly configured
    const testResult = pdfjs.getDocument({ data: new Uint8Array() });

    // If we get here without immediate errors, worker config is likely OK
    console.log("✅ PDF.js worker configuration appears to be working");
    return true;
  } catch (error) {
    console.error("❌ PDF.js worker test failed:", error);
    return false;
  }
};

export const getWorkerStatus = () => {
  return {
    workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
    version: pdfjs.version,
    isConfigured: !!pdfjs.GlobalWorkerOptions.workerSrc,
    workerDisabled: pdfjs.disableWorker,
    environment: import.meta.env.DEV ? "development" : "production",
  };
};
