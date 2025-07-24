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
    // Use proxy URL - Netlify handles the backend forwarding
    const googleOAuthUrl = import.meta.env.DEV
      ? "http://localhost:5000/api/auth/google"
      : "/api/auth/google";

    // Store the current location to redirect back after auth
    sessionStorage.setItem("authRedirectUrl", window.location.pathname);

    // Redirect to server-side proxy (Netlify handles the backend forwarding)
    window.location.href = googleOAuthUrl;
  },

  /**
   * Handle auth callback via server-side proxy
   * All requests stay on pdfpage.in domain
   */
  handleAuthCallback: async (
    token: string,
  ): Promise<GoogleAuthResponse["user"]> => {
    // Use proxy URL - Netlify handles the backend forwarding
    const apiUrl = import.meta.env.DEV
      ? "http://localhost:5000/api/auth/me"
      : "/api/auth/me";

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
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
