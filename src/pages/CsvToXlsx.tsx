import React from "react";
import { Table, ArrowRight } from "lucide-react";
import ConversionPageTemplate from "@/components/ConversionPageTemplate";
import { LibreOfficeService } from "@/services/libreOfficeService";

export default function CsvToXlsx() {
  return (
    <ConversionPageTemplate
      title="CSV to XLSX Converter"
      description="Transform your CSV data files into professional Excel spreadsheets with proper formatting, data types, and styling. Perfect for data analysis and reporting."
      fromFormat="csv"
      toFormat="xlsx"
      fromFormatName="CSV File"
      toFormatName="Excel Spreadsheet"
      acceptedFileTypes={[".csv"]}
      conversionFunction={LibreOfficeService.csvToXlsx}
      icon={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-green-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">CSV</span>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="h-8 w-8 bg-green-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">XLS</span>
          </div>
        </div>
      }
      examples={[
        "Convert data exports to Excel format",
        "Create formatted spreadsheets from CSV",
        "Transform database exports to XLSX",
        "Generate Excel reports from CSV data",
        "Convert plain data to Excel workbooks",
      ]}
    />
  );
}
