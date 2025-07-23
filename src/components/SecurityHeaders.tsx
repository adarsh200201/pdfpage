import { Helmet } from "react-helmet-async";

interface SecurityHeadersProps {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableCORS?: boolean;
  enableFeaturePolicy?: boolean;
  customCSP?: string;
  reportUri?: string;
}

const SecurityHeaders = ({
  enableCSP = true,
  enableHSTS = true,
  enableCORS = true,
  enableFeaturePolicy = true,
  customCSP,
  reportUri = "/csp-report"
}: SecurityHeadersProps) => {

  // Content Security Policy - More permissive to fix connection issues
  const defaultCSP = customCSP || [
    "default-src 'self' https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' https: data:",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: data: https:",
    "object-src 'none'",
    "frame-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https:",
    "connect-src 'self' https: wss: ws:",
    "worker-src 'self' blob: https:",
    "manifest-src 'self'",
    reportUri ? `report-uri ${reportUri}` : ""
  ].filter(Boolean).join("; ");

  // Permissions Policy (formerly Feature Policy)
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
    "payment=()",
    "picture-in-picture=()",
    "publickey-credentials-get=()",
    "screen-wake-lock=()",
    "sync-xhr=()",
    "usb=()",
    "web-share=()",
    "xr-spatial-tracking=()"
  ].join(", ");

  return (
    <Helmet>
      {/* Core Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

      {/* Content Security Policy - Temporarily disabled to fix API issues */}
      {enableCSP && false && (
        <meta httpEquiv="Content-Security-Policy" content={defaultCSP} />
      )}
      
      {/* HTTP Strict Transport Security */}
      {enableHSTS && (
        <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains; preload" />
      )}
      
      {/* Permissions Policy */}
      {enableFeaturePolicy && (
        <meta httpEquiv="Permissions-Policy" content={permissionsPolicy} />
      )}
      
      {/* Cross-Origin Policies */}
      {enableCORS && (
        <>
          <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
          <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
          <meta httpEquiv="Cross-Origin-Resource-Policy" content="same-site" />
        </>
      )}
      
      {/* Additional Security Headers */}
      <meta httpEquiv="X-Permitted-Cross-Domain-Policies" content="none" />
      <meta httpEquiv="X-Download-Options" content="noopen" />
      <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
      
      {/* Cache Control for Security */}
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
      
      {/* Prevent MIME Type Sniffing */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {/* Prevent Clickjacking */}
      <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
      
      {/* Prevent Information Disclosure */}
      <meta name="robots" content="noarchive, nosnippet" />
      
      {/* Server Information Hiding */}
      <meta httpEquiv="Server" content="" />
      <meta httpEquiv="X-Powered-By" content="" />
      
      {/* HPKP (HTTP Public Key Pinning) - Use with caution */}
      {/* <meta httpEquiv="Public-Key-Pins" content="pin-sha256='base64+primary=='; pin-sha256='base64+backup=='; max-age=5184000; includeSubDomains" /> */}
      
      {/* Expect-CT Header */}
      <meta httpEquiv="Expect-CT" content="max-age=86400, enforce, report-uri='/ct-report'" />
      
      {/* NEL (Network Error Logging) */}
      <meta httpEquiv="NEL" content='{"report_to":"default","max_age":31536000,"include_subdomains":true}' />
      
      {/* Report-To Header for CSP and other reporting */}
      <meta httpEquiv="Report-To" content='{"group":"default","max_age":31536000,"endpoints":[{"url":"/reports"}],"include_subdomains":true}' />
    </Helmet>
  );
};

export default SecurityHeaders;
