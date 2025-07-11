import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Settings,
  Terminal,
  ExternalLink,
  ChevronDown,
  Info,
  Wrench,
} from "lucide-react";

interface DiagnosticReport {
  ghostscript: {
    available: boolean;
    executablePath: string | null;
    version: string | null;
    method: string | null;
    issues: string[];
    recommendations: string[];
  };
  platform: {
    os: string;
    arch: string;
    version: string;
  };
  windowsTroubleshooting?: {
    commonIssues: Array<{
      issue: string;
      solution: string;
      checkCommand: string;
    }>;
    stepByStepFix: string[];
    downloadLinks: {
      ghostscript64: string;
      ghostscript32: string;
      officialSite: string;
    };
  };
}

const GhostscriptDiagnostics: React.FC = () => {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const apiUrl = "https://pdfpage-app.onrender.com/api";
      const response = await fetch(`${apiUrl}/diagnostics/ghostscript`);
      const result = await response.json();

      if (result.success) {
        setReport(result.data);
      } else {
        console.error("Diagnostics failed:", result.message);
      }
    } catch (error) {
      console.error("Error running diagnostics:", error);
    } finally {
      setLoading(false);
    }
  };

  const testGhostscript = async () => {
    if (!report?.ghostscript.available) return;

    setTesting(true);
    try {
      const apiUrl = "https://pdfpage-app.onrender.com/api";
      const response = await fetch(`${apiUrl}/diagnostics/ghostscript/test`, {
        method: "POST",
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error("Error testing Ghostscript:", error);
      setTestResult({
        success: false,
        message: "Test failed: " + error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (available: boolean) => {
    if (available) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (available: boolean) => {
    return available
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          Ghostscript Diagnostics
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={loading}
            className="ml-auto"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Running diagnostics...
          </div>
        ) : report ? (
          <>
            {/* Main Status */}
            <Alert className={getStatusColor(report.ghostscript.available)}>
              <div className="flex items-center gap-3">
                {getStatusIcon(report.ghostscript.available)}
                <div className="flex-1">
                  <AlertDescription className="font-medium">
                    {report.ghostscript.available
                      ? "✅ Ghostscript is working correctly!"
                      : "❌ Ghostscript is not working properly"}
                  </AlertDescription>
                  {report.ghostscript.available && (
                    <div className="mt-2 text-sm space-y-1">
                      <div>📍 Path: {report.ghostscript.executablePath}</div>
                      <div>🔢 Version: {report.ghostscript.version}</div>
                      <div>🔍 Method: {report.ghostscript.method}</div>
                    </div>
                  )}
                </div>
              </div>
            </Alert>

            {/* Test Ghostscript Button */}
            {report.ghostscript.available && (
              <div className="flex gap-3">
                <Button
                  onClick={testGhostscript}
                  disabled={testing}
                  variant="outline"
                >
                  {testing ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Terminal className="w-4 h-4 mr-2" />
                  )}
                  Test Ghostscript
                </Button>

                {testResult && (
                  <Alert
                    className={
                      testResult.success ? "border-green-200" : "border-red-200"
                    }
                  >
                    <AlertDescription>
                      {testResult.success ? "✅" : "❌"} {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Windows Troubleshooting */}
            {!report.ghostscript.available && report.windowsTroubleshooting && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Windows Troubleshooting Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Download Links */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download Ghostscript
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={() =>
                          window.open(
                            report.windowsTroubleshooting!.downloadLinks
                              .ghostscript64,
                            "_blank",
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Windows 64-bit
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={() =>
                          window.open(
                            report.windowsTroubleshooting!.downloadLinks
                              .ghostscript32,
                            "_blank",
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Windows 32-bit
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Step by Step Fix */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Step-by-Step Installation Fix
                    </h4>
                    <div className="space-y-2">
                      {report.windowsTroubleshooting.stepByStepFix.map(
                        (step, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-white rounded-lg border"
                          >
                            <Badge variant="outline" className="mt-0.5">
                              {index + 1}
                            </Badge>
                            <span className="text-sm">{step}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Common Issues */}
                  <Collapsible open={expanded} onOpenChange={setExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Common Issues & Solutions
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-3">
                      {report.windowsTroubleshooting.commonIssues.map(
                        (issue, index) => (
                          <Card key={index} className="bg-white">
                            <CardContent className="p-4">
                              <h5 className="font-medium text-red-600 mb-2">
                                ❌ {issue.issue}
                              </h5>
                              <p className="text-sm text-gray-700 mb-2">
                                ✅ {issue.solution}
                              </p>
                              <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                                💻 {issue.checkCommand}
                              </div>
                            </CardContent>
                          </Card>
                        ),
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            )}

            {/* Issues and Recommendations */}
            {(report.ghostscript.issues.length > 0 ||
              report.ghostscript.recommendations.length > 0) && (
              <div className="space-y-4">
                {report.ghostscript.issues.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-sm text-red-600">
                        Issues Found
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {report.ghostscript.issues.map((issue, index) => (
                          <li
                            key={index}
                            className="text-sm flex items-start gap-2"
                          >
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {report.ghostscript.recommendations.length > 0 && (
                  <Card className="border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-sm text-blue-600">
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {report.ghostscript.recommendations.map(
                          (rec, index) => (
                            <li
                              key={index}
                              className="text-sm flex items-start gap-2"
                            >
                              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ),
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* System Info */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">OS:</span>{" "}
                    {report.platform.os}
                  </div>
                  <div>
                    <span className="font-medium">Architecture:</span>{" "}
                    {report.platform.arch}
                  </div>
                  <div>
                    <span className="font-medium">Version:</span>{" "}
                    {report.platform.version}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Failed to load diagnostics. Please try refreshing.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default GhostscriptDiagnostics;
