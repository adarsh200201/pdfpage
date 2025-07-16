/**
 * Centralized PDF.js worker configuration
 * This ensures all components use the same PDF.js version and worker configuration
 */

// Fixed version from package.json to prevent version mismatches
const PDFJS_VERSION = "3.11.174";

/**
 * Configure PDF.js worker with the correct version
 * This function ensures version consistency across all components
 */
export const configurePDFWorker = async (): Promise<void> => {
  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Only configure if not already set to prevent conflicts
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Try different CDN sources in order of preference
      const workerSources = [
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
        `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`,
        // Local fallback for development
        "/pdf.worker.min.js",
      ];

      // Set the worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0];

      console.log(`✅ PDF.js worker configured with version ${PDFJS_VERSION}`);
      console.log(`📍 Worker source: ${workerSources[0]}`);
    } else {
      console.log(
        `✅ PDF.js worker already configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`,
      );
    }

    // Verify the worker is accessible
    const isWorkerValid = await testWorkerConnection(
      pdfjsLib.GlobalWorkerOptions.workerSrc,
    );
    if (!isWorkerValid) {
      console.warn(
        "⚠️ PDF worker may not be accessible, trying fallback sources...",
      );
      // Try fallback sources if primary fails
      for (let i = 1; i < workerSources.length; i++) {
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[i];
          const fallbackValid = await testWorkerConnection(workerSources[i]);
          if (fallbackValid) {
            console.log(
              `✅ Fallback worker source working: ${workerSources[i]}`,
            );
            break;
          }
        } catch (fallbackError) {
          console.warn(`❌ Fallback ${i} failed:`, fallbackError);
        }
      }
    }
  } catch (error) {
    console.error("❌ Failed to configure PDF.js worker:", error);
    throw new Error(`PDF worker configuration failed: ${error.message}`);
  }
};

/**
 * Test if the PDF worker source is accessible
 */
const testWorkerConnection = async (workerSrc: string): Promise<boolean> => {
  try {
    if (!workerSrc || workerSrc.startsWith("/")) {
      // Skip test for local files
      return true;
    }

    const response = await fetch(workerSrc, {
      method: "HEAD",
      mode: "no-cors",
    });
    return true; // If no error thrown, worker is accessible
  } catch (error) {
    return false;
  }
};

/**
 * Load PDF document with proper error handling and worker configuration
 */
export const loadPDFDocument = async (data: ArrayBuffer | Uint8Array) => {
  try {
    // Ensure worker is configured before loading
    await configurePDFWorker();

    const pdfjsLib = await import("pdfjs-dist");

    const loadingTask = pdfjsLib.getDocument({
      data,
      verbosity: 0, // Reduce console noise
      // Additional options to improve compatibility
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
      cMapPacked: true,
    });

    return await loadingTask.promise;
  } catch (error) {
    console.error("Failed to load PDF document:", error);
    throw error;
  }
};

/**
 * Get the configured PDF.js version
 */
export const getPDFJSVersion = (): string => {
  return PDFJS_VERSION;
};

/**
 * Check if PDF.js worker is properly configured
 */
export const isPDFWorkerConfigured = async (): Promise<boolean> => {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    return !!pdfjsLib.GlobalWorkerOptions.workerSrc;
  } catch {
    return false;
  }
};
