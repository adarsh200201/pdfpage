import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import LibreOfficeService from "@/services/libreOfficeService";

interface ConversionPageTemplateProps {
  title: string;
  description: string;
  fromFormat: string;
  toFormat: string;
  fromFormatName: string;
  toFormatName: string;
  acceptedFileTypes: string[];
  conversionFunction: (
    file: File,
    options: any,
  ) => Promise<{
    success: boolean;
    data?: ArrayBuffer;
    fileName?: string;
    error?: string;
    metadata?: any;
  }>;
  icon?: React.ReactNode;
  examples?: string[];
}

export default function ConversionPageTemplate({
  title,
  description,
  fromFormat,
  toFormat,
  fromFormatName,
  toFormatName,
  acceptedFileTypes,
  conversionFunction,
  icon,
  examples = [],
}: ConversionPageTemplateProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/*": acceptedFileTypes,
      "text/*": acceptedFileTypes.includes(".txt") ? [".txt"] : [],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setError(null);
    setProgress(0);

    try {
      const result = await conversionFunction(file, {
        preserveFormatting: true,
        includeMetadata: true,
        quality: "high",
        onProgress: (progress: number, message: string) => {
          setProgress(progress);
          setProgressMessage(message);
        },
      });

      if (result.success) {
        setResult(result);
        setProgress(100);
        setProgressMessage("Conversion completed successfully!");
      } else {
        setError(result.error || "Conversion failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (result?.data && result?.fileName) {
      LibreOfficeService.downloadFile(result.data, result.fileName);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {icon || <FileText className="h-8 w-8 text-blue-600" />}
            <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>

          {/* Format conversion indicator */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {fromFormatName}
            </Badge>
            <ArrowRight className="h-6 w-6 text-gray-400" />
            <Badge variant="default" className="text-lg px-4 py-2 bg-blue-600">
              {toFormatName}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Conversion Area */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Your {fromFormatName} File
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!file ? (
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400",
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {isDragActive
                        ? `Drop your ${fromFormat.toUpperCase()} file here`
                        : `Drop your ${fromFormat.toUpperCase()} file here or click to browse`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported formats: {acceptedFileTypes.join(", ")}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Max file size: 50MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* File Info */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {LibreOfficeService.formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        Remove
                      </Button>
                    </div>

                    {/* Convert Button */}
                    {!isConverting && !result && (
                      <Button
                        onClick={handleConvert}
                        className="w-full"
                        size="lg"
                      >
                        Convert to {toFormatName}
                      </Button>
                    )}

                    {/* Progress */}
                    {isConverting && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">
                            {progressMessage}
                          </span>
                        </div>
                        <Progress value={progress} className="w-full" />
                        <p className="text-xs text-gray-600 text-center">
                          {progress}% complete
                        </p>
                      </div>
                    )}

                    {/* Success Result */}
                    {result && (
                      <div className="space-y-4">
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            File converted successfully! Ready for download.
                          </AlertDescription>
                        </Alert>

                        <div className="flex gap-3">
                          <Button
                            onClick={handleDownload}
                            className="flex-1"
                            size="lg"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download {toFormatName}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleReset}
                            size="lg"
                          >
                            Convert Another
                          </Button>
                        </div>

                        {/* Conversion Stats */}
                        {result.metadata && (
                          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
                            <div>
                              <span className="text-gray-600">
                                Original Size:
                              </span>
                              <span className="ml-2 font-medium">
                                {LibreOfficeService.formatFileSize(
                                  result.metadata.originalSize,
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Converted Size:
                              </span>
                              <span className="ml-2 font-medium">
                                {LibreOfficeService.formatFileSize(
                                  result.metadata.convertedSize,
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Processing Time:
                              </span>
                              <span className="ml-2 font-medium">
                                {(
                                  result.metadata.processingTime / 1000
                                ).toFixed(1)}
                                s
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Method:</span>
                              <span className="ml-2 font-medium">
                                {result.metadata.conversionMethod}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why Choose Our Tool?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">LibreOffice Powered</p>
                    <p className="text-sm text-gray-600">
                      Professional-grade conversion using LibreOffice engine
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Format Preservation</p>
                    <p className="text-sm text-gray-600">
                      Maintains original formatting and layout
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Secure & Private</p>
                    <p className="text-sm text-gray-600">
                      Files are processed securely and deleted after conversion
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Fast Processing</p>
                    <p className="text-sm text-gray-600">
                      Quick conversion with real-time progress updates
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Examples */}
            {examples.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Common Use Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {examples.map((example, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-2" />
                        <span className="text-sm text-gray-600">{example}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Supported Formats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supported Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm text-gray-700">Input:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {acceptedFileTypes.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-700">Output:</p>
                    <Badge variant="default" className="mt-1">
                      {toFormat.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
