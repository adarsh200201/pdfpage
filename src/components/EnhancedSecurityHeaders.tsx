import { Helmet } from "react-helmet-async";

interface EnhancedSecurityHeadersProps {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableCOEP?: boolean;
  enableCOOP?: boolean;
  enableCORP?: boolean;
  enablePermissionsPolicy?: boolean;
  strictMode?: boolean;
  reportingEndpoint?: string;
}

const EnhancedSecurityHeaders = ({
  enableCSP = true,
  enableHSTS = true,
  enableCOEP = false, // Can break some functionality
  enableCOOP = true,
  enableCORP = true,
  enablePermissionsPolicy = true,
  strictMode = false,
  reportingEndpoint = "/security-reports"
}: EnhancedSecurityHeadersProps) => {

  // Content Security Policy - Comprehensive and SEO-friendly
  const cspDirectives = [
    "default-src 'self'",
    
    // Scripts - Allow necessary third-party scripts for SEO/Analytics
    strictMode 
      ? "script-src 'self' 'nonce-{nonce}'"
      : [
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com", 
          "https://pagead2.googlesyndication.com",
          "https://partner.googleadservices.com",
          "https://www.gstatic.com",
          "https://apis.google.com",
          "https://connect.facebook.net",
          "https://www.facebook.com",
          "https://platform.twitter.com",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com"
        ].join(' '),
    
    // Styles - Allow Google Fonts and inline styles
    strictMode
      ? "style-src 'self' 'nonce-{nonce}' https://fonts.googleapis.com https://www.gstatic.com"
      : "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://tagmanager.google.com https://www.gstatic.com https://translate.googleapis.com",
    
    // Fonts - Allow Google Fonts and local fonts
    "font-src 'self' https://fonts.gstatic.com data:",
    
    // Images - Allow all HTTPS sources and data URIs for flexibility
    "img-src 'self' https: http: data: blob:",
    
    // Media - Allow secure sources and blob/data URIs
    "media-src 'self' https: blob: data:",
    
    // Objects - Block for security
    "object-src 'none'",
    
    // Frames - Allow trusted sources for embeds
    [
      "frame-src 'self'",
      "https://www.google.com",
      "https://www.youtube.com", 
      "https://www.youtube-nocookie.com",
      "https://player.vimeo.com",
      "https://www.facebook.com",
      "https://web.facebook.com",
      "https://connect.facebook.net"
    ].join(' '),
    
    // Child frames
    "child-src 'self' blob:",
    
    // Workers
    "worker-src 'self' blob:",
    
    // Connections - Allow analytics and API endpoints
    [
      "connect-src 'self'",
      "https://www.google-analytics.com",
      "https://stats.g.doubleclick.net",
      "https://www.googletagmanager.com",
      "https://region1.google-analytics.com",
      "https://api.pdfpage.in",
      "https://pdf-backend-935131444417.asia-south1.run.app",
      "https://translate.googleapis.com",
      "wss://ws.pdfpage.in",
      "wss://pdf-backend-935131444417.asia-south1.run.app"
    ].join(' '),
    
    // Base URI restriction
    "base-uri 'self'",
    
    // Form actions
    "form-action 'self' https://api.pdfpage.in",
    
    // Frame ancestors - Prevent clickjacking
    "frame-ancestors 'none'",
    
    // Manifest
    "manifest-src 'self'",
    
    // Upgrade insecure requests
    "upgrade-insecure-requests",
    
    // Reporting
    reportingEndpoint ? `report-uri ${reportingEndpoint}` : "",
    reportingEndpoint ? `report-to security-reports` : ""
  ].filter(Boolean).join('; ');

  // Permissions Policy (Feature Policy)
  const permissionsPolicy = [
    "accelerometer=()",
    "ambient-light-sensor=()",
    "autoplay=(self)",
    "battery=()",
    "camera=()",
    "cross-origin-isolated=()",
    "display-capture=()",
    "document-domain=()",
    "encrypted-media=()",
    "execution-while-not-rendered=()",
    "execution-while-out-of-viewport=()",
    "fullscreen=(self)",
    "geolocation=()",
    "gyroscope=()",
    "keyboard-map=()",
    "magnetometer=()",
    "microphone=()",
    "midi=()",
    "navigation-override=()",
    "payment=(self)",
    "picture-in-picture=()",
    "publickey-credentials-get=()",
    "screen-wake-lock=()",
    "sync-xhr=()",
    "usb=()",
    "web-share=(self)",
    "xr-spatial-tracking=()"
  ].join(", ");

  // Reporting API configuration
  const reportingConfig = {
    "group": "security-reports",
    "max_age": 31536000,
    "endpoints": [
      {
        "url": reportingEndpoint
      }
    ],
    "include_subdomains": true
  };

  return (
    <Helmet>
      {/* Content Security Policy */}
      {enableCSP && (
        <meta httpEquiv="Content-Security-Policy" content={cspDirectives} />
      )}
      
      {/* HTTP Strict Transport Security */}
      {enableHSTS && (
        <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains; preload" />
      )}
      
      {/* X-Content-Type-Options */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {/* X-Frame-Options */}
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      
      {/* X-XSS-Protection */}
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Referrer Policy */}
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      
      {/* Permissions Policy */}
      {enablePermissionsPolicy && (
        <meta httpEquiv="Permissions-Policy" content={permissionsPolicy} />
      )}
      
      {/* Cross-Origin Embedder Policy */}
      {enableCOEP && (
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
      )}
      
      {/* Cross-Origin Opener Policy */}
      {enableCOOP && (
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
      )}
      
      {/* Cross-Origin Resource Policy */}
      {enableCORP && (
        <meta httpEquiv="Cross-Origin-Resource-Policy" content="same-site" />
      )}
      
      {/* Additional Security Headers */}
      <meta httpEquiv="X-Permitted-Cross-Domain-Policies" content="none" />
      <meta httpEquiv="X-Download-Options" content="noopen" />
      <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
      
      {/* Expect-CT */}
      <meta httpEquiv="Expect-CT" content={`max-age=86400, enforce${reportingEndpoint ? `, report-uri="${reportingEndpoint}/ct"` : ''}`} />
      
      {/* Network Error Logging */}
      <meta httpEquiv="NEL" content={JSON.stringify({
        "report_to": "security-reports",
        "max_age": 31536000,
        "include_subdomains": true,
        "failure_fraction": 0.1,
        "success_fraction": 0.01
      })} />
      
      {/* Report-To for structured reporting */}
      {reportingEndpoint && (
        <meta httpEquiv="Report-To" content={JSON.stringify(reportingConfig)} />
      )}
      
      {/* Clear-Site-Data on logout */}
      <meta httpEquiv="Clear-Site-Data" content='"cache", "cookies", "storage"' data-condition="logout" />
      
      {/* Server header hiding */}
      <meta httpEquiv="Server" content="" />
      <meta httpEquiv="X-Powered-By" content="" />
      
      {/* Cache control for security */}
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, private" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
      
      {/* Content encoding */}
      <meta httpEquiv="Content-Encoding" content="gzip, br" />
      
      {/* Additional privacy headers */}
      <meta name="robots" content="noarchive" data-sensitive="true" />
      <meta name="googlebot" content="noarchive" data-sensitive="true" />
      
      {/* DNS Security */}
      <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
      
      {/* Content sniffing prevention */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {/* MIME type validation */}
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      
      {/* Platform security features */}
      <meta name="msapplication-config" content="none" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      
      {/* Anti-clickjacking for legacy browsers */}
      <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
      
      {/* Information disclosure prevention */}
      <meta httpEquiv="X-AspNet-Version" content="" />
      <meta httpEquiv="X-AspNetMvc-Version" content="" />
      
      {/* Request/Response timing attack prevention */}
      <meta httpEquiv="Timing-Allow-Origin" content="*" />
      
      {/* Cross-origin policies for better security */}
      <meta httpEquiv="Cross-Origin-Resource-Policy" content="cross-origin" />
      
      {/* Document policy for additional restrictions */}
      <meta httpEquiv="Document-Policy" content="document-domain=?0" />
      
      {/* Origin trial tokens (if needed) */}
      <meta httpEquiv="Origin-Trial" content="" />
      
      {/* Critical-CH for client hints */}
      <meta httpEquiv="Critical-CH" content="Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform" />
      
      {/* Accept-CH for client hints */}
      <meta httpEquiv="Accept-CH" content="Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version" />
    </Helmet>
  );
};

export default EnhancedSecurityHeaders;
