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

    // Try different worker sources in order of preference
    const workerSources = [
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`,
      `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`,
      `/pdf.worker.min.mjs`, // Fallback to self-hosted if available
    ];

    let workerConfigured = false;

    for (const workerSrc of workerSources) {
      try {
        console.log(`Trying worker source: ${workerSrc}`);

        const configOptions: PDFConfigOptions = {
          workerSrc,
          disableWorker: false,
        };

        // Configure both react-pdf and pdfjs-dist
        const reactPdfResult = configureReactPDF(configOptions);
        const pdfjsDistResult = await configurePDFJSDist(configOptions);

        if (reactPdfResult || pdfjsDistResult) {
          console.log("PDF.js configuration completed:", {
            reactPdf: reactPdfResult,
            pdfjsDist: pdfjsDistResult,
            workerSrc,
            environment: isDev ? "development" : "production",
          });
          workerConfigured = true;
          break;
        }
      } catch (workerError) {
        console.warn(`Worker source ${workerSrc} failed:`, workerError);
        continue;
      }
    }

    if (!workerConfigured) {
      console.warn("All worker sources failed, trying without worker...");
      // Last resort: disable worker entirely
      const fallbackOptions: PDFConfigOptions = {
        workerSrc: "",
        disableWorker: true,
      };

      try {
        configureReactPDF(fallbackOptions);
        await configurePDFJSDist(fallbackOptions);
        console.log("PDF.js configured without worker (fallback mode)");
        workerConfigured = true; // Mark as configured even without worker
      } catch (fallbackError) {
        console.error("Fallback configuration failed:", fallbackError);
        // Even if fallback fails, continue - some PDF operations might still work
      }
    }

    isConfigured = true;
  } catch (error) {
    console.error("PDF.js configuration failed:", error);

    // Ultimate fallback configuration
    try {
      console.log("Applying ultimate fallback configuration...");
      configureReactPDF({ workerSrc: "", disableWorker: true });
      await configurePDFJSDist({ workerSrc: "", disableWorker: true });
      console.log("PDF.js configured in ultimate fallback mode");
      isConfigured = true; // Mark as configured even if errors occurred
    } catch (fallbackError) {
      console.error(
        "Ultimate fallback configuration also failed:",
        fallbackError,
      );
      // Continue anyway - some basic PDF operations might still work
      isConfigured = true; // Mark as configured to prevent infinite retries
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

// Function to wait for worker configuration from the browser
const waitForWorkerConfig = (): Promise<string> => {
  return new Promise((resolve) => {
    // Check if already configured
    if ((window as any).PDFJS_WORKER_SRC !== undefined) {
      console.log(
        "Using pre-configured worker source:",
        (window as any).PDFJS_WORKER_SRC,
      );
      resolve((window as any).PDFJS_WORKER_SRC);
      return;
    }

    // Try immediate fallback with best-available worker source
    const tryImmediateFallback = () => {
      const fallbackWorkerSources = [
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`,
        `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`,
        `/pdf.worker.min.mjs`,
      ];

      console.log("PDF worker configuration timeout, using immediate fallback");
      resolve(fallbackWorkerSources[0]); // Use the most reliable CDN source
    };

    // Listen for worker configuration event
    const handleWorkerConfigured = (event: any) => {
      window.removeEventListener("pdfWorkerConfigured", handleWorkerConfigured);
      console.log("Worker configured via event:", event.detail.workerSrc);
      resolve(event.detail.workerSrc || "");
    };

    window.addEventListener("pdfWorkerConfigured", handleWorkerConfigured);

    // Ultra-fast fallback for immediate response
    setTimeout(() => {
      window.removeEventListener("pdfWorkerConfigured", handleWorkerConfigured);
      tryImmediateFallback();
    }, 100); // Reduced to 100ms for ultra-fast response
  });
};

// Enhanced configuration that uses browser-tested worker sources
export const configureWithBrowserTesting = async (): Promise<void> => {
  try {
    console.log("Waiting for browser worker configuration...");
    const workerSrc = await waitForWorkerConfig();

    const configOptions: PDFConfigOptions = {
      workerSrc,
      disableWorker: !workerSrc || (window as any).PDFJS_DISABLE_WORKER,
    };

    console.log(
      "Configuring PDF.js with browser-tested settings:",
      configOptions,
    );

    // Configure both react-pdf and pdfjs-dist with error handling
    let reactPdfResult = false;
    let pdfjsDistResult = false;

    try {
      reactPdfResult = configureReactPDF(configOptions);
    } catch (reactError) {
      console.warn("React PDF configuration failed:", reactError);
    }

    try {
      pdfjsDistResult = await configurePDFJSDist(configOptions);
    } catch (distError) {
      console.warn("PDFjs-dist configuration failed:", distError);
    }

    console.log("PDF.js configuration with browser testing completed:", {
      reactPdf: reactPdfResult,
      pdfjsDist: pdfjsDistResult,
      workerSrc,
      disableWorker: configOptions.disableWorker,
    });

    isConfigured = true;
  } catch (error) {
    console.error("Browser-tested PDF.js configuration failed:", error);
    // Fall back to original configuration with error handling
    try {
      await configurePDFjs(true);
    } catch (fallbackError) {
      console.error("Fallback configuration also failed:", fallbackError);
      // Continue anyway - mark as configured to prevent infinite retries
      isConfigured = true;
    }
  }
};

// Initialize configuration immediately but safely
(async () => {
  try {
    // Use browser-tested configuration if available, otherwise fallback
    if (typeof window !== "undefined" && window.addEventListener) {
      await configureWithBrowserTesting();
    } else {
      await safeConfigurePDFjs();
    }
  } catch (error) {
    console.error("Initial PDF.js configuration failed:", error);
  }
})();

export { pdfjs };
