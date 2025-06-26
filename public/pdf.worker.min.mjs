// Minimal PDF.js Worker Fallback
// This is a simplified worker that can be used when CDN sources are not available

const isWorkerEnvironment = typeof importScripts === "function";

if (isWorkerEnvironment) {
  // Simple worker implementation
  self.onmessage = function (event) {
    const { data } = event;

    // Send a response indicating that the worker is loaded but functionality is limited
    self.postMessage({
      type: "workerReady",
      message: "Fallback PDF worker loaded - limited functionality",
      data: data,
    });
  };

  // Error handler
  self.onerror = function (error) {
    console.error("PDF Worker Error:", error);
    self.postMessage({
      type: "error",
      message: "PDF Worker encountered an error",
      error: error.message || "Unknown error",
    });
  };

  console.log("Fallback PDF Worker initialized");
} else {
  // If not in worker environment, export as module
  export default {
    message: "PDF Worker fallback module loaded",
  };
}
