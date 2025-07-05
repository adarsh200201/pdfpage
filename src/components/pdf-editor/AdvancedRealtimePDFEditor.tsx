import React, { useState, useEffect, useRef, useCallback } from "react";
import { pdfjs } from "react-pdf";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Type,
  Square,
  Circle,
  MousePointer,
  Image,
  Pen,
  Eraser,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Save,
  Trash2,
  Move,
  RotateCcw,
  Copy,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  FileImage,
  Signature,
  Edit3,
  Layers,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFService } from "@/services/pdfService";

// Enhanced types for real-time editing
interface ElementBase {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  layer: number;
  visible: boolean;
  locked: boolean;
  rotation: number;
  opacity: number;
  created: number;
  modified: number;
}

interface TextElement extends ElementBase {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
  lineHeight: number;
}

interface ShapeElement extends ElementBase {
  type: "rectangle" | "circle" | "line" | "arrow";
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: "solid" | "dashed" | "dotted";
}

interface ImageElement extends ElementBase {
  type: "image";
  src: string;
  originalWidth: number;
  originalHeight: number;
  maintainAspectRatio: boolean;
}

interface SignatureElement extends ElementBase {
  type: "signature";
  imageData: string;
  signatureType: "draw" | "type" | "upload";
}

type PDFElement = TextElement | ShapeElement | ImageElement | SignatureElement;

interface RealtimeEditorProps {
  className?: string;
  onSave?: (pdfData: ArrayBuffer) => void;
}

