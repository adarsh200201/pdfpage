import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { X, Crown } from "lucide-react";
import Cookies from "js-cookie";

interface FloatingGoogleSignInPopupProps {
  show: boolean;
  onDismiss: () => void;
  usageCount?: number;
}

const FloatingGoogleSignInPopup: React.FC<FloatingGoogleSignInPopupProps> = ({
  show,
  onDismiss,
  usageCount = 0,
}) => {
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Auto-hide timer
  useEffect(() => {
    if (show && !isAuthenticated) {
      setIsVisible(true);
      setTimeLeft(5);
      setHasInteracted(false);

      // Start countdown timer
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, isAuthenticated]);

  // Separate effect for auto-dismiss when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && !hasInteracted && isVisible) {
      handleDismiss(true);
    }
  }, [timeLeft, hasInteracted, isVisible]);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setHasInteracted(true);
    setIsLoading(true);

    try {
      const result = await loginWithGoogle();

      if (result && result.user) {
        toast({
          title: "Welcome!",
          description: `Hi ${result.user.name}! You now have unlimited access to all tools.`,
          duration: 5000,
        });

        // Hide popup permanently after successful login
        setIsVisible(false);
        onDismiss();
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Sign-in Failed",
        description:
          error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (auto = false) => {
    setIsVisible(false);

    // Set cookie to avoid showing again for 1 day
    Cookies.set("loginPopupDismissed", "true", { expires: 1 });

    onDismiss();

    if (!auto && !hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleInteraction = () => {
    setHasInteracted(true);
  };

  // Don't render if user is authenticated or popup should not be visible
  if (isAuthenticated || !isVisible) {
    return null;
  }

  const getMessageText = () => {
    if (usageCount >= 1) {
      return `You've used ${usageCount}/2 free tools. Sign in to unlock unlimited access!`;
    }
    return "Sign in to continue using tools for free";
  };

  return (
    <div
      className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2 fade-in-50 duration-300"
      onMouseEnter={handleInteraction}
      onFocus={handleInteraction}
    >
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-4 max-w-sm min-w-[300px]">
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-800 text-sm">
              Unlock All Tools
            </span>
          </div>
          <button
            onClick={() => handleDismiss(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            aria-label="Close popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          {getMessageText()}
        </p>

        {/* Google Sign-In Button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm h-10"
          variant="outline"
        >
          <div className="flex items-center justify-center gap-3">
            {/* Google Icon */}
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? "Signing in..." : "Continue with Google"}
          </div>
        </Button>

        {/* Auto-hide indicator */}
        {!hasInteracted && timeLeft > 0 && (
          <div className="mt-3 text-center">
            <div className="text-xs text-gray-400">
              Auto-dismisses in {timeLeft}s
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${((5 - timeLeft) / 5) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingGoogleSignInPopup;
