import { useState, useCallback, useRef, useEffect } from "react";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import AdvancedSEO from "@/components/AdvancedSEO";
import { getSEOData } from "@/data/seo-routes";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import DownloadModal from "@/components/modals/DownloadModal";
import { useDownloadModal } from "@/hooks/useDownloadModal";
import {
  ArrowLeft,
  Download,
  FileText,
  Trash2,
  Crown,
  Star,
  CheckCircle,
  Settings,
  RotateCcw,
  Loader2,
  Clock,
  Zap,
  RefreshCw,
  AlertCircle,
  Eye,
  FileCheck,
  Activity,
  BarChart3,
  Upload,
  X,
} from "lucide-react";

interface ConversionResult {
  data: ArrayBuffer;
  filename: string;
  downloadUrl: string;
  fileSize: number;
}

interface FileWithStatus {
  file: File;
  id: string;
  status: "uploaded" | "processing" | "completed" | "error";
  progress: number;
  result?: ConversionResult;
  errorMessage?: string;
  processingTime?: number;
}

const WordToPdf = () => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download modal
  const downloadModal = useDownloadModal({
    countdownSeconds: 5, // 5 seconds
    adSlot: "word-to-pdf-download-ad",
    showAd: true,
  });

  const seoData = getSEOData("/word-to-pdf");

  const downloadFile = (downloadUrl: string, filename: string) => {
    // Open download modal with ad and countdown
    downloadModal.openDownloadModal(
      () => {
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
      },
      {
        title: "🎉 Your PDF is ready!",
        description: `${filename} has been converted and is ready for download.`,
      }
    );
  };

  const onFilesSelect = useCallback(
    (selectedFiles: File[]) => {
      if (!isAuthenticated && files.length > 0) {
        setShowAuthModal(true);
        return;
      }

      const newFiles = selectedFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        status: "uploaded" as const,
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [isAuthenticated, files.length]
  );

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setIsComplete(false);

    const pendingFiles = files.filter((f) => f.status === "uploaded");

    for (let i = 0; i < pendingFiles.length; i++) {
      const fileStatus = pendingFiles[i];
      
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileStatus.id ? { ...f, status: "processing", progress: 0 } : f
        )
      );

      try {
        const startTime = Date.now();
        
        // Simulate progress
        for (let progress = 0; progress <= 90; progress += 10) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileStatus.id ? { ...f, progress } : f
            )
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const result = await PDFService.convertWordToPdf(fileStatus.file);
        const processingTime = Date.now() - startTime;

        if (result.success && result.data) {
          // Create download blob and URL
          const blob = new Blob([result.data], {
            type: "application/pdf",
          });
          const downloadUrl = URL.createObjectURL(blob);
          const outputFilename = `${fileStatus.file.name.replace(/\.(docx?|doc)$/i, "")}_converted.pdf`;

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileStatus.id
                ? {
                    ...f,
                    status: "completed",
                    progress: 100,
                    processingTime,
                    result: {
                      data: result.data,
                      filename: outputFilename,
                      downloadUrl,
                      fileSize: result.data.byteLength,
                    },
                  }
                : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileStatus.id
                ? {
                    ...f,
                    status: "error",
                    errorMessage: result.error || "Conversion failed",
                  }
                : f
            )
          );
        }
      } catch (error) {
        console.error("Conversion error:", error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileStatus.id
              ? {
                  ...f,
                  status: "error",
                  errorMessage: "Conversion failed",
                }
              : f
          )
        );
      }
    }

    setIsProcessing(false);
    setIsComplete(true);
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

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.result?.downloadUrl) {
        URL.revokeObjectURL(fileToRemove.result.downloadUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const resetAll = () => {
    files.forEach((file) => {
      if (file.result?.downloadUrl) {
        URL.revokeObjectURL(file.result.downloadUrl);
      }
    });
    setFiles([]);
    setIsProcessing(false);
    setIsComplete(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <AdvancedSEO
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonicalUrl={seoData.canonicalUrl}
        ogTitle={seoData.ogTitle}
        ogDescription={seoData.ogDescription}
        twitterTitle={seoData.twitterTitle}
        twitterDescription={seoData.twitterDescription}
        structuredData={seoData.structuredData}
      />
      <Header />
      <PromoBanner />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <FileText className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Word to PDF Converter
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Convert your Word documents to PDF format while preserving formatting and layout
            </p>
          </div>

          {/* Upload Section */}
          {files.length === 0 && (
            <div className="mb-8">
              <FileUpload
                onFilesSelect={onFilesSelect}
                accept=".doc,.docx"
                maxFiles={isAuthenticated ? 10 : 1}
                maxSize={50 * 1024 * 1024}
                title="Upload Word Documents"
                description="Select .doc or .docx files to convert to PDF"
              />
            </div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  Documents ({files.length})
                </h2>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add More
                  </Button>
                  <Button variant="outline" onClick={resetAll}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset All
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {files.map((fileStatus) => (
                  <Card key={fileStatus.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="font-medium truncate">
                              {fileStatus.file.name}
                            </span>
                            <Badge
                              variant={
                                fileStatus.status === "completed"
                                  ? "default"
                                  : fileStatus.status === "error"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {fileStatus.status === "processing"
                                ? "Converting..."
                                : fileStatus.status === "completed"
                                ? "Ready"
                                : fileStatus.status === "error"
                                ? "Failed"
                                : "Uploaded"}
                            </Badge>
                          </div>

                          {fileStatus.status === "processing" && (
                            <div className="space-y-2">
                              <Progress value={fileStatus.progress} />
                              <p className="text-sm text-gray-500">
                                Converting... {fileStatus.progress}%
                              </p>
                            </div>
                          )}

                          {fileStatus.status === "completed" && (
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-green-600">
                                ✓ Converted successfully
                              </span>
                              {fileStatus.processingTime && (
                                <span className="text-sm text-gray-500">
                                  {(fileStatus.processingTime / 1000).toFixed(1)}s
                                </span>
                              )}
                            </div>
                          )}

                          {fileStatus.status === "error" && (
                            <p className="text-sm text-red-600">
                              {fileStatus.errorMessage}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {fileStatus.status === "completed" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                downloadFile(
                                  fileStatus.result!.downloadUrl,
                                  fileStatus.result!.filename
                                )
                              }
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(fileStatus.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!isProcessing && !isComplete && (
                  <Button onClick={processFiles} size="lg" className="flex-1 sm:flex-none">
                    <Zap className="w-5 h-5 mr-2" />
                    Convert to PDF
                  </Button>
                )}

                {files.some((f) => f.status === "completed") && (
                  <Button variant="outline" onClick={downloadAll} size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Download All
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Hidden file input for adding more files */}
          <input
            ref={fileInputRef}
            type="file"
            multiple={isAuthenticated}
            accept=".doc,.docx"
            className="hidden"
            onChange={(e) => {
              const selectedFiles = Array.from(e.target.files || []);
              if (selectedFiles.length > 0) {
                onFilesSelect(selectedFiles);
              }
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Download Modal with Ad */}
      <DownloadModal {...downloadModal.modalProps} />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="Sign in to convert multiple files"
          description="Create a free account to convert multiple Word documents at once."
        />
      )}
    </div>
  );
};

export default WordToPdf;
