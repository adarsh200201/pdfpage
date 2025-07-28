#!/usr/bin/env node

// Simple server status check
const http = require("http");
const https = require("https");

async function checkServerStatus() {
  console.log("🔍 Checking backend server status...\n");

  const endpoints = [
    "https://pdf-backend-935131444417.asia-south1.run.app/api/health",
    "https://pdf-backend-935131444417.asia-south1.run.app/api/pdf/tools",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Origin: "https://pdfpagee.netlify.app",
          "Content-Type": "application/json",
        },
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`CORS headers:`, {
        "access-control-allow-origin": response.headers.get(
          "access-control-allow-origin",
        ),
        "access-control-allow-credentials": response.headers.get(
          "access-control-allow-credentials",
        ),
        "access-control-allow-methods": response.headers.get(
          "access-control-allow-methods",
        ),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Response:`, data);
      }
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }

    console.log("---");
  }
}

if (require.main === module) {
  checkServerStatus();
}
