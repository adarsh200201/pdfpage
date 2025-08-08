import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";
import authService from "@/services/authService";
import toast from "@/lib/toast-utils";

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast: radixToast } = useToast();
  const auth = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (isProcessing) return;
      setIsProcessing(true);

      try {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        console.log('🔍 [AUTH-CALLBACK] Processing callback:', { token: !!token, error });

        if (error) {
          console.error('❌ [AUTH-CALLBACK] OAuth error:', error);
          toast.error({
            title: "Authentication Failed",
            description: "There was an error signing in with Google. Please try again.",
          });
          navigate("/");
          return;
        }

        if (token) {
          try {
            console.log('🔑 [AUTH-CALLBACK] Processing token...');

            // Set the token in cookies for 1 year (persistent login)
            Cookies.set("auth_token", token, { expires: 365, secure: true, sameSite: 'strict' });
            localStorage.setItem("auth_token", token);

            // Fetch user data with the token
            const user = await authService.handleAuthCallback(token);
            console.log('👤 [AUTH-CALLBACK] User data received:', user);

            // Ensure user data is valid before updating
            if (user && user.id) {
              // Store user data in localStorage for extra persistence
              localStorage.setItem("user", JSON.stringify(user));

              // Refresh the auth context to pick up the new user data
              await auth.refreshAuth();

              toast.success({
                title: "Welcome!",
                description: `Successfully signed in as ${user.name || user.email}`,
              });

              console.log('✅ [AUTH-CALLBACK] Authentication successful, redirecting...');

              // Small delay to ensure state updates before navigation
              setTimeout(() => {
                const redirectUrl = authService.getAuthRedirectUrl();
                navigate(redirectUrl);
              }, 500); // Reduced delay since we're now explicitly refreshing auth
            } else {
              throw new Error("Invalid user data received");
            }
        } catch (error) {
          console.error("❌ [AUTH-CALLBACK] Auth callback error:", error);

          // Clear invalid token and user data
          Cookies.remove("auth_token");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");

          toast.error({
            title: "Authentication Error",
            description: "There was an error completing the sign-in process. Please try again.",
          });

          navigate("/");
        }
      } else {
        console.log('⚠️ [AUTH-CALLBACK] No token or error found, redirecting to home');
        // No token or error, redirect to home
        navigate("/");
      }
      } catch (globalError) {
        console.error("❌ [AUTH-CALLBACK] Global error:", globalError);
        toast.error("Authentication failed. Please try again.");
        navigate("/");
      } finally {
        setIsProcessing(false);
      }
    };

    // Only run once when component mounts
    if (!isProcessing) {
      handleCallback();
    }
  }, [searchParams, navigate, isProcessing]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-red" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">
          Completing sign in...
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Please wait while we finish setting up your account.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
