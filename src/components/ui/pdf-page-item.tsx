import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  Plus,
  Eye,
  RotateCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfPreview from "./pdf-preview";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export interface PdfPageData {
  pageNumber: number;
  thumbnail: string;
}

export interface PdfPageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: "pdf" | "image";
  pages?: PdfPageData[];
  isExpanded?: boolean;
}

interface PdfPageItemProps {
  item: PdfPageItem;
  index: number;
  onRemove: (id: string) => void;
  onRotate?: (id: string) => void;
  onPreview: (item: PdfPageItem) => void;
  onInsertAtPage: (itemId: string, afterPage: number) => void;
  onToggleExpanded: (id: string) => void;
  showInsertionControls?: boolean;
}

export const PdfPageItemComponent: React.FC<PdfPageItemProps> = ({
  item,
  index,
  onRemove,
  onRotate,
  onPreview,
  onInsertAtPage,
  onToggleExpanded,
  showInsertionControls = true,
}) => {
  const [pages, setPages] = useState<PdfPageData[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  useEffect(() => {
    if (item.type === "pdf" && item.isExpanded && !pages.length) {
      loadPdfPages();
    }
  }, [item.isExpanded, item.file]);

  const loadPdfPages = async () => {
    setIsLoadingPages(true);
    try {
      const arrayBuffer = await item.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdf.numPages;
      const pagesData: PdfPageData[] = [];

      // Load thumbnails for first 10 pages (to avoid performance issues)
      const maxPages = Math.min(pageCount, 10);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (context) {
          const viewport = page.getViewport({ scale: 0.5 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          pagesData.push({
            pageNumber: i,
            thumbnail: canvas.toDataURL("image/jpeg", 0.7),
          });
        }
      }

      // Add placeholders for remaining pages if any
      for (let i = maxPages + 1; i <= pageCount; i++) {
        pagesData.push({
          pageNumber: i,
          thumbnail: "",
        });
      }

      setPages(pagesData);
    } catch (error) {
      console.error("Error loading PDF pages:", error);
    } finally {
      setIsLoadingPages(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleToggleExpanded = () => {
    if (item.type === "pdf") {
      onToggleExpanded(item.id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Main File Header */}
      <div className="flex items-center space-x-4 p-4">
        {/* File Preview */}
        <div className="flex-shrink-0">
          <PdfPreview
            file={item.file}
            showFileName={false}
            maxWidth={60}
            maxHeight={80}
            className="w-16 h-20"
          />
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {item.type === "pdf" ? (
              <FileText className="w-4 h-4 text-blue-500" />
            ) : (
              <FileText className="w-4 h-4 text-green-500" />
            )}
            <p className="text-sm font-medium text-text-dark truncate">
              {item.name}
            </p>
          </div>
          <p className="text-xs text-text-light">
            {formatFileSize(item.size)} • {item.type.toUpperCase()}
          </p>
          <div className="text-xs text-gray-500 mt-1">
            File {index + 1}
            {pages.length > 0 && ` • ${pages.length} pages`}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {item.type === "pdf" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpanded}
              className="opacity-60 hover:opacity-100"
            >
              {item.isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPreview(item)}
            className="opacity-60 hover:opacity-100"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {item.type === "pdf" && onRotate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRotate(item.id)}
              className="opacity-60 hover:opacity-100"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 opacity-60 hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Pages View */}
      {item.type === "pdf" && item.isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          {isLoadingPages ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">
                Loading pages...
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                PDF Pages - Insert content between any pages:
              </h4>

              <div className="grid grid-cols-1 gap-2">
                {pages.map((page, pageIndex) => (
                  <div key={page.pageNumber} className="space-y-2">
                    {/* Insert Before First Page */}
                    {pageIndex === 0 && showInsertionControls && (
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onInsertAtPage(item.id, 0)}
                          className="h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-dashed border-blue-300"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Insert before page 1
                        </Button>
                      </div>
                    )}

                    {/* Page Item */}
                    <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
                      {/* Page Thumbnail */}
                      <div className="flex-shrink-0">
                        {page.thumbnail ? (
                          <img
                            src={page.thumbnail}
                            alt={`Page ${page.pageNumber}`}
                            className="w-12 h-16 object-contain border border-gray-200 rounded"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Page Info */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          Page {page.pageNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          From {item.name}
                        </p>
                      </div>
                    </div>

                    {/* Insert After Each Page */}
                    {showInsertionControls && (
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onInsertAtPage(item.id, page.pageNumber)
                          }
                          className="h-8 px-3 bg-green-50 hover:bg-green-100 text-green-600 border border-dashed border-green-300"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Insert after page {page.pageNumber}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfPageItemComponent;
