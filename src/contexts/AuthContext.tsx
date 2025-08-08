import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

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

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ [AUTH-CONTEXT] Token verified, user data:', userData);

        if (userData.user) {
          setUser(userData.user);
          // Update stored user data
          localStorage.setItem('user', JSON.stringify(userData.user));
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
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Login
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google';
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
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
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
