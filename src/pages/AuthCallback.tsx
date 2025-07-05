import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";
import authService from "@/services/authService";

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        toast({
          title: "Authentication Failed",
          description:
            "There was an error signing in with Google. Please try again.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (token) {
        try {
          // Set the token in cookies
          Cookies.set("token", token, { expires: 30 });

          // Fetch user data with the token
          const user = await authService.handleAuthCallback(token);

          // Ensure user data is valid before updating
          if (user && user.id) {
            updateUser(user);

            toast({
              title: "Welcome!",
              description: "You have been successfully signed in with Google.",
            });

            // Small delay to ensure state updates before navigation
            setTimeout(() => {
              const redirectUrl = authService.getAuthRedirectUrl();
              navigate(redirectUrl);
            }, 500);
          } else {
            throw new Error("Invalid user data received");
          }
        } catch (error) {
          console.error("Auth callback error:", error);
          // Clear invalid token
          Cookies.remove("token");
          toast({
            title: "Authentication Error",
            description: "There was an error completing the sign-in process.",
            variant: "destructive",
          });
          navigate("/");
        }
      } else {
        // No token or error, redirect to home
        navigate("/");
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast, updateUser]);

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
