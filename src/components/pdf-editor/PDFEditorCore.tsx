import React, { useRef, useEffect, useState, useCallback } from "react";
import * as fabric from "fabric";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentProxy } from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";
import { useToast } from "@/hooks/use-toast";
import {
  PDFElement,
  Point,
  ToolType,
  EditorSettings,
  TextElement,
  DrawElement,
  ShapeElement,
  ImageElement,
} from "@/hooks/usePDFEditor";
import { cn } from "@/lib/utils";

interface PDFEditorCoreProps {
  pdfDocument: PDFDocumentProxy;
  currentPage: number;
  zoom: number;
  elements: PDFElement[];
  selectedElements: string[];
  currentTool: ToolType;
  settings: EditorSettings;
  onElementAdd: (
    element: Omit<PDFElement, "id" | "createdAt" | "updatedAt">,
  ) => string;
  onElementUpdate: (id: string, updates: Partial<PDFElement>) => void;
  onElementSelect: (ids: string[]) => void;
  onPageSizeChange: (size: { width: number; height: number }) => void;
  className?: string;
}

export function PDFEditorCore({
  pdfDocument,
  currentPage,
  zoom,
  elements,
  selectedElements,
  currentTool,
  settings,
  onElementAdd,
  onElementUpdate,
  onElementSelect,
  onPageSizeChange,
  className,
}: PDFEditorCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const { toast } = useToast();

  // Configure PDF.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }, []);

  // Error handler for debugging
  useEffect(() => {
    const handleError = (error: any) => {
      console.error("PDF Editor Error:", error);
      toast({
        title: "PDF Editor Error",
        description: error.message || "An error occurred in the PDF editor",
        variant: "destructive",
      });
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, [toast]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!containerRef.current || fabricCanvasRef.current) return;

    try {
      // Ensure canvas element exists
      const canvasElement = document.getElementById("pdf-editor-canvas");
      if (!canvasElement) {
        console.error("Canvas element not found");
        return;
      }

      console.log("Initializing Fabric.js canvas");
      const fabricCanvas = new (fabric as any).Canvas("pdf-editor-canvas", {
        width: 800,
        height: 600,
        backgroundColor: "transparent",
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: false, // Improve performance
        stateful: true,
        allowTouchScrolling: true,
      });

      fabricCanvasRef.current = fabricCanvas;
      setCanvasReady(true);
      console.log("Fabric.js canvas initialized successfully");

      // Configure canvas interaction based on tool
      const updateCanvasInteraction = (canvas: any) => {
        if (!canvas) return;

        canvas.selection = currentTool === "select";
        canvas.isDrawingMode = currentTool === "draw";

        if (currentTool === "draw") {
          canvas.freeDrawingBrush.width = settings.defaultStrokeWidth;
          canvas.freeDrawingBrush.color = settings.defaultStrokeColor;
        }

        canvas.defaultCursor =
          currentTool === "select" ? "default" : "crosshair";
      };

      updateCanvasInteraction(fabricCanvas);

      // Mouse interaction handlers
      let isCreating = false;
      let startPoint: Point = { x: 0, y: 0 };
      let activeObject: any = null;

      const handleMouseDown = (e: any) => {
        if (
          !fabricCanvasRef.current ||
          !e.pointer ||
          currentTool === "select" ||
          currentTool === "draw"
        )
          return;

        isCreating = true;
        startPoint = { x: e.pointer.x, y: e.pointer.y };

        switch (currentTool) {
          case "text":
            handleTextCreation(startPoint);
            break;
          case "rectangle":
            activeObject = createRectangle(startPoint);
            break;
          case "circle":
            activeObject = createCircle(startPoint);
            break;
          case "image":
            handleImageUpload(startPoint);
            break;
        }
      };

      const handleMouseMove = (e: any) => {
        if (
          !fabricCanvasRef.current ||
          !isCreating ||
          !activeObject ||
          !e.pointer
        )
          return;

        const currentPoint = { x: e.pointer.x, y: e.pointer.y };
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);
        const left = Math.min(startPoint.x, currentPoint.x);
        const top = Math.min(startPoint.y, currentPoint.y);

        if (currentTool === "rectangle") {
          activeObject.set({ left, top, width, height });
        } else if (currentTool === "circle") {
          const radius = Math.min(width, height) / 2;
          activeObject.set({
            left: left + width / 2 - radius,
            top: top + height / 2 - radius,
            radius,
          });
        }

        fabricCanvasRef.current.renderAll();
      };

      const handleMouseUp = () => {
        if (!fabricCanvasRef.current) return;

        if (isCreating && activeObject) {
          const bounds = {
            x: activeObject.left || 0,
            y: activeObject.top || 0,
            width: activeObject.width || 0,
            height: activeObject.height || 0,
          };

          // Only create element if it's large enough
          if (bounds.width > 5 && bounds.height > 5) {
            const elementId = onElementAdd({
              type: currentTool as any,
              pageIndex: currentPage - 1,
              bounds,
              visible: true,
              locked: false,
              opacity: 1,
              rotation: 0,
              fillColor: settings.defaultFillColor,
              strokeColor: settings.defaultStrokeColor,
              strokeWidth: settings.defaultStrokeWidth,
              filled: true,
            } as any);

            activeObject.set("elementId", elementId);
          } else {
            fabricCanvasRef.current.remove(activeObject);
          }
        }

        isCreating = false;
        activeObject = null;
      };

      const handleSelectionCreated = (e: any) => {
        if (!fabricCanvasRef.current) return;
        const selected = e.selected || [];
        const elementIds = selected
          .map((obj: any) => obj.get("elementId"))
          .filter(Boolean);
        onElementSelect(elementIds);
      };

      const handleSelectionUpdated = (e: any) => {
        if (!fabricCanvasRef.current) return;
        const selected = e.selected || [];
        const elementIds = selected
          .map((obj: any) => obj.get("elementId"))
          .filter(Boolean);
        onElementSelect(elementIds);
      };

      const handleSelectionCleared = () => {
        if (!fabricCanvasRef.current) return;
        onElementSelect([]);
      };

      const handleObjectModified = (e: any) => {
        if (!fabricCanvasRef.current) return;
        const obj = e.target;
        if (!obj) return;

        const elementId = obj.get("elementId");
        if (!elementId) return;

        onElementUpdate(elementId, {
          bounds: {
            x: obj.left || 0,
            y: obj.top || 0,
            width: obj.width || 0,
            height: obj.height || 0,
          },
          rotation: obj.angle || 0,
          opacity: obj.opacity || 1,
        });
      };

      // Attach event listeners to the canvas
      // Attach event listeners to the canvas
      fabricCanvas.on("mouse:down", handleMouseDown);
      fabricCanvas.on("mouse:move", handleMouseMove);
      fabricCanvas.on("mouse:up", handleMouseUp);
      fabricCanvas.on("selection:created", handleSelectionCreated);
      fabricCanvas.on("selection:updated", handleSelectionUpdated);
      fabricCanvas.on("selection:cleared", handleSelectionCleared);
      fabricCanvas.on("object:modified", handleObjectModified);
    } catch (error) {
      console.error("Failed to initialize Fabric.js canvas:", error);
      toast({
        title: "Canvas Error",
        description: "Failed to initialize the editor canvas",
        variant: "destructive",
      });
      return;
    }

    return () => {
      if (fabricCanvasRef.current) {
        try {
          // Remove event listeners before disposing
          fabricCanvasRef.current.off("mouse:down");
          fabricCanvasRef.current.off("mouse:move");
          fabricCanvasRef.current.off("mouse:up");
          fabricCanvasRef.current.off("selection:created");
          fabricCanvasRef.current.off("selection:updated");
          fabricCanvasRef.current.off("selection:cleared");
          fabricCanvasRef.current.off("object:modified");

          fabricCanvasRef.current.dispose();
        } catch (error) {
          console.warn("Error disposing fabric canvas:", error);
        }
        fabricCanvasRef.current = null;
      }
      setCanvasReady(false);
    };
  }, []);

  // Helper functions
  const handleTextCreation = (point: Point) => {
    if (!fabricCanvasRef.current) return;

    const fabricText = new (fabric as any).IText("Click to edit text", {
      left: point.x,
      top: point.y,
      fontSize: settings.defaultFontSize,
      fontFamily: settings.defaultFontFamily,
      fill: settings.defaultTextColor,
      editable: true,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: false,
      cornerColor: "#3b82f6",
      cornerStrokeColor: "#1d4ed8",
      borderColor: "#3b82f6",
      editingBorderColor: "#ef4444",
    });

    fabricCanvasRef.current.add(fabricText);
    fabricCanvasRef.current.setActiveObject(fabricText);

    // Enter editing mode immediately
    fabricText.enterEditing();
    fabricText.selectAll();

    const elementId = onElementAdd({
      type: "text",
      pageIndex: currentPage - 1,
      bounds: {
        x: point.x,
        y: point.y,
        width: fabricText.width || 100,
        height: fabricText.height || settings.defaultFontSize,
      },
      visible: true,
      locked: false,
      opacity: 1,
      rotation: 0,
      content: "Click to edit text",
      fontSize: settings.defaultFontSize,
      fontFamily: settings.defaultFontFamily,
      color: settings.defaultTextColor,
      textAlign: "left",
      bold: false,
      italic: false,
      underline: false,
    } as any);

    fabricText.set("elementId", elementId);

    // Update element when text changes
    fabricText.on("changed", () => {
      onElementUpdate(elementId, {
        content: fabricText.text || "",
        bounds: {
          x: fabricText.left || 0,
          y: fabricText.top || 0,
          width: fabricText.width || 0,
          height: fabricText.height || 0,
        },
      });
    });
  };

  const createRectangle = (point: Point): fabric.Rect => {
    const rect = new (fabric as any).Rect({
      left: point.x,
      top: point.y,
      width: 1,
      height: 1,
      fill: settings.defaultFillColor,
      stroke: settings.defaultStrokeColor,
      strokeWidth: settings.defaultStrokeWidth,
    });

    fabricCanvasRef.current?.add(rect);
    return rect;
  };

  const createCircle = (point: Point): fabric.Circle => {
    const circle = new (fabric as any).Circle({
      left: point.x,
      top: point.y,
      radius: 1,
      fill: settings.defaultFillColor,
      stroke: settings.defaultStrokeColor,
      strokeWidth: settings.defaultStrokeWidth,
    });

    fabricCanvasRef.current?.add(circle);
    return circle;
  };

  const handleImageUpload = (point: Point) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !fabricCanvasRef.current) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageSrc = event.target?.result as string;

        (fabric as any).Image.fromURL(imageSrc, (fabricImage: any) => {
          fabricImage.set({
            left: point.x,
            top: point.y,
            scaleX: 0.5,
            scaleY: 0.5,
          });

          fabricCanvasRef.current?.add(fabricImage);

          const elementId = onElementAdd({
            type: "image",
            pageIndex: currentPage - 1,
            bounds: {
              x: point.x,
              y: point.y,
              width: (fabricImage.width || 0) * 0.5,
              height: (fabricImage.height || 0) * 0.5,
            },
            visible: true,
            locked: false,
            opacity: 1,
            rotation: 0,
            src: imageSrc,
            originalWidth: fabricImage.width || 0,
            originalHeight: fabricImage.height || 0,
            aspectRatio: (fabricImage.width || 1) / (fabricImage.height || 1),
          } as any);

          fabricImage.set("elementId", elementId);
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Render PDF page
  const renderPDFPage = useCallback(async () => {
    if (!pdfDocument || !pdfCanvasRef.current || !canvasReady) {
      console.log("PDF render skipped:", {
        pdfDocument: !!pdfDocument,
        canvas: !!pdfCanvasRef.current,
        canvasReady,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Rendering page ${currentPage} at zoom ${zoom}`);
      const page = await pdfDocument.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });

      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get canvas context");

      // Set canvas size with device pixel ratio for crisp rendering
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * devicePixelRatio;
      canvas.height = viewport.height * devicePixelRatio;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";

      context.scale(devicePixelRatio, devicePixelRatio);

      // Update Fabric canvas size
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setDimensions({
          width: viewport.width,
          height: viewport.height,
        });
      }

      // Update page size
      const newPageSize = {
        width: viewport.width,
        height: viewport.height,
      };
      setPageSize(newPageSize);
      onPageSizeChange(newPageSize);

      // Clear canvas before rendering
      context.clearRect(0, 0, viewport.width, viewport.height);

      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      console.log("PDF page rendered successfully");
    } catch (error) {
      console.error("Error rendering PDF page:", error);
      setError("Failed to render PDF page");
      toast({
        title: "Render error",
        description:
          "Failed to render PDF page. Please try uploading the file again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pdfDocument, currentPage, zoom, canvasReady, onPageSizeChange, toast]);

  // Update canvas tool settings
  useEffect(() => {
    if (!fabricCanvasRef.current || !canvasReady) return;

    try {
      const canvas = fabricCanvasRef.current;
      canvas.selection = currentTool === "select";
      canvas.isDrawingMode = currentTool === "draw";

      if (currentTool === "draw") {
        canvas.freeDrawingBrush.width = settings.defaultStrokeWidth;
        canvas.freeDrawingBrush.color = settings.defaultStrokeColor;
      }

      canvas.defaultCursor = currentTool === "select" ? "default" : "crosshair";
      canvas.renderAll();
    } catch (error) {
      console.warn("Error updating canvas tool settings:", error);
    }
  }, [currentTool, settings, canvasReady]);

  // Re-render when dependencies change
  useEffect(() => {
    renderPDFPage();
  }, [renderPDFPage]);

  // Sync elements with canvas
  useEffect(() => {
    if (!fabricCanvasRef.current || !canvasReady) return;

    try {
      const canvas = fabricCanvasRef.current;
      const currentObjects = canvas.getObjects();

      // Update selection
      const selectedObjects = currentObjects.filter((obj) => {
        const elementId = obj.get("elementId");
        return elementId && selectedElements.includes(elementId);
      });

      canvas.discardActiveObject();
      if (selectedObjects.length > 0) {
        if (selectedObjects.length === 1) {
          canvas.setActiveObject(selectedObjects[0]);
        } else {
          const selection = new (fabric as any).ActiveSelection(
            selectedObjects,
            {
              canvas,
            },
          );
          canvas.setActiveObject(selection);
        }
      }
      canvas.renderAll();
    } catch (error) {
      console.warn("Error syncing canvas selection:", error);
    }
  }, [selectedElements, canvasReady]);

  return (
    <div className={cn("relative w-full h-full overflow-auto", className)}>
      <div
        ref={containerRef}
        className="relative bg-white shadow-lg mx-auto"
        style={{
          width: Math.max(pageSize.width, 800),
          height: Math.max(pageSize.height, 600),
        }}
      >
        {/* PDF Background Layer */}
        <canvas
          ref={pdfCanvasRef}
          className="absolute top-0 left-0 z-0"
          style={{ pointerEvents: "none" }}
        />

        {/* Fabric.js Interactive Layer */}
        <canvas id="pdf-editor-canvas" className="absolute top-0 left-0 z-10" />

        {/* Grid Overlay */}
        {settings.showGrid && (
          <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${settings.gridSize}px ${settings.gridSize}px`,
            }}
          />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Rendering page...</p>
            </div>
          </div>
        )}

        {/* Canvas Ready Indicator */}
        {!canvasReady && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="animate-pulse rounded-full h-8 w-8 bg-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Initializing editor...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-20">
            <div className="text-center text-red-600">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
