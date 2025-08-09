import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface ModernAuthBannerProps {
  variant?: "minimal" | "featured";
  className?: string;
  onClose?: () => void;
}

const ModernAuthBanner: React.FC<ModernAuthBannerProps> = ({
  variant = "minimal",
  className = "",
  onClose,
}) => {
  const { loginWithGoogle, isAuthenticated, user } = useAuth();

  // Dynamic user display with real data when available
  // For non-authenticated users, show generic placeholder
  const displayUser = {
    name: user?.name || "Choose an account",
    email: user?.email || "to continue to pdfpage.com",
    avatar: user?.name ? user.name.charAt(0).toUpperCase() : "G",
    isRealUser: !!user,
  };
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Update visibility when user authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // Hide popup when user is already authenticated
      setIsVisible(false);
    }
  }, [isAuthenticated, user]);

  // Auto-dismiss after 15 seconds for better user experience
  useEffect(() => {
    if (isVisible && !isAuthenticated) {
      const autoCloseTimer = setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setIsVisible(false);
          onClose?.();
        }, 300); // Wait for animation to complete
      }, 15000); // Show for 15 seconds

      return () => clearTimeout(autoCloseTimer);
    }
  }, [isVisible, isAuthenticated, onClose]);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      toast({
        title: "Redirecting to Google...",
        description: "Complete authentication to continue.",
        duration: 3000,
      });
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Sign-in Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Wait for animation to complete
  };

  if (!isVisible) {
    return null;
  }

  // If user is authenticated, show their real data
  if (isAuthenticated && user) {
    return (
      <div className={`fixed top-4 left-4 right-4 sm:top-4 sm:left-auto sm:right-4 sm:w-auto z-50 ${className}`}>
        <div
          className={`bg-white border border-gray-200/50 text-gray-900 rounded-2xl shadow-2xl w-full sm:w-[420px] max-w-md mx-auto sm:mx-0 relative backdrop-blur-sm transition-all duration-300 ${
            isAnimating ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
          }`}
          style={{
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04), 0 0 0 1px rgb(0 0 0 / 0.05)'
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 z-10 bg-gray-100/80 hover:bg-gray-200/80 rounded-full p-1.5"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="px-6 py-5">
            {/* Header with Google Logo */}
            <div className="flex items-center gap-3 mb-5">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              <span className="text-sm font-medium text-gray-700">
                Successfully signed in to PdfPage
              </span>
            </div>

            {/* Real User Profile Section */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1 text-lg">
                  Welcome, {user.name}!
                </div>
                <div className="text-gray-600 text-sm flex items-center gap-1">
                  <span>📧</span> {user.email}
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3 rounded-lg mb-4 transition-all duration-200 shadow-lg"
            >
              ✅ Continue as {user.name.split(" ")[0]}
            </Button>

            {/* Success Text */}
            <div className="text-xs text-green-600 leading-relaxed text-center bg-green-50 p-3 rounded-lg">
              🎉 You're all set! You now have access to all premium PDF tools.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-4 left-4 right-4 sm:top-4 sm:left-auto sm:right-4 sm:w-auto z-50 ${className}`}>
      <div
        className={`bg-white border border-gray-200/50 text-gray-900 rounded-2xl shadow-2xl w-full sm:w-[420px] max-w-md mx-auto sm:mx-0 relative backdrop-blur-sm transition-all duration-300 ${
          isAnimating ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
        }`}
        style={{
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04), 0 0 0 1px rgb(0 0 0 / 0.05)'
        }}
      >
        {/* Auto-dismiss progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 rounded-t-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl"
            style={{
              animation: 'progressBar 15s linear forwards'
            }}
          />
        </div>

        {/* Enhanced Close Button - Mobile Friendly */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 z-10 bg-gray-100/80 hover:bg-gray-200/80 rounded-full p-2 sm:p-1.5 touch-target"
          aria-label="Close popup"
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        {/* Enhanced Content - Mobile Responsive */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 pt-5 sm:pt-6">
          {/* Header with Google Logo - Mobile Optimized */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
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
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Sign in to PdfPage with Google
            </span>
          </div>

          {/* Enhanced User Profile Section - Mobile Responsive */}
          <div className="mb-4 sm:mb-5 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg border-2 sm:border-4 border-white">
              <span className="text-white font-bold text-base sm:text-xl">
                {displayUser.avatar}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 sm:mb-2">
              {displayUser.name}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm">{displayUser.email}</p>
          </div>

          {/* Enhanced Continue Button - Mobile Optimized */}
          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 sm:py-4 text-sm sm:text-base rounded-lg mb-3 sm:mb-4 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] touch-target"
          >
            {user
              ? `🔘 Continue as ${user.name.split(" ")[0]}`
              : "Continue with Google"}
          </Button>

          {/* Enhanced Privacy Text - Mobile Responsive */}
          <div className="text-xs sm:text-xs text-gray-500 leading-relaxed bg-gray-50 p-2 sm:p-3 rounded-lg">
            To continue, Google will share your name, email address, and
            profile picture with this site. See our{" "}
            <a href="/privacy" className="text-blue-500 hover:underline font-medium">
              privacy policy
            </a>{" "}
            and{" "}
            <a href="/terms" className="text-blue-500 hover:underline font-medium">
              terms of service
            </a>
            .
          </div>
        </div>
      </div>

      {/* Add CSS animation for progress bar */}
      <style jsx>{`
        @keyframes progressBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ModernAuthBanner;
