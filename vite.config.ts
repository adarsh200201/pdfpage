import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createRequire } from "module";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 3000,
    hmr: {
      port: 24678, // Use a different port for HMR WebSocket
      host: "localhost",
      clientPort: 24678, // Ensure client connects to the right port
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
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
        // Don't bundle PDF.js worker files
        return id.includes("pdf.worker") || id.includes("pdf.worker.min");
      },
      output: {
        manualChunks: {
          // Separate chunk for PDF libraries to avoid conflicts
          "pdf-libs": ["pdfjs-dist", "react-pdf", "pdf-lib"],
        },
        // Ensure proper file names for assets
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.includes("pdf.worker")) {
            return "assets/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
        // Ensure proper file names for entry chunks
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
      },
    },
    // Increase chunk size warning limit for PDF libraries
    chunkSizeWarningLimit: 1000,
    // Ensure static assets are copied correctly
    assetsDir: "assets",
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
    exclude: [
      "pdfjs-dist/build/pdf.worker.js",
      "pdfjs-dist/build/pdf.worker.min.js",
      "pdfjs-dist/build/pdf.worker.mjs",
      "pdfjs-dist/build/pdf.worker.min.mjs",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      target: "es2020",
    },
  },
  worker: {
    format: "es",
    plugins: () => [],
    rollupOptions: {
      external: ["pdfjs-dist/build/pdf.worker.js"],
      output: {
        // Ensure worker files maintain proper extensions
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name && chunkInfo.name.includes("worker")) {
            return "[name].js";
          }
          return "[name]-[hash].js";
        },
      },
    },
  },
  define: {
    // Help PDF.js work better in Vite
    global: "globalThis",
    // Prevent PDF.js from trying to access undefined properties
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  assetsInclude: ["**/*.woff", "**/*.woff2"],
}));
