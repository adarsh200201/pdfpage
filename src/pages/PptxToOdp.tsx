import React from "react";
import { Presentation, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import { LibreOfficeService } from "@/services/libreOfficeService";

export default function PptxToOdp() {
  return (
    <ConversionPageTemplate
      title="PPTX to ODP Converter"
      description="Convert PowerPoint presentations to OpenDocument Presentation format (ODP). Perfect for LibreOffice Impress and open-source presentation workflows."
      fromFormat="pptx"
      toFormat="odp"
      fromFormatName="PowerPoint Presentation"
      toFormatName="ODP Presentation"
      acceptedFileTypes={[".pptx", ".ppt"]}
      conversionFunction={LibreOfficeService.pptxToOdp}
      icon={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-orange-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">PPT</span>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-purple-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">ODP</span>
          </div>
        </div>
      }
      examples={[
        "Convert PowerPoint for LibreOffice Impress",
        "Create open-source compatible presentations",
        "Migrate from PowerPoint to LibreOffice",
        "Share presentations in open format",
        "Archive presentations in standard format",
      ]}
    />
  );
}
