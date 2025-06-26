import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  type: "pdf" | "image";
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  type,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen && file) {
      loadFile();
    }
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [isOpen, file]);

  const loadFile = async () => {
    if (!file) return;

    setIsLoading(true);
    setCurrentPage(1);
    setRotation(0);

    try {
      if (type === "image") {
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        setTotalPages(1);
      } else if (type === "pdf") {
        await loadPdfPages();
      }
    } catch (error) {
      console.error("Error loading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPdfPages = async () => {
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    setTotalPages(pdf.numPages);

    // Load first 5 pages for preview
    const pages: string[] = [];
    const maxPages = Math.min(pdf.numPages, 5);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (context) {
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        pages.push(canvas.toDataURL("image/jpeg", 0.8));
      }
    }

    setPdfPages(pages);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {file.name}
            </h3>
            {type === "pdf" && totalPages > 1 && (
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : type === "image" ? (
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-w-full max-h-[60vh] object-contain"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease",
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {pdfPages.map((pageUrl, index) => (
                <div key={index} className="flex justify-center">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={pageUrl}
                      alt={`Page ${index + 1}`}
                      className="max-w-full max-h-[60vh] object-contain"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: "transform 0.3s ease",
                      }}
                    />
                    <div className="bg-gray-50 px-3 py-2 text-center text-sm text-gray-600">
                      Page {index + 1}
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 5 && (
                <div className="text-center text-sm text-gray-500 py-4">
                  ... and {totalPages - 5} more pages
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer for PDF navigation */}
        {type === "pdf" && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4 p-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreviewModal;
