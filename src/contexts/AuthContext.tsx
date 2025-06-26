import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import authService from "@/services/authService";
import { checkEnvironment } from "@/utils/env-check";

interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  dailyUploads: number;
  maxDailyUploads: number;
  premiumExpiryDate?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
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

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      if (response.ok) {
        const { token, user } = await response.json();
        Cookies.set("token", token, { expires: 30 });
        setUser(user);
        console.log("✅ [FRONTEND] Login successful");
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Login failed");
      }
    } catch (error: any) {
      console.error("🔴 [FRONTEND] Login error:", error);
      throw new Error(error.message || "An error occurred during login");
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log("🔵 [FRONTEND] Attempting to register user:", {
        name,
        email,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        },
      );

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        console.log("✅ [FRONTEND] Registration successful");
        const { token, user } = responseData;
        Cookies.set("token", token, { expires: 30 });
        setUser(user);
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
      console.error("🔴 [FRONTEND] Registration error:", error);
      throw new Error(error.message || "An error occurred during registration");
    }
  };

  const loginWithGoogle = () => {
    try {
      console.log("🔵 [FRONTEND] Initiating Google OAuth login");

      // Check environment
      const envCheck = checkEnvironment();

      if (!envCheck.hasViteApiUrl) {
        console.warn("⚠️ [FRONTEND] VITE_API_URL not set, using fallback");
      }

      console.log("🔗 [FRONTEND] OAuth URL:", envCheck.googleOAuthUrl);

      // Call the auth service
      authService.loginWithGoogle();
    } catch (error) {
      console.error("🔴 [FRONTEND] Error initiating Google OAuth:", error);
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
