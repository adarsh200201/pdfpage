/**
 * Global error handler for catching and handling runtime errors
 * This prevents uncaught errors from breaking the application
 */

export interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorDetails[] = [];

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle JavaScript runtime errors
    window.addEventListener("error", (event) => {
      this.handleError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Handle React errors (if using React)
    if (typeof window !== "undefined") {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Check if this is a React error
        const message = args.join(" ");
        if (
          message.includes("Cannot read properties of undefined") ||
          message.includes("frame") ||
          message.includes("ErrorOverlay")
        ) {
          // Silently handle these specific errors to prevent cascading failures
          this.handleSilentError({
            message,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          });
          return;
        }
        originalConsoleError.apply(console, args);
      };
    }
  }

  private handleError(errorDetails: ErrorDetails): void {
    // Log the error
    this.errorLog.push(errorDetails);

    // Keep only the last 50 errors to prevent memory issues
    if (this.errorLog.length > 50) {
      this.errorLog = this.errorLog.slice(-50);
    }

    // Filter out known harmless errors
    if (this.isHarmlessError(errorDetails.message)) {
      return;
    }

    // In development, log to console
    if (process.env.NODE_ENV === "development") {
      console.warn("Error handled by ErrorHandler:", errorDetails);
    }

    // In production, you might want to send to an error reporting service
    // this.reportToService(errorDetails);
  }

  private handleSilentError(errorDetails: ErrorDetails): void {
    // Log silently without triggering additional error handling
    this.errorLog.push(errorDetails);

    // In development, show a minimal log
    if (process.env.NODE_ENV === "development") {
      console.debug("Silent error handled:", errorDetails.message);
    }
  }

  private isHarmlessError(message: string): boolean {
    const harmlessPatterns = [
      "Cannot read properties of undefined (reading 'frame')",
      "getDefaultStylesForTag",
      "getAppliedComputedStyles",
      "domNodeToElement",
      "ErrorOverlay",
      "ResizeObserver loop limit exceeded",
      "Non-passive event listener",
      "Script error",
    ];

    return harmlessPatterns.some((pattern) => message.includes(pattern));
  }

  public getErrorLog(): ErrorDetails[] {
    return [...this.errorLog];
  }

  public clearErrorLog(): void {
    this.errorLog = [];
  }

  // Method to manually report errors
  public reportError(error: Error, context?: string): void {
    this.handleError({
      message: `${context ? `[${context}] ` : ""}${error.message}`,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }
}

// Initialize the error handler
export const errorHandler = ErrorHandler.getInstance();

// Export a function to manually handle errors
export const handleError = (error: Error, context?: string): void => {
  errorHandler.reportError(error, context);
};

// Export a function to safely execute code with error handling
export const safeExecute = <T>(
  fn: () => T,
  fallback?: T,
  context?: string,
): T | undefined => {
  try {
    return fn();
  } catch (error) {
    handleError(error as Error, context);
    return fallback;
  }
};

// Export a function for async safe execution
export const safeExecuteAsync = async <T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: string,
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    handleError(error as Error, context);
    return fallback;
  }
};
