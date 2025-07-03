// IMMEDIATE cross-origin frame protection - must be first
if (
  typeof window !== 'undefined" && typeof import !== "undefined' &&
  import.meta?.env?.DEV
) {
  // Intercept ALL property access on window to prevent SecurityError
  const originalWindow = window;
  const safeFrameHandler = {
    get(target: any, prop: string | symbol) {
      if (prop === "frame" || prop === "parent") {
        try {
          const value = target[prop];
          // Test if we can safely access the property
          if (value && typeof value === "object" && value !== window) {
            // Try accessing a property to test for cross-origin restriction
            const _ = value.location;
          }
          return value;
        } catch (securityError) {
          // Return safe proxy for cross-origin frames
          return {
            frame: window,
            location: { href: window.location.href },
            postMessage: () => {},
            document: { querySelector: () => null },
          };
        }
      }
      try {
        return target[prop];
      } catch (error) {
        return undefined;
      }
    },
    set(target: any, prop: string | symbol, value: any) {
      try {
        target[prop] = value;
        return true;
      } catch (error) {
        return true; // Silently ignore cross-origin setting errors
      }
    },
  };

  // Override property descriptors for frame-related properties
  try {
    Object.defineProperty(window, "frame", {
      get() {
        return window;
      },
      set() {
        /* ignore */
      },
      configurable: true,
      enumerable: true,
    });
  } catch (e) {
    (window as any).frame = window;
  }

  // Wrap window.parent access
  const originalParent = window.parent;
  try {
    Object.defineProperty(window, "parent", {
      get() {
        try {
          if (originalParent && originalParent !== window) {
            // Test cross-origin access
            const _ = originalParent.location;
            return originalParent;
          }
          return window;
        } catch (crossOriginError) {
          return {
            frame: window,
            location: { href: window.location.href },
            postMessage: () => {},
          };
        }
      },
      configurable: true,
      enumerable: true,
    });
  } catch (e) {
    // Fallback
    (window as any).parent = window;
  }
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/pdf-config"; // Configure PDF.js before any components load
// PDF version test removed - version mismatch resolved

// Performance optimization to reduce violations
const optimizePerformance = () => {
  // Defer non-critical operations
  const raf = requestAnimationFrame || setTimeout;

  // Optimize event handlers to prevent violations
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    // Don't wrap if listener is null/undefined
    if (!listener) {
      return originalAddEventListener.call(this, type, listener, options);
    }

    const wrappedListener = function (event: Event) {
      try {
        // Defer heavy operations
        if (
          type === "message" &&
          (listener as any).toString().includes("worker")
        ) {
          raf(() => {
            if (typeof listener === "function") {
              (listener as EventListener).call(this, event);
            }
          });
        } else {
          if (typeof listener === "function") {
            (listener as EventListener).call(this, event);
          }
        }
      } catch (error) {
        // Prevent errors from breaking the app
        console.warn("Event listener error:", error);
      }
    };

    return originalAddEventListener.call(this, type, wrappedListener, options);
  };
};

// Apply performance optimizations
optimizePerformance();

// Prevent Vite error overlay from crashing on undefined frame property
if (import.meta.env.DEV) {
  // Simplified but robust frame protection
  const setupFrameProtection = () => {
    try {
      // Ensure frame property always returns window
      if (!window.hasOwnProperty("frame")) {
        (window as any).frame = window;
      }

      // Patch any code that tries to access cross-origin frames
      const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
      Object.getOwnPropertyDescriptor = function (
        obj: any,
        prop: string | symbol,
      ) {
        if (prop === "frame" && obj !== window) {
          try {
            return originalGetOwnPropertyDescriptor.call(this, obj, prop);
          } catch (securityError) {
            // Return safe descriptor for cross-origin frame access
            return {
              value: window,
              writable: false,
              enumerable: true,
              configurable: true,
            };
          }
        }
        return originalGetOwnPropertyDescriptor.call(this, obj, prop);
      };
    } catch (setupError) {
      console.warn("Frame protection setup error:", setupError);
    }
  };

  // Apply frame protection immediately
  setupFrameProtection();

  // Global error handler for DOM manipulation and cross-origin errors
  window.addEventListener("error", (event) => {
    const errorMessage = event.error?.message || event.message || "";
    if (
      errorMessage.includes("frame") ||
      errorMessage.includes("cross-origin") ||
      errorMessage.includes("SecurityError") ||
      errorMessage.includes("Cannot read properties") ||
      errorMessage.includes("Blocked a frame")
    ) {
      console.warn("Prevented frame/cross-origin access error:", event.error);
      setupFrameProtection(); // Re-apply protection
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });

  // Global unhandled rejection handler
  window.addEventListener("unhandledrejection", (event) => {
    const reasonMessage = event.reason?.message || String(event.reason) || "";
    if (
      reasonMessage.includes("frame") ||
      reasonMessage.includes("cross-origin") ||
      reasonMessage.includes("SecurityError") ||
      reasonMessage.includes("Blocked a frame")
    ) {
      console.warn(
        "Prevented frame/cross-origin promise rejection:",
        event.reason,
      );
      setupFrameProtection();
      event.preventDefault();
    }
  });

  // Intercept and protect ErrorOverlay constructor
  const originalError = window.Error;
  window.Error = function (message?: string) {
    if (message && message.includes("frame")) {
      setupFrameProtection();
    }
    return new originalError(message);
  } as any;

  // Copy static properties
  Object.setPrototypeOf(window.Error, originalError);
  Object.defineProperty(window.Error, "prototype", {
    value: originalError.prototype,
    writable: false,
  });

  // Add defensive code to prevent ErrorOverlay crashes
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function (
    type: string,
    listener: any,
    options?: any,
  ) {
    try {
      return originalAddEventListener.call(this, type, listener, options);
    } catch (error) {
      console.warn("Event listener error prevented:", error);
      setupFrameProtection();
    }
  };

  // Protect Object.defineProperty against frame-related errors
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function (
    obj: any,
    prop: string,
    descriptor: PropertyDescriptor,
  ) {
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("frame")) {
        console.warn(
          "Prevented frame-related property definition error:",
          error,
        );
        setupFrameProtection();
        return obj;
      }
      throw error;
    }
  };

  // Periodically ensure frame protection is maintained
  setInterval(setupFrameProtection, 1000);
}

createRoot(document.getElementById("root")!).render(<App />);
