import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OAuthDebug() {
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testBackendConnectivity = async () => {
    setResults([]);
    addResult("🔍 Starting backend connectivity tests...");

    // Test 1: Check environment
    addResult(
      `Environment: ${import.meta.env.DEV ? "Development" : "Production"}`,
    );
    addResult(`Current URL: ${window.location.href}`);

    // Test 2: Test health endpoint
    try {
      addResult("Testing /api/health...");
      const response = await fetch("/api/health", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      addResult(`Health endpoint: ${response.status} ${response.statusText}`);
    } catch (error) {
      addResult(`Health endpoint error: ${error.message}`);
    }

    // Test 3: Test Google OAuth endpoint
    try {
      addResult("Testing /api/auth/google...");
      const response = await fetch("/api/auth/google", {
        method: "HEAD",
        redirect: "manual",
        headers: { "Cache-Control": "no-cache" },
      });
      addResult(`OAuth endpoint: ${response.status} ${response.statusText}`);
      if (response.headers.get("location")) {
        addResult(`Redirect to: ${response.headers.get("location")}`);
      }
    } catch (error) {
      addResult(`OAuth endpoint error: ${error.message}`);
    }

    // Test 4: Test direct backend
    try {
      addResult("Testing direct backend...");
      const response = await fetch(
        "https://pdfpage-app.onrender.com/api/health",
        {
          method: "GET",
          mode: "cors",
        },
      );
      addResult(`Direct backend: ${response.status} ${response.statusText}`);
    } catch (error) {
      addResult(`Direct backend error: ${error.message}`);
    }
  };

  const testGoogleLogin = () => {
    addResult("🔐 Testing Google login redirect...");
    const googleOAuthUrl = import.meta.env.DEV
      ? "http://localhost:5000/api/auth/google"
      : `/api/auth/google`;

    addResult(`Redirecting to: ${googleOAuthUrl}`);

    // Store test timestamp
    sessionStorage.setItem("oauthTestTime", Date.now().toString());

    // Redirect
    window.location.href = googleOAuthUrl;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>OAuth Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testBackendConnectivity} variant="outline">
            Test Backend Connectivity
          </Button>
          <Button onClick={testGoogleLogin} variant="default">
            Test Google Login
          </Button>
        </div>

        {results.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Test Results:</h4>
            <div className="bg-gray-100 p-3 rounded-md max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Current Environment:</strong>{" "}
            {import.meta.env.DEV ? "Development" : "Production"}
          </p>
          <p>
            <strong>Expected OAuth URL:</strong>{" "}
            {import.meta.env.DEV
              ? "http://localhost:5000/api/auth/google"
              : "/api/auth/google"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
