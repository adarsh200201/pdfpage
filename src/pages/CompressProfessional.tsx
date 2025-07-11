import React, { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import {
  ArrowLeft,
  Download,
  FileText,
  Minimize2,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Info,
  Upload,
  RefreshCw,
  TrendingDown,
  HardDrive,
  Zap,
  Target,
  Shield,
  BarChart3,
  Clock,
  Gauge,
  Settings,
  Sparkles,
  Award,
  FileCheck,
  Layers,
  Maximize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  sizeSaved: number;
  processingTime: number;
  level: string;
  pageCount: number;
  efficiency: string;
  recommendation: string;
  originalSizeFormatted: string;
  compressedSizeFormatted: string;
  sizeSavedFormatted: string;
  downloadData: string;
  filename: string;
}

interface CompressionLevel {
  id: string;
  name: string;
  description: string;
  dpi: number;
  expectedReduction: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const CompressProfessional = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [compressionResult, setCompressionResult] =
    useState<CompressionResult | null>(null);
  const [selectedLevel, setSelectedLevel] = useState("medium");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<{
    size: number;
    reduction: number;
    saving: number;
  } | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Compression levels matching backend service
  const compressionLevels: CompressionLevel[] = [
    {
      id: "high",
      name: "High Quality",
      description: "Minimal compression, preserves quality",
      dpi: 72,
      expectedReduction: "10-30%",
      icon: <Shield className="w-5 h-5" />,
      color: "text-green-600",
      gradient: "from-green-50 to-emerald-50 border-green-200",
    },
    {
      id: "medium",
      name: "Balanced",
      description: "Optimal balance of size and quality",
      dpi: 96,
      expectedReduction: "30-50%",
      icon: <Target className="w-5 h-5" />,
      color: "text-blue-600",
      gradient: "from-blue-50 to-cyan-50 border-blue-200",
    },
    {
      id: "low",
      name: "Maximum Compression",
      description: "Smallest file size, good quality",
      dpi: 150,
      expectedReduction: "50-70%",
      icon: <Minimize2 className="w-5 h-5" />,
      color: "text-orange-600",
      gradient: "from-orange-50 to-red-50 border-orange-200",
    },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const estimateCompression = (fileSize: number, level: string) => {
    const compressionData = {
      high: { min: 10, max: 30 },
      medium: { min: 30, max: 50 },
      low: { min: 50, max: 70 },
    };

    const data = compressionData[level as keyof typeof compressionData];
    const avgReduction = (data.min + data.max) / 2 / 100;
    const estimatedSize = fileSize * (1 - avgReduction);
    const saving = fileSize - estimatedSize;

    return {
      size: Math.round(estimatedSize),
      reduction: Math.round(avgReduction * 100),
      saving: Math.round(saving),
    };
  };

  const handleFilesSelect = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        const selectedFile = files[0];
        setFile({
          id: Math.random().toString(36).substr(2, 9),
          file: selectedFile,
          name: selectedFile.name,
          size: selectedFile.size,
        });
        setCompressionResult(null);
        setProgress(0);

        // Estimate compression
        const estimate = estimateCompression(selectedFile.size, selectedLevel);
        setEstimatedSize(estimate);
      }
    },
    [selectedLevel],
  );

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    if (file) {
      const estimate = estimateCompression(file.size, level);
      setEstimatedSize(estimate);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus("Initializing compression...");

    try {
      const formData = new FormData();
      formData.append("file", file.file);
      formData.append("level", selectedLevel);

      setProgress(10);
      setProcessingStatus("Uploading and analyzing document...");

      const apiUrl = "https://pdfpage-app.onrender.com/api";
      const response = await fetch(`${apiUrl}/pdf/compress`, {
        method: "POST",
        body: formData,
      });

      setProgress(90);
      setProcessingStatus("Finalizing compression...");

      if (!response.ok) {
        let errorMessage = "Compression failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Get compression stats from headers
      const originalSize = parseInt(
        response.headers.get("X-Original-Size") || file.size.toString(),
      );
      const compressedSize = parseInt(
        response.headers.get("X-Compressed-Size") || "0",
      );
      const compressionRatio = parseFloat(
        response.headers.get("X-Compression-Ratio") || "0",
      );
      const sizeSaved = parseInt(response.headers.get("X-Size-Saved") || "0");
      const compressionLevel =
        response.headers.get("X-Compression-Level") || selectedLevel;

      // Get the compressed PDF as blob
      const blob = await response.blob();
      const actualCompressedSize = blob.size;
      const actualCompressionRatio =
        ((originalSize - actualCompressedSize) / originalSize) * 100;

      setProgress(100);
      setProcessingStatus("Compression completed!");

      // Convert blob to base64 for download
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Remove data:application/pdf;base64, prefix
        };
      });
      reader.readAsDataURL(blob);
      const downloadData = await base64Promise;

      // Format file sizes
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      // Set compression result
      setCompressionResult({
        originalSize: originalSize,
        compressedSize: actualCompressedSize,
        compressionRatio: Math.round(actualCompressionRatio * 10) / 10,
        sizeSaved: originalSize - actualCompressedSize,
        processingTime: Date.now() - Date.now(), // We don't have this from the endpoint
        level: compressionLevel,
        pageCount: 0, // We don't have this from the endpoint
        efficiency:
          actualCompressionRatio >= 50
            ? "Excellent"
            : actualCompressionRatio >= 20
              ? "Good"
              : "Moderate",
        recommendation:
          actualCompressionRatio >= 50
            ? "Perfect for sharing"
            : "Good for most uses",
        originalSizeFormatted: formatFileSize(originalSize),
        compressedSizeFormatted: formatFileSize(actualCompressedSize),
        sizeSavedFormatted: formatFileSize(originalSize - actualCompressedSize),
        downloadData: downloadData,
        filename: `compressed-${selectedLevel}-${file.name}`,
      });

      // Show different messages based on compression effectiveness
      const finalCompressionRatio =
        Math.round(actualCompressionRatio * 10) / 10;
      const finalSizeSavedFormatted = formatFileSize(
        originalSize - actualCompressedSize,
      );

      if (finalCompressionRatio >= 50) {
        toast({
          title: "🎉 Excellent Compression!",
          description: `Achieved ${finalCompressionRatio}% reduction using Ghostscript compression - saved ${finalSizeSavedFormatted}`,
        });
      } else if (finalCompressionRatio >= 20) {
        toast({
          title: "✅ Good Compression!",
          description: `Reduced file size by ${finalCompressionRatio}% - saved ${finalSizeSavedFormatted}`,
        });
      } else if (finalCompressionRatio >= 5) {
        toast({
          title: "📄 Compression Complete",
          description: `Reduced file size by ${finalCompressionRatio}% - saved ${finalSizeSavedFormatted}. Note: Some PDFs have limited compression potential.`,
        });
      } else {
        toast({
          title: "⚠️ Limited Compression",
          description: `Reduced file size by ${finalCompressionRatio}% - saved ${finalSizeSavedFormatted}. This PDF may already be optimized or contain mostly text.`,
        });
      }
    } catch (error: any) {
      console.error("Compression error:", error);
      toast({
        title: "Compression Failed",
        description:
          error.message || "Failed to compress PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!compressionResult) return;

    try {
      const bytes = atob(compressionResult.downloadData);
      const byteArray = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        byteArray[i] = bytes.charCodeAt(i);
      }

      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = compressionResult.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: `Downloaded ${compressionResult.filename}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the compressed file",
        variant: "destructive",
      });
    }
  };

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case "Excellent":
        return "text-green-600 bg-green-50 border-green-200";
      case "Very Good":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "Good":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-medium hover:text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Minimize2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-text-dark">
              PDF Compressor Pro
            </h1>
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <Award className="w-4 h-4 mr-1" />
              Industry Leading
            </Badge>
          </div>
          <p className="text-text-light text-lg max-w-3xl mx-auto">
            Reduce PDF file sizes by up to 70% while maintaining visual quality.
            Professional compression technology used by millions worldwide.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-semibold">Up to 70% Smaller</div>
            <div className="text-sm text-text-light">
              Massive size reduction
            </div>
          </Card>
          <Card className="text-center p-4">
            <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-semibold">Quality Preserved</div>
            <div className="text-sm text-text-light">Maintains readability</div>
          </Card>
          <Card className="text-center p-4">
            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="font-semibold">Lightning Fast</div>
            <div className="text-sm text-text-light">Seconds processing</div>
          </Card>
          <Card className="text-center p-4">
            <HardDrive className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="font-semibold">Secure Processing</div>
            <div className="text-sm text-text-light">Files auto-deleted</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload & Settings */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Compression Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                {!file ? (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Upload PDF File
                    </Label>
                    <FileUpload
                      accept=".pdf"
                      multiple={false}
                      onFilesSelect={handleFilesSelect}
                      className="h-32"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <FileText className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-light">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Compression Level */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Compression Level
                  </Label>
                  <div className="space-y-3">
                    {compressionLevels.map((level) => (
                      <div
                        key={level.id}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-all",
                          selectedLevel === level.id
                            ? `bg-gradient-to-r ${level.gradient} border-l-4`
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                        )}
                        onClick={() => handleLevelChange(level.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-full bg-white",
                              level.color,
                            )}
                          >
                            {level.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{level.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {level.expectedReduction}
                              </Badge>
                            </div>
                            <p className="text-sm text-text-light mb-2">
                              {level.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-text-light">
                              <span>DPI: {level.dpi}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estimated Results */}
                {estimatedSize && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          Estimated Results
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">New size:</span>
                          <span className="font-medium text-blue-900">
                            {formatFileSize(estimatedSize.size)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">You'll save:</span>
                          <span className="font-medium text-blue-900">
                            {formatFileSize(estimatedSize.saving)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Reduction:</span>
                          <span className="font-medium text-blue-900">
                            ~{estimatedSize.reduction}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Compress Button */}
                {file && (
                  <Button
                    onClick={handleCompress}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Minimize2 className="w-4 h-4 mr-2" />
                        Compress PDF
                      </>
                    )}
                  </Button>
                )}

                {/* Progress */}
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-text-light text-center">
                      {processingStatus}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {compressionResult ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <BarChart3 className="w-5 h-5" />
                  )}
                  {compressionResult
                    ? "Compression Results"
                    : "Results Preview"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {compressionResult ? (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="text-center p-4">
                        <TrendingDown className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {compressionResult.compressionRatio}%
                        </div>
                        <div className="text-sm text-text-light">
                          Size Reduction
                        </div>
                      </Card>
                      <Card className="text-center p-4">
                        <HardDrive className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                          {compressionResult.sizeSavedFormatted}
                        </div>
                        <div className="text-sm text-text-light">
                          Space Saved
                        </div>
                      </Card>
                      <Card className="text-center p-4">
                        <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(compressionResult.processingTime / 1000)}s
                        </div>
                        <div className="text-sm text-text-light">
                          Processing Time
                        </div>
                      </Card>
                    </div>

                    {/* Efficiency Badge */}
                    <div className="flex justify-center">
                      <Badge
                        className={cn(
                          "px-4 py-2 text-sm font-medium",
                          getEfficiencyColor(compressionResult.efficiency),
                        )}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {compressionResult.efficiency} Compression
                      </Badge>
                    </div>

                    {/* Detailed Stats */}
                    <Card className="bg-gray-50">
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-4">
                          Compression Details
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-text-light">
                              Original size:
                            </span>
                            <span className="font-medium">
                              {compressionResult.originalSizeFormatted}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-light">
                              Compressed size:
                            </span>
                            <span className="font-medium">
                              {compressionResult.compressedSizeFormatted}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-light">
                              Compression level:
                            </span>
                            <span className="font-medium">
                              {compressionResult.level}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-light">
                              Pages processed:
                            </span>
                            <span className="font-medium">
                              {compressionResult.pageCount}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendation */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-blue-900 font-medium mb-1">
                              Expert Recommendation
                            </p>
                            <p className="text-blue-700 text-sm">
                              {compressionResult.recommendation}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Download Button */}
                    <Button
                      onClick={handleDownload}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Compressed PDF
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-text-light">
                    <div className="text-center">
                      <Gauge className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">
                        Ready to Compress
                      </h3>
                      <p>
                        Upload a PDF file and select compression level to see
                        results
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <PromoBanner />
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default CompressProfessional;
