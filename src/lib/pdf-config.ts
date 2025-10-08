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
      return false;
    }

    // Attempt assignment
    obj[prop] = value;
    return true;
  } catch (error) {
    return false;
  }
};

// Configure react-pdf specifically
export const configureReactPDF = (options: PDFConfigOptions = {}): boolean => {
  try {
    // Set worker source
    if (options.workerSrc !== undefined) {
      if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = options.workerSrc;
      }
    }

    // Set disableWorker if specified
    if (options.disableWorker !== undefined) {
      safeSetProperty(pdfjs, "disableWorker", options.disableWorker);
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Configure pdfjs-dist directly (for components that import it separately)
export const configurePDFJSDist = async (
  options: PDFConfigOptions = {},
): Promise<boolean> => {
  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Configure worker source
    if (options.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = options.workerSrc;
    }

    // Configure other options
    if (options.disableWorker !== undefined) {
      (pdfjsLib.GlobalWorkerOptions as any).disableWorker = options.disableWorker;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Unified configuration function
export const configurePDFjs = async (force = false): Promise<void> => {
  if (isConfigured && !force) {
    console.log("PDF.js already configured, skipping...");
    return;
  }

  try {
    const isDev = import.meta.env.DEV;

    // Try different worker sources in order of preference
    // Use react-pdf's exact PDF.js version to avoid version mismatch
    const pdfjsVersion = "3.11.174"; // Fixed to react-pdf's version

    const workerSources = [
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`,
      `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`,
      `/pdf.worker.min.js`, // Fallback to self-hosted if available
    ];

    let workerConfigured = false;

    for (const workerSrc of workerSources) {
      try {
        const configOptions: PDFConfigOptions = {
          workerSrc,
          disableWorker: false,
        };

        // Configure both react-pdf and pdfjs-dist
        const reactPdfResult = configureReactPDF(configOptions);
        const pdfjsDistResult = await configurePDFJSDist(configOptions);

        if (reactPdfResult || pdfjsDistResult) {
          workerConfigured = true;
          break;
        }
      } catch (workerError) {
        // Continue to next worker source
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
      const pdfjsVersion = "3.11.174"; // Fixed to react-pdf's version
      const fallbackWorkerSources = [
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`,
        `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`,
        `/pdf.worker.min.js`,
      ];

      resolve(fallbackWorkerSources[0]); // Use the most reliable CDN source
    };

    // Listen for worker configuration event
    const handleWorkerConfigured = (event: any) => {
      window.removeEventListener("pdfWorkerConfigured", handleWorkerConfigured);
      resolve(event.detail.workerSrc || "");
    };

    window.addEventListener("pdfWorkerConfigured", handleWorkerConfigured);

    // Ultra-fast fallback for immediate response
    setTimeout(() => {
      window.removeEventListener("pdfWorkerConfigured", handleWorkerConfigured);
      tryImmediateFallback();
    }, 50); // Reduced to 50ms for ultra-fast response
  });
};

// Enhanced configuration that uses browser-tested worker sources
export const configureWithBrowserTesting = async (): Promise<void> => {
  try {
    const workerSrc = await waitForWorkerConfig();

    const configOptions: PDFConfigOptions = {
      workerSrc,
      disableWorker: !workerSrc || (window as any).PDFJS_DISABLE_WORKER,
    };

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

    // PDF.js configuration completed successfully

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
