import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  FileText,
  Crown,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  X,
  Settings,
  FileCheck,
  Zap,
  Shield,
} from "lucide-react";

interface FileStatus {
  file: File;
  status: "ready" | "converting" | "completed" | "error";
  progress: number;
  result?: {
    filename: string;
    downloadUrl: string;
    fileSize: number;
    processingTime: number;
    pages: number;
  };
  error?: string;
}

const OdtToPdf = () => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [conversionSettings, setConversionSettings] = useState({
    quality: "high" as "standard" | "high" | "premium",
    preserveFormatting: true,
    preserveImages: true,
    pageSize: "A4" as "A4" | "Letter" | "Legal" | "A3" | "A5",
    orientation: "auto" as "portrait" | "landscape" | "auto",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const tracking = useToolTracking();
  const { isVisible } = useFloatingPopup();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);

    const validFiles = uploadedFiles.filter((file) => {
      const isValidType = file.name.match(/\.odt$/i);
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid ODT file. Please upload .odt files.`,
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
    tracking.trackFileUpload("ODT", validFiles.length);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload ODT documents to convert to PDF.",
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
          tracking.trackConversionStart("ODT", "PDF", [fileStatus.file]);

          // Use LibreOffice backend service for conversion
          console.log(
            `Converting ${fileStatus.file.name} using LibreOffice backend...`,
          );

          // Progress callback for real-time updates
          const updateProgress = (progress: number) => {
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i ? { ...f, progress: Math.min(progress, 95) } : f,
              ),
            );
          };

          // Use the LibreOffice ODT to PDF conversion method
          const result = await PDFService.convertOdtToPdfLibreOffice(
            fileStatus.file,
            {
              quality: conversionSettings.quality,
              preserveFormatting: conversionSettings.preserveFormatting,
              preserveImages: conversionSettings.preserveImages,
              pageSize: conversionSettings.pageSize,
              orientation: conversionSettings.orientation,
            },
          );

          console.log("✅ LibreOffice ODT to PDF conversion completed");

          const processingTime = Date.now() - startTime;

          // Create download blob and URL
          const downloadUrl = URL.createObjectURL(result.blob);
          const outputFilename = `${fileStatus.file.name.replace(/\.odt$/i, "")}_converted.pdf`;

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
                      fileSize: result.blob.size,
                      processingTime:
                        result.stats.processingTime || processingTime,
                      pages: result.stats.pages,
                    },
                  }
                : f,
            ),
          );

          // Track successful conversion
          tracking.trackConversionSuccess("ODT", "PDF", [fileStatus.file]);

          // Show success toast
          toast({
            title: "Conversion completed!",
            description: `${fileStatus.file.name} has been converted to PDF successfully.`,
          });
        } catch (error: any) {
          console.error(`Error converting ${fileStatus.file.name}:`, error);

          // Update file status with error
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "error",
                    progress: 0,
                    error: error.message || "Conversion failed",
                  }
                : f,
            ),
          );

          // Track conversion error
          tracking.trackConversionError("ODT", "PDF", error.message);

          // Show error toast
          toast({
            title: "Conversion failed",
            description: `Failed to convert ${fileStatus.file.name}: ${error.message}`,
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (result: FileStatus["result"]) => {
    if (result) {
      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.download = result.filename;
      link.click();
    }
  };

  const downloadAll = () => {
    files.forEach((file) => {
      if (file.result) {
        downloadFile(file.result);
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const completedFiles = files.filter((f) => f.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ODT to PDF Converter
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Convert OpenDocument Text (.odt) files to PDF format using
            LibreOffice engine. Preserve formatting, images, and layout with
            professional quality.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Settings Panel */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Conversion Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quality">Quality</Label>
                <Select
                  value={conversionSettings.quality}
                  onValueChange={(value: any) =>
                    setConversionSettings({
                      ...conversionSettings,
                      quality: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Quality</SelectItem>
                    <SelectItem value="high">High Quality</SelectItem>
                    <SelectItem value="premium">Premium Quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageSize">Page Size</Label>
                <Select
                  value={conversionSettings.pageSize}
                  onValueChange={(value: any) =>
                    setConversionSettings({
                      ...conversionSettings,
                      pageSize: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={conversionSettings.orientation}
                  onValueChange={(value: any) =>
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
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload ODT Files
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your .odt files here, or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  accept=".odt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Files List */}
          {files.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Files ({files.length})</span>
                  {completedFiles.length > 1 && (
                    <Button onClick={downloadAll} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((fileStatus, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center flex-1">
                        <div className="flex-shrink-0 mr-4">
                          {fileStatus.status === "ready" && (
                            <FileText className="w-8 h-8 text-gray-400" />
                          )}
                          {fileStatus.status === "converting" && (
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          )}
                          {fileStatus.status === "completed" && (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          )}
                          {fileStatus.status === "error" && (
                            <AlertCircle className="w-8 h-8 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {fileStatus.file.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(fileStatus.file.size)}
                            {fileStatus.result && (
                              <>
                                {" → "}
                                {formatFileSize(fileStatus.result.fileSize)}
                                {" • "}
                                {fileStatus.result.pages} pages
                              </>
                            )}
                          </p>
                          {fileStatus.status === "converting" && (
                            <div className="mt-2">
                              <Progress
                                value={fileStatus.progress}
                                className="h-2"
                              />
                            </div>
                          )}
                          {fileStatus.status === "error" && (
                            <p className="text-sm text-red-600 mt-1">
                              {fileStatus.error}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {fileStatus.status === "completed" &&
                          fileStatus.result && (
                            <Button
                              onClick={() => downloadFile(fileStatus.result)}
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                        {fileStatus.status === "ready" && (
                          <Button
                            onClick={() => removeFile(index)}
                            variant="outline"
                            size="sm"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Convert Button */}
          {files.length > 0 && (
            <div className="text-center mb-8">
              <Button
                onClick={handleConvert}
                disabled={files.length === 0 || isProcessing || !user}
                size="lg"
                className="px-8"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <FileCheck className="w-5 h-5 mr-2" />
                )}
                {isProcessing
                  ? "Converting..."
                  : `Convert ${files.length} file${files.length > 1 ? "s" : ""} to PDF`}
              </Button>
              {!user && (
                <p className="text-sm text-gray-600 mt-2">
                  Please sign in to convert files
                </p>
              )}
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Zap className="w-8 h-8 text-yellow-500 mr-3" />
                  <h3 className="font-semibold">LibreOffice Powered</h3>
                </div>
                <p className="text-gray-600">
                  Uses real LibreOffice engine for perfect ODT compatibility
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Shield className="w-8 h-8 text-green-500 mr-3" />
                  <h3 className="font-semibold">Format Preservation</h3>
                </div>
                <p className="text-gray-600">
                  Maintains formatting, images, tables, and document structure
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <FileCheck className="w-8 h-8 text-blue-500 mr-3" />
                  <h3 className="font-semibold">Professional Quality</h3>
                </div>
                <p className="text-gray-600">
                  High-quality PDF output with customizable settings
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          handleConvert();
        }}
      />

      {/* Promo Banner */}
      {!isVisible && <PromoBanner />}
    </div>
  );
};

export default OdtToPdf;
