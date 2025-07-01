import React from "react";
import { Button } from "@/components/ui/button";
import { useFloatingPopup } from "@/contexts/FloatingPopupContext";
import { useAuth } from "@/contexts/AuthContext";

const FloatingPopupTest: React.FC = () => {
  const { trackToolUsage, showPopupManually, getCurrentUsageCount } =
    useFloatingPopup();
  const { isAuthenticated, user } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9998] bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <h4 className="font-semibold mb-2">🧪 Floating Popup Test</h4>

      <div className="text-xs text-gray-300 mb-3">
        <div>Auth: {isAuthenticated ? `✅ ${user?.name}` : "❌ Anonymous"}</div>
        <div>Usage Count: {getCurrentUsageCount()}/2</div>
      </div>

      <div className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={trackToolUsage}
          disabled={isAuthenticated}
        >
          Simulate Tool Use
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={showPopupManually}
          disabled={isAuthenticated}
        >
          Show Popup Now
        </Button>
      </div>

      <div className="text-xs text-gray-400 mt-2">
        Only works when not logged in
      </div>
    </div>
  );
};

export default FloatingPopupTest;
