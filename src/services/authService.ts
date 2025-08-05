interface GoogleAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    profilePicture?: string;
    isPremium: boolean;
    // Daily upload limits removed - unlimited usage for all users
  };
}

export const authService = {
  /**
   * Initiate Google OAuth login via server-side proxy
   * In production: Browser calls /api/auth/google -> Netlify proxies to backend
   * User never sees or interacts with backend domain
   */
  loginWithGoogle: () => {
    // Use local backend for development, production backend for production
    const isDevelopment = window.location.hostname === 'localhost';
    const baseUrl = isDevelopment
      ? "http://localhost:5000"
      : "https://pdf-backend-935131444417.asia-south1.run.app";

    // Store the current location to redirect back after auth
    sessionStorage.setItem("authRedirectUrl", window.location.pathname);

    // Redirect to backend OAuth endpoint (backend handles Google OAuth flow)
    window.location.href = `${baseUrl}/api/auth/google`;
  },

  /**
   * Handle auth callback via server-side proxy
   * All requests stay on pdfpage.in domain
   */
  handleAuthCallback: async (
    token: string,
  ): Promise<GoogleAuthResponse["user"]> => {
    // Use local backend for development, production backend for production
    const isDevelopment = window.location.hostname === 'localhost';
    const baseUrl = isDevelopment
      ? "http://localhost:5000"
      : "https://pdf-backend-935131444417.asia-south1.run.app";
    const apiUrl = `${baseUrl}/api/auth/me`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const data = await response.json();
    return data.user;
  },

  /**
   * Get redirect URL after successful auth
   */
  getAuthRedirectUrl: (): string => {
    const redirectUrl = sessionStorage.getItem("authRedirectUrl") || "/";
    sessionStorage.removeItem("authRedirectUrl");
    return redirectUrl;
  },
};

export default authService;
