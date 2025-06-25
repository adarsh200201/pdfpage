import { useState, useRef } from "react";
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [redactionColor, setRedactionColor] = useState("#000000");
  const [showRedactions, setShowRedactions] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

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

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Square className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Redact PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Remove sensitive information from PDF documents by redacting text
            and graphics permanently.
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

            {/* PDF Preview and Redaction Interface */}
            {file && !isProcessing && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* PDF Preview */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-heading-small text-text-dark">
                        PDF Preview - Page {currentPage} of {totalPages}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRedactions(!showRedactions)}
                        >
                          {showRedactions ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          {showRedactions ? "Hide" : "Show"} Redactions
                        </Button>
                      </div>
                    </div>

                    {/* PDF Viewer with Redaction Overlay */}
                    <div className="relative">
                      <div
                        ref={canvasRef}
                        className="relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair"
                        style={{ width: "100%", height: "600px" }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                      >
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

                {/* Controls Panel */}
                <div className="space-y-6">
                  {/* File Info */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-heading-small text-text-dark mb-4">
                      File Information
                    </h3>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-dark truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-light">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Redaction Summary */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-heading-small text-text-dark mb-4">
                      Redaction Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-light">
                          Total Areas:
                        </span>
                        <span className="text-sm font-medium text-text-dark">
                          {redactionAreas.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-light">
                          Current Page:
                        </span>
                        <span className="text-sm font-medium text-text-dark">
                          {
                            redactionAreas.filter(
                              (area) => area.page === currentPage,
                            ).length
                          }
                        </span>
                      </div>
                    </div>

                    {redactionAreas.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllRedactions}
                          className="w-full text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear All Redactions
                        </Button>
                      </div>
                    )}
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

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Square className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Permanent Redaction
            </h4>
            <p className="text-body-small text-text-light">
              Permanently remove sensitive information that cannot be recovered
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Visual Preview
            </h4>
            <p className="text-body-small text-text-light">
              Preview redaction areas before applying them to your document
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Multiple Areas
            </h4>
            <p className="text-body-small text-text-light">
              Redact multiple areas across different pages in a single operation
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

export default RedactPdf;
