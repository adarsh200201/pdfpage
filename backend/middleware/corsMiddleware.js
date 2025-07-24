// Dedicated CORS middleware for critical authentication endpoints

const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  console.log(`🌐 [CORS] ${req.method} ${req.path} from origin: ${origin}`);
  
  // Allow all origins that include pdfpage or localhost for development
  const allowedOrigins = [
    'https://pdfpage.in',
    'https://pdfpagee.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080'
  ];
  
  const isAllowed = allowedOrigins.includes(origin) || 
                   (origin && origin.includes('localhost')) ||
                   (origin && origin.includes('pdfpage'));
  
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://pdfpage.in');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
  res.header('Access-Control-Expose-Headers', 'Authorization, X-Total-Count');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log(`✅ [CORS] Preflight handled for ${origin}`);
    return res.sendStatus(200);
  }
  
  console.log(`✅ [CORS] Headers set for ${req.method} ${req.path}`);
  next();
};

module.exports = corsMiddleware;
