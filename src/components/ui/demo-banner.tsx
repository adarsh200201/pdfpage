import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Cookies from "js-cookie";

export const DemoBanner: React.FC = () => {
  const { user } = useAuth();
  const token = Cookies.get("token");

  // Check if user is in demo mode (token starts with "demo_")
  const isDemoMode = token?.startsWith("demo_") || false;

  if (!isDemoMode || !user) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-800 mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          <strong>Demo Mode:</strong> Backend temporarily unavailable. You're
          using a local demo version with limited functionality.
        </span>
        <button
          onClick={() => window.location.reload()}
          className="ml-4 text-xs underline hover:no-underline"
        >
          Retry Connection
        </button>
      </AlertDescription>
    </Alert>
  );
};
