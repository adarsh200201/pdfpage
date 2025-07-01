import React, { useRef, useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AnyElement,
  Point,
  Bounds,
  ToolType,
  TextElement,
  DrawElement,
  ShapeElement,
  SignatureElement,
} from "@/types/pdf-editor";
import { cn } from "@/lib/utils";

interface PDFPage {
  pageIndex: number;
  canvas: HTMLCanvasElement;
  viewport: any;
  isLoaded: boolean;
  textLayer?: any[];
}

interface PDFEditorCanvasProps {
  file: File;
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
  onPageChange: (pageIndex: number) => void;
  onTotalPagesChange?: (totalPages: number) => void;
  onSignaturePlace?: (x: number, y: number) => void;
  className?: string;
}

export default function EnhancedPDFEditorCanvas({
  file,
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
  onPageChange,
  onTotalPagesChange,
  onSignaturePlace,
  className,
}: PDFEditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [totalPages, setTotalPages] = useState(0);
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
    pageIndex: number;
    originalFontSize: number;
    fontName: string;
    isExistingText: boolean;
    textIndex?: number;
  } | null>(null);
  const [hiddenTextItems, setHiddenTextItems] = useState<Set<string>>(
    new Set(),
  );
  const [currentVisiblePage, setCurrentVisiblePage] = useState(0);

  const { toast } = useToast();

  // Initialize PDF.js
  useEffect(() => {
    const loadPDF = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const pdfjsLib = await import("pdfjs-dist");

        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/",
          cMapPacked: true,
          standardFontDataUrl:
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/standard_fonts/",
          verbosity: 0,
        });

        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);

        // Notify parent component of total pages
        if (onTotalPagesChange) {
          onTotalPagesChange(pdf.numPages);
        }

        console.log(`✅ PDF loaded: ${pdf.numPages} pages`);

        toast({
          title: "PDF loaded successfully",
          description: `Document has ${pdf.numPages} pages`,
        });
      } catch (err) {
        console.error("❌ PDF loading error:", err);
        setError("Unable to load the PDF file");
        toast({
          title: "PDF loading failed",
          description: "Unable to load the PDF file",
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

  // Render all PDF pages
  useEffect(() => {
    if (!pdfDocument) return;

    const renderAllPages = async () => {
      const newPages: PDFPage[] = [];

      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdfDocument.getPage(i);
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;

          // Calculate viewport
          const viewport = page.getViewport({ scale: zoom });

          // Set canvas dimensions
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Render PDF page
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          // Extract text content for real-time editing
          const textContent = await page.getTextContent();
          const textLayer = textContent.items.map((item: any) => ({
            str: item.str,
            dir: item.dir,
            transform: item.transform,
            width: item.width,
            height: item.height,
            fontName: item.fontName,
            hasEOL: item.hasEOL,
          }));

          newPages.push({
            pageIndex: i - 1,
            canvas,
            viewport,
            isLoaded: true,
            textLayer,
          });

          console.log(`✅ Page ${i} rendered and text extracted`);
        } catch (err) {
          console.error(`Error rendering page ${i}:`, err);
          newPages.push({
            pageIndex: i - 1,
            canvas: document.createElement("canvas"),
            viewport: null,
            isLoaded: false,
          });
        }
      }

      setPages(newPages);

      // Update canvas size with total height
      const totalHeight = newPages.reduce(
        (height, page) => height + (page.viewport?.height || 0) + 20,
        0,
      );
      const maxWidth = Math.max(
        ...newPages.map((page) => page.viewport?.width || 0),
      );

      onCanvasSizeChange({
        width: maxWidth,
        height: totalHeight,
      });
    };

    renderAllPages();
  }, [pdfDocument, zoom, totalPages, onCanvasSizeChange]);

  // Handle scroll to update current page
  useEffect(() => {
    const container = containerRef.current;
    if (!container || pages.length === 0) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      let currentPage = 0;
      let cumulativeHeight = 0;

      for (let i = 0; i < pages.length; i++) {
        const pageHeight = (pages[i].viewport?.height || 0) + 20;
        if (scrollTop < cumulativeHeight + pageHeight / 2) {
          currentPage = i;
          break;
        }
        cumulativeHeight += pageHeight;
      }

      if (currentPage !== currentVisiblePage) {
        setCurrentVisiblePage(currentPage);
        onPageChange(currentPage);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [pages, currentVisiblePage, onPageChange]);

  // Get mouse position relative to container and page
  const getMousePosition = useCallback(
    (e: React.MouseEvent): { point: Point; pageIndex: number } => {
      const container = containerRef.current;
      if (!container) return { point: { x: 0, y: 0 }, pageIndex: 0 };

      const rect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const mouseY = e.clientY - rect.top + scrollTop;
      const mouseX = e.clientX - rect.left;

      // Find which page the mouse is over
      let pageIndex = 0;
      let cumulativeHeight = 0;
      let pageStartY = 0;

      for (let i = 0; i < pages.length; i++) {
        const pageHeight = (pages[i].viewport?.height || 0) + 20;
        if (mouseY < cumulativeHeight + pageHeight) {
          pageIndex = i;
          pageStartY = cumulativeHeight;
          break;
        }
        cumulativeHeight += pageHeight;
      }

      return {
        point: {
          x: mouseX / zoom,
          y: (mouseY - pageStartY) / zoom,
        },
        pageIndex,
      };
    },
    [zoom, pages],
  );

  // Handle text detection and editing (Word-like behavior)
  const handleTextClick = useCallback(
    (e: React.MouseEvent) => {
      const { point, pageIndex } = getMousePosition(e);
      const page = pages[pageIndex];

      if (!page || !page.textLayer) return;

      // Find text at clicked position
      const clickedTextIndex = page.textLayer.findIndex((textItem: any) => {
        const [a, b, c, d, tx, ty] = textItem.transform;
        const x = tx;
        const y = page.viewport.height - ty - textItem.height;
        const width = textItem.width;
        const height = textItem.height;

        return (
          point.x >= x &&
          point.x <= x + width &&
          point.y >= y &&
          point.y <= y + height
        );
      });

      if (clickedTextIndex !== -1) {
        // Found text - make it editable immediately (like Word)
        e.stopPropagation();

        const clickedText = page.textLayer[clickedTextIndex];
        const [a, b, c, d, tx, ty] = clickedText.transform;
        const x = tx;
        const y = page.viewport.height - ty - clickedText.height;

        // Calculate original font size from transform matrix
        const originalFontSize = Math.abs(clickedText.transform[0]) || 12;

        // Hide the original text while editing
        const textKey = `${pageIndex}-${clickedTextIndex}`;
        setHiddenTextItems((prev) => new Set(prev).add(textKey));

        setTextInput({
          bounds: {
            x,
            y,
            width: Math.max(clickedText.width, 100), // Minimum width for editing
            height: Math.max(clickedText.height, originalFontSize * 1.2),
          },
          value: clickedText.str,
          isEditing: true,
          pageIndex,
          originalFontSize,
          fontName: clickedText.fontName || "Arial",
          isExistingText: true,
          textIndex: clickedTextIndex,
        });

        console.log("📝 Text editing started:", {
          text: clickedText.str,
          fontSize: originalFontSize,
          font: clickedText.fontName,
        });

        return true; // Indicate text was found and editing started
      }

      return false; // No text found at this position
    },
    [getMousePosition, pages],
  );

  // Handle element mouse down for dragging
  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, element: AnyElement) => {
      e.stopPropagation();

      if (currentTool !== "select") return;

      if (e.ctrlKey || e.metaKey) {
        onElementToggleSelect(element.id);
      } else if (!selectedElements.includes(element.id)) {
        onElementSelect([element.id]);
      }

      setIsDragging(true);
      const { point } = getMousePosition(e);
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

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const { point, pageIndex } = getMousePosition(e);

      // Always check for text first (Word-like behavior)
      const textFound = handleTextClick(e);
      if (textFound) {
        return; // Text editing started, don't do anything else
      }

      if (currentTool === "select") {
        onElementSelect([]);
      } else if (currentTool === "signature" && onSignaturePlace) {
        onSignaturePlace(point.x, point.y);
      } else if (currentTool === "draw") {
        onStartDrawing(point);
      } else if (currentTool === "text") {
        setTextInput({
          bounds: {
            x: point.x,
            y: point.y,
            width: 200,
            height: selectedFontSize * 1.5,
          },
          value: "",
          isEditing: true,
          pageIndex,
          originalFontSize: selectedFontSize,
          fontName: "Arial",
          isExistingText: false,
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
      getMousePosition,
      currentTool,
      handleTextClick,
      onElementSelect,
      onSignaturePlace,
      onStartDrawing,
      selectedFontSize,
    ],
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { point } = getMousePosition(e);

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
      const { pageIndex } = getMousePosition(e);

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
      getMousePosition,
      currentTool,
      isDrawing,
      currentDrawPath,
      selectedStrokeWidth,
      onElementAdd,
      selectedColor,
      onEndDrawing,
      isCreatingElement,
      tempElement,
    ],
  );

  // Handle text input completion
  const handleTextComplete = useCallback(() => {
    if (textInput && textInput.value.trim()) {
      // Use original font size if editing existing text, otherwise use selected font size
      const fontSize = textInput.isExistingText
        ? textInput.originalFontSize
        : selectedFontSize;

      // Clean font name (remove any PDF-specific prefixes)
      const fontFamily = textInput.fontName
        ? textInput.fontName.replace(/^[A-Z]+\+/, "").split("-")[0] || "Arial"
        : "Arial";

      onElementAdd({
        type: "text",
        pageIndex: textInput.pageIndex,
        bounds: textInput.bounds,
        properties: {
          text: textInput.value,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fontWeight: "normal",
          color: selectedColor,
          alignment: "left",
          rotation: 0,
        },
      } as Omit<TextElement, "id" | "createdAt" | "updatedAt">);

      console.log("✅ Text element created:", {
        text: textInput.value,
        fontSize: fontSize,
        fontFamily: fontFamily,
        isExistingText: textInput.isExistingText,
      });
    }

    // Clean up
    if (textInput?.isExistingText && textInput.textIndex !== undefined) {
      const textKey = `${textInput.pageIndex}-${textInput.textIndex}`;
      setHiddenTextItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(textKey);
        return newSet;
      });
    }

    setTextInput(null);
  }, [textInput, onElementAdd, selectedFontSize, selectedColor]);

  // Handle text input cancellation
  const handleTextCancel = useCallback(() => {
    if (textInput?.isExistingText && textInput.textIndex !== undefined) {
      // Restore the hidden text
      const textKey = `${textInput.pageIndex}-${textInput.textIndex}`;
      setHiddenTextItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(textKey);
        return newSet;
      });
    }
    setTextInput(null);
  }, [textInput]);

  // Get Y position for a specific page
  const getPageY = (pageIndex: number) => {
    let y = 0;
    for (let i = 0; i < pageIndex; i++) {
      y += (pages[i]?.viewport?.height || 0) + 20;
    }
    return y;
  };

  // Render elements on overlay
  const renderElement = (element: AnyElement) => {
    const isSelected = selectedElements.includes(element.id);
    const pageY = getPageY(element.pageIndex);

    const baseStyle = {
      position: "absolute" as const,
      left: element.bounds.x * zoom,
      top: (pageY + element.bounds.y) * zoom,
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
          />
        );

      case "image":
        const imageEl = element as any; // ImageElement type
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              overflow: "hidden",
              opacity: imageEl.properties.opacity,
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element)}
          >
            <img
              src={imageEl.properties.imageUrl}
              alt="Inserted image"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: imageEl.properties.rotation
                  ? `rotate(${imageEl.properties.rotation}deg)`
                  : "none",
              }}
              draggable={false}
            />
          </div>
        );

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
      <div className="relative">
        {/* PDF Pages */}
        {pages.map((page) => (
          <div
            key={page.pageIndex}
            className="relative mb-5 shadow-lg bg-white mx-auto"
            style={{
              width: page.viewport?.width * zoom || 0,
              height: page.viewport?.height * zoom || 0,
            }}
          >
            <canvas
              ref={(ref) => {
                if (ref && page.canvas && page.isLoaded) {
                  const ctx = ref.getContext("2d");
                  if (ctx) {
                    ref.width = page.viewport.width * zoom;
                    ref.height = page.viewport.height * zoom;
                    ctx.scale(zoom, zoom);
                    ctx.drawImage(page.canvas, 0, 0);

                    // Hide text that's being edited by drawing white rectangles over it
                    if (page.textLayer) {
                      page.textLayer.forEach((textItem: any, index: number) => {
                        const textKey = `${page.pageIndex}-${index}`;
                        if (hiddenTextItems.has(textKey)) {
                          const [a, b, c, d, tx, ty] = textItem.transform;
                          const x = tx;
                          const y = page.viewport.height - ty - textItem.height;

                          ctx.fillStyle = "white";
                          ctx.fillRect(x, y, textItem.width, textItem.height);
                        }
                      });
                    }
                  }
                }
              }}
              className="block w-full h-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                cursor: currentTool === "select" ? "default" : "crosshair",
              }}
            />

            {/* Page Number */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {page.pageIndex + 1}
            </div>
          </div>
        ))}

        {/* Elements Overlay */}
        <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
          {elements.map(renderElement).filter(Boolean)}

          {/* Temporary Element */}
          {tempElement && (
            <div
              style={{
                position: "absolute",
                left: tempElement.x * zoom,
                top: (getPageY(currentVisiblePage) + tempElement.y) * zoom,
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
                d={`M ${currentDrawPath.map((p) => `${p.x * zoom},${(getPageY(currentVisiblePage) + p.y) * zoom}`).join(" L ")}`}
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
          <textarea
            value={textInput.value}
            onChange={(e) =>
              setTextInput({ ...textInput, value: e.target.value })
            }
            onBlur={handleTextComplete}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleTextComplete();
              } else if (e.key === "Escape") {
                handleTextCancel();
              }
            }}
            autoFocus
            style={{
              position: "absolute",
              left: textInput.bounds.x * zoom,
              top: (getPageY(textInput.pageIndex) + textInput.bounds.y) * zoom,
              width: textInput.bounds.width * zoom,
              height: textInput.bounds.height * zoom,
              fontSize: textInput.originalFontSize * zoom,
              fontFamily:
                textInput.fontName.replace(/^[A-Z]+\+/, "").split("-")[0] ||
                "Arial",
              border: "2px solid #3b82f6",
              outline: "none",
              padding: "4px",
              background: "white",
              zIndex: 1000,
              color: selectedColor,
              resize: "none",
              overflow: "hidden",
              lineHeight: "1.2",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "2px",
            }}
          />
        )}
      </div>
    </div>
  );
}
