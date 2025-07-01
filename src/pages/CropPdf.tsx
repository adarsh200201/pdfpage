import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Download,
  FileText,
  Target,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Info,
  Move,
  Square,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  Crop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/auth/AuthModal";

interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PDFPage {
  width: number;
  height: number;
}

const CropPdf = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cropSettings, setCropSettings] = useState({
    preset: "custom",
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    applyToAllPages: true,
  });
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 50,
    y: 50,
    width: 400,
    height: 500,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);

  // Enhanced preview state
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PDFPage>({ width: 0, height: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>("");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleFilesSelect = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile({
        id: Math.random().toString(36).substr(2, 9),
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
      });
      setIsComplete(false);
      loadPDFForPreview(selectedFile);
    }
  };

  // Load PDF for preview
  const loadPDFForPreview = async (pdfFile: File) => {
    setIsLoadingPDF(true);
    setPdfError(null);

    try {
      // Import and configure PDF.js
      const pdfjsLib = await import("pdfjs-dist");

      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/",
        cMapPacked: true,
        standardFontDataUrl:
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/standard_fonts/",
        verbosity: 0,
      });

      const pdf = await loadingTask.promise;
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(0);

      toast({
        title: "PDF loaded successfully",
        description: `Document has ${pdf.numPages} pages`,
      });

      // Render first page
      renderPage(pdf, 0);
    } catch (err) {
      console.error("PDF loading error:", err);
      let errorMessage = "Unable to load the PDF file";
      if (err instanceof Error) {
        if (err.message.includes("Invalid PDF")) {
          errorMessage = "Invalid PDF file format";
        } else if (err.message.includes("password")) {
          errorMessage = "Password-protected PDFs are not supported";
        } else if (err.message.includes("corrupt")) {
          errorMessage = "The PDF file appears to be corrupted";
        }
      }
      setPdfError(errorMessage);
      toast({
        title: "PDF loading failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingPDF(false);
    }
  };

  // Render PDF page
  const renderPage = async (pdf: any, pageIndex: number) => {
    if (!canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageIndex + 1);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const viewport = page.getViewport({ scale: zoom });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      setPageData({
        width: viewport.width,
        height: viewport.height,
      });

      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Initialize crop area based on page size if not set
      if (cropArea.width === 400 && cropArea.height === 500) {
        const initialCropArea = {
          x: viewport.width * 0.1,
          y: viewport.height * 0.1,
          width: viewport.width * 0.8,
          height: viewport.height * 0.8,
        };
        setCropArea(initialCropArea);
      }

      // Render preview if enabled
      if (showPreview) {
        renderCroppedPreview();
      }
    } catch (err) {
      console.error("Error rendering page:", err);
      setPdfError(
        `Failed to render page: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  // Render cropped preview
  const renderCroppedPreview = async () => {
    if (!previewCanvasRef.current || !pdfDocument || !canvasRef.current) return;

    try {
      const page = await pdfDocument.getPage(currentPage + 1);
      const previewCanvas = previewCanvasRef.current;
      const previewContext = previewCanvas.getContext("2d");
      if (!previewContext) return;

      const viewport = page.getViewport({ scale: zoom });

      // Calculate cropped dimensions
      const croppedWidth = cropArea.width;
      const croppedHeight = cropArea.height;

      previewCanvas.width = croppedWidth;
      previewCanvas.height = croppedHeight;
      previewCanvas.style.width = `${croppedWidth}px`;
      previewCanvas.style.height = `${croppedHeight}px`;

      // Render the full page first
      const tempCanvas = document.createElement("canvas");
      const tempContext = tempCanvas.getContext("2d");
      if (!tempContext) return;

      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;

      const renderContext = {
        canvasContext: tempContext,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Copy the cropped area to preview canvas
      previewContext.drawImage(
        tempCanvas,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        croppedWidth,
        croppedHeight,
      );
    } catch (err) {
      console.error("Error rendering preview:", err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Mouse event handlers for crop area interaction
  const getMousePosition = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = getMousePosition(e);

      // Check if clicking on resize handles
      const handleSize = 8;
      const handles = [
        {
          name: "nw",
          x: cropArea.x - handleSize / 2,
          y: cropArea.y - handleSize / 2,
        },
        {
          name: "ne",
          x: cropArea.x + cropArea.width - handleSize / 2,
          y: cropArea.y - handleSize / 2,
        },
        {
          name: "sw",
          x: cropArea.x - handleSize / 2,
          y: cropArea.y + cropArea.height - handleSize / 2,
        },
        {
          name: "se",
          x: cropArea.x + cropArea.width - handleSize / 2,
          y: cropArea.y + cropArea.height - handleSize / 2,
        },
        {
          name: "n",
          x: cropArea.x + cropArea.width / 2 - handleSize / 2,
          y: cropArea.y - handleSize / 2,
        },
        {
          name: "s",
          x: cropArea.x + cropArea.width / 2 - handleSize / 2,
          y: cropArea.y + cropArea.height - handleSize / 2,
        },
        {
          name: "w",
          x: cropArea.x - handleSize / 2,
          y: cropArea.y + cropArea.height / 2 - handleSize / 2,
        },
        {
          name: "e",
          x: cropArea.x + cropArea.width - handleSize / 2,
          y: cropArea.y + cropArea.height / 2 - handleSize / 2,
        },
      ];

      for (const handle of handles) {
        if (
          pos.x >= handle.x &&
          pos.x <= handle.x + handleSize &&
          pos.y >= handle.y &&
          pos.y <= handle.y + handleSize
        ) {
          setIsResizing(true);
          setResizeHandle(handle.name);
          setDragStart(pos);
          return;
        }
      }

      // Check if clicking inside crop area for dragging
      if (
        pos.x >= cropArea.x &&
        pos.x <= cropArea.x + cropArea.width &&
        pos.y >= cropArea.y &&
        pos.y <= cropArea.y + cropArea.height
      ) {
        setIsDragging(true);
        setDragStart({ x: pos.x - cropArea.x, y: pos.y - cropArea.y });
      }
    },
    [cropArea, getMousePosition],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getMousePosition(e);

      if (isResizing && resizeHandle) {
        const deltaX = pos.x - dragStart.x;
        const deltaY = pos.y - dragStart.y;

        let newCropArea = { ...cropArea };

        switch (resizeHandle) {
          case "nw":
            newCropArea.x += deltaX;
            newCropArea.y += deltaY;
            newCropArea.width -= deltaX;
            newCropArea.height -= deltaY;
            break;
          case "ne":
            newCropArea.y += deltaY;
            newCropArea.width += deltaX;
            newCropArea.height -= deltaY;
            break;
          case "sw":
            newCropArea.x += deltaX;
            newCropArea.width -= deltaX;
            newCropArea.height += deltaY;
            break;
          case "se":
            newCropArea.width += deltaX;
            newCropArea.height += deltaY;
            break;
          case "n":
            newCropArea.y += deltaY;
            newCropArea.height -= deltaY;
            break;
          case "s":
            newCropArea.height += deltaY;
            break;
          case "w":
            newCropArea.x += deltaX;
            newCropArea.width -= deltaX;
            break;
          case "e":
            newCropArea.width += deltaX;
            break;
        }

        // Ensure minimum size and bounds
        newCropArea.width = Math.max(50, newCropArea.width);
        newCropArea.height = Math.max(50, newCropArea.height);
        newCropArea.x = Math.max(
          0,
          Math.min(newCropArea.x, pageData.width - newCropArea.width),
        );
        newCropArea.y = Math.max(
          0,
          Math.min(newCropArea.y, pageData.height - newCropArea.height),
        );

        setCropArea(newCropArea);
        setDragStart(pos);
      } else if (isDragging) {
        const newX = Math.max(
          0,
          Math.min(pos.x - dragStart.x, pageData.width - cropArea.width),
        );
        const newY = Math.max(
          0,
          Math.min(pos.y - dragStart.y, pageData.height - cropArea.height),
        );

        setCropArea({
          ...cropArea,
          x: newX,
          y: newY,
        });
      }
    },
    [
      isResizing,
      isDragging,
      resizeHandle,
      dragStart,
      cropArea,
      pageData,
      getMousePosition,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle("");

    // Update preview after crop area change
    if (showPreview) {
      renderCroppedPreview();
    }
  }, [showPreview]);

  // Update preview when crop area changes
  useEffect(() => {
    if (showPreview && pdfDocument) {
      renderCroppedPreview();
    }
  }, [cropArea, showPreview]);

  // Re-render page when zoom changes
  useEffect(() => {
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage);
    }
  }, [zoom, currentPage]);

  const presetCropSettings = {
    custom: "Custom Crop Area",
    remove_margins: "Remove White Margins",
    letterhead: "Remove Letterhead",
    footer: "Remove Footer",
    sides: "Remove Side Margins",
  };

  const applyPreset = (preset: string) => {
    setCropSettings((prev) => ({ ...prev, preset }));

    if (!pageData.width || !pageData.height) return;

    let newCropArea = { ...cropArea };

    switch (preset) {
      case "remove_margins":
        const marginSize = Math.min(pageData.width, pageData.height) * 0.05; // 5% margin
        newCropArea = {
          x: marginSize,
          y: marginSize,
          width: pageData.width - marginSize * 2,
          height: pageData.height - marginSize * 2,
        };
        setCropSettings((prev) => ({
          ...prev,
          marginTop: 20,
          marginBottom: 20,
          marginLeft: 20,
          marginRight: 20,
        }));
        break;
      case "letterhead":
        const headerHeight = pageData.height * 0.15; // Remove top 15%
        newCropArea = {
          x: 0,
          y: headerHeight,
          width: pageData.width,
          height: pageData.height - headerHeight,
        };
        setCropSettings((prev) => ({
          ...prev,
          marginTop: 100,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0,
        }));
        break;
      case "footer":
        const footerHeight = pageData.height * 0.1; // Remove bottom 10%
        newCropArea = {
          x: 0,
          y: 0,
          width: pageData.width,
          height: pageData.height - footerHeight,
        };
        setCropSettings((prev) => ({
          ...prev,
          marginTop: 0,
          marginBottom: 80,
          marginLeft: 0,
          marginRight: 0,
        }));
        break;
      case "sides":
        const sideMargin = pageData.width * 0.1; // Remove 10% from each side
        newCropArea = {
          x: sideMargin,
          y: 0,
          width: pageData.width - sideMargin * 2,
          height: pageData.height,
        };
        setCropSettings((prev) => ({
          ...prev,
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 50,
          marginRight: 50,
        }));
        break;
      default:
        // Custom - keep current crop area
        return;
    }

    setCropArea(newCropArea);

    // Update preview if enabled
    if (showPreview) {
      setTimeout(() => renderCroppedPreview(), 100);
    }
  };

  const handleCrop = async () => {
    if (!file || !pdfDocument) return;

    // Check usage limits
    const usageCheck = await PDFService.checkUsageLimit();
    if (!usageCheck.canUpload) {
      setUsageLimitReached(true);
      if (!isAuthenticated) {
        setShowAuthModal(true);
      }
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      toast({
        title: `🔄 Cropping ${file.name}...`,
        description: "Applying crop settings to your PDF",
      });

      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      setProgress(20);

      // Perform actual PDF cropping
      const croppedPdfBytes = await cropPDFWithSettings();

      setProgress(95);

      // Track usage
      await PDFService.trackUsage("crop", 1, file.size);

      // Download the cropped file
      PDFService.downloadFile(croppedPdfBytes, `cropped-${file.name}`);

      setIsComplete(true);
      setProgress(100);

      toast({
        title: "Success!",
        description: "PDF cropped successfully",
      });
    } catch (error: any) {
      console.error("Error cropping PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to crop PDF file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Actual PDF cropping implementation
  const cropPDFWithSettings = async (): Promise<Uint8Array> => {
    if (!pdfDocument || !file) {
      throw new Error("PDF document not loaded");
    }

    try {
      const { loadPDFDocument, createPDFDocument } = await import(
        "@/lib/pdf-utils"
      );

      setProgress(30);

      // Load the original PDF
      const arrayBuffer = await file.file.arrayBuffer();
      const originalPdf = await loadPDFDocument(arrayBuffer);
      const croppedPdf = await createPDFDocument();

      setProgress(40);

      const totalPagesToProcess = cropSettings.applyToAllPages
        ? originalPdf.getPageCount()
        : 1;
      const pagesToProcess = cropSettings.applyToAllPages
        ? Array.from({ length: totalPagesToProcess }, (_, i) => i)
        : [currentPage];

      // Process each page
      for (let i = 0; i < pagesToProcess.length; i++) {
        const pageIndex = pagesToProcess[i];
        setProgress(40 + (i / pagesToProcess.length) * 50);

        // Get the page from original PDF
        const originalPage = originalPdf.getPage(pageIndex);
        const { width: originalWidth, height: originalHeight } =
          originalPage.getSize();

        // Calculate crop box based on current crop area and page dimensions
        let cropBox;
        if (cropSettings.preset === "custom") {
          // Use the interactive crop area (scaled to actual page dimensions)
          const scaleX = originalWidth / pageData.width;
          const scaleY = originalHeight / pageData.height;

          cropBox = {
            x: cropArea.x * scaleX,
            y: (pageData.height - cropArea.y - cropArea.height) * scaleY, // PDF coordinates are bottom-up
            width: cropArea.width * scaleX,
            height: cropArea.height * scaleY,
          };
        } else {
          // Use margin-based cropping
          cropBox = {
            x: cropSettings.marginLeft,
            y: cropSettings.marginBottom,
            width:
              originalWidth -
              cropSettings.marginLeft -
              cropSettings.marginRight,
            height:
              originalHeight -
              cropSettings.marginTop -
              cropSettings.marginBottom,
          };
        }

        // Ensure crop box is within page bounds
        cropBox.x = Math.max(0, cropBox.x);
        cropBox.y = Math.max(0, cropBox.y);
        cropBox.width = Math.min(cropBox.width, originalWidth - cropBox.x);
        cropBox.height = Math.min(cropBox.height, originalHeight - cropBox.y);

        // Create new page with cropped dimensions
        const newPage = croppedPdf.addPage([cropBox.width, cropBox.height]);

        // Copy the cropped content
        const [copiedPage] = await croppedPdf.copyPages(originalPdf, [
          pageIndex,
        ]);

        // Set the crop box on the copied page
        copiedPage.setCropBox(
          cropBox.x,
          cropBox.y,
          cropBox.x + cropBox.width,
          cropBox.y + cropBox.height,
        );

        // Scale and position the content
        newPage.drawPage(copiedPage, {
          x: -cropBox.x,
          y: -cropBox.y,
        });
      }

      setProgress(90);

      // Save the cropped PDF
      const pdfBytes = await croppedPdf.save();

      return pdfBytes;
    } catch (error) {
      console.error("Error in PDF cropping:", error);
      throw new Error("Failed to crop PDF pages");
    }
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PromoBanner className="mb-8" />

        {/* Navigation */}
        <div className="flex items-center space-x-2 mb-8">
          <Link
            to="/"
            className="text-body-medium text-text-light hover:text-brand-red"
          >
            <ArrowLeft className="w-4 h-4 mr-1 inline" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">Crop PDF</h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Remove unwanted areas from your PDF pages with precision cropping
            tools and live preview.
          </p>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload */}
            {!file && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFilesSelect}
                  multiple={false}
                  accept=".pdf"
                  maxSize={25}
                />
              </div>
            )}

            {/* PDF Preview and Crop Settings */}
            {file && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel - PDF Preview */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-heading-small text-text-dark">
                      PDF Preview & Crop Area
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                        disabled={zoom <= 0.5}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        {Math.round(zoom * 100)}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                        disabled={zoom >= 2}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className={
                          showPreview ? "bg-blue-50 text-blue-600" : ""
                        }
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* PDF Canvas Container */}
                  <div
                    ref={containerRef}
                    className="relative border border-gray-300 rounded-lg overflow-auto bg-gray-50"
                    style={{ maxHeight: "600px" }}
                  >
                    {isLoadingPDF && (
                      <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                          <span className="text-sm text-gray-600">
                            Loading PDF...
                          </span>
                        </div>
                      </div>
                    )}

                    {pdfError && (
                      <div className="flex items-center justify-center h-96">
                        <div className="text-center text-red-600">
                          <p className="font-medium">Failed to load PDF</p>
                          <p className="text-sm">{pdfError}</p>
                        </div>
                      </div>
                    )}

                    {pdfDocument && !isLoadingPDF && !pdfError && (
                      <div className="relative inline-block">
                        <canvas
                          ref={canvasRef}
                          className="block shadow-sm"
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          style={{
                            cursor:
                              isDragging || isResizing
                                ? "grabbing"
                                : "crosshair",
                          }}
                        />

                        {/* Crop Area Overlay */}
                        <div
                          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10"
                          style={{
                            left: cropArea.x,
                            top: cropArea.y,
                            width: cropArea.width,
                            height: cropArea.height,
                            pointerEvents: "none",
                          }}
                        >
                          {/* Resize Handles */}
                          {["nw", "ne", "sw", "se", "n", "s", "w", "e"].map(
                            (handle) => {
                              let style: React.CSSProperties = {
                                position: "absolute",
                                width: "8px",
                                height: "8px",
                                backgroundColor: "#3b82f6",
                                border: "2px solid white",
                                pointerEvents: "all",
                                cursor: `${handle}-resize`,
                              };

                              switch (handle) {
                                case "nw":
                                  style = { ...style, top: -4, left: -4 };
                                  break;
                                case "ne":
                                  style = { ...style, top: -4, right: -4 };
                                  break;
                                case "sw":
                                  style = { ...style, bottom: -4, left: -4 };
                                  break;
                                case "se":
                                  style = { ...style, bottom: -4, right: -4 };
                                  break;
                                case "n":
                                  style = {
                                    ...style,
                                    top: -4,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                  };
                                  break;
                                case "s":
                                  style = {
                                    ...style,
                                    bottom: -4,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                  };
                                  break;
                                case "w":
                                  style = {
                                    ...style,
                                    left: -4,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                  };
                                  break;
                                case "e":
                                  style = {
                                    ...style,
                                    right: -4,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                  };
                                  break;
                              }

                              return <div key={handle} style={style} />;
                            },
                          )}

                          {/* Crop Area Info */}
                          <div className="absolute -top-8 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            {Math.round(cropArea.width)} ×{" "}
                            {Math.round(cropArea.height)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Page Navigation */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPage = Math.max(0, currentPage - 1);
                          setCurrentPage(newPage);
                          renderPage(pdfDocument, newPage);
                        }}
                        disabled={currentPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPage = Math.min(
                            totalPages - 1,
                            currentPage + 1,
                          );
                          setCurrentPage(newPage);
                          renderPage(pdfDocument, newPage);
                        }}
                        disabled={currentPage === totalPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  )}

                  {/* Live Preview */}
                  {showPreview && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Crop className="w-4 h-4 mr-2" />
                        Cropped Preview
                      </h4>
                      <div className="border border-gray-300 rounded bg-white p-2 max-h-64 overflow-auto">
                        <canvas
                          ref={previewCanvasRef}
                          className="block mx-auto shadow-sm"
                          style={{ maxWidth: "100%" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Panel - Crop Settings */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-heading-small text-text-dark">
                      Crop Settings
                    </h3>
                    <Button variant="outline" onClick={() => setFile(null)}>
                      Choose Different File
                    </Button>
                  </div>

                  {/* File Info */}
                  <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50 mb-6">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-dark truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-text-light">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  {/* Crop Presets */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Square className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-text-dark">
                        Crop Presets
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(presetCropSettings).map(
                        ([key, label]) => (
                          <button
                            key={key}
                            onClick={() => applyPreset(key)}
                            className={cn(
                              "p-3 text-left border rounded-lg transition-all",
                              cropSettings.preset === key
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300",
                            )}
                          >
                            <div className="font-medium text-sm">{label}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {key === "custom" && "Define your own crop area"}
                              {key === "remove_margins" &&
                                "Remove white space around content"}
                              {key === "letterhead" &&
                                "Remove header/letterhead"}
                              {key === "footer" && "Remove footer area"}
                              {key === "sides" &&
                                "Remove left and right margins"}
                            </div>
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Manual Margin Settings */}
                  {cropSettings.preset === "custom" && (
                    <div className="space-y-4 mb-6">
                      <h4 className="text-sm font-medium text-text-dark flex items-center gap-2">
                        <Move className="w-4 h-4" />
                        Manual Crop Area
                      </h4>
                      <div className="text-sm text-gray-600">
                        Use the interactive overlay on the PDF preview to adjust
                        the crop area, or use the preset options above for
                        common cropping scenarios.
                      </div>
                    </div>
                  )}

                  {/* Apply to All Pages Option */}
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="applyToAll"
                      checked={cropSettings.applyToAllPages}
                      onChange={(e) =>
                        setCropSettings((prev) => ({
                          ...prev,
                          applyToAllPages: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <label
                      htmlFor="applyToAll"
                      className="text-sm text-gray-700"
                    >
                      Apply cropping to all pages
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          Live Crop Preview
                        </p>
                        <p className="text-sm text-blue-700">
                          Use the eye icon to toggle the live preview. Drag the
                          blue overlay to reposition and use the handles to
                          resize the crop area.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Limit Warning */}
            {usageLimitReached && !isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-heading-small text-text-dark mb-2">
                  Daily Limit Reached
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  You've used your 3 free PDF operations today. Sign up to
                  continue!
                </p>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-brand-red hover:bg-red-600"
                >
                  Sign Up Free
                </Button>
              </div>
            )}

            {usageLimitReached && isAuthenticated && !user?.isPremium && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-heading-small text-text-dark mb-2">
                  Upgrade to Premium
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  You've reached your daily limit. Upgrade to Premium for
                  unlimited access!
                </p>
                <Button
                  className="bg-brand-yellow text-black hover:bg-yellow-400"
                  asChild
                >
                  <Link to="/pricing">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Link>
                </Button>
              </div>
            )}

            {/* Crop Button */}
            {file && !usageLimitReached && (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleCrop}
                  disabled={isProcessing}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Cropping PDF...
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5 mr-2" />
                      Crop PDF
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Cropping your PDF...
                </h3>
                <p className="text-body-medium text-text-light">
                  Applying crop settings to remove unwanted areas
                </p>
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-heading-small text-text-dark mb-2">
              PDF cropped successfully!
            </h3>
            <p className="text-body-medium text-text-light mb-6">
              Your PDF has been cropped and is ready for download
            </p>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => {
                  setFile(null);
                  setIsComplete(false);
                  setProgress(0);
                  setPdfDocument(null);
                  setShowPreview(false);
                }}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Crop Another PDF
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 sm:mt-12 px-4 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center px-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="font-semibold text-text-dark mb-2 text-sm sm:text-base">
                Interactive Cropping
              </h4>
              <p className="text-xs sm:text-sm text-text-light leading-relaxed max-w-xs mx-auto">
                Drag and resize crop areas with real-time visual feedback
              </p>
            </div>

            <div className="text-center px-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="font-semibold text-text-dark mb-2 text-sm sm:text-base">
                Live Preview
              </h4>
              <p className="text-xs sm:text-sm text-text-light leading-relaxed max-w-xs mx-auto">
                See exactly how your cropped PDF will look before processing
              </p>
            </div>

            <div className="text-center px-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-purple-500" />
              </div>
              <h4 className="font-semibold text-text-dark mb-2 text-sm sm:text-base">
                Smart Presets
              </h4>
              <p className="text-xs sm:text-sm text-text-light leading-relaxed max-w-xs mx-auto">
                Quick presets for common tasks like removing margins and headers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="register"
      />
    </div>
  );
};

export default CropPdf;
