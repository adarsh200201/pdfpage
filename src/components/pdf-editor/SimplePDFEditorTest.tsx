import React, { useRef, useEffect, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SimplePDFEditorTestProps {
  file: File;
  className?: string;
}

export function SimplePDFEditorTest({
  file,
  className,
}: SimplePDFEditorTestProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  // Configure PDF.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }, []);

  // Load PDF
  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Loading PDF file:", file.name);
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
        }).promise;

        setPdfDocument(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setCurrentPage(1);

        console.log("PDF loaded successfully:", pdfDoc.numPages, "pages");
        toast({
          title: "PDF loaded",
          description: `Successfully loaded ${pdfDoc.numPages} pages`,
        });
      } catch (error) {
        console.error("Error loading PDF:", error);
        setError("Failed to load PDF");
        toast({
          title: "Error",
          description: "Failed to load PDF file",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [file, toast]);

  // Render PDF page
  const renderPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current) return;

    setIsLoading(true);
    try {
      console.log(`Rendering page ${currentPage}`);
      const page = await pdfDocument.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get canvas context");

      // Set canvas size
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";

      // Clear and render
      context.clearRect(0, 0, viewport.width, viewport.height);
      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      console.log("Page rendered successfully");
    } catch (error) {
      console.error("Error rendering page:", error);
      setError("Failed to render page");
    } finally {
      setIsLoading(false);
    }
  }, [pdfDocument, currentPage, zoom]);

  // Render page when dependencies change
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  return (
    <div className={cn("w-full h-full", className)}>
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>PDF Editor Test</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((prev) => prev * 1.2)}
              >
                Zoom In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((prev) => prev / 1.2)}
              >
                Zoom Out
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative h-96 overflow-auto">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {pdfDocument ? "Rendering page..." : "Loading PDF..."}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
              <div className="text-center text-red-600">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    renderPage();
                  }}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 shadow-lg"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
