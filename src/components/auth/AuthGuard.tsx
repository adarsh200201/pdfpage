import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = "/login",
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if authentication is disabled for testing
  const isTestingMode = import.meta.env.VITE_DISABLE_AUTH === "true";

  if (isTestingMode) {
    console.log("🔧 [TESTING MODE] AuthGuard bypassed - allowing access");
    return <>{children}</>;
  }

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      // Store the current path for redirect after login
      const currentPath = location.pathname + location.search;
      const loginPath = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      navigate(loginPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, requireAuth, navigate, redirectTo, location]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render children
  // (navigation to login will happen via useEffect)
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If authentication is not required, or user is authenticated, render children
  return <>{children}</>;
};

export default AuthGuard;
