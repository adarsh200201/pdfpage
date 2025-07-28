/**
 * Server-Side Proxy Verification Utility
 * Ensures that all API calls go through Netlify proxy and never expose backend URLs
 */

interface ProxyVerificationResult {
  isServerSideProxy: boolean;
  requestUrl: string;
  proxyStatus: "active" | "bypassed" | "failed";
  securityLevel: "secure" | "exposed" | "unknown";
}

export class ProxyVerification {
  /**
   * Verify that the Google OAuth flow uses server-side proxy
   */
  static async verifyGoogleOAuthProxy(): Promise<ProxyVerificationResult> {
    const oauthUrl = import.meta.env.DEV
      ? "http://localhost:5000/api/auth/google"
      : "https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google";

    try {
      // Test the proxy URL without actually triggering OAuth
      const response = await fetch(oauthUrl, {
        method: "HEAD",
        redirect: "manual", // Don't follow redirects, just check if proxy works
      });

      return {
        isServerSideProxy: !oauthUrl.includes("render.com"),
        requestUrl: oauthUrl,
        proxyStatus:
          response.status === 302 || response.status === 200
            ? "active"
            : "failed",
        securityLevel:
          oauthUrl.startsWith("/") ||
          oauthUrl.startsWith(window.location.origin)
            ? "secure"
            : "exposed",
      };
    } catch (error) {
      return {
        isServerSideProxy: false,
        requestUrl: oauthUrl,
        proxyStatus: "failed",
        securityLevel: "unknown",
      };
    }
  }

  /**
   * Verify that no backend URLs are exposed in the client bundle
   */
  static getExposedBackendReferences(): string[] {
    const exposedUrls: string[] = [];

    // Check for any hardcoded backend URLs in global scope
    const scriptContent = document.documentElement.innerHTML;
    const backendUrlPattern = /https:\/\/pdfpage-app\.onrender\.com/gi;
    const matches = scriptContent.match(backendUrlPattern);

    if (matches) {
      exposedUrls.push(...matches);
    }

    return exposedUrls;
  }

  /**
   * Generate a security report for the current setup
   */
  static async generateSecurityReport(): Promise<{
    serverSideProxy: ProxyVerificationResult;
    exposedUrls: string[];
    securityScore: number;
    recommendations: string[];
  }> {
    const proxyResult = await this.verifyGoogleOAuthProxy();
    const exposedUrls = this.getExposedBackendReferences();

    let securityScore = 100;
    const recommendations: string[] = [];

    // Deduct points for security issues
    if (proxyResult.securityLevel === "exposed") {
      securityScore -= 40;
      recommendations.push("Backend URLs are exposed to client");
    }

    if (proxyResult.proxyStatus === "failed") {
      securityScore -= 30;
      recommendations.push("Server-side proxy is not functioning");
    }

    if (exposedUrls.length > 0) {
      securityScore -= 20;
      recommendations.push(
        `${exposedUrls.length} backend URL(s) found in client code`,
      );
    }

    if (securityScore === 100) {
      recommendations.push(
        "✅ Perfect server-side proxy setup - no backend URLs exposed",
      );
    }

    return {
      serverSideProxy: proxyResult,
      exposedUrls,
      securityScore,
      recommendations,
    };
  }
}

// Development helper for testing
if (import.meta.env.DEV) {
  (window as any).proxyVerification = ProxyVerification;
}
