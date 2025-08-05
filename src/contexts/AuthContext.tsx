import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import authService from "@/services/authService";
import mixpanelService from "@/services/mixpanelService";
import { getFullApiUrl } from "@/lib/api-config";

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
  checkAuth: () => Promise<void>;
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
      checkAuth: async () => {},
    };
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Real authentication - no testing mode bypass
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      // Verify token and get user data
      fetchUserData(token);
    } else {
      // Check if we have user data in localStorage but no token
      const savedUser = localStorage.getItem("pdfpage_user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log(
            "🔄 [AUTH] Found saved user data but no token - cleared localStorage",
          );
          localStorage.removeItem("pdfpage_user");
        } catch (e) {
          localStorage.removeItem("pdfpage_user");
        }
      }
      setIsLoading(false);
    }

    // Add retry mechanism for when user comes back online
    const handleOnline = () => {
      const token = Cookies.get("token");
      if (token && !user) {
        console.log("🔄 [AUTH] Back online - retrying authentication");
        fetchUserData(token);
      }
    };

    // Add app visibility checking for better persistent login
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const token = Cookies.get("token");
        if (token && !user) {
          console.log("�� [AUTH] App became visible - checking authentication");
          fetchUserData(token);
        }
      }
    };

    // Add focus checking for better persistent login
    const handleFocus = () => {
      const token = Cookies.get("token");
      if (token && !user) {
        console.log("🔄 [AUTH] App focused - checking authentication");
        fetchUserData(token);
      }
    };

    // Add periodic authentication check (reduced frequency to reduce server load)
    const periodicCheck = setInterval(() => {
      const token = Cookies.get("token");
      if (token && user) {
        const lastAuth = localStorage.getItem("pdfpage_auth_timestamp");
        const now = Date.now();
        // Check if last auth was more than 2 hours ago (increased interval)
        if (lastAuth && now - parseInt(lastAuth) > 2 * 60 * 60 * 1000) {
          console.log("🔄 [AUTH] Periodic authentication check");
          fetchUserData(token);
        }
      }
    }, 30 * 60 * 1000); // Every 30 minutes (reduced from 5 minutes)

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(periodicCheck);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

  const fetchUserData = async (token: string) => {
    try {
      const apiUrl = getFullApiUrl('/api/auth/me');
      console.log('🔵 [AUTH] Fetching user data from:', apiUrl);
      console.log('🔵 [AUTH] Token length:', token?.length);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for CORS
      });

      console.log('🔵 [AUTH] Response status:', response.status);
      console.log('🔵 [AUTH] Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [AUTH] User data received:', data);
        setUser(data.user);
        // Store user data in localStorage for extra persistence
        localStorage.setItem("pdfpage_user", JSON.stringify(data.user));
        localStorage.setItem("pdfpage_auth_timestamp", Date.now().toString());
        console.log(
          "✅ [AUTH] User data fetched successfully - persistent login active",
        );
      } else {
        const errorData = await response.text();
        console.log(
          "🔴 [AUTH] Token invalid or expired:",
          response.status,
          response.statusText,
          errorData
        );
        Cookies.remove("token");
        localStorage.removeItem("pdfpage_user");
        localStorage.removeItem("pdfpage_auth_timestamp");
        setUser(null);
      }
    } catch (error) {
      console.error("🔴 [AUTH] Error fetching user data:", error);
      // Don't remove token on network errors - could be temporary
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.log("🔄 [AUTH] Network error - keeping token for retry");
      } else {
        Cookies.remove("token");
        localStorage.removeItem("pdfpage_user");
        localStorage.removeItem("pdfpage_auth_timestamp");
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("🔵 [FRONTEND] Attempting to login user:", { email });

      const apiUrl = getFullApiUrl('/api/auth/login');
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { token, user, conversion } = data;
        Cookies.set("token", token, { expires: 730, secure: true, sameSite: 'lax' }); // 2 years for persistent login
        localStorage.setItem("pdfpage_user", JSON.stringify(user));
        localStorage.setItem("pdfpage_auth_timestamp", Date.now().toString());
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

      const apiUrl = getFullApiUrl('/api/auth/register');
      const response = await fetch(apiUrl, {
        method: "POST",
        credentials: 'include',
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
        Cookies.set("token", token, { expires: 730, secure: true, sameSite: 'lax' }); // 2 years for persistent login
        localStorage.setItem("pdfpage_user", JSON.stringify(user));
        localStorage.setItem("pdfpage_auth_timestamp", Date.now().toString());
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
    localStorage.removeItem("pdfpage_user");
    localStorage.removeItem("pdfpage_auth_timestamp");
    setUser(null);
    console.log("🔄 [AUTH] User logged out - clearing all stored data");
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

  // Add method to check authentication silently (for app focus/visibility events)
  const checkAuth = async () => {
    const token = Cookies.get("token");
    if (token && !user) {
      console.log("🔄 [AUTH] Checking authentication silently");
      await fetchUserData(token);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUser,
    refreshUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
