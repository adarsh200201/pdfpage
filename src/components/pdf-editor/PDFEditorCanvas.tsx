import React, { useRef, useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { loadPDFDocument } from "@/lib/pdf-worker-config";
import {
  AnyElement,
  Point,
  Bounds,
  ToolType,
  TextElement,
  DrawElement,
  ShapeElement,
  SignatureElement,
  ImageElement,
} from "@/types/pdf-editor";
import { cn } from "@/lib/utils";

interface PDFEditorCanvasProps {
  file: File;
  pageIndex: number;
  zoom: number;
  elements: AnyElement[];
  selectedElements: string[];
  currentTool: ToolType;
  isDrawing: boolean;
  currentDrawPath: Point[];
  selectedColor: string;
  selectedStrokeWidth: number;
  selectedFontSize: number;
  onElementAdd: (
    element: Omit<AnyElement, "id" | "createdAt" | "updatedAt">,
  ) => string;
  onElementUpdate: (id: string, updates: Partial<AnyElement>) => void;
  onElementSelect: (ids: string[]) => void;
  onElementToggleSelect: (id: string) => void;
  onStartDrawing: (point: Point) => void;
  onAddDrawPoint: (point: Point) => void;
  onEndDrawing: () => void;
  onCanvasSizeChange: (size: { width: number; height: number }) => void;
  onSignaturePlace?: (x: number, y: number) => void;
  className?: string;
}

export default function PDFEditorCanvas({
  file,
  pageIndex,
  zoom,
  elements,
  selectedElements,
  currentTool,
  isDrawing,
  currentDrawPath,
  selectedColor,
  selectedStrokeWidth,
  selectedFontSize,
  onElementAdd,
  onElementUpdate,
  onElementSelect,
  onElementToggleSelect,
  onStartDrawing,
  onAddDrawPoint,
  onEndDrawing,
  onCanvasSizeChange,
  onSignaturePlace,
  className,
}: PDFEditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [pageData, setPageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isCreatingElement, setIsCreatingElement] = useState(false);
  const [tempElement, setTempElement] = useState<Bounds | null>(null);
  const [textInput, setTextInput] = useState<{
    bounds: Bounds;
    value: string;
    isEditing: boolean;
  } | null>(null);

  const { toast } = useToast();

  // Helper function to find element at a given point
  const getElementAtPoint = useCallback(
    (point: Point, elements: AnyElement[]): AnyElement | null => {
      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (element.pageIndex !== pageIndex) continue;

        const bounds = element.bounds;
        if (
          point.x >= bounds.x &&
          point.x <= bounds.x + bounds.width &&
          point.y >= bounds.y &&
          point.y <= bounds.y + bounds.height
        ) {
          return element;
        }
      }
      return null;
    },
    [pageIndex],
  );

  // Initialize PDF.js
  useEffect(() => {
    const loadPDF = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load PDF using centralized configuration to prevent version mismatches
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await loadPDFDocument(arrayBuffer);
        setPdfDocument(pdf);
        console.log(`✅ PDF loaded: ${pdf.numPages} pages`);

        toast({
          title: "PDF loaded successfully",
          description: `Document has ${pdf.numPages} pages`,
        });
      } catch (err) {
        console.error("❌ PDF loading error:", err);

        // More specific error handling
        let errorMessage = "Unable to load the PDF file";
        if (err instanceof Error) {
          if (err.message.includes("Invalid PDF")) {
            errorMessage = "Invalid PDF file format";
          } else if (err.message.includes("password")) {
            errorMessage =
              "Password-protected PDFs are not supported in the editor";
          } else if (err.message.includes("corrupt")) {
            errorMessage = "The PDF file appears to be corrupted";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        toast({
          title: "PDF loading failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (file) {
      loadPDF();
    }
  }, [file, toast]);

  // Render PDF page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(pageIndex + 1);
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;

        // Calculate viewport
        const viewport = page.getViewport({ scale: zoom });

        // Set canvas dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setPageData({ page, viewport });

        // Update canvas size for parent component
        onCanvasSizeChange({
          width: viewport.width,
          height: viewport.height,
        });

        console.log(
          `✅ Page ${pageIndex + 1} rendered at ${Math.round(zoom * 100)}% zoom`,
        );
      } catch (err) {
        console.error("Error rendering page:", err);
        setError(
          `Failed to render page: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    };

    renderPage();
  }, [pdfDocument, pageIndex, zoom, onCanvasSizeChange]);

  // Get mouse position relative to canvas
  const getMousePosition = useCallback(
    (e: React.MouseEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      };
    },
    [zoom],
  );

  // Handle element mouse down for dragging
  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, element: AnyElement) => {
      e.stopPropagation();

      if (currentTool !== "select") return;

      const point = getMousePosition(e);

      if (e.ctrlKey || e.metaKey) {
        onElementToggleSelect(element.id);
      } else if (!selectedElements.includes(element.id)) {
        onElementSelect([element.id]);
      }

      setIsDragging(true);
      setDragStart(point);
    },
    [
      currentTool,
      getMousePosition,
      onElementToggleSelect,
      selectedElements,
      onElementSelect,
    ],
  );

  // Handle element touch start for mobile
  const handleElementTouchStart = useCallback(
    (e: React.TouchEvent, element: AnyElement) => {
      e.stopPropagation();
      e.preventDefault();

      if (currentTool !== "select") return;

      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const point = {
        x: (touch.clientX - rect.left) / zoom,
        y: (touch.clientY - rect.top) / zoom,
      };

      if (!selectedElements.includes(element.id)) {
        onElementSelect([element.id]);
      }

      setIsDragging(true);
      setDragStart(point);
    },
    [currentTool, canvasRef, zoom, selectedElements, onElementSelect],
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!pageData) return;

      const point = getMousePosition(e);

      if (currentTool === "select") {
        // Only clear selection if clicking on empty space
        onElementSelect([]);
      } else if (currentTool === "signature" && onSignaturePlace) {
        // Handle signature placement
        onSignaturePlace(point.x, point.y);
      } else if (currentTool === "draw") {
        onStartDrawing(point);
      } else if (currentTool === "text") {
        // Create text input
        setTextInput({
          bounds: { x: point.x, y: point.y, width: 200, height: 30 },
          value: "",
          isEditing: true,
        });
      } else if (
        ["rectangle", "circle", "line", "arrow"].includes(currentTool)
      ) {
        setIsCreatingElement(true);
        setTempElement({ x: point.x, y: point.y, width: 0, height: 0 });
        setDragStart(point);
      }
    },
    [
      pageData,
      getMousePosition,
      currentTool,
      onElementSelect,
      onSignaturePlace,
      onStartDrawing,
    ],
  );
  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!pageData) return;

      const point = getMousePosition(e);

      if (currentTool === "draw" && isDrawing) {
        onAddDrawPoint(point);
      } else if (isDragging && selectedElements.length > 0) {
        // Move selected elements
        const deltaX = point.x - dragStart.x;
        const deltaY = point.y - dragStart.y;

        selectedElements.forEach((id) => {
          const element = elements.find((el) => el.id === id);
          if (element) {
            onElementUpdate(id, {
              bounds: {
                ...element.bounds,
                x: element.bounds.x + deltaX,
                y: element.bounds.y + deltaY,
              },
            });
          }
        });

        setDragStart(point);
      } else if (isCreatingElement && tempElement) {
        // Update temporary element size
        const width = Math.abs(point.x - dragStart.x);
        const height = Math.abs(point.y - dragStart.y);
        const x = Math.min(point.x, dragStart.x);
        const y = Math.min(point.y, dragStart.y);

        setTempElement({ x, y, width, height });
      }
    },
    [
      pageData,
      getMousePosition,
      currentTool,
      isDrawing,
      isDragging,
      selectedElements,
      dragStart,
      elements,
      onAddDrawPoint,
      onElementUpdate,
      isCreatingElement,
      tempElement,
    ],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (currentTool === "draw" && isDrawing) {
        // Create draw element
        if (currentDrawPath.length > 1) {
          onElementAdd({
            type: "draw",
            pageIndex,
            bounds: {
              x:
                Math.min(...currentDrawPath.map((p) => p.x)) -
                selectedStrokeWidth,
              y:
                Math.min(...currentDrawPath.map((p) => p.y)) -
                selectedStrokeWidth,
              width:
                Math.max(...currentDrawPath.map((p) => p.x)) -
                Math.min(...currentDrawPath.map((p) => p.x)) +
                selectedStrokeWidth * 2,
              height:
                Math.max(...currentDrawPath.map((p) => p.y)) -
                Math.min(...currentDrawPath.map((p) => p.y)) +
                selectedStrokeWidth * 2,
            },
            properties: {
              paths: [currentDrawPath],
              strokeWidth: selectedStrokeWidth,
              color: selectedColor,
              opacity: 1,
            },
          } as Omit<DrawElement, "id" | "createdAt" | "updatedAt">);
        }
        onEndDrawing();
      } else if (isCreatingElement && tempElement) {
        // Create shape element
        if (tempElement.width > 5 && tempElement.height > 5) {
          onElementAdd({
            type: currentTool as "rectangle" | "circle" | "line" | "arrow",
            pageIndex,
            bounds: tempElement,
            properties: {
              strokeWidth: selectedStrokeWidth,
              strokeColor: selectedColor,
              fillColor: "transparent",
              opacity: 1,
            },
          } as Omit<ShapeElement, "id" | "createdAt" | "updatedAt">);
        }
        setIsCreatingElement(false);
        setTempElement(null);
      }

      setIsDragging(false);
    },
    [
      currentTool,
      isDrawing,
      currentDrawPath,
      selectedStrokeWidth,
      onElementAdd,
      pageIndex,
      selectedColor,
      onEndDrawing,
      isCreatingElement,
      tempElement,
    ],
  );

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !pageData) return;

      const point = {
        x: (touch.clientX - rect.left) / zoom,
        y: (touch.clientY - rect.top) / zoom,
      };

      // Handle signature placement
      if (onSignaturePlace && currentTool === "select") {
        onSignaturePlace(point.x, point.y);
        return;
      }

      // Check for element selection
      const clickedElement = getElementAtPoint(point, elements);

      if (currentTool === "select") {
        if (clickedElement) {
          setIsDragging(true);
          setDragStart(point);
          if (!selectedElements.includes(clickedElement.id)) {
            onElementToggleSelect(clickedElement.id);
          }
        } else {
          onElementSelect([]);
        }
      } else if (currentTool === "draw") {
        onStartDrawing(point);
      } else if (currentTool === "rectangle" || currentTool === "circle") {
        setIsCreatingElement(true);
        setDragStart(point);
        setTempElement({ x: point.x, y: point.y, width: 0, height: 0 });
      } else if (currentTool === "text") {
        setTextInput({
          bounds: { x: point.x, y: point.y, width: 200, height: 30 },
          value: "",
          isEditing: true,
        });
      }
    },
    [
      canvasRef,
      pageData,
      zoom,
      onSignaturePlace,
      currentTool,
      elements,
      selectedElements,
      onElementToggleSelect,
      onElementSelect,
      onStartDrawing,
    ],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !pageData) return;

      const point = {
        x: (touch.clientX - rect.left) / zoom,
        y: (touch.clientY - rect.top) / zoom,
      };

      if (currentTool === "draw" && isDrawing) {
        onAddDrawPoint(point);
      } else if (isDragging && selectedElements.length > 0) {
        const deltaX = point.x - dragStart.x;
        const deltaY = point.y - dragStart.y;

        selectedElements.forEach((id) => {
          const element = elements.find((el) => el.id === id);
          if (element) {
            onElementUpdate(id, {
              bounds: {
                ...element.bounds,
                x: element.bounds.x + deltaX,
                y: element.bounds.y + deltaY,
              },
            });
          }
        });

        setDragStart(point);
      } else if (isCreatingElement && tempElement) {
        const width = Math.abs(point.x - dragStart.x);
        const height = Math.abs(point.y - dragStart.y);
        const x = Math.min(point.x, dragStart.x);
        const y = Math.min(point.y, dragStart.y);

        setTempElement({ x, y, width, height });
      }
    },
    [
      canvasRef,
      pageData,
      zoom,
      currentTool,
      isDrawing,
      isDragging,
      selectedElements,
      dragStart,
      elements,
      onAddDrawPoint,
      onElementUpdate,
      isCreatingElement,
      tempElement,
    ],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (currentTool === "draw" && isDrawing) {
        if (currentDrawPath.length > 1) {
          onElementAdd({
            type: "draw",
            pageIndex,
            bounds: {
              x:
                Math.min(...currentDrawPath.map((p) => p.x)) -
                selectedStrokeWidth,
              y:
                Math.min(...currentDrawPath.map((p) => p.y)) -
                selectedStrokeWidth,
              width:
                Math.max(...currentDrawPath.map((p) => p.x)) -
                Math.min(...currentDrawPath.map((p) => p.x)) +
                selectedStrokeWidth * 2,
              height:
                Math.max(...currentDrawPath.map((p) => p.y)) -
                Math.min(...currentDrawPath.map((p) => p.y)) +
                selectedStrokeWidth * 2,
            },
            properties: {
              paths: [currentDrawPath],
              strokeWidth: selectedStrokeWidth,
              color: selectedColor,
              opacity: 1,
            },
          } as Omit<DrawElement, "id" | "createdAt" | "updatedAt">);
        }
        onEndDrawing();
      } else if (isCreatingElement && tempElement) {
        if (tempElement.width > 5 && tempElement.height > 5) {
          onElementAdd({
            type: currentTool as "rectangle" | "circle",
            pageIndex,
            bounds: tempElement,
            properties: {
              strokeWidth: selectedStrokeWidth,
              strokeColor: selectedColor,
              fillColor: "transparent",
              opacity: 1,
            },
          } as Omit<ShapeElement, "id" | "createdAt" | "updatedAt">);
        }
        setIsCreatingElement(false);
        setTempElement(null);
      }

      setIsDragging(false);
    },
    [
      currentTool,
      isDrawing,
      currentDrawPath,
      selectedStrokeWidth,
      onElementAdd,
      pageIndex,
      selectedColor,
      onEndDrawing,
      isCreatingElement,
      tempElement,
    ],
  );

  // Handle text input completion
  const handleTextComplete = useCallback(() => {
    if (textInput && textInput.value.trim()) {
      onElementAdd({
        type: "text",
        pageIndex,
        bounds: textInput.bounds,
        properties: {
          text: textInput.value,
          fontSize: selectedFontSize,
          fontFamily: "Arial",
          fontWeight: "normal",
          color: selectedColor,
          alignment: "left",
          rotation: 0,
        },
      } as Omit<TextElement, "id" | "createdAt" | "updatedAt">);
    }
    setTextInput(null);
  }, [textInput, onElementAdd, pageIndex, selectedFontSize, selectedColor]);

  // Render elements on overlay
  const renderElement = (element: AnyElement) => {
    const isSelected = selectedElements.includes(element.id);
    const baseStyle = {
      position: "absolute" as const,
      left: element.bounds.x * zoom,
      top: element.bounds.y * zoom,
      width: element.bounds.width * zoom,
      height: element.bounds.height * zoom,
      border: isSelected ? "2px solid #3b82f6" : "1px solid transparent",
      cursor: currentTool === "select" ? "move" : "default",
      pointerEvents: "auto" as const,
      userSelect: "none" as const,
    };

    switch (element.type) {
      case "text":
        const textEl = element as TextElement;
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontSize: textEl.properties.fontSize * zoom,
              fontFamily: textEl.properties.fontFamily,
              fontWeight: textEl.properties.fontWeight,
              color: textEl.properties.color,
              textAlign: textEl.properties.alignment,
              display: "flex",
              alignItems: "center",
              padding: "2px",
              background: isSelected
                ? "rgba(59, 130, 246, 0.1)"
                : "transparent",
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element)}
            onTouchStart={(e) => handleElementTouchStart(e, element)}
          >
            {textEl.properties.text}
          </div>
        );

      case "rectangle":
        const rectEl = element as ShapeElement;
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              borderWidth: rectEl.properties.strokeWidth,
              borderColor: rectEl.properties.strokeColor,
              borderStyle: "solid",
              backgroundColor:
                rectEl.properties.fillColor === "transparent"
                  ? "transparent"
                  : rectEl.properties.fillColor,
              opacity: rectEl.properties.opacity,
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element)}
            onTouchStart={(e) => handleElementTouchStart(e, element)}
          />
        );

      case "circle":
        const circleEl = element as ShapeElement;
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              borderWidth: circleEl.properties.strokeWidth,
              borderColor: circleEl.properties.strokeColor,
              borderStyle: "solid",
              borderRadius: "50%",
              backgroundColor:
                circleEl.properties.fillColor === "transparent"
                  ? "transparent"
                  : circleEl.properties.fillColor,
              opacity: circleEl.properties.opacity,
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element)}
            onTouchStart={(e) => handleElementTouchStart(e, element)}
          />
        );

      case "signature":
        const sigEl = element as SignatureElement;
        if (
          sigEl.properties.signatureType === "draw" &&
          sigEl.properties.signatureData
        ) {
          return (
            <img
              key={element.id}
              src={sigEl.properties.signatureData}
              alt="Signature"
              style={{
                ...baseStyle,
                objectFit: "contain",
                background: isSelected
                  ? "rgba(59, 130, 246, 0.1)"
                  : "transparent",
              }}
              onMouseDown={(e) => handleElementMouseDown(e, element)}
              onTouchStart={(e) => handleElementTouchStart(e, element)}
              draggable={false}
            />
          );
        } else if (
          sigEl.properties.signatureType === "upload" &&
          sigEl.properties.signatureData
        ) {
          return (
            <img
              key={element.id}
              src={sigEl.properties.signatureData}
              alt="Signature"
              style={{
                ...baseStyle,
                objectFit: "contain",
                background: isSelected
                  ? "rgba(59, 130, 246, 0.1)"
                  : "transparent",
              }}
              onMouseDown={(e) => handleElementMouseDown(e, element)}
              onTouchStart={(e) => handleElementTouchStart(e, element)}
              draggable={false}
            />
          );
        } else if (
          sigEl.properties.signatureType === "type" &&
          sigEl.properties.signatureText
        ) {
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                fontSize: 24 * zoom,
                fontFamily: "serif",
                color: sigEl.properties.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isSelected
                  ? "rgba(59, 130, 246, 0.1)"
                  : "transparent",
              }}
              onMouseDown={(e) => handleElementMouseDown(e, element)}
              onTouchStart={(e) => handleElementTouchStart(e, element)}
            >
              {sigEl.properties.signatureText}
            </div>
          );
        } else {
          // Fallback for signatures without proper data
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                background: isSelected
                  ? "rgba(59, 130, 246, 0.1)"
                  : "rgba(255, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12 * zoom,
                color: "#666",
                border: "2px dashed #ff0000",
              }}
              onMouseDown={(e) => handleElementMouseDown(e, element)}
            >
              ✍️ Signature
            </div>
          );
        }

      default:
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              background: isSelected
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12 * zoom,
              color: "#666",
            }}
          >
            {element.type}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-96 bg-gray-50",
          className,
        )}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <span className="text-lg font-medium">Loading PDF...</span>
          <p className="text-sm text-gray-500 mt-2">Processing: {file.name}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-96 bg-red-50",
          className,
        )}
      >
        <div className="text-center text-red-600">
          <p className="text-lg font-medium mb-2">Failed to load PDF</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-gray-100 overflow-auto", className)}
      style={{ minHeight: "600px" }}
    >
      <div className="relative inline-block">
        {/* PDF Canvas */}
        <canvas
          ref={canvasRef}
          className="block border border-gray-300 shadow-lg bg-white"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: currentTool === "select" ? "default" : "crosshair",
            touchAction: "none", // Prevent scrolling on touch
          }}
        />

        {/* Elements Overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{
            width: canvasRef.current?.width || 0,
            height: canvasRef.current?.height || 0,
            pointerEvents: "none",
          }}
        >
          {elements
            .filter((el) => el.pageIndex === pageIndex)
            .map(renderElement)
            .filter(Boolean)}

          {/* Temporary Element */}
          {tempElement && (
            <div
              style={{
                position: "absolute",
                left: tempElement.x * zoom,
                top: tempElement.y * zoom,
                width: tempElement.width * zoom,
                height: tempElement.height * zoom,
                border: "2px dashed #3b82f6",
                background: "rgba(59, 130, 246, 0.1)",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Current Draw Path */}
          {isDrawing && currentDrawPath.length > 1 && (
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              <path
                d={`M ${currentDrawPath.map((p) => `${p.x * zoom},${p.y * zoom}`).join(" L ")}`}
                stroke={selectedColor}
                strokeWidth={selectedStrokeWidth * zoom}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Text Input */}
        {textInput && (
          <input
            type="text"
            value={textInput.value}
            onChange={(e) =>
              setTextInput({ ...textInput, value: e.target.value })
            }
            onBlur={handleTextComplete}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleTextComplete();
              } else if (e.key === "Escape") {
                setTextInput(null);
              }
            }}
            autoFocus
            style={{
              position: "absolute",
              left: textInput.bounds.x * zoom,
              top: textInput.bounds.y * zoom,
              width: textInput.bounds.width * zoom,
              height: textInput.bounds.height * zoom,
              fontSize: selectedFontSize * zoom,
              border: "2px solid #3b82f6",
              outline: "none",
              padding: "2px",
              background: "white",
            }}
          />
        )}
      </div>
    </div>
  );
}
