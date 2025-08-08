import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Download,
  Eye,
  EyeOff,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  X,
} from "lucide-react";
import { pdfDataStore } from "@/services/pdfDataStore";
import { directPageStorage } from "@/utils/directPageStorage";
import { globalPdfStorage } from "@/utils/globalPdfStorage";

interface PDFPreviewProps {
  sessionId: string | null;
  fileName?: string;
  onDownload: (pageIndex: number) => void;
  onDownloadAll: () => void;
  className?: string;
}

interface PagePreview {
  index: number;
  dataUrl: string;
  size: number;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  sessionId,
  fileName = "document",
  onDownload,
  onDownloadAll,
  className,
}) => {
  const [previews, setPreviews] = useState<PagePreview[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [showPreviews, setShowPreviews] = useState(true);
  const [currentPages, setCurrentPages] = useState<Uint8Array[]>([]);
  const [zoom, setZoom] = useState(1);

  // Generate previews for split pages
  useEffect(() => {
    const generatePreviews = async () => {
      if (!sessionId) {
        console.log("No session ID provided for preview generation");
        return;
      }

      // Try multiple storage methods to get pages
      let splitPages: Uint8Array[] | null = null;

      // Method 1: Try emergency window storage
      if (
        typeof window !== "undefined" &&
        (window as any).EMERGENCY_PDF_PAGES
      ) {
        splitPages = (window as any).EMERGENCY_PDF_PAGES;
        console.log(
          `🚨 [PREVIEW] Using emergency storage: ${splitPages.length} pages`,
        );
      }

      // Method 2: Try direct storage
      if (!splitPages || splitPages.length === 0) {
        splitPages = directPageStorage.getAll();
        if (splitPages && splitPages.length > 0) {
          console.log(
            `✅ [PREVIEW] Using direct storage: ${splitPages.length} pages`,
          );
        }
      }

      // Method 3: Try global storage
      if (!splitPages || splitPages.length === 0) {
        splitPages = globalPdfStorage.retrieve(sessionId);
        if (splitPages && splitPages.length > 0) {
          console.log(
            `✅ [PREVIEW] Using global storage: ${splitPages.length} pages`,
          );
        }
      }

      // Method 4: Fall back to old storage
      if (!splitPages || splitPages.length === 0) {
        splitPages = pdfDataStore.getSplitPages(sessionId);
        if (splitPages && splitPages.length > 0) {
          console.log(
            `✅ [PREVIEW] Using old storage: ${splitPages.length} pages`,
          );
        }
      }

      if (!splitPages || splitPages.length === 0) {
        console.log("❌ [PREVIEW] No pages found in any storage system");
        return;
      }

      // Store pages in component state for use in render
      setCurrentPages(splitPages);
      setIsGenerating(true);
      try {
        const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

        // Set worker path if not already set
        if (!GlobalWorkerOptions.workerSrc) {
          GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }

        const newPreviews: PagePreview[] = [];

        for (let i = 0; i < splitPages.length; i++) {
          try {
            const page = splitPages[i];
            console.log(`Processing page ${i + 1} for preview:`, {
              exists: !!page,
              size: page?.length || 0,
              isUint8Array: page instanceof Uint8Array,
            });

            if (!page || page.length === 0) {
              console.warn(`Skipping page ${i + 1} - empty or undefined`);
              continue;
            }

            // Load PDF document
            const loadingTask = getDocument({ data: page });
            const pdfDoc = await loadingTask.promise;
            const pdfPage = await pdfDoc.getPage(1); // Each split page should have only 1 page

            // Create canvas for preview
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) continue;

            const viewport = pdfPage.getViewport({ scale: 0.5 }); // Small preview
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render page to canvas
            await pdfPage.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;

            // Convert to data URL
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

            newPreviews.push({
              index: i,
              dataUrl,
              size: Math.round(page.length / 1024), // Size in KB
            });
          } catch (error) {
            console.error(`Error generating preview for page ${i + 1}:`, error);
          }
        }

        setPreviews(newPreviews);
      } catch (error) {
        console.error("Error setting up PDF preview:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePreviews();
  }, [sessionId]);

  const openFullPreview = async (pageIndex: number) => {
    try {
      if (!sessionId) {
        console.error("No session ID available for full preview");
        return;
      }

      console.log(`Opening page ${pageIndex + 1} from global store`);

      // Get page data from new storage systems
      let page: Uint8Array | null = null;

      // Try emergency storage first
      if (
        typeof window !== "undefined" &&
        (window as any).EMERGENCY_PDF_PAGES
      ) {
        const emergencyPages = (window as any).EMERGENCY_PDF_PAGES;
        if (emergencyPages[pageIndex]) {
          page = emergencyPages[pageIndex];
          console.log(
            `🚨 [PREVIEW-DOWNLOAD] Using emergency storage for page ${pageIndex + 1}`,
          );
        }
      }

      // Try direct storage
      if (!page) {
        page = directPageStorage.getPage(pageIndex);
        if (page) {
          console.log(
            `✅ [PREVIEW-DOWNLOAD] Using direct storage for page ${pageIndex + 1}`,
          );
        }
      }

      // Try global storage
      if (!page) {
        page = globalPdfStorage.getPage(sessionId, pageIndex);
        if (page) {
          console.log(
            `✅ [PREVIEW-DOWNLOAD] Using global storage for page ${pageIndex + 1}`,
          );
        }
      }

      // Fall back to old storage
      if (!page) {
        page = pdfDataStore.getPage(sessionId, pageIndex);
        if (page) {
          console.log(
            `✅ [PREVIEW-DOWNLOAD] Using old storage for page ${pageIndex + 1}`,
          );
        }
      }

      if (!page || page.length === 0) {
        console.error(
          `Page ${pageIndex + 1} is empty or undefined in global store`,
        );
        return;
      }

      console.log(`Page ${pageIndex + 1} data from global store:`, {
        exists: !!page,
        size: page.length,
        type: typeof page,
        isUint8Array: page instanceof Uint8Array,
      });

      // Create blob URL for full-size preview
      const blob = new Blob([page], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      console.log(`Created blob URL for page ${pageIndex + 1}:`, url);

      // Open in new tab for full preview
      window.open(url, "_blank");

      // Clean up URL after a delay (increased time)
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error("Error opening full preview:", error);
    }
  };

  // Get page count from new storage systems
  let pageCount = 0;

  // Try emergency storage first
  if (typeof window !== "undefined" && (window as any).EMERGENCY_PDF_PAGES) {
    pageCount = (window as any).EMERGENCY_PDF_PAGES.length;
    console.log(
      `🚨 [PREVIEW-COUNT] Using emergency storage: ${pageCount} pages`,
    );
  }
  // Try direct storage
  else if (directPageStorage.hasPages()) {
    pageCount = directPageStorage.getCount();
    console.log(`✅ [PREVIEW-COUNT] Using direct storage: ${pageCount} pages`);
  }
  // Try global storage
  else if (sessionId) {
    const splitPages = globalPdfStorage.retrieve(sessionId);
    if (splitPages) {
      pageCount = splitPages.length;
      console.log(
        `✅ [PREVIEW-COUNT] Using global storage: ${pageCount} pages`,
      );
    }
    // Fall back to old storage
    else {
      const oldSplitPages = pdfDataStore.getSplitPages(sessionId);
      pageCount = oldSplitPages?.length || 0;
      if (pageCount > 0) {
        console.log(`✅ [PREVIEW-COUNT] Using old storage: ${pageCount} pages`);
      }
    }
  }

  if (pageCount === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h4 className="text-lg font-semibold text-gray-900">
            Split Pages Preview ({pageCount})
          </h4>
          <Badge variant="outline" className="text-xs">
            {isGenerating ? "Generating..." : `${previews.length} previews`}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreviews(!showPreviews)}
          >
            {showPreviews ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Show
              </>
            )}
          </Button>

          <Button
            onClick={onDownloadAll}
            disabled={currentPages.length > 20}
            size="sm"
          >
            <Download className="w-4 h-4 mr-1" />
            Download All
          </Button>
        </div>
      </div>

      {/* Preview Grid */}
      {showPreviews && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-96 overflow-y-auto p-1">
          {Array.from({ length: pageCount }, (_, index) => {
            const page = currentPages?.[index];
            const preview = previews.find((p) => p.index === index);
            const sizeInKB = Math.round((page?.length || 0) / 1024);

            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Preview Image */}
                <div className="aspect-[3/4] bg-gray-50 relative group">
                  {preview ? (
                    <img
                      src={preview.dataUrl}
                      alt={`Page ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : isGenerating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openFullPreview(index)}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Maximize2 className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>

                {/* Page Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Page {index + 1}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {sizeInKB} KB
                    </Badge>
                  </div>

                  <Button
                    onClick={() => onDownload(index)}
                    size="sm"
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback for too many pages */}
      {currentPages.length > 20 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-800">
            Too many pages to preview ({currentPages.length} pages). Only
            showing download options.
          </p>
        </div>
      )}
    </div>
  );
};

export default PDFPreview;
