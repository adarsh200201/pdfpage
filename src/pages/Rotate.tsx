import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  FileText,
  RotateCw,
  RotateCcw,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
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

const Rotate = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);

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
      setRotation(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleRotate = async () => {
    if (!file || rotation === 0) return;

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

    try {
      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      const rotatedPdfBytes = await PDFService.rotatePDF(file.file, rotation);

      // Track usage
      await PDFService.trackUsage("rotate-pdf", 1, file.size);

      // Download the rotated file
      PDFService.downloadFile(rotatedPdfBytes, `rotated-${file.name}`);

      setIsComplete(true);

      toast({
        title: "Success!",
        description: `PDF rotated ${rotation}° successfully`,
      });
    } catch (error: any) {
      console.error("Error rotating PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to rotate PDF file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const adjustRotation = (degrees: number) => {
    setRotation((prev) => {
      const newRotation = prev + degrees;
      // Normalize to 0, 90, 180, 270
      return ((newRotation % 360) + 360) % 360;
    });
  };

  const getRotationLabel = (degrees: number) => {
    switch (degrees) {
      case 0:
        return "No rotation";
      case 90:
        return "90° clockwise";
      case 180:
        return "180° (upside down)";
      case 270:
        return "270° clockwise (90° counter-clockwise)";
      default:
        return `${degrees}°`;
    }
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
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
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RotateCw className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Rotate PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Rotate your PDFs the way you need them. You can even rotate multiple
            PDFs at once!
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
                />
              </div>
            )}

            {/* File Display with Rotation Controls */}
            {file && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-heading-small text-text-dark">
                    PDF File & Rotation Settings
                  </h3>
                  <Button variant="outline" onClick={() => setFile(null)}>
                    Choose Different File
                  </Button>
                </div>

                {/* File Info */}
                <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50 mb-6">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-teal-500" />
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

                {/* Rotation Controls */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-text-dark mb-4">
                      Rotation Preview
                    </h4>

                    {/* Visual representation */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div
                          className={`w-24 h-32 bg-gradient-to-br from-teal-100 to-teal-200 border-2 border-teal-300 rounded-lg flex items-center justify-center transform transition-transform duration-300`}
                          style={{ transform: `rotate(${rotation}deg)` }}
                        >
                          <FileText className="w-8 h-8 text-teal-600" />
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-text-light mb-4">
                      Current rotation:{" "}
                      <strong>{getRotationLabel(rotation)}</strong>
                    </p>

                    {/* Rotation Buttons */}
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => adjustRotation(-90)}
                        className="flex items-center space-x-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Rotate Left (90°)</span>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => adjustRotation(90)}
                        className="flex items-center space-x-2"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>Rotate Right (90°)</span>
                      </Button>
                    </div>

                    {rotation !== 0 && (
                      <Button
                        variant="ghost"
                        onClick={() => setRotation(0)}
                        className="mt-3 text-sm"
                      >
                        Reset to Original
                      </Button>
                    )}
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

            {/* Rotate Button */}
            {file && rotation !== 0 && !usageLimitReached && (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleRotate}
                  disabled={isProcessing}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Rotating PDF...
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-5 h-5 mr-2" />
                      Apply Rotation ({rotation}°)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Rotating your PDF...
                </h3>
                <p className="text-body-medium text-text-light">
                  Applying {rotation}° rotation to all pages
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
              PDF rotated successfully!
            </h3>
            <p className="text-body-medium text-text-light mb-6">
              Your PDF has been rotated {rotation}° and downloaded automatically
            </p>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => window.location.reload()}
                className="bg-teal-500 hover:bg-teal-600"
              >
                Rotate Another PDF
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
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <RotateCw className="w-6 h-6 text-teal-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Precise Rotation
            </h4>
            <p className="text-body-small text-text-light">
              Rotate PDFs in 90° increments with perfect accuracy
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">High Quality</h4>
            <p className="text-body-small text-text-light">
              Maintain original quality and formatting after rotation
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-purple-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              All Page Sizes
            </h4>
            <p className="text-body-small text-text-light">
              Works with any PDF page size and orientation
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

export default Rotate;
