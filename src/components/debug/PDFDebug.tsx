import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { getPDFConfigStatus, configurePDFjs } from "@/lib/pdf-config";
import {
  testPDFWorker,
  getWorkerStatus,
  reinitializePDFWorker,
} from "@/utils/pdf-test";

interface PDFConfigStatus {
  version: string;
  workerSrc: string;
  isConfigured: boolean;
  environment: string;
  error?: string;
}

export const PDFDebug = () => {
  const [status, setStatus] = useState<PDFConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const loadStatus = async () => {
    try {
      const configStatus = getPDFConfigStatus();
      const workerStatus = getWorkerStatus();
      setStatus({ ...configStatus, ...workerStatus });
    } catch (error) {
      console.error("Error loading PDF status:", error);
      setStatus({
        version: "unknown",
        workerSrc: "error",
        isConfigured: false,
        environment: "unknown",
        error: error.message,
      });
    }
  };

  const runTest = async () => {
    setIsLoading(true);
    try {
      const result = await testPDFWorker();
      setTestResult(result);
    } catch (error) {
      console.error("Test failed:", error);
      setTestResult(false);
    } finally {
      setIsLoading(false);
    }
  };

  const reinitialize = async () => {
    setIsLoading(true);
    try {
      const result = await reinitializePDFWorker();
      setTestResult(result);
      await loadStatus();
    } catch (error) {
      console.error("Reinitialization failed:", error);
      setTestResult(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  if (!status) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading PDF.js status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          PDF.js Configuration Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Version
            </label>
            <p className="text-sm font-mono">{status.version}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Environment
            </label>
            <Badge
              variant={
                status.environment === "development" ? "secondary" : "default"
              }
            >
              {status.environment}
            </Badge>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Worker Source
          </label>
          <p className="text-xs font-mono break-all bg-muted p-2 rounded">
            {status.workerSrc || "Not set"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Configuration Status
          </label>
          {status.isConfigured ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Configured
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Not Configured
            </Badge>
          )}
        </div>

        {status.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
            <p className="text-sm text-destructive font-medium">Error:</p>
            <p className="text-xs text-destructive/80 font-mono">
              {status.error}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Worker Test
          </label>
          {testResult === null ? (
            <Badge variant="outline">Not tested</Badge>
          ) : testResult ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Passed
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Failed
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={runTest}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Test PDF.js
          </Button>
          <Button
            onClick={reinitialize}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Reinitialize
          </Button>
          <Button
            onClick={loadStatus}
            disabled={isLoading}
            variant="ghost"
            size="sm"
          >
            Refresh Status
          </Button>
        </div>

        {status.environment === "development" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Development Mode:</strong> PDF.js worker is disabled to
              avoid CORS issues during development. This is normal and expected
              behavior.
            </p>
          </div>
        )}

        {!status.isConfigured && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Configuration Issue:</strong> PDF.js appears to not be
              properly configured. Try clicking "Reinitialize" to apply the
              configuration again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFDebug;
