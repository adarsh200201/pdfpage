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
      esmExternals: true
    },
    rollupOptions: {
      external: [
        /^node:.*/, // Exclude Node.js built-ins
        'fs',
        'path',
        'crypto',
        'stream',
        'util',
        'os',
        'child_process',
        'worker_threads',
        'zlib',
        'http',
        'https',
        'url',
        'assert',
        'buffer',
        'constants',
        'events',
        'module',
        'net',
        'process',
        'querystring',
        'string_decoder',
        'timers',
        'tls',
        'tty',
        'vm',
        'dns',
        'dgram',
        'punycode',
        'readline',
        'repl',
        'v8',
        'worker_threads',
        'zlib',
        'pdfjs-dist/build/pdf.worker',
        'pdfjs-dist/build/pdf.worker.min',
        'pdfjs-dist/legacy/build/pdf.worker',
        'pdfjs-dist/legacy/build/pdf.worker.min'
      ],
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('pdf-lib') || id.includes('pdfjs-dist') || id.includes('react-pdf')) {
              return 'pdf-libs';
            }
            return 'vendor';
          }
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react-pdf': 'ReactPDF',
          'pdfjs-dist': 'pdfjsLib',
          'pdf-lib': 'PDFLib'
        }
      },
    },
    // Increase chunk size warning limit for PDF libraries
    chunkSizeWarningLimit: 1000,
    // Ensure static assets are copied correctly
    assetsDir: "assets",
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-pdf",
      "pdfjs-dist/legacy/build/pdf",
      "pdfjs-dist/legacy/build/pdf.worker.entry",
      "pdf-lib",
      "pako",
      "@pdf-lib/standard-fonts",
      "@pdf-lib/upng",
      "fabric"
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
        'process.env.NODE_ENV': '"production"',
      },
      target: 'es2020',
      loader: {
        '.js': 'jsx',
        '.mjs': 'jsx'
      },
      jsx: 'automatic',
      jsxDev: false,
      jsxImportSource: 'react',
      treeShaking: true,
      minify: true,
      minifyWhitespace: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      chunkNames: 'chunks/[name]-[hash]',
      assetNames: 'assets/[name]-[hash]',
      entryNames: '[name]-[hash]',
      platform: 'browser',
      format: 'esm',
      mainFields: ['module', 'jsnext:main', 'jsnext'],
      conditions: ['import', 'module', 'browser', 'default']
    }
  },
  worker: {
    format: 'es',
    plugins: () => [],
    rollupOptions: {
      external: [
        'pdfjs-dist/build/pdf.worker',
        'pdfjs-dist/legacy/build/pdf.worker',
        'pdfjs-dist/legacy/build/pdf.worker.entry',
        'pdfjs-dist/legacy/build/pdf.worker.min',
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        'pdf-lib',
        'pako',
        '@pdf-lib/standard-fonts',
        '@pdf-lib/upng',
        'react-pdf'
      ],
      output: {
        entryFileNames: 'workers/[name].js',
        chunkFileNames: 'workers/[name]-[hash].js',
        assetFileNames: 'assets/workers/[name]-[hash][extname]',
        globals: {
          'pdfjs-dist': 'pdfjsLib',
          'pdf-lib': 'PDFLib',
          'react-pdf': 'ReactPDF'
        }
      }
    }
  },
  define: {
    // Help PDF.js work better in Vite
    global: "globalThis",
    // Prevent PDF.js from trying to access undefined properties
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  assetsInclude: ["**/*.woff", "**/*.woff2"],
}));
