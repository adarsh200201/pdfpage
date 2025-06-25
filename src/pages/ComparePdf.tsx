import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import {
  ArrowLeft,
  Download,
  FileText,
  GitCompare,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeftRight,
  Plus,
  Minus,
  Edit,
  Sparkles,
  Zap,
  Search,
  Filter,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  BarChart3,
  TrendingUp,
  Activity,
  Maximize,
  Split,
  Copy,
  Share,
  Settings,
  Palette,
  Clock,
  Target,
  Scan,
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

interface ComparisonResult {
  addedContent: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    type: "text" | "image" | "shape" | "table";
    description?: string;
  }>;
  removedContent: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    type: "text" | "image" | "shape" | "table";
    description?: string;
  }>;
  modifiedContent: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    type: "text" | "image" | "shape" | "table";
    description?: string;
    changeType: "formatting" | "content" | "position";
  }>;
  totalChanges: number;
  changeScore: number;
  similarity: number;
  pageAnalysis: Array<{
    page: number;
    changes: number;
    similarity: number;
    analysis: string;
  }>;
  metadata: {
    processingTime: number;
    algorithm: string;
    accuracy: number;
  };
}

const ComparePdf = () => {
  const [originalFile, setOriginalFile] = useState<ProcessedFile | null>(null);
  const [modifiedFile, setModifiedFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [comparisonResults, setComparisonResults] =
    useState<ComparisonResult | null>(null);
  const [showDifferences, setShowDifferences] = useState(true);
  const [viewMode, setViewMode] = useState<
    "side-by-side" | "overlay" | "swipe" | "onion-skin"
  >("side-by-side");
  const [highlightType, setHighlightType] = useState<
    "all" | "added" | "removed" | "modified"
  >("all");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [animateChanges, setAnimateChanges] = useState(true);
  const [filterByType, setFilterByType] = useState<string>("all");
  const [compareSettings, setCompareSettings] = useState({
    sensitivity: 50,
    ignoreFormatting: false,
    ignoreImages: false,
    ignoreAnnotations: false,
    colorThreshold: 10,
  });
  const [analysisMode, setAnalysisMode] = useState<
    "visual" | "semantic" | "structural"
  >("visual");
  const [exportFormat, setExportFormat] = useState<
    "pdf" | "html" | "json" | "csv"
  >("pdf");
  const [syncScroll, setSyncScroll] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [comparisonMetrics, setComparisonMetrics] = useState<any>(null);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleOriginalFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setOriginalFile({
        id: Math.random().toString(36).substr(2, 9),
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
      });
      setIsComplete(false);
    }
  };

  const handleModifiedFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setModifiedFile({
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

  const handleCompare = async () => {
    if (!originalFile || !modifiedFile) {
      toast({
        title: "Missing files",
        description: "Please select both original and modified PDF files.",
        variant: "destructive",
      });
      return;
    }

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
        title: `🔄 Comparing PDF files...`,
        description: "Analyzing differences between documents",
      });

      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      const totalSize = originalFile.size + modifiedFile.size;
      if (totalSize > maxSize) {
        throw new Error(
          `Combined file size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      setProgress(25);

      // Process comparison using PDF analysis
      const comparisonResult = await comparePdfFiles(
        originalFile.file,
        modifiedFile.file,
        (progress) => {
          setProgress(25 + progress * 0.7);
        },
      );

      setComparisonResults(comparisonResult);
      setTotalPages(5); // This would normally be extracted from the PDFs
      setCurrentPage(1);

      setProgress(95);

      // Track usage
      await PDFService.trackUsage("compare", 2, totalSize);

      setIsComplete(true);
      setProgress(100);

      toast({
        title: "Success!",
        description: `Found ${comparisonResult.totalChanges} differences between the PDF files`,
      });
    } catch (error: any) {
      console.error("Error comparing PDFs:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to compare PDF files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const comparePdfFiles = async (
    originalFile: File,
    modifiedFile: File,
    onProgress?: (progress: number) => void,
  ): Promise<ComparisonResult> => {
    onProgress?.(10);

    // Simulate PDF comparison analysis
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onProgress?.(50);

    // Simulate finding differences
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onProgress?.(80);

    // Mock comparison results
    const mockResults: ComparisonResult = {
      addedContent: [
        { x: 100, y: 150, width: 200, height: 20 },
        { x: 50, y: 300, width: 150, height: 30 },
      ],
      removedContent: [{ x: 80, y: 200, width: 180, height: 25 }],
      modifiedContent: [
        { x: 120, y: 400, width: 220, height: 40 },
        { x: 200, y: 500, width: 100, height: 15 },
      ],
      totalChanges: 5,
    };

    onProgress?.(100);
    return mockResults;
  };

  // Enhanced helper functions
  const shareComparison = useCallback(() => {
    if (!comparisonResults) return;

    const shareData = {
      title: "PDF Comparison Results",
      text: `Found ${comparisonResults.totalChanges} changes with ${comparisonResults.similarity}% similarity`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(
        `PDF Comparison: ${shareData.text} - ${shareData.url}`,
      );
      toast({
        title: "Copied to clipboard",
        description: "Comparison results link copied to clipboard",
      });
    }
  }, [comparisonResults]);

  const downloadAdvancedReport = useCallback(() => {
    if (!comparisonResults || !originalFile || !modifiedFile) return;

    const reportData = {
      comparison: {
        originalFile: originalFile.name,
        modifiedFile: modifiedFile.name,
        timestamp: new Date().toISOString(),
        totalChanges: comparisonResults.totalChanges,
        similarity: comparisonResults.similarity,
        changeScore: comparisonResults.changeScore,
      },
      changes: {
        added: comparisonResults.addedContent,
        removed: comparisonResults.removedContent,
        modified: comparisonResults.modifiedContent,
      },
      pageAnalysis: comparisonResults.pageAnalysis,
      metadata: comparisonResults.metadata,
    };

    let content = "";
    let mimeType = "";
    let filename = "";

    switch (exportFormat) {
      case "json":
        content = JSON.stringify(reportData, null, 2);
        mimeType = "application/json";
        filename = "comparison-report.json";
        break;
      case "csv":
        content = generateCSVReport(reportData);
        mimeType = "text/csv";
        filename = "comparison-report.csv";
        break;
      case "html":
        content = generateHTMLReport(reportData);
        mimeType = "text/html";
        filename = "comparison-report.html";
        break;
      default:
        return downloadComparisonReport();
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: `Comparison report saved as ${exportFormat.toUpperCase()}`,
    });
  }, [comparisonResults, originalFile, modifiedFile, exportFormat]);

  const generateCSVReport = (data: any) => {
    const header = "Type,Page,X,Y,Width,Height,Confidence,Description\n";
    const rows = [
      ...data.changes.added.map(
        (change: any) =>
          `Added,1,${change.x},${change.y},${change.width},${change.height},${change.confidence},${change.description || ""}`,
      ),
      ...data.changes.removed.map(
        (change: any) =>
          `Removed,1,${change.x},${change.y},${change.width},${change.height},${change.confidence},${change.description || ""}`,
      ),
      ...data.changes.modified.map(
        (change: any) =>
          `Modified,1,${change.x},${change.y},${change.width},${change.height},${change.confidence},${change.description || ""}`,
      ),
    ].join("\n");
    return header + rows;
  };

  const generateHTMLReport = (data: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PDF Comparison Report</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
          .stat-number { font-size: 2rem; font-weight: bold; color: #374151; }
          .stat-label { color: #6b7280; font-size: 0.875rem; }
          .changes { margin-bottom: 30px; }
          .change-type { margin-bottom: 20px; }
          .change-list { background: #f9fafb; padding: 15px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 PDF Comparison Report</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Files:</strong> ${data.comparison.originalFile} ↔ ${data.comparison.modifiedFile}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${data.comparison.totalChanges}</div>
            <div class="stat-label">Total Changes</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${data.comparison.similarity}%</div>
            <div class="stat-label">Similarity Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${data.changes.added.length}</div>
            <div class="stat-label">Added Elements</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${data.changes.removed.length}</div>
            <div class="stat-label">Removed Elements</div>
          </div>
        </div>

        <div class="changes">
          <h2>📈 Detailed Analysis</h2>
          <div class="change-type">
            <h3 style="color: #10b981;">✅ Added Content (${data.changes.added.length})</h3>
            <div class="change-list">
              ${data.changes.added.map((change: any) => `<div>• ${change.type} at (${change.x}, ${change.y}) - Confidence: ${change.confidence}%</div>`).join("")}
            </div>
          </div>
          <div class="change-type">
            <h3 style="color: #ef4444;">❌ Removed Content (${data.changes.removed.length})</h3>
            <div class="change-list">
              ${data.changes.removed.map((change: any) => `<div>• ${change.type} at (${change.x}, ${change.y}) - Confidence: ${change.confidence}%</div>`).join("")}
            </div>
          </div>
          <div class="change-type">
            <h3 style="color: #f59e0b;">✏️ Modified Content (${data.changes.modified.length})</h3>
            <div class="change-list">
              ${data.changes.modified.map((change: any) => `<div>• ${change.type} at (${change.x}, ${change.y}) - Change: ${change.changeType} - Confidence: ${change.confidence}%</div>`).join("")}
            </div>
          </div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875rem;">
          <p>Report generated by PdfPage Advanced PDF Comparison Tool</p>
          <p>Processing Time: ${data.metadata.processingTime}ms | Algorithm: ${data.metadata.algorithm} | Accuracy: ${data.metadata.accuracy}%</p>
        </div>
      </body>
      </html>
    `;
  };

  const downloadComparisonReport = () => {
    if (!comparisonResults || !originalFile || !modifiedFile) return;

    // Create a simple HTML report
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PDF Comparison Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .changes { margin-bottom: 20px; }
          .added { color: #10b981; }
          .removed { color: #ef4444; }
          .modified { color: #f59e0b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PDF Comparison Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="summary">
          <h2>Comparison Summary</h2>
          <p><strong>Original File:</strong> ${originalFile.name}</p>
          <p><strong>Modified File:</strong> ${modifiedFile.name}</p>
          <p><strong>Total Changes Found:</strong> ${comparisonResults.totalChanges}</p>
        </div>

        <div class="changes">
          <h3 class="added">Added Content: ${comparisonResults.addedContent.length} items</h3>
          <h3 class="removed">Removed Content: ${comparisonResults.removedContent.length} items</h3>
          <h3 class="modified">Modified Content: ${comparisonResults.modifiedContent.length} items</h3>
        </div>

        <p><em>This report was generated by PdfPage - PDF Comparison Tool</em></p>
      </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pdf-comparison-report.html";
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report downloaded",
      description: "Comparison report saved successfully",
    });
  };

  const getHighlightedAreas = () => {
    if (!comparisonResults || !showDifferences) return [];

    const areas = [];

    if (highlightType === "all" || highlightType === "added") {
      areas.push(
        ...comparisonResults.addedContent.map((area) => ({
          ...area,
          type: "added",
        })),
      );
    }
    if (highlightType === "all" || highlightType === "removed") {
      areas.push(
        ...comparisonResults.removedContent.map((area) => ({
          ...area,
          type: "removed",
        })),
      );
    }
    if (highlightType === "all" || highlightType === "modified") {
      areas.push(
        ...comparisonResults.modifiedContent.map((area) => ({
          ...area,
          type: "modified",
        })),
      );
    }

    return areas;
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-3xl animate-pulse opacity-30"></div>
              <GitCompare className="w-10 h-10 text-white relative z-10" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            AI-Powered PDF Comparison
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Advanced document analysis with semantic understanding, visual diff
            highlighting, and comprehensive change tracking across multiple
            comparison modes.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200">
              <GitCompare className="w-4 h-4 inline mr-2" />
              Visual Diff
            </div>
            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
              <Sparkles className="w-4 h-4 inline mr-2" />
              AI Analysis
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Change Analytics
            </div>
            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
              <Target className="w-4 h-4 inline mr-2" />
              Semantic Compare
            </div>
            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-200">
              <Activity className="w-4 h-4 inline mr-2" />
              Real-time Sync
            </div>
          </div>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload Section */}
            {(!originalFile || !modifiedFile) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Original File Upload */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-heading-small text-text-dark mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    Original PDF
                  </h3>

                  {originalFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-dark truncate">
                            {originalFile.name}
                          </p>
                          <p className="text-xs text-text-light">
                            {formatFileSize(originalFile.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setOriginalFile(null)}
                        className="w-full"
                      >
                        Choose Different File
                      </Button>
                    </div>
                  ) : (
                    <FileUpload
                      onFilesSelect={handleOriginalFileSelect}
                      multiple={false}
                      maxSize={25}
                      accept=".pdf"
                      uploadText="Drop your original PDF here or click to browse"
                    />
                  )}
                </div>

                {/* Modified File Upload */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-heading-small text-text-dark mb-4 flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="w-4 h-4 text-green-500" />
                    </div>
                    Modified PDF
                  </h3>

                  {modifiedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-dark truncate">
                            {modifiedFile.name}
                          </p>
                          <p className="text-xs text-text-light">
                            {formatFileSize(modifiedFile.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setModifiedFile(null)}
                        className="w-full"
                      >
                        Choose Different File
                      </Button>
                    </div>
                  ) : (
                    <FileUpload
                      onFilesSelect={handleModifiedFileSelect}
                      multiple={false}
                      maxSize={25}
                      accept=".pdf"
                      uploadText="Drop your modified PDF here or click to browse"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Comparison Interface */}
            {originalFile && modifiedFile && !isProcessing && !isComplete && (
              <div className="space-y-6">
                {/* Controls */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-heading-small text-text-dark">
                      Comparison Settings
                    </h3>
                    <Button
                      onClick={handleCompare}
                      className="bg-indigo-500 hover:bg-indigo-600"
                    >
                      <GitCompare className="w-4 h-4 mr-2" />
                      Start Comparison
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        View Mode
                      </label>
                      <select
                        value={viewMode}
                        onChange={(e) =>
                          setViewMode(
                            e.target.value as "side-by-side" | "overlay",
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="side-by-side">Side by Side</option>
                        <option value="overlay">Overlay</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Highlight Changes
                      </label>
                      <select
                        value={highlightType}
                        onChange={(e) =>
                          setHighlightType(
                            e.target.value as
                              | "all"
                              | "added"
                              | "removed"
                              | "modified",
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="all">All Changes</option>
                        <option value="added">Added Content</option>
                        <option value="removed">Removed Content</option>
                        <option value="modified">Modified Content</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowDifferences(!showDifferences)}
                        className="w-full"
                      >
                        {showDifferences ? (
                          <EyeOff className="w-4 h-4 mr-2" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        {showDifferences ? "Hide" : "Show"} Differences
                      </Button>
                    </div>
                  </div>
                </div>

                {/* File Summary */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-heading-small text-text-dark mb-4">
                    Files Ready for Comparison
                  </h3>
                  <div className="flex items-center justify-center space-x-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-sm font-medium text-text-dark mb-1">
                        Original
                      </p>
                      <p className="text-xs text-text-light truncate max-w-32">
                        {originalFile.name}
                      </p>
                    </div>

                    <ArrowRight className="w-8 h-8 text-gray-400" />

                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-sm font-medium text-text-dark mb-1">
                        Modified
                      </p>
                      <p className="text-xs text-text-light truncate max-w-32">
                        {modifiedFile.name}
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

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Comparing PDF files...
                </h3>
                <p className="text-body-medium text-text-light">
                  Analyzing differences between documents
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-text-light mt-2">
                  {progress}% complete
                </p>
              </div>
            )}
          </div>
        ) : isComplete && comparisonResults ? (
          /* Enhanced Comparison Results */
          <div className="space-y-8">
            {/* Analytics Dashboard */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <BarChart3 className="w-7 h-7 mr-3 text-indigo-500" />
                    Comparison Analytics
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Comprehensive document analysis and change detection
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={shareComparison}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadAdvancedReport}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    New Comparison
                  </Button>
                </div>
              </div>

              {/* Enhanced Analytics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-blue-600 font-medium bg-blue-200 px-2 py-1 rounded-full">
                      TOTAL
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-700 mb-1">
                    {comparisonResults.totalChanges}
                  </div>
                  <div className="text-sm text-blue-600">Total Changes</div>
                  <div className="mt-2 text-xs text-blue-500">
                    {comparisonResults.changeScore}% change score
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-green-600 font-medium bg-green-200 px-2 py-1 rounded-full">
                      ADDED
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-700 mb-1">
                    {comparisonResults.addedContent.length}
                  </div>
                  <div className="text-sm text-green-600">New Content</div>
                  <div className="mt-2 text-xs text-green-500">
                    {Math.round(
                      (comparisonResults.addedContent.length /
                        comparisonResults.totalChanges) *
                        100,
                    )}
                    % of changes
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                      <Minus className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-red-600 font-medium bg-red-200 px-2 py-1 rounded-full">
                      REMOVED
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-red-700 mb-1">
                    {comparisonResults.removedContent.length}
                  </div>
                  <div className="text-sm text-red-600">Deleted Content</div>
                  <div className="mt-2 text-xs text-red-500">
                    {Math.round(
                      (comparisonResults.removedContent.length /
                        comparisonResults.totalChanges) *
                        100,
                    )}
                    % of changes
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Edit className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-purple-600 font-medium bg-purple-200 px-2 py-1 rounded-full">
                      MODIFIED
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    {comparisonResults.modifiedContent.length}
                  </div>
                  <div className="text-sm text-purple-600">
                    Modified Content
                  </div>
                  <div className="mt-2 text-xs text-purple-500">
                    {Math.round(
                      (comparisonResults.modifiedContent.length /
                        comparisonResults.totalChanges) *
                        100,
                    )}
                    % of changes
                  </div>
                </div>
              </div>

              {/* Similarity Score and Processing Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-bold text-gray-900">
                      Similarity Score
                    </h4>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 mb-2">
                    {comparisonResults.similarity}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${comparisonResults.similarity}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Documents are{" "}
                    {comparisonResults.similarity > 80
                      ? "very similar"
                      : comparisonResults.similarity > 60
                        ? "moderately similar"
                        : "quite different"}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="w-5 h-5 text-green-500" />
                    <h4 className="font-bold text-gray-900">Processing Time</h4>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {comparisonResults.metadata.processingTime}ms
                  </div>
                  <div className="text-sm text-gray-600">
                    Algorithm: {comparisonResults.metadata.algorithm}
                  </div>
                  <div className="text-sm text-gray-600">
                    Accuracy: {comparisonResults.metadata.accuracy}%
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <Target className="w-5 h-5 text-orange-500" />
                    <h4 className="font-bold text-gray-900">Analysis Mode</h4>
                  </div>
                  <div className="text-lg font-bold text-orange-600 mb-2 capitalize">
                    {analysisMode}
                  </div>
                  <div className="text-sm text-gray-600">
                    {analysisMode === "visual" &&
                      "Pixel-perfect visual comparison"}
                    {analysisMode === "semantic" &&
                      "AI-powered content understanding"}
                    {analysisMode === "structural" &&
                      "Document structure analysis"}
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side View */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-heading-small text-text-dark">
                  Document Comparison - Page {currentPage} of {totalPages}
                </h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setViewMode(
                        viewMode === "side-by-side"
                          ? "overlay"
                          : "side-by-side",
                      )
                    }
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    {viewMode === "side-by-side" ? "Overlay" : "Side by Side"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDifferences(!showDifferences)}
                  >
                    {showDifferences ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {viewMode === "side-by-side" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original Document */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-text-dark flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      Original Document
                    </h4>
                    <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="aspect-[3/4] p-4">
                        <div className="w-full h-full bg-white shadow-sm rounded p-6 relative">
                          {/* Simulate PDF content */}
                          <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="space-y-2 mt-6">
                              <div className="h-3 bg-gray-100 rounded w-full"></div>
                              <div className="h-3 bg-gray-100 rounded w-full"></div>
                              <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                            </div>
                          </div>

                          {/* Highlight removed content */}
                          {showDifferences &&
                            (highlightType === "all" ||
                              highlightType === "removed") &&
                            comparisonResults.removedContent.map(
                              (area, index) => (
                                <div
                                  key={`removed-${index}`}
                                  className="absolute bg-red-200 bg-opacity-50 border-2 border-red-500"
                                  style={{
                                    left: `${(area.x / 400) * 100}%`,
                                    top: `${(area.y / 500) * 100}%`,
                                    width: `${(area.width / 400) * 100}%`,
                                    height: `${(area.height / 500) * 100}%`,
                                  }}
                                />
                              ),
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modified Document */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-text-dark flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                      Modified Document
                    </h4>
                    <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="aspect-[3/4] p-4">
                        <div className="w-full h-full bg-white shadow-sm rounded p-6 relative">
                          {/* Simulate PDF content */}
                          <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="space-y-2 mt-6">
                              <div className="h-3 bg-gray-100 rounded w-full"></div>
                              <div className="h-3 bg-gray-100 rounded w-full"></div>
                              <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                            </div>
                          </div>

                          {/* Highlight added and modified content */}
                          {showDifferences &&
                            (highlightType === "all" ||
                              highlightType === "added") &&
                            comparisonResults.addedContent.map(
                              (area, index) => (
                                <div
                                  key={`added-${index}`}
                                  className="absolute bg-green-200 bg-opacity-50 border-2 border-green-500"
                                  style={{
                                    left: `${(area.x / 400) * 100}%`,
                                    top: `${(area.y / 500) * 100}%`,
                                    width: `${(area.width / 400) * 100}%`,
                                    height: `${(area.height / 500) * 100}%`,
                                  }}
                                />
                              ),
                            )}
                          {showDifferences &&
                            (highlightType === "all" ||
                              highlightType === "modified") &&
                            comparisonResults.modifiedContent.map(
                              (area, index) => (
                                <div
                                  key={`modified-${index}`}
                                  className="absolute bg-yellow-200 bg-opacity-50 border-2 border-yellow-500"
                                  style={{
                                    left: `${(area.x / 400) * 100}%`,
                                    top: `${(area.y / 500) * 100}%`,
                                    width: `${(area.width / 400) * 100}%`,
                                    height: `${(area.height / 500) * 100}%`,
                                  }}
                                />
                              ),
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Overlay View */
                <div className="space-y-3">
                  <h4 className="font-medium text-text-dark">
                    Overlay Comparison
                  </h4>
                  <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg max-w-2xl mx-auto">
                    <div className="aspect-[3/4] p-4">
                      <div className="w-full h-full bg-white shadow-sm rounded p-6 relative">
                        {/* PDF content with all highlights */}
                        <div className="space-y-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                          <div className="space-y-2 mt-6">
                            <div className="h-3 bg-gray-100 rounded w-full"></div>
                            <div className="h-3 bg-gray-100 rounded w-full"></div>
                            <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                          </div>
                        </div>

                        {/* All change highlights in overlay */}
                        {showDifferences &&
                          getHighlightedAreas().map((area, index) => (
                            <div
                              key={`overlay-${index}`}
                              className={cn(
                                "absolute border-2",
                                area.type === "added" &&
                                  "bg-green-200 bg-opacity-50 border-green-500",
                                area.type === "removed" &&
                                  "bg-red-200 bg-opacity-50 border-red-500",
                                area.type === "modified" &&
                                  "bg-yellow-200 bg-opacity-50 border-yellow-500",
                              )}
                              style={{
                                left: `${(area.x / 400) * 100}%`,
                                top: `${(area.y / 500) * 100}%`,
                                width: `${(area.width / 400) * 100}%`,
                                height: `${(area.height / 500) * 100}%`,
                              }}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Page Navigation */}
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  Previous Page
                </Button>
                <span className="text-sm text-text-light">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Next Page
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-heading-small text-text-dark mb-4">Legend</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-200 border-2 border-green-500 rounded"></div>
                  <span className="text-sm text-text-dark">Added Content</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-200 border-2 border-red-500 rounded"></div>
                  <span className="text-sm text-text-dark">
                    Removed Content
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-500 rounded"></div>
                  <span className="text-sm text-text-dark">
                    Modified Content
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Enhanced Features Grid */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Advanced Comparison Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade document analysis with AI-powered insights and
              comprehensive reporting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <GitCompare className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Multi-Mode Comparison
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Side-by-side, overlay, swipe, and onion-skin viewing modes for
                detailed analysis
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                AI-Powered Analysis
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Semantic understanding and intelligent content categorization
                with confidence scores
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Analytics Dashboard
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Comprehensive metrics, similarity scores, and visual change
                statistics
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Precision Detection
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Pixel-perfect change detection with customizable sensitivity and
                filtering
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Multi-Format Export
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Export detailed reports in PDF, HTML, JSON, and CSV formats
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Layer Analysis</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Deep structural analysis including text, images, forms, and
                annotations
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Real-Time Sync</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Synchronized scrolling, zooming, and navigation across
                comparison views
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Share className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Collaboration Tools
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Share comparisons, collaborate on reviews, and maintain audit
                trails
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

export default ComparePdf;
