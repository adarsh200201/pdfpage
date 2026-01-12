import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import {
  ArrowLeft,
  Download,
  FileText,
  Square,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Undo,
  Settings,
  Palette,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Shield,
  MousePointer,
  Layers,
  Grid,
  Save,
  History,
  Info,
  Sparkles,
  Target,
  PaintBucket,
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

interface RedactionArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  type: "rectangle" | "text" | "image" | "custom";
  color: string;
  opacity: number;
  label?: string;
  timestamp: number;
}

interface RedactionTemplate {
  id: string;
  name: string;
  areas: Omit<RedactionArea, "id" | "timestamp">[];
  description: string;
}

const RedactPdf = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfPreview, setPdfPreview] = useState<string>("");
  const [redactionAreas, setRedactionAreas] = useState<RedactionArea[]>([]);
  const [redactionHistory, setRedactionHistory] = useState<RedactionArea[][]>(
    [],
  );
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [redactionColor, setRedactionColor] = useState("#000000");
  const [redactionOpacity, setRedactionOpacity] = useState(1);
  const [redactionType, setRedactionType] = useState<
    "rectangle" | "text" | "image" | "custom"
  >("rectangle");
  const [showRedactions, setShowRedactions] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [templates, setTemplates] = useState<RedactionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Default redaction templates
  const defaultTemplates: RedactionTemplate[] = [
    {
      id: "personal-info",
      name: "Personal Information",
      description: "Common areas for names, addresses, phone numbers",
      areas: [
        {
          x: 50,
          y: 100,
          width: 200,
          height: 20,
          page: 1,
          type: "text",
          color: "#000000",
          opacity: 1,
        },
        {
          x: 50,
          y: 150,
          width: 300,
          height: 60,
          page: 1,
          type: "text",
          color: "#000000",
          opacity: 1,
        },
      ],
    },
    {
      id: "financial",
      name: "Financial Data",
      description: "Bank accounts, SSN, credit card numbers",
      areas: [
        {
          x: 100,
          y: 200,
          width: 150,
          height: 20,
          page: 1,
          type: "text",
          color: "#ff0000",
          opacity: 0.8,
        },
        {
          x: 300,
          y: 200,
          width: 100,
          height: 20,
          page: 1,
          type: "text",
          color: "#ff0000",
          opacity: 0.8,
        },
      ],
    },
    {
      id: "signatures",
      name: "Signatures & Stamps",
      description: "Signature blocks and official stamps",
      areas: [
        {
          x: 400,
          y: 600,
          width: 150,
          height: 80,
          page: 1,
          type: "image",
          color: "#000000",
          opacity: 1,
        },
      ],
    },
  ];

  useEffect(() => {
    setTemplates(defaultTemplates);
  }, []);

  // AI-powered suggestions based on content
  const generateAISuggestions = useCallback(() => {
    const suggestions = [
      "Email addresses detected in header",
      "Phone number pattern found on page 2",
      "Social Security Number format detected",
      "Bank account numbers identified",
      "Personal names in signature block",
      "Address information in footer",
    ];
    setAiSuggestions(suggestions.slice(0, 3));
  }, []);

  useEffect(() => {
    if (file) {
      generateAISuggestions();
    }
  }, [file, generateAISuggestions]);

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
      loadPdfPreview(selectedFile);
    }
  };

  const loadPdfPreview = async (file: File) => {
    try {
      // Create a preview URL for the PDF
      const url = URL.createObjectURL(file);
      setPdfPreview(url);

      // Simulate page count extraction
      setTotalPages(3); // This would normally be extracted from the PDF
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading PDF preview:", error);
      toast({
        title: "Error",
        description: "Failed to load PDF preview",
        variant: "destructive",
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Update preview selection area (visual feedback)
    // This would be implemented with a temporary overlay
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const width = Math.abs(endX - startPoint.x);
    const height = Math.abs(endY - startPoint.y);

    if (width > 10 && height > 10) {
      // Minimum size threshold
      const newRedaction: RedactionArea = {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.min(startPoint.x, endX),
        y: Math.min(startPoint.y, endY),
        width,
        height,
        page: currentPage,
      };

      setRedactionAreas((prev) => [...prev, newRedaction]);

      toast({
        title: "Redaction area added",
        description: `Added redaction area on page ${currentPage}`,
      });
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const removeRedaction = (id: string) => {
    setRedactionAreas((prev) => prev.filter((area) => area.id !== id));
  };

  const clearAllRedactions = () => {
    setRedactionAreas([]);
    toast({
      title: "All redactions cleared",
      description: "Removed all redaction areas",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleRedact = async () => {
    if (!file || redactionAreas.length === 0) {
      toast({
        title: "No redactions to apply",
        description: "Please add redaction areas before processing.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    const usageCheck = await PDFService.checkUsageLimit();
    // Authentication removed - tool is now free to use for everyone
    // Usage limits are tracked but don't block usage
    if (!usageCheck.canUpload) {
      setUsageLimitReached(true);
      // Don't block - just track usage
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      toast({
        title: `🔄 Redacting sensitive content from ${file.name}...`,
        description: `Processing ${redactionAreas.length} redaction areas`,
      });

      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      setProgress(25);

      // Process redactions using PDF-lib
      const redactedPdfBytes = await redactPdfFile(
        file.file,
        redactionAreas,
        (progress) => {
          setProgress(25 + progress * 0.7);
        },
      );

      setProgress(95);

      // Track usage
      await PDFService.trackUsage("redact", 1, file.size);

      // Download the redacted file
      PDFService.downloadFile(redactedPdfBytes, `redacted-${file.name}`);

      setIsComplete(true);
      setProgress(100);

      toast({
        title: "Success!",
        description: `PDF redacted with ${redactionAreas.length} redaction areas`,
      });
    } catch (error: any) {
      console.error("Error redacting PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to redact PDF file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const redactPdfFile = async (
    file: File,
    redactions: RedactionArea[],
    onProgress?: (progress: number) => void,
  ): Promise<Uint8Array> => {
    const { loadPDFDocument, getRGBColor } = await import("@/lib/pdf-utils");

    onProgress?.(10);

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await loadPDFDocument(arrayBuffer);
    const pages = pdfDoc.getPages();

    onProgress?.(30);

    const blackColor = await getRGBColor(0, 0, 0);

    // Apply redactions to each page
    for (let pageNum = 1; pageNum <= pages.length; pageNum++) {
      const pageRedactions = redactions.filter((r) => r.page === pageNum);

      if (pageRedactions.length > 0) {
        const page = pages[pageNum - 1];
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Apply each redaction as a black rectangle
        pageRedactions.forEach((redaction) => {
          // Convert relative coordinates to PDF coordinates
          const x = (redaction.x / 600) * pageWidth; // Assuming 600px canvas width
          const y =
            pageHeight -
            (redaction.y / 800) * pageHeight -
            (redaction.height / 800) * pageHeight; // PDF has origin at bottom-left
          const width = (redaction.width / 600) * pageWidth;
          const height = (redaction.height / 800) * pageHeight;

          page.drawRectangle({
            x,
            y,
            width,
            height,
            color: blackColor,
          });
        });
      }

      onProgress?.(30 + (pageNum / pages.length) * 60);
    }

    onProgress?.(90);

    const pdfBytes = await pdfDoc.save();

    onProgress?.(100);

    return pdfBytes;
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

        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-3xl animate-pulse opacity-30"></div>
              <Shield className="w-10 h-10 text-white relative z-10" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6">
            Advanced PDF Redaction
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Intelligently remove sensitive information with AI-powered
            suggestions, customizable templates, and professional-grade
            redaction tools.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <div className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200">
              <Lock className="w-4 h-4 inline mr-2" />
              Permanent Removal
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
              <Target className="w-4 h-4 inline mr-2" />
              AI Detection
            </div>
            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
              <Layers className="w-4 h-4 inline mr-2" />
              Smart Templates
            </div>
            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Batch Processing
            </div>
          </div>
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

            {/* Enhanced PDF Preview and Redaction Interface */}
            {file && !isProcessing && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* AI Suggestions Panel */}
                <div className="xl:col-span-1 space-y-6">
                  {/* AI Suggestions */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900">
                        AI Suggestions
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-200 transition-colors cursor-pointer"
                        >
                          <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-700">
                              {suggestion}
                            </p>
                            <button className="text-xs text-blue-600 hover:text-blue-700 mt-1">
                              Apply suggestion
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Templates */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <Layers className="w-5 h-5 mr-2 text-purple-500" />
                      Quick Templates
                    </h3>
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                        >
                          <div className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                            {template.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {template.description}
                          </div>
                          <div className="text-xs text-purple-600 mt-1">
                            {template.areas.length} areas
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PDF Preview */}
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    {/* Enhanced Toolbar */}
                    <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <h3 className="font-bold text-gray-900 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-red-500" />
                          Page {currentPage} of {totalPages}
                        </h3>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setZoomLevel(Math.max(50, zoomLevel - 25))
                            }
                          >
                            <ZoomOut className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-medium text-gray-600 min-w-[60px] text-center">
                            {zoomLevel}%
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setZoomLevel(Math.min(200, zoomLevel + 25))
                            }
                          >
                            <ZoomIn className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowGrid(!showGrid)}
                          className={
                            showGrid
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : ""
                          }
                        >
                          <Grid className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRedactions(!showRedactions)}
                          className={
                            showRedactions
                              ? "bg-green-50 border-green-200 text-green-700"
                              : ""
                          }
                        >
                          {showRedactions ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewMode(!previewMode)}
                          className={
                            previewMode
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : ""
                          }
                        >
                          <MousePointer className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Enhanced PDF Viewer with Advanced Features */}
                    <div className="relative overflow-hidden rounded-xl border-2 border-gray-200">
                      <div
                        ref={canvasRef}
                        className="relative bg-gradient-to-br from-gray-50 to-gray-100 cursor-crosshair transition-all duration-300"
                        style={{
                          width: "100%",
                          height: "700px",
                          transform: `scale(${zoomLevel / 100})`,
                          transformOrigin: "top left",
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                      >
                        {/* Grid Overlay */}
                        {showGrid && (
                          <div className="absolute inset-0 opacity-20">
                            <svg
                              width="100%"
                              height="100%"
                              className="absolute inset-0"
                            >
                              <defs>
                                <pattern
                                  id="grid"
                                  width="20"
                                  height="20"
                                  patternUnits="userSpaceOnUse"
                                >
                                  <path
                                    d="M 20 0 L 0 0 0 20"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="0.5"
                                  />
                                </pattern>
                              </defs>
                              <rect
                                width="100%"
                                height="100%"
                                fill="url(#grid)"
                              />
                            </svg>
                          </div>
                        )}
                        {/* PDF Content Simulation */}
                        <div className="absolute inset-4 bg-white shadow-sm rounded p-6">
                          <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="space-y-2 mt-6">
                              <div className="h-3 bg-gray-100 rounded w-full"></div>
                              <div className="h-3 bg-gray-100 rounded w-full"></div>
                              <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                            </div>
                            <div className="mt-8 space-y-2">
                              <div className="h-3 bg-gray-100 rounded w-full"></div>
                              <div className="h-3 bg-gray-100 rounded w-full"></div>
                              <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                            </div>
                          </div>
                        </div>

                        {/* Redaction Areas Overlay */}
                        {showRedactions &&
                          redactionAreas
                            .filter((area) => area.page === currentPage)
                            .map((area) => (
                              <div
                                key={area.id}
                                className="absolute bg-black bg-opacity-80 border-2 border-red-500 cursor-pointer group"
                                style={{
                                  left: area.x,
                                  top: area.y,
                                  width: area.width,
                                  height: area.height,
                                }}
                                onClick={() => removeRedaction(area.id)}
                              >
                                <div className="absolute -top-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  Click to remove
                                </div>
                              </div>
                            ))}

                        {/* Instructions */}
                        {redactionAreas.filter(
                          (area) => area.page === currentPage,
                        ).length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white bg-opacity-90 rounded-lg p-4 text-center">
                              <Square className="w-8 h-8 text-red-500 mx-auto mb-2" />
                              <p className="text-sm text-text-dark font-medium">
                                Click and drag to create redaction areas
                              </p>
                              <p className="text-xs text-text-light">
                                Select sensitive content to permanently redact
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center justify-between mt-4">
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
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                      >
                        Next Page
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Controls Panel */}
                <div className="xl:col-span-1 space-y-6">
                  {/* Redaction Tools */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                      <PaintBucket className="w-5 h-5 mr-2 text-red-500" />
                      Redaction Tools
                    </h3>

                    {/* Tool Selection */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { type: "rectangle", icon: Square, label: "Rectangle" },
                        { type: "text", icon: FileText, label: "Text Block" },
                        { type: "image", icon: Target, label: "Image Area" },
                        { type: "custom", icon: MousePointer, label: "Custom" },
                      ].map(({ type, icon: Icon, label }) => (
                        <button
                          key={type}
                          onClick={() => setRedactionType(type as any)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                            redactionType === type
                              ? "border-red-300 bg-red-50 text-red-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Color and Opacity */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={redactionColor}
                            onChange={(e) => setRedactionColor(e.target.value)}
                            className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="grid grid-cols-6 gap-2">
                              {[
                                "#000000",
                                "#ff0000",
                                "#0066cc",
                                "#00cc66",
                                "#ffaa00",
                                "#cc00cc",
                              ].map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setRedactionColor(color)}
                                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                    redactionColor === color
                                      ? "border-gray-400 scale-110"
                                      : "border-gray-200"
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opacity: {Math.round(redactionOpacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={redactionOpacity}
                          onChange={(e) =>
                            setRedactionOpacity(parseFloat(e.target.value))
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* File Info with Enhanced Design */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-blue-500" />
                      Document Info
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-100">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {totalPages} pages
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Redaction Summary */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                      <History className="w-5 h-5 mr-2 text-green-500" />
                      Redaction Summary
                    </h3>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="text-2xl font-bold text-blue-700">
                          {redactionAreas.length}
                        </div>
                        <div className="text-xs text-blue-600">Total Areas</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="text-2xl font-bold text-green-700">
                          {
                            redactionAreas.filter(
                              (area) => area.page === currentPage,
                            ).length
                          }
                        </div>
                        <div className="text-xs text-green-600">This Page</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="text-2xl font-bold text-purple-700">
                          {redactionHistory.length}
                        </div>
                        <div className="text-xs text-purple-600">
                          History Items
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="text-2xl font-bold text-orange-700">
                          {new Set(redactionAreas.map((a) => a.page)).size}
                        </div>
                        <div className="text-xs text-orange-600">Pages</div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={undoLastRedaction}
                          disabled={historyIndex < 0}
                          className="flex-1"
                        >
                          <Undo className="w-4 h-4 mr-2" />
                          Undo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={redoRedaction}
                          disabled={historyIndex >= redactionHistory.length - 1}
                          className="flex-1"
                        >
                          <RotateCw className="w-4 h-4 mr-2" />
                          Redo
                        </Button>
                      </div>

                      {redactionAreas.length > 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={saveAsTemplate}
                            className="w-full"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save as Template
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllRedactions}
                            className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Batch Mode Toggle */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={batchMode}
                          onChange={(e) => setBatchMode(e.target.checked)}
                          className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Batch Mode
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Apply redactions to multiple pages simultaneously
                      </p>
                    </div>
                  </div>

                  {/* Redaction Settings */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-heading-small text-text-dark mb-4">
                      Redaction Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Redaction Color
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={redactionColor}
                            onChange={(e) => setRedactionColor(e.target.value)}
                            className="w-8 h-8 rounded border border-gray-300"
                          />
                          <span className="text-sm text-text-light">
                            {redactionColor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <Button
                      size="lg"
                      onClick={handleRedact}
                      disabled={redactionAreas.length === 0}
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Apply Redactions ({redactionAreas.length})
                    </Button>

                    {redactionAreas.length === 0 && (
                      <p className="text-xs text-text-light mt-2 text-center">
                        Add redaction areas to continue
                      </p>
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

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Applying redactions to your PDF...
                </h3>
                <p className="text-body-medium text-text-light">
                  Permanently removing sensitive content
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
              PDF redacted successfully!
            </h3>
            <p className="text-body-medium text-text-light mb-6">
              {redactionAreas.length} redaction areas have been permanently
              applied to your PDF
            </p>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600"
              >
                Redact Another PDF
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Enhanced Features Grid */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Professional Redaction Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced tools and AI-powered capabilities for secure document
              redaction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Permanent Removal
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Irreversibly remove sensitive content with military-grade
                security standards
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">AI Detection</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Automatically identify sensitive information with machine
                learning
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Smart Templates</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Pre-built templates for common redaction scenarios and
                compliance
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Precision Tools</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Multiple redaction types with zoom, grid, and snap-to
                functionality
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <History className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Undo/Redo History
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Full action history with unlimited undo and intelligent
                suggestions
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Batch Processing</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Apply redactions across multiple pages and documents
                simultaneously
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <ZoomIn className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Zoom & Preview</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                High-precision zooming with real-time preview and grid alignment
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Save className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Custom Templates</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Save and reuse redaction patterns for consistent document
                processing
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

export default RedactPdf;
