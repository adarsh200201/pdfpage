import React from "react";
import { FileText, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import LibreOfficeService from "@/services/libreOfficeService";

export default function OdtToPdf() {
  return (
    <ConversionPageTemplate
      title="ODT to PDF Converter"
      description="Convert OpenDocument Text files to PDF documents with perfect formatting preservation. Maintain all styles, layouts, and elements using professional LibreOffice conversion."
      fromFormat="odt"
      toFormat="pdf"
      fromFormatName="ODT Document"
      toFormatName="PDF Document"
      acceptedFileTypes={[".odt"]}
      conversionFunction={LibreOfficeService.odtToPdf}
      icon={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">ODT</span>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-red-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">PDF</span>
          </div>
        </div>
      }
      examples={[
        "Convert LibreOffice Writer documents to PDF",
        "Share OpenDocument files as PDF",
        "Create print-ready PDFs from ODT files",
        "Archive documents in PDF format",
        "Generate professional reports from ODT",
      ]}
    />
  );
}
