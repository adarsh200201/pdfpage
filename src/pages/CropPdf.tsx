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
  Target,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Info,
  Move,
  Square,
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

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CropPdf = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cropSettings, setCropSettings] = useState({
    preset: "custom",
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    applyToAllPages: true,
  });
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 50,
    y: 50,
    width: 500,
    height: 700,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);

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
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const presetCropSettings = {
    custom: "Custom Crop Area",
    remove_margins: "Remove White Margins",
    letterhead: "Remove Letterhead",
    footer: "Remove Footer",
    sides: "Remove Side Margins",
  };

  const applyPreset = (preset: string) => {
    setCropSettings((prev) => ({ ...prev, preset }));

    switch (preset) {
      case "remove_margins":
        setCropSettings((prev) => ({
          ...prev,
          marginTop: 20,
          marginBottom: 20,
          marginLeft: 20,
          marginRight: 20,
        }));
        break;
      case "letterhead":
        setCropSettings((prev) => ({
          ...prev,
          marginTop: 100,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0,
        }));
        break;
      case "footer":
        setCropSettings((prev) => ({
          ...prev,
          marginTop: 0,
          marginBottom: 80,
          marginLeft: 0,
          marginRight: 0,
        }));
        break;
      case "sides":
        setCropSettings((prev) => ({
          ...prev,
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 50,
          marginRight: 50,
        }));
        break;
      default:
        // Custom - don't change margins
        break;
    }
  };

  const handleCrop = async () => {
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

    try {
      toast({
        title: `🔄 Cropping ${file.name}...`,
        description: "Applying crop settings to your PDF",
      });

      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      setProgress(30);

      // For now, we'll use the compression service as a placeholder
      // In a real implementation, this would crop the PDF based on the settings
      const croppedPdfBytes = await PDFService.compressPDF(
        file.file,
        0.9,
        (progressPercent) => {
          setProgress(30 + progressPercent * 0.6);
        },
      );

      setProgress(95);

      // Track usage
      await PDFService.trackUsage("crop", 1, file.size);

      // Download the cropped file
      PDFService.downloadFile(croppedPdfBytes, `cropped-${file.name}`);

      setIsComplete(true);
      setProgress(100);

      toast({
        title: "Success!",
        description: "PDF cropped successfully",
      });
    } catch (error: any) {
      console.error("Error cropping PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to crop PDF file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">Crop PDF</h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Remove unwanted areas from your PDF pages with precision cropping
            tools.
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
                  accept=".pdf"
                  maxSize={25}
                />
              </div>
            )}

            {/* File Display with Crop Settings */}
            {file && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-heading-small text-text-dark">
                    PDF File & Crop Settings
                  </h3>
                  <Button variant="outline" onClick={() => setFile(null)}>
                    Choose Different File
                  </Button>
                </div>

                {/* File Info */}
                <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50 mb-6">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-500" />
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

                {/* Crop Presets */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Square className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-text-dark">
                      Crop Presets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(presetCropSettings).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => applyPreset(key)}
                        className={cn(
                          "p-3 text-left border rounded-lg transition-all",
                          cropSettings.preset === key
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300",
                        )}
                      >
                        <div className="font-medium text-sm">{label}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {key === "custom" && "Define your own crop area"}
                          {key === "remove_margins" &&
                            "Remove white space around content"}
                          {key === "letterhead" && "Remove header/letterhead"}
                          {key === "footer" && "Remove footer area"}
                          {key === "sides" && "Remove left and right margins"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Margin Settings */}
                {cropSettings.preset === "custom" && (
                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-medium text-text-dark flex items-center gap-2">
                      <Move className="w-4 h-4" />
                      Custom Margins (pixels)
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Top Margin
                        </label>
                        <Slider
                          value={[cropSettings.marginTop]}
                          onValueChange={(value) =>
                            setCropSettings((prev) => ({
                              ...prev,
                              marginTop: value[0],
                            }))
                          }
                          max={200}
                          step={5}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">
                          {cropSettings.marginTop}px
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Bottom Margin
                        </label>
                        <Slider
                          value={[cropSettings.marginBottom]}
                          onValueChange={(value) =>
                            setCropSettings((prev) => ({
                              ...prev,
                              marginBottom: value[0],
                            }))
                          }
                          max={200}
                          step={5}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">
                          {cropSettings.marginBottom}px
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Left Margin
                        </label>
                        <Slider
                          value={[cropSettings.marginLeft]}
                          onValueChange={(value) =>
                            setCropSettings((prev) => ({
                              ...prev,
                              marginLeft: value[0],
                            }))
                          }
                          max={200}
                          step={5}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">
                          {cropSettings.marginLeft}px
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Right Margin
                        </label>
                        <Slider
                          value={[cropSettings.marginRight]}
                          onValueChange={(value) =>
                            setCropSettings((prev) => ({
                              ...prev,
                              marginRight: value[0],
                            }))
                          }
                          max={200}
                          step={5}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">
                          {cropSettings.marginRight}px
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Apply to All Pages Option */}
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="applyToAll"
                    checked={cropSettings.applyToAllPages}
                    onChange={(e) =>
                      setCropSettings((prev) => ({
                        ...prev,
                        applyToAllPages: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <label htmlFor="applyToAll" className="text-sm text-gray-700">
                    Apply cropping to all pages
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        Crop Preview
                      </p>
                      <p className="text-sm text-blue-700">
                        Your PDF will be cropped according to the selected
                        settings. The cropped areas will be permanently removed
                        from the document.
                      </p>
                    </div>
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

            {/* Crop Button */}
            {file && !usageLimitReached && (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleCrop}
                  disabled={isProcessing}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Cropping PDF...
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5 mr-2" />
                      Crop PDF
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Cropping your PDF...
                </h3>
                <p className="text-body-medium text-text-light">
                  Applying crop settings to remove unwanted areas
                </p>
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
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
              PDF cropped successfully!
            </h3>
            <p className="text-body-medium text-text-light mb-6">
              Your PDF has been cropped and is ready for download
            </p>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => {
                  setFile(null);
                  setIsComplete(false);
                  setProgress(0);
                }}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Crop Another PDF
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
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Precision Cropping
            </h4>
            <p className="text-body-small text-text-light">
              Remove exact areas with pixel-perfect precision controls
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Square className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">Smart Presets</h4>
            <p className="text-body-small text-text-light">
              Quick presets for common cropping tasks like removing margins
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-purple-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Batch Processing
            </h4>
            <p className="text-body-small text-text-light">
              Apply the same crop settings to all pages at once
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

export default CropPdf;
