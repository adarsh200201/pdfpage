import React, { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
  original: any;
  textId: string; // Unique identifier for tracking
}

interface EditableTextElement {
  id: string;
  textId: string; // Reference to original text
  originalIndex: number;
  text: string;
  originalText: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  isEditing: boolean;
  isModified: boolean;
  isOriginalHidden: boolean; // Track if original text is hidden
}

interface SimplePDFEditorProps {
  file: File;
  onSave?: (elements: any[]) => void;
}

export default function SimplePDFEditor({
  file,
  onSave,
}: SimplePDFEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const transparentOverlayRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [pageViewport, setPageViewport] = useState<any>(null);
  const [pdfTextItems, setPdfTextItems] = useState<PDFTextItem[]>([]);
  const [editableElements, setEditableElements] = useState<
    EditableTextElement[]
  >([]);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.5);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const renderTaskRef = useRef<any>(null);
  const { toast } = useToast();

  // Load PDF and prepare original text for direct editing
  useEffect(() => {
    const loadPDF = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");

        // Configure PDF.js worker properly
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          verbosity: 0, // Reduce console warnings
        });

        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);

        await loadPageWithEditableText(pdf, currentPage);

        toast({
          title: "✅ PDF loaded - Original text is now editable!",
          description: `Click any original text to edit it directly in place. Document has ${pdf.numPages} pages.`,
        });
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast({
          title: "Error",
          description: "Failed to load PDF",
          variant: "destructive",
        });
      }
    };

    loadPDF();

    // Cleanup on unmount
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [file, toast]);

  // Load page and make original PDF text directly editable
  const loadPageWithEditableText = async (pdf: any, pageNum: number) => {
    // Cancel any ongoing render operation
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    // Prevent concurrent renders
    if (isRendering) {
      return;
    }

    try {
      setIsRendering(true);
      const page = await pdf.getPage(pageNum);

      // Create viewport with proper rotation handling
      const viewport = page.getViewport({
        scale: zoom,
        rotation: 0,
      });
      setPageViewport(viewport);

      // First render the PDF with text layer for accurate positioning
      await renderPDFWithTextLayer(page, viewport);

      // Extract text content with enhanced options
      const textContent = await page.getTextContent({
        includeMarkedContent: true,
        disableCombineTextItems: false,
      });

      console.log(
        `📝 Total text items found on page ${pageNum}:`,
        textContent.items.length,
      );

      // Process all text items including whitespace and special characters
      const textItems: PDFTextItem[] = textContent.items
        .filter((item: any) => {
          const hasText = item.str && typeof item.str === "string";
          const hasTransform = item.transform && Array.isArray(item.transform);
          const hasValidDimensions =
            item.width !== undefined && item.height !== undefined;
          return hasText && hasTransform && hasValidDimensions;
        })
        .map((item: any, index: number) => ({
          str: item.str,
          transform: item.transform,
          width: item.width,
          height: item.height,
          fontName: item.fontName || "Arial",
          original: item,
          textId: `page-${pageNum}-text-${index}`,
        }));

      console.log(`✅ Found ${textItems.length} text items to make editable`);
      setPdfTextItems(textItems);

      // Create editable elements with improved positioning
      const elements: EditableTextElement[] = textItems
        .map((item, index) => {
          const transform = item.transform;
          if (!transform || transform.length < 6) {
            console.warn(`Invalid transform for text item ${index}:`, item.str);
            return null;
          }

          const [a, b, c, d, e, f] = transform;

          // Calculate font size from transform matrix
          const fontSize = Math.sqrt(a * a + b * b) || 12;

          // Calculate position - PDF uses bottom-left origin, convert to top-left
          const x = e;
          const y = viewport.height - f;

          console.log(
            `📍 Text "${item.str.substring(0, 20)}...": pos(${x.toFixed(1)}, ${y.toFixed(1)}) size=${fontSize.toFixed(1)}`,
          );

          return {
            id: `text-${pageNum}-${index}`,
            textId: item.textId,
            originalIndex: index,
            text: item.str,
            originalText: item.str,
            x: x,
            y: y - fontSize, // Adjust for text baseline
            fontSize: fontSize,
            fontFamily: item.fontName,
            color: "#000000",
            isEditing: false,
            isModified: false,
            isOriginalHidden: false,
          };
        })
        .filter(Boolean) as EditableTextElement[];

      console.log(`🎯 Created ${elements.length} editable text elements`);
      setEditableElements(elements);
    } catch (error) {
      console.error("Error loading page:", error);
      toast({
        title: "Error",
        description: "Failed to load page",
        variant: "destructive",
      });
    } finally {
      setIsRendering(false);
    }
  };

  // Re-load page when zoom or page changes
  useEffect(() => {
    if (pdfDocument && !isRendering) {
      loadPageWithEditableText(pdfDocument, currentPage);
    }
  }, [zoom, currentPage, pdfDocument]);

  // Render PDF with improved text layer handling
  const renderPDFWithTextLayer = async (page: any, viewport: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const context = canvas.getContext("2d")!;
    context.clearRect(0, 0, canvas.width, canvas.height);

    try {
      // Render PDF page with optimal settings
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        enableWebGL: false,
        renderInteractiveForms: false,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;

      console.log("📄 PDF page rendered successfully");
    } catch (error) {
      if (error.name !== "RenderingCancelledException") {
        console.error("Error rendering PDF:", error);
        throw error;
      }
    }
  };

  // Direct editing of original PDF text
  const handleTextClick = useCallback(
    (elementId: string) => {
      const element = editableElements.find((el) => el.id === elementId);
      if (!element) return;

      // Enable editing mode on the original text element
      setEditableElements((prev) =>
        prev.map((el) => ({
          ...el,
          isEditing: el.id === elementId,
          // Keep original text visible - we're editing it directly
        })),
      );
      setEditingElement(elementId);

      toast({
        title: "📝 Editing original PDF text",
        description:
          "Making direct changes to the PDF content. Press Enter to save.",
      });
    },
    [editableElements, toast],
  );

  // Save direct edits to original PDF text
  const saveTextEdit = useCallback(
    (elementId: string, newText: string) => {
      setEditableElements((prev) =>
        prev.map((el) => {
          if (el.id === elementId) {
            const wasModified = newText !== el.originalText;
            return {
              ...el,
              text: newText, // This directly updates the original text
              isEditing: false,
              isModified: wasModified,
              // Original text is now the modified text - no hiding
            };
          }
          return el;
        }),
      );
      setEditingElement(null);

      toast({
        title: "✅ Original PDF text updated",
        description: "Direct modifications applied to PDF content",
      });
    },
    [toast],
  );

  // Cancel editing and keep current state
  const cancelEdit = useCallback((elementId: string) => {
    setEditableElements((prev) =>
      prev.map((el) => ({
        ...el,
        isEditing: false,
      })),
    );
    setEditingElement(null);
  }, []);

  // Reset original PDF text to its initial state
  const resetTextToOriginal = useCallback(
    (elementId: string) => {
      setEditableElements((prev) =>
        prev.map((el) => {
          if (el.id === elementId) {
            return {
              ...el,
              text: el.originalText, // Restore original PDF text
              isModified: false,
              isEditing: false,
            };
          }
          return el;
        }),
      );

      toast({
        title: "🔄 Original PDF text restored",
        description: "Text reverted to original PDF content",
      });
    },
    [toast],
  );

  // Delete original PDF text (make it empty)
  const deleteText = useCallback(
    (elementId: string) => {
      setEditableElements((prev) =>
        prev.map((el) => {
          if (el.id === elementId) {
            return {
              ...el,
              text: "", // Empty the original text
              isModified: true,
              isEditing: false,
            };
          }
          return el;
        }),
      );

      toast({
        title: "🗑️ Original PDF text deleted",
        description: "Text removed from original PDF content",
      });
    },
    [toast],
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  // Page navigation
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  // Enhanced save with text replacement data
  const handleSave = useCallback(() => {
    const modifiedElements = editableElements.filter((el) => el.isModified);

    // Create export data with both original and new text information
    const elementsForExport = modifiedElements.map((el) => {
      const originalTextItem = pdfTextItems.find(
        (item) => item.textId === el.textId,
      );

      return {
        ...el,
        pageIndex: currentPage - 1, // 0-based for pdf-lib
        type: "text",
        bounds: {
          x: el.x,
          y: pageViewport ? pageViewport.height - el.y - el.fontSize : el.y, // Convert back to PDF coordinates
          width: el.text.length * (el.fontSize * 0.6),
          height: el.fontSize,
        },
        properties: {
          text: el.text,
          originalText: el.originalText,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily,
          color: el.color,
          isReplacement: true,
          originalTextId: el.textId,
          originalTransform: originalTextItem?.transform,
          isTextReplacement: true, // Flag for the export function
        },
      };
    });

    console.log("🔄 Exporting text replacements:", elementsForExport);

    onSave?.(elementsForExport);

    toast({
      title: "💾 PDF saved with text edits",
      description: `${modifiedElements.length} text replacements will be applied to the PDF`,
    });
  }, [
    editableElements,
    currentPage,
    onSave,
    toast,
    pdfTextItems,
    pageViewport,
  ]);

  return (
    <div className="relative bg-gray-100 p-4">
      {/* Direct PDF text editing instruction banner */}
      <div className="mb-4 text-center">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 inline-block max-w-2xl">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            📝 Direct PDF Text Editing
          </h3>
          <p className="text-sm text-blue-700">
            <strong>Click any original PDF text</strong> to edit it directly in
            place • <strong>Enter</strong> to save • <strong>Escape</strong> to
            cancel
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            You're editing the actual PDF text content - no overlay, just direct
            modification!
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            ← Previous
          </Button>
          <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            Next →
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm px-2">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          {editableElements.length} text items found •{" "}
          {editableElements.filter((el) => el.isModified).length} modified
        </div>
      </div>

      <div className="relative inline-block bg-white shadow-lg rounded-lg overflow-hidden">
        {/* PDF Canvas */}
        <canvas
          ref={canvasRef}
          className="block"
          style={{ maxWidth: "100%", height: "auto" }}
        />

        {/* Text overlay to show edited text */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 5,
            pointerEvents: "none",
            background: "transparent",
          }}
        >
          {editableElements.map((element) =>
            element.isModified && !element.isEditing ? (
              <div
                key={`overlay-${element.id}`}
                style={{
                  position: "absolute",
                  left: element.x,
                  top: element.y,
                  fontSize: element.fontSize,
                  fontFamily: element.fontFamily,
                  color: element.color,
                  whiteSpace: "pre",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  padding: "1px 2px",
                  borderRadius: "2px",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                }}
              >
                {element.text}
              </div>
            ) : null,
          )}
        </div>

        {/* Invisible click layer for original text editing */}
        <div
          ref={transparentOverlayRef}
          className="absolute inset-0"
          style={{
            zIndex: 10,
            pointerEvents: editingElement ? "none" : "auto",
            background: "transparent",
          }}
        >
          {console.log(
            `🖱️ Rendering ${editableElements.length} clickable areas`,
          )}
          {editableElements.map((element) => (
            <div key={element.id}>
              {!element.isEditing && element.text.trim() && (
                // Invisible clickable area over original text
                <div
                  style={{
                    position: "absolute",
                    left: element.x - 1,
                    top: element.y - 1,
                    width: Math.max(
                      element.text.length * (element.fontSize * 0.55), // More accurate width calculation
                      element.text.length * 8, // Minimum width based on character count
                      30,
                    ),
                    height: element.fontSize + 2,
                    cursor: "text",
                    background: "transparent",
                    border: "none",
                    borderRadius: "2px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    // More visible green hover indicator for debugging
                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.3)";
                    e.currentTarget.style.border =
                      "2px solid rgba(34, 197, 94, 0.8)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(34, 197, 94, 0.5)";
                    console.log(`🟢 Hovering over text: "${element.text}"`);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.border = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onClick={() => {
                    console.log(
                      `📝 Clicked text: "${element.text}" at position x=${element.x}, y=${element.y}`,
                    );
                    handleTextClick(element.id);
                  }}
                  title={`Click to edit: "${element.text}"`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Only show edit input when editing - NO text overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{ pointerEvents: "none", zIndex: 20 }}
        >
          {editableElements.map(
            (element) =>
              element.isEditing && (
                <div key={element.id} className="relative">
                  {/* Direct editing input over original PDF text */}
                  <input
                    type="text"
                    defaultValue={element.text}
                    autoFocus
                    onBlur={(e) => saveTextEdit(element.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        saveTextEdit(element.id, e.currentTarget.value);
                      } else if (e.key === "Escape") {
                        cancelEdit(element.id);
                      }
                    }}
                    style={{
                      position: "absolute",
                      left: element.x,
                      top: element.y,
                      fontSize: element.fontSize,
                      fontFamily: element.fontFamily,
                      color: "#000",
                      border: "2px solid #22c55e",
                      outline: "none",
                      padding: "1px 3px",
                      background: "rgba(255, 255, 255, 0.95)",
                      minWidth: Math.max(
                        element.text.length * (element.fontSize * 0.55),
                        element.text.length * 8,
                        80,
                      ),
                      height: element.fontSize + 4,
                      borderRadius: "3px",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)",
                      pointerEvents: "auto",
                      zIndex: 30,
                    }}
                  />
                  {/* Edit controls */}
                  <div
                    style={{
                      position: "absolute",
                      left:
                        element.x +
                        Math.max(
                          element.text.length * (element.fontSize * 0.55),
                          element.text.length * 8,
                          80,
                        ) +
                        8,
                      top: element.y,
                      zIndex: 31,
                      pointerEvents: "auto",
                    }}
                    className="flex items-center space-x-1"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resetTextToOriginal(element.id)}
                      className="h-5 w-5 p-0 bg-white shadow-sm hover:bg-gray-50"
                      title="Reset"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteText(element.id)}
                      className="h-5 w-5 p-0 bg-white shadow-sm hover:bg-red-50 text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ),
          )}
        </div>
      </div>

      {/* Direct PDF save section */}
      <div className="mt-6 text-center">
        <Button
          onClick={handleSave}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-base font-medium shadow-lg"
          disabled={!editableElements.some((el) => el.isModified)}
        >
          💾 Save PDF with Direct Text Edits (
          {editableElements.filter((el) => el.isModified).length} modified)
        </Button>

        <p className="text-xs text-gray-500 mt-2">
          Your direct modifications to the original PDF text will be applied to
          the final document
        </p>
      </div>
    </div>
  );
}
