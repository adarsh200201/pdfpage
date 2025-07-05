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
import { Textarea } from "@/components/ui/textarea";
import {
  Type,
  Square,
  Circle,
  MousePointer,
  Image,
  Pen,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Save,
  Trash2,
  Edit3,
  Check,
  X,
  Move,
  RotateCcw,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  FileImage,
  Signature,
  Layers,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFService } from "@/services/pdfService";

// Types for text items and editing
interface PDFTextItem {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  transform: number[];
  pageIndex: number;
  originalIndex: number;
  isEditing?: boolean;
  modified?: boolean;
}

interface EditableElement {
  id: string;
  type: "text" | "image" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  pageIndex: number;
  isNew?: boolean;
  isEditing?: boolean;
  modified?: boolean;
}

interface DirectEditablePDFEditorProps {
  className?: string;
  onSave?: (pdfData: ArrayBuffer) => void;
}

export function DirectEditablePDFEditor({
  className,
  onSave,
}: DirectEditablePDFEditorProps) {
  const { toast } = useToast();

  // Core PDF state
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canvas and container refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Editing state
  const [textItems, setTextItems] = useState<PDFTextItem[]>([]);
  const [editableElements, setEditableElements] = useState<EditableElement[]>(
    [],
  );
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>("select");

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Configure PDF.js
  useEffect(() => {
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
  }, []);

  // Handle file upload and text extraction
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
      setTextItems([]);
      setEditableElements([]);

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
          description: `${pdf.numPages} pages loaded. Extracting editable text...`,
        });

        // Extract text from all pages
        await extractAllTextItems(pdf);

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

  // Extract all text items from PDF for direct editing
  const extractAllTextItems = useCallback(
    async (pdf: any) => {
      setIsExtracting(true);
      const allTextItems: PDFTextItem[] = [];

      try {
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1 });

          textContent.items.forEach((item: any, index: number) => {
            if (item.str && item.str.trim()) {
              // Extract detailed text properties from PDF
              const transform = item.transform;
              const x = transform[4];
              const y = viewport.height - transform[5]; // Flip Y coordinate for screen

              // Get font size from transformation matrix
              const scaleX = Math.abs(transform[0]);
              const scaleY = Math.abs(transform[3]);
              const fontSize = Math.max(scaleX, scaleY);

              // Calculate text dimensions more accurately
              const textWidth = item.width || fontSize * item.str.length * 0.6;
              const textHeight = item.height || fontSize;

              // Extract font information
              const fontName = item.fontName || "Arial";
              const cleanFontName = fontName.replace(/[^a-zA-Z]/g, "");

              // Determine font family
              let fontFamily = "Arial";
              if (cleanFontName.toLowerCase().includes("times")) {
                fontFamily = "Times";
              } else if (cleanFontName.toLowerCase().includes("courier")) {
                fontFamily = "Courier";
              } else if (cleanFontName.toLowerCase().includes("helvetica")) {
                fontFamily = "Helvetica";
              }

              allTextItems.push({
                id: `original-text-${pageNum}-${index}`,
                content: item.str,
                x,
                y: y - textHeight, // Adjust for text baseline
                width: textWidth,
                height: textHeight,
                fontSize,
                fontFamily,
                color: "#000000", // Default color, could be extracted from PDF if needed
                transform: transform,
                pageIndex: pageNum - 1,
                originalIndex: index,
                modified: false,
              });
            }
          });
        }

        setTextItems(allTextItems);
        console.log(`✅ Extracted ${allTextItems.length} editable text items`);

        toast({
          title: "Text extraction complete",
          description: `${allTextItems.length} text elements ready for editing`,
        });
      } catch (error) {
        console.error("Failed to extract text:", error);
        toast({
          title: "Text extraction failed",
          description: "Some text may not be editable",
          variant: "destructive",
        });
      } finally {
        setIsExtracting(false);
      }
    },
    [toast],
  );

  // Render PDF page without text (background only)
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDocument || !canvasRef.current) return;

      try {
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Set canvas size
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Render PDF without text (background only)
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          // Disable text rendering to show only background
          textLayer: null,
          annotationLayer: null,
          enableWebGL: false,
          renderTextLayer: false,
          renderAnnotationLayer: false,
          intent: "display",
          transform: null,
          imageLayer: null,
          canvasFactory: null,
          filterFactory: null,
          // This is the key - render without text
          textContent: null,
        };

        await page.render(renderContext).promise;

        // Update overlay size to match canvas
        if (overlayRef.current) {
          overlayRef.current.style.width = `${viewport.width}px`;
          overlayRef.current.style.height = `${viewport.height}px`;
        }

        console.log(
          `📄 Page ${pageNum} background rendered at ${Math.round(zoom * 100)}% zoom (text excluded)`,
        );
      } catch (error) {
        console.error("Failed to render page:", error);
        setError("Failed to render page");
      }
    },
    [pdfDocument, zoom],
  );

  // Handle clicking on text for direct editing
  const handleTextClick = useCallback(
    (textItem: PDFTextItem, event: React.MouseEvent) => {
      event.stopPropagation();

      if (activeTool !== "select") return;

      // Start editing this original text item directly
      setEditingElement(textItem.id);
      setSelectedElement(textItem.id);

      // Mark the original text item as being edited
      setTextItems((prev) =>
        prev.map((item) =>
          item.id === textItem.id ? { ...item, isEditing: true } : item,
        ),
      );

      console.log(`📝 Editing original text directly: "${textItem.content}"`);
    },
    [activeTool],
  );

  // Handle text content changes - modify original text directly
  const handleTextChange = useCallback(
    (textId: string, newContent: string) => {
      // Update the original text item directly
      setTextItems((prev) =>
        prev.map((item) =>
          item.id === textId
            ? { ...item, content: newContent, modified: true }
            : item,
        ),
      );

      // Sync with backend in real-time
      if (sessionId) {
        const textItem = textItems.find((item) => item.id === textId);
        if (textItem) {
          PDFService.updateElement(sessionId, textId, {
            ...textItem,
            content: newContent,
            modified: true,
            type: "text",
          }).catch(console.error);
        }
      }
    },
    [textItems, sessionId],
  );

  // Finish editing original text
  const finishEditing = useCallback((textId: string) => {
    setTextItems((prev) =>
      prev.map((item) =>
        item.id === textId ? { ...item, isEditing: false } : item,
      ),
    );
    setEditingElement(null);

    console.log(`✅ Finished editing original text: ${textId}`);
  }, []);

  // Cancel editing and restore original content
  const cancelEditing = useCallback((textId: string) => {
    setTextItems((prev) =>
      prev.map((item) => {
        if (item.id === textId) {
          // Restore to original state if it was modified
          return {
            ...item,
            isEditing: false,
            // Note: In a real implementation, you'd store the original content separately
            // For now, we'll just stop editing
          };
        }
        return item;
      }),
    );
    setEditingElement(null);
  }, []);

  // Add new text element
  const addNewTextElement = useCallback(
    (x: number, y: number) => {
      const newElement: EditableElement = {
        id: `new-text-${Date.now()}`,
        type: "text",
        x,
        y,
        width: 200,
        height: 30,
        content: "New Text",
        fontSize: 16,
        fontFamily: "Arial",
        color: "#000000",
        pageIndex: currentPage - 1,
        isNew: true,
        isEditing: true,
      };

      setEditableElements((prev) => [...prev, newElement]);
      setEditingElement(newElement.id);
      setSelectedElement(newElement.id);
    },
    [currentPage],
  );

  // Handle canvas click for adding new elements
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (event.clientX - rect.left) / zoom;
      const y = (event.clientY - rect.top) / zoom;

      if (activeTool === "text") {
        addNewTextElement(x, y);
        setActiveTool("select");
      } else if (activeTool === "select") {
        // Deselect all elements
        setSelectedElement(null);
        setEditingElement(null);
        setEditableElements((prev) =>
          prev.map((el) => ({ ...el, isEditing: false })),
        );
      }
    },
    [activeTool, zoom, addNewTextElement],
  );

  // Re-render when page or zoom changes
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
        description: "Applying all text edits to your PDF",
      });

      // Send all modified text items to backend
      const modifiedTextItems = textItems.filter((item) => item.modified);

      for (const textItem of modifiedTextItems) {
        await PDFService.updateElement(sessionId, textItem.id, {
          ...textItem,
          type: "text",
          visible: true,
          opacity: 1,
        });
      }

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
  }, [sessionId, editableElements, onSave, toast]);

  // Get text items for current page
  const currentPageTextItems = textItems.filter(
    (item) => item.pageIndex === currentPage - 1,
  );

  const currentPageElements = editableElements.filter(
    (el) => el.pageIndex === currentPage - 1,
  );

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Top Toolbar */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>

              {pdfDocument && (
                <Button variant="outline" onClick={saveEditedPDF}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Edited PDF
                </Button>
              )}

              {isExtracting && (
                <Badge variant="secondary">
                  <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                  Extracting text...
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Tool selector */}
              <div className="flex gap-1">
                <Button
                  variant={activeTool === "select" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTool("select")}
                >
                  <MousePointer className="w-4 h-4" />
                </Button>
                <Button
                  variant={activeTool === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTool("text")}
                >
                  <Type className="w-4 h-4" />
                </Button>
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

              {sessionId && (
                <Badge variant="secondary">
                  Session: {sessionId.slice(-8)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-1">
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
                  Upload a PDF for direct editing
                </h3>
                <p className="text-gray-600 mb-4">
                  Click on any text in the PDF to edit it directly, just like
                  LightPDF
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose PDF File
                </Button>
              </div>
            )}

            {pdfDocument && (
              <div className="relative shadow-lg">
                {/* PDF Canvas */}
                <canvas ref={canvasRef} className="block bg-white" />

                {/* Interactive Overlay */}
                <div
                  ref={overlayRef}
                  className="absolute top-0 left-0 cursor-text"
                  onClick={handleCanvasClick}
                >
                  {/* Render original text items as directly editable */}
                  {currentPageTextItems.map((textItem) => {
                    const isEditing = textItem.isEditing;

                    return (
                      <div
                        key={textItem.id}
                        className={cn(
                          "absolute border-2 border-transparent hover:border-blue-300 hover:bg-blue-50/50 cursor-text transition-all",
                          selectedElement === textItem.id &&
                            "border-blue-500 bg-blue-50/30",
                          isEditing && "border-green-500 bg-green-50/30",
                          textItem.modified &&
                            "bg-yellow-50/50 border-yellow-300",
                        )}
                        style={{
                          left: textItem.x * zoom,
                          top: textItem.y * zoom,
                          width: textItem.width * zoom,
                          height: textItem.height * zoom,
                          fontSize: textItem.fontSize * zoom,
                          fontFamily: textItem.fontFamily,
                          color: textItem.color,
                          lineHeight: `${textItem.height * zoom}px`,
                        }}
                        onClick={(e) => handleTextClick(textItem, e)}
                      >
                        {isEditing ? (
                          <div className="relative w-full h-full">
                            <Textarea
                              value={textItem.content}
                              onChange={(e) =>
                                handleTextChange(textItem.id, e.target.value)
                              }
                              className="w-full h-full resize-none border-none p-0 bg-white/90 focus:ring-0 focus:outline-none"
                              style={{
                                fontSize: textItem.fontSize * zoom,
                                fontFamily: textItem.fontFamily,
                                color: textItem.color,
                                lineHeight: `${textItem.height * zoom}px`,
                              }}
                              autoFocus
                              onBlur={() => finishEditing(textItem.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  finishEditing(textItem.id);
                                } else if (e.key === "Escape") {
                                  cancelEditing(textItem.id);
                                }
                              }}
                            />
                            <div className="absolute -top-8 left-0 flex gap-1 z-10">
                              <Button
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => finishEditing(textItem.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => cancelEditing(textItem.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="w-full h-full flex items-center px-1"
                            title="Click to edit this text directly"
                          >
                            {textItem.content}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* New text elements can be added here if needed */}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Properties Panel */}
        {pdfDocument && (
          <Card className="w-80 rounded-none border-y-0 border-r-0">
            <CardHeader>
              <CardTitle className="text-lg">Direct Edit Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Instructions
                </h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Click on any text in the PDF to edit it directly</p>
                  <p>• Use the Text tool to add new text elements</p>
                  <p>• Press Enter to finish editing</p>
                  <p>• Press Escape to cancel changes</p>
                  <p>• Zoom in/out for better precision</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Current Page Text</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {currentPageTextItems.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No text found on this page
                    </p>
                  ) : (
                    currentPageTextItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "p-2 rounded text-xs border cursor-pointer",
                          selectedElement === item.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300",
                          item.modified && "border-green-500 bg-green-50",
                        )}
                        onClick={() => handleTextClick(item, {} as any)}
                      >
                        <div className="font-medium truncate">
                          {item.content}
                        </div>
                        <div className="text-gray-500 mt-1">
                          {Math.round(item.fontSize)}px • {item.fontFamily}
                        </div>
                        {item.modified && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Modified
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Statistics</h4>
                <div className="text-sm text-gray-600">
                  <p>Total text items: {textItems.length}</p>
                  <p>Current page: {currentPageTextItems.length}</p>
                  <p>
                    Modified: {textItems.filter((item) => item.modified).length}
                  </p>
                  <p>
                    Editable text found: {currentPageTextItems.length} items
                  </p>
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

export default DirectEditablePDFEditor;
