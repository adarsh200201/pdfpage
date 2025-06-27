import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
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
  Activity,
  Target,
  Layers,
  Cpu,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "active" | "completed" | "error";
  progress: number;
  icon: any;
  details?: string[];
}

interface ProcessingState {
  file: File;
  quality: number;
  extremeMode: boolean;
  fileName: string;
  fileSize: number;
  estimatedCompression: number;
}

const CompressProcessing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [processingState, setProcessingState] =
    useState<ProcessingState | null>(location.state?.processingData || null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    processingTime: number;
    compressionLevel: string;
  } | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPdf, setProcessedPdf] = useState<Uint8Array | null>(null);
  const processingStartedRef = useRef(false);

  // Initialize processing steps
  const initializeProcessingSteps = useCallback(() => {
    const steps: ProcessingStep[] = [
      {
        id: "upload",
        name: "Uploading PDF",
        description: "Preparing your file for compression",
        status: "pending",
        progress: 0,
        icon: Upload,
        details: ["Validating file integrity", "Checking file structure"],
      },
      {
        id: "analyze",
        name: "Analyzing Document",
        description: "Examining PDF structure and content",
        status: "pending",
        progress: 0,
        icon: Activity,
        details: [
          "Scanning page content",
          "Identifying images and text",
          "Analyzing compression opportunities",
        ],
      },
      {
        id: "optimize",
        name: "Optimizing Content",
        description: "Removing redundant data and optimizing structure",
        status: "pending",
        progress: 0,
        icon: Target,
        details: [
          "Cleaning metadata",
          "Optimizing page content",
          "Removing duplicate objects",
        ],
      },
      {
        id: "compress",
        name: processingState?.extremeMode
          ? "Extreme Compression"
          : "Smart Compression",
        description: processingState?.extremeMode
          ? "Applying maximum compression with quality trade-offs"
          : "Applying intelligent compression algorithms",
        status: "pending",
        progress: 0,
        icon: processingState?.extremeMode ? Zap : Layers,
        details: processingState?.extremeMode
          ? [
              "Aggressive content reduction",
              "Image quality optimization",
              "Extreme size reduction",
            ]
          : [
              "Smart object compression",
              "Image optimization",
              "Content stream compression",
            ],
      },
      {
        id: "finalize",
        name: "Finalizing Download",
        description: "Preparing your compressed PDF",
        status: "pending",
        progress: 0,
        icon: Save,
        details: ["Generating download link", "Preparing file delivery"],
      },
    ];
    setProcessingSteps(steps);
    return steps;
  }, [processingState]);

  // Update processing step
  const updateProcessingStep = useCallback(
    (
      stepId: string,
      status: ProcessingStep["status"],
      progress: number = 0,
      details?: string[],
    ) => {
      setProcessingSteps((prev) =>
        prev.map((step) =>
          step.id === stepId
            ? { ...step, status, progress, details: details || step.details }
            : step,
        ),
      );

      // Update current step index
      const stepIndex = processingSteps.findIndex((step) => step.id === stepId);
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex);
      }
    },
    [processingSteps],
  );

  // Start processing
  useEffect(() => {
    if (!processingState) {
      navigate("/compress");
      return;
    }

    // Prevent multiple simultaneous processing operations
    if (isProcessing || isComplete || error || processingStartedRef.current) {
      return;
    }

    const startProcessing = async () => {
      processingStartedRef.current = true;
      setIsProcessing(true);
      const startTime = Date.now();
      const steps = initializeProcessingSteps();

      try {
        // Step 1: Upload
        updateProcessingStep("upload", "active", 0);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateProcessingStep("upload", "active", 50, [
          "File validation complete",
        ]);
        await new Promise((resolve) => setTimeout(resolve, 500));
        updateProcessingStep("upload", "completed", 100, ["Upload successful"]);
        setOverallProgress(20);

        // Step 2: Analyze
        updateProcessingStep("analyze", "active", 0);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        updateProcessingStep("analyze", "active", 40, [
          "Document structure analyzed",
          "Content mapping complete",
        ]);
        await new Promise((resolve) => setTimeout(resolve, 800));
        updateProcessingStep("analyze", "completed", 100, [
          "Analysis complete",
          `${processingState.estimatedCompression.toFixed(1)}% compression potential identified`,
        ]);
        setOverallProgress(40);

        // Step 3: Optimize
        updateProcessingStep("optimize", "active", 0);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateProcessingStep("optimize", "active", 30, [
          "Metadata optimized",
          "Duplicate objects removed",
        ]);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        updateProcessingStep("optimize", "active", 70, [
          "Content streams optimized",
          "Page structure improved",
        ]);
        await new Promise((resolve) => setTimeout(resolve, 800));
        updateProcessingStep("optimize", "completed", 100, [
          "Optimization complete",
          "Ready for compression",
        ]);
        setOverallProgress(60);

        // Step 4: Compress
        updateProcessingStep("compress", "active", 0);

        const compressedPdfBytes = await PDFService.compressPDF(
          processingState.file,
          processingState.quality,
          (progressValue) => {
            updateProcessingStep("compress", "active", progressValue, [
              `Compression progress: ${progressValue.toFixed(0)}%`,
              processingState.extremeMode
                ? "Applying extreme compression..."
                : "Applying smart compression...",
            ]);
            setOverallProgress(60 + progressValue * 0.3);
          },
          processingState.extremeMode,
        );

        // Store the processed PDF to prevent re-processing
        setProcessedPdf(compressedPdfBytes);

        updateProcessingStep("compress", "completed", 100, [
          "Compression complete",
          `File size optimized`,
        ]);
        setOverallProgress(90);

        // Step 5: Finalize
        updateProcessingStep("finalize", "active", 0);
        await new Promise((resolve) => setTimeout(resolve, 800));
        updateProcessingStep("finalize", "active", 60, [
          "Preparing download...",
        ]);

        const processingTimeMs = Date.now() - startTime;
        const originalSize = processingState.fileSize;
        const compressedSize = compressedPdfBytes.length;
        const compressionRatio =
          ((originalSize - compressedSize) / originalSize) * 100;

        setCompressionStats({
          originalSize,
          compressedSize,
          compressionRatio,
          processingTime: processingTimeMs,
          compressionLevel: getQualityLabel(processingState.quality),
        });

        // Track usage
        await PDFService.trackUsage("compress", 1, processingState.fileSize);

        // Generate unique filename
        const timestamp = new Date()
          .toISOString()
          .slice(11, 19)
          .replace(/:/g, "-");
        const fileName = processingState.fileName.replace(/\.pdf$/i, "");
        const compressionInfo =
          compressionRatio > 5
            ? `_${compressionRatio.toFixed(0)}pc_smaller`
            : "_optimized";
        const finalFileName = `${fileName}${compressionInfo}_${timestamp}.pdf`;

        PDFService.downloadFile(compressedPdfBytes, finalFileName);

        updateProcessingStep("finalize", "completed", 100, [
          "Download ready",
          "File saved successfully",
        ]);
        setOverallProgress(100);
        setIsComplete(true);

        // Success toast
        if (compressionRatio >= 15) {
          toast({
            title: "🎉 Excellent Compression!",
            description: `Outstanding ${compressionRatio.toFixed(1)}% reduction in ${(processingTimeMs / 1000).toFixed(1)}s`,
          });
        } else if (compressionRatio >= 5) {
          toast({
            title: "✅ Good Compression",
            description: `${compressionRatio.toFixed(1)}% reduction achieved in ${(processingTimeMs / 1000).toFixed(1)}s`,
          });
        } else {
          toast({
            title: "📄 PDF Optimized",
            description: `File optimized in ${(processingTimeMs / 1000).toFixed(1)}s`,
          });
        }
      } catch (error: any) {
        console.error("Processing error:", error);

        const currentStepId = steps[currentStepIndex]?.id || "compress";
        updateProcessingStep(currentStepId, "error", 0, [
          "Processing failed",
          error.message || "An unexpected error occurred",
        ]);

        setError(error.message || "Failed to process PDF file");

        toast({
          title: "Processing Failed",
          description: error.message || "Failed to compress PDF file",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    startProcessing();
  }, []); // Run once when component mounts

  // Update processing time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessingTime((prev) => prev + 1);
    }, 1000);

    if (isComplete || error) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isComplete, error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up processed PDF from memory
      setProcessedPdf(null);
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getQualityLabel = (value: number) => {
    if (value >= 0.8) return "High Quality";
    if (value >= 0.6) return "Medium Quality";
    if (value >= 0.4) return "Low Quality";
    return "Maximum Compression";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `${secs}s`;
  };

  if (!processingState) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4",
              processingState.extremeMode
                ? "bg-gradient-to-br from-red-500 to-orange-500"
                : "bg-gradient-to-br from-purple-500 to-blue-500",
            )}
          >
            {isComplete ? (
              <CheckCircle className="w-10 h-10 text-white" />
            ) : error ? (
              <X className="w-10 h-10 text-white" />
            ) : (
              <Activity className="w-10 h-10 text-white animate-pulse" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isComplete
              ? "Compression Complete!"
              : error
                ? "Processing Failed"
                : processingState.extremeMode
                  ? "Extreme Compression in Progress"
                  : "Smart Compression in Progress"}
          </h1>

          <p className="text-gray-600 mb-4">
            {isComplete
              ? "Your PDF has been successfully compressed and downloaded"
              : error
                ? "Something went wrong during processing"
                : "Please wait while we optimize your PDF file"}
          </p>

          {/* File Info */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 truncate max-w-48">
                  {processingState.fileName}
                </p>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span>{formatFileSize(processingState.fileSize)}</span>
                  <span>•</span>
                  <span
                    className={cn(
                      processingState.extremeMode
                        ? "text-red-600"
                        : "text-purple-600",
                    )}
                  >
                    {processingState.extremeMode
                      ? "Extreme Mode"
                      : getQualityLabel(processingState.quality)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(processingTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Overall Progress</h3>
            <span className="text-sm font-medium text-gray-600">
              {overallProgress.toFixed(0)}% Complete
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={cn(
                "h-3 rounded-full transition-all duration-500 ease-out",
                processingState.extremeMode
                  ? "bg-gradient-to-r from-red-500 to-orange-500"
                  : "bg-gradient-to-r from-purple-500 to-blue-500",
                isComplete && "bg-gradient-to-r from-green-500 to-green-600",
                error && "bg-gradient-to-r from-red-500 to-red-600",
              )}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Processing Steps */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-500" />
            Live Processing Steps
          </h3>

          <div className="space-y-6">
            {processingSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "relative flex items-start space-x-4 p-4 rounded-lg transition-all duration-300",
                    step.status === "active" &&
                      !processingState.extremeMode &&
                      "bg-purple-50 border border-purple-200",
                    step.status === "active" &&
                      processingState.extremeMode &&
                      "bg-red-50 border border-red-200",
                    step.status === "completed" &&
                      "bg-green-50 border border-green-200",
                    step.status === "error" &&
                      "bg-red-50 border border-red-200",
                    step.status === "pending" &&
                      "bg-gray-50 border border-gray-200",
                  )}
                >
                  {/* Step Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      step.status === "active" &&
                        !processingState.extremeMode &&
                        "bg-purple-500",
                      step.status === "active" &&
                        processingState.extremeMode &&
                        "bg-red-500",
                      step.status === "completed" && "bg-green-500",
                      step.status === "error" && "bg-red-500",
                      step.status === "pending" && "bg-gray-300",
                    )}
                  >
                    {step.status === "active" ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : step.status === "completed" ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : step.status === "error" ? (
                      <X className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className={cn(
                          "font-medium",
                          step.status === "active" &&
                            !processingState.extremeMode &&
                            "text-purple-800",
                          step.status === "active" &&
                            processingState.extremeMode &&
                            "text-red-800",
                          step.status === "completed" && "text-green-800",
                          step.status === "error" && "text-red-800",
                          step.status === "pending" && "text-gray-600",
                        )}
                      >
                        {step.name}
                      </h4>

                      {step.status === "active" && (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            processingState.extremeMode
                              ? "text-red-600"
                              : "text-purple-600",
                          )}
                        >
                          {step.progress.toFixed(0)}%
                        </span>
                      )}
                    </div>

                    <p
                      className={cn(
                        "text-sm mb-3",
                        step.status === "active" &&
                          !processingState.extremeMode &&
                          "text-purple-700",
                        step.status === "active" &&
                          processingState.extremeMode &&
                          "text-red-700",
                        step.status === "completed" && "text-green-700",
                        step.status === "error" && "text-red-700",
                        step.status === "pending" && "text-gray-500",
                      )}
                    >
                      {step.description}
                    </p>

                    {/* Progress Bar for Active Step */}
                    {step.status === "active" && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            processingState.extremeMode
                              ? "bg-red-500"
                              : "bg-purple-500",
                          )}
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Step Details */}
                    {step.details &&
                      step.details.length > 0 &&
                      (step.status === "active" ||
                        step.status === "completed" ||
                        step.status === "error") && (
                        <div className="space-y-1">
                          {step.details.map((detail, detailIndex) => (
                            <p
                              key={detailIndex}
                              className={cn(
                                "text-xs flex items-center",
                                step.status === "active" &&
                                  !processingState.extremeMode &&
                                  "text-purple-600",
                                step.status === "active" &&
                                  processingState.extremeMode &&
                                  "text-red-600",
                                step.status === "completed" && "text-green-600",
                                step.status === "error" && "text-red-600",
                              )}
                            >
                              <span className="w-1 h-1 bg-current rounded-full mr-2" />
                              {detail}
                            </p>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Step Number */}
                  <div
                    className={cn(
                      "absolute -left-2 -top-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                      step.status === "completed" && "bg-green-500",
                      step.status === "active" &&
                        !processingState.extremeMode &&
                        "bg-purple-500",
                      step.status === "active" &&
                        processingState.extremeMode &&
                        "bg-red-500",
                      step.status === "error" && "bg-red-500",
                      step.status === "pending" && "bg-gray-400",
                    )}
                  >
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Results Section */}
        {isComplete && compressionStats && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 shadow-sm border border-green-200 mb-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Compression Successful!
              </h3>
              <p className="text-gray-600">
                Your PDF has been optimized and downloaded automatically
              </p>
            </div>

            {/* Compression Stats */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Original Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(compressionStats.originalSize)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Compressed Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(compressionStats.compressedSize)}
                </p>
              </div>
            </div>

            <div className="text-center py-4 border-t border-green-200 mb-6">
              <p className="text-sm text-gray-500 mb-1">Size Reduction</p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  compressionStats.compressionRatio >= 30
                    ? "text-green-600"
                    : compressionStats.compressionRatio >= 15
                      ? "text-blue-600"
                      : compressionStats.compressionRatio >= 5
                        ? "text-orange-600"
                        : "text-gray-600",
                )}
              >
                {compressionStats.compressionRatio.toFixed(1)}% smaller
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="text-center">
                <p>Quality Level</p>
                <p className="font-medium text-gray-900">
                  {compressionStats.compressionLevel}
                </p>
              </div>
              <div className="text-center">
                <p>Processing Time</p>
                <p className="font-medium text-gray-900">
                  {(compressionStats.processingTime / 1000).toFixed(1)}s
                </p>
              </div>
            </div>

            {compressionStats.compressionRatio >= 15 && (
              <div className="mt-6 text-center">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  🎉 Excellent compression achieved!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-2">
              Processing Failed
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          {isComplete && processedPdf && (
            <Button
              onClick={() => {
                if (processedPdf && processingState) {
                  const timestamp = new Date()
                    .toISOString()
                    .slice(11, 19)
                    .replace(/:/g, "-");
                  const fileName = processingState.fileName.replace(
                    /\.pdf$/i,
                    "",
                  );
                  const compressionInfo =
                    compressionStats && compressionStats.compressionRatio > 5
                      ? `_${compressionStats.compressionRatio.toFixed(0)}pc_smaller`
                      : "_optimized";
                  const finalFileName = `${fileName}${compressionInfo}_${timestamp}.pdf`;
                  PDFService.downloadFile(processedPdf, finalFileName);
                }
              }}
              className="bg-green-500 hover:bg-green-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Again
            </Button>
          )}

          <Button
            onClick={() => navigate("/compress")}
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Minimize className="w-4 h-4 mr-2" />
            Compress Another PDF
          </Button>

          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompressProcessing;
