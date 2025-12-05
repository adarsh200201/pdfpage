import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "localhost",
    // Dev server port used by the preview iframe. Use 48752 in local environment.
    port: Number(process.env.VITE_DEV_SERVER_PORT) || 48752,
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
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
      "react-helmet-async",
      "@tanstack/react-query"
    ],
    exclude: [],
  },
});
