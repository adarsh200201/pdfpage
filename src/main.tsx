// Fix FullStory namespace conflict
if (typeof window !== "undefined") {
  window["_fs_namespace"] = "FS";
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/pdf-config"; // Configure PDF.js before any components load

// Import debug utilities in development
if (import.meta.env.DEV) {
  import("./utils/debug-stats");
}

createRoot(document.getElementById("root")!).render(<App />);
