import React, { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";
import {
  Upload,
  FileText,
  Download,
  Scissors,
  RotateCcw,
  CheckCircle,
  X,
  CloudDownload,
  Grid3X3,
  List,
  ZoomIn,
  Search,
  Filter,
  Home,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";

interface PDFPage {
  index: number;
  data: Uint8Array;
  thumbnail?: string;
  thumbnailLoading?: boolean;
  thumbnailError?: boolean;
  selected: boolean;
  size: string;
}

interface SplitMode {
  type: "all" | "ranges" | "extract" | "fixed";
  ranges?: string;
  fixedPages?: number;
}

type ViewMode = "grid" | "list";

const Split: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadQueueRef = useRef<Set<number>>(new Set());

  // State management
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitMode, setSplitMode] = useState<SplitMode>({ type: "all" });
  const [isComplete, setIsComplete] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedPages, setDownloadedPages] = useState<Set<number>>(
    new Set(),
  );

  // Generate PDF thumbnail
  const generatePDFThumbnail = async (
    file: File,
    pageNumber: number,
  ): Promise<string | null> => {
    try {
      console.log(
        `🖼️ Starting thumbnail generation for page ${pageNumber} of ${file.name}`,
      );

      // Import PDF.js with proper error handling
      const pdfjsLib = await import("pdfjs-dist");

      // Configure worker if not already set
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;
      }

      // Load PDF
      const arrayBuffer = await file.arrayBuffer();
      console.log(`📄 PDF ArrayBuffer loaded: ${arrayBuffer.byteLength} bytes`);

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/",
        cMapPacked: true,
        standardFontDataUrl:
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/standard_fonts/",
      });

      const pdf = await loadingTask.promise;
      console.log(`📚 PDF document loaded successfully, ${pdf.numPages} pages`);

      if (pageNumber > pdf.numPages) {
        throw new Error(
          `Page ${pageNumber} does not exist (PDF has ${pdf.numPages} pages)`,
        );
      }

      const page = await pdf.getPage(pageNumber);
      console.log(`📄 Page ${pageNumber} loaded successfully`);

      // Create canvas for thumbnail with better scale
      const scale = 0.75; // Larger scale for better visibility
      const viewport = page.getViewport({ scale });
      console.log(
        `🎯 Viewport created: ${viewport.width}x${viewport.height} at scale ${scale}`,
      );

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: false });

      if (!context) {
        throw new Error("Could not get canvas context");
      }

      // Set canvas size
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      console.log(`🖼️ Canvas created: ${canvas.width}x${canvas.height}`);

      // Fill with white background first
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        intent: "display",
        renderInteractiveForms: false,
        annotationMode: 0, // Disable annotations for cleaner render
      };

      console.log(`🎨 Starting page render...`);
      const renderTask = page.render(renderContext);
      await renderTask.promise;
      console.log(`✅ Page render completed successfully`);

      // Convert to data URL with high quality
      const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      console.log(
        `🖼️ Thumbnail data URL generated: ${thumbnailDataUrl.length} characters`,
      );

      // Verify the data URL is valid
      if (
        !thumbnailDataUrl ||
        thumbnailDataUrl === "data:," ||
        thumbnailDataUrl.length < 100
      ) {
        throw new Error("Generated thumbnail appears to be empty or invalid");
      }

      // Clean up
      canvas.remove();

      console.log(`✅ Thumbnail generation completed for page ${pageNumber}`);
      return thumbnailDataUrl;
    } catch (error) {
      console.error(
        `❌ Failed to generate thumbnail for page ${pageNumber}:`,
        error,
      );
      return null;
    }
  };

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFile = acceptedFiles.find(
      (file) => file.type === "application/pdf",
    );
    if (pdfFile) {
      handleFileSelect(pdfFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setPages([]);
    setIsComplete(false);
    setProgress(0);
    setDownloadedPages(new Set());

    toast({
      title: "File Uploaded",
      description: `${selectedFile.name} ready for splitting`,
      duration: 3000,
    });
  };

  const splitPDF = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      console.log("🚀 Starting PDF split:", file.name);

      // Split PDF into pages
      const splitPages = await PDFService.splitPDF(file, (progressPercent) => {
        setProgress(progressPercent);
      });

      console.log(`✅ Split complete: ${splitPages.length} pages`);

      // Process pages
      const processedPages: PDFPage[] = splitPages.map((pageData, index) => ({
        index,
        data: pageData,
        selected: true,
        size: `${Math.round(pageData.length / 1024)} KB`,
      }));

      setPages(processedPages);
      setProgress(100);
      setIsComplete(true);

      // Generate previews
      generatePreviews(processedPages);

      toast({
        title: "Split Complete!",
        description: `PDF split into ${splitPages.length} pages`,
        duration: 3000,
      });
    } catch (error) {
      console.error("❌ Split failed:", error);
      toast({
        title: "Split Failed",
        description: "Could not split the PDF file. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePreviews = async (pagesData: PDFPage[]) => {
    setIsGeneratingPreviews(true);

    try {
      // Generate thumbnails for all pages
      for (let i = 0; i < pagesData.length; i++) {
        const pageIndex = i;
        console.log(`📄 Processing thumbnail for page ${pageIndex + 1}`);

        // Mark thumbnail as loading
        setPages((prev) =>
          prev.map((page, idx) =>
            idx === pageIndex
              ? {
                  ...page,
                  thumbnailLoading: true,
                  thumbnailError: false,
                }
              : page,
          ),
        );

        try {
          const thumbnail = await generatePDFThumbnail(file!, pageIndex + 1);

          // Update with generated thumbnail
          setPages((prev) =>
            prev.map((page, idx) =>
              idx === pageIndex
                ? {
                    ...page,
                    thumbnail,
                    thumbnailLoading: false,
                    thumbnailError: !thumbnail,
                  }
                : page,
            ),
          );

          // Small delay to prevent overwhelming the browser
          if (i < pagesData.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(
            `❌ Thumbnail generation failed for page ${pageIndex + 1}:`,
            error,
          );

          // Mark as error
          setPages((prev) =>
            prev.map((page, idx) =>
              idx === pageIndex
                ? {
                    ...page,
                    thumbnailLoading: false,
                    thumbnailError: true,
                  }
                : page,
            ),
          );
        }
      }

      console.log(`🏁 Thumbnail generation completed`);
    } catch (error) {
      console.error("Preview generation failed:", error);
    } finally {
      setIsGeneratingPreviews(false);
    }
  };

  const downloadPage = async (pageIndex: number, event?: React.MouseEvent) => {
    // Stop event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Prevent duplicate downloads
    if (
      downloadQueueRef.current.has(pageIndex) ||
      downloadedPages.has(pageIndex)
    ) {
      console.log(`⏸️ Page ${pageIndex + 1} already downloaded or in queue`);
      return;
    }

    const page = pages[pageIndex];
    if (!page || !page.data) {
      console.error(`❌ Page ${pageIndex + 1} not found or no data`);
      toast({
        title: "Download Failed",
        description: `Page ${pageIndex + 1} data not available`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      // Add to download queue
      downloadQueueRef.current.add(pageIndex);

      console.log(
        `📥 Downloading page ${pageIndex + 1}, size: ${page.data.length} bytes`,
      );

      // Create blob and download immediately
      const blob = new Blob([page.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Create and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file?.name?.replace(".pdf", "") || "document"}-page-${pageIndex + 1}.pdf`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      // Mark as downloaded and show toast only once
      setDownloadedPages((prev) => new Set([...prev, pageIndex]));

      console.log(`✅ Page ${pageIndex + 1} download completed`);

      toast({
        title: "Download Complete",
        description: `Page ${pageIndex + 1} has been downloaded`,
        duration: 3000,
      });
    } catch (error) {
      console.error("❌ Download failed:", error);
      toast({
        title: "Download Failed",
        description: `Could not download page ${pageIndex + 1}`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      // Remove from download queue after a delay
      setTimeout(() => {
        downloadQueueRef.current.delete(pageIndex);
      }, 1000);
    }
  };

  const downloadSelected = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (isDownloading) return;

    const selectedPages = pages.filter(
      (page) => page.selected && !downloadedPages.has(page.index),
    );

    if (selectedPages.length === 0) {
      toast({
        title: "No New Pages to Download",
        description: "Please select pages that haven't been downloaded yet",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsDownloading(true);
    console.log(`📦 Downloading ${selectedPages.length} selected pages`);

    let downloadCount = 0;
    try {
      // Process downloads sequentially to avoid browser limits
      for (const page of selectedPages) {
        // Skip if already downloaded
        if (!downloadedPages.has(page.index)) {
          await new Promise((resolve) => {
            downloadPage(page.index);
            downloadCount++;
            setTimeout(resolve, 300); // Small delay between downloads
          });
        }
      }

      if (downloadCount > 0) {
        toast({
          title: "Downloads Complete",
          description: `Downloaded ${downloadCount} new pages`,
          duration: 3000,
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAll = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (isDownloading) return;

    const pendingPages = pages.filter(
      (page) => !downloadedPages.has(page.index),
    );

    if (pendingPages.length === 0) {
      toast({
        title: "All Pages Downloaded",
        description: "All pages have already been downloaded",
        duration: 3000,
      });
      return;
    }

    setIsDownloading(true);
    console.log(`📦 Downloading ${pendingPages.length} remaining pages`);

    let downloadCount = 0;
    try {
      // Process downloads sequentially to avoid browser limits
      for (const page of pendingPages) {
        await new Promise((resolve) => {
          downloadPage(page.index);
          downloadCount++;
          setTimeout(resolve, 300); // Small delay between downloads
        });
      }

      if (downloadCount > 0) {
        toast({
          title: "Downloads Complete",
          description: `Downloaded all ${downloadCount} remaining pages`,
          duration: 3000,
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const togglePageSelection = (pageIndex: number) => {
    setPages((prev) =>
      prev.map((page) =>
        page.index === pageIndex ? { ...page, selected: !page.selected } : page,
      ),
    );
  };

  const selectAll = () => {
    setPages((prev) => prev.map((page) => ({ ...page, selected: true })));
  };

  const selectNone = () => {
    setPages((prev) => prev.map((page) => ({ ...page, selected: false })));
  };

  const resetTool = () => {
    setFile(null);
    setPages([]);
    setIsComplete(false);
    setProgress(0);
    setSplitMode({ type: "all" });
    setIsProcessing(false);
    setDownloadedPages(new Set());
  };

  const selectedCount = pages.filter((page) => page.selected).length;

  // Filter pages based on search term
  const filteredPages = pages.filter(
    (page) =>
      searchTerm === "" ||
      `page ${page.index + 1}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      page.size.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5"></div>
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative text-center py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 md:px-8">
            {/* Back to Home Button */}
            <div className="mb-6">
              <Link to="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  type="button"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>

            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-8 shadow-lg shadow-blue-500/25">
              <Scissors className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6">
              Split PDF Files
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Transform your PDF documents with precision. Extract individual
              pages or custom ranges with professional-grade tools.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200/50 shadow-sm">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Instant Processing
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200/50 shadow-sm">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                No Registration
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200/50 shadow-sm">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                100% Secure
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* File Upload Section */}
        {!file && (
          <Card className="mb-6 md:mb-8">
            <CardContent className="p-6 md:p-12">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 md:p-12 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary",
                )}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div>
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white px-6 md:px-12 py-3 md:py-6 text-base md:text-xl"
                    >
                      Select PDF file
                    </Button>
                    <p className="text-text-dark mt-4 text-sm md:text-base">
                      or drop PDF here
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Info and Controls */}
        {file && !isComplete && (
          <Card className="mb-6 md:mb-8">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text-medium text-sm md:text-base truncate">
                      {file.name}
                    </h3>
                    <p className="text-xs md:text-sm text-text-light">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <Button
                    onClick={resetTool}
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none"
                  >
                    <X className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="text-sm">Remove</span>
                  </Button>
                  <Button
                    onClick={splitPDF}
                    disabled={isProcessing}
                    className="bg-primary hover:bg-primary/90 flex-1 md:flex-none"
                    size="sm"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 mr-1 md:mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Splitting...</span>
                      </>
                    ) : (
                      <>
                        <Scissors className="w-4 h-4 mr-1 md:mr-2" />
                        <span className="text-sm">Split PDF</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isProcessing && (
                <div className="mt-4 md:mt-6 space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span>Processing PDF...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {isComplete && pages.length > 0 && (
          <div className="space-y-4 md:space-y-6">
            {/* Search and View Controls */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-4 md:mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className="px-2 md:px-3 py-1 text-xs md:text-sm"
                      >
                        {pages.length} pages split
                      </Badge>
                      <Badge
                        variant="outline"
                        className="px-2 md:px-3 py-1 text-xs md:text-sm"
                      >
                        {selectedCount} selected
                      </Badge>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 sm:max-w-xs">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search pages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setViewMode("grid")}
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      className="p-2"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setViewMode("list")}
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      className="p-2"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                  <div className="flex space-x-2 flex-1">
                    <Button
                      onClick={selectAll}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      Select All
                    </Button>
                    <Button
                      onClick={selectNone}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      Select None
                    </Button>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={(e) => downloadSelected(e)}
                      disabled={selectedCount === 0 || isDownloading}
                      className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                      size="sm"
                      type="button"
                    >
                      {isDownloading ? (
                        <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-1 md:mr-2" />
                      )}
                      <span className="text-xs md:text-sm">
                        Selected ({selectedCount})
                      </span>
                    </Button>
                    <Button
                      onClick={(e) => downloadAll(e)}
                      disabled={isDownloading}
                      variant="outline"
                      size="sm"
                      type="button"
                      className="flex-1 sm:flex-none"
                    >
                      {isDownloading ? (
                        <div className="w-4 h-4 mr-1 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CloudDownload className="w-4 h-4 mr-1 md:mr-2" />
                      )}
                      <span className="text-xs md:text-sm">All</span>
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={resetTool}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Split Another PDF
                </Button>
              </CardContent>
            </Card>

            {/* Pages Display */}
            {viewMode === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
                {filteredPages.map((page) => (
                  <Card
                    key={page.index}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg",
                      page.selected
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:ring-1 hover:ring-gray-300",
                    )}
                    onClick={() => togglePageSelection(page.index)}
                  >
                    <CardContent className="p-3 md:p-4 text-center space-y-2 md:space-y-3">
                      {/* Page Preview */}
                      <div className="aspect-[3/4] bg-white border rounded-lg shadow-sm overflow-hidden relative">
                        {/* Real PDF thumbnail if available */}
                        {page.thumbnail ? (
                          <div className="w-full h-full relative">
                            <img
                              src={page.thumbnail}
                              alt={`Page ${page.index + 1}`}
                              className="w-full h-full object-contain bg-white"
                              style={{
                                imageRendering: "-webkit-optimize-contrast",
                              }}
                              onError={() => {
                                console.error(
                                  `Image load error for page ${page.index + 1}`,
                                );
                                setPages((prev) =>
                                  prev.map((p) =>
                                    p.index === page.index
                                      ? {
                                          ...p,
                                          thumbnailError: true,
                                          thumbnail: undefined,
                                        }
                                      : p,
                                  ),
                                );
                              }}
                            />
                            {/* Content indicator */}
                            <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                              ✓ Content
                            </div>
                          </div>
                        ) : page.thumbnailLoading ? (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                              <div className="text-xs text-blue-600">
                                Generating preview...
                              </div>
                            </div>
                          </div>
                        ) : page.thumbnailError ? (
                          <div className="w-full h-full flex items-center justify-center bg-red-50">
                            <div className="text-center">
                              <FileText className="w-8 h-8 text-red-400 mx-auto mb-1" />
                              <div className="text-xs text-red-600">
                                Preview failed
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                              <div className="text-xs text-gray-600">
                                PDF Page
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Downloaded indicator */}
                        {downloadedPages.has(page.index) && (
                          <div className="absolute top-1 md:top-2 left-1 md:left-2">
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ✓
                            </div>
                          </div>
                        )}

                        {/* Selection indicator */}
                        {page.selected && (
                          <div className="absolute top-1 md:top-2 right-1 md:right-2">
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary bg-white rounded-full" />
                          </div>
                        )}
                      </div>

                      {/* Page Info */}
                      <div>
                        <p className="font-medium text-xs md:text-sm">
                          Page {page.index + 1}
                        </p>
                        <p className="text-xs text-text-light">{page.size}</p>
                      </div>

                      {/* Individual Download */}
                      <Button
                        onClick={(e) => {
                          console.log(
                            `🖱️ Download button clicked for page ${page.index + 1}`,
                          );
                          downloadPage(page.index, e);
                        }}
                        size="sm"
                        variant={
                          downloadedPages.has(page.index)
                            ? "secondary"
                            : "outline"
                        }
                        className="w-full text-xs"
                        type="button"
                        disabled={
                          downloadQueueRef.current.has(page.index) ||
                          downloadedPages.has(page.index)
                        }
                      >
                        {downloadQueueRef.current.has(page.index) ? (
                          <div className="w-3 h-3 mr-1 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : downloadedPages.has(page.index) ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Download className="w-3 h-3 mr-1" />
                        )}
                        {downloadedPages.has(page.index)
                          ? "Downloaded"
                          : "Download"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {filteredPages.map((page) => (
                  <Card
                    key={page.index}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      page.selected
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:ring-1 hover:ring-gray-300",
                    )}
                  >
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        {/* Checkbox */}
                        <div
                          className="flex-shrink-0 cursor-pointer"
                          onClick={() => togglePageSelection(page.index)}
                        >
                          <CheckCircle
                            className={cn(
                              "w-5 h-5 transition-colors",
                              page.selected
                                ? "text-primary"
                                : "text-gray-300 hover:text-gray-400",
                            )}
                          />
                        </div>

                        {/* Preview thumbnail */}
                        <div className="w-12 h-16 md:w-16 md:h-20 bg-white border rounded flex-shrink-0 relative overflow-hidden shadow-sm">
                          {/* Real PDF thumbnail if available */}
                          {page.thumbnail ? (
                            <img
                              src={page.thumbnail}
                              alt={`Page ${page.index + 1}`}
                              className="w-full h-full object-contain bg-white"
                              style={{
                                imageRendering: "-webkit-optimize-contrast",
                              }}
                              onError={() => {
                                console.error(
                                  `Image load error for page ${page.index + 1}`,
                                );
                                setPages((prev) =>
                                  prev.map((p) =>
                                    p.index === page.index
                                      ? {
                                          ...p,
                                          thumbnailError: true,
                                          thumbnail: undefined,
                                        }
                                      : p,
                                  ),
                                );
                              }}
                            />
                          ) : page.thumbnailLoading ? (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                            </div>
                          ) : page.thumbnailError ? (
                            <div className="w-full h-full flex items-center justify-center bg-red-50">
                              <FileText className="w-4 h-4 text-red-400" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <FileText className="w-4 h-4 text-gray-400" />
                            </div>
                          )}

                          {downloadedPages.has(page.index) && (
                            <div className="absolute -top-1 -right-1">
                              <div className="bg-green-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                                ✓
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Page info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm md:text-base text-text-medium">
                            Page {page.index + 1}
                          </h4>
                          <p className="text-xs md:text-sm text-text-light">
                            {page.size}
                          </p>
                        </div>

                        {/* Download button */}
                        <Button
                          onClick={(e) => {
                            console.log(
                              `🖱️ Download button clicked for page ${page.index + 1}`,
                            );
                            downloadPage(page.index, e);
                          }}
                          size="sm"
                          variant={
                            downloadedPages.has(page.index)
                              ? "secondary"
                              : "outline"
                          }
                          type="button"
                          disabled={
                            downloadQueueRef.current.has(page.index) ||
                            downloadedPages.has(page.index)
                          }
                          className="flex-shrink-0"
                        >
                          {downloadQueueRef.current.has(page.index) ? (
                            <div className="w-4 h-4 mr-1 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                          ) : downloadedPages.has(page.index) ? (
                            <CheckCircle className="w-4 h-4 mr-1 md:mr-2" />
                          ) : (
                            <Download className="w-4 h-4 mr-1 md:mr-2" />
                          )}
                          <span className="hidden sm:inline">
                            {downloadedPages.has(page.index)
                              ? "Downloaded"
                              : "Download"}
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Preview Generation Status */}
            {isGeneratingPreviews && (
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs md:text-sm text-text-light">
                      Generating previews...
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No results message */}
            {searchTerm && filteredPages.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-text-medium mb-2">
                    No pages found
                  </h3>
                  <p className="text-text-light">
                    Try adjusting your search term
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Split;
