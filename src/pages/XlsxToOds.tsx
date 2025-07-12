import React from "react";
import { Table, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import { LibreOfficeService } from "@/services/libreOfficeService";

export default function XlsxToOds() {
  return (
    <ConversionPageTemplate
      title="XLSX to ODS Converter"
      description="Convert Excel spreadsheets to OpenDocument Spreadsheet format (ODS). Perfect for LibreOffice Calc users and open-source workflows."
      fromFormat="xlsx"
      toFormat="ods"
      fromFormatName="Excel Spreadsheet"
      toFormatName="ODS Spreadsheet"
      acceptedFileTypes={[".xlsx", ".xls"]}
      conversionFunction={LibreOfficeService.xlsxToOds}
      icon={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-green-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">XLS</span>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-orange-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">ODS</span>
          </div>
        </div>
      }
      examples={[
        "Convert Excel files for LibreOffice Calc",
        "Create open-source compatible spreadsheets",
        "Migrate from Excel to LibreOffice",
        "Share spreadsheets in open format",
        "Archive data in standard format",
      ]}
    />
  );
}
