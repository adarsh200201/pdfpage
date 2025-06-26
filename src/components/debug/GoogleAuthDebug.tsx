import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import authService from "@/services/authService";
import UrlTester from "./UrlTester";

const GoogleAuthDebug: React.FC = () => {
  const { loginWithGoogle } = useAuth();

  const handleDirectGoogleAuth = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const googleOAuthUrl = `${apiUrl}/auth/google`;

    console.log("🔵 [DEBUG] Environment check:");
    console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
    console.log("Google OAuth URL:", googleOAuthUrl);
    console.log("Current location:", window.location.href);

    // Try direct redirect
    console.log("🔵 [DEBUG] Attempting direct redirect...");
    window.location.href = googleOAuthUrl;
  };

  const handleAuthServiceMethod = () => {
    console.log("🔵 [DEBUG] Using authService method...");
    authService.loginWithGoogle();
  };

  const handleContextMethod = () => {
    console.log("🔵 [DEBUG] Using context method...");
    loginWithGoogle();
  };

  return (
    <div className="p-6 bg-gray-100 border border-gray-300 rounded-lg">
      <h3 className="text-lg font-bold mb-4">🔧 Google OAuth Debug Panel</h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Current API URL: {import.meta.env.VITE_API_URL || "Not set"}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Expected URL: https://pdfpage.onrender.com/api/auth/google
          </p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleDirectGoogleAuth}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Test 1: Direct Redirect
          </Button>

          <Button
            onClick={handleAuthServiceMethod}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Test 2: Auth Service Method
          </Button>

          <Button
            onClick={handleContextMethod}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Test 3: Context Method (Current Implementation)
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>Open browser console to see debug logs</p>
        </div>
      </div>

      <div className="mt-4">
        <UrlTester />
      </div>
    </div>
  );
};

export default GoogleAuthDebug;
