// Fix FullStory namespace conflict
if (typeof window !== "undefined") {
  window["_fs_namespace"] = "FS";
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/pdf-config"; // Configure PDF.js before any components load
import { initializePWA } from "./utils/pwa"; // PWA initialization

// Import debug utilities in development
if (import.meta.env.DEV) {
  import("./utils/debug-stats");
  import("./utils/proxy-verification").then(({ ProxyVerification }) => {
    // Verify server-side proxy setup in development
    ProxyVerification.generateSecurityReport().then((report) => {
      console.log("🔐 Server-Side Proxy Security Report:", report);
      if (report.securityScore === 100) {
        console.log("✅ Perfect: No backend URLs exposed to client");
      } else {
        console.warn("⚠️ Security recommendations:", report.recommendations);
      }
    });
  });
}

// Initialize PWA features
initializePWA();

createRoot(document.getElementById("root")!).render(<App />);
