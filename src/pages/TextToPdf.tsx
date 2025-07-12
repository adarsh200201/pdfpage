import React from "react";
import { FileText, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import { LibreOfficeService } from "@/services/libreOfficeService";

export default function TextToPdf() {
  return (
    <ConversionPageTemplate
      title="Text to PDF Converter"
      description="Convert your plain text files to professional PDF documents with perfect formatting using LibreOffice. Preserve text structure and create publication-ready PDFs instantly."
      fromFormat="txt"
      toFormat="pdf"
      fromFormatName="Text (.txt)"
      toFormatName="PDF Document"
      acceptedFileTypes={[".txt", ".text"]}
      conversionFunction={LibreOfficeService.textToPdf}
      icon={
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-red-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">PDF</span>
          </div>
        </div>
      }
      examples={[
        "Convert readme files to PDF documents",
        "Create PDF reports from plain text",
        "Transform documentation to PDF format",
        "Generate formatted PDFs from text logs",
        "Convert coding files to readable PDFs",
      ]}
    />
  );
}
