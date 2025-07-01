import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService, UsageLimitInfo } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";

interface SoftLimitState {
  isChecking: boolean;
  shouldShow: boolean;
  usageInfo: UsageLimitInfo | null;
  error: string | null;
}

interface SoftLimitHook {
  state: SoftLimitState;
  checkLimit: () => Promise<boolean>; // Returns true if can proceed, false if should show modal
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  onAuthSuccess: (user: any, conversionInfo?: any) => void;
  resetLimit: () => void;
}

export const useSoftLimit = (toolName?: string): SoftLimitHook => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [state, setState] = useState<SoftLimitState>({
    isChecking: false,
    shouldShow: false,
    usageInfo: null,
    error: null,
  });

  const [showModal, setShowModal] = useState(false);

  // Check usage limit
  const checkLimit = useCallback(async (): Promise<boolean> => {
    // Skip check for authenticated users
    if (isAuthenticated && user) {
      return true;
    }

    setState((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      const limitCheck = await PDFService.shouldShowSoftLimit();

      setState((prev) => ({
        ...prev,
        isChecking: false,
        shouldShow: limitCheck.show,
        usageInfo: limitCheck.info || null,
      }));

      if (limitCheck.show) {
        setShowModal(true);
        return false; // Don't proceed with tool usage
      }

      return true; // Can proceed
    } catch (error: any) {
      console.error("Error checking soft limit:", error);
      setState((prev) => ({
        ...prev,
        isChecking: false,
        error: error.message || "Failed to check usage limits",
      }));

      // On error, allow usage but show warning
      toast({
        title: "Warning",
        description: "Could not verify usage limits. Proceeding...",
        variant: "destructive",
      });

      return true;
    }
  }, [isAuthenticated, user, toast]);

  // Handle successful authentication
  const onAuthSuccess = useCallback(
    (user: any, conversionInfo?: any) => {
      setShowModal(false);

      // Show success message
      toast({
        title: conversionInfo?.fromSoftLimit
          ? "Account created! Welcome gift unlocked!"
          : "Welcome back!",
        description: "You now have unlimited access to all tools.",
      });

      // Show reward banner if conversion happened
      if (conversionInfo?.fromSoftLimit && conversionInfo?.showWelcomeReward) {
        // Trigger reward banner (this would be handled by parent component)
        const event = new CustomEvent("showRewardBanner", {
          detail: conversionInfo,
        });
        window.dispatchEvent(event);
      }

      // Reset limit state
      setState({
        isChecking: false,
        shouldShow: false,
        usageInfo: null,
        error: null,
      });
    },
    [toast],
  );

  // Reset limit state
  const resetLimit = useCallback(() => {
    setState({
      isChecking: false,
      shouldShow: false,
      usageInfo: null,
      error: null,
    });
    setShowModal(false);
  }, []);

  // Auto-check on mount and when auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      checkLimit();
    } else {
      resetLimit();
    }
  }, [isAuthenticated, checkLimit, resetLimit]);

  return {
    state,
    checkLimit,
    showModal,
    setShowModal,
    onAuthSuccess,
    resetLimit,
  };
};

// Hook for managing reward banner display
export const useRewardBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [conversionInfo, setConversionInfo] = useState<any>(null);

  useEffect(() => {
    const handleShowRewardBanner = (event: CustomEvent) => {
      setConversionInfo(event.detail);
      setShowBanner(true);

      // Auto-hide after 10 seconds
      setTimeout(() => {
        setShowBanner(false);
      }, 10000);
    };

    window.addEventListener(
      "showRewardBanner",
      handleShowRewardBanner as EventListener,
    );

    return () => {
      window.removeEventListener(
        "showRewardBanner",
        handleShowRewardBanner as EventListener,
      );
    };
  }, []);

  const closeBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  return {
    showBanner,
    conversionInfo,
    closeBanner,
  };
};

// Hook for tracking usage after tool completion
export const useUsageTracking = () => {
  const trackToolUsage = useCallback(
    async (toolName: string, fileCount: number, fileSize: number) => {
      try {
        // This would typically be handled by the tool itself
        // but can be used for additional client-side tracking
        console.log("Tool usage:", { toolName, fileCount, fileSize });

        // Could send analytics event here
        if (window.gtag) {
          window.gtag("event", "tool_used", {
            tool_name: toolName,
            file_count: fileCount,
            file_size: fileSize,
          });
        }
      } catch (error) {
        console.error("Error tracking tool usage:", error);
      }
    },
    [],
  );

  return { trackToolUsage };
};
