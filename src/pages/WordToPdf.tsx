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
    conversionMethod: string;
  };
  error?: string;
}

const WordToPdf = () => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [conversionSettings, setConversionSettings] = useState({
    conversionMethod: "libreoffice" as "advanced" | "libreoffice",
    preserveFormatting: true,
    includeMetadata: true,
  });

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Floating popup tracking
  const { trackToolUsage } = useFloatingPopup();

  // Mixpanel tracking
  const tracking = useToolTracking({
    toolName: "word-to-pdf",
    category: "PDF Tool",
    trackPageView: true,
    trackFunnel: true,
  });

  const handleFileUpload = (uploadedFiles: File[]) => {
    const validFiles = uploadedFiles.filter((file) => {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      const validExtensions = [".docx", ".doc"];

      if (
        !validTypes.includes(file.type) &&
        !validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
      ) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a Word document.`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        // 20MB limit
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit.`,
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
        description: "Please upload Word documents to convert to PDF.",
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
          tracking.trackConversionStart("Word", "PDF", [fileStatus.file]);

          const result = await PDFService.wordToPdf(fileStatus.file, {
            conversionMethod: conversionSettings.conversionMethod,
            preserveFormatting: conversionSettings.preserveFormatting,
            includeMetadata: conversionSettings.includeMetadata,
            sessionId: `word_to_pdf_${Date.now()}`,
            onProgress: (progress) => {
              setFiles((prev) =>
                prev.map((f, idx) => (idx === i ? { ...f, progress } : f)),
              );
            },
          });

          const processingTime = Date.now() - startTime;

          // Extract info from headers
          const serverProcessingTime = parseInt(
            result.headers?.["x-processing-time"] || processingTime.toString(),
          );

          // Create download blob and URL
          const blob = new Blob([result.data], {
            type: "application/pdf",
          });
          const downloadUrl = URL.createObjectURL(blob);
          const outputFilename = `${fileStatus.file.name.replace(/\.(docx?|doc)$/i, "")}_converted.pdf`;

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
                      processingTime: serverProcessingTime,
                      conversionMethod: conversionSettings.conversionMethod,
                    },
                  }
                : f,
            ),
          );

          // Track successful conversion
          tracking.trackConversionComplete(
            "Word",
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
            description: `${fileStatus.file.name} converted successfully using ${conversionSettings.conversionMethod}.`,
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100">
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
            <div className="p-3 bg-red-600 rounded-2xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Word to PDF</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Convert Word documents to high-quality PDF files. Preserve
            formatting, layout, images, and fonts with LibreOffice-powered
            conversion.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Features Banner */}
          <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Zap className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">
                      LibreOffice Powered
                    </p>
                    <p className="text-sm text-red-700">
                      Professional conversion engine
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">High Fidelity</p>
                    <p className="text-sm text-red-700">
                      Preserves all formatting
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FileCheck className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">No Size Limit</p>
                    <p className="text-sm text-red-700">Up to 20MB documents</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Area */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Word Documents
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
                  Choose Word files or drag & drop
                </h3>
                <p className="text-gray-500 mb-4">
                  Supports .docx and .doc files up to 20MB
                </p>
                <Button variant="outline">Browse Files</Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
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
                  Conversion Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="conversionMethod">Conversion Method</Label>
                    <Select
                      value={conversionSettings.conversionMethod}
                      onValueChange={(value: "advanced" | "libreoffice") =>
                        setConversionSettings({
                          ...conversionSettings,
                          conversionMethod: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="libreoffice">
                          LibreOffice (Recommended)
                        </SelectItem>
                        <SelectItem value="advanced">
                          Advanced Engine
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Preserve Formatting</p>
                      <p className="text-sm text-gray-500">
                        Maintain original Word formatting
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={conversionSettings.preserveFormatting}
                      onChange={(e) =>
                        setConversionSettings({
                          ...conversionSettings,
                          preserveFormatting: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Include Metadata</p>
                      <p className="text-sm text-gray-500">
                        Add document properties
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={conversionSettings.includeMetadata}
                      onChange={(e) =>
                        setConversionSettings({
                          ...conversionSettings,
                          includeMetadata: e.target.checked,
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
                          <FileText className="w-6 h-6 text-blue-500" />
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
                                <span className="text-gray-600">Method:</span>
                                <span className="ml-2 font-medium capitalize">
                                  {fileStatus.result.conversionMethod}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Processing Time:
                                </span>
                                <span className="ml-2 font-medium">
                                  {fileStatus.result.processingTime}ms
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
                  className="bg-red-600 hover:bg-red-700"
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

          {/* Info Section */}
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Word to PDF Conversion Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">LibreOffice Engine:</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Professional-grade conversion accuracy</li>
                      <li>• Preserves complex formatting and layout</li>
                      <li>• Handles images, tables, and charts</li>
                      <li>• Maintains fonts and typography</li>
                      <li>• Supports headers and footers</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Advanced Features:</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Multiple conversion methods</li>
                      <li>• Real-time progress tracking</li>
                      <li>• Batch file processing</li>
                      <li>• Secure server-side processing</li>
                      <li>• Auto-cleanup of temporary files</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

export default WordToPdf;
