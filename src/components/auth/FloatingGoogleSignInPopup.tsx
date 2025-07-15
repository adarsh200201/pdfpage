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

  // Update visibility when user authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // Hide popup when user is already authenticated
      setIsVisible(false);
    }
  }, [isAuthenticated, user]);

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
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) {
    return null;
  }

  // If user is authenticated, show their real data
  if (isAuthenticated && user) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-[400px] max-w-md relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="px-5 py-4">
            {/* Header with Google Logo */}
            <div className="flex items-center gap-3 mb-4">
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
              <span className="text-sm font-medium">
                Sign in to pdfpage.com with google.com
              </span>
            </div>

            {/* Real User Profile Section */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-white mb-1 text-lg">
                  {user.name}
                </div>
                <div className="text-gray-300 text-sm flex items-center gap-1">
                  <span>📧</span> {user.email}
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md mb-4 transition-all duration-200"
            >
              🔘 Continue as {user.name.split(" ")[0]}
            </Button>

            {/* Success Text */}
            <div className="text-xs text-green-300 leading-relaxed text-center">
              ✅ Signed in successfully! You now have access to all PDF tools.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-[400px] max-w-md relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="px-5 py-4">
          {/* Header with Google Logo */}
          <div className="flex items-center gap-3 mb-4">
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
            <span className="text-sm font-medium">
              Sign in to pdfpage.com with google.com
            </span>
          </div>

          {/* User Profile Section */}
          <div className="mb-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-white font-bold text-xl">
                {displayUser.avatar}
              </span>
            </div>
            <h3 className="font-medium text-white text-lg mb-2">
              {displayUser.name}
            </h3>
            <p className="text-gray-300 text-sm">{displayUser.email}</p>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md mb-4 transition-all duration-200 shadow-lg"
          >
            {user
              ? `🔘 Continue as ${user.name.split(" ")[0]}`
              : "Continue with Google"}
          </Button>

          {/* Privacy Text */}
          <div className="text-xs text-gray-400 leading-relaxed">
            To continue, google.com will share your name, email address, and
            profile picture with this site. See this site's{" "}
            <a href="/privacy" className="text-blue-400 hover:underline">
              privacy policy
            </a>{" "}
            and{" "}
            <a href="/terms" className="text-blue-400 hover:underline">
              terms of service
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernAuthBanner;
