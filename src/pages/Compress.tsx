import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
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
}

const Compress = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [quality, setQuality] = useState([0.7]);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [compressionPreview, setCompressionPreview] = useState<{
    estimatedSize: number;
    estimatedSavings: number;
  } | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleFilesSelect = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile({
        id: Math.random().toString(36).substr(2, 9),
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
      });
      setIsComplete(false);
      setCompressionStats(null);
      updateCompressionPreview(selectedFile, quality[0]);
    }
  };

  // Real-time compression preview
  const updateCompressionPreview = (
    selectedFile: File,
    qualityValue: number,
  ) => {
    // Estimate compression based on quality setting
    const compressionRatio = 1 - qualityValue * 0.8; // Rough estimation
    const estimatedSize = selectedFile.size * (1 - compressionRatio);
    const estimatedSavings = selectedFile.size - estimatedSize;

    setCompressionPreview({
      estimatedSize,
      estimatedSavings,
    });

    // Estimate processing time based on file size
    const timeInSeconds = Math.max(2, (selectedFile.size / (1024 * 1024)) * 2); // 2 seconds per MB
    setEstimatedTime(`${timeInSeconds.toFixed(0)} seconds`);
  };

  // Update preview when quality changes
  const handleQualityChange = (newQuality: number[]) => {
    setQuality(newQuality);
    if (file) {
      updateCompressionPreview(file.file, newQuality[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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

    setIsProcessing(true);
    setProgress(0);
    const startTime = Date.now();

    try {
      toast({
        title: `🔄 Compressing ${file.name}...`,
        description: `Quality: ${Math.round(quality[0] * 100)}% • Estimated time: ${estimatedTime}`,
      });

      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      const compressedPdfBytes = await PDFService.compressPDF(
        file.file,
        quality[0],
      );

      // Calculate compression stats
      const originalSize = file.size;
      const compressedSize = compressedPdfBytes.length;
      const compressionRatio =
        ((originalSize - compressedSize) / originalSize) * 100;

      setCompressionStats({
        originalSize,
        compressedSize,
        compressionRatio,
      });

      // Track usage
      await PDFService.trackUsage("compress", 1, file.size);

      // Download the compressed file
      PDFService.downloadFile(compressedPdfBytes, `compressed-${file.name}`);

      setIsComplete(true);

      toast({
        title: "Success!",
        description: `PDF compressed by ${compressionRatio.toFixed(1)}%`,
      });
    } catch (error: any) {
      console.error("Error compressing PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to compress PDF file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getQualityLabel = (value: number) => {
    if (value >= 0.8) return "High Quality";
    if (value >= 0.6) return "Medium Quality";
    if (value >= 0.4) return "Low Quality";
    return "Maximum Compression";
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            Compress PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Reduce file size while optimizing for maximal PDF quality.
          </p>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload */}
            {!file && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFilesSelect}
                  multiple={false}
                  maxSize={25}
                  allowedTypes={["pdf"]}
                />
              </div>
            )}

            {/* File Display with Quality Settings */}
            {file && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-heading-small text-text-dark">
                    PDF File & Compression Settings
                  </h3>
                  <Button variant="outline" onClick={() => setFile(null)}>
                    Choose Different File
                  </Button>
                </div>

                {/* File Info */}
                <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-dark truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-text-light">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                {/* Quality Settings */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-text-dark">
                      Compression Quality
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      max={1}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-light">
                        Maximum Compression
                      </span>
                      <span className="text-sm font-medium text-text-dark">
                        {getQualityLabel(quality[0])}
                      </span>
                      <span className="text-sm text-text-light">
                        High Quality
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Current Setting:</strong>{" "}
                      {getQualityLabel(quality[0])}
                      {quality[0] >= 0.7 && " - Recommended for most documents"}
                      {quality[0] < 0.4 &&
                        " - May significantly reduce quality"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Limit Warning */}
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
                  disabled={isProcessing}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Compressing PDF...
                    </>
                  ) : (
                    <>
                      <Minimize className="w-5 h-5 mr-2" />
                      Compress PDF
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Compressing your PDF...
                </h3>
                <p className="text-body-medium text-text-light">
                  Optimizing file size while maintaining quality
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-heading-small text-text-dark mb-2">
              PDF compressed successfully!
            </h3>

            {compressionStats && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-light">Original Size:</span>
                    <br />
                    <span className="font-medium text-text-dark">
                      {formatFileSize(compressionStats.originalSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-light">Compressed Size:</span>
                    <br />
                    <span className="font-medium text-text-dark">
                      {formatFileSize(compressionStats.compressedSize)}
                    </span>
                  </div>
                  <div className="col-span-2 text-center pt-2 border-t border-gray-200">
                    <span className="text-text-light">Compression Ratio:</span>
                    <br />
                    <span className="font-bold text-green-600 text-lg">
                      {compressionStats.compressionRatio.toFixed(1)}% smaller
                    </span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-body-medium text-text-light mb-6">
              Your compressed PDF has been downloaded automatically
            </p>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => window.location.reload()}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Compress Another PDF
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Minimize className="w-6 h-6 text-purple-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Smart Compression
            </h4>
            <p className="text-body-small text-text-light">
              Advanced algorithms reduce file size while maintaining quality
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Quality Control
            </h4>
            <p className="text-body-small text-text-light">
              Choose your compression level to balance size and quality
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Fast Processing
            </h4>
            <p className="text-body-small text-text-light">
              Compress PDF files quickly without losing important content
            </p>
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
