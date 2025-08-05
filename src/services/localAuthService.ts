interface LocalUser {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  profilePicture?: string;
  totalUploads: number;
}

interface AuthResponse {
  user: LocalUser;
  token: string;
  conversion?: any;
}

/**
 * Local authentication service that works without backend dependency
 * This bypasses the 403 backend issue for testing OAuth functionality
 */
export const localAuthService = {
  /**
   * Simulate Google OAuth login for testing
   */
  simulateGoogleLogin: async (email: string): Promise<AuthResponse> => {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        const mockUser: LocalUser = {
          id: `user_${Date.now()}`,
          email: email,
          name: email === "adarshkumar200201@gmail.com" ? "Adarsh Kumar" : "Test User",
          isPremium: false,
          profilePicture: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
          totalUploads: 0
        };

        const mockToken = btoa(JSON.stringify({
          userId: mockUser.id,
          email: mockUser.email,
          exp: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
        }));

        resolve({
          user: mockUser,
          token: mockToken,
          conversion: null
        });
      }, 1500);
    });
  },

  /**
   * Simulate user data fetch
   */
  fetchUserData: async (token: string): Promise<LocalUser | null> => {
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.exp < Date.now()) {
        return null; // Token expired
      }

      return {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.email === "adarshkumar200201@gmail.com" ? "Adarsh Kumar" : "Test User",
        isPremium: false,
        totalUploads: 0
      };
    } catch {
      return null;
    }
  },

  /**
   * Test OAuth readiness without backend dependency
   */
  testOAuthReadiness: async (): Promise<{
    isReady: boolean;
    issues: string[];
    summary: string;
  }> => {
    const issues: string[] = [];
    
    // Test browser environment
    if (typeof window === 'undefined') {
      issues.push('Window object not available');
    }
    
    if (typeof localStorage === 'undefined') {
      issues.push('LocalStorage not available');
    }

    // Test URL construction
    try {
      new URL('https://accounts.google.com/oauth/authorize');
    } catch {
      issues.push('URL constructor not working');
    }

    const isReady = issues.length === 0;
    const summary = isReady 
      ? '✅ Local OAuth simulation ready'
      : `❌ ${issues.length} issues found`;

    return { isReady, issues, summary };
  },

  /**
   * Generate Google OAuth URL (simulation)
   */
  generateGoogleOAuthUrl: (email?: string): string => {
    const params = new URLSearchParams({
      client_id: 'demo-client-id',
      redirect_uri: `${window.location.origin}/auth/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      state: btoa(JSON.stringify({ 
        redirect: window.location.pathname,
        email: email || 'adarshkumar200201@gmail.com',
        timestamp: Date.now()
      }))
    });

    return `https://accounts.google.com/oauth/authorize?${params.toString()}`;
  },

  /**
   * Validate email for OAuth testing
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

export default localAuthService;
