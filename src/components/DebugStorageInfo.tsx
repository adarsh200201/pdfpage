// Debug component to show storage info in real-time
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const DebugStorageInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  const refreshInfo = () => {
    const info = {
      emergency: {
        exists: !!(window as any).EMERGENCY_PDF_PAGES,
        count: (window as any).EMERGENCY_PDF_PAGES?.length || 0,
        sessionId: (window as any).EMERGENCY_SESSION_ID,
        firstPageSize: (window as any).EMERGENCY_PDF_PAGES?.[0]?.length || 0,
      },
      window: {
        testFunction: typeof (window as any).testPdfStorage === "function",
        directStorage: !!(window as any).directPageStorage,
        globalStorage: !!(window as any).globalPdfStorage,
      },
      timestamps: {
        current: new Date().toISOString(),
        emergency: (window as any).EMERGENCY_TIMESTAMP,
      },
    };
    setDebugInfo(info);
  };

  useEffect(() => {
    refreshInfo();
    const interval = setInterval(refreshInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="mt-4 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-blue-800 flex items-center justify-between">
          Debug Storage Info
          <Button onClick={refreshInfo} size="sm" variant="outline">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Emergency Storage:</strong>
          <div className="ml-2">
            ✓ Exists: {debugInfo.emergency?.exists ? "Yes" : "No"}
            <br />✓ Pages: {debugInfo.emergency?.count || 0}
            <br />✓ Session: {debugInfo.emergency?.sessionId || "None"}
            <br />✓ First Page: {debugInfo.emergency?.firstPageSize || 0} bytes
          </div>
        </div>

        <div>
          <strong>Window Objects:</strong>
          <div className="ml-2">
            ✓ Test Function: {debugInfo.window?.testFunction ? "Yes" : "No"}
            <br />✓ Direct Storage:{" "}
            {debugInfo.window?.directStorage ? "Yes" : "No"}
            <br />✓ Global Storage:{" "}
            {debugInfo.window?.globalStorage ? "Yes" : "No"}
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button
            onClick={() => {
              if ((window as any).testPdfStorage) {
                console.log((window as any).testPdfStorage());
              } else {
                console.log("testPdfStorage function not available");
              }
            }}
            size="sm"
            variant="outline"
            className="w-full"
          >
            Run Storage Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
