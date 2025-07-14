import React from "react";
import { Helmet } from "react-helmet-async";
import LibreOfficeConverter from "@/components/LibreOfficeConverter";
import {
  Shield,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckCircle,
  X,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LIBREOFFICE_TOOLS } from "@/config/libreoffice-tools";

const LibreOfficeTools: React.FC = () => {
  const documentTools = LIBREOFFICE_TOOLS.filter(
    (tool) => tool.category === "document",
  );
  const spreadsheetTools = LIBREOFFICE_TOOLS.filter(
    (tool) => tool.category === "spreadsheet",
  );
  const presentationTools = LIBREOFFICE_TOOLS.filter(
    (tool) => tool.category === "presentation",
  );

  return (
    <>
      <Helmet>
        <title>
          LibreOffice Document Converter | Professional Format Conversion
        </title>
        <meta
          name="description"
          content="Professional document conversion using LibreOffice. Convert between ODT, DOCX, RTF, PDF, CSV, XLSX, ODS, PPTX formats with strict validation and no fallback libraries."
        />
        <meta
          name="keywords"
          content="LibreOffice converter, document conversion, ODT to PDF, DOCX to ODT, RTF to PDF, CSV to XLSX, professional conversion"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full">
                <Shield className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              LibreOffice Professional Converter
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Strict File Type Validation • No Fallback Libraries • Pure Format
              Results
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <Shield className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">LibreOffice Only</h3>
                <p className="text-sm text-blue-100">
                  Exclusive headless mode processing
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Strict Validation</h3>
                <p className="text-sm text-blue-100">
                  Only accepted file types processed
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <X className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">No Fallbacks</h3>
                <p className="text-sm text-blue-100">
                  No Puppeteer, Pandoc, or Mammoth
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Converter */}
        <div className="py-12">
          <LibreOfficeConverter />
        </div>

        {/* Supported Tools Overview */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Supported Conversion Tools
            </h2>
            <p className="text-lg text-gray-600">
              {LIBREOFFICE_TOOLS.length} professional conversion tools with
              strict format validation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Document Tools */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Document Tools</span>
                  <Badge variant="secondary">{documentTools.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {documentTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="font-medium text-blue-900 mb-1">
                      {tool.name}
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-green-700 font-medium">
                          Accept:{" "}
                        </span>
                        <span className="text-green-600">
                          {tool.acceptedTypes.join(", ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-red-700 font-medium">
                          Reject:{" "}
                        </span>
                        <span className="text-red-600">
                          {tool.rejectedTypes.slice(0, 3).join(", ")}
                          {tool.rejectedTypes.length > 3 && "..."}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Spreadsheet Tools */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <span>Spreadsheet Tools</span>
                  <Badge variant="secondary">{spreadsheetTools.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {spreadsheetTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="font-medium text-green-900 mb-1">
                      {tool.name}
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-green-700 font-medium">
                          Accept:{" "}
                        </span>
                        <span className="text-green-600">
                          {tool.acceptedTypes.join(", ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-red-700 font-medium">
                          Reject:{" "}
                        </span>
                        <span className="text-red-600">
                          {tool.rejectedTypes.join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Presentation Tools */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Presentation className="w-5 h-5 text-purple-600" />
                  <span>Presentation Tools</span>
                  <Badge variant="secondary">{presentationTools.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {presentationTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="font-medium text-purple-900 mb-1">
                      {tool.name}
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-green-700 font-medium">
                          Accept:{" "}
                        </span>
                        <span className="text-green-600">
                          {tool.acceptedTypes.join(", ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-red-700 font-medium">
                          Reject:{" "}
                        </span>
                        <span className="text-red-600">
                          {tool.rejectedTypes.slice(0, 3).join(", ")}
                          {tool.rejectedTypes.length > 3 && "..."}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border-t border-amber-200 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-amber-800">
                  <AlertTriangle className="w-6 h-6" />
                  <span>Important: Strict Validation Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-amber-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>What We Use</span>
                    </h3>
                    <ul className="space-y-1 text-sm">
                      <li>✅ LibreOffice headless mode only</li>
                      <li>✅ Strict file type validation</li>
                      <li>✅ Professional format accuracy</li>
                      <li>✅ No data corruption risk</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <X className="w-4 h-4" />
                      <span>What We Don't Use</span>
                    </h3>
                    <ul className="space-y-1 text-sm">
                      <li>❌ Puppeteer browser automation</li>
                      <li>❌ Pandoc universal converter</li>
                      <li>❌ Mammoth.js library</li>
                      <li>❌ Any fallback methods</li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-amber-300 pt-4">
                  <p className="font-medium">
                    ⚠️ If you upload an unsupported file type, you will receive
                    an immediate rejection with the message:
                  </p>
                  <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <code className="text-red-700 text-sm">
                      ❌ Unsupported file format. This tool only accepts .xyz.
                      Please upload the correct file.
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose LibreOffice-Only Conversion?
              </h2>
              <p className="text-lg text-gray-600">
                Professional-grade document processing with guaranteed
                reliability
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Format Purity
                </h3>
                <p className="text-sm text-gray-600">
                  LibreOffice maintains original formatting and document
                  structure integrity
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Predictable Results
                </h3>
                <p className="text-sm text-gray-600">
                  No random fallbacks or unexpected conversion methods
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Professional Quality
                </h3>
                <p className="text-sm text-gray-600">
                  Enterprise-grade conversion suitable for business documents
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Strict Validation
                </h3>
                <p className="text-sm text-gray-600">
                  Only accepted file types processed - no exceptions or
                  workarounds
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LibreOfficeTools;
