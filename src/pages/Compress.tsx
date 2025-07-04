import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Download,
  FileText,
  Minimize,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Info,
  Upload,
  X,
  Eye,
  Settings,
  Zap,
  Clock,
  HardDrive,
  Target,
  Shield,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useToolTracking } from "@/hooks/useToolTracking";
import AuthModal from "@/components/auth/AuthModal";
import { useFloatingPopup } from "@/contexts/FloatingPopupContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  thumbnails?: string[];
  pageCount?: number;
  loadingThumbnails?: boolean;
}

interface CompressionLevel {
  id: string;
  name: string;
  description: string;
  icon: any;
  expectedReduction: string;
  quality: string;
  color: string;
}

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  sizeSaved: number;
  level: string;
  downloadUrl: string;
  filename: string;
}

const Compress = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>("medium");
  const previousFiles = useRef<ProcessedFile[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [compressionResult, setCompressionResult] =
    useState<CompressionResult | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const compressionInProgress = useRef<boolean>(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Floating popup tracking
  const { trackToolUsage } = useFloatingPopup();

  // Mixpanel tracking
  const tracking = useToolTracking({
    toolName: "compress",
    category: "PDF Tool",
    trackPageView: true,
    trackFunnel: true,
  });

  // Debounced compression function to prevent rapid clicks
  const debouncedCompressFiles = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        compressFiles();
      }, 300); // 300ms debounce
    };
  }, []);

  const compressionLevels: CompressionLevel[] = [
    {
      id: "extreme",
      name: "Extreme",
      description: "Maximum compression with significant quality loss",
      icon: Minimize,
      expectedReduction: "10-20%",
      quality: "Low",
      color: "red",
    },
    {
      id: "high",
      name: "High",
      description: "High compression with moderate quality loss",
      icon: Zap,
      expectedReduction: "8-15%",
      quality: "Medium",
      color: "orange",
    },
    {
      id: "medium",
      name: "Medium",
      description: "Balanced compression and quality (Recommended)",
      icon: Target,
      expectedReduction: "5-10%",
      quality: "Good",
      color: "blue",
    },
    {
      id: "low",
      name: "Low",
      description: "Light compression preserving quality",
      icon: Shield,
      expectedReduction: "3-8%",
      quality: "High",
      color: "green",
    },
    {
      id: "best-quality",
      name: "Best Quality",
      description: "Minimal compression, maximum quality",
      icon: Crown,
      expectedReduction: "1-5%",
      quality: "Excellent",
      color: "purple",
    },
  ];

  // Generate thumbnails using PDF.js
  const generateThumbnails = useCallback(
    async (pdfFile: File): Promise<string[]> => {
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfjsLib = await import("pdfjs-dist");

        // Set up worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const thumbnails: string[] = [];
        const maxPages = Math.min(pdf.numPages, 3); // Show first 3 pages

        for (let i = 1; i <= maxPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              await page.render({
                canvasContext: context,
                viewport: viewport,
              }).promise;

              thumbnails.push(canvas.toDataURL());
            }
          } catch (pageError) {
            console.warn(
              `Failed to generate thumbnail for page ${i}:`,
              pageError,
            );
          }
        }

        return thumbnails;
      } catch (error) {
        console.error("Error generating thumbnails:", error);
        return [];
      }
    },
    [],
  );

  // Get page count from PDF
  const getPageCount = async (pdfFile: File): Promise<number> => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");

      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (error) {
      console.error("Error getting page count:", error);
      return 1;
    }
  };

  // Estimate compression based on level and file characteristics - memoized for stability
  const estimateCompression = useMemo(() => {
    return (file: File, level: string) => {
      // Base compression ratios matching actual backend behavior
      // These are realistic compression ratios based on actual PDF compression results
      const baseReductions = {
        extreme: 0.15, // ~15% reduction (actual backend behavior)
        high: 0.12, // ~12% reduction
        medium: 0.08, // ~8% reduction
        low: 0.05, // ~5% reduction
        "best-quality": 0.02, // ~2% reduction
      };

      const baseReduction =
        baseReductions[level as keyof typeof baseReductions] || 0.08;

      // Adjust based on file size (larger files often compress better)
      let adjustedReduction = baseReduction;
      if (file.size > 10 * 1024 * 1024) {
        // > 10MB
        adjustedReduction += 0.05;
      } else if (file.size > 5 * 1024 * 1024) {
        // > 5MB
        adjustedReduction += 0.02;
      }

      // Cap at realistic maximums for PDF compression
      adjustedReduction = Math.min(adjustedReduction, 0.25);

      const estimatedCompressedSize = file.size * (1 - adjustedReduction);
      return Math.round(estimatedCompressedSize);
    };
  }, []); // Empty dependencies - function should be stable

  // Update estimated size when level changes or files are loaded
  useEffect(() => {
    console.log(
      `📊 Compression level changed to: ${selectedLevel}, Files count: ${files.length}`,
    );

    if (files.length > 0 && !files[0].loadingThumbnails) {
      const estimated = estimateCompression(files[0].file, selectedLevel);
      setEstimatedSize(estimated);
      console.log(
        `💡 Estimated size for ${selectedLevel}: ${estimated ? (estimated / 1024).toFixed(1) + "KB" : "N/A"}`,
      );
    } else if (files.length === 0) {
      setEstimatedSize(null);
      console.log(`⚠️ No files available for estimation`);
    }
  }, [selectedLevel, files, estimateCompression]); // Include estimateCompression but it's now stable

  // Monitor file state changes to detect unwanted resets
  useEffect(() => {
    if (previousFiles.current.length > 0 && files.length === 0) {
      console.warn(
        "🚨 Files were unexpectedly cleared! Previous files:",
        previousFiles.current,
      );

      // Optionally restore files if they were cleared unexpectedly
      // This is a safety mechanism to prevent accidental file loss
      if (!isProcessing && !compressionInProgress.current) {
        console.log("🔄 Attempting to restore files...");
        setFiles(previousFiles.current);
        return;
      }
    }
    previousFiles.current = [...files];
  }, [files, isProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any download URLs to prevent memory leaks
      if (compressionResult?.downloadUrl) {
        URL.revokeObjectURL(compressionResult.downloadUrl);
      }
    };
  }, [compressionResult?.downloadUrl]);

  const handleFileSelect = useCallback(
    async (selectedFiles: File[]) => {
      const validFiles = selectedFiles.filter((file) => {
        if (file.type !== "application/pdf") {
          toast({
            title: "Invalid file type",
            description: "Please select PDF files only.",
            variant: "destructive",
          });
          return false;
        }

        const maxSize = 100 * 1024 * 1024; // 100MB for all users
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `File size exceeds 100MB limit.`,
            variant: "destructive",
          });
          return false;
        }

        return true;
      });

      if (validFiles.length === 0) return;

      // For compression, we only handle one file at a time
      const file = validFiles[0];

      const processedFile: ProcessedFile = {
        id: Date.now().toString(),
        file,
        name: file.name,
        size: file.size,
        loadingThumbnails: true,
      };

      // Clear any existing download URLs to prevent memory leaks
      if (compressionResult?.downloadUrl) {
        URL.revokeObjectURL(compressionResult.downloadUrl);
      }

      // Reset all compression state when new file is selected
      compressionInProgress.current = false;
      setIsProcessing(false);
      setFiles([processedFile]);
      setCompressionResult(null);
      setProgress(0);

      console.log("🔄 File changed, compression state reset");

      // Track file upload
      tracking.trackFileUpload([file]);

      // Generate thumbnails and get page count
      try {
        const [thumbnails, pageCount] = await Promise.all([
          generateThumbnails(file),
          getPageCount(file),
        ]);

        setFiles([
          {
            ...processedFile,
            thumbnails,
            pageCount,
            loadingThumbnails: false,
          },
        ]);
      } catch (error) {
        console.error("Error processing file:", error);
        setFiles([
          {
            ...processedFile,
            loadingThumbnails: false,
          },
        ]);
      }
    },
    [toast, generateThumbnails, getPageCount],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFileSelect(selectedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelect(droppedFiles);
  };

  const removeFile = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId));
    setCompressionResult(null);
    setEstimatedSize(null);
  };

  const compressFiles = async () => {
    // Multiple safety checks to prevent duplicate requests
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select a PDF file to compress.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      tracking.trackAuthRequired();
      setShowAuthModal(true);
      return;
    }

    // Triple check to prevent multiple simultaneous compression requests
    if (isProcessing || compressionInProgress.current) {
      console.log(
        "⚠️ Compression already in progress, ignoring duplicate request",
      );
      return;
    }

    // Set flags to prevent duplicates
    compressionInProgress.current = true;
    setIsProcessing(true);
    setProgress(0);
    setCompressionResult(null); // Clear any previous results

    console.log(`🚀 Starting compression...`);

    try {
      const file = files[0];
      const startTime = Date.now();

      // Compression ID will be validated later if needed

      // Track compression start
      tracking.trackConversionStart("PDF", "PDF Compressed", [file.file]);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      console.log(`Compressing with level: ${selectedLevel}`);

      const result = await PDFService.compressPDF(file.file, {
        level: selectedLevel,
        sessionId: `compress_${Date.now()}`,
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Extract compression info from response headers
      const compressionRatio = parseFloat(
        result.headers?.["x-compression-ratio"] || "0",
      );
      const originalSize = parseInt(
        result.headers?.["x-original-size"] || file.size.toString(),
      );

      // Handle ArrayBuffer result data correctly
      const actualCompressedSize =
        result.data instanceof ArrayBuffer
          ? result.data.byteLength
          : (result.data as any).size || 0;

      const compressedSize = parseInt(
        result.headers?.["x-compressed-size"] ||
          actualCompressedSize.toString(),
      );

      // Calculate size saved if not provided in headers
      const calculatedSizeSaved = originalSize - compressedSize;
      const sizeSaved = parseInt(
        result.headers?.["x-size-saved"] || calculatedSizeSaved.toString(),
      );

      // Recalculate compression ratio if not accurate in headers
      const calculatedCompressionRatio =
        originalSize > 0
          ? ((originalSize - compressedSize) / originalSize) * 100
          : 0;

      const finalCompressionRatio =
        compressionRatio > 0 ? compressionRatio : calculatedCompressionRatio;

      console.log(`📊 Compression results:`, {
        originalSize,
        compressedSize,
        sizeSaved,
        compressionRatio: finalCompressionRatio,
        dataType:
          result.data instanceof ArrayBuffer
            ? "ArrayBuffer"
            : typeof result.data,
      });

      // Create download URL
      const blob = new Blob([result.data], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);

      const compressionResult: CompressionResult = {
        originalSize,
        compressedSize,
        compressionRatio: finalCompressionRatio,
        sizeSaved,
        level: selectedLevel,
        downloadUrl,
        filename: `compressed-${selectedLevel}-${file.name}`,
      };

      setCompressionResult(compressionResult);

      // Track successful compression
      const conversionTime = Date.now() - startTime;
      tracking.trackConversionComplete(
        "PDF",
        "PDF Compressed",
        {
          fileName: file.file.name,
          fileSize: file.file.size,
          fileType: file.file.type,
        },
        compressedSize,
        conversionTime,
      );

      // Track compression settings
      tracking.trackSettingsChange("compression_level", selectedLevel);

      // Track for floating popup (only for anonymous users)
      if (!isAuthenticated) {
        trackToolUsage();
      }

      toast({
        title: "Compression Complete!",
        description: `File size reduced by ${finalCompressionRatio.toFixed(1)}%`,
      });
    } catch (error: any) {
      console.error("Compression failed:", error);

      // Clear any partial progress
      setProgress(0);
      setCompressionResult(null);

      toast({
        title: "Compression Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "An error occurred during compression.",
        variant: "destructive",
      });

      // Track compression failure
      tracking.trackConversionFailed("PDF", "PDF Compressed", error.message);
    } finally {
      // Reset all compression flags
      compressionInProgress.current = false;
      setIsProcessing(false);

      console.log(`✅ Compression cleanup completed`);
    }
  };

  const downloadResult = () => {
    if (!compressionResult) {
      toast({
        title: "No file to download",
        description: "Please compress a PDF first.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`📥 Downloading: ${compressionResult.filename}`);

      const link = document.createElement("a");
      link.href = compressionResult.downloadUrl;
      link.download = compressionResult.filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download started",
        description: `Downloading ${compressionResult.filename}`,
      });

      // Track successful download
      tracking.trackDownload(
        compressionResult.filename,
        compressionResult.compressedSize,
      );
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading your file.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getColorClass = (color: string) => {
    const colors = {
      red: "border-red-500 bg-red-50 text-red-700",
      orange: "border-orange-500 bg-orange-50 text-orange-700",
      blue: "border-blue-500 bg-blue-50 text-blue-700",
      green: "border-green-500 bg-green-50 text-green-700",
      purple: "border-purple-500 bg-purple-50 text-purple-700",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
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
              <Minimize className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Compress PDF</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Reduce PDF file size with our advanced compression engine. Choose
            from 5 compression levels to balance file size and quality.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* File Upload Area - Mobile First */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload PDF File
              </CardTitle>
              <CardDescription>
                Select a PDF file to compress (max 100MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors",
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400",
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragging
                    ? "Drop your PDF here"
                    : "Choose PDF file or drag & drop"}
                </h3>
                <p className="text-gray-500 mb-4">
                  Supports PDF files up to 100MB
                </p>
                <Button variant="outline">Browse Files</Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Debug File State */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <strong>Debug:</strong> Files length: {files.length} | Processing:{" "}
              {isProcessing ? "Yes" : "No"} | Level: {selectedLevel} | Files:{" "}
              {JSON.stringify(
                files.map((f) => ({ id: f.id, name: f.name, size: f.size })),
              )}
            </div>
          )}

          {/* File Preview */}
          {files.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  File Preview ({files.length} file
                  {files.length !== 1 ? "s" : ""})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {files.map((file) => {
                  console.log("🖼️ Rendering file:", file);
                  return (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-red-500" />
                          <div>
                            <h3 className="font-semibold">{file.name}</h3>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)} •{" "}
                              {file.pageCount || 0} pages
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Thumbnails */}
                      {file.loadingThumbnails ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="ml-2">Generating preview...</span>
                        </div>
                      ) : file.thumbnails && file.thumbnails.length > 0 ? (
                        <div className="flex gap-2 mb-4">
                          {file.thumbnails.map((thumbnail, index) => (
                            <img
                              key={index}
                              src={thumbnail}
                              alt={`Page ${index + 1}`}
                              className="w-16 h-20 object-cover border rounded shadow-sm"
                            />
                          ))}
                          {file.pageCount && file.pageCount > 3 && (
                            <div className="w-16 h-20 border rounded shadow-sm flex items-center justify-center bg-gray-50">
                              <span className="text-xs text-gray-500">
                                +{file.pageCount - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* Size Estimation */}
                      {estimatedSize && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            Compression Estimate
                          </h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Original Size</p>
                              <p className="font-semibold">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Estimated Size</p>
                              <p className="font-semibold text-blue-700">
                                {formatFileSize(estimatedSize)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Estimated Savings</p>
                              <p className="font-semibold text-green-700">
                                {formatFileSize(file.size - estimatedSize)} (
                                {(
                                  ((file.size - estimatedSize) / file.size) *
                                  100
                                ).toFixed(1)}
                                %)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Compression Level Selection - Shown after upload */}
          {files.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Compression Level
                </CardTitle>
                <CardDescription>
                  Choose the compression level that best fits your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                  {compressionLevels.map((level) => (
                    <Card
                      key={level.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                        selectedLevel === level.id
                          ? getColorClass(level.color)
                          : "border-gray-200 hover:border-gray-300",
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Prevent duplicate selections
                        if (selectedLevel === level.id) {
                          return;
                        }

                        console.log(
                          `🎛️ Compression level selected: ${level.id}, Files: ${files.length}`,
                        );
                        setSelectedLevel(level.id);
                      }}
                    >
                      <CardContent className="p-3 sm:p-4 text-center">
                        <level.icon
                          className={cn(
                            "w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2",
                            selectedLevel === level.id
                              ? "text-current"
                              : "text-gray-500",
                          )}
                        />
                        <h3 className="font-semibold text-xs sm:text-sm mb-1">
                          {level.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 hidden sm:block">
                          {level.expectedReduction}
                        </p>
                        <Badge
                          variant={
                            selectedLevel === level.id ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {level.quality}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedLevel && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>
                        {
                          compressionLevels.find((l) => l.id === selectedLevel)
                            ?.name
                        }
                        :
                      </strong>{" "}
                      {
                        compressionLevels.find((l) => l.id === selectedLevel)
                          ?.description
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compression Results */}
          {compressionResult && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Compression Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Original Size</p>
                      <p className="text-lg font-bold">
                        {formatFileSize(compressionResult.originalSize)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Compressed Size</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatFileSize(compressionResult.compressedSize)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Size Saved</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatFileSize(compressionResult.sizeSaved)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Reduction</p>
                      <p className="text-lg font-bold text-green-600">
                        {compressionResult.compressionRatio.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={downloadResult}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Compressed PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (
                      !isProcessing &&
                      !compressionInProgress.current &&
                      files.length > 0 &&
                      user
                    ) {
                      compressFiles();
                    }
                  }}
                  disabled={
                    files.length === 0 ||
                    isProcessing ||
                    compressionInProgress.current ||
                    !user
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isProcessing || compressionInProgress.current ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Compressing... ({Math.round(progress)}%)
                    </>
                  ) : (
                    <>
                      <Minimize className="w-5 h-5 mr-2" />
                      Compress PDF
                    </>
                  )}
                </Button>

                {files.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiles([]);
                      setCompressionResult(null);
                      setEstimatedSize(null);
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Compressing PDF...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Compression Levels Explained
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">
                    When to use each level:
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Extreme:</strong> Email attachments, web upload
                    </li>
                    <li>
                      <strong>High:</strong> Online sharing, archiving
                    </li>
                    <li>
                      <strong>Medium:</strong> General use, balanced quality
                    </li>
                    <li>
                      <strong>Low:</strong> Document review, good quality
                    </li>
                    <li>
                      <strong>Best Quality:</strong> Professional printing
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Compression Features:</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Image optimization and downsampling</li>
                    <li>• Metadata removal for privacy</li>
                    <li>• Font subsetting and optimization</li>
                    <li>• Object stream compression</li>
                    <li>• Lossless structural optimization</li>
                  </ul>
                </div>
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

export default Compress;
