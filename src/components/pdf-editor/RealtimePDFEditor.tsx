import React, { useState, useEffect, useRef, useCallback } from "react";
import { pdfjs } from "react-pdf";
import { useRealtimePDFEditor } from "@/hooks/useRealtimePDFEditor";
import { SafePDFCanvas } from "./SafePDFCanvas";
import { safeArrayFirst, safeArrayAccess } from "@/lib/safe-array-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Eye, Edit3, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RealtimePDFEditorProps {
  file?: File;
  sessionId?: string;
  onSave?: (pdfData: ArrayBuffer) => void;
  className?: string;
}

export function RealtimePDFEditor({
  file,
  sessionId,
  onSave,
  className,
}: RealtimePDFEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF state
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time editor state
  const { state, actions, selectors, computed } =
    useRealtimePDFEditor(sessionId);

  // Canvas management
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasMethodsRef = useRef<any>(null);

  // Load PDF document
  const loadPDF = useCallback(
    async (pdfFile: File) => {
      if (!pdfFile) return;

      setIsLoading(true);
      setError(null);

      try {
        // Check if PDF.js is properly configured
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          throw new Error(
            "PDF.js worker not configured. Please refresh the page and try again.",
          );
        }

        const fileData = await pdfFile.arrayBuffer();

        // Load PDF document with error handling and version consistency
        const loadingTask = pdfjs.getDocument({
          data: fileData,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
          // Ensure we use the configured worker with correct version
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/`,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);

        toast({
          title: "PDF Loaded",
          description: `Successfully loaded PDF with ${pdf.numPages} pages`,
        });

        console.log("PDF loaded successfully:", {
          pages: pdf.numPages,
          sessionId: state.sessionId,
          collaborators: computed.collaboratorCount,
        });
      } catch (error) {
        console.error("PDF loading failed:", error);

        // Provide more specific error messages based on error type
        let errorMessage = "Unknown error occurred";
        let description =
          "Please try a different PDF file or check if it's corrupted";

        if (error instanceof Error) {
          errorMessage = error.message;

          // Handle specific PDF.js errors
          if (error.message.includes("Invalid PDF")) {
            description = "The file appears to be corrupted or not a valid PDF";
          } else if (error.message.includes("Password")) {
            description =
              "This PDF is password protected. Please unlock it first";
          } else if (error.message.includes("network")) {
            description =
              "Network error occurred. Please check your connection";
          } else if (error.message.includes("UnknownErrorException")) {
            description =
              "PDF.js worker not properly configured. Please refresh the page";
          }
        }

        setError(`Failed to load PDF: ${errorMessage}`);

        toast({
          title: "PDF Loading Failed",
          description,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [state.sessionId, computed.collaboratorCount, toast],
  );

  // Render PDF page on canvas
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDocument || !canvasReady || !canvasMethodsRef.current) return;

      try {
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });

        const canvas = canvasMethodsRef.current.getCanvas();
        const context = canvasMethodsRef.current.getContext("2d");

        if (!canvas || !context) {
          console.error("Canvas or context not available");
          return;
        }

        // Resize canvas to fit page
        canvasMethodsRef.current.handleResize(viewport.width, viewport.height);

        // Clear canvas before rendering
        canvasMethodsRef.current.clearCanvas();

        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Update canvas size in editor state
        actions.setZoom(zoom);

        console.log(
          `Page ${pageNum} rendered successfully at ${Math.round(zoom * 100)}% zoom`,
        );
      } catch (error) {
        console.error("Page rendering failed:", error);
        setError(
          `Failed to render page: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [pdfDocument, zoom, canvasReady, actions],
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = safeArrayFirst(Array.from(event.target.files || []));
      if (selectedFile && selectedFile.type === "application/pdf") {
        loadPDF(selectedFile);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a valid PDF file",
          variant: "destructive",
        });
      }
    },
    [loadPDF, toast],
  );

  // Handle canvas ready
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    setCanvasReady(true);
    // Store canvas context methods for PDF rendering
    canvasMethodsRef.current = {
      getCanvas: () => canvas,
      getContext: (type: "2d" | "webgl" = "2d") => canvas.getContext(type),
      handleResize: (width: number, height: number) => {
        canvas.width = width;
        canvas.height = height;
      },
      clearCanvas: () => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      },
    };
    console.log("Canvas ready for PDF rendering");
  }, []);

  // Handle canvas error
  const handleCanvasError = useCallback((error: Error) => {
    console.error("Canvas error:", error);
    setError(`Canvas error: ${error.message}`);
    setCanvasReady(false);
  }, []);

  // Initialize with file prop
  useEffect(() => {
    if (file) {
      loadPDF(file);
    }
  }, [file, loadPDF]);

  // Render current page when dependencies change
  useEffect(() => {
    if (pdfDocument && canvasReady) {
      renderPage(currentPage);
    }
  }, [pdfDocument, currentPage, zoom, canvasReady, renderPage]);

  // Page navigation
  const goToPage = useCallback(
    (page: number) => {
      const safePage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(safePage);
      actions.setPageIndex(safePage - 1);
    },
    [totalPages, actions],
  );

  // Zoom controls
  const handleZoom = useCallback(
    (newZoom: number) => {
      const safeZoom = Math.max(0.1, Math.min(newZoom, 5));
      setZoom(safeZoom);
      actions.setZoom(safeZoom);
    },
    [actions],
  );

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Real-time PDF Editor
              {computed.isCollaborative && (
                <Badge variant="secondary" className="ml-2">
                  <Users className="w-3 h-3 mr-1" />
                  {computed.collaboratorCount} collaborators
                </Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>

              {pdfDocument && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSave && onSave(new ArrayBuffer(0))}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>

          {pdfDocument && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Session: {state.sessionId.slice(-8)}</span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          {isLoading && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          )}

          {error && (
            <Card className="max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-red-600 mb-2">
                    <Eye className="w-8 h-8 mx-auto" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Error</h3>
                  <p className="text-gray-600 text-sm">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!pdfDocument && !isLoading && !error && (
            <Card className="max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    Upload a PDF
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Select a PDF file to start editing with real-time
                    collaboration
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    Choose PDF File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {pdfDocument && !error && (
            <SafePDFCanvas
              onCanvasReady={handleCanvasReady}
              onCanvasError={handleCanvasError}
              className="shadow-lg"
            >
              {/* Canvas methods will be passed to children via cloneElement */}
            </SafePDFCanvas>
          )}
        </div>

        {/* Sidebar - Tools and Properties */}
        {pdfDocument && (
          <Card className="w-80 rounded-none border-l border-r-0 border-t-0 border-b-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tools & Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Navigation */}
              <div>
                <h4 className="font-medium mb-2">Navigation</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Zoom */}
              <div>
                <h4 className="font-medium mb-2">Zoom</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom(zoom - 0.1)}
                  >
                    -
                  </Button>
                  <span className="text-sm min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom(zoom + 0.1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Editor Stats */}
              <div>
                <h4 className="font-medium mb-2">Editor Info</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Elements: {computed.elementCount}</div>
                  <div>Selected: {computed.selectedCount}</div>
                  <div>Collaborators: {computed.collaboratorCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}

export default RealtimePDFEditor;
