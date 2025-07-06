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
      ];

      // Use the first CDN source as primary
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0];

      console.log(`PDF.js worker configured with version ${PDFJS_VERSION}`);
    }
  } catch (error) {
    console.error("Failed to configure PDF.js worker:", error);
    throw error;
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
