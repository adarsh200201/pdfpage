import React from "react";
import { FileText, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import { LibreOfficeService } from "@/services/libreOfficeService";

export default function RtfToPdf() {
  return (
    <ConversionPageTemplate
      title="RTF to PDF Converter"
      description="Convert Rich Text Format files to PDF documents while preserving all formatting, styles, and layouts. Professional-grade conversion using LibreOffice engine."
      fromFormat="rtf"
      toFormat="pdf"
      fromFormatName="RTF Document"
      toFormatName="PDF Document"
      acceptedFileTypes={[".rtf"]}
      conversionFunction={LibreOfficeService.rtfToPdf}
      icon={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-green-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">RTF</span>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-red-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">PDF</span>
          </div>
        </div>
      }
      examples={[
        "Convert legacy RTF documents to PDF",
        "Create PDFs from Rich Text files",
        "Preserve formatting in PDF conversion",
        "Archive RTF files as PDF documents",
        "Generate professional PDFs from RTF",
      ]}
    />
  );
}
