import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/pdf-config"; // Configure PDF.js before any components load

// Prevent Vite error overlay from crashing on undefined frame property
if (import.meta.env.DEV) {
  // Global error handler for DOM manipulation errors
  window.addEventListener("error", (event) => {
    if (
      event.error?.message?.includes(
        "Cannot read properties of undefined (reading 'frame')",
      )
    ) {
      console.warn("Prevented frame access error:", event.error);
      event.preventDefault();
      return false;
    }
  });

  // Global unhandled rejection handler
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason?.message?.includes("frame")) {
      console.warn("Prevented frame-related promise rejection:", event.reason);
      event.preventDefault();
    }
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
    }
  };

  // Prevent frame access errors by providing safe defaults
  Object.defineProperty(window, "parent", {
    get() {
      return window.self || { frame: window };
    },
    configurable: true,
  });

  // Add safe frame property to window if needed
  if (typeof (window as any).frame === "undefined") {
    (window as any).frame = window;
  }

  // Specifically protect against ErrorOverlay frame access
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
        return obj; // Return the object safely
      }
      throw error;
    }
  };
}

createRoot(document.getElementById("root")!).render(<App />);
