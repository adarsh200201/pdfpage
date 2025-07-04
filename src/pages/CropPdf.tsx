import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import AuthModal from "@/components/auth/AuthModal";
import {
  Upload,
  Download,
  RotateCw,
  Move,
  Square,
  Monitor,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Target,
  Settings,
  Eye,
  Scissors,
  FileText,
  Lock,
  Unlock,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
} from "lucide-react";

interface CropSettings {
  aspectRatio: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  applyToAllPages: boolean;
  quality: number;
}

interface CropPreset {
  id: string;
  name: string;
  description: string;
  ratio: number | null;
  icon: any;
  category: string;
}

const CropPdf = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cropperReady, setCropperReady] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("free");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [croppedPdfBytes, setCroppedPdfBytes] = useState<Uint8Array | null>(
    null,
  );
  const [croppedFileName, setCroppedFileName] = useState<string>("");

  // PDF specific states
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Clear any cached cropped PDF data on component mount
  useEffect(() => {
    setCroppedPdfBytes(null);
    setCroppedFileName("");
    setProgress(0);
    setIsComplete(false);
  }, []);

  const [settings, setSettings] = useState<CropSettings>({
    aspectRatio: "free",
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    rotation: 0,
    applyToAllPages: true,
    quality: 85,
  });

  const cropPresets: CropPreset[] = [
    {
      id: "free",
      name: "Free Form",
      description: "No aspect ratio constraint",
      ratio: null,
      icon: Move,
      category: "Basic",
    },
    {
      id: "square",
      name: "Square",
      description: "Perfect square crop",
      ratio: 1,
      icon: Square,
      category: "Basic",
    },
    {
      id: "letterhead",
      name: "Remove Header",
      description: "Remove letterhead/header area",
      ratio: null,
      icon: FileText,
      category: "Document",
    },
    {
      id: "footer",
      name: "Remove Footer",
      description: "Remove footer area",
      ratio: null,
      icon: FileText,
      category: "Document",
    },
    {
      id: "margins",
      name: "Remove Margins",
      description: "Remove white margins",
      ratio: null,
      icon: Target,
      category: "Document",
    },
    {
      id: "a4",
      name: "A4 Document",
      description: "Standard A4 ratio",
      ratio: 1.414,
      icon: FileText,
      category: "Document",
    },
    {
      id: "letter",
      name: "US Letter",
      description: "US Letter size ratio",
      ratio: 1.294,
      icon: FileText,
      category: "Document",
    },
    {
      id: "16-9",
      name: "Widescreen 16:9",
      description: "Widescreen format",
      ratio: 16 / 9,
      icon: Monitor,
      category: "Screen",
    },
  ];

  const handleFileSelect = useCallback(
    (file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a PDF smaller than 25MB.",
          variant: "destructive",
        });
        return;
      }

      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setIsComplete(false);
      setCropperReady(false);
      setUsageLimitReached(false);
      // Clear any previously cropped PDF data
      setCroppedPdfBytes(null);
      setCroppedFileName("");
      setProgress(0);
      loadPDFForPreview(file);
    },
    [toast],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Clear any existing cropped data before selecting new file
        setCroppedPdfBytes(null);
        setCroppedFileName("");
        setIsComplete(false);
        setProgress(0);
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const pdfFiles = files.filter((file) => file.type === "application/pdf");

      if (pdfFiles.length > 0) {
        handleFileSelect(pdfFiles[0]);
      } else {
        toast({
          title: "Invalid file",
          description: "Please drop a PDF file.",
          variant: "destructive",
        });
      }
    },
    [handleFileSelect, toast],
  );

  // Load PDF and convert first page to image for cropping with mobile optimization
  const loadPDFForPreview = async (pdfFile: File) => {
    setIsLoadingPDF(true);
    setPdfError(null);

    try {
      console.log("🚀 Loading PDF for crop preview:", pdfFile.name);
      const pdfjsLib = await import("pdfjs-dist");

      // Configure worker with mobile-optimized settings and correct version
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
      }

      const arrayBuffer = await pdfFile.arrayBuffer();
      console.log(`📄 PDF ArrayBuffer loaded: ${arrayBuffer.byteLength} bytes`);

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
        cMapPacked: true,
        standardFontDataUrl:
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/",
        verbosity: 0,
        // Mobile optimizations
        useSystemFonts: true,
        disableFontFace: false,
        nativeImageDecoderSupport: "display",
        useWorkerFetch: false, // Better mobile compatibility
      });

      console.log("⏳ Loading PDF document...");
      const pdf = await loadingTask.promise;
      console.log(`📚 PDF loaded successfully: ${pdf.numPages} pages`);

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(0);

      // Render first page to canvas and convert to image URL
      await renderPageToImage(pdf, 0);

      toast({
        title: "PDF loaded successfully",
        description: `Document has ${pdf.numPages} pages`,
        duration: 3000,
      });
    } catch (err) {
      console.error("❌ PDF loading error:", err);
      let errorMessage = "Unable to load the PDF file";

      if (err instanceof Error) {
        console.error("Error details:", err.message, err.stack);
        if (err.message.includes("Invalid PDF")) {
          errorMessage = "Invalid PDF file format";
        } else if (err.message.includes("password")) {
          errorMessage = "Password-protected PDFs are not supported";
        } else if (err.message.includes("corrupt")) {
          errorMessage = "The PDF file appears to be corrupted";
        } else if (
          err.message.includes("worker") ||
          err.message.includes("Worker")
        ) {
          errorMessage = "PDF processing failed. Please try again.";
        } else if (err.message.includes("timeout")) {
          errorMessage = "PDF loading timed out. Please try a smaller file.";
        }
      }

      // On mobile, try a different approach or show more helpful error
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        console.log(
          "📱 Mobile PDF loading failed, providing mobile-specific guidance",
        );
        errorMessage += " (Try using a smaller PDF file on mobile)";
      }

      setPdfError(errorMessage);
      toast({
        title: "PDF loading failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoadingPDF(false);
    }
  };

  // Render PDF page to image for cropping with mobile optimization
  const renderPageToImage = async (pdf: any, pageIndex: number) => {
    try {
      console.log(`🎨 Rendering page ${pageIndex + 1} for crop preview...`);
      const page = await pdf.getPage(pageIndex + 1);

      // Mobile-optimized scaling
      const isMobile = window.innerWidth <= 768;
      const scale = isMobile ? 1.5 : 2; // Reduced scale on mobile for better performance
      const viewport = page.getViewport({ scale });

      console.log(
        `📐 Viewport: ${viewport.width}x${viewport.height} at scale ${scale} (mobile: ${isMobile})`,
      );

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", {
        alpha: false,
        willReadFrequently: false, // Optimize for one-time rendering
        desynchronized: true, // Better performance on mobile
      });

      if (!context) {
        throw new Error("Could not get canvas context");
      }

      // Set reasonable canvas size limits for mobile
      const maxWidth = isMobile ? 800 : 1200;
      const maxHeight = isMobile ? 1000 : 1600;

      canvas.width = Math.min(viewport.width, maxWidth);
      canvas.height = Math.min(viewport.height, maxHeight);

      // Adjust viewport if canvas was resized
      const adjustedViewport = page.getViewport({
        scale:
          Math.min(
            canvas.width / viewport.width,
            canvas.height / viewport.height,
          ) * scale,
      });

      console.log(`🖼️ Canvas created: ${canvas.width}x${canvas.height}`);

      // Fill with white background
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: adjustedViewport,
        intent: "display",
        renderInteractiveForms: false,
        annotationMode: 0, // Disable annotations for cleaner render
      };

      console.log("🎨 Starting page render...");

      // Add timeout for mobile rendering
      const renderPromise = page.render(renderContext).promise;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Render timeout")),
          isMobile ? 15000 : 20000,
        );
      });

      await Promise.race([renderPromise, timeoutPromise]);
      console.log("✅ Page render completed successfully");

      // Convert canvas to blob and create URL with mobile-optimized quality
      const quality = isMobile ? 0.85 : 0.95;
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(`📷 Created preview blob: ${blob.size} bytes`);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
          } else {
            throw new Error("Failed to create blob from canvas");
          }
        },
        "image/jpeg",
        quality,
      ); // Use JPEG with quality for smaller file size

      // Clean up canvas
      canvas.remove();
    } catch (err) {
      console.error("❌ Error rendering page:", err);

      // Provide more specific error handling for mobile
      const isMobile = window.innerWidth <= 768;
      let errorMessage = "Failed to render PDF page";

      if (err instanceof Error) {
        if (err.message.includes("timeout")) {
          errorMessage = isMobile
            ? "PDF rendering timed out on mobile. Try a smaller file."
            : "PDF rendering timed out. Please try again.";
        } else if (
          err.message.includes("memory") ||
          err.message.includes("out of memory")
        ) {
          errorMessage = "PDF is too large to process. Try a smaller file.";
        }
      }

      setPdfError(errorMessage);
      toast({
        title: "Render Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const getCropper = () => {
    return cropperRef.current?.cropper;
  };

  const getCropData = useCallback(() => {
    const cropper = getCropper();
    if (!cropper) return null;

    try {
      const cropBoxData = cropper.getCropBoxData();
      const canvasData = cropper.getCanvasData();
      const imageData = cropper.getImageData();

      console.log("🔍 Cropper data:", {
        cropBox: cropBoxData,
        canvas: canvasData,
        image: imageData,
      });

      // Get the actual displayed image bounds within the canvas
      const imageLeft = canvasData.left;
      const imageTop = canvasData.top;
      const imageWidth = canvasData.width;
      const imageHeight = canvasData.height;

      // Calculate crop coordinates relative to the displayed image
      const relativeX = Math.max(0, cropBoxData.left - imageLeft);
      const relativeY = Math.max(0, cropBoxData.top - imageTop);
      const relativeWidth = Math.min(cropBoxData.width, imageWidth - relativeX);
      const relativeHeight = Math.min(
        cropBoxData.height,
        imageHeight - relativeY,
      );

      // Scale to the natural image dimensions
      const scaleX = imageData.naturalWidth / imageWidth;
      const scaleY = imageData.naturalHeight / imageHeight;

      const x = Math.round(relativeX * scaleX);
      const y = Math.round(relativeY * scaleY);
      const width = Math.round(relativeWidth * scaleX);
      const height = Math.round(relativeHeight * scaleY);

      const cropData = { x, y, width, height };
      console.log("✂️ Calculated crop data:", cropData);

      return cropData;
    } catch (error) {
      console.error("Error getting crop data:", error);
      return null;
    }
  }, []);

  const handlePresetSelect = (presetId: string) => {
    const preset = cropPresets.find((p) => p.id === presetId);
    if (!preset) return;

    const cropper = getCropper();
    setSelectedPreset(presetId);

    if (cropper) {
      if (preset.ratio !== null) {
        cropper.setAspectRatio(preset.ratio);
        setAspectRatioLocked(true);
      } else {
        cropper.setAspectRatio(NaN);
        setAspectRatioLocked(false);
      }

      // Apply preset-specific crop areas
      if (presetId === "letterhead") {
        // Remove top 15% (letterhead)
        const imageData = cropper.getImageData();
        cropper.setCropBoxData({
          left: 0,
          top: imageData.height * 0.15,
          width: imageData.width,
          height: imageData.height * 0.85,
        });
      } else if (presetId === "footer") {
        // Remove bottom 10% (footer)
        const imageData = cropper.getImageData();
        cropper.setCropBoxData({
          left: 0,
          top: 0,
          width: imageData.width,
          height: imageData.height * 0.9,
        });
      } else if (presetId === "margins") {
        // Remove 5% margins from all sides
        const imageData = cropper.getImageData();
        const margin = 0.05;
        cropper.setCropBoxData({
          left: imageData.width * margin,
          top: imageData.height * margin,
          width: imageData.width * (1 - 2 * margin),
          height: imageData.height * (1 - 2 * margin),
        });
      }
    }

    toast({
      title: "Preset Applied",
      description: `${preset.name} settings have been applied.`,
    });
  };

  const handleZoom = (ratio: number) => {
    const cropper = getCropper();
    if (cropper) {
      cropper.zoom(ratio);
    }
  };

  const handleRotate = (degrees: number) => {
    const cropper = getCropper();
    if (cropper) {
      cropper.rotate(degrees);
      setSettings((prev) => ({
        ...prev,
        rotation: (prev.rotation + degrees) % 360,
      }));
    }
  };

  const handleReset = () => {
    const cropper = getCropper();
    if (cropper) {
      cropper.reset();
      setSettings((prev) => ({ ...prev, rotation: 0 }));
    }
  };

  const onCropperReady = () => {
    setCropperReady(true);
    toast({
      title: "Cropper Ready",
      description: "You can now adjust the crop area and crop your PDF.",
    });
  };

  const onCrop = () => {
    const cropData = getCropData();
    if (cropData) {
      setSettings((prev) => ({
        ...prev,
        x: cropData.x,
        y: cropData.y,
        width: cropData.width,
        height: cropData.height,
      }));
    }
  };

  const handleManualDownload = async () => {
    if (!croppedPdfBytes || !croppedFileName) {
      toast({
        title: "No PDF to Download",
        description: "Please crop a PDF first before downloading.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(
        `📥 Downloading cropped PDF: ${croppedFileName} (${croppedPdfBytes.length} bytes)`,
      );
      const { downloadPDF } = await import("@/utils/pdfExport");
      await downloadPDF(croppedPdfBytes, croppedFileName);

      toast({
        title: "Download Started",
        description: "Your cropped PDF is downloading.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your file.",
        variant: "destructive",
      });
    }
  };

  const handleCrop = async () => {
    if (!selectedFile || !pdfDocument) {
      toast({
        title: "No PDF selected",
        description: "Please select a PDF to crop.",
        variant: "destructive",
      });
      return;
    }

    const cropData = getCropData();
    if (!cropData) {
      toast({
        title: "Invalid crop area",
        description: "Please select a valid crop area.",
        variant: "destructive",
      });
      return;
    }

    // Validate crop data
    if (cropData.width <= 0 || cropData.height <= 0) {
      toast({
        title: "Invalid crop dimensions",
        description: "Crop area must have positive width and height.",
        variant: "destructive",
      });
      return;
    }

    console.log("🚀 Starting PDF crop with data:", cropData);

    // Check authentication for non-authenticated users
    if (!isAuthenticated) {
      const usageCheck = await PDFService.checkUsageLimit();
      if (!usageCheck.canUpload) {
        setUsageLimitReached(true);
        setShowAuthModal(true);
        return;
      }
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      toast({
        title: `🔄 Cropping ${selectedFile.name}...`,
        description: "Applying crop settings to your PDF",
      });

      setProgress(20);

      // Track usage before processing
      await PDFService.trackUsage("crop");

      setProgress(40);

      // Perform actual PDF cropping
      const croppedPdfBytes = await cropPDFWithSettings(cropData);

      setProgress(90);

      // Store PDF for manual download (no automatic download)
      const fileName = `${selectedFile.name.replace(".pdf", "")}_cropped.pdf`;

      console.log(
        `✅ Crop completed - storing ${croppedPdfBytes.length} bytes as ${fileName}`,
      );

      // Store the cropped PDF bytes and filename for download button
      setCroppedPdfBytes(croppedPdfBytes);
      setCroppedFileName(fileName);

      setProgress(100);
      setIsComplete(true);

      toast({
        title: "✅ Crop Complete!",
        description: `PDF cropped successfully. Click the download button to save your file.`,
        duration: 3000,
      });
    } catch (error) {
      console.error("���� PDF crop failed:", error);
      toast({
        title: "Crop Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Improved PDF cropping implementation
  const cropPDFWithSettings = async (cropData: any): Promise<Uint8Array> => {
    if (!selectedFile || !pdfDocument) {
      throw new Error("No PDF file selected or PDF not loaded");
    }

    try {
      // Use pdf-lib for cropping
      const pdfLib = await import("pdf-lib");
      setProgress(30);

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await pdfLib.PDFDocument.load(arrayBuffer);
      const newPdfDoc = await pdfLib.PDFDocument.create();

      setProgress(50);

      const pages = pdfDoc.getPages();
      const pagesToProcess = settings.applyToAllPages
        ? pages
        : [pages[currentPage]];

      console.log("🔧 Crop data received:", cropData);
      console.log("📄 Processing", pagesToProcess.length, "pages");

      for (let i = 0; i < pagesToProcess.length; i++) {
        const page = pagesToProcess[i];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();

        setProgress(50 + (i / pagesToProcess.length) * 30);

        console.log(`📄 Page ${i + 1} size: ${pdfWidth} x ${pdfHeight}`);

        // Get the rendered image dimensions from the cropper
        const cropper = getCropper();
        if (!cropper) {
          throw new Error("Cropper not initialized");
        }

        const imageData = cropper.getImageData();
        const canvasData = cropper.getCanvasData();

        // The imageData gives us the actual rendered size of the PDF page image
        const renderedWidth = imageData.naturalWidth;
        const renderedHeight = imageData.naturalHeight;

        console.log(
          `���️ Rendered image size: ${renderedWidth} x ${renderedHeight}`,
        );
        console.log(
          `✂️ Crop area from cropper: x=${cropData.x}, y=${cropData.y}, w=${cropData.width}, h=${cropData.height}`,
        );

        // Calculate scaling factors from rendered image to actual PDF
        const scaleX = pdfWidth / renderedWidth;
        const scaleY = pdfHeight / renderedHeight;

        console.log(
          `📐 Scale factors: X=${scaleX.toFixed(4)}, Y=${scaleY.toFixed(4)}`,
        );

        // Validate that crop area is within image bounds
        if (
          cropData.x + cropData.width > renderedWidth ||
          cropData.y + cropData.height > renderedHeight
        ) {
          console.warn(
            "⚠️ Crop area extends beyond image bounds, adjusting...",
          );
        }

        // Convert crop coordinates to PDF coordinates
        // Note: PDF coordinate system has origin at bottom-left, cropper has origin at top-left
        const cropBox = {
          x: Math.max(0, cropData.x * scaleX),
          y: Math.max(
            0,
            (renderedHeight - cropData.y - cropData.height) * scaleY,
          ), // Flip Y coordinate
          width: Math.min(cropData.width * scaleX, pdfWidth),
          height: Math.min(cropData.height * scaleY, pdfHeight),
        };

        console.log(`📦 Calculated crop box (PDF coords):`, {
          x: cropBox.x.toFixed(2),
          y: cropBox.y.toFixed(2),
          width: cropBox.width.toFixed(2),
          height: cropBox.height.toFixed(2),
        });

        // Ensure crop box is within page bounds
        cropBox.x = Math.max(0, Math.min(cropBox.x, pdfWidth - 1));
        cropBox.y = Math.max(0, Math.min(cropBox.y, pdfHeight - 1));
        cropBox.width = Math.max(
          1,
          Math.min(cropBox.width, pdfWidth - cropBox.x),
        );
        cropBox.height = Math.max(
          1,
          Math.min(cropBox.height, pdfHeight - cropBox.y),
        );

        console.log(`📦 Adjusted crop box:`, cropBox);

        // Create new page and copy content
        const pageIndex = settings.applyToAllPages ? i : currentPage;
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);

        // Apply crop box - using absolute coordinates
        const left = cropBox.x;
        const bottom = cropBox.y;
        const right = cropBox.x + cropBox.width;
        const top = cropBox.y + cropBox.height;

        console.log(
          `📦 Setting crop box: left=${left.toFixed(2)}, bottom=${bottom.toFixed(2)}, right=${right.toFixed(2)}, top=${top.toFixed(2)}`,
        );

        // Set the crop box on the copied page
        copiedPage.setCropBox(left, bottom, right, top);

        // Also set media box to match crop box for better compatibility
        copiedPage.setMediaBox(left, bottom, right, top);

        // Set bleed box and trim box to ensure proper cropping
        copiedPage.setBleedBox(left, bottom, right, top);
        copiedPage.setTrimBox(left, bottom, right, top);

        newPdfDoc.addPage(copiedPage);
      }

      setProgress(90);

      // Generate the cropped PDF
      const pdfBytes = await newPdfDoc.save();

      console.log("✅ PDF cropping completed successfully");
      return pdfBytes;
    } catch (error) {
      console.error("❌ PDF cropping failed:", error);
      throw new Error(
        `PDF cropping failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <Link
            to="/"
            className="flex items-center text-emerald-600 hover:text-emerald-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        {isComplete ? (
          /* Success State with Download Button */
          <div className="text-center bg-white rounded-2xl shadow-2xl p-8 border-2 border-green-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-pulse">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              🎉 PDF Cropped Successfully!
            </h2>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-2">
                Processing Complete
              </h3>
              <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                Crop settings applied successfully
              </p>
            </div>

            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  PDF Cropped Successfully!
                </h3>
                <p className="text-green-700 mb-4">
                  Your PDF has been cropped and is ready for download.
                </p>

                {/* Download Button */}
                <Button
                  onClick={handleManualDownload}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 min-h-[50px] w-full sm:w-auto touch-manipulation"
                  disabled={!croppedPdfBytes}
                >
                  <Download className="w-6 h-6 mr-3" />
                  <span className="text-sm sm:text-base">
                    Download Cropped PDF
                  </span>
                </Button>

                {/* Debug info in development */}
                {process.env.NODE_ENV === "development" && (
                  <p className="text-xs text-gray-500 mt-2">
                    Debug:{" "}
                    {croppedPdfBytes
                      ? `${croppedPdfBytes.length} bytes ready`
                      : "No data"}{" "}
                    | File: {croppedFileName || "None"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setIsComplete(false);
                  setProgress(0);
                  setPdfDocument(null);
                  setPreviewUrl("");
                  setCropperReady(false);
                  setCroppedPdfBytes(null);
                  setCroppedFileName("");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] touch-manipulation"
              >
                <span className="font-medium">Crop Another PDF</span>
              </Button>
              <Button
                variant="outline"
                asChild
                className="min-h-[44px] touch-manipulation"
              >
                <Link to="/">
                  <span className="font-medium">Back to Home</span>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {!selectedFile ? (
              <div className="max-w-4xl mx-auto">
                {/* Tool Description */}
                <div className="text-center mb-12">
                  <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 rounded-2xl w-fit mx-auto mb-6">
                    <Scissors className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">
                    Crop PDF
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                    Crop and remove unwanted areas from your PDF pages using our
                    professional cropping tool with real-time preview and
                    precision controls.
                  </p>
                </div>

                {/* Upload Section */}
                <div className="max-w-2xl mx-auto mb-12">
                  <Card className="border-0 shadow-xl bg-white">
                    <CardHeader className="text-center">
                      <CardTitle className="flex items-center justify-center gap-2 text-xl">
                        <Upload className="w-6 h-6 text-emerald-600" />
                        Upload PDF to Crop
                      </CardTitle>
                      <CardDescription className="text-base">
                        Select a PDF file to crop (up to 25MB)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div
                        className={`border-2 border-dashed rounded-xl p-12 text-center hover:border-emerald-400 transition-all duration-200 cursor-pointer ${
                          isDragging
                            ? "border-emerald-500 bg-emerald-50 scale-[1.02]"
                            : "border-gray-300"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="space-y-6">
                          <Upload className="w-16 h-16 mx-auto text-gray-400" />
                          <div>
                            <p className="text-xl font-medium text-gray-700 mb-2">
                              {isDragging
                                ? "Drop your PDF here"
                                : "Click to upload or drag & drop"}
                            </p>
                            <p className="text-gray-500">
                              Support for PDF files up to 25MB
                            </p>
                          </div>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Features */}
                <Card className="max-w-4xl mx-auto">
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="text-center p-6">
                        <Target className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Precision Tools
                        </h3>
                        <p className="text-gray-600">
                          Exact crop positioning and sizing with professional
                          controls
                        </p>
                      </div>
                      <div className="text-center p-6">
                        <Eye className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Live Preview
                        </h3>
                        <p className="text-gray-600">
                          Real-time crop preview with instant visual feedback
                        </p>
                      </div>
                      <div className="text-center p-6">
                        <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Document Presets
                        </h3>
                        <p className="text-gray-600">
                          Remove headers, footers, margins with one click
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Info */}
                <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-emerald-600" />
                        <div>
                          <p className="font-medium text-sm sm:text-base">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            {totalPages > 0 && (
                              <>
                                {" "}
                                · {totalPages} page{totalPages !== 1 ? "s" : ""}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl("");
                          setCropperReady(false);
                          // Clear cropped PDF data when changing files
                          setCroppedPdfBytes(null);
                          setCroppedFileName("");
                          setIsComplete(false);
                          setProgress(0);
                        }}
                      >
                        Change PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Crop Presets */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-emerald-600" />
                      Crop Presets
                    </CardTitle>
                    <CardDescription>
                      Choose from optimized crop settings for different document
                      needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {cropPresets.map((preset) => (
                        <Card
                          key={preset.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 touch-manipulation ${
                            selectedPreset === preset.id
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-emerald-300"
                          }`}
                          onClick={() => handlePresetSelect(preset.id)}
                        >
                          <CardContent className="p-3 text-center min-h-[100px] flex flex-col justify-center">
                            <preset.icon className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                            <h3 className="font-semibold text-xs sm:text-sm mb-1">
                              {preset.name}
                            </h3>
                            <p className="text-xs text-gray-600 mb-1">
                              {preset.ratio
                                ? `${preset.ratio.toFixed(2)}:1`
                                : "Free"}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {preset.category}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Crop Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* PDF Preview & Crop Area */}
                {previewUrl && (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <span className="hidden sm:inline">
                            Interactive Crop Editor
                          </span>
                          <span className="sm:hidden">Crop Editor</span>
                          {cropperReady && (
                            <Badge variant="outline" className="ml-2">
                              Ready
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleZoom(0.1)}
                            disabled={!cropperReady}
                            className="flex-shrink-0 min-h-[40px] min-w-[40px] touch-manipulation"
                          >
                            <ZoomIn className="w-4 h-4" />
                            <span className="ml-1 hidden sm:inline">In</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleZoom(-0.1)}
                            disabled={!cropperReady}
                            className="flex-shrink-0 min-h-[40px] min-w-[40px] touch-manipulation"
                          >
                            <ZoomOut className="w-4 h-4" />
                            <span className="ml-1 hidden sm:inline">Out</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowGrid(!showGrid)}
                            className="flex-shrink-0 min-h-[40px] touch-manipulation"
                          >
                            <Grid3X3 className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Grid</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAspectRatioLocked(!aspectRatioLocked)
                            }
                            className="flex-shrink-0 min-h-[40px] touch-manipulation"
                          >
                            {aspectRatioLocked ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">Lock</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingPDF ? (
                        <div className="h-96 flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
                            <span className="text-sm text-gray-600 font-medium">
                              Loading PDF...
                            </span>
                          </div>
                        </div>
                      ) : pdfError ? (
                        <div className="h-96 flex items-center justify-center">
                          <div className="text-center text-red-600">
                            <FileText className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="font-medium text-sm">Load Failed</p>
                            <p className="text-xs mt-1">{pdfError}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <Cropper
                            ref={cropperRef}
                            src={previewUrl}
                            style={{ height: 500, width: "100%" }}
                            aspectRatio={
                              selectedPreset === "free"
                                ? NaN
                                : cropPresets.find(
                                    (p) => p.id === selectedPreset,
                                  )?.ratio || NaN
                            }
                            guides={showGrid}
                            background={false}
                            rotatable={true}
                            scalable={true}
                            zoomable={true}
                            viewMode={1}
                            dragMode="move"
                            minCropBoxHeight={10}
                            minCropBoxWidth={10}
                            autoCropArea={0.8}
                            checkOrientation={false}
                            responsive={true}
                            restore={false}
                            checkCrossOrigin={false}
                            cropBoxMovable={true}
                            cropBoxResizable={true}
                            toggleDragModeOnDblclick={false}
                            ready={onCropperReady}
                            crop={onCrop}
                          />
                        </div>
                      )}

                      {/* Transform Controls */}
                      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRotate(-90)}
                          disabled={!cropperReady}
                          className="min-h-[44px] min-w-[80px] touch-manipulation"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">-90°</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRotate(90)}
                          disabled={!cropperReady}
                          className="min-h-[44px] min-w-[80px] touch-manipulation"
                        >
                          <RotateCw className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">+90°</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                          disabled={!cropperReady}
                          className="min-h-[44px] touch-manipulation"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Reset</span>
                        </Button>
                      </div>

                      {/* Current crop info */}
                      {cropperReady && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-gray-600">X</Label>
                              <p className="font-semibold">{settings.x}px</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Y</Label>
                              <p className="font-semibold">{settings.y}px</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">
                                Width
                              </Label>
                              <p className="font-semibold">
                                {settings.width}px
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">
                                Height
                              </Label>
                              <p className="font-semibold">
                                {settings.height}px
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Page Navigation for multi-page PDFs */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newPage = Math.max(0, currentPage - 1);
                              setCurrentPage(newPage);
                              if (pdfDocument) {
                                renderPageToImage(pdfDocument, newPage);
                              }
                            }}
                            disabled={currentPage === 0 || isLoadingPDF}
                            className="min-h-[44px] min-w-[80px] touch-manipulation"
                          >
                            <span className="font-medium">Previous</span>
                          </Button>
                          <span className="text-sm sm:text-base text-gray-600 font-medium px-2">
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
                              if (pdfDocument) {
                                renderPageToImage(pdfDocument, newPage);
                              }
                            }}
                            disabled={
                              currentPage === totalPages - 1 || isLoadingPDF
                            }
                            className="min-h-[44px] min-w-[80px] touch-manipulation"
                          >
                            <span className="font-medium">Next</span>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Settings Panel */}
              <div className="space-y-6">
                {previewUrl && (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-600" />
                        Crop Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Apply to All Pages */}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Apply to all pages
                        </Label>
                        <Switch
                          checked={settings.applyToAllPages}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              applyToAllPages: checked,
                            }))
                          }
                        />
                      </div>

                      {/* Processing info */}
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          Professional PDF Cropping
                        </p>
                        <p className="text-sm text-blue-700">
                          {settings.applyToAllPages
                            ? `Will crop all ${totalPages} pages with the same settings.`
                            : `Will crop only page ${currentPage + 1}.`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Usage Limit Warning */}
            {usageLimitReached && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {!isAuthenticated
                    ? "Daily Limit Reached"
                    : "Upgrade to Premium"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {!isAuthenticated
                    ? "You've used your 3 free PDF operations today. Sign up to continue!"
                    : "You've reached your daily limit. Upgrade to Premium for unlimited access!"}
                </p>
                {!isAuthenticated ? (
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Sign Up Free
                  </Button>
                ) : (
                  <Button
                    className="bg-yellow-500 text-black hover:bg-yellow-600"
                    asChild
                  >
                    <Link to="/pricing">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {/* Crop Button */}
            {selectedFile && cropperReady && !usageLimitReached && (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleCrop}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 min-h-[50px] px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold touch-manipulation w-full sm:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span>Cropping PDF...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-5 h-5 mr-2" />
                      <span>Crop PDF</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Processing Progress */}
            {isProcessing && (
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="text-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
                  <p className="font-medium">Processing PDF...</p>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600 text-center mt-2">
                  {progress < 50
                    ? "Analyzing crop area..."
                    : "Applying crop settings..."}
                </p>
              </div>
            )}
          </div>
        )}
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
