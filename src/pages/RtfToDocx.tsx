import React from "react";
import { FileText, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import LibreOfficeService from "@/services/libreOfficeService";

export default function RtfToDocx() {
  return (
    <ConversionPageTemplate
      title="RTF to DOCX Converter"
      description="Convert Rich Text Format files to modern Microsoft Word documents (DOCX). Preserve all formatting and styles while upgrading to the latest document format."
      fromFormat="rtf"
      toFormat="docx"
      fromFormatName="RTF Document"
      toFormatName="Word Document"
      acceptedFileTypes={[".rtf"]}
      conversionFunction={LibreOfficeService.rtfToDocx}
      icon={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-green-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">RTF</span>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">DOC</span>
          </div>
        </div>
      }
      examples={[
        "Modernize legacy RTF documents",
        "Convert RTF files to Word format",
        "Upgrade old documents to DOCX",
        "Create Word-compatible files from RTF",
        "Migrate RTF archives to modern format",
      ]}
    />
  );
}
