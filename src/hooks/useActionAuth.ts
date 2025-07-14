import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface UseActionAuthOptions {
  action?: string; // Optional action name for analytics
  requireAuth?: boolean; // Default true
}

/**
 * Hook for handling authentication at the action level
 * Allows users to prepare their work, only requiring auth when they perform actions
 */
export const useActionAuth = (options: UseActionAuthOptions = {}) => {
  const { requireAuth = true, action } = options;
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Executes an action if user is authenticated, otherwise redirects to login
   * @param actionCallback - The function to execute if authenticated
   * @param redirectPath - Optional custom redirect path (defaults to current page)
   */
  const executeWithAuth = useCallback(
    async (
      actionCallback: () => void | Promise<void>,
      redirectPath?: string,
    ) => {
      // If authentication is not required, just execute
      if (!requireAuth) {
        await actionCallback();
        return;
      }

      // If user is authenticated, execute the action
      if (isAuthenticated) {
        await actionCallback();
        return;
      }

      // If authentication is loading, wait a moment
      if (isLoading) {
        // Could show a loading state here
        setTimeout(() => {
          executeWithAuth(actionCallback, redirectPath);
        }, 100);
        return;
      }

      // User is not authenticated, redirect to login
      const currentPath = redirectPath || location.pathname + location.search;
      const loginPath = `/login?redirect=${encodeURIComponent(currentPath)}`;

      // Track the action attempt for analytics if needed
      if (action) {
        console.log(
          `Action "${action}" requires authentication, redirecting...`,
        );
      }

      navigate(loginPath);
    },
    [isAuthenticated, isLoading, navigate, location, requireAuth, action],
  );

  /**
   * Checks if user can perform action without actually executing
   */
  const canPerformAction = useCallback(() => {
    if (!requireAuth) return true;
    return isAuthenticated && !isLoading;
  }, [isAuthenticated, isLoading, requireAuth]);

  /**
   * Gets the current authentication status for UI display
   */
  const getAuthStatus = useCallback(() => {
    if (isLoading) return "loading";
    if (isAuthenticated) return "authenticated";
    return "unauthenticated";
  }, [isAuthenticated, isLoading]);

  return {
    executeWithAuth,
    canPerformAction,
    getAuthStatus,
    isAuthenticated,
    isLoading,
  };
};

export default useActionAuth;
