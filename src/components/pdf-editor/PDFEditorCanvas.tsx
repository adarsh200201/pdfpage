import React, { useRef, useEffect, useState, useCallback } from "react";
import * as fabric from "fabric";
import * as pdfjsLib from "pdfjs-dist";
import { configurePDFWorker } from "@/lib/pdf-worker-config";
import { PDFDocumentProxy } from "pdfjs-dist";
import { useToast } from "@/hooks/use-toast";
import {
  PDFElement,
  Point,
  Bounds,
  ToolType,
  EditorSettings,
} from "@/hooks/usePDFEditor";
import { cn } from "@/lib/utils";

interface PDFEditorCanvasProps {
  pdfDocument: PDFDocumentProxy;
  currentPage: number;
  zoom: number;
  elements: PDFElement[];
  selectedElements: string[];
  currentTool: ToolType;
  isDrawing: boolean;
  currentDrawPath: Point[];
  settings?: EditorSettings;
  onElementAdd: (
    element: Omit<PDFElement, "id" | "createdAt" | "updatedAt">,
  ) => string;
  onElementUpdate: (id: string, updates: Partial<PDFElement>) => void;
  onElementSelect: (ids: string[]) => void;
  onElementToggleSelect: (id: string) => void;
  onStartDrawing: (point: Point) => void;
  onAddDrawPoint: (point: Point) => void;
  onEndDrawing: () => void;
  onPageSizeChange: (size: { width: number; height: number }) => void;
  className?: string;
}

