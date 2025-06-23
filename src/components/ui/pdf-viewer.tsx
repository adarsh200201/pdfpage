import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";

// PDF.js worker will be configured inside the component

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
  signaturePreview: string | null; // Base64 image or text
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
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageScale, setPageScale] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Load PDF using direct PDF.js approach
  useEffect(() => {
    const loadPDF = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("🔄 Loading PDF with direct PDF.js:", file.name);

        // Explicitly configure worker before each PDF load
        console.log(
          "Current worker source:",
          pdfjsLib.GlobalWorkerOptions.workerSrc,
        );

        // Force disable worker completely for simpler approach
        console.log("⚙️ Disabling worker for direct synchronous rendering...");
        pdfjsLib.GlobalWorkerOptions.workerSrc = false;
        console.log("✅ Worker disabled completely");

        // Convert file to ArrayBuffer
        console.log("📁 Converting file to ArrayBuffer...");
        const arrayBuffer = await file.arrayBuffer();
        console.log("✅ ArrayBuffer created:", {
          size: arrayBuffer.byteLength,
        });

        // Load PDF document with timeout
        console.log("📄 Loading PDF document...");
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          disableStream: true,
          disableAutoFetch: true,
          disableWorker: true, // Force disable worker
        });

        // Add progress tracking
        loadingTask.onProgress = (progress) => {
          console.log("📊 PDF Loading progress:", progress);
        };

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("PDF loading timeout after 10 seconds")),
            10000,
          );
        });

        console.log("⏳ Waiting for PDF to load...");
        const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
        console.log("🎉 PDF document loaded!", { numPages: pdf.numPages });

        console.log("✅ PDF loaded successfully:", {
          numPages: pdf.numPages,
          fileName: file.name,
        });

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setPageNumber(signaturePosition.page || 1);
      } catch (err) {
        console.error("❌ PDF loading error:", err);
        setError(`Failed to load PDF: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [file, signaturePosition.page]);

  // Render PDF page to canvas
  const renderPage = async (pageNum: number) => {
    console.log("🎨 renderPage called:", {
      pageNum,
      hasPdfDoc: !!pdfDoc,
      hasCanvas: !!canvasRef.current,
    });

    if (!pdfDoc || !canvasRef.current) {
      console.warn("⚠️ Cannot render: missing pdfDoc or canvas", {
        pdfDoc: !!pdfDoc,
        canvas: !!canvasRef.current,
      });
      return;
    }

    try {
      console.log("🎨 Starting page render for page:", pageNum);

      console.log("📄 Getting page from PDF...");
      const page = await pdfDoc.getPage(pageNum);
      console.log("✅ Page object retrieved:", { pageNum });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      console.log("🖼️ Canvas context obtained");

      // Calculate scale to fit container nicely
      console.log("📐 Calculating viewport...");
      const viewport = page.getViewport({ scale: pageScale });
      console.log("✅ Viewport calculated:", {
        width: viewport.width,
        height: viewport.height,
        scale: pageScale,
      });

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.maxWidth = "100%";
      canvas.style.height = "auto";
      console.log("📏 Canvas dimensions set:", {
        width: canvas.width,
        height: canvas.height,
      });

      // Render PDF page to canvas
      console.log("🎨 Starting canvas render...");
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      console.log("🎉 Page rendered successfully!:", {
        pageNum,
        width: viewport.width,
        height: viewport.height,
        scale: pageScale,
      });
    } catch (err) {
      console.error("❌ Page rendering error:", err);
      setError(`Failed to render page ${pageNum}: ${err.message}`);
    }
  };

  // Render page when PDF doc, page number, or scale changes
  useEffect(() => {
    if (pdfDoc && pageNumber) {
      renderPage(pageNumber);
    }
  }, [pdfDoc, pageNumber, pageScale]);

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
    if (pageNumber !== signaturePosition.page) return null;

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
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
            className="px-3 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next →
          </button>
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
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <span className="text-sm">
                  Loading PDF... (Direct rendering mode)
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64 text-red-500">
              <div className="text-center">
                <p className="mb-2">Failed to load PDF preview:</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-2 text-gray-500">
                  You can still use the manual controls below to position your
                  signature.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && pdfDoc && (
            <>
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto border border-gray-200 rounded shadow-sm"
                style={{ display: "block" }}
              />
              {/* Signature Overlay */}
              {renderSignatureOverlay()}
            </>
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
        {import.meta.env.DEV && (
          <p className="text-xs text-blue-500 mt-1 italic">
            ⚡ Development mode: Worker disabled for better reliability
          </p>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
