import { useState, useCallback, useRef, useEffect } from "react";
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
import SEO from "@/components/SEO";
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
  Bug,
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
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "available" | "unavailable"
  >("checking");
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend status on mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(
          "https://pdfpage-app.onrender.com/api/health",
          { timeout: 5000 },
        );
        if (response.ok) {
          setBackendStatus("available");
          addDebugLog("✅ Backend services available");
        } else {
          setBackendStatus("unavailable");
          addDebugLog(
            "⚠️ Backend services unavailable - using browser-only mode",
          );
        }
      } catch (error) {
        setBackendStatus("unavailable");
        addDebugLog("⚠️ Cannot connect to backend - using browser-only mode");
      }
    };

    checkBackendStatus();
  }, []);

  // PDF debugging function
  const debugPDFFile = async (file: File) => {
    addDebugLog(`Starting PDF analysis for: ${file.name}`);

    try {
      const { debugPDFFile: debugFunction, formatDebugInfo } = await import(
        "../utils/pdf-debug"
      );
      const debugInfo = await debugFunction(file);
      const report = formatDebugInfo(debugInfo);

      addDebugLog("PDF Analysis Results:");
      report.split("\n").forEach((line) => {
        if (line.trim()) addDebugLog(line);
      });

      return debugInfo;
    } catch (error) {
      addDebugLog(`PDF analysis failed: ${error.message}`);
      return null;
    }
  };

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
        addDebugLog(`Starting conversion for file: ${fileStatus.file.name}`);
        addDebugLog(
          `File size: ${(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB`,
        );
        addDebugLog(`File type: ${fileStatus.file.type}`);

        // Debug the PDF file structure
        await debugPDFFile(fileStatus.file);

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
          "🌐 Enhanced API: https://pdfpage-app.onrender.com/api/pdf/to-word",
        );
        console.log(`🔗 Full API endpoint being called:`, {
          baseUrl: "https://pdfpage-app.onrender.com/api",
          endpoint: "/pdf/to-word",
          fullUrl: "https://pdfpage-app.onrender.com/api/pdf/to-word",
        });

        // Convert using backend API with REAL conversion (not demo)
        const conversionStartTime = Date.now();

        addDebugLog("Calling PDFService.pdfToWord...");
        addDebugLog(
          `Conversion settings: ${JSON.stringify(conversionSettings)}`,
        );

        console.log("🔄 About to call PDFService.pdfToWord with:", {
          fileName: fileStatus.file.name,
          fileSize: fileStatus.file.size,
          fileType: fileStatus.file.type,
          settings: conversionSettings,
        });

        // Use the new PDFService.pdfToWord method
        const result = await PDFService.pdfToWord(fileStatus.file, {
          preserveLayout: conversionSettings.preserveFormatting,
          extractImages: conversionSettings.extractImages,
          sessionId: `pdf_to_word_${Date.now()}`,
          onProgress: (progress) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileStatus.id && f.status === "processing"
                  ? { ...f, processingProgress: progress }
                  : f,
              ),
            );
          },
        });

        const conversionEndTime = Date.now();
        const processingTime = conversionEndTime - conversionStartTime;

        addDebugLog(`Conversion completed in ${processingTime}ms`);
        addDebugLog(
          `Result size: ${(result.data.byteLength / 1024 / 1024).toFixed(2)} MB`,
        );

        // Extract info from headers
        const originalSize = parseInt(
          result.headers?.["x-original-size"] || "0",
        );
        const convertedSize = parseInt(
          result.headers?.["x-converted-size"] ||
            result.data.byteLength.toString(),
        );
        const conversionMethod =
          result.headers?.["x-conversion-method"] || "unknown";

        addDebugLog(`Conversion method: ${conversionMethod}`);
        addDebugLog(`Original size: ${originalSize} bytes`);
        addDebugLog(`Converted size: ${convertedSize} bytes`);

        console.log("✅ Conversion completed successfully:", {
          timeTaken: processingTime,
          resultSize: result.data.byteLength,
          conversionMethod,
          originalSize,
          convertedSize,
        });

        // Clear progress interval
        clearInterval(progressInterval);

        console.log(
          `✅ Real PDF to Word conversion completed for: ${fileStatus.file.name}`,
        );

        // Create download blob and URL
        const blob = new Blob([result.data], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const downloadUrl = URL.createObjectURL(blob);
        const outputFilename = `${fileStatus.file.name.replace(/\.pdf$/i, "")}_converted.docx`;

        // Validate conversion result
        if (result.data.byteLength === 0) {
          addDebugLog("⚠️ Conversion returned empty file");
          throw new Error("Conversion failed: Generated file is empty");
        }

        addDebugLog(
          `✅ Conversion successful, file size: ${result.data.byteLength} bytes`,
        );

        console.log("✅ Conversion result validation passed:", {
          hasData: !!result.data,
          dataSize: result.data.byteLength,
          conversionMethod: conversionMethod,
          hasHeaders: !!result.headers,
        });

        // Update file status with real conversion results
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileStatus.id
              ? {
                  ...f,
                  status: "completed",
                  pages: 1, // We'll use a default since we don't extract this info yet
                  textLength: result.data.byteLength, // Use file size as proxy
                  processingTime: processingTime,
                  conversionType: conversionMethod,
                  downloadUrl,
                  processingProgress: 100,
                }
              : f,
          ),
        );

        // Update stats
        completedFiles++;
        totalPages += 1; // Default to 1 page
        totalTextLength += result.data.byteLength;
        totalProcessingTime += processingTime;

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

        let errorMessage =
          error instanceof Error ? error.message : "Conversion failed";
        let toastDescription = `${fileStatus.file.name}: ${errorMessage}`;

        // Provide more helpful error messages
        if (errorMessage.includes("HTTP error! status: 500")) {
          errorMessage =
            "Server conversion temporarily unavailable. Using browser-based conversion instead.";
          toastDescription = `${fileStatus.file.name}: Server is temporarily unavailable. The system used a browser-based conversion which may have different formatting.`;
        } else if (errorMessage.includes("nodebuffer is not supported")) {
          errorMessage =
            "Browser conversion limitation detected. Using text-only fallback.";
          toastDescription = `${fileStatus.file.name}: Advanced conversion failed. Using text-only extraction as fallback.`;
        } else if (
          errorMessage.includes(
            "Backend unavailable and browser conversion failed",
          )
        ) {
          errorMessage =
            "All conversion methods failed. Please check your file and try again.";
          toastDescription = `${fileStatus.file.name}: Both server and browser conversion failed. Please ensure the PDF is not corrupted.`;
        }

        addDebugLog(
          `❌ Error converting ${fileStatus.file.name}: ${errorMessage}`,
        );

        console.error(`❌ Error converting ${fileStatus.file.name}:`, error);

        // Update file status with error and clear progress
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileStatus.id
              ? {
                  ...f,
                  status: "error",
                  processingProgress: 0,
                  errorMessage,
                }
              : f,
          ),
        );

        toast({
          title: "❌ Conversion Issue",
          description: toastDescription,
          variant: "destructive",
          duration: 8000,
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

  // Download converted file with preview functionality
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

      // Show download preview with file info
      toast({
        title: "🔄 Preparing Download",
        description: `Preparing ${fileName} for download...`,
        duration: 2000,
      });

      // Add small delay for better UX (show loading state)
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Create download link
      const link = document.createElement("a");
      link.href = fileStatus.downloadUrl;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success feedback with file details (safer toast handling)
      try {
        toast({
          title: "✅ Download Started",
          description: `${fileName} - ${fileStatus.pages || 0} pages • ${(fileStatus.textLength || 0).toLocaleString()} chars`,
          duration: 4000,
        });
      } catch (toastError) {
        console.warn("Toast notification error:", toastError);
      }

      // Track download analytics
      console.log("File downloaded:", {
        originalName: fileStatus.file.name,
        downloadName: fileName,
        fileSize: fileStatus.file.size,
        conversionType: fileStatus.conversionType,
        pages: fileStatus.pages,
        textLength: fileStatus.textLength,
      });

      // Show additional download preview info with error handling
      setTimeout(() => {
        try {
          toast({
            title: "📄 File Preview Info",
            description: `Original: ${fileStatus.file.name} → Converted: ${fileName} (Microsoft Word format) - You can now open this file in Microsoft Word, Google Docs, or any compatible word processor.`,
            duration: 6000,
          });
        } catch (toastError) {
          console.warn("Preview toast notification error:", toastError);
        }
      }, 1000);
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
      <SEO
        title="PDF to Word Converter Free | PDFPage - Convert PDF to DOCX Online"
        description="Convert PDF to Word online free with PDFPage. Fast, secure PDF to DOCX converter. No registration, no watermark. Works on mobile, desktop. Trusted by millions worldwide. Try now!"
        keywords="pdf to word, convert pdf to word, free pdf to word converter, online pdf to word, pdf to word converter online, pdf to docx, pdf to word pdfpage, pdf to word converter free, convert pdf to editable word, best pdf to word converter, pdf to doc converter, convert pdf to docx free, word from pdf, pdf2word, pdftoword, pd to word, pdf word convert, how to convert pdf to word for free, pdf to word converter without login, pdf to word converter without watermark, secure pdf to word converter, fast pdf to word conversion"
        canonical="/pdf-to-word"
        ogImage="/images/pdf-to-word-converter.jpg"
        toolName="PDF to Word Converter Free Online"
        toolType="pdf"
        schemaData={{
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How do I convert PDF to Word for free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Upload your PDF file, click 'Convert to Word', and download the converted DOCX file. No registration required and completely free."
              }
            },
            {
              "@type": "Question",
              "name": "Will the formatting be preserved?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, our advanced conversion engine preserves text formatting, fonts, images, tables, and layout as closely as possible."
              }
            },
            {
              "@type": "Question",
              "name": "What file formats are supported?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We support PDF input and convert to Microsoft Word DOCX format, which is compatible with Word 2007 and later versions."
              }
            },
            {
              "@type": "Question",
              "name": "Is my document secure?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, all files are processed securely and automatically deleted from our servers after conversion. We never store or access your documents."
              }
            },
            {
              "@type": "Question",
              "name": "Can I convert password-protected PDFs?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You'll need to remove the password first using our PDF unlock tool, then convert the unlocked PDF to Word."
              }
            }
          ]
        }}
      />
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="flex items-center"
            >
              <Bug className="w-4 h-4 mr-1" />
              Debug
            </Button>
            {/* All features are free - no upgrade needed */}
          </div>
        </div>

        {/* Backend Status Indicator */}
        {backendStatus === "unavailable" && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <h4 className="font-medium text-yellow-800">
                  Browser-Only Mode
                </h4>
                <p className="text-yellow-700 text-sm">
                  Server conversion is temporarily unavailable. Using
                  browser-based conversion which may have different formatting.
                  Files are processed locally for privacy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl w-fit mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            PDF to Word Converter
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Convert PDF documents to editable Word (.docx) files with enhanced
            layout preservation technology. Our advanced engine maintains
            original formatting, document structure, tables, and spatial layouts
            for professional-quality conversions.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4">
            <Type className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">
              Enhanced Text Extraction
            </h3>
            <p className="text-gray-600 text-sm">
              Advanced spatial-aware extraction preserves original text
              positioning
            </p>
          </div>
          <div className="text-center p-4">
            <Layers className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Layout Preservation</h3>
            <p className="text-gray-600 text-sm">
              Maintains document structure, tables, columns, and formatting
            </p>
          </div>
          <div className="text-center p-4">
            <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">
              Professional Quality
            </h3>
            <p className="text-gray-600 text-sm">
              Industry-grade conversion with proper alignment and spacing
            </p>
          </div>
          <div className="text-center p-4">
            <FileCheck className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Structure Detection</h3>
            <p className="text-gray-600 text-sm">
              Intelligent recognition of headers, lists, tables, and content
              types
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

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bug className="w-5 h-5 mr-2" />
                  Debug Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      System Information
                    </h4>
                    <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                      <p>
                        <strong>API URL:</strong>{" "}
                        {"https://pdfpage-app.onrender.com/api"}
                      </p>
                      <p>
                        <strong>Environment:</strong> {import.meta.env.MODE}
                      </p>
                      <p>
                        <strong>Authenticated:</strong>{" "}
                        {isAuthenticated ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Files Uploaded:</strong> {files.length}
                      </p>
                    </div>

                    {/* Show backend restart notice if extraction issues detected */}
                    {files.some(
                      (f) =>
                        f.status === "completed" &&
                        (f.pages === 0 ||
                          f.conversionType === "needs_backend_restart"),
                    ) && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <RefreshCw className="w-5 h-5 text-orange-600 mt-0.5" />
                          </div>
                          <div className="ml-3">
                            <h5 className="font-medium text-orange-800 mb-2">
                              🔧 Backend Service Restart Required
                            </h5>
                            <p className="text-sm text-orange-700 mb-3">
                              Recent improvements to PDF extraction require
                              restarting the backend service:
                            </p>
                            <div className="bg-white rounded p-2 border border-orange-200">
                              <ol className="text-sm text-gray-700 space-y-1 list-decimal ml-4">
                                <li>Open your backend terminal</li>
                                <li>
                                  Press{" "}
                                  <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                                    Ctrl+C
                                  </kbd>{" "}
                                  to stop the service
                                </li>
                                <li>
                                  Run:{" "}
                                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                    cd backend && npm run dev
                                  </code>
                                </li>
                                <li>Wait for "Server running" message</li>
                                <li>Try uploading your PDF again</li>
                              </ol>
                            </div>
                            <p className="text-xs text-orange-600 mt-2">
                              💡 This will enable enhanced PDF parsing that can
                              extract content from more document types.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Debug Log
                    </h4>
                    <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-64 overflow-y-auto">
                      {debugLog.length > 0 ? (
                        debugLog.map((log, index) => (
                          <div key={index}>{log}</div>
                        ))
                      ) : (
                        <div className="text-gray-500">
                          No debug logs yet. Upload a file to start debugging.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDebugLog([])}
                    >
                      Clear Log
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        addDebugLog("Testing backend connectivity...");
                        try {
                          const response = await fetch(
                            "https://pdfpage-app.onrender.com/api/health",
                          );
                          if (response.ok) {
                            const data = await response.json();
                            addDebugLog(`✅ Backend connected: ${data.status}`);
                          } else {
                            addDebugLog(`❌ Backend error: ${response.status}`);
                          }
                        } catch (error) {
                          addDebugLog(`❌ Connection failed: ${error.message}`);
                        }
                      }}
                    >
                      Test Backend
                    </Button>
                    {files.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const firstFile = files[0];
                          if (firstFile) {
                            addDebugLog(
                              `Analyzing PDF structure of: ${firstFile.file.name}`,
                            );
                            await debugPDFFile(firstFile.file);
                          }
                        }}
                      >
                        Analyze PDF
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
