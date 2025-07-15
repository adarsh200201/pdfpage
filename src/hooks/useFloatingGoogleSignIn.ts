import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Cookies from "js-cookie";

interface UseFloatingGoogleSignInOptions {
  showOnPageLoad?: boolean;
  showAfterUsageCount?: number[];
  dismissCookieName?: string;
}

interface UseFloatingGoogleSignInReturn {
  showPopup: boolean;
  usageCount: number;
  triggerPopup: (usageCount?: number) => void;
  dismissPopup: () => void;
}

export const useFloatingGoogleSignIn = (
  options: UseFloatingGoogleSignInOptions = {},
): UseFloatingGoogleSignInReturn => {
  const {
    showOnPageLoad = false,
    showAfterUsageCount = [1, 2],
    dismissCookieName = "loginPopupDismissed",
  } = options;

  const { isAuthenticated } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  // Check if popup was already dismissed
  const isPopupDismissed = () => {
    return Cookies.get(dismissCookieName) === "true";
  };

  // Show popup on page load if conditions are met
  useEffect(() => {
    if (
      showOnPageLoad &&
      !isAuthenticated &&
      !isPopupDismissed() &&
      !showPopup
    ) {
      // Small delay to let the page load, reduced from 2000ms to 1500ms
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, showOnPageLoad, showPopup, dismissCookieName]);

  // Auto-hide popup if user logs in
  useEffect(() => {
    if (isAuthenticated && showPopup) {
      setShowPopup(false);
    }
  }, [isAuthenticated, showPopup]);

  // Function to trigger popup based on usage count
  const triggerPopup = (currentUsageCount = 0) => {
    // Don't show if user is authenticated
    if (isAuthenticated) {
      return;
    }

    // Don't show if already dismissed today
    if (isPopupDismissed()) {
      return;
    }

    // Don't show if popup is already visible
    if (showPopup) {
      return;
    }

    // Check if usage count matches trigger conditions
    if (showAfterUsageCount.includes(currentUsageCount)) {
      setUsageCount(currentUsageCount);
      setShowPopup(true);
    }
  };

  // Function to dismiss popup
  const dismissPopup = () => {
    setShowPopup(false);
    // Set a short-term dismissal to prevent immediate re-showing
    Cookies.set(dismissCookieName, "true", { expires: 1 }); // 1 day
  };

  return {
    showPopup: showPopup && !isAuthenticated,
    usageCount,
    triggerPopup,
    dismissPopup,
  };
};

export default useFloatingGoogleSignIn;
