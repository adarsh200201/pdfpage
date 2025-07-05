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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Users,
  Eye,
  Edit3,
  Download,
  Upload,
  Type,
  Square,
  Circle,
  Image,
  MousePointer,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Save,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFService } from "@/services/pdfService";

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

  // Edit session state
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  // Editing tools state
  const [activeTool, setActiveTool] = useState<
    "select" | "text" | "rectangle" | "circle" | "image"
  >("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<
    Array<{
      id: string;
      type: string;
      pageIndex: number;
      x: number;
      y: number;
      width?: number;
      height?: number;
      text?: string;
      fontSize?: number;
      color?: { r: number; g: number; b: number };
    }>
  >([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [fontSize, setFontSize] = useState(12);
  const [editHistory, setEditHistory] = useState<Array<any>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Real-time editor state
  const { state, actions, selectors, computed } =
    useRealtimePDFEditor(sessionId);

  // Canvas management
  const [canvasReady, setCanvasReady] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const canvasMethodsRef = useRef<any>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Create edit session
  const createEditSession = useCallback(
    async (pdfFile: File) => {
      // Prevent duplicate session creation
      if (editSessionId || isCreatingSession) {
        console.log("Edit session already exists or is being created");
        return;
      }

      setIsCreatingSession(true);
      setError(null);

      try {
        const sessionData = await PDFService.createEditSession(pdfFile, {
          collaborative: true,
          onProgress: setSaveProgress,
        });

        setEditSessionId(sessionData.sessionId);
        setTotalPages(sessionData.pageCount);

        toast({
          title: "Edit Session Created",
          description: `Ready to edit PDF with ${sessionData.pageCount} pages`,
        });

        console.log("Edit session created:", sessionData);

        // Now load the PDF for rendering
        await loadPDF(pdfFile);
      } catch (error) {
        console.error("Failed to create edit session:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to create edit session",
        );

        toast({
          title: "Session Creation Failed",
          description: "Failed to create editing session. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCreatingSession(false);
        setSaveProgress(0);
      }
    },
    [toast],
  );

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
          sessionId: editSessionId,
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
    [editSessionId, computed.collaboratorCount, toast],
  );

  // Render PDF page on canvas
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (
        !pdfDocument ||
        !canvasReady ||
        !canvasMethodsRef.current ||
        isRendering
      )
        return;

      // Cancel any existing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      setIsRendering(true);

      try {
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });

        const canvas = canvasMethodsRef.current.getCanvas();
        const context = canvasMethodsRef.current.getContext("2d");

        if (!canvas || !context) {
          console.error("Canvas or context not available");
          setIsRendering(false);
          return;
        }

        // Resize canvas to fit page
        canvasMethodsRef.current.handleResize(viewport.width, viewport.height);

        // Clear canvas before rendering
        canvasMethodsRef.current.clearCanvas();

        // Create render task with cancellation support
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;

        // Update canvas size in editor state
        actions.setZoom(zoom);

        console.log(
          `Page ${pageNum} rendered successfully at ${Math.round(zoom * 100)}% zoom`,
        );

        setIsRendering(false);
        setError(null);
      } catch (error) {
        setIsRendering(false);

        // Ignore cancellation errors
        if (error instanceof Error && error.message.includes("cancelled")) {
          return;
        }

        console.error("Page rendering failed:", error);
        setError(
          `Failed to render page: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [pdfDocument, zoom, canvasReady, actions, isRendering],
  );

  // Apply edit action to backend
  const applyEditAction = useCallback(
    async (action: any) => {
      if (!editSessionId) return;

      try {
        const result = await PDFService.applyEditAction(
          editSessionId,
          action,
          currentPage - 1,
        );

        console.log(`Edit action applied: ${result.actionId}`);

        // Add to history for undo/redo
        const newHistory = editHistory.slice(0, historyIndex + 1);
        newHistory.push(action);
        setEditHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } catch (error) {
        console.error("Failed to apply edit action:", error);
        toast({
          title: "Edit Failed",
          description: "Failed to apply edit. Please try again.",
          variant: "destructive",
        });
      }
    },
    [editSessionId, currentPage, editHistory, historyIndex, toast],
  );

  // Handle canvas interactions
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasMethodsRef.current) return;

      const canvas = canvasMethodsRef.current.getCanvas();
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoom;
      const y = (event.clientY - rect.top) / zoom;

      switch (activeTool) {
        case "text":
          if (textInput.trim()) {
            const textElement = {
              id: Date.now().toString(),
              type: "addText",
              pageIndex: currentPage - 1,
              x,
              y,
              text: textInput,
              fontSize,
              color: { r: 0, g: 0, b: 0 },
            };

            setElements([...elements, textElement]);
            applyEditAction({
              type: "addText",
              data: {
                text: textInput,
                x,
                y,
                fontSize,
                color: { r: 0, g: 0, b: 0 },
              },
            });

            setTextInput("");
          }
          break;

        case "rectangle":
        case "circle":
          setIsDrawing(true);
          // Store start position for shape drawing
          const shapeElement = {
            id: Date.now().toString(),
            type: "addShape",
            pageIndex: currentPage - 1,
            x,
            y,
            width: 100,
            height: 50,
          };

          setElements([...elements, shapeElement]);
          applyEditAction({
            type: "addShape",
            data: {
              shape: activeTool,
              x,
              y,
              width: 100,
              height: 50,
              color: { r: 0, g: 0, b: 0 },
            },
          });
          break;
      }
    },
    [
      activeTool,
      textInput,
      fontSize,
      zoom,
      currentPage,
      elements,
      applyEditAction,
    ],
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = safeArrayFirst(Array.from(event.target.files || []));
      if (selectedFile && selectedFile.type === "application/pdf") {
        createEditSession(selectedFile);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a valid PDF file",
          variant: "destructive",
        });
      }
    },
    [createEditSession, toast],
  );

  // Save edited PDF
  const saveEditedPDF = useCallback(async () => {
    if (!editSessionId) {
      toast({
        title: "No Session",
        description: "Please upload a PDF first to start editing.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setSaveProgress(0);

    try {
      const pdfData = await PDFService.renderEditedPDF(
        editSessionId,
        setSaveProgress,
      );

      // Create download link
      const blob = new Blob([pdfData], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "edited_document.pdf";
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Saved",
        description: "Your edited PDF has been downloaded successfully.",
      });

      onSave?.(pdfData);
    } catch (error) {
      console.error("Failed to save PDF:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save the edited PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  }, [editSessionId, onSave, toast]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing render tasks
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      // Reset rendering state
      setIsRendering(false);
      setCanvasReady(false);
    };
  }, []);

  // Render current page when dependencies change (with debouncing)
  useEffect(() => {
    if (pdfDocument && canvasReady && !isRendering) {
      const timeoutId = setTimeout(() => {
        renderPage(currentPage);
      }, 100); // Small delay to prevent rapid re-renders

      return () => clearTimeout(timeoutId);
    }
  }, [pdfDocument, currentPage, zoom, canvasReady, renderPage, isRendering]);

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
                disabled={isLoading || isCreatingSession}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isCreatingSession ? "Creating Session..." : "Upload PDF"}
              </Button>

              {editSessionId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveEditedPDF}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save PDF
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Editing Toolbar */}
          {editSessionId && (
            <div className="flex items-center gap-2 mt-4 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1">
                <Button
                  variant={activeTool === "select" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTool("select")}
                >
                  <MousePointer className="w-4 h-4" />
                </Button>
                <Button
                  variant={activeTool === "text" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTool("text")}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant={activeTool === "rectangle" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTool("rectangle")}
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  variant={activeTool === "circle" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTool("circle")}
                >
                  <Circle className="w-4 h-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleZoom(zoom - 0.1)}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleZoom(zoom + 0.1)}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={historyIndex <= 0}
                  onClick={() => {
                    if (historyIndex > 0) {
                      setHistoryIndex(historyIndex - 1);
                    }
                  }}
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={historyIndex >= editHistory.length - 1}
                  onClick={() => {
                    if (historyIndex < editHistory.length - 1) {
                      setHistoryIndex(historyIndex + 1);
                    }
                  }}
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </div>

              {activeTool === "text" && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <Input
                    placeholder="Enter text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-32 h-8"
                  />
                  <Input
                    type="number"
                    value={fontSize}
                    onChange={(e) =>
                      setFontSize(parseInt(e.target.value) || 12)
                    }
                    min="8"
                    max="72"
                    className="w-16 h-8"
                  />
                </>
              )}
            </div>
          )}

          {(isCreatingSession || isSaving) && (
            <div className="mt-2">
              <Progress value={saveProgress} className="h-2" />
            </div>
          )}

          {pdfDocument && (
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              <Separator orientation="vertical" className="h-4" />
              <span>
                Elements:{" "}
                {elements.filter((e) => e.pageIndex === currentPage - 1).length}
              </span>
              {editSessionId && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Session: {editSessionId.slice(-8)}</span>
                </>
              )}
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
            <div className="relative">
              <SafePDFCanvas
                onCanvasReady={handleCanvasReady}
                onCanvasError={handleCanvasError}
                className="shadow-lg cursor-crosshair"
                onClick={handleCanvasClick}
              />
              {/* Overlay canvas for drawing elements */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 pointer-events-none"
                style={{ zIndex: 10 }}
              />
            </div>
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
                  <span className="text-sm px-2">
                    {currentPage} / {totalPages}
                  </span>
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

              {/* Current Tool Info */}
              <div>
                <h4 className="font-medium mb-2">Active Tool</h4>
                <div className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium capitalize">{activeTool}</div>
                  {activeTool === "text" && (
                    <div className="text-gray-600 mt-1">
                      Click on the PDF to add text
                    </div>
                  )}
                  {(activeTool === "rectangle" || activeTool === "circle") && (
                    <div className="text-gray-600 mt-1">
                      Click on the PDF to add {activeTool}
                    </div>
                  )}
                  {activeTool === "select" && (
                    <div className="text-gray-600 mt-1">
                      Click elements to select them
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Elements on Current Page */}
              <div>
                <h4 className="font-medium mb-2">Page Elements</h4>
                <div className="space-y-1">
                  {elements
                    .filter((e) => e.pageIndex === currentPage - 1)
                    .map((element, index) => (
                      <div
                        key={element.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                      >
                        <span className="capitalize">
                          {element.type.replace("add", "")} {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setElements(
                              elements.filter((e) => e.id !== element.id),
                            );
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  {elements.filter((e) => e.pageIndex === currentPage - 1)
                    .length === 0 && (
                    <div className="text-sm text-gray-500 italic">
                      No elements on this page
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Editor Stats */}
              <div>
                <h4 className="font-medium mb-2">Session Info</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Total Elements: {elements.length}</div>
                  <div>Edit History: {editHistory.length}</div>
                  <div>Current Page: {currentPage}</div>
                  {editSessionId && (
                    <div>Session ID: {editSessionId.slice(-8)}</div>
                  )}
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
