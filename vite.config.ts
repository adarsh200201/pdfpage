import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["pdfjs-dist", "pdfjs-dist/build/pdf.worker.min.js"],
    exclude: ["pdfjs-dist/build/pdf.worker.js"],
  },
  worker: {
    format: "es",
  },
  define: {
    // Help PDF.js work better in Vite
    global: "globalThis",
  },
  assetsInclude: ["**/*.woff", "**/*.woff2"],
}));
