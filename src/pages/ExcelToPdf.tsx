import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PDFService } from "@/services/pdfService";
import { useToolTracking } from "@/hooks/useToolTracking";
import { useFloatingPopup } from "@/contexts/FloatingPopupContext";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Download,
  FileText,
  FileSpreadsheet,
  Crown,
  Star,
  Table,
  Layout,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  X,
  Settings,
  FileCheck,
} from "lucide-react";

interface FileStatus {
  file: File;
  status: "ready" | "converting" | "completed" | "error";
  progress: number;
  result?: {
    filename: string;
    downloadUrl: string;
    fileSize: number;
    sheetsConverted: number;
    processingTime: number;
  };
  error?: string;
}

const ExcelToPdf = () => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [conversionSettings, setConversionSettings] = useState({
    pageFormat: "A4",
    orientation: "portrait",
    preserveLayout: true,
  });

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Floating popup tracking
  const { trackToolUsage } = useFloatingPopup();

  // Mixpanel tracking
  const tracking = useToolTracking({
    toolName: "excel-to-pdf",
    category: "PDF Tool",
    trackPageView: true,
    trackFunnel: true,
  });

  const handleFileUpload = (uploadedFiles: File[]) => {
    const validFiles = uploadedFiles.filter((file) => {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      const validExtensions = [".xlsx", ".xls"];

      if (
        !validTypes.includes(file.type) &&
        !validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
      ) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an Excel file.`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 15 * 1024 * 1024) {
        // 15MB limit
        toast({
          title: "File too large",
          description: `${file.name} exceeds 15MB limit.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const newFiles: FileStatus[] = validFiles.map((file) => ({
      file,
      status: "ready",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    // Track file upload
    if (validFiles.length > 0) {
      tracking.trackFileUpload(validFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const downloadFile = (downloadUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: `Downloading ${filename}`,
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload Excel files to convert to PDF.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      tracking.trackAuthRequired();
      setShowAuthModal(true);
      return;
    }

    setIsProcessing(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const fileStatus = files[i];

        if (fileStatus.status !== "ready") continue;

        // Update status to converting
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "converting", progress: 10 } : f,
          ),
        );

        try {
          const startTime = Date.now();

          // Track conversion start
          tracking.trackConversionStart("Excel", "PDF", [fileStatus.file]);

          const result = await PDFService.excelToPdf(fileStatus.file, {
            pageFormat: conversionSettings.pageFormat,
            orientation: conversionSettings.orientation,
            preserveLayout: conversionSettings.preserveLayout,
            sessionId: `excel_to_pdf_${Date.now()}`,
            onProgress: (progress) => {
              setFiles((prev) =>
                prev.map((f, idx) => (idx === i ? { ...f, progress } : f)),
              );
            },
          });

          const processingTime = Date.now() - startTime;

          // Extract info from headers
          const sheetsConverted = parseInt(
            result.headers?.["x-sheets-converted"] || "1",
          );

          // Create download blob and URL
          const blob = new Blob([result.data], {
            type: "application/pdf",
          });
          const downloadUrl = URL.createObjectURL(blob);
          const outputFilename = `${fileStatus.file.name.replace(/\.(xlsx?|xls)$/i, "")}_converted.pdf`;

          // Update file status with completion
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "completed",
                    progress: 100,
                    result: {
                      filename: outputFilename,
                      downloadUrl,
                      fileSize: result.data.byteLength,
                      sheetsConverted,
                      processingTime,
                    },
                  }
                : f,
            ),
          );

          // Track successful conversion
          tracking.trackConversionComplete(
            "Excel",
            "PDF",
            {
              fileName: fileStatus.file.name,
              fileSize: fileStatus.file.size,
              fileType: fileStatus.file.type,
            },
            result.data.byteLength,
            processingTime,
          );

          // Track for floating popup (only for anonymous users)
          if (!isAuthenticated) {
            trackToolUsage();
          }

          toast({
            title: "Conversion Complete!",
            description: `${fileStatus.file.name} converted successfully. Processed ${sheetsConverted} sheets.`,
          });
        } catch (error) {
          console.error(`Error converting ${fileStatus.file.name}:`, error);

          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "error",
                    progress: 0,
                    error:
                      error instanceof Error
                        ? error.message
                        : "Conversion failed",
                  }
                : f,
            ),
          );

          toast({
            title: `❌ Error converting ${fileStatus.file.name}`,
            description:
              error instanceof Error ? error.message : "Conversion failed",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = () => {
    files
      .filter((f) => f.status === "completed" && f.result)
      .forEach((file, index) => {
        setTimeout(() => {
          downloadFile(file.result!.downloadUrl, file.result!.filename);
        }, index * 100);
      });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-100">
      <Header />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <FileCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Excel to PDF</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Convert Excel spreadsheets to PDF documents. Preserve formatting,
            charts, and layout with professional-quality output.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* File Upload Area */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Excel Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  "border-gray-300 hover:border-gray-400",
                )}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">
                  Choose Excel files or drag & drop
                </h3>
                <p className="text-gray-500 mb-4">
                  Supports .xlsx and .xls files up to 15MB
                </p>
                <Button variant="outline">Browse Files</Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={(e) =>
                    handleFileUpload(Array.from(e.target.files || []))
                  }
                  className="hidden"
                  multiple
                />
              </div>
            </CardContent>
          </Card>

          {/* Conversion Settings */}
          {files.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  PDF Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pageFormat">Page Format</Label>
                    <Select
                      value={conversionSettings.pageFormat}
                      onValueChange={(value) =>
                        setConversionSettings({
                          ...conversionSettings,
                          pageFormat: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="orientation">Orientation</Label>
                    <Select
                      value={conversionSettings.orientation}
                      onValueChange={(value) =>
                        setConversionSettings({
                          ...conversionSettings,
                          orientation: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Preserve Layout</p>
                      <p className="text-sm text-gray-500">
                        Maintain original formatting
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={conversionSettings.preserveLayout}
                      onChange={(e) =>
                        setConversionSettings({
                          ...conversionSettings,
                          preserveLayout: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File List */}
          {files.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Files to Convert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((fileStatus, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="w-6 h-6 text-green-500" />
                          <div>
                            <p className="font-medium">
                              {fileStatus.file.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(fileStatus.file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {fileStatus.status === "completed" &&
                            fileStatus.result && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  downloadFile(
                                    fileStatus.result!.downloadUrl,
                                    fileStatus.result!.filename,
                                  )
                                }
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Status and Progress */}
                      {fileStatus.status === "converting" && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Converting to PDF...</span>
                            <span>{Math.round(fileStatus.progress)}%</span>
                          </div>
                          <Progress
                            value={fileStatus.progress}
                            className="h-2"
                          />
                        </div>
                      )}

                      {fileStatus.status === "completed" &&
                        fileStatus.result && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-800 mb-2">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">
                                Conversion Complete
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">
                                  Sheets Converted:
                                </span>
                                <span className="ml-2 font-medium">
                                  {fileStatus.result.sheetsConverted}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  File Size:
                                </span>
                                <span className="ml-2 font-medium">
                                  {formatFileSize(fileStatus.result.fileSize)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                      {fileStatus.status === "error" && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">
                              Conversion Failed
                            </span>
                          </div>
                          <p className="text-sm text-red-600 mt-1">
                            {fileStatus.error}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleConvert}
                  disabled={files.length === 0 || isProcessing || !user}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Convert to PDF
                    </>
                  )}
                </Button>

                {files.some((f) => f.status === "completed") && (
                  <Button variant="outline" onClick={downloadAll} size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Download All
                  </Button>
                )}

                {files.length > 0 && (
                  <Button variant="outline" onClick={() => setFiles([])}>
                    Clear All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <PromoBanner />
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="login"
        />
      )}
    </div>
  );
};

export default ExcelToPdf;