export function AdvancedRealtimePDFEditor({
  className,
  onSave,
}: RealtimeEditorProps) {
  const { toast } = useToast();

  // Core PDF state
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canvas refs
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor state
  const [elements, setElements] = useState<PDFElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempElement, setTempElement] = useState<Partial<PDFElement> | null>(
    null,
  );

  // Tool properties
  const [textProperties, setTextProperties] = useState({
    content: "New Text",
    fontSize: 16,
    fontFamily: "Arial",
    color: "#000000",
    backgroundColor: "transparent",
    bold: false,
    italic: false,
    underline: false,
    align: "left" as "left" | "center" | "right",
  });

  const [shapeProperties, setShapeProperties] = useState({
    strokeColor: "#000000",
    fillColor: "transparent",
    strokeWidth: 2,
    strokeStyle: "solid" as "solid" | "dashed" | "dotted",
  });

  // History for undo/redo
  const [history, setHistory] = useState<PDFElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Real-time collaboration state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  // Configure PDF.js worker
  useEffect(() => {
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file || file.type !== "application/pdf") {
        toast({
          title: "Invalid file",
          description: "Please select a valid PDF file",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create edit session
        const sessionData = await PDFService.createEditSession(file, {
          collaborative: true,
        });
        setSessionId(sessionData.sessionId);

        // Load PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);

        toast({
          title: "PDF loaded successfully",
          description: `${pdf.numPages} pages loaded. Session: ${sessionData.sessionId.slice(-8)}`,
        });

        // Render first page
        setTimeout(() => renderPage(1), 100);
      } catch (error) {
        console.error("Failed to load PDF:", error);
        setError("Failed to load PDF. Please try again.");
        toast({
          title: "Upload failed",
          description: "Could not load the PDF file",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // Render PDF page with real-time overlay
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDocument || !mainCanvasRef.current) return;

      try {
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });

        const canvas = mainCanvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Set canvas size
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Setup overlay canvas
        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = viewport.width;
          overlayCanvasRef.current.height = viewport.height;
          overlayCanvasRef.current.style.width = `${viewport.width}px`;
          overlayCanvasRef.current.style.height = `${viewport.height}px`;
        }

        // Clear and render PDF
        context.clearRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Render real-time elements
        renderElements();
      } catch (error) {
        console.error("Failed to render page:", error);
        setError("Failed to render page");
      }
    },
    [pdfDocument, zoom],
  );

  // Render all elements on overlay canvas
  const renderElements = useCallback(() => {
    if (!overlayCanvasRef.current) return;

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear overlay
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render elements for current page
    const pageElements = elements.filter(
      (el) => el.pageIndex === currentPage - 1 && el.visible,
    );

    pageElements.forEach((element) => {
      ctx.save();

      // Apply transformations
      ctx.globalAlpha = element.opacity;
      ctx.translate(
        element.x + element.width / 2,
        element.y + element.height / 2,
      );
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-element.width / 2, -element.height / 2);

      // Render based on type
      switch (element.type) {
        case "text":
          renderTextElement(ctx, element as TextElement);
          break;
        case "rectangle":
        case "circle":
          renderShapeElement(ctx, element as ShapeElement);
          break;
        case "image":
          renderImageElement(ctx, element as ImageElement);
          break;
        case "signature":
          renderSignatureElement(ctx, element as SignatureElement);
          break;
      }

      // Render selection handles
      if (selectedElement === element.id) {
        renderSelectionHandles(ctx, element);
      }

      ctx.restore();
    });

    // Render temporary element while drawing
    if (tempElement && activeTool !== "select") {
      ctx.save();
      ctx.globalAlpha = 0.7;
      renderTempElement(ctx, tempElement);
      ctx.restore();
    }
  }, [elements, currentPage, selectedElement, tempElement, activeTool]);

  // Render different element types
  const renderTextElement = (
    ctx: CanvasRenderingContext2D,
    element: TextElement,
  ) => {
    const {
      content,
      fontSize,
      fontFamily,
      color,
      backgroundColor,
      bold,
      italic,
    } = element;

    // Set font
    let font = `${fontSize * zoom}px ${fontFamily}`;
    if (bold) font = `bold ${font}`;
    if (italic) font = `italic ${font}`;
    ctx.font = font;

    // Background
    if (backgroundColor && backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, element.width, element.height);
    }

    // Text
    ctx.fillStyle = color;
    ctx.textAlign =
      element.align === "center"
        ? "center"
        : element.align === "right"
          ? "end"
          : "start";
    ctx.textBaseline = "top";

    const lines = content.split("\n");
    const lineHeight = fontSize * element.lineHeight * zoom;

    lines.forEach((line, index) => {
      const x =
        element.align === "center"
          ? element.width / 2
          : element.align === "right"
            ? element.width
            : 0;
      const y = index * lineHeight;
      ctx.fillText(line, x, y);

      if (element.underline) {
        ctx.beginPath();
        ctx.moveTo(x, y + fontSize * zoom);
        ctx.lineTo(x + ctx.measureText(line).width, y + fontSize * zoom);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  };

  const renderShapeElement = (
    ctx: CanvasRenderingContext2D,
    element: ShapeElement,
  ) => {
    const { strokeColor, fillColor, strokeWidth, strokeStyle } = element;

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = strokeWidth * zoom;

    // Set line style
    if (strokeStyle === "dashed") {
      ctx.setLineDash([10, 5]);
    } else if (strokeStyle === "dotted") {
      ctx.setLineDash([2, 3]);
    } else {
      ctx.setLineDash([]);
    }

    if (element.type === "rectangle") {
      if (fillColor !== "transparent") {
        ctx.fillRect(0, 0, element.width, element.height);
      }
      ctx.strokeRect(0, 0, element.width, element.height);
    } else if (element.type === "circle") {
      const centerX = element.width / 2;
      const centerY = element.height / 2;
      const radius = Math.min(element.width, element.height) / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

      if (fillColor !== "transparent") {
        ctx.fill();
      }
      ctx.stroke();
    }
  };

  const renderImageElement = (
    ctx: CanvasRenderingContext2D,
    element: ImageElement,
  ) => {
    // This would render an uploaded image
    // Implementation depends on how images are stored
  };

  const renderSignatureElement = (
    ctx: CanvasRenderingContext2D,
    element: SignatureElement,
  ) => {
    // This would render a signature
    // Implementation depends on signature format
  };

  const renderSelectionHandles = (
    ctx: CanvasRenderingContext2D,
    element: PDFElement,
  ) => {
    const handleSize = 8;
    ctx.fillStyle = "#007bff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    // Corner handles
    const positions = [
      { x: -handleSize / 2, y: -handleSize / 2 }, // top-left
      { x: element.width - handleSize / 2, y: -handleSize / 2 }, // top-right
      { x: element.width - handleSize / 2, y: element.height - handleSize / 2 }, // bottom-right
      { x: -handleSize / 2, y: element.height - handleSize / 2 }, // bottom-left
    ];

    positions.forEach((pos) => {
      ctx.fillRect(pos.x, pos.y, handleSize, handleSize);
      ctx.strokeRect(pos.x, pos.y, handleSize, handleSize);
    });
  };

  const renderTempElement = (
    ctx: CanvasRenderingContext2D,
    temp: Partial<PDFElement>,
  ) => {
    if (!temp.width || !temp.height) return;

    ctx.strokeStyle = "#007bff";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(temp.x || 0, temp.y || 0, temp.width, temp.height);
  };

  // Handle mouse events for real-time interaction
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!overlayCanvasRef.current) return;

      const rect = overlayCanvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      if (activeTool === "select") {
        // Check if clicking on an element
        const clickedElement = elements.find(
          (el) =>
            el.pageIndex === currentPage - 1 &&
            x >= el.x &&
            x <= el.x + el.width &&
            y >= el.y &&
            y <= el.y + el.height,
        );

        if (clickedElement) {
          setSelectedElement(clickedElement.id);
          setIsDragging(true);
          setDragStart({ x: x - clickedElement.x, y: y - clickedElement.y });
        } else {
          setSelectedElement(null);
        }
      } else {
        // Start creating new element
        setIsDrawing(true);
        setTempElement({
          id: `temp-${Date.now()}`,
          type: activeTool,
          x,
          y,
          width: 0,
          height: 0,
          pageIndex: currentPage - 1,
        });
      }
    },
    [activeTool, elements, currentPage, zoom],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!overlayCanvasRef.current) return;

      const rect = overlayCanvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      if (isDragging && selectedElement) {
        // Move selected element with real-time sync
        const updatedElement = {
          x: x - dragStart.x,
          y: y - dragStart.y,
          modified: Date.now(),
        };

        setElements((prev) =>
          prev.map((el) =>
            el.id === selectedElement
              ? {
                  ...el,
                  ...updatedElement,
                }
              : el,
          ),
        );

        // Sync position change in real-time
        if (sessionId && selectedElement) {
          const element = elements.find((el) => el.id === selectedElement);
          if (element) {
            PDFService.updateElement(sessionId, selectedElement, {
              ...element,
              ...updatedElement,
            }).catch(console.error);
          }
        }

        renderElements();
      } else if (isDrawing && tempElement) {
        // Update temp element size
        const startX = tempElement.x || 0;
        const startY = tempElement.y || 0;
        setTempElement((prev) =>
          prev
            ? {
                ...prev,
                width: Math.abs(x - startX),
                height: Math.abs(y - startY),
                x: Math.min(x, startX),
                y: Math.min(y, startY),
              }
            : null,
        );
        renderElements();
      }
    },
    [isDragging, isDrawing, selectedElement, tempElement, dragStart, zoom],
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (isDrawing && tempElement && tempElement.width && tempElement.height) {
      // Create actual element
      const newElement: PDFElement = {
        ...tempElement,
        id: `el-${Date.now()}`,
        layer: 1,
        visible: true,
        locked: false,
        rotation: 0,
        opacity: 1,
        created: Date.now(),
        modified: Date.now(),
        ...(activeTool === "text"
          ? {
              type: "text",
              content: textProperties.content,
              fontSize: textProperties.fontSize,
              fontFamily: textProperties.fontFamily,
              color: textProperties.color,
              backgroundColor: textProperties.backgroundColor,
              bold: textProperties.bold,
              italic: textProperties.italic,
              underline: textProperties.underline,
              align: textProperties.align,
              lineHeight: 1.2,
            }
          : activeTool === "rectangle" || activeTool === "circle"
            ? {
                type: activeTool,
                strokeColor: shapeProperties.strokeColor,
                fillColor: shapeProperties.fillColor,
                strokeWidth: shapeProperties.strokeWidth,
                strokeStyle: shapeProperties.strokeStyle,
              }
            : {}),
      } as PDFElement;

      addElement(newElement);
      setSelectedElement(newElement.id);
    }

    setIsDrawing(false);
    setIsDragging(false);
    setTempElement(null);
  }, [isDrawing, tempElement, activeTool, textProperties, shapeProperties]);

  // Add element and update history with real-time sync
  const addElement = useCallback(
    async (element: PDFElement) => {
      setElements((prev) => {
        const newElements = [...prev, element];
        // Update history
        setHistory((h) => [...h.slice(0, historyIndex + 1), newElements]);
        setHistoryIndex((h) => h + 1);
        return newElements;
      });

      // Sync with backend for real-time collaboration
      if (sessionId) {
        try {
          await PDFService.updateElement(sessionId, element.id, element);
          console.log(`✅ Element ${element.id} synced with backend`);
        } catch (error) {
          console.error("Failed to sync element with backend:", error);
        }
      }
    },
    [historyIndex, sessionId],
  );

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Re-render elements when they change
  useEffect(() => {
    renderElements();
  }, [renderElements]);

  // Re-render page when zoom or page changes
  useEffect(() => {
    if (pdfDocument) {
      renderPage(currentPage);
    }
  }, [renderPage, pdfDocument, currentPage, zoom]);

  // Save edited PDF
  const saveEditedPDF = useCallback(async () => {
    if (!sessionId) {
      toast({
        title: "No session",
        description: "Please upload a PDF first",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Saving PDF...",
        description: "Applying all edits to your PDF",
      });

      const pdfBuffer = await PDFService.saveEditedPDF(sessionId);

      // Create download link
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited_document_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF saved successfully!",
        description: "Your edited PDF has been downloaded",
      });

      if (onSave) {
        onSave(pdfBuffer);
      }
    } catch (error) {
      console.error("Failed to save PDF:", error);
      toast({
        title: "Save failed",
        description: "Could not save the edited PDF",
        variant: "destructive",
      });
    }
  }, [sessionId, onSave, toast]);

  const selectedElementData = selectedElement
    ? elements.find((el) => el.id === selectedElement)
    : null;

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Top Toolbar */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* File upload */}
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>

              {/* Save button */}
              {pdfDocument && (
                <Button variant="outline" onClick={saveEditedPDF}>
                  <Save className="w-4 h-4 mr-2" />
                  Save PDF
                </Button>
              )}
            </div>

            {/* Zoom controls */}
            {pdfDocument && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(zoom * 0.9)}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm w-16 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(zoom * 1.1)}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Session info */}
            {sessionId && (
              <Badge variant="secondary">Session: {sessionId.slice(-8)}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-1">
        {/* Left Toolbar */}
        {pdfDocument && (
          <Card className="w-16 rounded-none border-y-0 border-l-0">
            <CardContent className="p-2 space-y-2">
              {[
                { tool: "select", icon: MousePointer, tooltip: "Select" },
                { tool: "text", icon: Type, tooltip: "Add Text" },
                { tool: "rectangle", icon: Square, tooltip: "Rectangle" },
                { tool: "circle", icon: Circle, tooltip: "Circle" },
                { tool: "image", icon: FileImage, tooltip: "Add Image" },
                { tool: "signature", icon: Signature, tooltip: "Signature" },
                { tool: "pen", icon: Pen, tooltip: "Draw" },
              ].map(({ tool, icon: Icon, tooltip }) => (
                <Button
                  key={tool}
                  variant={activeTool === tool ? "default" : "ghost"}
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveTool(tool)}
                  title={tooltip}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}

              <Separator />

              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Page Navigation */}
          {pdfDocument && (
            <div className="flex items-center justify-center p-2 bg-white border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="mx-4 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* Canvas Container */}
          <div
            ref={containerRef}
            className="flex-1 overflow-auto bg-gray-100 p-8 flex items-center justify-center"
          >
            {isLoading && (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading PDF...</p>
              </div>
            )}

            {error && (
              <div className="text-center text-red-600">
                <p>{error}</p>
                <Button
                  variant="outline"
                  onClick={() => setError(null)}
                  className="mt-2"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {!pdfDocument && !isLoading && !error && (
              <div className="text-center">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Upload a PDF to start editing
                </h3>
                <p className="text-gray-600 mb-4">
                  Real-time collaborative PDF editing like LightPDF
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose PDF File
                </Button>
              </div>
            )}

            {pdfDocument && (
              <div className="relative shadow-lg">
                {/* Main PDF Canvas */}
                <canvas ref={mainCanvasRef} className="block bg-white" />

                {/* Interactive Overlay Canvas */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 cursor-crosshair"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Properties Panel */}
        {pdfDocument && (
          <Card className="w-80 rounded-none border-y-0 border-r-0">
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tool-specific properties */}
              {activeTool === "text" && (
                <div className="space-y-4">
                  <h4 className="font-medium">Text Properties</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Content</Label>
                      <Input
                        value={textProperties.content}
                        onChange={(e) =>
                          setTextProperties((prev) => ({
                            ...prev,
                            content: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Font Size</Label>
                      <Slider
                        value={[textProperties.fontSize]}
                        onValueChange={([value]) =>
                          setTextProperties((prev) => ({
                            ...prev,
                            fontSize: value,
                          }))
                        }
                        min={8}
                        max={72}
                        step={1}
                      />
                      <span className="text-sm text-gray-500">
                        {textProperties.fontSize}px
                      </span>
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={textProperties.color}
                          onChange={(e) =>
                            setTextProperties((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={textProperties.color}
                          onChange={(e) =>
                            setTextProperties((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={textProperties.bold ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setTextProperties((prev) => ({
                            ...prev,
                            bold: !prev.bold,
                          }))
                        }
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={textProperties.italic ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setTextProperties((prev) => ({
                            ...prev,
                            italic: !prev.italic,
                          }))
                        }
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={
                          textProperties.underline ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setTextProperties((prev) => ({
                            ...prev,
                            underline: !prev.underline,
                          }))
                        }
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {(activeTool === "rectangle" || activeTool === "circle") && (
                <div className="space-y-4">
                  <h4 className="font-medium">Shape Properties</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Stroke Color</Label>
                      <Input
                        type="color"
                        value={shapeProperties.strokeColor}
                        onChange={(e) =>
                          setShapeProperties((prev) => ({
                            ...prev,
                            strokeColor: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Fill Color</Label>
                      <Input
                        type="color"
                        value={
                          shapeProperties.fillColor === "transparent"
                            ? "#ffffff"
                            : shapeProperties.fillColor
                        }
                        onChange={(e) =>
                          setShapeProperties((prev) => ({
                            ...prev,
                            fillColor: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Stroke Width</Label>
                      <Slider
                        value={[shapeProperties.strokeWidth]}
                        onValueChange={([value]) =>
                          setShapeProperties((prev) => ({
                            ...prev,
                            strokeWidth: value,
                          }))
                        }
                        min={1}
                        max={20}
                        step={1}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Selected element properties */}
              {selectedElementData && (
                <div className="space-y-4">
                  <h4 className="font-medium">Selected Element</h4>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Type: {selectedElementData.type}
                    </div>
                    <div className="text-sm text-gray-600">
                      Position: {Math.round(selectedElementData.x)},{" "}
                      {Math.round(selectedElementData.y)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Size: {Math.round(selectedElementData.width)} ×{" "}
                      {Math.round(selectedElementData.height)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (selectedElement) {
                          // Remove from local state
                          setElements((prev) =>
                            prev.filter((el) => el.id !== selectedElement),
                          );

                          // Sync deletion with backend
                          if (sessionId) {
                            try {
                              await PDFService.deleteElement(
                                sessionId,
                                selectedElement,
                              );
                            } catch (error) {
                              console.error(
                                "Failed to sync element deletion:",
                                error,
                              );
                            }
                          }

                          setSelectedElement(null);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              {/* Layers panel */}
              <div className="space-y-4">
                <h4 className="font-medium">Layers</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {elements
                    .filter((el) => el.pageIndex === currentPage - 1)
                    .sort((a, b) => b.layer - a.layer)
                    .map((element) => (
                      <div
                        key={element.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded text-sm cursor-pointer",
                          selectedElement === element.id
                            ? "bg-blue-100"
                            : "hover:bg-gray-100",
                        )}
                        onClick={() => setSelectedElement(element.id)}
                      >
                        <div className="w-4 h-4 bg-gray-300 rounded"></div>
                        <span className="flex-1 truncate">
                          {element.type} {element.id.slice(-4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === element.id
                                  ? { ...el, visible: !el.visible }
                                  : el,
                              ),
                            );
                          }}
                        >
                          {element.visible ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
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
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        }}
      />
    </div>
  );
}

export default AdvancedRealtimePDFEditor;
