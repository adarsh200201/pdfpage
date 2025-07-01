import React, { useRef, useEffect, useState, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize,
  Grid,
  Eye,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFSearchResult } from "@/services/advancedPdfService";
import AdvancedPDFService from "@/services/advancedPdfService";

interface AdvancedPDFViewerProps {
  file: File;
  className?: string;
  onPageChange?: (pageIndex: number) => void;
  onZoomChange?: (zoom: number) => void;
  onRotateChange?: (rotation: number) => void;
  showCollaborators?: boolean;
  collaborators?: Array<{
    id: string;
    name: string;
    color: string;
    cursor?: { x: number; y: number; pageIndex: number };
  }>;
  searchResults?: PDFSearchResult[];
  onSearch?: (term: string) => void;
  readonly?: boolean;
}

interface PDFPageData {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  viewport: any;
  scale: number;
}

const AdvancedPDFViewer: React.FC<AdvancedPDFViewerProps> = ({
  file,
  className,
  onPageChange,
  onZoomChange,
  onRotateChange,
  showCollaborators = false,
  collaborators = [],
  searchResults = [],
  onSearch,
  readonly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<"single" | "continuous" | "grid">(
    "continuous",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedResults, setHighlightedResults] = useState<
    PDFSearchResult[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCache, setPageCache] = useState<Map<number, PDFPageData>>(
    new Map(),
  );

  const pdfService = AdvancedPDFService.getInstance();

  // Load PDF
  useEffect(() => {
    loadPDF();
  }, [file]);

  const loadPDF = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const loadedPdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
      }).promise;

      setPdf(loadedPdf);
      setNumPages(loadedPdf.numPages);
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError("Failed to load PDF");
    } finally {
      setIsLoading(false);
    }
  };

  // Render page to canvas
  const renderPage = useCallback(
    async (pageNumber: number, scale: number = zoom): Promise<PDFPageData> => {
      if (!pdf) throw new Error("PDF not loaded");

      const cacheKey = `${pageNumber}-${scale}-${rotation}`;
      if (pageCache.has(pageNumber)) {
        const cached = pageCache.get(pageNumber);
        if (cached && cached.scale === scale) {
          return cached;
        }
      }

      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale, rotation });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Cannot get canvas context");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const pageData: PDFPageData = {
        pageNumber,
        canvas,
        viewport,
        scale,
      };

      setPageCache((prev) => new Map(prev.set(pageNumber, pageData)));
      return pageData;
    },
    [pdf, zoom, rotation, pageCache],
  );

  // Handle zoom
  const handleZoom = useCallback(
    (newZoom: number) => {
      const clampedZoom = Math.max(0.25, Math.min(5, newZoom));
      setZoom(clampedZoom);
      setPageCache(new Map()); // Clear cache when zoom changes
      onZoomChange?.(clampedZoom);
    },
    [onZoomChange],
  );

  // Handle rotation
  const handleRotation = useCallback(
    (delta: number) => {
      const newRotation = (rotation + delta) % 360;
      setRotation(newRotation);
      setPageCache(new Map()); // Clear cache when rotation changes
      onRotateChange?.(newRotation);
    },
    [rotation, onRotateChange],
  );

  // Handle page navigation
  const goToPage = useCallback(
    (pageNumber: number) => {
      const page = Math.max(1, Math.min(numPages, pageNumber));
      setCurrentPage(page);
      onPageChange?.(page - 1); // 0-based index for external handlers

      if (listRef.current && viewMode === "continuous") {
        listRef.current.scrollToItem(page - 1, "start");
      }
    },
    [numPages, onPageChange, viewMode],
  );

  // Handle search
  const handleSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setHighlightedResults([]);
        return;
      }

      try {
        const results = await pdfService.searchText(file, term);
        setHighlightedResults(results);
        onSearch?.(term);

        // Navigate to first result
        if (results.length > 0) {
          goToPage(results[0].page);
        }
      } catch (error) {
        console.error("Search error:", error);
      }
    },
    [file, pdfService, onSearch, goToPage],
  );

  // Page component for virtualized list
  const PageComponent = React.memo(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const [pageData, setPageData] = useState<PDFPageData | null>(null);
      const [isPageLoading, setIsPageLoading] = useState(true);

      useEffect(() => {
        let cancelled = false;

        const loadPage = async () => {
          try {
            setIsPageLoading(true);
            const data = await renderPage(index + 1);
            if (!cancelled) {
              setPageData(data);
            }
          } catch (error) {
            console.error(`Error loading page ${index + 1}:`, error);
          } finally {
            if (!cancelled) {
              setIsPageLoading(false);
            }
          }
        };

        loadPage();

        return () => {
          cancelled = true;
        };
      }, [index]);

      const pageResults = highlightedResults.filter(
        (result) => result.page === index + 1,
      );

      return (
        <div style={style} className="flex justify-center p-4">
          <div className="relative border shadow-lg">
            {isPageLoading ? (
              <div className="flex items-center justify-center w-full h-96 bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : pageData ? (
              <>
                <canvas
                  ref={(canvas) => {
                    if (canvas && pageData.canvas) {
                      const ctx = canvas.getContext("2d");
                      if (ctx) {
                        canvas.width = pageData.canvas.width;
                        canvas.height = pageData.canvas.height;
                        ctx.drawImage(pageData.canvas, 0, 0);
                      }
                    }
                  }}
                  className="max-w-full h-auto"
                />

                {/* Search highlights */}
                {pageResults.map((result, resultIndex) =>
                  result.matches.map((match, matchIndex) => (
                    <div
                      key={`${resultIndex}-${matchIndex}`}
                      className="absolute bg-yellow-300 bg-opacity-50 border border-yellow-500"
                      style={{
                        left: match.position.x * zoom,
                        top: match.position.y * zoom,
                        width: match.position.width * zoom,
                        height: match.position.height * zoom,
                      }}
                    />
                  )),
                )}

                {/* Collaborator cursors */}
                {showCollaborators &&
                  collaborators
                    .filter((c) => c.cursor?.pageIndex === index)
                    .map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="absolute pointer-events-none"
                        style={{
                          left: (collaborator.cursor?.x || 0) * zoom,
                          top: (collaborator.cursor?.y || 0) * zoom,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: collaborator.color }}
                        />
                        <Badge
                          variant="secondary"
                          className="absolute top-4 left-0 text-xs whitespace-nowrap"
                        >
                          {collaborator.name}
                        </Badge>
                      </div>
                    ))}

                {/* Page number */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {index + 1}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-96 bg-gray-100">
                <span className="text-gray-500">Failed to load page</span>
              </div>
            )}
          </div>
        </div>
      );
    },
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadPDF} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-white">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Input
            type="number"
            min={1}
            max={numPages}
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value))}
            className="w-16 text-center"
          />
          <span className="text-sm text-gray-500">/ {numPages}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleZoom(zoom - 0.25)}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Slider
            value={[zoom * 100]}
            onValueChange={(value) => handleZoom(value[0] / 100)}
            min={25}
            max={500}
            step={25}
            className="w-20"
          />
          <span className="text-sm text-gray-500 w-12">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleZoom(zoom + 0.25)}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRotation(-90)}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRotation(90)}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search PDF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchTerm);
                }
              }}
              className="pl-8 w-48"
            />
          </div>
          <Button size="sm" onClick={() => handleSearch(searchTerm)}>
            Search
          </Button>
          {highlightedResults.length > 0 && (
            <Badge variant="secondary">
              {highlightedResults.reduce(
                (acc, result) => acc + result.matches.length,
                0,
              )}{" "}
              results
            </Badge>
          )}
        </div>

        {/* View mode */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Grid className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setViewMode("single")}>
              <Eye className="w-4 h-4 mr-2" />
              Single Page
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewMode("continuous")}>
              <Grid className="w-4 h-4 mr-2" />
              Continuous
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewMode("grid")}>
              <Maximize className="w-4 h-4 mr-2" />
              Grid View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collaborators */}
        {showCollaborators && collaborators.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-500" />
            <div className="flex -space-x-2">
              {collaborators.slice(0, 3).map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                  style={{ backgroundColor: collaborator.color }}
                  title={collaborator.name}
                >
                  {collaborator.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs text-white">
                  +{collaborators.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <Button size="sm" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>

      {/* PDF Content */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {viewMode === "continuous" && (
          <List
            ref={listRef}
            height={containerRef.current?.clientHeight || 600}
            itemCount={numPages}
            itemSize={800 * zoom + 32} // Approximate height + padding
            overscanCount={2}
          >
            {PageComponent}
          </List>
        )}

        {viewMode === "single" && (
          <div className="h-full overflow-auto">
            <PageComponent
              index={currentPage - 1}
              style={{ position: "relative" }}
            />
          </div>
        )}

        {viewMode === "grid" && (
          <div className="h-full overflow-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: numPages }, (_, index) => (
                <div
                  key={index}
                  className="cursor-pointer transform hover:scale-105 transition-transform"
                  onClick={() => {
                    goToPage(index + 1);
                    setViewMode("single");
                  }}
                >
                  <PageComponent
                    index={index}
                    style={{ position: "relative" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedPDFViewer;
