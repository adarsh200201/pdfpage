import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import EnhancedExcelToPdfService from "@/services/enhancedExcelToPdf";

const ExcelToPdfDebug = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testClientSideConversion = async () => {
    setIsProcessing(true);
    setLogs([]);

    try {
      addLog("Starting client-side conversion test...");

      // Create a proper Excel file using XLSX library
      const XLSX = await import("xlsx");

      // Create a simple workbook with test data
      const workbook = XLSX.utils.book_new();
      const worksheetData = [
        ["Name", "Age", "City"],
        ["John Doe", 30, "New York"],
        ["Jane Smith", 25, "Los Angeles"],
        ["Bob Johnson", 35, "Chicago"],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Test Sheet");

      // Convert to binary Excel format
      const excelBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const file = new File([blob], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      addLog(`Created test file: ${file.name} (${file.size} bytes)`);

      const result = await EnhancedExcelToPdfService.convertExcelToPdf(
        file,
        {
          pageFormat: "A4",
          orientation: "portrait",
          quality: "high",
        },
        (progress, status) => {
          addLog(`Progress: ${progress}% - ${status}`);
        },
      );

      addLog(`Conversion completed successfully!`);
      addLog(`Output size: ${result.blob.size} bytes`);
      addLog(`Stats: ${JSON.stringify(result.stats, null, 2)}`);
    } catch (error) {
      addLog(
        `ERROR: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      addLog(
        `Stack: ${error instanceof Error ? error.stack : "No stack trace"}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const testServerSideConversion = async () => {
    setIsProcessing(true);
    setLogs([]);

    try {
      addLog("Starting server-side conversion test...");

      const apiUrl =
        import.meta.env.VITE_API_URL || "https://pdfpage.onrender.com/api";
      addLog(`Using API URL: ${apiUrl}`);

      // Test server health
      const healthResponse = await fetch(`${apiUrl}/health`);
      addLog(
        `Health check: ${healthResponse.status} ${healthResponse.statusText}`,
      );

      // Create a proper Excel file using XLSX library
      const XLSX = await import("xlsx");

      // Create a simple workbook with test data
      const workbook = XLSX.utils.book_new();
      const worksheetData = [
        ["Product", "Price", "Quantity"],
        ["Laptop", 999.99, 5],
        ["Mouse", 25.5, 20],
        ["Keyboard", 75.0, 15],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      // Convert to binary Excel format
      const excelBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const file = new File([blob], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "options",
        JSON.stringify({
          pageFormat: "A4",
          orientation: "portrait",
          quality: "high",
        }),
      );

      addLog(`Sending request to ${apiUrl}/pdf/excel-to-pdf-libreoffice`);

      const response = await fetch(`${apiUrl}/pdf/excel-to-pdf-libreoffice`, {
        method: "POST",
        body: formData,
      });

      addLog(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Error response: ${errorText}`);
        throw new Error(`Server error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      addLog(`Received ${arrayBuffer.byteLength} bytes`);
      addLog("Server-side conversion completed successfully!");
    } catch (error) {
      addLog(
        `ERROR: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      if (error instanceof Error && error.stack) {
        addLog(`Stack: ${error.stack}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const testEnvironment = () => {
    setLogs([]);
    addLog("=== Environment Information ===");
    addLog(
      `API URL: ${import.meta.env.VITE_API_URL || "https://pdfpage.onrender.com/api"}`,
    );
    addLog(`Mode: ${import.meta.env.MODE}`);
    addLog(`Dev: ${import.meta.env.DEV}`);
    addLog(`User Agent: ${navigator.userAgent}`);
    addLog(`Online: ${navigator.onLine}`);
    addLog(`Language: ${navigator.language}`);
    addLog(`Platform: ${navigator.platform}`);

    // Test required libraries
    try {
      const XLSX = require("xlsx");
      addLog(`XLSX library: Available (version info not accessible)`);
    } catch (e) {
      addLog(`XLSX library: ERROR - ${e}`);
    }

    try {
      const jsPDF = require("jspdf");
      addLog(`jsPDF library: Available`);
    } catch (e) {
      addLog(`jsPDF library: ERROR - ${e}`);
    }

    try {
      const html2canvas = require("html2canvas");
      addLog(`html2canvas library: Available`);
    } catch (e) {
      addLog(`html2canvas library: ERROR - ${e}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Excel to PDF Debug Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testEnvironment} variant="outline">
              Test Environment
            </Button>
            <Button
              onClick={testClientSideConversion}
              disabled={isProcessing}
              variant="outline"
            >
              Test Client-Side
            </Button>
            <Button
              onClick={testServerSideConversion}
              disabled={isProcessing}
              variant="outline"
            >
              Test Server-Side
            </Button>
            <Button onClick={() => setLogs([])} variant="ghost">
              Clear Logs
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Debug Logs:</h3>
            <Textarea
              value={logs.join("\n")}
              readOnly
              className="h-64 font-mono text-xs"
              placeholder="Click a test button to see debug information..."
            />
          </div>

          {isProcessing && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Processing...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExcelToPdfDebug;
