import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageThumbnailsProps {
  file: File;
  currentPage: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  className?: string;
}

interface ThumbnailData {
  pageIndex: number;
  canvas: HTMLCanvasElement;
  isLoaded: boolean;
}

export default function PageThumbnails({
  file,
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PageThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize thumbnails
  useEffect(() => {
    const initThumbnails = () => {
      const newThumbnails: ThumbnailData[] = [];
      for (let i = 0; i < totalPages; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = 120;
        canvas.height = 160;
        newThumbnails.push({
          pageIndex: i,
          canvas,
          isLoaded: false,
        });
      }
      setThumbnails(newThumbnails);
    };

    if (totalPages > 0) {
      initThumbnails();
    }
  }, [totalPages]);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      setIsLoading(true);
      try {
        const pdfjsLib = await import("pdfjs-dist");

        // Set worker if not already set
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          verbosity: 0, // Reduce console noise
        });

        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
      } catch (err) {
        console.error("Error loading PDF for thumbnails:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (file) {
      loadPDF();
    }
  }, [file]);

  // Render thumbnail for a specific page
  const renderThumbnail = async (pageIndex: number) => {
    if (!pdfDocument || !thumbnails[pageIndex]) return;

    try {
      const page = await pdfDocument.getPage(pageIndex + 1);
      const canvas = thumbnails[pageIndex].canvas;
      const context = canvas.getContext("2d");

      // Calculate scale to fit in thumbnail
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(120 / viewport.width, 160 / viewport.height);
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // Render page
      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      // Update thumbnail state
      setThumbnails((prev) =>
        prev.map((thumb) =>
          thumb.pageIndex === pageIndex ? { ...thumb, isLoaded: true } : thumb,
        ),
      );
    } catch (err) {
      console.error(
        `Error rendering thumbnail for page ${pageIndex + 1}:`,
        err,
      );
    }
  };

  // Load thumbnails when PDF is ready
  useEffect(() => {
    if (pdfDocument && thumbnails.length > 0) {
      // Load current page first, then others
      renderThumbnail(currentPage);

      // Load other pages in background
      const loadOtherPages = async () => {
        for (let i = 0; i < thumbnails.length; i++) {
          if (i !== currentPage) {
            await renderThumbnail(i);
            // Small delay to prevent blocking
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }
      };

      setTimeout(loadOtherPages, 100);
    }
  }, [pdfDocument, thumbnails.length, currentPage]);

  // Navigate to previous page
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  // Navigate to next page
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  // Scroll current thumbnail into view
  useEffect(() => {
    const container = containerRef.current;
    if (container && thumbnails.length > 0) {
      const currentThumbnail = container.querySelector(
        `[data-page="${currentPage}"]`,
      ) as HTMLElement;
      if (currentThumbnail) {
        currentThumbnail.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentPage, thumbnails.length]);

  if (isLoading) {
    return (
      <div
        className={cn("w-64 bg-gray-50 border-r border-gray-200", className)}
      >
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg"
                style={{ width: "120px", height: "160px" }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-64 bg-gray-50 border-r border-gray-200", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Pages</h3>

        {/* Page Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm text-gray-600">
            {currentPage + 1} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Thumbnails */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div ref={containerRef} className="p-4 space-y-3">
          {thumbnails.map((thumbnail) => (
            <div
              key={thumbnail.pageIndex}
              data-page={thumbnail.pageIndex}
              className={cn(
                "relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-md",
                currentPage === thumbnail.pageIndex
                  ? "border-blue-500 shadow-lg"
                  : "border-gray-200 hover:border-gray-300",
              )}
              onClick={() => onPageChange(thumbnail.pageIndex)}
            >
              {/* Thumbnail Canvas */}
              <div className="relative bg-white rounded-lg overflow-hidden">
                {thumbnail.isLoaded ? (
                  <canvas
                    ref={(ref) => {
                      if (ref && thumbnail.canvas) {
                        // Copy canvas content to displayed canvas
                        const ctx = ref.getContext("2d");
                        if (ctx) {
                          ref.width = thumbnail.canvas.width;
                          ref.height = thumbnail.canvas.height;
                          ctx.drawImage(thumbnail.canvas, 0, 0);
                        }
                      }
                    }}
                    className="w-full h-auto"
                  />
                ) : (
                  <div
                    className="flex items-center justify-center bg-gray-100"
                    style={{ width: "120px", height: "160px" }}
                  >
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                  </div>
                )}

                {/* Page Number Overlay */}
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                  {thumbnail.pageIndex + 1}
                </div>

                {/* Current Page Indicator */}
                {currentPage === thumbnail.pageIndex && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Current
                    </div>
                  </div>
                )}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-blue-500 bg-opacity-0 hover:bg-opacity-5 rounded-lg transition-opacity duration-200" />
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Click to navigate • {totalPages} pages total
        </div>
      </div>
    </div>
  );
}
