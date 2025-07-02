import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import authService from "@/services/authService";

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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
    console.log("🔵 [FRONTEND] Initiating Google OAuth login");
    try {
      const result = await authService.loginWithGoogle();
      // Assuming authService.loginWithGoogle() returns user data
      if (result && result.user) {
        setUser(result.user);
        return { user: result.user, conversion: result.conversion || null };
      }
      throw new Error("Google login failed");
    } catch (error: any) {
      console.error("🔴 [FRONTEND] Google login error:", error);
      throw new Error(error.message || "Google authentication failed");
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const refreshUser = async () => {
    const token = Cookies.get("token");
    if (token) {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
