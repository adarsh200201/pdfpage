import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ConversionOptions {
  quality: "standard" | "high" | "premium";
  preserveFormatting: boolean;
  preserveImages: boolean;
  preserveLayouts: boolean;
  pageSize: "A4" | "Letter" | "Legal" | "auto";
  orientation: "auto" | "portrait" | "landscape";
}

interface ConversionResult {
  success: boolean;
  message: string;
  downloadUrl?: string;
  fileName?: string;
  processingTime?: number;
  pageCount?: number;
  error?: string;
}

const SUPPORTED_FORMATS = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "Word Document (.docx)",
  "application/msword": "Word Document (.doc)",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "Excel Spreadsheet (.xlsx)",
  "application/vnd.ms-excel": "Excel Spreadsheet (.xls)",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PowerPoint Presentation (.pptx)",
  "application/vnd.ms-powerpoint": "PowerPoint Presentation (.ppt)",
  "application/vnd.oasis.opendocument.text": "OpenDocument Text (.odt)",
  "application/vnd.oasis.opendocument.spreadsheet":
    "OpenDocument Spreadsheet (.ods)",
  "application/vnd.oasis.opendocument.presentation":
    "OpenDocument Presentation (.odp)",
  "text/rtf": "Rich Text Format (.rtf)",
};

export function LibreOfficeConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    quality: "high",
    preserveFormatting: true,
    preserveImages: true,
    preserveLayouts: true,
    pageSize: "A4",
    orientation: "auto",
  });
  const [libreOfficeAvailable, setLibreOfficeAvailable] = useState<
    boolean | null
  >(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.keys(SUPPORTED_FORMATS).reduce(
      (acc, key) => {
        acc[key] = [];
        return acc;
      },
      {} as Record<string, string[]>,
    ),
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const checkLibreOffice = async () => {
    try {
      const apiUrl = "https://pdfpage-app.onrender.com/api";
      const response = await fetch(`${apiUrl}/pdf/system-status`);
      const data = await response.json();
      setLibreOfficeAvailable(data.libreoffice);
      return data.libreoffice;
    } catch (error) {
      console.error("Failed to check LibreOffice status:", error);
      setLibreOfficeAvailable(false);
      return false;
    }
  };

  React.useEffect(() => {
    checkLibreOffice();
  }, []);

  const convertFile = async () => {
    if (!file) return;

    // Check LibreOffice availability first
    const isAvailable = await checkLibreOffice();
    if (!isAvailable) {
      setResult({
        success: false,
        message:
          "LibreOffice is not available. Please install LibreOffice first.",
        error: "LIBREOFFICE_UNAVAILABLE",
      });
      return;
    }

    setConverting(true);
    setProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("quality", options.quality);
      formData.append(
        "preserveFormatting",
        options.preserveFormatting.toString(),
      );
      formData.append("preserveImages", options.preserveImages.toString());
      formData.append("preserveLayouts", options.preserveLayouts.toString());
      formData.append("pageSize", options.pageSize);
      formData.append("orientation", options.orientation);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      const apiUrl = "https://pdfpage-app.onrender.com/api";
      const response = await fetch(`${apiUrl}/pdf/word-to-pdf-libreoffice`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const fileName = file.name.replace(/\.[^/.]+$/, ".pdf");

        // Get additional info from headers
        const processingTime = response.headers.get("X-Processing-Time");
        const pageCount = response.headers.get("X-Page-Count");

        setResult({
          success: true,
          message: "Document converted successfully!",
          downloadUrl,
          fileName,
          processingTime: processingTime ? parseInt(processingTime) : undefined,
          pageCount: pageCount ? parseInt(pageCount) : undefined,
        });
      } else {
        const errorData = await response.json();
        setResult({
          success: false,
          message: errorData.message || "Conversion failed",
          error: errorData.error,
        });
      }
    } catch (error) {
      console.error("Conversion error:", error);
      setResult({
        success: false,
        message: "Network error occurred during conversion",
        error: "NETWORK_ERROR",
      });
    } finally {
      setConverting(false);
      setProgress(0);
    }
  };

  const resetConverter = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  if (libreOfficeAvailable === false) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            LibreOffice Required
          </CardTitle>
          <CardDescription>
            LibreOffice must be installed to use this conversion tool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please install LibreOffice and restart the backend server to use
              document conversion features.
            </AlertDescription>
          </Alert>
          <Button
            onClick={checkLibreOffice}
            className="w-full mt-4"
            variant="outline"
          >
            Check Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            LibreOffice Document Converter
          </CardTitle>
          <CardDescription>
            Convert Word, Excel, PowerPoint, and other documents to PDF using
            LibreOffice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <Label>Select Document</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-gray-300 hover:border-primary"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {file ? (
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {SUPPORTED_FORMATS[
                      file.type as keyof typeof SUPPORTED_FORMATS
                    ] || "Supported format"}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">
                    {isDragActive
                      ? "Drop your document here"
                      : "Drag & drop a document or click to browse"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: Word, Excel, PowerPoint, OpenDocument, RTF
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Maximum file size: 100MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Conversion Options */}
          {file && (
            <div className="space-y-4">
              <Label>Conversion Options</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quality">Quality</Label>
                  <Select
                    value={options.quality}
                    onValueChange={(value: any) =>
                      setOptions({ ...options, quality: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageSize">Page Size</Label>
                  <Select
                    value={options.pageSize}
                    onValueChange={(value: any) =>
                      setOptions({ ...options, pageSize: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveFormatting"
                    checked={options.preserveFormatting}
                    onCheckedChange={(checked) =>
                      setOptions({
                        ...options,
                        preserveFormatting: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="preserveFormatting">
                    Preserve original formatting
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveImages"
                    checked={options.preserveImages}
                    onCheckedChange={(checked) =>
                      setOptions({
                        ...options,
                        preserveImages: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="preserveImages">Preserve images</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveLayouts"
                    checked={options.preserveLayouts}
                    onCheckedChange={(checked) =>
                      setOptions({
                        ...options,
                        preserveLayouts: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="preserveLayouts">Preserve layouts</Label>
                </div>
              </div>
            </div>
          )}

          {/* Convert Button */}
          {file && (
            <Button
              onClick={convertFile}
              disabled={converting}
              className="w-full"
              size="lg"
            >
              {converting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Convert to PDF
                </>
              )}
            </Button>
          )}

          {/* Progress */}
          {converting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Converting document...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {result && (
            <Alert
              className={
                result.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-3">
                  <p>{result.message}</p>

                  {result.success && result.downloadUrl && (
                    <div className="space-y-2">
                      {result.pageCount && (
                        <p className="text-sm text-gray-600">
                          Pages: {result.pageCount}
                        </p>
                      )}
                      {result.processingTime && (
                        <p className="text-sm text-gray-600">
                          Processing time:{" "}
                          {(result.processingTime / 1000).toFixed(1)}s
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button asChild>
                          <a
                            href={result.downloadUrl}
                            download={result.fileName}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download PDF
                          </a>
                        </Button>
                        <Button variant="outline" onClick={resetConverter}>
                          Convert Another
                        </Button>
                      </div>
                    </div>
                  )}

                  {!result.success &&
                    result.error === "LIBREOFFICE_UNAVAILABLE" && (
                      <p className="text-sm text-red-600">
                        Please install LibreOffice and restart the backend
                        server.
                      </p>
                    )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
