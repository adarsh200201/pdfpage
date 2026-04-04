const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

// Vite config in CommonJS so Netlify/Node can require it directly
// and avoid the TypeScript/esbuild bundling step that was failing.
module.exports = defineConfig({
  server: {
    host: "localhost",
    port: Number(process.env.VITE_DEV_SERVER_PORT) || 3001,
    strictPort: false,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5002",
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Proxy -> Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Target -> Proxy response:", proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
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
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "react-helmet-async",
      "@tanstack/react-query",
    ],
    exclude: ["@builder.io/mitosis", "@builder.io/react"],
  },
});
