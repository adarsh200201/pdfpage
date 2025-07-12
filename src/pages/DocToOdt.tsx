import React from "react";
import { FileText, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import { LibreOfficeService } from "@/services/libreOfficeService";

export default function DocToOdt() {
  return (
    <ConversionPageTemplate
      title="DOC to ODT Converter"
      description="Convert legacy Microsoft Word documents (.doc) to OpenDocument Text format (ODT). Perfect for migrating to LibreOffice and open-source document workflows."
      fromFormat="doc"
      toFormat="odt"
      fromFormatName="Word Document (.doc)"
      toFormatName="ODT Document"
      acceptedFileTypes={[".doc", ".docx"]}
      conversionFunction={LibreOfficeService.docToOdt}
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
        "Convert legacy Word documents to ODT",
        "Migrate from Microsoft Office to LibreOffice",
        "Create open-source compatible documents",
        "Archive old DOC files in open format",
        "Share documents in standard ODF format",
      ]}
    />
  );
}
