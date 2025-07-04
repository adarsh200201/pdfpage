// Emergency PDF access component that bypasses all session logic
// This directly accesses window.EMERGENCY_PDF_PAGES

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const EmergencyPDFAccess: React.FC = () => {
  const emergencyPages =
    typeof window !== "undefined" ? (window as any).EMERGENCY_PDF_PAGES : null;

  if (!emergencyPages || emergencyPages.length === 0) {
    return null;
  }

  const downloadPage = (pageIndex: number) => {
    const page = emergencyPages[pageIndex];
    if (!page) {
      console.error(`Emergency page ${pageIndex + 1} not found`);
      return;
    }

    try {
      const blob = new Blob([page], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `emergency-page-${pageIndex + 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log(`✅ Emergency download successful for page ${pageIndex + 1}`);
    } catch (error) {
      console.error(
        `❌ Emergency download failed for page ${pageIndex + 1}:`,
        error,
      );
    }
  };

  const downloadAll = () => {
    emergencyPages.forEach((_: any, index: number) => {
      setTimeout(() => downloadPage(index), index * 100);
    });
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
      <h3 className="text-red-800 font-semibold mb-2">
        🚨 Emergency PDF Access ({emergencyPages.length} pages)
      </h3>
      <p className="text-red-700 text-sm mb-3">
        Using emergency storage to bypass session issues.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={downloadAll}
          size="sm"
          variant="outline"
          className="border-red-300"
        >
          <Download className="w-4 h-4 mr-1" />
          Download All
        </Button>

        {emergencyPages.map((_: any, index: number) => (
          <Button
            key={index}
            onClick={() => downloadPage(index)}
            size="sm"
            variant="outline"
            className="border-red-300"
          >
            Page {index + 1}
          </Button>
        ))}
      </div>
    </div>
  );
};
