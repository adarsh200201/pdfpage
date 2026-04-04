import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "localhost",
    // Dev server port for frontend
    port: Number(process.env.VITE_DEV_SERVER_PORT) || 3001,
    strictPort: false,
    proxy: {
      '/api': {
        // Default backend for APIs in development is localhost:5002
        target: process.env.VITE_API_URL || 'http://localhost:5002',
        changeOrigin: true,
        // Backend is HTTP in dev, disable strict SSL verification for proxy
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxy -> Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Target -> Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force a single React instance for all imports (including JSX runtimes)
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react-dom/client": path.resolve(
        __dirname,
        "./node_modules/react-dom/client"
      ),
      "react/jsx-runtime": path.resolve(
        __dirname,
        "./node_modules/react/jsx-runtime.js"
      ),
      "react/jsx-dev-runtime": path.resolve(
        __dirname,
        "./node_modules/react/jsx-dev-runtime.js"
      ),
    },
    // Ensure React is never duplicated across dependencies
    dedupe: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: [
      // Ensure a single React instance is optimized and shared
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "react-helmet-async",
      "@tanstack/react-query",
    ],
    // Avoid optimizing any extra React builds from nested deps
    exclude: ["@builder.io/mitosis", "@builder.io/react"],
  },
});
