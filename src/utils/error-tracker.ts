// Simple error tracker to monitor and debug AbortErrors
class ErrorTracker {
  private errors: Array<{ timestamp: Date; error: Error; stack?: string }> = [];
  private maxErrors = 50; // Keep only last 50 errors

  trackError(error: Error, context?: string): void {
    // Only track in development
    if (!import.meta.env.DEV) return;

    this.errors.push({
      timestamp: new Date(),
      error: error,
      stack: error.stack,
    });

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log AbortErrors specifically
    if (error.name === "AbortError") {
      console.warn(
        `🚨 AbortError detected${context ? ` in ${context}` : ""}:`,
        error.message,
      );
      console.debug("Error stack:", error.stack);
    }
  }

  getRecentErrors(): Array<{ timestamp: Date; error: Error; stack?: string }> {
    return [...this.errors];
  }

  getAbortErrors(): Array<{ timestamp: Date; error: Error; stack?: string }> {
    return this.errors.filter((err) => err.error.name === "AbortError");
  }

  clearErrors(): void {
    this.errors = [];
  }
}

export const errorTracker = new ErrorTracker();

// Global error handler for unhandled promise rejections
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason instanceof Error) {
      errorTracker.trackError(event.reason, "unhandled promise rejection");
    }
  });

  window.addEventListener("error", (event) => {
    if (event.error instanceof Error) {
      errorTracker.trackError(event.error, "global error handler");
    }
  });
}
