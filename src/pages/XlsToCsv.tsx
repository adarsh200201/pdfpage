import React from "react";
import { Table, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import LibreOfficeService from "@/services/libreOfficeService";

export default function XlsToCsv() {
  return (
    <ConversionPageTemplate
      title="XLS to CSV Converter"
      description="Convert Excel spreadsheets to CSV format for universal data compatibility. Extract pure data from Excel files for use in any application or database."
      fromFormat="xls"
      toFormat="csv"
      fromFormatName="Excel Spreadsheet"
      toFormatName="CSV File"
      acceptedFileTypes={[".xls", ".xlsx"]}
      conversionFunction={LibreOfficeService.xlsToCsv}
      icon={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-green-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">XLS</span>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-green-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">CSV</span>
          </div>
        </div>
      }
      examples={[
        "Extract data from Excel for databases",
        "Create CSV imports from spreadsheets",
        "Convert Excel data for web applications",
        "Generate universal data format from XLS",
        "Prepare data for statistical analysis",
      ]}
    />
  );
}
