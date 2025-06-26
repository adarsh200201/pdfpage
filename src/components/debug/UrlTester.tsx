import React from "react";
import { Button } from "@/components/ui/button";

const UrlTester: React.FC = () => {
  const testBackendConnection = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const healthUrl = `${apiUrl.replace("/api", "")}/api/health`;

    console.log("🔍 Testing backend connection...");
    console.log("Health URL:", healthUrl);

    try {
      const response = await fetch(healthUrl);
      const data = await response.json();
      console.log("✅ Backend health check:", data);
      alert(`Backend is reachable! Status: ${data.status}`);
    } catch (error) {
      console.error("❌ Backend health check failed:", error);
      alert(`Backend connection failed: ${error.message}`);
    }
  };

  const testDirectGoogleUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const googleUrl = `${apiUrl}/auth/google`;

    console.log("🔗 Opening Google OAuth URL in new tab:", googleUrl);
    window.open(googleUrl, "_blank");
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="font-bold text-yellow-800 mb-3">🧪 URL Testing</h4>

      <div className="space-y-2">
        <Button
          onClick={testBackendConnection}
          variant="outline"
          className="w-full"
        >
          Test Backend Connection
        </Button>

        <Button
          onClick={testDirectGoogleUrl}
          variant="outline"
          className="w-full"
        >
          Test Google OAuth URL (New Tab)
        </Button>
      </div>

      <div className="mt-3 text-xs text-yellow-700">
        <p>
          API URL: {import.meta.env.VITE_API_URL || "Not set (using fallback)"}
        </p>
        <p>Expected: https://pdfpage.onrender.com/api</p>
      </div>
    </div>
  );
};

export default UrlTester;
