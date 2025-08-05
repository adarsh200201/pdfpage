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
    // Use centralized API configuration for consistency
    const apiUrl = import.meta.env.VITE_API_URL || "/api";
    const oauthUrl = apiUrl.startsWith('http')
      ? `${apiUrl}/auth/google`
      : `${apiUrl}/auth/google`;

    console.log('🔍 [AUTH] Redirecting to OAuth URL:', oauthUrl);
    console.log('🔍 [AUTH] API URL from env:', import.meta.env.VITE_API_URL);

    // Store the current location to redirect back after auth
    sessionStorage.setItem("authRedirectUrl", window.location.pathname);

    // Redirect to OAuth endpoint (uses proxy in production)
    window.location.href = oauthUrl;
  },

  /**
   * Handle auth callback via server-side proxy
   * All requests stay on pdfpage.in domain
   */
  handleAuthCallback: async (
    token: string,
  ): Promise<GoogleAuthResponse["user"]> => {
    // Use centralized API configuration for consistency
    const apiUrl = import.meta.env.VITE_API_URL || "/api";
    const fullUrl = apiUrl.startsWith('http')
      ? `${apiUrl}/auth/me`
      : `${apiUrl}/auth/me`;

    console.log('🔍 [AUTH] Making request to:', fullUrl);
    console.log('🔍 [AUTH] API URL from env:', import.meta.env.VITE_API_URL);
    console.log('🔍 [AUTH] Token length:', token?.length || 0);

    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('🔴 [AUTH] Request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl
      });
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
