import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  FileSpreadsheet,
  Crown,
  Star,
  Table,
  Database,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface FileStatus {
  file: File;
  status: "ready" | "converting" | "completed" | "error";
  progress: number;
  result?: {
    filename: string;
    downloadUrl: string;
    fileSize: number;
    tablesFound: number;
    sheetsCreated: number;
    processingTime: number;
  };
  error?: string;
}

const PdfToExcel = () => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (uploadedFiles: File[]) => {
    const newFiles: FileStatus[] = uploadedFiles.map((file) => ({
      file,
      status: "ready",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload PDF files to convert to Excel.",
        variant: "destructive",
      });
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
          const formData = new FormData();
          formData.append("file", fileStatus.file);
          formData.append("extractTables", "true");
          formData.append("preserveFormatting", "true");

          const response = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/pdf/to-excel`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: formData,
            },
          );

          // Update progress
          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, progress: 50 } : f)),
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || `HTTP error! status: ${response.status}`,
            );
          }

          const blob = await response.blob();

          // Update progress
          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, progress: 80 } : f)),
          );

          // Get metadata from headers
          const tablesFound = parseInt(
            response.headers.get("X-Tables-Found") || "0",
          );
          const sheetsCreated = parseInt(
            response.headers.get("X-Sheets-Created") || "0",
          );
          const processingTime = parseInt(
            response.headers.get("X-Processing-Time") || "0",
          );

          // Create download URL
          const downloadUrl = URL.createObjectURL(blob);
          const filename = fileStatus.file.name.replace(/\.pdf$/i, ".xlsx");

          // Update with success
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "completed",
                    progress: 100,
                    result: {
                      filename,
                      downloadUrl,
                      fileSize: blob.size,
                      tablesFound,
                      sheetsCreated,
                      processingTime,
                    },
                  }
                : f,
            ),
          );

          toast({
            title: `✅ ${fileStatus.file.name} converted successfully`,
            description: `Found ${tablesFound} tables, created ${sheetsCreated} sheets`,
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

  const downloadFile = (downloadUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    link.click();
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

  const retryFile = async (index: number) => {
    const fileStatus = files[index];
    if (fileStatus.status !== "error") return;

    setFiles((prev) =>
      prev.map((f, idx) =>
        idx === index
          ? { ...f, status: "ready", progress: 0, error: undefined }
          : f,
      ),
    );
  };

  const clearAll = () => {
    setFiles([]);
  };

  const completedFiles = files.filter((f) => f.status === "completed");
  const hasCompletedFiles = completedFiles.length > 0;

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PromoBanner className="mb-8" />

        {/* Navigation */}
        <div className="flex items-center space-x-2 mb-8">
          <Link
            to="/"
            className="text-body-medium text-text-light hover:text-brand-red"
          >
            <ArrowLeft className="w-4 h-4 mr-1 inline" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-large text-text-dark mb-4">
            PDF to Excel Converter
          </h1>
          <p className="text-body-large text-text-light max-w-3xl mx-auto">
            Extract tables and data from PDF files and convert them to Excel
            spreadsheets. Our advanced table detection technology identifies
            structured data and creates professional Excel files with multiple
            sheets.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-2" />
            Real table extraction • Professional Excel output
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4">
            <Table className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">
              Smart Table Detection
            </h3>
            <p className="text-gray-600 text-sm">
              Automatically identifies and extracts tables from your PDFs
            </p>
          </div>
          <div className="text-center p-4">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Multi-Sheet Output</h3>
            <p className="text-gray-600 text-sm">
              Creates separate Excel sheets for each table found
            </p>
          </div>
          <div className="text-center p-4">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Professional Format</h3>
            <p className="text-gray-600 text-sm">
              Maintains formatting with headers, borders, and styling
            </p>
          </div>
          <div className="text-center p-4">
            <FileSpreadsheet className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Excel Compatible</h3>
            <p className="text-gray-600 text-sm">
              Generates .xlsx files that work perfectly with Excel
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* File Upload */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <FileUpload
              onFilesSelect={handleFileUpload}
              accept=".pdf"
              multiple={true}
              maxSize={50}
              title="Upload PDF Files"
              description="Select PDF files containing tables or structured data to convert to Excel"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-dark">
                  Files ({files.length})
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={handleConvert}
                    disabled={
                      isProcessing || files.every((f) => f.status !== "ready")
                    }
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Convert to Excel
                      </>
                    )}
                  </Button>
                  {hasCompletedFiles && (
                    <Button
                      onClick={downloadAll}
                      variant="outline"
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                  )}
                  <Button variant="outline" onClick={clearAll}>
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {files.map((fileStatus, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {fileStatus.status === "ready" && (
                          <FileText className="w-5 h-5 text-gray-500" />
                        )}
                        {fileStatus.status === "converting" && (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {fileStatus.status === "completed" && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {fileStatus.status === "error" && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-text-dark">
                            {fileStatus.file.name}
                          </p>
                          <p className="text-sm text-text-light">
                            {(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {fileStatus.status === "converting" && (
                          <div className="w-32">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${fileStatus.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {fileStatus.progress}%
                            </p>
                          </div>
                        )}

                        {fileStatus.status === "completed" &&
                          fileStatus.result && (
                            <div className="text-right mr-4">
                              <p className="text-sm text-green-600 font-medium">
                                {fileStatus.result.tablesFound} tables found
                              </p>
                              <p className="text-xs text-gray-500">
                                {fileStatus.result.sheetsCreated} sheets created
                              </p>
                            </div>
                          )}

                        {fileStatus.status === "error" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryFile(index)}
                          >
                            Retry
                          </Button>
                        )}

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
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>

                    {fileStatus.status === "error" && fileStatus.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {fileStatus.error}
                      </div>
                    )}

                    {fileStatus.status === "completed" && fileStatus.result && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-green-700">
                          <div>
                            <span className="font-medium">Size:</span>{" "}
                            {(fileStatus.result.fileSize / 1024 / 1024).toFixed(
                              2,
                            )}{" "}
                            MB
                          </div>
                          <div>
                            <span className="font-medium">Tables:</span>{" "}
                            {fileStatus.result.tablesFound}
                          </div>
                          <div>
                            <span className="font-medium">Sheets:</span>{" "}
                            {fileStatus.result.sheetsCreated}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span>{" "}
                            {(fileStatus.result.processingTime / 1000).toFixed(
                              1,
                            )}
                            s
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Premium Features */}
          {!user?.isPremiumActive && (
            <Card className="border-brand-yellow bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <Crown className="w-5 h-5 mr-2 text-brand-yellow" />
                  Unlock Premium Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-orange-700 mb-4">
                  <li className="flex items-center">
                    <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                    Process unlimited PDF files
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                    Advanced table detection algorithms
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                    Larger file size support (up to 50MB)
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                    Custom formatting options
                  </li>
                </ul>
                <Button className="bg-brand-yellow text-black hover:bg-yellow-400">
                  <Crown className="w-4 h-4 mr-2" />
                  Get Premium
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="register"
      />
    </div>
  );
};

export default PdfToExcel;
