import Cookies from 'js-cookie';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'email';
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

class AuthService {
  private baseUrl: string;
  private redirectUrl: string = '/';

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  /**
   * Set redirect URL for after authentication
   */
  setAuthRedirectUrl(url: string) {
    this.redirectUrl = url;
    localStorage.setItem('auth_redirect_url', url);
  }

  /**
   * Get redirect URL for after authentication
   */
  getAuthRedirectUrl(): string {
    const stored = localStorage.getItem('auth_redirect_url');
    if (stored) {
      localStorage.removeItem('auth_redirect_url');
      return stored;
    }
    return this.redirectUrl;
  }

  /**
   * Handle OAuth callback
   */
  async handleAuthCallback(token: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify authentication token');
      }

      const data: AuthResponse = await response.json();
      
      if (!data.success || !data.user) {
        throw new Error(data.message || 'Authentication verification failed');
      }

      // Store token in cookies and localStorage
      Cookies.set('auth_token', token, { expires: 7, secure: true, sameSite: 'strict' });
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data.user;
    } catch (error) {
      console.error('Auth callback error:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token && data.user) {
        // Store authentication data
        Cookies.set('auth_token', data.token, { expires: 7, secure: true, sameSite: 'strict' });
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token && data.user) {
        // Store authentication data
        Cookies.set('auth_token', data.token, { expires: 7, secure: true, sameSite: 'strict' });
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      
      if (token) {
        // Notify backend of logout
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all authentication data
      Cookies.remove('auth_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return Cookies.get('auth_token') || localStorage.getItem('auth_token');
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Verify token with backend
   */
  async verifyToken(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token is invalid, clear it
        this.logout();
        return null;
      }

      const data: AuthResponse = await response.json();
      
      if (data.success && data.user) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }

      return null;
    } catch (error) {
      console.error('Token verification error:', error);
      this.logout();
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<AuthResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.user) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  /**
   * Initiate Google OAuth login
   */
  initiateGoogleLogin(): void {
    // Store current URL for redirect after auth
    this.setAuthRedirectUrl(window.location.pathname);
    
    // Redirect to Google OAuth endpoint
    window.location.href = `${this.baseUrl}/auth/google`;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return await response.json();
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: newPassword }),
      });

      return await response.json();
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
