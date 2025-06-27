import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/auth/AuthModal";

interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  thumbnails?: string[];
  pageCount?: number;
  loadingThumbnails?: boolean;
}

interface CompressionSettings {
  level: "extreme" | "recommended" | "less";
  dpi: number;
  imageQuality: number;
  removeMetadata: boolean;
  optimizeImages: boolean;
  optimizeFonts: boolean;
  colorspace: "auto" | "rgb" | "grayscale" | "monochrome";
}

const Compress = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [quality, setQuality] = useState([0.5]); // Start with more aggressive compression
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [compressionPreview, setCompressionPreview] = useState<{
    estimatedSize: number;
    estimatedSavings: number;
    compressionRatio: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [compressionSettings, setCompressionSettings] =
    useState<CompressionSettings>({
      level: "recommended",
      dpi: 150,
      imageQuality: 80,
      removeMetadata: true,
      optimizeImages: true,
      optimizeFonts: true,
      colorspace: "auto",
    });
  const [batchMode, setBatchMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For backward compatibility, keep file as the first file in files array
  const file = files.length > 0 ? files[0] : null;

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate PDF thumbnails
  const generateThumbnails = useCallback(
    async (pdfFile: File): Promise<string[]> => {
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();

        // Import pdf.js for thumbnail generation
        const pdfjsLib = await import("pdfjs-dist");

        // Set worker path
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const thumbnails: string[] = [];

        // Generate thumbnails for first 5 pages
        const maxPages = Math.min(pdf.numPages, 5);

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

  // Advanced compression preview based on professional PDF optimization
  const updateCompressionPreview = useCallback(
    (selectedFile: File, qualityValue: number, pageCount: number = 1) => {
      // Professional compression ratios based on optimization techniques
      let baseCompressionRatio = 0.08; // Start with 8% base compression

      // FIXED: Realistic compression expectations based on PDF-lib capabilities
      if (qualityValue <= 0.2) {
        baseCompressionRatio = 0.35; // Maximum compression: 30-40% reduction (realistic)
      } else if (qualityValue <= 0.3) {
        baseCompressionRatio = 0.28; // Ultra compression: 25-35% reduction
      } else if (qualityValue <= 0.4) {
        baseCompressionRatio = 0.22; // High compression: 20-30% reduction
      } else if (qualityValue <= 0.5) {
        baseCompressionRatio = 0.18; // Medium-high compression: 15-25% reduction
      } else if (qualityValue <= 0.6) {
        baseCompressionRatio = 0.15; // Balanced compression: 12-20% reduction
      } else if (qualityValue <= 0.7) {
        baseCompressionRatio = 0.12; // Good compression: 10-15% reduction
      } else if (qualityValue <= 0.8) {
        baseCompressionRatio = 0.08; // Good Quality: 5-12% reduction
      } else {
        baseCompressionRatio = 0.03; // Best Quality: 2-5% reduction
      }

      // FIXED: Realistic bonuses for file characteristics
      if (selectedFile.size > 20 * 1024 * 1024) {
        baseCompressionRatio += 0.02; // Very large files compress slightly better
      } else if (selectedFile.size > 10 * 1024 * 1024) {
        baseCompressionRatio += 0.015; // Large files compress better
      } else if (selectedFile.size > 5 * 1024 * 1024) {
        baseCompressionRatio += 0.01; // Medium files
      } else if (selectedFile.size > 2 * 1024 * 1024) {
        baseCompressionRatio += 0.005; // Small files
      }

      // Page count bonuses for optimization opportunities
      if (pageCount > 100) {
        baseCompressionRatio += 0.015; // Many pages = more optimization
      } else if (pageCount > 50) {
        baseCompressionRatio += 0.01;
      } else if (pageCount > 20) {
        baseCompressionRatio += 0.008;
      } else if (pageCount > 10) {
        baseCompressionRatio += 0.005;
      }

      // Image-heavy PDF detection (compression potential)
      if (
        selectedFile.size > 1024 * 1024 &&
        selectedFile.size / pageCount > 500 * 1024
      ) {
        baseCompressionRatio += 0.03; // Image-heavy PDFs have good compression potential
      }

      // FIXED: Cap at realistic maximum 45% compression
      baseCompressionRatio = Math.min(baseCompressionRatio, 0.45);

      const estimatedSavings = selectedFile.size * baseCompressionRatio;
      const estimatedSize = selectedFile.size - estimatedSavings;
      const compressionRatio = baseCompressionRatio * 100;

      setCompressionPreview({
        estimatedSize,
        estimatedSavings,
        compressionRatio,
      });

      // Processing time calculation for realistic compression
      const baseMBTime = 1.5; // Base time per MB for compression
      const qualityMultiplier =
        qualityValue < 0.3
          ? 2.5 // Maximum compression takes longer
          : qualityValue < 0.5
            ? 2.0 // High compression
            : qualityValue < 0.7
              ? 1.5 // Medium compression
              : 1.2; // Conservative compression
      const pageMultiplier = 1 + pageCount / 50; // Page processing factor
      const timeInSeconds = Math.max(
        2, // Minimum 2 seconds for compression
        (selectedFile.size / (1024 * 1024)) *
          baseMBTime *
          qualityMultiplier *
          pageMultiplier,
      );
      setEstimatedTime(`${timeInSeconds.toFixed(0)} seconds`);
    },
    [], // No dependencies needed
  );

  // Update preview when quality changes
  const handleQualityChange = useCallback(
    (newQuality: number[]) => {
      setQuality(newQuality);
      if (file && file.pageCount) {
        updateCompressionPreview(file.file, newQuality[0], file.pageCount);
      }
    },
    [file, updateCompressionPreview],
  );

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile || selectedFile.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Please select a valid PDF file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 100MB per file)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a PDF file smaller than 100MB",
        variant: "destructive",
      });
      return;
    }

    // Check total files limit (max 20 files for batch)
    if (files.length >= 20) {
      toast({
        title: "Too many files",
        description: "Maximum 20 files allowed for batch compression",
        variant: "destructive",
      });
      return;
    }
    // Get page count and update compression preview
    const pageCount = await getPageCount(selectedFile);

    // Generate thumbnails in background
    try {
      const processedFile: ProcessedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
        loadingThumbnails: true,
      };

      // Add to files array (batch mode support)
      if (batchMode) {
        setFiles((prev) => [...prev, processedFile]);
      } else {
        setFiles([processedFile]);
      }

      // Generate page count and thumbnails
      const pageCount = await getPageCount(selectedFile);
      processedFile.pageCount = pageCount;

      // Update compression preview for current file
      updateCompressionPreview(selectedFile, quality[0], pageCount);

      // Generate thumbnails
      const thumbnails = await generateThumbnails(selectedFile);
      processedFile.thumbnails = thumbnails;
      processedFile.loadingThumbnails = false;

      // Update the file in the array
      setFiles((prev) =>
        prev.map((f) => (f.id === processedFile.id ? processedFile : f)),
      );
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description: "Failed to process the PDF file",
        variant: "destructive",
      });
    }
  };

  const handleCompress = () => {
    if (!file) return;

    // Enhanced processing state with realistic expectations
    const processingState = {
      fileName: file.name,
      fileSize: file.size,
      quality: quality[0],
      pageCount: file.pageCount || 1,
      extremeMode: quality[0] <= 0.3, // Enable extreme mode for very low quality
      file: file.file,
      estimatedCompression: compressionPreview?.compressionRatio || 15, // Lower default expectation
    };

    navigate("/compress-processing", { state: processingState });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getQualityLabel = (quality: number): string => {
    if (quality <= 0.2) return "Maximum Compression";
    if (quality <= 0.4) return "High Compression";
    if (quality <= 0.6) return "Balanced";
    if (quality <= 0.8) return "Good Quality";
    return "Best Quality";
  };

  const getQualityDescription = (quality: number): string => {
    if (quality <= 0.2)
      return "Smallest file size with noticeable quality reduction";
    if (quality <= 0.4) return "Good compression with moderate quality loss";
    if (quality <= 0.6) return "Balanced compression and quality";
    if (quality <= 0.8) return "Minor compression with good quality";
    return "Minimal compression, best quality";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <PromoBanner />

      <div className="container mx-auto px-4 pt-16 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <Minimize className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-dark">
                  Compress PDF
                </h1>
                <p className="text-text-light">
                  Reduce PDF file size while maintaining quality
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Upload and Controls */}
            <div className="lg:col-span-2 space-y-6">
              {!file ? (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                    isDragOver
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 hover:border-red-400 hover:bg-gray-50",
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-12 h-12 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-dark mb-2">
                    Drop your PDF here
                  </h3>
                  <p className="text-text-light mb-4">
                    Or click to browse and select your PDF file
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Choose PDF File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) handleFileSelect(selectedFile);
                    }}
                  />
                  <div className="mt-4 text-xs text-text-light">
                    Supports PDF files up to 100MB
                  </div>
                </div>
              ) : (
                <div className="border rounded-xl p-6 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-dark">
                      PDF File Loaded
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFiles([]);
                        setCompressionPreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-red-100 p-3 rounded-lg">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-text-dark">
                        {file.name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-text-light">
                        <span>{formatFileSize(file.size)}</span>
                        {file.pageCount && (
                          <span>• {file.pageCount} pages</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PDF Thumbnails */}
                  {file.loadingThumbnails ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                      <span className="ml-2 text-text-light">
                        Generating preview...
                      </span>
                    </div>
                  ) : file.thumbnails && file.thumbnails.length > 0 ? (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-text-dark flex items-center">
                        <Eye className="w-4 h-4 mr-2" />
                        PDF Preview
                      </h5>
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {file.thumbnails.map((thumbnail, index) => (
                          <div
                            key={index}
                            className="flex-shrink-0 border rounded-lg overflow-hidden bg-white shadow-sm"
                          >
                            <img
                              src={thumbnail}
                              alt={`Page ${index + 1}`}
                              className="w-20 h-28 object-cover"
                            />
                            <div className="p-1 text-xs text-center text-text-light">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                        {file.pageCount && file.pageCount > 5 && (
                          <div className="flex-shrink-0 w-20 h-28 border rounded-lg flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                              <div className="text-xs text-text-light">
                                +{file.pageCount - 5}
                              </div>
                              <div className="text-xs text-text-light">
                                more
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Quality Controls */}
              {file && (
                <div className="border rounded-xl p-6 bg-white shadow-sm">
                  <div className="flex items-center mb-4">
                    <Settings className="w-5 h-5 mr-2 text-red-600" />
                    <h3 className="text-lg font-semibold text-text-dark">
                      Compression Settings
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-text-dark">
                          Compression Level
                        </label>
                        <span className="text-sm font-medium text-red-600">
                          {getQualityLabel(quality[0])}
                        </span>
                      </div>

                      <Slider
                        value={quality}
                        onValueChange={handleQualityChange}
                        max={1}
                        min={0.1}
                        step={0.1}
                        className="mb-2"
                      />

                      {/* Compression level indicator */}
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full mx-auto mb-1",
                              quality[0] <= 0.3 ? "bg-red-500" : "bg-gray-300",
                            )}
                          />
                          <span
                            className={
                              quality[0] <= 0.3
                                ? "text-red-600 font-medium"
                                : "text-text-light"
                            }
                          >
                            Max
                          </span>
                        </div>
                        <div className="text-center">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full mx-auto mb-1",
                              quality[0] > 0.3 && quality[0] <= 0.5
                                ? "bg-orange-500"
                                : "bg-gray-300",
                            )}
                          />
                          <span
                            className={
                              quality[0] > 0.3 && quality[0] <= 0.5
                                ? "text-orange-600 font-medium"
                                : "text-text-light"
                            }
                          >
                            High
                          </span>
                        </div>
                        <div className="text-center">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full mx-auto mb-1",
                              quality[0] > 0.5 && quality[0] <= 0.7
                                ? "bg-blue-500"
                                : "bg-gray-300",
                            )}
                          />
                          <span
                            className={
                              quality[0] > 0.5 && quality[0] <= 0.7
                                ? "text-blue-600 font-medium"
                                : "text-text-light"
                            }
                          >
                            Balanced
                          </span>
                        </div>
                        <div className="text-center">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full mx-auto mb-1",
                              quality[0] > 0.7 ? "bg-green-500" : "bg-gray-300",
                            )}
                          />
                          <span
                            className={
                              quality[0] > 0.7
                                ? "text-green-600 font-medium"
                                : "text-text-light"
                            }
                          >
                            Quality
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-text-light mt-2">
                        {getQualityDescription(quality[0])}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Preview and Info */}
            <div className="space-y-6">
              {/* Live Preview Card */}
              {file && compressionPreview && (
                <div className="rounded-lg p-4 border bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                  <h5 className="font-medium text-text-dark mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-purple-500" />
                    Compression Preview
                  </h5>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-light">
                        Current size:
                      </span>
                      <span className="font-medium">
                        {formatFileSize(file.size)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-light">
                        Estimated size:
                      </span>
                      <span className="font-medium text-green-700">
                        {formatFileSize(compressionPreview.estimatedSize)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-light">
                        Space saved:
                      </span>
                      <span className="font-medium text-green-700">
                        {formatFileSize(compressionPreview.estimatedSavings)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-light">
                          Reduction:
                        </span>
                        <span
                          className={cn(
                            "font-bold text-lg",
                            compressionPreview.compressionRatio >= 65
                              ? "text-purple-600" // Maximum compression (/screen)
                              : compressionPreview.compressionRatio >= 45
                                ? "text-blue-600" // High compression (/ebook)
                                : compressionPreview.compressionRatio >= 25
                                  ? "text-green-600" // Balanced compression (/printer)
                                  : "text-orange-600", // Good quality (/prepress)
                          )}
                        >
                          {compressionPreview.compressionRatio.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-text-light mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-start space-x-2">
                        <Info className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
                        <span>
                          Estimates based on professional PDF optimization
                          techniques. Large files (10MB+) typically achieve
                          70-80% reduction. Results vary by content complexity.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-text-light">
                      <Clock className="w-3 h-3" />
                      <span>Est. time: {estimatedTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Info with Realistic Compression Expectations */}
              {file && (
                <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                  <h5 className="font-medium text-text-dark mb-3 flex items-center">
                    <HardDrive className="w-4 h-4 mr-2 text-purple-500" />
                    Compression Guide
                  </h5>
                  <div className="text-xs space-y-1 text-purple-700">
                    {/* Professional compression expectations */}
                    {quality[0] >= 0.8 && (
                      <div>
                        <p>
                          • Best Quality: 5-10% reduction with minimal quality
                          loss
                        </p>
                      </div>
                    )}

                    {quality[0] >= 0.6 && quality[0] < 0.8 && (
                      <div>
                        <p>
                          • Good Quality (/prepress): 15-25% reduction with
                          slight quality loss
                        </p>
                      </div>
                    )}

                    {quality[0] >= 0.4 && quality[0] < 0.6 && (
                      <div>
                        <p>
                          • Balanced (/printer): 30-45% reduction with moderate
                          quality loss
                        </p>
                      </div>
                    )}

                    {quality[0] >= 0.2 && quality[0] < 0.4 && (
                      <div>
                        <p>
                          • High Compression (/ebook): 50-65% reduction with
                          noticeable quality loss
                        </p>
                      </div>
                    )}

                    {quality[0] < 0.2 && (
                      <div>
                        <p>
                          • Maximum Compression (/screen): 70-80% reduction with
                          significant quality trade-offs
                        </p>
                      </div>
                    )}

                    {compressionPreview &&
                      compressionPreview.compressionRatio >= 50 && (
                        <div className="mt-2 p-2 bg-purple-100 border border-purple-300 rounded">
                          <p className="text-purple-800 font-medium">
                            🚀 Ultra compression potential detected
                          </p>
                          <p className="text-purple-700 text-xs mt-1">
                            Your PDF has excellent compression opportunities
                          </p>
                        </div>
                      )}
                    <div className="mt-2 text-xs text-purple-600">
                      <p>
                        💡 Tip: Larger files with images typically compress
                        better
                      </p>
                    </div>

                    {file.size < 1024 * 1024 && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-blue-700">
                          Small files may have limited compression potential but
                          will still be optimized.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pro Features */}
              <div className="border rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <h5 className="font-medium text-text-dark mb-3 flex items-center">
                  <Crown className="w-4 h-4 mr-2 text-amber-500" />
                  Pro Features Available
                </h5>
                <div className="space-y-2 text-sm text-amber-700">
                  <p>• Batch compression of multiple PDFs</p>
                  <p>• Custom compression profiles</p>
                  <p>• Priority processing queue</p>
                  <p>• Advanced optimization algorithms</p>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-3 bg-amber-600 hover:bg-amber-700"
                  onClick={() => setShowAuthModal(true)}
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </div>

          {/* Process Button */}
          {file && (
            <div className="mt-8 text-center">
              <Button
                onClick={handleCompress}
                size="lg"
                className="bg-red-600 hover:bg-red-700 px-8"
                disabled={!file}
              >
                <Minimize className="w-5 h-5 mr-2" />
                Compress PDF
              </Button>

              {compressionPreview && (
                <p className="text-sm text-text-light mt-2">
                  Expected reduction: ~
                  {compressionPreview.compressionRatio.toFixed(1)}% • Processing
                  time: ~{estimatedTime}
                </p>
              )}
            </div>
          )}

          {/* Features Grid */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border rounded-lg bg-white shadow-sm">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-text-dark mb-2">
                Real-time Preview
              </h3>
              <p className="text-body-small text-text-light">
                See PDF pages and compression results in real-time before
                processing
              </p>
            </div>

            <div className="text-center p-6 border rounded-lg bg-white shadow-sm">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-text-dark mb-2">
                Smart Processing
              </h3>
              <p className="text-body-small text-text-light">
                Watch compression progress with detailed step-by-step processing
              </p>
            </div>

            <div className="text-center p-6 border rounded-lg bg-white shadow-sm">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-text-dark mb-2">
                Quality Control
              </h3>
              <p className="text-body-small text-text-light">
                Maintain document quality while achieving optimal compression
              </p>
            </div>
          </div>

          {/* Tips and Recommendations */}
          <div className="mt-8 border rounded-lg p-6 bg-gray-50">
            <h3 className="font-semibold text-text-dark mb-4">
              Compression Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-light">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-dark">
                    Use Max Compression for large files
                  </p>
                  <p className="text-text-light">
                    Files over 10MB benefit most from aggressive compression
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-dark">
                    Preview shows realistic compression potential
                  </p>
                  <p className="text-text-light">
                    Estimates are based on actual PDF processing capabilities
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-dark">
                    Image-heavy PDFs compress better
                  </p>
                  <p className="text-text-light">
                    Documents with many images have higher compression potential
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-dark">
                    Quality vs. Size balance
                  </p>
                  <p className="text-text-light">
                    Choose the right balance between file size and visual
                    quality
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode="signup"
        />
      )}
    </div>
  );
};

export default Compress;
