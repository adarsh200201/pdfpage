import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Download, ExternalLink } from "lucide-react";

interface SystemStatus {
  success: boolean;
  libreoffice: boolean;
  services: {
    libreoffice: {
      available: boolean;
      version: string;
    };
  };
}

export function LibreOfficeSetup() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkSystemStatus = async () => {
    setChecking(true);
    try {
      const apiUrl = "https://pdfpage-app.onrender.com/api";
      const response = await fetch(`${apiUrl}/pdf/system-status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to check system status:", error);
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const getDownloadUrl = () => {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes("win")) {
      return "https://download.libreoffice.org/libreoffice/stable/";
    } else if (platform.includes("mac")) {
      return "https://download.libreoffice.org/libreoffice/stable/";
    } else {
      return "https://www.libreoffice.org/download/download/";
    }
  };

  const getInstallationInstructions = () => {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes("win")) {
      return [
        "Download LibreOffice from the official website",
        "Run the installer as Administrator",
        'During installation, ensure "Add to PATH" is checked',
        "Restart your computer after installation",
        "Restart the backend server",
      ];
    } else if (platform.includes("mac")) {
      return [
        "Download LibreOffice from the official website",
        "Open the .dmg file and drag LibreOffice to Applications",
        'Add LibreOffice to PATH by running: export PATH="/Applications/LibreOffice.app/Contents/MacOS:$PATH"',
        "Restart the backend server",
      ];
    } else {
      return [
        "Install via package manager: sudo apt-get install libreoffice (Ubuntu/Debian)",
        "Or: sudo yum install libreoffice (RHEL/CentOS)",
        "Or download from official website",
        "Restart the backend server",
      ];
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Checking System Status...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLibreOfficeAvailable = status?.libreoffice || false;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isLibreOfficeAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            LibreOffice Status
          </CardTitle>
          <CardDescription>
            LibreOffice is required for document conversion (Word, Excel,
            PowerPoint to PDF)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>LibreOffice Available:</span>
              <span
                className={`font-semibold ${isLibreOfficeAvailable ? "text-green-600" : "text-red-600"}`}
              >
                {isLibreOfficeAvailable ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Version:</span>
              <span className="font-medium">
                {status?.services?.libreoffice?.version || "Not detected"}
              </span>
            </div>
            <Button
              onClick={checkSystemStatus}
              disabled={checking}
              variant="outline"
              className="w-full"
            >
              {checking ? "Checking..." : "Refresh Status"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!isLibreOfficeAvailable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Install LibreOffice
            </CardTitle>
            <CardDescription>
              Follow these steps to install LibreOffice for document conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  LibreOffice is required for converting Word, Excel, and
                  PowerPoint files to PDF. Without it, only basic PDF operations
                  will be available.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold">Installation Steps:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {getInstallationInstructions().map((step, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <Button asChild className="w-full">
                <a
                  href={getDownloadUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Download LibreOffice
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLibreOfficeAvailable && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            LibreOffice is properly installed and ready for document conversion!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
