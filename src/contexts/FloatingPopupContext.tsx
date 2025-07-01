import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import FloatingGoogleSignInPopup from "@/components/auth/FloatingGoogleSignInPopup";
import { useFloatingGoogleSignIn } from "@/hooks/useFloatingGoogleSignIn";

interface FloatingPopupContextType {
  trackToolUsage: () => void;
  showPopupManually: () => void;
  getCurrentUsageCount: () => number;
}

const FloatingPopupContext = createContext<
  FloatingPopupContextType | undefined
>(undefined);

export const useFloatingPopup = () => {
  const context = useContext(FloatingPopupContext);
  if (!context) {
    throw new Error(
      "useFloatingPopup must be used within a FloatingPopupProvider",
    );
  }
  return context;
};

interface FloatingPopupProviderProps {
  children: React.ReactNode;
}

export const FloatingPopupProvider: React.FC<FloatingPopupProviderProps> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [localUsageCount, setLocalUsageCount] = useState(0);

  const { showPopup, usageCount, triggerPopup, dismissPopup } =
    useFloatingGoogleSignIn({
      showOnPageLoad: true, // Show on page load for anonymous users
      showAfterUsageCount: [1, 2], // Show after 1st and 2nd tool usage
    });

  // Load usage count from localStorage on mount
  useEffect(() => {
    if (!isAuthenticated) {
      const savedCount = localStorage.getItem("anonymousUsageCount");
      const count = savedCount ? parseInt(savedCount, 10) : 0;
      setLocalUsageCount(count);
    } else {
      // Clear local usage count when authenticated
      setLocalUsageCount(0);
      localStorage.removeItem("anonymousUsageCount");
    }
  }, [isAuthenticated]);

  // Track tool usage
  const trackToolUsage = () => {
    if (isAuthenticated) {
      return; // Don't track for authenticated users
    }

    const newCount = localUsageCount + 1;
    setLocalUsageCount(newCount);
    localStorage.setItem("anonymousUsageCount", newCount.toString());

    // Trigger popup if conditions are met
    triggerPopup(newCount);
  };

  // Manual popup trigger
  const showPopupManually = () => {
    if (!isAuthenticated) {
      triggerPopup(localUsageCount);
    }
  };

  // Get current usage count
  const getCurrentUsageCount = () => {
    return localUsageCount;
  };

  const contextValue: FloatingPopupContextType = {
    trackToolUsage,
    showPopupManually,
    getCurrentUsageCount,
  };

  return (
    <FloatingPopupContext.Provider value={contextValue}>
      {children}

      {/* Floating Google Sign-In Popup */}
      <FloatingGoogleSignInPopup
        show={showPopup}
        onDismiss={dismissPopup}
        usageCount={Math.max(usageCount, localUsageCount)}
      />
    </FloatingPopupContext.Provider>
  );
};

export default FloatingPopupProvider;
