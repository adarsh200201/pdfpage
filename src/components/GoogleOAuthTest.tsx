import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const GoogleOAuthTest: React.FC = () => {
  const { loginWithGoogle, isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      console.log("🔵 Testing Google OAuth...");
      toast({
        title: "Redirecting...",
        description: "Redirecting to Google for authentication",
      });
      await loginWithGoogle();
    } catch (error) {
      console.error("Google OAuth Error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate Google login",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 p-4 bg-white border rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2">OAuth Test</h3>
      {isAuthenticated ? (
        <div>
          <p className="text-green-600">✅ Authenticated as: {user?.name}</p>
          <p className="text-sm text-gray-600">Email: {user?.email}</p>
        </div>
      ) : (
        <div>
          <p className="text-red-600">❌ Not authenticated</p>
          <Button
            onClick={handleGoogleLogin}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700"
          >
            🔐 Test Google Login
          </Button>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        <p>Client ID: 935131...</p>
        <p>Callback: {window.location.hostname === 'localhost' ? 'localhost:5000' : 'pdfpage.in'}</p>
      </div>
    </div>
  );
};

export default GoogleOAuthTest;
