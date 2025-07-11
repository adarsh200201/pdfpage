import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import authService from "@/services/authService";
import mixpanelService from "@/services/mixpanelService";

interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  premiumExpiryDate?: string;
  totalUploads?: number;
}

interface ConversionInfo {
  fromSoftLimit: boolean;
  limitTool: string;
  showWelcomeReward: boolean;
  unlockedFeatures: string[];
}

interface AuthResponse {
  user: User;
  conversion?: ConversionInfo | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    name: string,
    email: string,
    password: string,
    options?: {
      signupSource?: string;
      toolName?: string;
      sessionId?: string;
    },
  ) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Real authentication - users must login with valid accounts

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Provide fallback values instead of throwing error immediately
    console.warn(
      "useAuth used outside AuthProvider - providing fallback values",
    );
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({ user: null as any }),
      register: async () => ({ user: null as any }),
      loginWithGoogle: async () => ({ user: null, conversion: null }),
      logout: async () => {},
      clearAuth: () => {},
      refreshAuth: async () => {},
      updateUser: (updates: any) => {},
    };
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Real authentication - check for valid token and user data
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      // Verify token and get user data
      fetchUserData(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const apiUrl = "https://pdfpage-app.onrender.com/api";
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        Cookies.remove("token");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Cookies.remove("token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("🔵 [FRONTEND] Attempting to login user:", { email });

      const apiUrl = "https://pdfpage-app.onrender.com/api";
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { token, user, conversion } = data;
        Cookies.set("token", token, { expires: 365 }); // 1 year for persistent login
        setUser(user);

        // Track user login in Mixpanel
        mixpanelService.identify(user.id, {
          email: user.email,
          name: user.name,
          isPremium: user.isPremium,
          totalUploads: user.totalUploads,
        });
        mixpanelService.trackUserLogin("email");

        console.log("✅ [FRONTEND] Login successful");
        return { user, conversion: conversion || null };
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Login failed");
      }
    } catch (error: any) {
      console.error("🔴 [FRONTEND] Login error:", error);
      throw new Error(error.message || "An error occurred during login");
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    options?: {
      signupSource?: string;
      toolName?: string;
      sessionId?: string;
    },
  ) => {
    try {
      console.log("🔵 [FRONTEND] Attempting to register user:", {
        name,
        email,
        options,
      });

      const apiUrl = "https://pdfpage-app.onrender.com/api";
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          signupSource: options?.signupSource,
          sessionId: options?.sessionId,
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        console.log("✅ [FRONTEND] Registration successful");
        const { token, user, conversion } = responseData;
        Cookies.set("token", token, { expires: 365 }); // 1 year for persistent login
        setUser(user);

        // Track user signup in Mixpanel
        mixpanelService.identify(user.id, {
          email: user.email,
          name: user.name,
          isPremium: user.isPremium,
          signupSource: options?.signupSource || "direct",
          toolName: options?.toolName,
        });
        mixpanelService.trackUserSignup("email");

        return { user, conversion: conversion || null };
      } else {
        console.error("🔴 [FRONTEND] Registration failed:", {
          status: response.status,
          statusText: response.statusText,
          error: responseData,
        });
        throw new Error(
          responseData.message ||
            responseData.error ||
            `Registration failed with status ${response.status}`,
        );
      }
    } catch (error: any) {
      console.error("���� [FRONTEND] Registration error:", error);
      throw new Error(error.message || "An error occurred during registration");
    }
  };

  const loginWithGoogle = async () => {
    try {
      // The authService.loginWithGoogle() method redirects the browser
      // It doesn't return a Promise, so we handle it differently
      authService.loginWithGoogle();

      // Since we're redirecting, we don't return anything here
      // The actual login will be handled by the auth callback page
      return { user: null, conversion: null };
    } catch (error: any) {
      console.error("🔴 [FRONTEND] Google login error:", error);
      throw new Error(error.message || "Google authentication failed");
    }
  };

  const logout = () => {
    // Track user logout in Mixpanel
    mixpanelService.trackUserLogout();
    mixpanelService.reset();

    Cookies.remove("token");
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (prev) {
        // Update existing user
        return { ...prev, ...userData };
      } else if (userData && Object.keys(userData).length > 0) {
        // Create new user if userData contains essential fields
        return userData as User;
      } else {
        return null;
      }
    });
  };

  const refreshUser = async () => {
    const token = Cookies.get("token");
    if (token) {
      await fetchUserData(token);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user, // Real authentication check - user must exist
    isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
