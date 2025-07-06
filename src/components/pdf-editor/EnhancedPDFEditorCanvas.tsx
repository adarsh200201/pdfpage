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
    existingElementId?: string; // Track existing element being edited
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
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
          standardFontDataUrl:
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/",
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

          // Calculate viewport with higher scale for better quality and larger display
          const viewport = page.getViewport({ scale: zoom * 1.5 });

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

          console.log(`📝 Page ${i} text layer extracted:`, {
            totalItems: textLayer.length,
            sampleItems: textLayer.slice(0, 3).map((item) => ({
              text: item.str,
              transform: item.transform,
            })),
          });

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

  // Get mouse position relative to canvas - simplified for direct text editing
  const getMousePosition = useCallback(
    (e: React.MouseEvent): { point: Point; pageIndex: number } => {
      const target = e.currentTarget as HTMLCanvasElement;
      if (!target) return { point: { x: 0, y: 0 }, pageIndex: 0 };

      const rect = target.getBoundingClientRect();
      const pageIndex = parseInt(target.getAttribute("data-page-index") || "0");

      // Get exact mouse position on the canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert to PDF coordinates (no zoom division since we already account for zoom in rendering)
      const point = {
        x: mouseX,
        y: mouseY,
      };

      console.log("📍 Mouse click:", {
        mouseX,
        mouseY,
        point,
        pageIndex,
        canvasSize: { width: rect.width, height: rect.height },
      });

      return { point, pageIndex };
    },
    [],
  );

  // Handle text detection and editing (Word-like behavior)
  const handleTextClick = useCallback(
    (e: React.MouseEvent) => {
      console.log("🎯 TEXT CLICK HANDLER CALLED!");

      // First check if clicking on an existing text element
      const { point, pageIndex } = getMousePosition(e);

      console.log("🔍 Text click attempt:", {
        point,
        pageIndex,
        currentTool,
        zoom,
        hasPages: pages.length > 0,
        elementsCount: elements.length,
        pagesWithTextLayers: pages.map((p) => ({
          pageIndex: p.pageIndex,
          hasTextLayer: !!p.textLayer,
          textCount: p.textLayer?.length || 0,
        })),
      });

      // Check for existing text elements first (our editable ones)
      const existingTextElement = elements.find((element) => {
        if (element.type !== "text" || element.pageIndex !== pageIndex)
          return false;

        const bounds = element.bounds;
        const isInBounds =
          point.x >= bounds.x &&
          point.x <= bounds.x + bounds.width &&
          point.y >= bounds.y &&
          point.y <= bounds.y + bounds.height;

        if (isInBounds) {
          console.log("📝 Found existing text element:", element);
        }

        return isInBounds;
      }) as TextElement | undefined;

      if (existingTextElement) {
        // Edit existing text element directly
        e.stopPropagation();

        setTextInput({
          bounds: existingTextElement.bounds,
          value: existingTextElement.properties.text,
          isEditing: true,
          pageIndex,
          originalFontSize: existingTextElement.properties.fontSize,
          fontName: existingTextElement.properties.fontFamily,
          isExistingText: true,
          existingElementId: existingTextElement.id, // Track which element we're editing
        });

        console.log("📝 Editing existing text element:", {
          text: existingTextElement.properties.text,
          fontSize: existingTextElement.properties.fontSize,
          font: existingTextElement.properties.fontFamily,
        });

        return true;
      }

      // Then check PDF's original text layer
      const page = pages[pageIndex];
      if (!page || !page.textLayer) {
        console.log("❌ No page or text layer found:", {
          hasPage: !!page,
          hasTextLayer: !!page?.textLayer,
          pageIndex,
          totalPages: pages.length,
        });
        return false;
      }

      console.log(
        "🔍 Checking PDF text layer with",
        page.textLayer.length,
        "items",
      );

      // Always log first few text items for debugging
      console.log(
        "📋 First 3 text items:",
        page.textLayer.slice(0, 3).map((item, i) => ({
          index: i,
          text: `"${item.str}"`,
          transform: item.transform,
        })),
      );

      // Simplified text detection - use direct PDF coordinates
      const clickedTextIndex = page.textLayer.findIndex(
        (textItem: any, index: number) => {
          if (!textItem.str || textItem.str.trim() === "") return false;

          const [scaleX, skewY, skewX, scaleY, tx, ty] = textItem.transform;

          // Simplified coordinate mapping - convert PDF text coords to canvas coords
          const fontSize = Math.abs(scaleY) || 12;
          const textX = tx;
          const textY = page.viewport.height - ty - fontSize; // Convert PDF Y to canvas Y
          const textWidth =
            textItem.width || textItem.str.length * fontSize * 0.6;
          const textHeight = fontSize;

          // Convert click point to PDF coordinates (simpler approach)
          const pdfClickX = point.x / zoom;
          const pdfClickY = point.y / zoom; // Use direct Y coordinate without flipping

          // EXTREMELY large padding for guaranteed detection (200px!)
          const padding = 200;
          const isInBounds =
            pdfClickX >= textX - padding &&
            pdfClickX <= textX + textWidth + padding &&
            pdfClickY >= textY - textHeight - padding &&
            pdfClickY <= textY + padding;

          // Calculate distance for fallback
          const centerX = textX + textWidth / 2;
          const centerY = textY - textHeight / 2;
          const distance = Math.sqrt(
            (pdfClickX - centerX) ** 2 + (pdfClickY - centerY) ** 2,
          );

          // Always log first 3 items and any matches with DETAILED coordinates
          if (index < 3 || isInBounds || distance < 150) {
            console.log(
              `📍 Text ${index} "${textItem.str.trim()}" ${isInBounds ? "✅ MATCH!" : "❌"} (dist: ${Math.round(distance)}):`,
              {
                textBounds: `x:${Math.round(textX)} y:${Math.round(textY)} w:${Math.round(textWidth)} h:${Math.round(textHeight)}`,
                clickPos: `pdf(${Math.round(pdfClickX)},${Math.round(pdfClickY)}) canvas(${Math.round(point.x)},${Math.round(point.y)})`,
                conditions: {
                  xOK:
                    pdfClickX >= textX - padding &&
                    pdfClickX <= textX + textWidth + padding,
                  yOK:
                    pdfClickY >= textY - textHeight - padding &&
                    pdfClickY <= textY + padding,
                  distance: Math.round(distance),
                },
              },
            );
          }

          // Accept if within distance (much more reliable than coordinate bounds)
          return distance < 400; // Very generous 400px threshold

          return isInBounds;
        },
      );

      if (clickedTextIndex !== -1) {
        // Found PDF text - make it editable
        e.stopPropagation();

        const clickedText = page.textLayer[clickedTextIndex];
        const [scaleX, skewY, skewX, scaleY, tx, ty] = clickedText.transform;

        // Use PDF coordinates (these will be converted to canvas coordinates in render)
        const x = tx;
        const y = page.viewport.height - ty - Math.abs(scaleY);
        const originalFontSize = Math.abs(scaleY) || 12;
        const width =
          clickedText.width || Math.abs(scaleX) * clickedText.str.length * 0.6;
        const height = Math.abs(scaleY) || originalFontSize;

        // Hide the original text while editing
        const textKey = `${pageIndex}-${clickedTextIndex}`;
        setHiddenTextItems((prev) => new Set(prev).add(textKey));

        setTextInput({
          bounds: {
            x,
            y,
            width: Math.max(width, 100),
            height: Math.max(height, originalFontSize * 1.2),
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

        console.log("✅ PDF text editing started:", clickedText.str);
        return true;
      }

      console.log("❌ No text found at click position");
      return false;
    },
    [getMousePosition, pages, elements],
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
      console.log("🖱️ Canvas clicked:", { currentTool });

      // Re-enable text detection for direct editing
      const textFound = handleTextClick(e);
      if (textFound) {
        return; // Text editing started
      }

      const { point, pageIndex } = getMousePosition(e);

      if (currentTool === "select") {
        onElementSelect([]);
      } else if (currentTool === "signature" && onSignaturePlace) {
        onSignaturePlace(point.x, point.y);
      } else if (currentTool === "draw") {
        onStartDrawing(point);
      } else if (currentTool === "text") {
        // Create new text if no existing text was clicked
        setTextInput({
          bounds: {
            x: point.x / zoom, // Convert to PDF coordinates
            y: point.y / zoom,
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
        setTempElement({
          x: point.x / zoom,
          y: point.y / zoom,
          width: 0,
          height: 0,
        });
        setDragStart({ x: point.x / zoom, y: point.y / zoom });
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
      zoom,
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

  // Find text element at clicked position
  const findTextAtPosition = useCallback(
    (point: Point, pageIndex: number) => {
      if (!pages[pageIndex] || !pages[pageIndex].textLayer) return null;

      const textLayer = pages[pageIndex].textLayer;
      if (!textLayer) return null;

      // Check text layer items for collision
      for (const textItem of textLayer) {
        const textBounds = {
          x: textItem.transform[4],
          y:
            pages[pageIndex].viewport.height -
            textItem.transform[5] -
            textItem.height,
          width: textItem.width,
          height: textItem.height,
        };

        // Check if click is within text bounds (with some padding for easier selection)
        const padding = 5;
        if (
          point.x >= textBounds.x - padding &&
          point.x <= textBounds.x + textBounds.width + padding &&
          point.y >= textBounds.y - padding &&
          point.y <= textBounds.y + textBounds.height + padding
        ) {
          console.log("📝 Found clickable text:", {
            text: textItem.str,
            bounds: textBounds,
            fontSize: textItem.transform[0],
            fontName: textItem.fontName,
          });

          return {
            text: textItem.str.trim(),
            x: textBounds.x,
            y: textBounds.y,
            width: textBounds.width,
            height: textBounds.height,
            fontSize: textItem.transform[0],
            fontName: textItem.fontName,
          };
        }
      }

      return null;
    },
    [pages],
  );

  // Handle text input completion
  const handleTextComplete = useCallback(() => {
    if (!textInput || !textInput.value.trim()) {
      // Handle empty text - restore original if needed
      handleTextCancel();
      return;
    }

    if (textInput.existingElementId) {
      // Update existing text element instead of creating new one
      const fontSize = textInput.originalFontSize;
      const fontFamily = textInput.fontName || "Arial";

      onElementUpdate(textInput.existingElementId, {
        properties: {
          text: textInput.value,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fontWeight: "normal",
          color: selectedColor,
          alignment: "left",
          rotation: 0,
        },
        bounds: {
          x: textInput.bounds.x,
          y: textInput.bounds.y,
          width: Math.max(
            textInput.bounds.width,
            textInput.value.length * fontSize * 0.6,
          ),
          height: textInput.bounds.height,
        },
      });

      console.log("✅ Text element updated:", {
        id: textInput.existingElementId,
        text: textInput.value,
        fontSize: fontSize,
        fontFamily: fontFamily,
      });
    } else {
      // Create new text element
      const fontSize = textInput.isExistingText
        ? textInput.originalFontSize
        : selectedFontSize;

      const fontFamily = textInput.isExistingText
        ? textInput.fontName || "Arial"
        : "Arial";

      onElementAdd({
        type: "text",
        pageIndex: textInput.pageIndex,
        bounds: {
          x: textInput.bounds.x,
          y: textInput.bounds.y,
          width: Math.max(
            textInput.bounds.width,
            textInput.value.length * fontSize * 0.6,
          ),
          height: textInput.bounds.height,
        },
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

      // For PDF text that was replaced, keep it hidden permanently
      if (textInput.isExistingText && textInput.textIndex !== undefined) {
        // Keep the PDF text hidden since we created a replacement
      }
    }

    setTextInput(null);
  }, [
    textInput,
    onElementAdd,
    onElementUpdate,
    selectedFontSize,
    selectedColor,
  ]);

  // Handle text input cancellation
  const handleTextCancel = useCallback(() => {
    if (
      textInput?.isExistingText &&
      textInput.textIndex !== undefined &&
      !textInput.existingElementId
    ) {
      // Only restore PDF text if we were editing original PDF text (not our elements)
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
        // Hide the element if it's currently being edited
        const isBeingEdited = textInput?.existingElementId === element.id;
        if (isBeingEdited) return null;

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
              cursor:
                currentTool === "select" || currentTool === "text"
                  ? "text"
                  : "default",
              // Add subtle hover effect for editable text
              transition: "all 0.2s ease",
            }}
            onMouseDown={(e) => {
              // For text tool or select tool, enable direct editing
              if (currentTool === "text" || currentTool === "select") {
                e.stopPropagation();
                handleTextClick(e);
              } else {
                handleElementMouseDown(e, element);
              }
            }}
            onMouseEnter={(e) => {
              if (currentTool === "text" || currentTool === "select") {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              if (currentTool === "text" || currentTool === "select") {
                e.currentTarget.style.background = isSelected
                  ? "rgba(59, 130, 246, 0.1)"
                  : "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
            title={
              currentTool === "text" || currentTool === "select"
                ? "Click to edit text"
                : "Text element"
            }
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
              data-page-index={page.pageIndex}
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
              onMouseDown={(e) => {
                // Only handle canvas clicks if not clicking on text overlays
                const target = e.target as HTMLElement;
                if (target.tagName === "CANVAS") {
                  console.log("🖱️ Canvas background clicked");
                  handleMouseDown(e);
                }
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                cursor:
                  currentTool === "select" || currentTool === "text"
                    ? "text"
                    : "crosshair",
              }}
            />

            {/* Page Number */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {page.pageIndex + 1}
            </div>

            {/* Text Input for this page */}
            {textInput && textInput.pageIndex === page.pageIndex && (
              <textarea
                value={textInput.value}
                onChange={(e) => {
                  setTextInput({ ...textInput, value: e.target.value });
                  // Auto-resize height based on content
                  const lines = e.target.value.split("\n").length;
                  const lineHeight = textInput.originalFontSize * zoom * 1.2;
                  const newHeight = Math.max(
                    textInput.bounds.height * zoom,
                    lines * lineHeight,
                  );
                  e.target.style.height = `${newHeight}px`;
                }}
                onBlur={handleTextComplete}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleTextComplete();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    handleTextCancel();
                  } else if (e.key === "Tab") {
                    e.preventDefault();
                    // Insert tab character or move to next element
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const newValue =
                      textInput.value.substring(0, start) +
                      "    " +
                      textInput.value.substring(end);
                    setTextInput({ ...textInput, value: newValue });
                    // Set cursor position after the inserted spaces
                    setTimeout(() => {
                      e.currentTarget.selectionStart =
                        e.currentTarget.selectionEnd = start + 4;
                    }, 0);
                  }
                }}
                autoFocus
                style={{
                  position: "absolute",
                  left: textInput.bounds.x * zoom,
                  top: textInput.bounds.y * zoom,
                  width: textInput.bounds.width * zoom,
                  minHeight: textInput.bounds.height * zoom,
                  fontSize: textInput.originalFontSize * zoom,
                  fontFamily: textInput.fontName || "Arial",
                  border: textInput.existingElementId
                    ? "3px solid #10b981" // Green for editing existing elements
                    : textInput.isExistingText
                      ? "3px solid #f59e0b" // Orange for editing PDF text
                      : "3px solid #3b82f6", // Blue for new text
                  outline: "none",
                  padding: "4px",
                  background: textInput.existingElementId
                    ? "rgba(236, 253, 245, 0.95)" // Light green
                    : textInput.isExistingText
                      ? "rgba(255, 251, 235, 0.95)" // Light orange
                      : "rgba(240, 249, 255, 0.95)", // Light blue
                  zIndex: 99999,
                  color: selectedColor,
                  resize: "none",
                  overflow: "hidden",
                  lineHeight: "1.2",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                  borderRadius: "4px",
                  transform: "translateZ(0)",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  cursor: "text",
                }}
                placeholder={
                  textInput.existingElementId
                    ? "Edit existing text..."
                    : textInput.isExistingText
                      ? "Edit PDF text..."
                      : "Type new text..."
                }
                onFocus={(e) => {
                  // Select all text on focus for easy replacement
                  if (textInput.isExistingText || textInput.existingElementId) {
                    e.target.select();
                  }
                }}
              />
            )}
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

        {/* Text Editing Active Indicator */}
        {textInput && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: textInput.existingElementId
                ? "#10b981" // Green for editing elements
                : textInput.isExistingText
                  ? "#f59e0b" // Orange for editing PDF text
                  : "#3b82f6", // Blue for new text
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              zIndex: 100000,
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {textInput.existingElementId
              ? "✏️ Editing Element"
              : textInput.isExistingText
                ? "📝 Editing PDF Text"
                : "➕ Adding New Text"}
            <div style={{ fontSize: "12px", opacity: 0.9 }}>
              Press Enter to save, Esc to cancel
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
