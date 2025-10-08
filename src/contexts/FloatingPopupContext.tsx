import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ModernAuthBanner from "@/components/auth/FloatingGoogleSignInPopup";
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

  // Optional authentication popup (only after multiple uses)
  const { showPopup, usageCount, triggerPopup, dismissPopup } =
    useFloatingGoogleSignIn({
      showOnPageLoad: false, // Don't force on page load
      showAfterUsageCount: [5, 10], // Only suggest after 5 and 10 uses
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

  // Track tool usage (works for everyone)
  const trackToolUsage = () => {
    const newCount = localUsageCount + 1;
    setLocalUsageCount(newCount);

    if (!isAuthenticated) {
      localStorage.setItem("anonymousUsageCount", newCount.toString());
      // Optionally suggest signup after many uses
      triggerPopup(newCount);
    }
  };

  // Manual popup trigger (optional)
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

      {/* Optional Auth Banner - Only show suggestion after many uses */}
      {showPopup && !isAuthenticated && (
        <ModernAuthBanner variant="featured" onClose={dismissPopup} />
      )}
    </FloatingPopupContext.Provider>
  );
};

export default FloatingPopupProvider;
