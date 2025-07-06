import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LibreOfficeSetup } from "@/components/LibreOfficeSetup";
import { LibreOfficeConverter } from "@/components/LibreOfficeConverter";
import {
  FileText,
  Settings,
  Download,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function LibreOfficeTools() {
  return (
    <div className="min-h-screen bg-bg-light py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-heading-large text-text-dark mb-4">
            LibreOffice Document Converter
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Convert Word, Excel, PowerPoint, and other documents to PDF using
            the powerful LibreOffice engine. Professional quality conversions
            with advanced formatting preservation.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Multiple Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-gray-600">
                Supports Word, Excel, PowerPoint, OpenDocument, and RTF files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">High Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-gray-600">
                Preserves formatting, images, and layouts with professional
                results
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Customizable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-gray-600">
                Adjust quality, page size, and preservation options for optimal
                results
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="converter" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Converter
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Setup & Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="converter">
            <LibreOfficeConverter />
          </TabsContent>

          <TabsContent value="setup">
            <LibreOfficeSetup />
          </TabsContent>
        </Tabs>

        {/* Installation Notice */}
        <Card className="mt-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Installation Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-orange-700 space-y-2">
              <p>
                <strong>LibreOffice must be installed</strong> on your system
                for document conversion to work.
              </p>
              <p className="text-sm">
                If you're seeing conversion errors, please:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 ml-4">
                <li>Install LibreOffice from the official website</li>
                <li>Ensure it's added to your system PATH</li>
                <li>Restart the backend server</li>
                <li>Check the "Setup & Status" tab for verification</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Supported Formats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Supported Document Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-gray-800">
                  Microsoft Office
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Word Documents (.docx, .doc)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Excel Spreadsheets (.xlsx, .xls)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    PowerPoint Presentations (.pptx, .ppt)
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-gray-800">
                  Other Formats
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    OpenDocument Text (.odt)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    OpenDocument Spreadsheet (.ods)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Rich Text Format (.rtf)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