export function PDFEditorCanvas({
  pdfDocument,
  currentPage,
  zoom,
  elements,
  selectedElements,
  currentTool,
  isDrawing,
  currentDrawPath,
  settings,
  onElementAdd,
  onElementUpdate,
  onElementSelect,
  onElementToggleSelect,
  onStartDrawing,
  onAddDrawPoint,
  onEndDrawing,
  onPageSizeChange,
  className,
}: PDFEditorCanvasProps) {
  // Default settings if not provided
  const defaultSettings: EditorSettings = {
    snapToGrid: false,
    gridSize: 20,
    showGrid: false,
    showRulers: false,
    autoSave: true,
    defaultFontSize: 14,
    defaultFontFamily: "Arial",
    defaultStrokeWidth: 2,
    defaultStrokeColor: "#000000",
    defaultFillColor: "#ffffff",
    defaultTextColor: "#000000",
  };

  const editorSettings = settings || defaultSettings;

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const isDrawingRef = useRef(false);
  const drawingPathRef = useRef<fabric.Path | null>(null);
  const { toast } = useToast();

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasContainerRef.current || fabricCanvasRef.current) return;

    const fabricCanvas = new (fabric as any).Canvas("fabric-canvas", {
      width: 800,
      height: 600,
      backgroundColor: "transparent",
      selection: currentTool === "select",
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = fabricCanvas;
    setCanvasReady(true);

    // Configure canvas based on current tool
    const updateCanvasMode = () => {
      if (!fabricCanvas) return;

      fabricCanvas.selection = currentTool === "select";
      fabricCanvas.defaultCursor =
        currentTool === "select" ? "default" : "crosshair";

      if (currentTool === "draw") {
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.freeDrawingBrush.width = settings.defaultStrokeWidth;
        fabricCanvas.freeDrawingBrush.color = settings.defaultStrokeColor;
      } else {
        fabricCanvas.isDrawingMode = false;
      }
    };

    updateCanvasMode();

    // Mouse event handlers
    let isMouseDown = false;
    let startPoint: Point = { x: 0, y: 0 };
    let activeObject: fabric.Object | null = null;

    fabricCanvas.on("mouse:down", (e) => {
      if (!e.pointer) return;

      isMouseDown = true;
      startPoint = { x: e.pointer.x, y: e.pointer.y };

      if (currentTool === "draw") {
        onStartDrawing(startPoint);
        isDrawingRef.current = true;
      } else if (currentTool !== "select") {
        // Start creating new element
        switch (currentTool) {
          case "text":
            createTextElement(startPoint);
            break;
          case "rectangle":
          case "circle":
            activeObject = createShapeElement(currentTool, startPoint);
            break;
          case "image":
            // Handle image upload
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (event) => {
              const file = (event.target as HTMLInputElement).files?.[0];
              if (file) {
                createImageElement(startPoint, file);
              }
            };
            input.click();
            break;
        }
      }
    });

    fabricCanvas.on("mouse:move", (e) => {
      if (!isMouseDown || !e.pointer) return;

      const currentPoint = { x: e.pointer.x, y: e.pointer.y };

      if (currentTool === "draw" && isDrawingRef.current) {
        onAddDrawPoint(currentPoint);
      } else if (activeObject && currentTool !== "select") {
        // Update shape dimensions while dragging
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);
        const left = Math.min(startPoint.x, currentPoint.x);
        const top = Math.min(startPoint.y, currentPoint.y);

        activeObject.set({
          left,
          top,
          width,
          height,
        });

        if (currentTool === "circle") {
          const radius = Math.min(width, height) / 2;
          activeObject.set({
            radius,
            width: radius * 2,
            height: radius * 2,
          });
        }

        fabricCanvas.renderAll();
      }
    });

    fabricCanvas.on("mouse:up", (e) => {
      isMouseDown = false;

      if (currentTool === "draw" && isDrawingRef.current) {
        onEndDrawing();
        isDrawingRef.current = false;
      } else if (activeObject) {
        // Finalize shape creation
        const bounds = {
          x: activeObject.left || 0,
          y: activeObject.top || 0,
          width: activeObject.width || 0,
          height: activeObject.height || 0,
        };

        if (bounds.width > 5 && bounds.height > 5) {
          // Add element to state
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

          // Associate fabric object with element ID
          activeObject.set("elementId", elementId);
        } else {
          fabricCanvas.remove(activeObject);
        }

        activeObject = null;
      }
    });

    // Object selection events
    fabricCanvas.on("selection:created", (e) => {
      const selectedObjects = e.selected || [];
      const elementIds = selectedObjects
        .map((obj) => obj.get("elementId"))
        .filter(Boolean);
      onElementSelect(elementIds);
    });

    fabricCanvas.on("selection:updated", (e) => {
      const selectedObjects = e.selected || [];
      const elementIds = selectedObjects
        .map((obj) => obj.get("elementId"))
        .filter(Boolean);
      onElementSelect(elementIds);
    });

    fabricCanvas.on("selection:cleared", () => {
      onElementSelect([]);
    });

    // Object modification events
    fabricCanvas.on("object:modified", (e) => {
      const obj = e.target;
      if (!obj) return;

      const elementId = obj.get("elementId");
      if (!elementId) return;

      const bounds = {
        x: obj.left || 0,
        y: obj.top || 0,
        width: obj.width || 0,
        height: obj.height || 0,
      };

      onElementUpdate(elementId, {
        bounds,
        rotation: obj.angle || 0,
        opacity: obj.opacity || 1,
      });
    });

    return () => {
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
      setCanvasReady(false);
    };
  }, []);

  // Helper functions for creating elements
  const createTextElement = useCallback(
    (point: Point) => {
      const text = prompt("Enter text:");
      if (!text) return;

      const fabricText = new (fabric as any).IText(text, {
        left: point.x,
        top: point.y,
        fontSize: settings.defaultFontSize,
        fontFamily: settings.defaultFontFamily,
        fill: settings.defaultTextColor,
        editable: true,
      });

      fabricCanvasRef.current?.add(fabricText);

      const bounds = {
        x: point.x,
        y: point.y,
        width: fabricText.width || 100,
        height: fabricText.height || settings.defaultFontSize,
      };

      const elementId = onElementAdd({
        type: "text",
        pageIndex: currentPage - 1,
        bounds,
        visible: true,
        locked: false,
        opacity: 1,
        rotation: 0,
        content: text,
        fontSize: settings.defaultFontSize,
        fontFamily: settings.defaultFontFamily,
        color: settings.defaultTextColor,
        textAlign: "left",
        bold: false,
        italic: false,
        underline: false,
      } as any);

      fabricText.set("elementId", elementId);
    },
    [currentPage, onElementAdd, settings],
  );

  const createShapeElement = useCallback(
    (shapeType: "rectangle" | "circle", point: Point) => {
      let fabricObject: fabric.Object;

      if (shapeType === "rectangle") {
        fabricObject = new (fabric as any).Rect({
          left: point.x,
          top: point.y,
          width: 1,
          height: 1,
          fill: settings.defaultFillColor,
          stroke: settings.defaultStrokeColor,
          strokeWidth: settings.defaultStrokeWidth,
        });
      } else {
        fabricObject = new (fabric as any).Circle({
          left: point.x,
          top: point.y,
          radius: 1,
          fill: settings.defaultFillColor,
          stroke: settings.defaultStrokeColor,
          strokeWidth: settings.defaultStrokeWidth,
        });
      }

      fabricCanvasRef.current?.add(fabricObject);
      return fabricObject;
    },
    [settings],
  );

  const createImageElement = useCallback(
    async (point: Point, file: File) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageSrc = e.target?.result as string;

          (fabric as any).Image.fromURL(imageSrc, (fabricImage: any) => {
            fabricImage.set({
              left: point.x,
              top: point.y,
              scaleX: 0.5,
              scaleY: 0.5,
            });

            fabricCanvasRef.current?.add(fabricImage);

            const bounds = {
              x: point.x,
              y: point.y,
              width: (fabricImage.width || 0) * 0.5,
              height: (fabricImage.height || 0) * 0.5,
            };

            const elementId = onElementAdd({
              type: "image",
              pageIndex: currentPage - 1,
              bounds,
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
      } catch (error) {
        console.error("Error creating image element:", error);
        toast({
          title: "Error adding image",
          description: "Please try again with a different image.",
          variant: "destructive",
        });
      }
    },
    [currentPage, onElementAdd, toast],
  );

  // Render PDF page
  const renderPDFPage = useCallback(async () => {
    if (!pdfDocument || !pdfCanvasRef.current || !canvasReady) return;

    setIsLoading(true);
    setError(null);

    try {
      const page = await pdfDocument.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });

      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get canvas context");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Update Fabric canvas size
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setDimensions({
          width: viewport.width,
          height: viewport.height,
        });
      }

      // Notify parent of page size change
      onPageSizeChange({
        width: viewport.width,
        height: viewport.height,
      });

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;
    } catch (error) {
      console.error("Error rendering PDF page:", error);
      setError("Failed to render PDF page");
      toast({
        title: "Render error",
        description: "Failed to render PDF page. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pdfDocument, currentPage, zoom, canvasReady, onPageSizeChange, toast]);

  // Update canvas when tool changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.selection = currentTool === "select";
    canvas.defaultCursor = currentTool === "select" ? "default" : "crosshair";

    if (currentTool === "draw") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = settings.defaultStrokeWidth;
      canvas.freeDrawingBrush.color = settings.defaultStrokeColor;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [currentTool, settings]);

  // Render PDF page when dependencies change
  useEffect(() => {
    renderPDFPage();
  }, [renderPDFPage]);

  // Sync elements with Fabric canvas
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const currentObjects = canvas.getObjects();

    // Remove objects that no longer exist in elements
    const elementIds = new Set(elements.map((el) => el.id));
    currentObjects.forEach((obj) => {
      const elementId = obj.get("elementId");
      if (elementId && !elementIds.has(elementId)) {
        canvas.remove(obj);
      }
    });

    // Update selection based on selectedElements
    const selectedObjects = currentObjects.filter((obj) => {
      const elementId = obj.get("elementId");
      return elementId && selectedElements.includes(elementId);
    });

    canvas.discardActiveObject();
    if (selectedObjects.length > 0) {
      if (selectedObjects.length === 1) {
        canvas.setActiveObject(selectedObjects[0]);
      } else {
        const selection = new (fabric as any).ActiveSelection(selectedObjects, {
          canvas,
        });
        canvas.setActiveObject(selection);
      }
    }
    canvas.renderAll();
  }, [elements, selectedElements]);

  return (
    <div className={cn("relative w-full h-full overflow-auto", className)}>
      <div
        ref={canvasContainerRef}
        className="relative bg-white shadow-lg mx-auto"
        style={{
          width: "fit-content",
          minWidth: "100%",
          minHeight: "100%",
        }}
      >
        {/* PDF Layer */}
        <canvas
          ref={pdfCanvasRef}
          className="absolute top-0 left-0 z-0"
          style={{ pointerEvents: "none" }}
        />

        {/* Fabric.js Interactive Layer */}
        <canvas id="fabric-canvas" className="absolute top-0 left-0 z-10" />

        {/* Grid overlay */}
        {editorSettings.showGrid && (
          <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${editorSettings.gridSize}px ${editorSettings.gridSize}px`,
            }}
          />
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Rendering page...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
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

export default PDFEditorCanvas;
