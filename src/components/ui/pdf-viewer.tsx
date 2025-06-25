import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

interface PDFViewerProps {
  file: File;
  signaturePosition: SignaturePosition;
  onPositionChange: (position: SignaturePosition) => void;
  signaturePreview: string | null;
  signatureType: "draw" | "type" | "upload";
  signatureText?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  signaturePosition,
  onPositionChange,
  signaturePreview,
  signatureType,
  signatureText,
}) => {
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageScale, setPageScale] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Simple PDF loading using iframe
  useEffect(() => {
    const loadPDF = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("🔄 Loading PDF with iframe approach:", file.name);

        // Create a blob URL for the PDF
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
        setNumPages(1); // Default to 1 page for iframe
        setPageNumber(1);

        console.log("✅ PDF URL created successfully");

        toast({
          title: "PDF loaded successfully",
          description: "PDF is ready for signature placement",
        });
      } catch (err) {
        console.error("❌ PDF loading error:", err);
        setError(
          `Failed to load PDF: ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();

    // Cleanup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [file]);

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / pageScale;
    const y = (event.clientY - rect.top) / pageScale;

    onPositionChange({
      ...signaturePosition,
      x,
      y,
      page: pageNumber,
    });
  };

  const handleSignatureDragStart = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    const rect = event.currentTarget.getBoundingClientRect();
    setDragStart({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleSignatureDrag = (event: React.MouseEvent) => {
    if (!isDragging) return;

    const pageElement = pageRef.current;
    if (!pageElement) return;

    const pageRect = pageElement.getBoundingClientRect();
    const x = (event.clientX - pageRect.left - dragStart.x) / pageScale;
    const y = (event.clientY - pageRect.top - dragStart.y) / pageScale;

    // Ensure signature stays within page bounds
    const maxX = pageRect.width / pageScale - signaturePosition.width;
    const maxY = pageRect.height / pageScale - signaturePosition.height;

    onPositionChange({
      ...signaturePosition,
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
      page: pageNumber,
    });
  };

  const handleSignatureDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        handleSignatureDrag(e as any);
      };
      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    isDragging,
    dragStart,
    pageScale,
    signaturePosition.width,
    signaturePosition.height,
  ]);

  const renderSignatureOverlay = () => {
    const style = {
      position: "absolute" as const,
      left: signaturePosition.x * pageScale,
      top: signaturePosition.y * pageScale,
      width: signaturePosition.width * pageScale,
      height: signaturePosition.height * pageScale,
      border: "2px solid #3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      cursor: isDragging ? "grabbing" : "grab",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "4px",
      userSelect: "none" as const,
      zIndex: 10,
    };

    return (
      <div
        style={style}
        onMouseDown={handleSignatureDragStart}
        className="signature-overlay"
      >
        {signatureType === "type" && signatureText && (
          <span
            style={{
              fontSize: `${Math.max(12, signaturePosition.height * pageScale * 0.3)}px`,
              color: "#1e40af",
              fontFamily: "serif",
              fontWeight: "bold",
              pointerEvents: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {signatureText}
          </span>
        )}
        {signatureType === "draw" && signaturePreview && (
          <img
            src={signaturePreview}
            alt="Signature preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        )}
        {signatureType === "upload" && signaturePreview && (
          <img
            src={signaturePreview}
            alt="Signature preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        )}
        {!signaturePreview && !signatureText && (
          <span style={{ fontSize: "12px", color: "#6b7280" }}>
            📝 Signature
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="pdf-viewer">
      {/* PDF Controls */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">PDF Viewer - {file.name}</span>
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium">Zoom:</label>
          <select
            value={pageScale}
            onChange={(e) => setPageScale(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded"
          >
            <option value={0.5}>50%</option>
            <option value={0.75}>75%</option>
            <option value={1.0}>100%</option>
            <option value={1.25}>125%</option>
            <option value={1.5}>150%</option>
          </select>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="relative border-2 border-gray-300 rounded-lg overflow-auto bg-gray-50 min-h-[600px] p-4">
        <div
          ref={pageRef}
          className="relative inline-block cursor-crosshair bg-white shadow-md rounded"
          onClick={handlePageClick}
          style={{
            minWidth: "100%",
            minHeight: "400px",
            transform: `scale(${pageScale})`,
            transformOrigin: "top left",
          }}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <span className="text-lg font-medium">Loading PDF...</span>
                <p className="text-sm text-gray-500 mt-2">
                  Processing: {file.name}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64 text-red-500">
              <div className="text-center">
                <p className="mb-2">Failed to load PDF:</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && pdfUrl && (
            <div className="relative">
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                className="w-full h-96 border border-gray-200 rounded"
                style={{ minHeight: "600px" }}
                title="PDF Preview"
              />

              {/* Signature Overlay */}
              {renderSignatureOverlay()}
            </div>
          )}
        </div>
      </div>

      {/* Position Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">
          Signature Position
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="block text-blue-700">Page:</label>
            <span className="font-mono">{signaturePosition.page}</span>
          </div>
          <div>
            <label className="block text-blue-700">X:</label>
            <span className="font-mono">
              {Math.round(signaturePosition.x)}px
            </span>
          </div>
          <div>
            <label className="block text-blue-700">Y:</label>
            <span className="font-mono">
              {Math.round(signaturePosition.y)}px
            </span>
          </div>
          <div>
            <label className="block text-blue-700">Size:</label>
            <span className="font-mono">
              {Math.round(signaturePosition.width)}×
              {Math.round(signaturePosition.height)}
            </span>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          💡 Click anywhere on the PDF to position your signature, or drag the
          blue box to adjust
        </p>
        <p className="text-xs text-blue-500 mt-1 italic">
          ⚡ Simple iframe approach for reliable PDF display
        </p>
      </div>
    </div>
  );
};

export default PDFViewer;
