import React from "react";
import { Presentation, ArrowRight, Image } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import LibreOfficeService from "@/services/libreOfficeService";

export default function PptxToPng() {
  return (
    <ConversionPageTemplate
      title="PPTX to PNG Converter"
      description="Convert PowerPoint presentations to high-quality PNG images. Extract slides as individual PNG files for web use, thumbnails, or preview images using LibreOffice engine."
      fromFormat="pptx"
      toFormat="png"
      fromFormatName="PowerPoint Presentation"
      toFormatName="PNG Images"
      acceptedFileTypes={[".pptx", ".ppt"]}
      conversionFunction={LibreOfficeService.pptxToPng}
      icon={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-orange-600 rounded flex items-center justify-center">
            <Presentation className="h-5 w-5 text-white" />
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-purple-500 rounded flex items-center justify-center">
            <Image className="h-5 w-5 text-white" />
          </div>
        </div>
      }
      examples={[
        "Create thumbnails from presentation slides",
        "Extract slide images for web galleries",
        "Generate preview images for presentations",
        "Convert slides to social media graphics",
        "Create image archives from PowerPoint",
      ]}
    />
  );
}
