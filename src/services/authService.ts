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
   * Initiate Google OAuth login
   */
  loginWithGoogle: () => {
    const apiUrl = import.meta.env.DEV
      ? "/api" // Use proxy in development
      : import.meta.env.VITE_API_URL || "https://pdfpage.onrender.com/api";
    const googleOAuthUrl = `${apiUrl}/auth/google`;

    // Redirect to Google OAuth

    // Store the current location to redirect back after auth
    sessionStorage.setItem("authRedirectUrl", window.location.pathname);

    // Redirect to Google OAuth
    window.location.href = googleOAuthUrl;
  },

  /**
   * Handle auth callback from Google
   */
  handleAuthCallback: async (
    token: string,
  ): Promise<GoogleAuthResponse["user"]> => {
    const apiUrl = import.meta.env.DEV
      ? "/api" // Use proxy in development
      : import.meta.env.VITE_API_URL || "https://pdfpage.onrender.com/api";

    const response = await fetch(`${apiUrl}/auth/me`, {
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
