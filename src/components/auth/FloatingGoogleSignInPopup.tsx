import React, { useState } from "react";
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
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);

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

  if (isAuthenticated || !isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl w-full max-w-md mx-4 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-6">
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
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">A</span>
            </div>
            <div>
              <div className="font-medium text-white mb-1">
                ADARSH KUMAR mefgi
              </div>
              <div className="text-gray-300 text-sm">
                adarshkumar.18434@marwadieducation.edu.in
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md mb-4"
          >
            Continue as ADARSH KUMAR
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
