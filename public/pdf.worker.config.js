// PDF Worker Configuration and Fallback
// This file provides a fallback mechanism for PDF.js worker loading

(function () {
  "use strict";

  // Check if we're in a browser environment
  if (typeof window === "undefined") return;

  // Worker source configurations in order of preference
  const WORKER_SOURCES = [
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js",
    "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js",
    "/pdf.worker.min.js", // Self-hosted fallback
  ];

  // Function to test if a worker source is accessible
  function testWorkerSource(src) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.type = "module";
      script.onload = () => {
        document.head.removeChild(script);
        resolve(true);
      };
      script.onerror = () => {
        document.head.removeChild(script);
        resolve(false);
      };
      script.src = src;
      document.head.appendChild(script);
    });
  }

  // Configure PDF.js with the best available worker source
  async function configurePDFWorker() {
    // Reduced logging for cleaner console output

    for (const src of WORKER_SOURCES) {
      try {
        const isAccessible = await testWorkerSource(src);

        if (isAccessible) {
          // Set global worker options if PDF.js is available
          if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = src;
          }

          // Store successful worker source for later use
          window.PDFJS_WORKER_SRC = src;

          // Dispatch event to notify other parts of the application
          window.dispatchEvent(
            new CustomEvent("pdfWorkerConfigured", {
              detail: { workerSrc: src },
            }),
          );

          return;
        }
      } catch (error) {
        console.warn(`PDF Worker Configuration: Failed to test ${src}:`, error);
      }
    }

    console.warn(
      "PDF Worker Configuration: No accessible worker sources found, using fallback mode",
    );

    // Fallback: disable worker
    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    }

    window.PDFJS_WORKER_SRC = "";
    window.PDFJS_DISABLE_WORKER = true;

    window.dispatchEvent(
      new CustomEvent("pdfWorkerConfigured", {
        detail: { workerSrc: "", disabled: true },
      }),
    );
  }

  // Configure when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", configurePDFWorker);
  } else {
    configurePDFWorker();
  }

  // Expose configuration function globally
  window.configurePDFWorker = configurePDFWorker;
})();
