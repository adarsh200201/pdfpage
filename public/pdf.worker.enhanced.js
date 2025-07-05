// Enhanced PDF Worker Configuration with Error Recovery
// This configuration provides better error handling and immediate fallbacks
// DISABLED: To prevent conflicts with main PDF configuration

(function () {
  "use strict";

  // Check if we're in a browser environment
  if (typeof window === "undefined") return;

  // DISABLED: This enhanced worker is disabled to prevent console spam
  // The main PDF configuration in src/lib/pdf-config.ts handles worker setup
  return;

  // Enhanced worker source configurations with immediate fallback
  const WORKER_SOURCES = [
    // Primary CDN sources (most reliable)
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js",
    "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js",

    // Alternative CDN sources
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",

    // Self-hosted fallback
    "/pdf.worker.min.js",
  ];

  // Cache for tested sources
  const testedSources = new Map();
  let configurationAttempts = 0;
  const MAX_ATTEMPTS = 3;

  // Function to test if a worker source is accessible with timeout
  function testWorkerSource(src, timeout = 2000) {
    return new Promise((resolve) => {
      // Check cache first
      if (testedSources.has(src)) {
        resolve(testedSources.get(src));
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        resolve(false);
      }, timeout);

      fetch(src, {
        method: "HEAD",
        signal: controller.signal,
        mode: "cors",
      })
        .then((response) => {
          clearTimeout(timeoutId);
          const isAccessible = response.ok || response.status === 0;
          testedSources.set(src, isAccessible);
          resolve(isAccessible);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          testedSources.set(src, false);
          resolve(false);
        });
    });
  }

  // Enhanced PDF.js configuration with immediate fallback
  async function configurePDFWorker() {
    configurationAttempts++;
    console.log(
      `PDF Worker Configuration: Attempt ${configurationAttempts}/${MAX_ATTEMPTS}`,
    );

    // Immediate timeout for faster response
    const IMMEDIATE_TIMEOUT = 500; // 500ms for immediate response

    try {
      // Test all sources in parallel with ultra-short timeout
      const testPromises = WORKER_SOURCES.map(
        (src) => testWorkerSource(src, 50), // Ultra-fast 50ms timeout
      );

      const results = await Promise.all(testPromises);

      // Find first working source
      for (let i = 0; i < WORKER_SOURCES.length; i++) {
        if (results[i]) {
          const workingSrc = WORKER_SOURCES[i];
          console.log(`PDF Worker Configuration: Using ${workingSrc}`);

          // Set global worker options
          if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = workingSrc;
          }

          // Store successful worker source
          window.PDFJS_WORKER_SRC = workingSrc;
          window.PDFJS_WORKER_READY = true;

          // Dispatch success event
          window.dispatchEvent(
            new CustomEvent("pdfWorkerConfigured", {
              detail: { workerSrc: workingSrc, success: true },
            }),
          );

          console.log("✅ PDF Worker Configuration: Success");
          return true;
        }
      }

      // If no sources work, use immediate fallback
      console.warn(
        "PDF Worker Configuration: No accessible sources, using fallback",
      );
      return configureFallbackMode();
    } catch (error) {
      console.error("PDF Worker Configuration: Error during testing:", error);
      return configureFallbackMode();
    }
  }

  // Immediate fallback configuration
  function configureFallbackMode() {
    console.log("PDF Worker Configuration: Activating immediate fallback mode");

    // Try to use the first source anyway (sometimes CORS issues resolve)
    const fallbackSrc = WORKER_SOURCES[0];

    // Set worker source even if untested
    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = fallbackSrc;
    }

    // Mark as configured but with warning
    window.PDFJS_WORKER_SRC = fallbackSrc;
    window.PDFJS_WORKER_READY = true;
    window.PDFJS_FALLBACK_MODE = true;

    // Dispatch fallback event
    window.dispatchEvent(
      new CustomEvent("pdfWorkerConfigured", {
        detail: {
          workerSrc: fallbackSrc,
          success: false,
          fallback: true,
        },
      }),
    );

    console.log("⚠️ PDF Worker Configuration: Fallback mode activated");
    return false;
  }

  // Retry mechanism with exponential backoff
  function retryConfiguration() {
    if (configurationAttempts < MAX_ATTEMPTS) {
      const delay = Math.pow(2, configurationAttempts - 1) * 100; // 100ms, 200ms, 400ms
      console.log(`PDF Worker Configuration: Retrying in ${delay}ms...`);

      setTimeout(() => {
        configurePDFWorker();
      }, delay);
    } else {
      console.warn(
        "PDF Worker Configuration: Max attempts reached, staying in fallback mode",
      );
    }
  }

  // Enhanced initialization
  function initializePDFWorker() {
    // Don't initialize multiple times
    if (window.PDFJS_WORKER_READY) {
      console.log("PDF Worker Configuration: Already initialized");
      return;
    }

    console.log(
      "PDF Worker Configuration: Starting enhanced initialization...",
    );

    // Start configuration immediately
    configurePDFWorker().then((success) => {
      if (!success && configurationAttempts < MAX_ATTEMPTS) {
        retryConfiguration();
      }
    });
  }

  // Initialize based on document ready state
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePDFWorker);
  } else {
    // If DOM is already ready, start immediately
    initializePDFWorker();
  }

  // Also start when pdfjsLib becomes available
  if (window.pdfjsLib) {
    initializePDFWorker();
  } else {
    // Watch for pdfjsLib to become available
    const checkInterval = setInterval(() => {
      if (window.pdfjsLib) {
        clearInterval(checkInterval);
        initializePDFWorker();
      }
    }, 100);

    // Stop checking after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!window.pdfjsLib) {
        console.warn(
          "PDF Worker Configuration: pdfjsLib not found, continuing anyway",
        );
        initializePDFWorker();
      }
    }, 5000);
  }

  // Expose configuration functions globally
  window.configurePDFWorker = configurePDFWorker;
  window.configureFallbackMode = configureFallbackMode;

  // Global error handler for PDF worker errors
  window.addEventListener("error", function (event) {
    if (
      event.error &&
      event.error.message &&
      (event.error.message.includes("pdf.worker") ||
        event.error.message.includes("PDF.js"))
    ) {
      console.warn("PDF Worker Error detected:", event.error.message);

      // Try to reconfigure if not in fallback mode
      if (!window.PDFJS_FALLBACK_MODE) {
        console.log("PDF Worker Configuration: Attempting recovery...");
        configureFallbackMode();
      }
    }
  });

  console.log("✨ Enhanced PDF Worker Configuration loaded");
})();
