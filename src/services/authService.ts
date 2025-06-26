interface GoogleAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    profilePicture?: string;
    isPremium: boolean;
    dailyUploads: number;
    maxDailyUploads: number;
  };
}

export const authService = {
  /**
   * Initiate Google OAuth login
   */
  loginWithGoogle: () => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const googleOAuthUrl = `${apiUrl}/auth/google`;

      console.log("🔵 [AUTH-SERVICE] Starting Google OAuth flow");
      console.log("📍 [AUTH-SERVICE] Environment variables:");
      console.log("  VITE_API_URL:", import.meta.env.VITE_API_URL);
      console.log("  Fallback URL:", "http://localhost:5000/api");
      console.log("  Final API URL:", apiUrl);
      console.log("  Google OAuth URL:", googleOAuthUrl);
      console.log("  Current URL:", window.location.href);

      // Store the current location to redirect back after auth
      sessionStorage.setItem("authRedirectUrl", window.location.pathname);
      console.log(
        "💾 [AUTH-SERVICE] Stored redirect URL:",
        window.location.pathname,
      );

      // Test if we can access the URL (basic check)
      console.log("🔄 [AUTH-SERVICE] Attempting redirect to:", googleOAuthUrl);

      // Redirect to Google OAuth
      window.location.href = googleOAuthUrl;
    } catch (error) {
      console.error("🔴 [AUTH-SERVICE] Error in loginWithGoogle:", error);
      throw error;
    }
  },

  /**
   * Handle auth callback from Google
   */
  handleAuthCallback: async (
    token: string,
  ): Promise<GoogleAuthResponse["user"]> => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
