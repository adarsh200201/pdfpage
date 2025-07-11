import React from "react";
import { FileText, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import LibreOfficeService from "@/services/libreOfficeService";

export default function DocxToOdt() {
  return (
    <ConversionPageTemplate
      title="DOCX to ODT Converter"
      description="Convert Microsoft Word documents to OpenDocument Text format (ODT). Perfect for LibreOffice users and open-source document workflows."
      fromFormat="docx"
      toFormat="odt"
      fromFormatName="Word Document"
      toFormatName="ODT Document"
      acceptedFileTypes={[".docx", ".doc"]}
      conversionFunction={LibreOfficeService.docxToOdt}
      icon={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">DOC</span>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">ODT</span>
          </div>
        </div>
      }
      examples={[
        "Convert Word documents for LibreOffice",
        "Create open-source compatible documents",
        "Migrate from Microsoft Office to LibreOffice",
        "Share documents in open format",
        "Archive documents in standard format",
      ]}
    />
  );
}
