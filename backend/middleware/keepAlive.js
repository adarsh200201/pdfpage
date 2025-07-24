// Keep-alive middleware to handle connection issues on Render/Cloud platforms

const keepAliveMiddleware = (req, res, next) => {
  // Set keep-alive headers for better connection stability
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=60');
  
  // Handle CORS preflight requests quickly
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(204).end();
  }
  
  // Add request timeout protection
  req.setTimeout(60000, () => {
    console.log('⚠️ Request timeout - keeping connection alive');
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        message: 'Request took too long to process',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};

module.exports = keepAliveMiddleware;
