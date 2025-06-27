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

const Compress = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [quality, setQuality] = useState([0.7]);
  const [extremeMode, setExtremeMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [compressionPreview, setCompressionPreview] = useState<{
    estimatedSize: number;
    estimatedSavings: number;
    compressionRatio: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle file selection with instant feedback
  const handleFilesSelect = useCallback(
    async (files: File[]) => {
      if (files.length > 0) {
        const selectedFile = files[0];

        // Validate PDF file
        if (
          !selectedFile.type.includes("pdf") &&
          !selectedFile.name.toLowerCase().endsWith(".pdf")
        ) {
          toast({
            title: "Invalid File",
            description: "Please select a PDF file.",
            variant: "destructive",
          });
          return;
        }

        // Check file size
        const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
          toast({
            title: "File Too Large",
            description: `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
            variant: "destructive",
          });
          return;
        }

        const processedFile: ProcessedFile = {
          id: Math.random().toString(36).substr(2, 9),
          file: selectedFile,
          name: selectedFile.name,
          size: selectedFile.size,
          loadingThumbnails: true,
        };

        setFile(processedFile);

        // Show instant feedback
        toast({
          title: "📄 PDF Loaded",
          description: `Generating preview for ${selectedFile.name}...`,
        });

        // Generate thumbnails and page count
        try {
          const thumbnails = await generateThumbnails(selectedFile);
          const pageCount = await getPageCount(selectedFile);

          setFile((prev) =>
            prev
              ? {
                  ...prev,
                  thumbnails,
                  pageCount,
                  loadingThumbnails: false,
                }
              : null,
          );

          // Update compression preview
          updateCompressionPreview(selectedFile, quality[0], pageCount);

          toast({
            title: "✅ Preview Ready",
            description: `${pageCount} pages • ${formatFileSize(selectedFile.size)}`,
          });
        } catch (error) {
          console.error("Error processing file:", error);
          setFile((prev) =>
            prev ? { ...prev, loadingThumbnails: false } : null,
          );
        }
      }
    },
    [quality, user?.isPremium, toast, generateThumbnails],
  );

  // Get page count from PDF
  const getPageCount = async (pdfFile: File): Promise<number> => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (error) {
      console.error("Error getting page count:", error);
      return 1;
    }
  };

  // Realistic compression preview that includes extreme mode
  const updateCompressionPreview = useCallback(
    (selectedFile: File, qualityValue: number, pageCount: number = 1) => {
      let baseCompressionRatio = 0.05; // Base 5% compression

      if (extremeMode) {
        // Extreme compression mode - much higher compression possible
        if (qualityValue <= 0.3) {
          baseCompressionRatio = 0.75; // Extreme: up to 75% (severe quality loss)
        } else if (qualityValue <= 0.5) {
          baseCompressionRatio = 0.6; // High extreme: up to 60%
        } else if (qualityValue <= 0.7) {
          baseCompressionRatio = 0.45; // Medium extreme: up to 45%
        } else {
          baseCompressionRatio = 0.3; // Mild extreme: up to 30%
        }

        // Extreme mode works better on image-heavy PDFs
        if (selectedFile.size > 5 * 1024 * 1024) {
          baseCompressionRatio += 0.1; // Large files compress better in extreme mode
        }

        if (pageCount > 10) {
          baseCompressionRatio += 0.05; // More pages = more compression opportunity
        }

        // Cap extreme mode at 85%
        baseCompressionRatio = Math.min(baseCompressionRatio, 0.85);
      } else {
        // Standard compression mode
        if (qualityValue <= 0.3) {
          baseCompressionRatio = 0.15; // Maximum compression: up to 15%
        } else if (qualityValue <= 0.5) {
          baseCompressionRatio = 0.12; // High compression: up to 12%
        } else if (qualityValue <= 0.7) {
          baseCompressionRatio = 0.08; // Medium compression: up to 8%
        } else if (qualityValue <= 0.8) {
          baseCompressionRatio = 0.06; // Balanced compression: up to 6%
        } else {
          baseCompressionRatio = 0.03; // Minimal compression: up to 3%
        }

        // Standard adjustments
        if (selectedFile.size > 10 * 1024 * 1024) {
          baseCompressionRatio += 0.03;
        } else if (selectedFile.size > 5 * 1024 * 1024) {
          baseCompressionRatio += 0.02;
        }

        if (pageCount > 20) {
          baseCompressionRatio += 0.02;
        } else if (pageCount > 10) {
          baseCompressionRatio += 0.01;
        }

        // Small file penalty
        if (selectedFile.size < 2 * 1024 * 1024) {
          baseCompressionRatio = Math.max(0.01, baseCompressionRatio * 0.5);
        }

        // Cap standard mode at 20%
        baseCompressionRatio = Math.min(baseCompressionRatio, 0.2);
      }

      const estimatedSavings = selectedFile.size * baseCompressionRatio;
      const estimatedSize = selectedFile.size - estimatedSavings;
      const compressionRatio = baseCompressionRatio * 100;

      setCompressionPreview({
        estimatedSize,
        estimatedSavings,
        compressionRatio,
      });

      // Processing time - extreme mode takes longer
      const baseMBTime = extremeMode ? 3.0 : 1.5;
      const qualityMultiplier = extremeMode
        ? qualityValue < 0.5
          ? 4.0
          : qualityValue < 0.8
            ? 3.0
            : 2.5
        : qualityValue < 0.5
          ? 2.2
          : qualityValue < 0.8
            ? 1.6
            : 1.2;
      const pageMultiplier = 1 + pageCount / (extremeMode ? 25 : 50);
      const timeInSeconds = Math.max(
        extremeMode ? 5 : 2,
        (selectedFile.size / (1024 * 1024)) *
          baseMBTime *
          qualityMultiplier *
          pageMultiplier,
      );
      setEstimatedTime(`${timeInSeconds.toFixed(0)} seconds`);
    },
    [extremeMode],
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

  // Handle extreme mode toggle
  const handleExtremeModeChange = useCallback(
    (enabled: boolean) => {
      setExtremeMode(enabled);
      if (file && file.pageCount) {
        updateCompressionPreview(file.file, quality[0], file.pageCount);
      }
    },
    [file, quality, updateCompressionPreview],
  );

  // Handle compression by navigating to processing page
  const handleCompress = async () => {
    if (!file) return;

    // Check usage limits
    const usageCheck = await PDFService.checkUsageLimit();
    if (!usageCheck.canUpload) {
      setUsageLimitReached(true);
      if (!isAuthenticated) {
        setShowAuthModal(true);
      }
      return;
    }

    // Prepare processing data
    const processingData = {
      file: file.file,
      quality: quality[0],
      extremeMode,
      fileName: file.name,
      fileSize: file.size,
      estimatedCompression: compressionPreview?.compressionRatio || 10,
    };

    // Navigate to processing page with data
    navigate("/compress-processing", {
      state: { processingData },
    });
  };

  const getQualityLabel = (value: number) => {
    if (value >= 0.8) return "High Quality";
    if (value >= 0.6) return "Medium Quality";
    if (value >= 0.4) return "Low Quality";
    return "Maximum Compression";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Drag and drop handlers
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFilesSelect(files);
      }
    },
    [handleFilesSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

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
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Minimize className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Smart PDF Compressor
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Advanced real-time compression with instant preview and live
            optimization
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Enhanced File Upload with Drag & Drop */}
          {!file && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300",
                  isDragOver
                    ? "border-purple-400 bg-purple-50 scale-102 shadow-lg"
                    : "border-gray-300 hover:border-purple-400 hover:bg-gray-50",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFilesSelect(Array.from(e.target.files));
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center space-y-6">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
                      isDragOver
                        ? "bg-purple-500 text-white scale-110"
                        : "bg-purple-100 text-purple-500",
                    )}
                  >
                    <Upload className="w-10 h-10" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-text-dark mb-2">
                      {isDragOver ? "Drop your PDF here!" : "Select PDF file"}
                    </h3>
                    <p className="text-text-light mb-6">
                      or drag and drop PDF file here
                    </p>

                    <Button
                      type="button"
                      size="lg"
                      className="bg-purple-500 hover:bg-purple-600"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Choose PDF File
                    </Button>

                    <p className="text-sm text-text-light mt-4">
                      Supports PDF files • Max size:{" "}
                      {user?.isPremium ? "100MB" : "25MB"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Preview with Thumbnails */}
          {file && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-heading-small text-text-dark flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-purple-500" />
                  PDF Preview & Settings
                </h3>
                <Button variant="outline" onClick={() => setFile(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Remove File
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: File Info & Thumbnails */}
                <div className="space-y-6">
                  {/* File Info */}
                  <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text-dark truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-text-light">
                        <span>{formatFileSize(file.size)}</span>
                        {file.pageCount && (
                          <span>• {file.pageCount} pages</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PDF Thumbnails */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-text-dark flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Page Preview
                    </h4>

                    {file.loadingThumbnails ? (
                      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                        <span className="ml-2 text-text-light">
                          Generating preview...
                        </span>
                      </div>
                    ) : file.thumbnails && file.thumbnails.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {file.thumbnails.map((thumbnail, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={thumbnail}
                              alt={`Page ${index + 1}`}
                              className="w-full h-24 object-contain bg-white border border-gray-200 rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                            />
                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                        {file.pageCount && file.pageCount > 5 && (
                          <div className="flex items-center justify-center h-24 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="text-sm text-text-light">
                              +{file.pageCount - 5} more
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-text-light">
                          Preview not available
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Compression Settings */}
                <div className="space-y-6">
                  {/* Extreme Mode Toggle */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-red-500" />
                        <h4 className="font-medium text-red-800">
                          Extreme Compression Mode
                        </h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={extremeMode}
                          onChange={(e) =>
                            handleExtremeModeChange(e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>

                    {extremeMode ? (
                      <div className="text-sm space-y-2">
                        <p className="text-red-800 font-medium">
                          ⚡ Up to 85% compression possible
                        </p>
                        <p className="text-red-700 text-xs">
                          ⚠️ Warning: May significantly reduce image quality and
                          remove some formatting. Best for storage/archival
                          purposes.
                        </p>
                      </div>
                    ) : (
                      <p className="text-orange-700 text-sm">
                        Enable for maximum compression (30-85% reduction) with
                        quality trade-offs
                      </p>
                    )}
                  </div>

                  {/* Quality Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-text-dark flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Compression Settings
                    </h4>

                    <div className="space-y-3">
                      <Slider
                        value={quality}
                        onValueChange={handleQualityChange}
                        max={1}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-light">
                          {extremeMode ? "Extreme" : "Max"} Compression
                        </span>
                        <span
                          className={cn(
                            "font-medium",
                            extremeMode ? "text-red-600" : "text-purple-600",
                          )}
                        >
                          {extremeMode
                            ? `${getQualityLabel(quality[0])} (Extreme)`
                            : getQualityLabel(quality[0])}
                        </span>
                        <span className="text-text-light">High Quality</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Card */}
                  {compressionPreview && (
                    <div
                      className={cn(
                        "rounded-lg p-4 border",
                        extremeMode
                          ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-200"
                          : "bg-gradient-to-br from-green-50 to-blue-50 border-green-200",
                      )}
                    >
                      <h5 className="font-medium text-text-dark mb-3 flex items-center">
                        <Zap
                          className={cn(
                            "w-4 h-4 mr-2",
                            extremeMode ? "text-red-500" : "text-green-500",
                          )}
                        />
                        {extremeMode
                          ? "Extreme Compression Preview"
                          : "Live Compression Preview"}
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
                            {formatFileSize(
                              compressionPreview.estimatedSavings,
                            )}
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
                                extremeMode
                                  ? compressionPreview.compressionRatio >= 60
                                    ? "text-red-600"
                                    : compressionPreview.compressionRatio >= 30
                                      ? "text-orange-600"
                                      : "text-yellow-600"
                                  : compressionPreview.compressionRatio >= 30
                                    ? "text-green-600"
                                    : compressionPreview.compressionRatio >= 15
                                      ? "text-blue-600"
                                      : "text-orange-600",
                              )}
                            >
                              {compressionPreview.compressionRatio.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-text-light">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Est. time: {estimatedTime}
                          </span>
                          <span className="flex items-center">
                            <HardDrive className="w-3 h-3 mr-1" />
                            {getQualityLabel(quality[0])}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quality Info with Realistic Expectations */}
                  <div
                    className={cn(
                      "border rounded-lg p-4",
                      extremeMode
                        ? "bg-red-50 border-red-200"
                        : "bg-blue-50 border-blue-200",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm mb-2",
                        extremeMode ? "text-red-800" : "text-blue-800",
                      )}
                    >
                      <strong>Current Setting:</strong>{" "}
                      {extremeMode
                        ? `${getQualityLabel(quality[0])} (Extreme)`
                        : getQualityLabel(quality[0])}
                    </p>
                    <div
                      className={cn(
                        "text-xs space-y-1",
                        extremeMode ? "text-red-700" : "text-blue-700",
                      )}
                    >
                      {extremeMode ? (
                        // Extreme mode expectations
                        <>
                          {quality[0] >= 0.7 && (
                            <p>
                              • Extreme mode: 30-50% reduction with moderate
                              quality loss
                            </p>
                          )}
                          {quality[0] < 0.7 && quality[0] >= 0.4 && (
                            <p>
                              • Extreme mode: 45-65% reduction with noticeable
                              quality loss
                            </p>
                          )}
                          {quality[0] < 0.4 && (
                            <p>
                              • Extreme mode: 60-85% reduction with significant
                              quality loss
                            </p>
                          )}
                        </>
                      ) : (
                        // Standard mode expectations
                        <>
                          {quality[0] >= 0.7 && (
                            <p>
                              • Preserves quality - compression may be minimal
                              (3-8%)
                            </p>
                          )}
                          {quality[0] < 0.7 && quality[0] >= 0.4 && (
                            <p>
                              • Balanced optimization - expect 5-12% reduction
                            </p>
                          )}
                          {quality[0] < 0.4 && (
                            <p>
                              • Maximum compression - up to 15% reduction
                              possible
                            </p>
                          )}
                        </>
                      )}

                      {!extremeMode &&
                        compressionPreview &&
                        compressionPreview.compressionRatio < 5 && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-yellow-800 font-medium">
                              ⚠️ Low compression expected
                            </p>
                            <p className="text-yellow-700">
                              Try Extreme Mode for higher compression rates
                              (with quality trade-offs).
                            </p>
                          </div>
                        )}

                      {extremeMode && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                          <p className="text-red-800 font-medium">
                            🔥 Extreme compression active
                          </p>
                          <p className="text-red-700">
                            May remove formatting, reduce image quality, and
                            affect readability.
                          </p>
                        </div>
                      )}

                      {!extremeMode && file && file.size < 2 * 1024 * 1024 && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-orange-800 font-medium">
                            ℹ️ Small file notice
                          </p>
                          <p className="text-orange-700">
                            Files under 2MB are often already compressed. Try
                            Extreme Mode for better results.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Usage Limit Warnings */}
          {usageLimitReached && !isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-heading-small text-text-dark mb-2">
                Daily Limit Reached
              </h3>
              <p className="text-body-medium text-text-light mb-4">
                You've used your 3 free PDF operations today. Sign up to
                continue!
              </p>
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-brand-red hover:bg-red-600"
              >
                Sign Up Free
              </Button>
            </div>
          )}

          {usageLimitReached && isAuthenticated && !user?.isPremium && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-heading-small text-text-dark mb-2">
                Upgrade to Premium
              </h3>
              <p className="text-body-medium text-text-light mb-4">
                You've reached your daily limit. Upgrade to Premium for
                unlimited access!
              </p>
              <Button
                className="bg-brand-yellow text-black hover:bg-yellow-400"
                asChild
              >
                <Link to="/pricing">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Link>
              </Button>
            </div>
          )}

          {/* Compress Button */}
          {file && !usageLimitReached && (
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleCompress}
                className="bg-purple-500 hover:bg-purple-600 text-lg px-8 py-3"
              >
                <Minimize className="w-5 h-5 mr-2" />
                Compress PDF Now
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
        </div>

        {/* Enhanced Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-purple-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Instant Preview
            </h4>
            <p className="text-body-small text-text-light">
              See PDF pages and compression results in real-time before
              processing
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Live Optimization
            </h4>
            <p className="text-body-small text-text-light">
              Watch compression progress with detailed step-by-step processing
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Settings className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Smart Controls
            </h4>
            <p className="text-body-small text-text-light">
              Intelligent quality settings with real-time size estimation
            </p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
          <h3 className="text-heading-small text-text-dark text-center mb-6">
            💡 Pro Tips for Best Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-dark">
                    Use Max Compression for large files
                  </p>
                  <p className="text-xs text-text-light">
                    Image-heavy PDFs can see 40-60% reduction
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-dark">
                    Preview shows real compression potential
                  </p>
                  <p className="text-xs text-text-light">
                    Live estimates help you choose the right quality
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-dark">
                    Check page thumbnails
                  </p>
                  <p className="text-xs text-text-light">
                    Ensure important content is preserved
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-600 text-sm font-bold">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-dark">
                    Drag & drop for fastest upload
                  </p>
                  <p className="text-xs text-text-light">
                    Instant file validation and preview generation
                  </p>
                </div>
              </div>
            </div>
          </div>
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

export default Compress;
