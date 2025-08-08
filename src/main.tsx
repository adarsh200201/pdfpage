// Fix FullStory namespace conflict
if (typeof window !== "undefined") {
  window["_fs_namespace"] = "FS_PDF";
  // Disable FullStory completely to prevent conflicts
  window["FS_DISABLE"] = true;
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import AppMinimal from "./AppMinimal.tsx";
import ErrorBoundarySimple from "./ErrorBoundarySimple.tsx";
import "./index.css";
// import "./lib/pdf-config"; // Configure PDF.js before any components load - TEMPORARILY DISABLED
import { initializePWA } from "./utils/pwa"; // PWA initialization

// Import debug utilities in development - DISABLED for MIME type debugging
// if (import.meta.env.DEV) {
//   import("./utils/debug-stats");
//   import("./utils/proxy-verification").then(({ ProxyVerification }) => {
//     // Verify server-side proxy setup in development
//     ProxyVerification.generateSecurityReport().then((report) => {
//       console.log("🔐 Server-Side Proxy Security Report:", report);
//       if (report.securityScore === 100) {
//         console.log("✅ Perfect: No backend URLs exposed to client");
//       } else {
//         console.warn("⚠️ Security recommendations:", report.recommendations);
//       }
//     });
//   });
// }

// Initialize PWA features
initializePWA();

// App switcher for debugging
const useMinimalApp = window.location.search.includes('minimal=true');
const AppComponent = useMinimalApp ? AppMinimal : App;

// Get root element
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

// Create React 18 root and render
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <ErrorBoundarySimple>
      <AppComponent />
    </ErrorBoundarySimple>
  </React.StrictMode>
);
