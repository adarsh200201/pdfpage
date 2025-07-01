import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const ApiTest = () => {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    try {
      // Test basic connectivity
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${apiUrl}/pdf/word-to-pdf-advanced`, {
        method: "POST",
        body: new FormData(), // Empty form data to test endpoint
      });

      const data = await response.text();
      setResult(`Response Status: ${response.status}\nData: ${data}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded">
      <h3>API Test</h3>
      <Button onClick={testApi} disabled={loading}>
        {loading ? "Testing..." : "Test API Connection"}
      </Button>
      <pre className="mt-4 p-2 bg-gray-100 text-sm">{result}</pre>
    </div>
  );
};

export default ApiTest;
