import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowRight } from "lucide-react";

interface ModernAuthBannerProps {
  variant?: "minimal" | "featured";
  className?: string;
}

const ModernAuthBanner: React.FC<ModernAuthBannerProps> = ({
  variant = "minimal",
  className = "",
}) => {
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const { toast } = useToast();

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

  if (isAuthenticated) {
    return null;
  }

  if (variant === "minimal") {
    return (
      <div
        className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Unlock Premium Features
              </p>
              <p className="text-xs text-gray-600">
                Save time with faster processing & advanced tools
              </p>
            </div>
          </div>
          <Button
            onClick={handleGoogleSignIn}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign In
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm p-6 ${className}`}
    >
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ready to get started?
        </h3>

        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          Sign in to access all PDF tools with faster processing and unlimited
          usage.
        </p>

        <Button
          onClick={handleGoogleSignIn}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm h-11"
          variant="outline"
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            Continue with Google
          </div>
        </Button>

        <p className="text-xs text-gray-500 mt-3">
          Free forever • No credit card required
        </p>
      </div>
    </div>
  );
};

export default ModernAuthBanner;
