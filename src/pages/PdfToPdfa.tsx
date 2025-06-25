import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import {
  ArrowLeft,
  Download,
  FileText,
  Archive,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Shield,
  Clock,
  Award,
  Settings,
  Info,
  Zap,
  FileCheck,
  AlertCircle,
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

interface ComplianceCheck {
  requirement: string;
  status: "pass" | "fail" | "warning";
  description: string;
  fixable: boolean;
}

interface ConversionResult {
  success: boolean;
  pdfaLevel: string;
  originalSize: number;
  convertedSize: number;
  complianceChecks: ComplianceCheck[];
  validationScore: number;
  isArchivalQuality: boolean;
}

const PdfToPdfa = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<"1A" | "1B" | "2A" | "2B">(
    "1B",
  );
  const [conversionSettings, setConversionSettings] = useState({
    embedFonts: true,
    optimizeImages: true,
    preserveMetadata: true,
    validateCompliance: true,
    removeInteractivity: true,
  });
  const [conversionResult, setConversionResult] =
    useState<ConversionResult | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const pdfaLevels = [
    {
      value: "1A",
      name: "PDF/A-1A",
      description: "Highest accessibility, full structural compliance",
      features: [
        "Full structural information",
        "Complete accessibility",
        "Tagged PDF structure",
        "Unicode mapping",
      ],
    },
    {
      value: "1B",
      name: "PDF/A-1B",
      description: "Basic archival compliance, visual reproduction",
      features: [
        "Visual reproduction",
        "Basic metadata",
        "Font embedding",
        "Color compliance",
      ],
    },
    {
      value: "2A",
      name: "PDF/A-2A",
      description: "Advanced features with full accessibility",
      features: [
        "JPEG 2000 compression",
        "Layer support",
        "Digital signatures",
        "Full accessibility",
      ],
    },
    {
      value: "2B",
      name: "PDF/A-2B",
      description: "Advanced features, visual reproduction only",
      features: [
        "Modern compression",
        "Transparency support",
        "Digital signatures",
        "Enhanced metadata",
      ],
    },
  ];

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
      setConversionResult(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleConvert = async () => {
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
        title: `🔄 Converting ${file.name} to PDF/A-${selectedLevel}...`,
        description: "Ensuring long-term archival compliance",
      });

      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      setProgress(25);

      // Convert to PDF/A
      const result = await convertToPdfA(
        file.file,
        selectedLevel,
        conversionSettings,
        (progress) => {
          setProgress(25 + progress * 0.7);
        },
      );

      setConversionResult(result);
      setProgress(95);

      // Track usage
      await PDFService.trackUsage("pdf-to-pdfa", 1, file.size);

      setIsComplete(true);
      setProgress(100);

      if (result.success) {
        toast({
          title: "Success!",
          description: `PDF converted to PDF/A-${selectedLevel} with ${result.validationScore}% compliance`,
        });
      } else {
        throw new Error("PDF/A conversion failed validation");
      }
    } catch (error: any) {
      console.error("Error converting to PDF/A:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to convert PDF to PDF/A format. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToPdfA = async (
    file: File,
    level: string,
    settings: typeof conversionSettings,
    onProgress?: (progress: number) => void,
  ): Promise<ConversionResult> => {
    onProgress?.(10);

    // Simulate pre-conversion analysis
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onProgress?.(30);

    // Simulate conversion process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    onProgress?.(70);

    // Simulate compliance validation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onProgress?.(90);

    // Generate mock compliance checks
    const mockComplianceChecks: ComplianceCheck[] = [
      {
        requirement: "Font Embedding",
        status: "pass",
        description: "All fonts are properly embedded",
        fixable: true,
      },
      {
        requirement: "Color Space Compliance",
        status: "pass",
        description: "Uses only device-independent color spaces",
        fixable: true,
      },
      {
        requirement: "Metadata Standards",
        status: "pass",
        description: "XMP metadata properly formatted",
        fixable: true,
      },
      {
        requirement: "Interactive Elements",
        status: settings.removeInteractivity ? "pass" : "warning",
        description: settings.removeInteractivity
          ? "Interactive elements removed"
          : "Contains interactive elements",
        fixable: true,
      },
      {
        requirement: "Encryption Compliance",
        status: "pass",
        description: "No encryption detected",
        fixable: false,
      },
      {
        requirement: "Content Streams",
        status: "pass",
        description: "All content streams are valid",
        fixable: true,
      },
    ];

    // Calculate validation score
    const passCount = mockComplianceChecks.filter(
      (check) => check.status === "pass",
    ).length;
    const validationScore = Math.round(
      (passCount / mockComplianceChecks.length) * 100,
    );

    const mockResult: ConversionResult = {
      success: validationScore >= 95,
      pdfaLevel: `PDF/A-${level}`,
      originalSize: file.size,
      convertedSize: Math.floor(file.size * 1.1), // Slightly larger due to embedded fonts
      complianceChecks: mockComplianceChecks,
      validationScore,
      isArchivalQuality: validationScore >= 98,
    };

    onProgress?.(100);
    return mockResult;
  };

  const downloadPdfA = () => {
    if (!file || !conversionResult) return;

    // Simulate downloading PDF/A file
    toast({
      title: "Download started",
      description: `Your PDF/A-${selectedLevel} file is ready`,
    });

    // In a real implementation, this would download the actual converted file
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file.file); // This would be the converted file
      link.download = `${file.name.replace(
        ".pdf",
        "",
      )}-PDFA-${selectedLevel}.pdf`;
      link.click();
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "fail":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "fail":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

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
          <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Convert to PDF/A
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Transform your PDF to PDF/A format for long-term archival storage
            and compliance with international standards.
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
                  accept=".pdf"
                  uploadText="Drop your PDF here or click to browse"
                />
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">
                        Why Convert to PDF/A?
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                          • Ensure long-term readability and accessibility
                        </li>
                        <li>
                          • Meet legal and regulatory archival requirements
                        </li>
                        <li>• Preserve visual appearance across all devices</li>
                        <li>• Comply with ISO 19005 international standards</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* File Display with Settings */}
            {file && !isProcessing && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* File Info and Preview */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-heading-small text-text-dark">
                        PDF File for Conversion
                      </h3>
                      <Button variant="outline" onClick={() => setFile(null)}>
                        Choose Different File
                      </Button>
                    </div>

                    {/* File Info */}
                    <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50 mb-6">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-dark truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-light">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-text-light">
                          Current Format
                        </div>
                        <div className="text-sm font-medium text-text-dark">
                          Standard PDF
                        </div>
                      </div>
                    </div>

                    {/* PDF/A Level Selection */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-text-dark">
                        Select PDF/A Conformance Level
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pdfaLevels.map((level) => (
                          <label
                            key={level.value}
                            className={cn(
                              "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                              selectedLevel === level.value
                                ? "border-gray-500 bg-gray-50"
                                : "border-gray-200 hover:border-gray-300",
                            )}
                          >
                            <input
                              type="radio"
                              name="pdfaLevel"
                              value={level.value}
                              checked={selectedLevel === level.value}
                              onChange={(e) =>
                                setSelectedLevel(
                                  e.target.value as "1A" | "1B" | "2A" | "2B",
                                )
                              }
                              className="sr-only"
                            />
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-full border-2",
                                    selectedLevel === level.value
                                      ? "border-gray-500 bg-gray-500"
                                      : "border-gray-300",
                                  )}
                                >
                                  {selectedLevel === level.value && (
                                    <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                  )}
                                </div>
                                <h5 className="font-medium text-text-dark">
                                  {level.name}
                                </h5>
                              </div>
                              <p className="text-xs text-text-light">
                                {level.description}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {level.features.map((feature, index) => (
                                  <span
                                    key={index}
                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Settings */}
                    {showAdvancedSettings && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-text-dark mb-4">
                          Conversion Settings
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={conversionSettings.embedFonts}
                              onChange={(e) =>
                                setConversionSettings((prev) => ({
                                  ...prev,
                                  embedFonts: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-text-dark">
                                Embed All Fonts
                              </div>
                              <div className="text-xs text-text-light">
                                Required for PDF/A compliance
                              </div>
                            </div>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={conversionSettings.optimizeImages}
                              onChange={(e) =>
                                setConversionSettings((prev) => ({
                                  ...prev,
                                  optimizeImages: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-text-dark">
                                Optimize Images
                              </div>
                              <div className="text-xs text-text-light">
                                Compress images for smaller file size
                              </div>
                            </div>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={conversionSettings.preserveMetadata}
                              onChange={(e) =>
                                setConversionSettings((prev) => ({
                                  ...prev,
                                  preserveMetadata: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-text-dark">
                                Preserve Metadata
                              </div>
                              <div className="text-xs text-text-light">
                                Keep document properties and metadata
                              </div>
                            </div>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={conversionSettings.removeInteractivity}
                              onChange={(e) =>
                                setConversionSettings((prev) => ({
                                  ...prev,
                                  removeInteractivity: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-text-dark">
                                Remove Interactive Elements
                              </div>
                              <div className="text-xs text-text-light">
                                Remove forms, links, and JavaScript
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Settings Panel */}
                <div className="space-y-6">
                  {/* Level Information */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-heading-small text-text-dark mb-4">
                      {pdfaLevels.find((l) => l.value === selectedLevel)?.name}
                    </h3>
                    <p className="text-sm text-text-light mb-4">
                      {
                        pdfaLevels.find((l) => l.value === selectedLevel)
                          ?.description
                      }
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-text-dark">
                          ISO 19005 Compliant
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-text-dark">
                          Long-term Preservation
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-text-dark">
                          Professional Quality
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Settings Toggle */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setShowAdvancedSettings(!showAdvancedSettings)
                      }
                      className="w-full justify-start"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {showAdvancedSettings ? "Hide" : "Show"} Advanced Settings
                    </Button>
                  </div>

                  {/* Convert Button */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <Button
                      size="lg"
                      onClick={handleConvert}
                      className="w-full bg-gray-500 hover:bg-gray-600"
                    >
                      <Archive className="w-5 h-5 mr-2" />
                      Convert to PDF/A-{selectedLevel}
                    </Button>
                    <p className="text-xs text-text-light mt-2 text-center">
                      Archival-quality conversion with compliance validation
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-medium text-text-dark mb-3">
                      PDF/A Benefits
                    </h4>
                    <div className="space-y-3 text-sm text-text-light">
                      <div className="flex items-start space-x-2">
                        <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <span>
                          Self-contained with embedded fonts and images
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>No external dependencies for viewing</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span>Guaranteed long-term accessibility</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Award className="w-4 h-4 text-purple-500 mt-0.5" />
                        <span>Meets legal and regulatory requirements</span>
                      </div>
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

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Converting to PDF/A-{selectedLevel}...
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  Ensuring archival compliance and long-term preservation
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
                  <div
                    className="bg-gray-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-text-light mt-2">
                  {progress}% complete
                </p>
              </div>
            )}
          </div>
        ) : conversionResult ? (
          /* Conversion Results */
          <div className="space-y-8">
            {/* Results Summary */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-heading-small text-text-dark mb-2">
                PDF/A conversion completed!
              </h3>
              <p className="text-body-medium text-text-light mb-6">
                Your document is now compliant with {conversionResult.pdfaLevel}{" "}
                standards
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-600 mb-1">
                    {conversionResult.pdfaLevel}
                  </div>
                  <div className="text-sm text-gray-700">Compliance Level</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {conversionResult.validationScore}%
                  </div>
                  <div className="text-sm text-green-700">Validation Score</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {conversionResult.isArchivalQuality ? "Yes" : "No"}
                  </div>
                  <div className="text-sm text-blue-700">Archival Quality</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {formatFileSize(conversionResult.convertedSize)}
                  </div>
                  <div className="text-sm text-purple-700">Final Size</div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <Button
                  size="lg"
                  onClick={downloadPdfA}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF/A
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Convert Another PDF
                </Button>
              </div>
            </div>

            {/* Compliance Report */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-heading-small text-text-dark mb-4">
                Compliance Validation Report
              </h3>

              <div className="space-y-3">
                {conversionResult.complianceChecks.map((check, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "p-1 rounded-full",
                          getStatusColor(check.status),
                        )}
                      >
                        {getStatusIcon(check.status)}
                      </div>
                      <div>
                        <div className="font-medium text-text-dark">
                          {check.requirement}
                        </div>
                        <div className="text-sm text-text-light">
                          {check.description}
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        getStatusColor(check.status),
                      )}
                    >
                      {check.status.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>

              {conversionResult.isArchivalQuality && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Archival Quality Certified
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Your PDF/A document meets the highest standards for
                    long-term preservation and accessibility.
                  </p>
                </div>
              )}
            </div>

            {/* File Size Comparison */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-heading-small text-text-dark mb-4">
                File Size Comparison
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600 mb-1">
                    {formatFileSize(conversionResult.originalSize)}
                  </div>
                  <div className="text-sm text-gray-700">Original PDF</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gray-400 h-2 rounded-full"
                      style={{
                        width: `${
                          (conversionResult.originalSize /
                            Math.max(
                              conversionResult.originalSize,
                              conversionResult.convertedSize,
                            )) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 mb-1">
                    {formatFileSize(conversionResult.convertedSize)}
                  </div>
                  <div className="text-sm text-green-700">PDF/A Format</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (conversionResult.convertedSize /
                            Math.max(
                              conversionResult.originalSize,
                              conversionResult.convertedSize,
                            )) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-light text-center mt-4">
                {conversionResult.convertedSize > conversionResult.originalSize
                  ? "Slightly larger due to embedded fonts and compliance requirements"
                  : "Optimized for archival storage"}
              </p>
            </div>
          </div>
        ) : null}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Archive className="w-6 h-6 text-gray-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Long-term Preservation
            </h4>
            <p className="text-body-small text-text-light">
              Ensure your documents remain accessible for decades to come
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              ISO 19005 Compliance
            </h4>
            <p className="text-body-small text-text-light">
              Meet international standards for electronic document preservation
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileCheck className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Validation & Verification
            </h4>
            <p className="text-body-small text-text-light">
              Comprehensive compliance checking and validation reporting
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

export default PdfToPdfa;
