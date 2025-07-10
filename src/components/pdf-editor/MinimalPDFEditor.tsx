import React, { useRef, useEffect, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentProxy } from "pdfjs-dist";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Type, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface MinimalPDFEditorProps {
  pdfDocument: PDFDocumentProxy;
  currentPage: number;
  zoom: number;
  className?: string;
}

export function MinimalPDFEditor({
  pdfDocument,
  currentPage,
  zoom,
  className,
}: MinimalPDFEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [textElements, setTextElements] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      text: string;
      fontSize: number;
      color: string;
    }>
  >([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const { toast } = useToast();

  // Configure PDF.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }, []);

  // Render PDF page
  const renderPDFPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current) {
      console.log("PDF render skipped:", {
        pdfDocument: !!pdfDocument,
        canvas: !!canvasRef.current,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Rendering page ${currentPage} at zoom ${zoom}`);
      const page = await pdfDocument.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get canvas context");

      // Set canvas size with device pixel ratio for crisp rendering
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * devicePixelRatio;
      canvas.height = viewport.height * devicePixelRatio;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";

      context.scale(devicePixelRatio, devicePixelRatio);

      // Update page size
      const newPageSize = {
        width: viewport.width,
        height: viewport.height,
      };
      setPageSize(newPageSize);

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
  }, [pdfDocument, currentPage, zoom, toast]);

  // Re-render when dependencies change
  useEffect(() => {
    renderPDFPage();
  }, [renderPDFPage]);

  // Handle canvas click for text placement
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isAddingText) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newElement = {
      id: Date.now().toString(),
      x,
      y,
      text: "Click to edit",
      fontSize: 16,
      color: "#000000",
    };

    setTextElements((prev) => [...prev, newElement]);
    setEditingElement(newElement.id);
    setIsAddingText(false);
  };

  // Update text element
  const updateTextElement = (
    id: string,
    updates: Partial<(typeof textElements)[0]>,
  ) => {
    setTextElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    );
  };

  // Delete text element
  const deleteTextElement = (id: string) => {
    setTextElements((prev) => prev.filter((el) => el.id !== id));
    setEditingElement(null);
  };

  return (
    <div className={cn("relative w-full h-full flex flex-col", className)}>
      {/* Simple Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={isAddingText ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAddingText(!isAddingText)}
            className="flex items-center"
          >
            <Type className="w-4 h-4 mr-2" />
            {isAddingText ? "Cancel" : "Add Text"}
          </Button>

          {textElements.length > 0 && (
            <Button variant="outline" size="sm" disabled>
              <Download className="w-4 h-4 mr-2" />
              Export (Coming Soon)
            </Button>
          )}
        </div>

        {isAddingText && (
          <p className="text-sm text-gray-600">Click on the PDF to add text</p>
        )}
      </div>

      {/* PDF Viewer Area */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div
          className="relative bg-white shadow-lg mx-auto cursor-pointer"
          style={{
            width: Math.max(pageSize.width, 800),
            height: Math.max(pageSize.height, 600),
          }}
          onClick={handleCanvasClick}
        >
          {/* PDF Canvas */}
          <canvas ref={canvasRef} className="absolute top-0 left-0 z-0" />

          {/* Text Overlays */}
          {textElements.map((element) => (
            <div
              key={element.id}
              className="absolute z-10 cursor-pointer border border-transparent hover:border-blue-300"
              style={{
                left: element.x,
                top: element.y,
                fontSize: element.fontSize,
                color: element.color,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setEditingElement(element.id);
              }}
            >
              {editingElement === element.id ? (
                <div className="bg-white p-2 border border-blue-300 rounded shadow-lg">
                  <Input
                    value={element.text}
                    onChange={(e) =>
                      updateTextElement(element.id, { text: e.target.value })
                    }
                    className="mb-2"
                    placeholder="Enter text"
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => setEditingElement(null)}>
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTextElement(element.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <span className="bg-yellow-100 bg-opacity-75 px-1 rounded">
                  {element.text}
                </span>
              )}
            </div>
          ))}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Rendering page...</p>
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
