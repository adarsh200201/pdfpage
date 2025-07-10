import React, { useRef, useEffect, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentProxy } from "pdfjs-dist";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedTextEditorProps {
  pdfDocument: PDFDocumentProxy;
  currentPage: number;
  zoom: number;
  className?: string;
}

export function AdvancedTextEditor({
  pdfDocument,
  currentPage,
  zoom,
  className,
}: AdvancedTextEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [directEditMode, setDirectEditMode] = useState(false);
  const [editedTexts, setEditedTexts] = useState<Map<string, string>>(
    new Map(),
  );
  const { toast } = useToast();

  // Configure PDF.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }, []);

  // Cleanup render tasks on unmount
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (error) {
          console.warn("Could not cancel render task on unmount:", error);
        }
        renderTaskRef.current = null;
      }
    };
  }, []);

  // Make PDF text elements directly editable like Word
  const makeTextElementsEditable = useCallback(() => {
    if (!containerRef.current) return;

    // Debug: Check what elements exist
    console.log(
      "🔍 Container HTML:",
      containerRef.current.innerHTML.substring(0, 500),
    );

    // Try multiple selectors to find PDF.js text elements
    const selectors = [
      "span[data-text-item='true']", // Our manually created spans
      ".textLayer span",
      "span[role='presentation']",
      "[data-canvas-width] span",
      "span",
      ".textLayer > *",
    ];

    let textElements: NodeListOf<Element> | null = null;
    let usedSelector = "";

    for (const selector of selectors) {
      const elements = containerRef.current.querySelectorAll(selector);
      console.log(
        `🔍 Selector "${selector}": Found ${elements.length} elements`,
      );

      if (elements.length > 0) {
        textElements = elements;
        usedSelector = selector;
        break;
      }
    }

    if (!textElements || textElements.length === 0) {
      console.log("❌ No text elements found with any selector");

      // Check if text layer div exists
      const textLayerDiv = containerRef.current.querySelector(".textLayer");
      if (textLayerDiv) {
        console.log("✅ Text layer div found:", textLayerDiv);
        console.log("📝 Text layer content:", textLayerDiv.innerHTML);
      } else {
        console.log("❌ No text layer div found");
      }

      return;
    }

    console.log(
      `✅ Using selector "${usedSelector}" - Found ${textElements.length} text elements`,
    );

    textElements.forEach((element, index) => {
      const textElement = element as HTMLElement;

      // Only process text elements with actual content
      if (textElement.textContent && textElement.textContent.trim()) {
        // Set text cursor for Word-like experience
        textElement.style.cursor = "text";
        textElement.style.userSelect = "text";
        textElement.style.position = "relative";
        textElement.style.zIndex = "10";

        // Add unique ID for tracking
        const textId = `pdf-text-${currentPage}-${index}`;
        textElement.setAttribute("data-text-id", textId);

        // Add hover effect like Word
        textElement.addEventListener("mouseenter", () => {
          if (!textElement.isContentEditable) {
            textElement.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
            textElement.style.borderRadius = "2px";
          }
        });

        textElement.addEventListener("mouseleave", () => {
          if (!textElement.isContentEditable) {
            textElement.style.backgroundColor = "transparent";
          }
        });

        // Add click handler for direct editing like Word
        textElement.addEventListener("click", (e) => {
          e.stopPropagation();

          console.log(`📝 Text clicked: "${textElement.textContent}"`);

          // Make this text element directly editable
          textElement.contentEditable = "true";
          textElement.style.outline = "2px solid #3b82f6";
          textElement.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
          textElement.style.borderRadius = "2px";
          textElement.style.padding = "1px 2px";
          textElement.focus();

          // Store original text
          const originalText = textElement.textContent;

          // Select all text for immediate editing
          const range = document.createRange();
          range.selectNodeContents(textElement);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);

          // Handle finishing edit
          const finishEdit = () => {
            const newText = textElement.textContent || "";

            // Update edited texts map
            if (newText !== originalText) {
              setEditedTexts((prev) => new Map(prev.set(textId, newText)));
              console.log(`✅ Text updated: "${originalText}" → "${newText}"`);
            }

            textElement.contentEditable = "false";
            textElement.style.outline = "none";
            textElement.style.backgroundColor = "transparent";
            textElement.style.padding = "0";
            textElement.removeEventListener("blur", finishEdit);
            textElement.removeEventListener("keydown", handleKey);
          };

          const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              finishEdit();
            } else if (e.key === "Escape") {
              textElement.textContent = originalText;
              finishEdit();
            }
          };

          textElement.addEventListener("blur", finishEdit);
          textElement.addEventListener("keydown", handleKey);
        });
      }
    });

    console.log(`✅ Made ${textElements.length} text elements editable`);
  }, [currentPage]);

  // Render PDF page
  const renderPDFPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current) return;

    // Cancel any existing render task
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (error) {
        console.warn("Could not cancel previous render task:", error);
      }
      renderTaskRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const page = await pdfDocument.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get canvas context");

      // Set canvas size
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * devicePixelRatio;
      canvas.height = viewport.height * devicePixelRatio;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";

      context.scale(devicePixelRatio, devicePixelRatio);

      setPageSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Clear canvas before rendering
      context.clearRect(0, 0, viewport.width, viewport.height);

      // Render PDF background
      renderTaskRef.current = page.render({
        canvasContext: context,
        viewport,
      });

      // Wait for background render to complete
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;

      // Add text layer manually for better control
      if (directEditMode) {
        try {
          // Create text layer div
          let textLayerDiv = containerRef.current.querySelector(".textLayer");
          if (textLayerDiv) {
            textLayerDiv.remove();
          }

          textLayerDiv = document.createElement("div");
          textLayerDiv.className = "textLayer";
          textLayerDiv.style.position = "absolute";
          textLayerDiv.style.left = "0";
          textLayerDiv.style.top = "0";
          textLayerDiv.style.right = "0";
          textLayerDiv.style.bottom = "0";
          textLayerDiv.style.overflow = "hidden";
          textLayerDiv.style.opacity = "1";
          textLayerDiv.style.lineHeight = "1.0";
          textLayerDiv.style.pointerEvents = "auto";

          containerRef.current.appendChild(textLayerDiv);

          // Get text content and render it
          const textContent = await page.getTextContent();
          console.log(`📝 Text content items: ${textContent.items.length}`);

          // Create text spans manually for better control
          textContent.items.forEach((item: any, index: number) => {
            if (item.str && item.str.trim()) {
              const span = document.createElement("span");
              span.textContent = item.str;
              span.style.position = "absolute";
              span.style.whiteSpace = "pre";
              span.style.color = "rgb(0, 0, 0)";
              span.style.fontSize = `${item.height}px`;
              span.style.fontFamily = item.fontName || "sans-serif";
              span.style.left = `${item.transform[4]}px`;
              span.style.top = `${viewport.height - item.transform[5] - item.height}px`;
              span.style.cursor = "text";
              span.setAttribute("data-text-item", "true");
              span.setAttribute("data-index", index.toString());

              textLayerDiv.appendChild(span);
            }
          });

          console.log(`✅ Created ${textLayerDiv.children.length} text spans`);

          // Make elements editable after a short delay
          setTimeout(() => {
            makeTextElementsEditable();
          }, 200);
        } catch (error) {
          console.error("❌ Error creating text layer:", error);
        }
      }

      console.log("📄 PDF page rendered successfully");
    } catch (error) {
      if (error.name === "RenderingCancelledException") {
        console.log("PDF rendering was cancelled");
        return;
      }

      console.error("Error rendering PDF page:", error);
      setError("Failed to render PDF page");
      renderTaskRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [
    pdfDocument,
    currentPage,
    zoom,
    directEditMode,
    makeTextElementsEditable,
  ]);

  // Re-render when dependencies change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      renderPDFPage();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [renderPDFPage]);

  // Handle container click for adding new elements
  const handleContainerClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!directEditMode) return;
      // Could add new text elements here in the future
    },
    [directEditMode],
  );

  return (
    <div className={cn("relative w-full h-full flex flex-col", className)}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!directEditMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDirectEditMode(true);
                  toast({
                    title: "Direct editing enabled",
                    description:
                      "Click any text in the PDF to edit it like Word",
                  });
                }}
                className="flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Enable Text Editing
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-green-600">
                  <Edit className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    Text Editing Active
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDirectEditMode(false);
                    setEditedTexts(new Map());
                  }}
                  className="flex items-center"
                >
                  Exit Edit Mode
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (editedTexts.size > 0) {
                  const editsData = Array.from(editedTexts.entries()).map(
                    ([id, text]) => ({
                      id,
                      text,
                      page: currentPage,
                    }),
                  );

                  const blob = new Blob([JSON.stringify(editsData, null, 2)], {
                    type: "application/json",
                  });

                  saveAs(blob, "pdf-text-edits.json");

                  toast({
                    title: "Text edits exported",
                    description: `${editedTexts.size} edits saved to JSON file`,
                  });
                } else {
                  toast({
                    title: "No edits to export",
                    description: "Make some text edits first",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Edits
            </Button>
          </div>

          <div
            className={cn(
              "text-sm font-medium px-3 py-1 rounded-full",
              directEditMode
                ? "text-green-700 bg-green-100"
                : "text-blue-700 bg-blue-100",
            )}
          >
            {directEditMode
              ? `✅ WORD-LIKE EDITING • ${editedTexts.size} edits made • Click any text to edit`
              : "📄 ORIGINAL PDF VIEW • Enable editing to modify text like Word"}
          </div>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div
          ref={containerRef}
          className={cn(
            "relative bg-white shadow-lg mx-auto",
            directEditMode ? "cursor-text" : "cursor-default",
          )}
          style={{
            width: Math.max(pageSize.width, 800),
            height: Math.max(pageSize.height, 600),
          }}
          onClick={handleContainerClick}
        >
          {/* PDF Canvas */}
          <canvas ref={canvasRef} className="absolute top-0 left-0 z-0" />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Rendering PDF...</p>
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
    </div>
  );
}
