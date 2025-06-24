import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createRequire } from "module";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    proxy: {
      "/api": {
        target: "https://pdfpage.onrender.com",
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url,
            );
          });
        },
      },
    },
  },
  plugins: [react()],
  ssr: {
    noExternal: ["pdf-lib", "pako"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    commonjsOptions: {
      include: [/pdf-lib/, /pako/, /pdfjs-dist/, /react-pdf/, /node_modules/],
    },
    rollupOptions: {
      external: (id) => {
        // Don't bundle PDF.js worker - let it be loaded externally
        return id.includes("pdf.worker");
      },
    },
  },
  optimizeDeps: {
    include: [
      "pdfjs-dist",
      "pdf-lib",
      "pako",
      "@pdf-lib/standard-fonts",
      "@pdf-lib/upng",
      "react-pdf",
    ],
    exclude: ["pdfjs-dist/build/pdf.worker.js"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  worker: {
    format: "es",
    plugins: () => [],
  },
  define: {
    // Help PDF.js work better in Vite
    global: "globalThis",
  },
  assetsInclude: ["**/*.woff", "**/*.woff2"],
}));
