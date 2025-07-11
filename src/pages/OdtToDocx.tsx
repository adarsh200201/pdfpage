import React from "react";
import { FileText, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import LibreOfficeService from "@/services/libreOfficeService";

export default function OdtToDocx() {
  return (
    <ConversionPageTemplate
      title="ODT to DOCX Converter"
      description="Convert OpenDocument Text files to Microsoft Word format (DOCX) with perfect compatibility. Maintain all formatting, styles, and document structure."
      fromFormat="odt"
      toFormat="docx"
      fromFormatName="ODT Document"
      toFormatName="Word Document"
      acceptedFileTypes={[".odt"]}
      conversionFunction={LibreOfficeService.odtToDocx}
      icon={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">ODT</span>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">DOC</span>
          </div>
        </div>
      }
      examples={[
        "Convert LibreOffice documents to Word format",
        "Share ODT files with Word users",
        "Create Word-compatible documents",
        "Migrate from OpenOffice to Microsoft Office",
        "Ensure document compatibility across platforms",
      ]}
    />
  );
}
