const express = require("express");
const router = express.Router();

// CORS debugging endpoint
router.all("/test", (req, res) => {
  const origin = req.headers.origin;
  const method = req.method;
  
  console.log(`🔍 CORS Debug - Method: ${method}, Origin: ${origin}`);
  console.log(`🔍 Headers:`, req.headers);
  
  // Set CORS headers explicitly
  if (origin && (
    origin === 'https://pdfpage.in' || 
    origin === 'https://pdfpagee.netlify.app' || 
    origin.includes('localhost')
  )) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "https://pdfpage.in");
  }
  
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Max-Age", "86400");
  
  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    console.log(`✅ CORS Preflight handled for ${origin}`);
    return res.sendStatus(200);
  }
  
  // Return debug information
  res.json({
    success: true,
    message: "CORS debug endpoint working",
    debug: {
      method: method,
      origin: origin,
      headers: req.headers,
      corsHeaders: {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
        'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }
  });
});

// Health check that mirrors auth/me structure but without auth
router.get("/health", (req, res) => {
  const origin = req.headers.origin;
  
  // Set CORS headers
  if (origin && (
    origin === 'https://pdfpage.in' || 
    origin === 'https://pdfpagee.netlify.app' || 
    origin.includes('localhost')
  )) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "https://pdfpage.in");
  }
  
  res.header("Access-Control-Allow-Credentials", "true");
  
  res.json({
    success: true,
    message: "CORS health check successful",
    origin: origin,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
