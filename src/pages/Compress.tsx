import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import BackToHome from "@/components/ui/back-to-home";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import toast from "@/lib/toast-utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  Gauge,
  Eye,
  Share2,
  Cloud,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Target,
  Minimize2,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/api-config";
import DownloadModal from "@/components/modals/DownloadModal";
import { useDownloadModal } from "@/hooks/useDownloadModal";
import { useActionAuth } from "@/hooks/useActionAuth";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview?: string;
}

interface CompressionResult {
  id: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  sizeSaved: number;
  downloadUrl: string;
  fileName: string;
  quality: string;
  processingTime: number;
}

interface CompressionLevel {
  id: "high" | "balanced" | "low";
  name: string;
  description: string;
  quality: string;
  expectedReduction: string;
  icon: React.ReactNode;
  gradient: string;
  settings: {
    dpi: number;
    jpegQuality: number;
    pdfSettings: string;
  };
}

const COMPRESSION_LEVELS: CompressionLevel[] = [
  {
    id: "high",
    name: "High Compression",
    description: "Maximum file size reduction for web sharing and email",
    quality: "Good Quality",
    expectedReduction: "60-85%",
    icon: <Minimize2 className="w-5 h-5" />,
    gradient: "from-red-500 to-orange-500",
    settings: {
      dpi: 72,
      jpegQuality: 50,
      pdfSettings: "/screen",
    },
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Optimal balance between file size and visual quality",
    quality: "High Quality",
    expectedReduction: "35-60%",
    icon: <Target className="w-5 h-5" />,
    gradient: "from-blue-500 to-cyan-500",
    settings: {
      dpi: 150,
      jpegQuality: 75,
      pdfSettings: "/ebook",
    },
  },
  {
    id: "low",
    name: "Low Compression",
    description: "Minimal compression, preserves visual quality",
    quality: "Excellent Quality",
    expectedReduction: "15-35%",
    icon: <Crown className="w-5 h-5" />,
    gradient: "from-green-500 to-emerald-500",
    settings: {
      dpi: 300,
      jpegQuality: 85,
      pdfSettings: "/prepress",
    },
  },
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_TYPES = ["application/pdf"];

// Authentication is now enforced via AuthGuard wrapper

export default function Compress() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CompressionLevel>(
    COMPRESSION_LEVELS[1],
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Download modal
  const downloadModal = useDownloadModal({
    countdownSeconds: 5, // 5 seconds
    adSlot: "compress-download-ad",
    showAd: true,
  });

  // Action-level authentication
  const actionAuth = useActionAuth({
    action: "compress_pdf",
    requireAuth: false, // Not required - compression works for everyone
  });

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload a valid PDF file";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        const validationError = validateFile(file);

        if (validationError) {
          setError(validationError);
          toast.error({
            title: "Upload Error",
            description: validationError
          });
          return;
        }

        setUploadedFile({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
        });
        setResult(null);
        setError(null);
      },
      [validateFile, toast],
    ),
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  });

  // Compression function
  const compressPDF = async () => {
    if (!uploadedFile) {
      return;
    }

    // Execute compression (works for everyone)
    await performCompression();
  };

  const performCompression = async () => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile.file);
      formData.append("level", selectedLevel.id);
      formData.append("quality", selectedLevel.settings.jpegQuality.toString());
      formData.append("dpi", selectedLevel.settings.dpi.toString());
      formData.append("pdfSettings", selectedLevel.settings.pdfSettings);

      setProcessingStage("Uploading file...");
      setProgress(10);

      const startTime = Date.now();

      const response = await fetch(`${getApiBaseUrl()}/pdf/compress-pro`, {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      setProgress(90);
      setProcessingStage("Finalizing compression...");

      if (!response.ok) {
        let errorMessage = "Compression failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Get compression stats from headers
      const originalSize = parseInt(
        response.headers.get("X-Original-Size") || uploadedFile.size.toString(),
      );
      const compressedSize = parseInt(
        response.headers.get("X-Compressed-Size") || "0",
      );
      const compressionRatio = parseFloat(
        response.headers.get("X-Compression-Ratio") || "0",
      );
      const processingTime = Date.now() - startTime;

      // Get the compressed PDF as blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      setProgress(100);
      setProcessingStage("Compression complete!");

      const compressionResult: CompressionResult = {
        id: uploadedFile.id,
        originalSize,
        compressedSize: blob.size,
        compressionRatio:
          Math.round(((originalSize - blob.size) / originalSize) * 100 * 10) /
          10,
        sizeSaved: originalSize - blob.size,
        downloadUrl,
        fileName: `compressed-${selectedLevel.id}-${uploadedFile.name}`,
        quality: selectedLevel.quality,
        processingTime,
      };

      setResult(compressionResult);

      // Success toast
      toast.success({
        title: "🎉 Compression Complete!",
        description: `Reduced file size by ${compressionResult.compressionRatio}% (${formatFileSize(compressionResult.sizeSaved)} saved)`,
      });
    } catch (error: any) {
      if (error.name === "AbortError") {
        setProcessingStage("Compression cancelled");
        toast.warning({
          title: "Compression Cancelled",
          description: "The compression process was cancelled"
        });
      } else {
        const errorMessage = error.message || "Failed to compress PDF";
        setError(errorMessage);

        // Check if it's a Ghostscript error
        if (
          errorMessage.includes("GHOSTSCRIPT") ||
          errorMessage.includes("service unavailable")
        ) {
          toast.error({
            title: "⚙️ Ghostscript Required",
            description: "PDF compression requires Ghostscript to be installed on the server.",
            duration: 8000,
          });
        } else {
          toast.error({
            title: "Compression Failed",
            description: errorMessage,
          });
        }
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  // Cancel compression
  const cancelCompression = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Download file
  const downloadFile = () => {
    if (!result) return;

    // Format file sizes
    const originalSizeMB = (result.originalSize / 1024 / 1024).toFixed(2);
    const compressedSizeMB = (result.compressedSize / 1024 / 1024).toFixed(2);
    const compressionPercent = Math.round((1 - result.compressionRatio) * 100);

    // Open download modal with ad and countdown
    downloadModal.openDownloadModal(
      () => {
        const link = document.createElement("a");
        link.href = result.downloadUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success({
          title: "Download Started",
          description: `Downloading ${result.fileName}`,
        });
      },
      {
        fileName: result.fileName,
        fileSize: `${compressedSizeMB} MB`,
        title: "🎆 Your compressed PDF is ready!",
        description: `Reduced file size by ${compressionPercent}% (${originalSizeMB} MB → ${compressedSizeMB} MB). Download will start automatically.`,
      },
    );
  };

  // Reset state
  const reset = () => {
    setUploadedFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProcessingStage("");
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (result?.downloadUrl) {
        URL.revokeObjectURL(result.downloadUrl);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Back to Home */}
        <BackToHome containerClassName="mb-6" />

        {/* Header */}
        <div className="text-center mb-8">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl mb-4 sm:mb-6 shadow-lg shadow-red-500/25">
            <Minimize2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          
          {/* Title with Badge */}
          <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4 flex-wrap">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-red-900 to-orange-900 bg-clip-text text-transparent">
              Compress PDF Files
            </h1>
            <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs sm:text-sm px-3 py-1 shadow-md">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Fast & Secure
            </Badge>
          </div>
          
          {/* Description */}
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
            Reduce your PDF file size while maintaining quality. Choose from multiple compression levels to find the perfect balance between file size and visual clarity.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 sm:mt-6 px-4">
            <div className="inline-flex items-center px-3 py-1.5 bg-red-50 rounded-full text-sm text-red-700 border border-red-100">
              <CheckCircle className="w-4 h-4 mr-1.5 text-red-500" />
              Up to 85% Reduction
            </div>
            <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700 border border-blue-100">
              <CheckCircle className="w-4 h-4 mr-1.5 text-blue-500" />
              100MB Max File
            </div>
            <div className="inline-flex items-center px-3 py-1.5 bg-green-50 rounded-full text-sm text-green-700 border border-green-100">
              <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" />
              No Registration
            </div>
          </div>
        </div>

        {/* Main Content */}
        {!uploadedFile && !result && (
          <Card className="mb-6 sm:mb-8 border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div
                {...getRootProps()}
                className={`text-center cursor-pointer rounded-lg p-4 sm:p-6 lg:p-8 transition-all ${
                  isDragActive
                    ? "bg-blue-50 border-blue-300 border-2 border-dashed"
                    : "hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <Upload className="w-12 h-12 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {isDragActive
                        ? "Drop your PDF here"
                        : "Upload PDF to compress"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag & drop your PDF file or click to browse
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span>�� Max file size: 100MB</span>
                      <span>• PDF files only</span>
                      <span>• Secure processing</span>
                    </div>
                  </div>
                  <Button className="mt-3 sm:mt-4 w-full sm:w-auto">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose PDF File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Preview & Compression Levels */}
        {uploadedFile && !result && (
          <div className="space-y-6">
            {/* File Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Uploaded File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={reset} size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Compression Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Compression Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {COMPRESSION_LEVELS.map((level) => (
                    <div
                      key={level.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedLevel.id === level.id
                          ? `border-blue-500 bg-gradient-to-r ${level.gradient} bg-opacity-10`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedLevel(level)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-r ${level.gradient} text-white`}
                        >
                          {level.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {level.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {level.quality}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {level.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {level.expectedReduction} reduction
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compress Button */}
            <div className="flex justify-center">
              <div className="text-center">
                {!isProcessing ? (
                  <Button
                    onClick={compressPDF}
                    size="lg"
                    className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    disabled={false}
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    "Compress PDF"
                  </Button>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Button
                      onClick={cancelCompression}
                      variant="outline"
                      size="lg"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}

              </div>
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">{processingStage}</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <p className="text-sm text-gray-600">
                      {progress}% complete - Using enterprise-grade Ghostscript
                      compression
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Compression Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {result.compressionRatio}%
                    </p>
                    <p className="text-sm text-gray-600">Size Reduction</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatFileSize(result.sizeSaved)}
                    </p>
                    <p className="text-sm text-gray-600">Space Saved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatFileSize(result.compressedSize)}
                    </p>
                    <p className="text-sm text-gray-600">Final Size</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {(result.processingTime / 1000).toFixed(1)}s
                    </p>
                    <p className="text-sm text-gray-600">Processing Time</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={downloadFile} className="flex-1" size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Download Compressed PDF
                  </Button>
                  <Button onClick={reset} variant="outline" size="lg">
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Compress Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

      </div>

      {/* Download Modal with Ad */}
      <DownloadModal {...downloadModal.modalProps} />
    </div>
  );
}
