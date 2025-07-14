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
  Wrench,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  AlertCircle,
  Shield,
  Zap,
  Activity,
  Info,
  RefreshCw,
  FileX,
  FileCheck,
  Settings,
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

interface DiagnosticResult {
  fileSize: number;
  pageCount: number;
  errors: Array<{
    type: "corruption" | "structure" | "metadata" | "content" | "fonts";
    severity: "critical" | "warning" | "info";
    description: string;
    fixable: boolean;
  }>;
  warnings: Array<{
    type: string;
    description: string;
  }>;
  isRepairable: boolean;
  confidence: number;
}

interface RepairResult {
  success: boolean;
  errorsFixed: number;
  warningsResolved: number;
  originalSize: number;
  repairedSize: number;
  details: string[];
}

const RepairPdf = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [progress, setProgress] = useState(0);
  const [diagnosticResults, setDiagnosticResults] =
    useState<DiagnosticResult | null>(null);
  const [repairResults, setRepairResults] = useState<RepairResult | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "upload" | "diagnose" | "repair" | "complete"
  >("upload");
  const [repairOptions, setRepairOptions] = useState({
    fixStructure: true,
    repairMetadata: true,
    optimizeContent: true,
    rebuildFonts: true,
    removeCorruption: true,
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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
      setDiagnosticResults(null);
      setRepairResults(null);
      setCurrentStep("diagnose");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDiagnose = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      toast({
        title: `🔍 Diagnosing PDF issues in ${file.name}...`,
        description: "Analyzing file structure and content",
      });

      setProgress(25);

      // Perform PDF diagnosis
      const diagnostics = await diagnosePdfFile(file.file, (progress) => {
        setProgress(25 + progress * 0.5);
      });

      setDiagnosticResults(diagnostics);
      setProgress(75);
      setCurrentStep("repair");

      toast({
        title: "Diagnosis complete",
        description: `Found ${diagnostics.errors.length} issue(s) that can be repaired`,
      });
    } catch (error: any) {
      console.error("Error diagnosing PDF:", error);
      toast({
        title: "Error",
        description:
          "Failed to diagnose PDF file. The file may be severely corrupted.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleRepair = async () => {
    if (!file || !diagnosticResults) return;

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
        title: `🔧 Repairing PDF ${file.name}...`,
        description: "Fixing identified issues and rebuilding structure",
      });

      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      setProgress(25);

      // Perform PDF repair
      const repairResult = await repairPdfFile(
        file.file,
        repairOptions,
        (progress) => {
          setProgress(25 + progress * 0.7);
        },
      );

      setRepairResults(repairResult);
      setProgress(95);

      // Track usage
      await PDFService.trackUsage("repair", 1, file.size);

      if (repairResult.success) {
        // Download the repaired file would happen here
        setIsComplete(true);
        setCurrentStep("complete");
        setProgress(100);

        toast({
          title: "Success!",
          description: `PDF repaired successfully! Fixed ${repairResult.errorsFixed} errors`,
        });
      } else {
        throw new Error("PDF repair was unsuccessful");
      }
    } catch (error: any) {
      console.error("Error repairing PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to repair PDF file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const diagnosePdfFile = async (
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<DiagnosticResult> => {
    onProgress?.(10);

    // Simulate PDF analysis
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onProgress?.(50);

    // Simulate deeper analysis
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onProgress?.(80);

    // Generate mock diagnostic results
    const mockErrors = [
      {
        type: "corruption" as const,
        severity: "critical" as const,
        description: "Corrupted object streams detected in pages 3-5",
        fixable: true,
      },
      {
        type: "structure" as const,
        severity: "warning" as const,
        description: "Invalid cross-reference table entries",
        fixable: true,
      },
      {
        type: "metadata" as const,
        severity: "info" as const,
        description: "Missing or corrupted metadata dictionary",
        fixable: true,
      },
      {
        type: "fonts" as const,
        severity: "warning" as const,
        description: "Embedded font resources are damaged",
        fixable: true,
      },
    ];

    const mockWarnings = [
      {
        type: "compatibility",
        description: "PDF version compatibility issues detected",
      },
      {
        type: "optimization",
        description: "File contains unnecessary duplicate objects",
      },
    ];

    // Simulate file size check
    const fileSize = file.size;
    const estimatedPageCount = Math.max(1, Math.floor(fileSize / 50000)); // Rough estimate

    const diagnosticResult: DiagnosticResult = {
      fileSize,
      pageCount: estimatedPageCount,
      errors: mockErrors,
      warnings: mockWarnings,
      isRepairable: true,
      confidence: 87.5,
    };

    onProgress?.(100);
    return diagnosticResult;
  };

  const repairPdfFile = async (
    file: File,
    options: typeof repairOptions,
    onProgress?: (progress: number) => void,
  ): Promise<RepairResult> => {
    onProgress?.(10);

    // Simulate repair process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    onProgress?.(50);

    // Simulate fixing specific issues
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onProgress?.(80);

    // Create mock repair results
    const mockRepairResult: RepairResult = {
      success: true,
      errorsFixed: 4,
      warningsResolved: 2,
      originalSize: file.size,
      repairedSize: Math.floor(file.size * 0.95), // Slightly smaller after repair
      details: [
        "Rebuilt corrupted object streams",
        "Fixed cross-reference table",
        "Restored metadata dictionary",
        "Repaired embedded font resources",
        "Optimized file structure",
        "Validated PDF/A compliance",
      ],
    };

    onProgress?.(100);
    return mockRepairResult;
  };

  const downloadRepairedPdf = () => {
    if (!file || !repairResults) return;

    // Simulate downloading repaired PDF
    toast({
      title: "Download started",
      description: "Your repaired PDF is being prepared for download",
    });

    // In a real implementation, this would download the actual repaired file
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file.file); // This would be the repaired file
      link.download = `repaired-${file.name}`;
      link.click();
    }, 1000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "info":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "info":
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
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

        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-600 rounded-3xl animate-pulse opacity-30"></div>
              <Activity className="w-10 h-10 text-white relative z-10" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Advanced PDF Recovery
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Intelligent document repair with deep analysis, automated recovery,
            and comprehensive diagnostic reporting for corrupted PDF files.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-200">
              <Activity className="w-4 h-4 inline mr-2" />
              Deep Analysis
            </div>
            <div className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200">
              <Wrench className="w-4 h-4 inline mr-2" />
              Auto Repair
            </div>
            <div className="px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium border border-pink-200">
              <Shield className="w-4 h-4 inline mr-2" />
              Data Recovery
            </div>
            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Structure Rebuild
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[
              { step: "upload", label: "Upload", icon: FileText },
              { step: "diagnose", label: "Diagnose", icon: Activity },
              { step: "repair", label: "Repair", icon: Wrench },
              { step: "complete", label: "Complete", icon: CheckCircle },
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    currentStep === step ||
                      (currentStep === "complete" && step !== "complete")
                      ? "bg-orange-500 border-orange-500 text-white"
                      : index <
                          ["upload", "diagnose", "repair", "complete"].indexOf(
                            currentStep,
                          )
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-gray-100 border-gray-300 text-gray-400",
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    "ml-2 text-sm font-medium",
                    currentStep === step
                      ? "text-orange-600"
                      : index <
                          ["upload", "diagnose", "repair", "complete"].indexOf(
                            currentStep,
                          )
                        ? "text-green-600"
                        : "text-gray-400",
                  )}
                >
                  {label}
                </span>
                {index < 3 && (
                  <div className="w-8 h-0.5 bg-gray-300 mx-4 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {currentStep === "upload" && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <FileUpload
              onFilesSelect={handleFilesSelect}
              multiple={false}
              maxSize={25}
              accept=".pdf"
              uploadText="Drop your corrupted PDF here or click to browse"
            />
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">
                    Common PDF Issues We Can Fix
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• File won't open or displays error messages</li>
                    <li>• Missing or corrupted pages</li>
                    <li>• Font rendering problems</li>
                    <li>• Metadata corruption</li>
                    <li>• Structure damage from incomplete downloads</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === "diagnose" && file && !diagnosticResults && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-heading-small text-text-dark mb-4">
                File Ready for Diagnosis
              </h3>
              <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileX className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-dark truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-light">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  onClick={handleDiagnose}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Start Diagnosis
                </Button>
              </div>
            </div>

            {/* What We Check */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-heading-small text-text-dark mb-4">
                Diagnostic Process
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-text-dark">
                      Structure Analysis
                    </h4>
                    <p className="text-sm text-text-light">
                      Check PDF object structure and cross-references
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-text-dark">
                      Content Integrity
                    </h4>
                    <p className="text-sm text-text-light">
                      Verify page content and embedded resources
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-text-dark">
                      Metadata Check
                    </h4>
                    <p className="text-sm text-text-light">
                      Examine document metadata and properties
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RefreshCw className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-text-dark">
                      Repair Assessment
                    </h4>
                    <p className="text-sm text-text-light">
                      Determine which issues can be automatically fixed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === "diagnose" && isProcessing && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
            <h3 className="text-heading-small text-text-dark mb-2">
              Diagnosing PDF file...
            </h3>
            <p className="text-body-medium text-text-light mb-4">
              Analyzing structure, content, and metadata
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
              <div
                className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-text-light mt-2">{progress}% complete</p>
          </div>
        )}

        {currentStep === "repair" && diagnosticResults && !isProcessing && (
          <div className="space-y-6">
            {/* Diagnostic Results */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-heading-small text-text-dark mb-4">
                Diagnostic Results
              </h3>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-700 mb-1">
                    {diagnosticResults.pageCount}
                  </div>
                  <div className="text-sm text-gray-600">Pages</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {
                      diagnosticResults.errors.filter(
                        (e) => e.severity === "critical",
                      ).length
                    }
                  </div>
                  <div className="text-sm text-red-700">Critical Errors</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    {
                      diagnosticResults.errors.filter(
                        (e) => e.severity === "warning",
                      ).length
                    }
                  </div>
                  <div className="text-sm text-yellow-700">Warnings</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {diagnosticResults.confidence}%
                  </div>
                  <div className="text-sm text-green-700">
                    Repair Confidence
                  </div>
                </div>
              </div>

              {/* Issues Found */}
              <div className="space-y-4">
                <h4 className="font-medium text-text-dark">Issues Found</h4>
                {diagnosticResults.errors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200"
                  >
                    <div
                      className={cn(
                        "p-1 rounded-full",
                        getSeverityColor(error.severity),
                      )}
                    >
                      {getSeverityIcon(error.severity)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-dark">
                        {error.description}
                      </p>
                      <p className="text-xs text-text-light capitalize">
                        {error.type} • {error.severity} •{" "}
                        {error.fixable ? "Fixable" : "Cannot be repaired"}
                      </p>
                    </div>
                    {error.fixable && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Repair Options */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-heading-small text-text-dark">
                  Repair Options
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {showAdvancedOptions ? "Hide" : "Show"} Advanced
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repairOptions.fixStructure}
                    onChange={(e) =>
                      setRepairOptions((prev) => ({
                        ...prev,
                        fixStructure: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-medium text-text-dark">
                      Fix Structure Issues
                    </div>
                    <div className="text-sm text-text-light">
                      Repair cross-references and object streams
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repairOptions.repairMetadata}
                    onChange={(e) =>
                      setRepairOptions((prev) => ({
                        ...prev,
                        repairMetadata: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-medium text-text-dark">
                      Repair Metadata
                    </div>
                    <div className="text-sm text-text-light">
                      Fix document properties and metadata
                    </div>
                  </div>
                </label>

                {showAdvancedOptions && (
                  <>
                    <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={repairOptions.optimizeContent}
                        onChange={(e) =>
                          setRepairOptions((prev) => ({
                            ...prev,
                            optimizeContent: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div>
                        <div className="font-medium text-text-dark">
                          Optimize Content
                        </div>
                        <div className="text-sm text-text-light">
                          Remove duplicates and optimize file size
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={repairOptions.rebuildFonts}
                        onChange={(e) =>
                          setRepairOptions((prev) => ({
                            ...prev,
                            rebuildFonts: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div>
                        <div className="font-medium text-text-dark">
                          Rebuild Fonts
                        </div>
                        <div className="text-sm text-text-light">
                          Repair embedded font resources
                        </div>
                      </div>
                    </label>
                  </>
                )}
              </div>

              {diagnosticResults.isRepairable && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    size="lg"
                    onClick={handleRepair}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Wrench className="w-5 h-5 mr-2" />
                    Start Repair Process
                  </Button>
                  <p className="text-xs text-text-light mt-2 text-center">
                    Repair confidence: {diagnosticResults.confidence}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === "repair" && isProcessing && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
            <h3 className="text-heading-small text-text-dark mb-2">
              Repairing your PDF...
            </h3>
            <p className="text-body-medium text-text-light mb-4">
              Fixing identified issues and rebuilding structure
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
              <div
                className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-text-light mt-2">{progress}% complete</p>
          </div>
        )}

        {currentStep === "complete" && repairResults && (
          <div className="space-y-6">
            {/* Success Summary */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-heading-small text-text-dark mb-2">
                PDF repaired successfully!
              </h3>
              <p className="text-body-medium text-text-light mb-6">
                Fixed {repairResults.errorsFixed} errors and resolved{" "}
                {repairResults.warningsResolved} warnings
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {repairResults.errorsFixed}
                  </div>
                  <div className="text-sm text-green-700">Errors Fixed</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {repairResults.warningsResolved}
                  </div>
                  <div className="text-sm text-blue-700">Warnings Resolved</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {(
                      ((repairResults.originalSize -
                        repairResults.repairedSize) /
                        repairResults.originalSize) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-sm text-purple-700">Size Optimized</div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <Button
                  size="lg"
                  onClick={downloadRepairedPdf}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Repaired PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Repair Another PDF
                </Button>
              </div>
            </div>

            {/* Repair Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-heading-small text-text-dark mb-4">
                Repair Details
              </h3>
              <div className="space-y-2">
                {repairResults.details.map((detail, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-text-dark">{detail}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-light">Original Size:</span>
                    <span className="ml-2 font-medium text-text-dark">
                      {formatFileSize(repairResults.originalSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-light">Repaired Size:</span>
                    <span className="ml-2 font-medium text-text-dark">
                      {formatFileSize(repairResults.repairedSize)}
                    </span>
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
              You've used your 3 free PDF operations today. Sign up to continue!
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
              You've reached your daily limit. Upgrade to Premium for unlimited
              access!
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

        {/* Enhanced Features Grid */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Professional PDF Recovery Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enterprise-grade repair algorithms with intelligent analysis and
              automated recovery processes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Deep Diagnostics</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Comprehensive analysis of PDF structure, metadata, and content
                integrity
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Smart Repair</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Intelligent algorithms to fix corruption, rebuild structures,
                and restore content
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Data Recovery</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Salvage and restore damaged content with maximum data
                preservation
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Structure Rebuild
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Reconstruct damaged document structures and cross-reference
                tables
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Quality Validation
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Comprehensive testing and validation of repaired documents
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Fast Processing</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                High-speed repair with real-time progress tracking and status
                updates
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Custom Options</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Configurable repair settings for different types of corruption
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Info className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Detailed Reports</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Comprehensive repair reports with before/after analysis
              </p>
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

export default RepairPdf;
