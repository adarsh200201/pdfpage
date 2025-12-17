import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { fetchWithRetry, getBackendUrl } from '@/lib/api-config';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'email';
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isCheckingAuth = useRef(false);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    checkAuthState();
  }, []);

  // Check authentication state
  const checkAuthState = async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth.current) {
      console.log('⏳ [AUTH-CONTEXT] Auth check already in progress, skipping...');
      return;
    }

    isCheckingAuth.current = true;

    try {
      setIsLoading(true);

      console.log('🔍 [AUTH-CONTEXT] Checking authentication state...');

      // First check for stored user data (for immediate UI update)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('👤 [AUTH-CONTEXT] Found stored user data:', userData);
          setUser(userData);
        } catch (error) {
          console.error('❌ [AUTH-CONTEXT] Error parsing stored user data:', error);
          localStorage.removeItem('user');
        }
      }

      // Check for stored auth token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('⚠️ [AUTH-CONTEXT] No auth token found');
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('🔑 [AUTH-CONTEXT] Token found, verifying with backend...');

      // Verify token with backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Always read the response body once
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('❌ [AUTH-CONTEXT] Failed to parse response:', parseError);
        responseData = null;
      }

      if (response.ok && responseData) {
        console.log('✅ [AUTH-CONTEXT] Token verified, user data:', responseData);

        if (responseData.user) {
          setUser(responseData.user);
          // Update stored user data
          localStorage.setItem('user', JSON.stringify(responseData.user));
        }
      } else {
        console.log('❌ [AUTH-CONTEXT] Token verification failed, clearing auth data');
        // Token is invalid, remove it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [AUTH-CONTEXT] Auth check failed:', error);
      // Don't clear auth data on network errors, just log the error
      if (error.name !== 'TypeError' && error.message !== 'Failed to fetch') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
      isCheckingAuth.current = false;
      console.log('🏁 [AUTH-CONTEXT] Auth check complete');
    }
  };

  // Email/Password Login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 [AUTH-CONTEXT] Attempting login...');

      const response = await fetchWithRetry('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 [AUTH-CONTEXT] Login response received, status:', response.status);

      // Read response body only once and handle different content types
      let data;
      const contentType = response.headers.get('content-type');

      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          console.log('📋 [AUTH-CONTEXT] Response data parsed successfully');
        } else {
          // Handle non-JSON responses
          const textResponse = await response.text();
          console.warn('⚠️ [AUTH-CONTEXT] Non-JSON response received:', textResponse);
          data = { message: textResponse || 'Unknown error occurred' };
        }
      } catch (parseError) {
        console.error('❌ [AUTH-CONTEXT] Failed to parse login response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('❌ [AUTH-CONTEXT] Login failed with status:', response.status, 'data:', data);

        // Handle different error response formats
        let errorMessage = 'Login failed';
        if (data) {
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.errors && Array.isArray(data.errors)) {
            // Handle validation errors
            errorMessage = data.errors.map(err => err.msg || err.message).join(', ');
          }
        }

        throw new Error(errorMessage);
      }

      console.log('✅ [AUTH-CONTEXT] Login successful');

      // Store token and user data
      if (data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        console.error('❌ [AUTH-CONTEXT] Login response missing token or user data');
        throw new Error('Invalid login response format');
      }
    } catch (error) {
      console.error('❌ [AUTH-CONTEXT] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Login
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);

      // For OAuth, we need to redirect directly to backend (not through proxy)
      // because OAuth requires browser redirects, not server-to-server
      let authUrl = '/api/auth/google';
      // In production, always use the full backend URL for OAuth (never relative)
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD && import.meta.env.VITE_API_URL) {
        authUrl = `${import.meta.env.VITE_API_URL}/api/auth/google`;
      }
      console.log('🔐 [AUTH-CONTEXT] Redirecting to Google OAuth:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // Register new user
  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      console.log('📝 [AUTH-CONTEXT] Attempting registration...');

      const response = await fetchWithRetry('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      console.log('📡 [AUTH-CONTEXT] Registration response received, status:', response.status);

      // Read response body only once and handle different content types
      let data;
      const contentType = response.headers.get('content-type');

      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          console.log('📋 [AUTH-CONTEXT] Registration response data parsed successfully');
        } else {
          // Handle non-JSON responses
          const textResponse = await response.text();
          console.warn('⚠️ [AUTH-CONTEXT] Non-JSON response received:', textResponse);
          data = { message: textResponse || 'Unknown error occurred' };
        }
      } catch (parseError) {
        console.error('❌ [AUTH-CONTEXT] Failed to parse register response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('❌ [AUTH-CONTEXT] Registration failed with status:', response.status, 'data:', data);

        // Handle different error response formats
        let errorMessage = 'Registration failed';
        if (data) {
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.errors && Array.isArray(data.errors)) {
            // Handle validation errors
            errorMessage = data.errors.map(err => err.msg || err.message).join(', ');
          }
        }

        throw new Error(errorMessage);
      }

      console.log('✅ [AUTH-CONTEXT] Registration successful');

      // Store token and user data
      if (data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        console.error('❌ [AUTH-CONTEXT] Registration response missing token or user data');
        throw new Error('Invalid registration response format');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Profile update failed');
      }

      const updatedUser = await response.json();
      setUser(updatedUser.user);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Notify backend of logout
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of backend response
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  // Refresh auth state (useful after login)
  const refreshAuth = async () => {
    // Only refresh if not already checking
    if (!isCheckingAuth.current) {
      await checkAuthState();
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    loginWithGoogle,
    logout,
    register,
    updateProfile,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export context for advanced usage
export { AuthContext };
export default AuthContext;
