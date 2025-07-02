import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
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
  Layers,
  Type,
  Image,
  Info,
} from "lucide-react";

interface FileWithStatus {
  file: File;
  id: string;
  status: "uploaded" | "processing" | "completed" | "error";
  pages?: number;
  textLength?: number;
  errorMessage?: string;
  processingTime?: number;
  conversionType?: string;
  downloadUrl?: string;
  processingProgress?: number;
}

interface ConversionStats {
  totalFiles: number;
  processedFiles: number;
  totalPages: number;
  extractedTextLength: number;
  averageProcessingTime: number;
}

const PdfToWord = () => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Conversion settings
  const [conversionSettings, setConversionSettings] = useState({
    extractImages: false,
    preserveFormatting: true,
    includeMetadata: true,
  });

  // Real-time features state
  const [progress, setProgress] = useState(0);
  const [currentProcessingFile, setCurrentProcessingFile] =
    useState<string>("");
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set(),
  );
  const [conversionStats, setConversionStats] = useState<ConversionStats>({
    totalFiles: 0,
    processedFiles: 0,
    totalPages: 0,
    extractedTextLength: 0,
    averageProcessingTime: 0,
  });

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFilesSelect = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;

      // All tools are completely free - no authentication required

      // Validate files
      const validFiles = selectedFiles.filter((file) => {
        if (file.type !== "application/pdf") {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a PDF file.`,
            variant: "destructive",
          });
          return false;
        }
        if (file.size > 100 * 1024 * 1024) {
          // 100MB limit for all users
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 100MB limit.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // Add files to processing queue
      const newFiles: FileWithStatus[] = validFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: "uploaded",
      }));

      setFiles((prev) => [...prev, ...newFiles]);
      setIsComplete(false);

      // Auto-start conversion for single file
      if (newFiles.length === 1) {
        setTimeout(() => handleConvert([newFiles[0]]), 500);
      }
    },
    [isAuthenticated, user, toast],
  );

  // Convert files
  const handleConvert = async (filesToConvert?: FileWithStatus[]) => {
    const targetFiles =
      filesToConvert || files.filter((f) => f.status === "uploaded");

    if (targetFiles.length === 0) {
      toast({
        title: "No files to convert",
        description: "Please upload PDF files first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Show enhanced conversion start notification
    toast({
      title: "🚀 Enhanced PDF to Word Conversion",
      description: `Converting ${targetFiles.length} PDF file(s) to Word format with advanced text extraction and structure preservation.`,
      duration: 3000,
    });

    const startTime = Date.now();
    let completedFiles = 0;
    let totalPages = 0;
    let totalTextLength = 0;
    let totalProcessingTime = 0;

    for (const fileStatus of targetFiles) {
      let progressInterval: NodeJS.Timeout | null = null;

      try {
        setCurrentProcessingFile(fileStatus.file.name);

        // Update file status to processing with progress indicator
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileStatus.id
              ? { ...f, status: "processing", processingProgress: 0 }
              : f,
          ),
        );

        // Show real-time progress
        progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileStatus.id && f.status === "processing"
                ? {
                    ...f,
                    processingProgress: Math.min(
                      (f.processingProgress || 0) + Math.random() * 15,
                      90,
                    ),
                  }
                : f,
            ),
          );
        }, 500);

        console.log(
          `🔄 Starting enhanced PDF extraction for: ${fileStatus.file.name}`,
        );
        console.log(
          `📄 Input: ${(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB PDF`,
        );
        console.log(`⚙️ Enhanced settings:`, {
          ...conversionSettings,
          mode: "real_text_extraction",
          structureAnalysis: true,
          formatPreservation: true,
        });
        console.log(
          `🌐 Enhanced API: ${import.meta.env.VITE_API_URL}/pdf/to-word`,
        );

        // Convert using backend API with REAL conversion (not demo)
        const conversionStartTime = Date.now();
        const result = await PDFService.convertPdfToWordAPI(
          fileStatus.file,
          conversionSettings,
        );
        const conversionEndTime = Date.now();

        console.log(
          `⏱️ Actual conversion time: ${conversionEndTime - conversionStartTime}ms`,
        );

        // Clear progress interval
        clearInterval(progressInterval);

        console.log(
          `✅ Real data extraction completed for: ${fileStatus.file.name}`,
        );
        console.log(`📊 Extracted content analysis:`, {
          sourcePages: result.stats.originalPages,
          extractedText: `${result.stats.textLength.toLocaleString()} characters`,
          processingTime: `${result.stats.processingTime}ms`,
          conversionMethod: result.stats.conversionType,
          outputFormat: "Microsoft Word (.docx)",
          outputSize: `${(result.file.size / 1024 / 1024).toFixed(2)} MB`,
          preservedFormatting: conversionSettings.preserveFormatting,
          realDataExtracted: true,
        });

        // Create download URL for real converted file
        const downloadUrl = URL.createObjectURL(result.file);

        // Update file status with real conversion results
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileStatus.id
              ? {
                  ...f,
                  status: "completed",
                  pages: result.stats.originalPages,
                  textLength: result.stats.textLength,
                  processingTime: result.stats.processingTime,
                  conversionType: result.stats.conversionType,
                  downloadUrl,
                  processingProgress: 100,
                }
              : f,
          ),
        );

        // Update stats
        completedFiles++;
        totalPages += result.stats.originalPages;
        totalTextLength += result.stats.textLength;
        totalProcessingTime += result.stats.processingTime;

        // Update progress
        setProgress((completedFiles / targetFiles.length) * 100);

        toast({
          title: "Conversion completed",
          description: `${fileStatus.file.name} has been converted to Word format.`,
        });
      } catch (error) {
        // Clear progress interval on error
        if (progressInterval) {
          clearInterval(progressInterval);
        }

        console.error(`❌ Error converting ${fileStatus.file.name}:`, error);

        // Update file status with error and clear progress
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileStatus.id
              ? {
                  ...f,
                  status: "error",
                  processingProgress: 0,
                  errorMessage:
                    error instanceof Error
                      ? error.message
                      : "Conversion failed",
                }
              : f,
          ),
        );

        toast({
          title: "❌ Conversion Failed",
          description: `${fileStatus.file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
          duration: 6000,
        });
      }
    }

    // Update final stats
    setConversionStats({
      totalFiles: targetFiles.length,
      processedFiles: completedFiles,
      totalPages,
      extractedTextLength: totalTextLength,
      averageProcessingTime:
        completedFiles > 0
          ? Math.round(totalProcessingTime / completedFiles)
          : 0,
    });

    setIsProcessing(false);
    setIsComplete(completedFiles > 0);
    setCurrentProcessingFile("");
    setProgress(100);
  };

  // Download converted file
  const downloadFile = async (fileStatus: FileWithStatus) => {
    if (!fileStatus.downloadUrl) {
      toast({
        title: "Download Error",
        description:
          "File not ready for download. Please try converting again.",
        variant: "destructive",
      });
      return;
    }

    // Set downloading state
    setDownloadingFiles((prev) => new Set(prev).add(fileStatus.id));

    try {
      // Generate descriptive filename
      const originalName = fileStatus.file.name.replace(/\.pdf$/i, "");
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `${originalName}_converted_${timestamp}.docx`;

      // Add small delay for better UX (show loading state)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const link = document.createElement("a");
      link.href = fileStatus.downloadUrl;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success feedback
      toast({
        title: "✅ Download Started",
        description: `${fileName} is being downloaded to your device.`,
        duration: 4000,
      });

      // Track download analytics (optional)
      console.log("File downloaded:", {
        originalName: fileStatus.file.name,
        downloadName: fileName,
        fileSize: fileStatus.file.size,
        conversionType: fileStatus.conversionType,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description:
          "There was an error downloading the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove downloading state
      setDownloadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileStatus.id);
        return next;
      });
    }
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles((prev) => {
      const updatedFiles = prev.filter((f) => f.id !== id);

      // Clean up download URLs
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.downloadUrl) {
        URL.revokeObjectURL(fileToRemove.downloadUrl);
      }

      return updatedFiles;
    });
  };

  // Reset all
  const resetAll = () => {
    // Clean up download URLs
    files.forEach((file) => {
      if (file.downloadUrl) {
        URL.revokeObjectURL(file.downloadUrl);
      }
    });

    setFiles([]);
    setIsComplete(false);
    setProgress(0);
    setConversionStats({
      totalFiles: 0,
      processedFiles: 0,
      totalPages: 0,
      extractedTextLength: 0,
      averageProcessingTime: 0,
    });
  };

  const uploadedFiles = files.filter((f) => f.status === "uploaded").length;
  const completedFiles = files.filter((f) => f.status === "completed").length;
  const errorFiles = files.filter((f) => f.status === "error").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Tools
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {isProcessing ? "Converting..." : `${completedFiles} completed`}
            </Badge>
            {/* All features are free - no upgrade needed */}
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl w-fit mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            PDF to Word Converter
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Extract and convert real text content from your PDF documents to
            editable Word (.docx) files. Advanced text analysis preserves
            original formatting, structure, and layout - no artificial content
            added.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4">
            <Type className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Extract Real Text</h3>
            <p className="text-gray-600 text-sm">
              Extracts actual text content with original formatting preserved
            </p>
          </div>
          <div className="text-center p-4">
            <Layers className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Structure Analysis</h3>
            <p className="text-gray-600 text-sm">
              Analyzes and preserves document structure, headings, and lists
            </p>
          </div>
          <div className="text-center p-4">
            <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Fast Processing</h3>
            <p className="text-gray-600 text-sm">
              Quick conversion with real-time progress
            </p>
          </div>
          <div className="text-center p-4">
            <FileCheck className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Authentic Content</h3>
            <p className="text-gray-600 text-sm">
              100% original content extraction - no artificial text added
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {files.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <FileUpload
                    onFilesSelect={handleFilesSelect}
                    acceptedFileTypes={{
                      "application/pdf": [".pdf"],
                    }}
                    maxFiles={10}
                    maxSize={100}
                    multiple={true}
                    uploadText="Select PDF files or drop them here"
                    supportText="Supports PDF documents up to 25MB (100MB for premium users)"
                  />

                  {!isAuthenticated && (
                    <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-start">
                        <Crown className="w-5 h-5 text-orange-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-orange-900">
                            Unlock Premium Features
                          </h4>
                          <p className="text-sm text-orange-700 mt-1">
                            Sign up to convert multiple files, access advanced
                            settings, and get priority processing.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-orange-600 border-orange-300"
                            onClick={() => setShowAuthModal(true)}
                          >
                            Sign Up Free
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* File List */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Files ({files.length})
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Add More
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetAll}
                        disabled={isProcessing}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {files.map((fileStatus) => (
                        <div
                          key={fileStatus.id}
                          className={cn(
                            "flex items-center p-4 rounded-lg border",
                            fileStatus.status === "completed" &&
                              "bg-green-50 border-green-200",
                            fileStatus.status === "error" &&
                              "bg-red-50 border-red-200",
                            fileStatus.status === "processing" &&
                              "bg-blue-50 border-blue-200",
                            fileStatus.status === "uploaded" &&
                              "bg-gray-50 border-gray-200",
                          )}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900 truncate">
                                  {fileStatus.file.name}
                                </p>
                                {fileStatus.status === "completed" && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-800 animate-pulse"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Ready to Download
                                  </Badge>
                                )}
                                {fileStatus.status === "processing" && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-100 text-blue-800 relative overflow-hidden"
                                  >
                                    <div
                                      className="absolute inset-0 bg-blue-200 transition-all duration-300"
                                      style={{
                                        width: `${fileStatus.processingProgress || 0}%`,
                                      }}
                                    />
                                    <div className="relative flex items-center">
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Converting...{" "}
                                      {Math.round(
                                        fileStatus.processingProgress || 0,
                                      )}
                                      %
                                    </div>
                                  </Badge>
                                )}
                                {fileStatus.status === "uploaded" && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-gray-100 text-gray-800"
                                  >
                                    <FileText className="w-3 h-3 mr-1" />
                                    Ready
                                  </Badge>
                                )}
                                {fileStatus.status === "error" && (
                                  <Badge
                                    variant="destructive"
                                    className="bg-red-100 text-red-800"
                                  >
                                    <span className="w-3 h-3 mr-1">⚠️</span>
                                    Failed
                                  </Badge>
                                )}
                                {fileStatus.status === "error" && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-red-100 text-red-800"
                                  >
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-sm text-gray-500">
                                  {(
                                    fileStatus.file.size /
                                    (1024 * 1024)
                                  ).toFixed(1)}{" "}
                                  MB
                                </p>
                                {fileStatus.pages && (
                                  <p className="text-sm text-gray-500">
                                    {fileStatus.pages} pages
                                  </p>
                                )}
                                {fileStatus.textLength && (
                                  <p className="text-sm text-gray-500">
                                    {fileStatus.textLength.toLocaleString()}{" "}
                                    characters
                                  </p>
                                )}
                                {fileStatus.processingTime && (
                                  <p className="text-sm text-gray-500">
                                    {fileStatus.processingTime}ms
                                  </p>
                                )}
                              </div>
                              {fileStatus.errorMessage && (
                                <p className="text-sm text-red-600 mt-1">
                                  {fileStatus.errorMessage}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {fileStatus.status === "completed" && (
                              <Button
                                size="sm"
                                onClick={() => downloadFile(fileStatus)}
                                disabled={downloadingFiles.has(fileStatus.id)}
                                className={cn(
                                  "relative overflow-hidden group text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 px-3 py-2",
                                  downloadingFiles.has(fileStatus.id)
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 cursor-not-allowed"
                                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-102",
                                )}
                              >
                                <div className="flex items-center">
                                  {downloadingFiles.has(fileStatus.id) ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                      <span className="font-medium text-sm">
                                        Downloading...
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4 mr-1.5 group-hover:animate-bounce" />
                                      <span className="font-medium text-sm">
                                        Download DOCX
                                      </span>
                                    </>
                                  )}
                                </div>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFile(fileStatus.id)}
                              disabled={isProcessing}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Individual download buttons are available for each file in the list above */}

                {/* Real-Time Processing Progress */}
                {isProcessing && (
                  <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            <h3 className="font-medium text-gray-900">
                              Real-Time PDF → Word Conversion
                            </h3>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            {Math.round(progress)}% Complete
                          </Badge>
                        </div>
                        <Progress value={progress} className="w-full" />
                        {currentProcessingFile && (
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              <p className="text-sm font-medium text-gray-900">
                                Processing: {currentProcessingFile}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Converting PDF content to editable Word format...
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Conversion Actions */}
                {uploadedFiles > 0 && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => handleConvert()}
                      disabled={isProcessing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Converting{" "}
                          {
                            files.filter((f) => f.status === "processing")
                              .length
                          }{" "}
                          files...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Convert {uploadedFiles} file
                          {uploadedFiles !== 1 ? "s" : ""} to Word
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Hidden file input for adding more files */}
            <input
              ref={fileInputRef}
              type="file"
              multiple={isAuthenticated}
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []);
                if (selectedFiles.length > 0) {
                  handleFilesSelect(selectedFiles);
                }
                e.target.value = ""; // Reset input
              }}
            />
          </div>

          {/* Settings & Stats Panel */}
          <div className="space-y-6">
            {/* Conversion Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Conversion Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      Preserve Formatting
                    </p>
                    <p className="text-sm text-gray-500">
                      Maintain text styles and structure
                    </p>
                  </div>
                  <Switch
                    checked={conversionSettings.preserveFormatting}
                    onCheckedChange={(checked) =>
                      setConversionSettings((prev) => ({
                        ...prev,
                        preserveFormatting: checked,
                      }))
                    }
                    disabled={isProcessing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      Include Metadata
                    </p>
                    <p className="text-sm text-gray-500">
                      Add document information
                    </p>
                  </div>
                  <Switch
                    checked={conversionSettings.includeMetadata}
                    onCheckedChange={(checked) =>
                      setConversionSettings((prev) => ({
                        ...prev,
                        includeMetadata: checked,
                      }))
                    }
                    disabled={isProcessing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">Extract Images</p>
                    <p className="text-sm text-gray-500">
                      Include embedded images
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Premium
                    </Badge>
                  </div>
                  <Switch
                    checked={conversionSettings.extractImages}
                    onCheckedChange={(checked) =>
                      setConversionSettings((prev) => ({
                        ...prev,
                        extractImages: checked,
                      }))
                    }
                    disabled={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Conversion Stats */}
            {(isComplete || isProcessing) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Conversion Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Files</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {conversionStats.totalFiles}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-lg font-semibold text-green-600">
                        {conversionStats.processedFiles}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Pages</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {conversionStats.totalPages}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Avg Time</p>
                      <p className="text-lg font-semibold text-orange-600">
                        {conversionStats.averageProcessingTime}ms
                      </p>
                    </div>
                  </div>

                  {conversionStats.extractedTextLength > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Text Extracted</p>
                      <p className="text-lg font-semibold text-gray-700">
                        {conversionStats.extractedTextLength.toLocaleString()}{" "}
                        characters
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* All features are completely free */}
          </div>
        </div>

        {/* Promo Banner */}
        <div className="mt-12">
          <PromoBanner
            title="Need More PDF Tools?"
            description="Explore our complete suite of PDF tools for merging, splitting, compressing, and more."
            buttonText="View All Tools"
            buttonLink="/"
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          />
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default PdfToWord;
