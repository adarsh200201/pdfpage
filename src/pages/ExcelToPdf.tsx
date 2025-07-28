import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  X,
  FileCheck,
  Zap,
} from "lucide-react";

interface FileStatus {
  file: File;
  status: "ready" | "converting" | "completed" | "error";
  progress: number;
  currentStep?: string;
  result?: {
    filename: string;
    downloadUrl: string;
    fileSize: number;
  };
  error?: string;
}

const ExcelToPdf = () => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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

    // Prevent multiple simultaneous conversion attempts
    if (isProcessing) {
      console.log("Conversion already in progress, ignoring duplicate request");
      return;
    }

    console.log("Starting conversion...");
    setIsProcessing(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const fileStatus = files[i];

        if (fileStatus.status !== "ready") continue;

        console.log(`Converting file ${i + 1}: ${fileStatus.file.name}`);

        // Update status to converting
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "converting",
                  progress: 10,
                  currentStep: "Uploading to server...",
                }
              : f,
          ),
        );

        try {
          let conversionResult = null;

          try {
            // Try server-side conversion first
            const formData = new FormData();
            formData.append("file", fileStatus.file);

            // Update progress
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i
                  ? {
                      ...f,
                      progress: 30,
                      currentStep: "Trying server conversion...",
                    }
                  : f,
              ),
            );

            const apiUrl = "https://pdf-backend-935131444417.asia-south1.run.app/api";

            // Get auth token if available
            const getAuthHeaders = (): Record<string, string> => {
              const token =
                localStorage.getItem("pdfpage_token") ||
                sessionStorage.getItem("pdfpage_token");
              return token ? { Authorization: `Bearer ${token}` } : {};
            };

            const response = await fetch(`${apiUrl}/libreoffice/xlsx-to-pdf`, {
              method: "POST",
              headers: getAuthHeaders(),
              body: formData,
            });

            if (response.ok) {
              // Update progress
              setFiles((prev) =>
                prev.map((f, idx) =>
                  idx === i
                    ? {
                        ...f,
                        progress: 80,
                        currentStep: "Server processing complete...",
                      }
                    : f,
                ),
              );

              const arrayBuffer = await response.arrayBuffer();
              const blob = new Blob([arrayBuffer], { type: "application/pdf" });
              conversionResult = { blob, method: "Server-side" };
            } else {
              const errorText = await response
                .text()
                .catch(() => "Unknown error");
              throw new Error(
                `Server conversion failed (${response.status}): ${errorText}`,
              );
            }
          } catch (serverError: any) {
            console.warn(
              "Server conversion failed, trying client-side:",
              serverError,
            );

            // Show user-friendly error message
            toast({
              title: "Server conversion failed",
              description: "Falling back to client-side conversion...",
              variant: "destructive",
            });

            // Fallback to client-side conversion
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i
                  ? {
                      ...f,
                      progress: 40,
                      currentStep: "Trying client-side conversion...",
                    }
                  : f,
              ),
            );

            // Import and use client-side service
            const { default: EnhancedExcelToPdfService } = await import(
              "@/services/enhancedExcelToPdf"
            );

            const result = await EnhancedExcelToPdfService.convertExcelToPdf(
              fileStatus.file,
              { pageFormat: "A4", orientation: "auto", quality: "high" },
              (progress, status) => {
                setFiles((prev) =>
                  prev.map((f, idx) =>
                    idx === i
                      ? {
                          ...f,
                          progress: 40 + Math.round(progress * 0.5),
                          currentStep: status,
                        }
                      : f,
                  ),
                );
              },
            );

            conversionResult = { blob: result.blob, method: "Client-side" };
          }

          if (!conversionResult) {
            throw new Error("Both server and client conversion failed");
          }

          // Update progress to completion
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    progress: 95,
                    currentStep: "Finalizing...",
                  }
                : f,
            ),
          );

          // Create download URL
          const downloadUrl = URL.createObjectURL(conversionResult.blob);
          const outputFilename = `${fileStatus.file.name.replace(/\.(xlsx?|xls)$/i, "")}_converted.pdf`;

          // Update file status with completion
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "completed",
                    progress: 100,
                    currentStep: "Complete",
                    result: {
                      filename: outputFilename,
                      downloadUrl,
                      fileSize: conversionResult.blob.size,
                    },
                  }
                : f,
            ),
          );

          toast({
            title: "Conversion Complete! ✨",
            description: `${fileStatus.file.name} converted successfully using ${conversionResult.method} processing!`,
          });

          console.log(
            `File ${i + 1} completed successfully using ${conversionResult.method}`,
          );
        } catch (error) {
          console.error(`Error converting ${fileStatus.file.name}:`, error);

          let errorMessage = "Conversion failed";
          if (error instanceof Error) {
            errorMessage = error.message;
          }

          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "error",
                    progress: 0,
                    currentStep: "Error",
                    error: errorMessage,
                  }
                : f,
            ),
          );

          toast({
            title: `❌ Error converting ${fileStatus.file.name}`,
            description: errorMessage,
            variant: "destructive",
          });
        }
      }

      console.log("All files processed");
    } catch (error) {
      console.error("Conversion process failed:", error);
      toast({
        title: "Conversion Failed",
        description: "An unexpected error occurred during conversion.",
        variant: "destructive",
      });
    } finally {
      console.log("Setting processing to false");
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
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl">
              <FileCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Excel to PDF Converter
            </h1>
            {import.meta.env.DEV && (
              <Link
                to="/debug/excel-to-pdf"
                className="ml-4 text-xs bg-gray-100 px-2 py-1 rounded"
              >
                Debug
              </Link>
            )}
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Convert Excel spreadsheets to PDF format quickly and easily.
            Supports .xlsx and .xls files with professional quality output.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              Enhanced Server-side Processing
            </span>
          </div>
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
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
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
                            disabled={isProcessing}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Status and Progress */}
                      {fileStatus.status === "converting" && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-600 font-medium">
                              {fileStatus.currentStep || "Converting..."}
                            </span>
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
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-800 mb-2">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-semibold">
                                Conversion Complete
                              </span>
                            </div>
                            <div className="text-sm text-green-700">
                              File size:{" "}
                              {formatFileSize(fileStatus.result.fileSize)}
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
                  disabled={files.length === 0 || isProcessing}
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
                      <Zap className="w-5 h-5 mr-2" />
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
                  <Button
                    variant="outline"
                    onClick={() => setFiles([])}
                    disabled={isProcessing}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <PromoBanner />
      </div>
    </div>
  );
};

export default ExcelToPdf;
