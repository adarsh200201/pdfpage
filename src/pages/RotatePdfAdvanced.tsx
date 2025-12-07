import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import {
  Upload,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  Check,
  Loader2,
  ArrowLeft,
  RotateCw,
  RotateCcw,
  Play,
  X,
  Eye,
  Home,
} from "lucide-react";

interface PDFPage {
  id: string;
  pageNumber: number;
  rotation: number;
  thumbnail?: string;
  thumbnailLoading?: boolean;
  thumbnailError?: boolean;
  width: number;
  height: number;
}

interface UploadedFile {
  id: string;
  file: File;
  status: "ready" | "processing" | "completed" | "error";
  progress: number;
  downloadUrl?: string;
  error?: string;
  pages: PDFPage[];
  totalPages: number;
}

const RotatePdfAdvanced = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      console.error("Error details:", {
        fileName: file.name,
        fileSize: file.size,
        pageNumber,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  };

  // Generate thumbnails for a file
  const generateThumbnailsForFile = async (fileId: string, file: File) => {
    console.log(`🖼️ Starting thumbnail generation for file: ${fileId}`);

    // Use setFiles callback to access current state and generate thumbnails
    setFiles((currentFiles) => {
      const fileToUpdate = currentFiles.find((f) => f.id === fileId);

      if (!fileToUpdate) {
        console.error(`❌ File not found for thumbnail generation: ${fileId}`);
        return currentFiles; // Return unchanged state
      }

      console.log(
        `🖼️ Found file for thumbnail generation: ${file.name} (${fileToUpdate.pages.length} pages)`,
      );

      // Start async thumbnail generation for all pages
      (async () => {
        for (let i = 0; i < fileToUpdate.pages.length; i++) {
          const page = fileToUpdate.pages[i];
          console.log(
            `📄 Processing thumbnail for page ${page.pageNumber} (${i + 1}/${fileToUpdate.pages.length})`,
          );

          // Mark thumbnail as loading
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    pages: f.pages.map((p) =>
                      p.id === page.id
                        ? {
                            ...p,
                            thumbnailLoading: true,
                            thumbnailError: false,
                          }
                        : p,
                    ),
                  }
                : f,
            ),
          );

          try {
            console.log(
              `🎨 Generating thumbnail for page ${page.pageNumber}...`,
            );
            const thumbnail = await generatePDFThumbnail(file, page.pageNumber);

            if (thumbnail) {
              console.log(
                `✅ Thumbnail generated successfully for page ${page.pageNumber} (${thumbnail.length} chars)`,
              );
            } else {
              console.warn(
                `⚠️ Thumbnail generation returned null for page ${page.pageNumber}`,
              );
            }

            // Update with generated thumbnail
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      pages: f.pages.map((p) =>
                        p.id === page.id
                          ? {
                              ...p,
                              thumbnail,
                              thumbnailLoading: false,
                              thumbnailError: !thumbnail,
                            }
                          : p,
                      ),
                    }
                  : f,
              ),
            );

            // Small delay to prevent overwhelming the browser
            if (i < fileToUpdate.pages.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.error(
              `❌ Thumbnail generation failed for page ${page.pageNumber}:`,
              error,
            );

            // Mark as error
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      pages: f.pages.map((p) =>
                        p.id === page.id
                          ? {
                              ...p,
                              thumbnailLoading: false,
                              thumbnailError: true,
                            }
                          : p,
                      ),
                    }
                  : f,
              ),
            );
          }
        }

        console.log(`🏁 Thumbnail generation completed for ${file.name}`);
      })();

      return currentFiles; // Return unchanged state for this synchronous call
    });
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesAdded(droppedFiles);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFilesAdded = useCallback(
    async (selectedFiles: File[]) => {
      const validFiles = selectedFiles.filter((file) => {
        if (file.type !== "application/pdf") {
          toast({
            title: "Invalid file",
            description: `${file.name} is not a PDF file.`,
            variant: "destructive",
          });
          return false;
        }

        if (file.size > 100 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 100MB limit.`,
            variant: "destructive",
          });
          return false;
        }

        return true;
      });

      for (const file of validFiles) {
        try {
          const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Load actual PDF to get real page count and dimensions
          console.log(`Loading PDF: ${file.name}`);

          const pdfjsLib = await import("pdfjs-dist");

          // Configure worker if not set
          if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;
          }

          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            verbosity: 0,
          });

          const pdf = await loadingTask.promise;
          const pageCount = pdf.numPages;

          console.log(`✅ PDF loaded: ${pageCount} pages`);

          // Create real pages based on actual PDF
          const realPages: PDFPage[] = [];

          for (let i = 1; i <= pageCount; i++) {
            try {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 1.0 });

              realPages.push({
                id: `${fileId}-page-${i}`,
                pageNumber: i,
                rotation: 0,
                width: viewport.width,
                height: viewport.height,
                thumbnailLoading: false,
                thumbnailError: false,
              });
            } catch (pageError) {
              console.warn(`Warning: Could not load page ${i}:`, pageError);
              // Add a fallback page entry
              realPages.push({
                id: `${fileId}-page-${i}`,
                pageNumber: i,
                rotation: 0,
                width: 595, // A4 default width
                height: 842, // A4 default height
                thumbnailLoading: false,
                thumbnailError: true,
              });
            }
          }

          const newFile: UploadedFile = {
            id: fileId,
            file,
            status: "ready",
            progress: 0,
            pages: realPages,
            totalPages: pageCount,
          };

          // Add file to state and generate thumbnails
          setFiles((prev) => [...prev, newFile]);

          // Generate thumbnails immediately after state update
          console.log(`🔄 Triggering thumbnail generation for ${fileId}`);
          generateThumbnailsForFile(fileId, file);

          toast({
            title: "PDF loaded successfully",
            description: `${file.name} - ${pageCount} pages ready for rotation`,
          });
        } catch (error) {
          console.error(`Failed to load PDF ${file.name}:`, error);
          toast({
            title: "Error loading PDF",
            description: `Failed to load ${file.name}. ${error instanceof Error ? error.message : "Unknown error"}`,
            variant: "destructive",
          });
        }
      }
    },
    [toast],
  );

  const rotatePage = (fileId: string, pageId: string, degrees: number) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              pages: file.pages.map((page) =>
                page.id === pageId
                  ? { ...page, rotation: (page.rotation + degrees + 360) % 360 }
                  : page,
              ),
            }
          : file,
      ),
    );
  };

  const rotateAllPages = (fileId: string, degrees: number) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              pages: file.pages.map((page) => ({
                ...page,
                rotation: (page.rotation + degrees + 360) % 360,
              })),
            }
          : file,
      ),
    );
  };

  const rotateSelectedPages = (degrees: number) => {
    if (selectedPages.size === 0) return;

    setFiles((prev) =>
      prev.map((file) => ({
        ...file,
        pages: file.pages.map((page) =>
          selectedPages.has(page.id)
            ? { ...page, rotation: (page.rotation + degrees + 360) % 360 }
            : page,
        ),
      })),
    );
  };

  const togglePageSelection = (pageId: string) => {
    setSelectedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  const selectAllPages = () => {
    const allPageIds = files.flatMap((file) =>
      file.pages.map((page) => page.id),
    );
    setSelectedPages(new Set(allPageIds));
  };

  const deselectAllPages = () => {
    setSelectedPages(new Set());
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);

    for (const fileItem of files) {
      if (fileItem.status !== "ready") continue;

      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "processing", progress: 10 }
              : f,
          ),
        );

        // Real PDF processing with rotation
        console.log(`🔄 Processing PDF: ${fileItem.file.name}`);

        // Import PDF service for actual rotation
        const { PDFService } = await import("@/services/pdfService");

        // Update progress periodically
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id && f.status === "processing"
                ? {
                    ...f,
                    progress: Math.min(f.progress + 15, 85),
                  }
                : f,
            ),
          );
        }, 500);

        // Check if any pages have rotation applied
        const hasRotations = fileItem.pages.some((page) => page.rotation !== 0);

        if (!hasRotations) {
          console.log("⚠️ No rotations applied, using original file");
          clearInterval(progressInterval);

          // Use original file if no rotations
          const blob = new Blob([fileItem.file], { type: "application/pdf" });
          const downloadUrl = URL.createObjectURL(blob);

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? {
                    ...f,
                    status: "completed",
                    progress: 100,
                    downloadUrl,
                  }
                : f,
            ),
          );

          toast({
            title: "No changes",
            description: `${fileItem.file.name} - no rotations applied`,
          });
          continue;
        }

        // Apply rotations page by page
        const { PDFDocument, degrees } = await import("pdf-lib");
        const arrayBuffer = await fileItem.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // Apply rotation to each page based on the rotation settings
        fileItem.pages.forEach((pageInfo, index) => {
          if (pageInfo.rotation !== 0 && pages[index]) {
            const page = pages[index];
            const currentRotation = page.getRotation().angle;
            const newRotation = (currentRotation + pageInfo.rotation) % 360;
            page.setRotation(degrees(newRotation));
            console.log(
              `Page ${pageInfo.pageNumber}: ${currentRotation}° -> ${newRotation}°`,
            );
          }
        });

        // Save the rotated PDF
        const rotatedPdfBytes = await pdfDoc.save({
          useObjectStreams: false,
          addDefaultPage: false,
        });

        clearInterval(progressInterval);

        // Create download URL from rotated PDF
        const blob = new Blob([rotatedPdfBytes], { type: "application/pdf" });
        const downloadUrl = URL.createObjectURL(blob);

        console.log(`✅ PDF rotation completed: ${fileItem.file.name}`);

        // Track usage
        try {
          await PDFService.trackUsage("rotate-pdf", 1, fileItem.file.size);
        } catch (trackingError) {
          console.warn("Usage tracking failed:", trackingError);
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: "completed",
                  progress: 100,
                  downloadUrl,
                }
              : f,
          ),
        );

        toast({
          title: "Success",
          description: `${fileItem.file.name} rotated successfully.`,
        });
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  error: "Rotation failed",
                }
              : f,
          ),
        );

        toast({
          title: "Error",
          description: `Failed to rotate ${fileItem.file.name}`,
          variant: "destructive",
        });
      }
    }

    setIsProcessing(false);
  };

  const downloadFile = (file: UploadedFile) => {
    if (file.downloadUrl) {
      const link = document.createElement("a");
      link.href = file.downloadUrl;
      link.download = file.file.name.replace(".pdf", "_rotated.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download started",
        description: `${file.file.name.replace(".pdf", "_rotated.pdf")} downloading...`,
      });
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    const removedFilePages =
      files.find((f) => f.id === id)?.pages.map((p) => p.id) || [];
    setSelectedPages((prev) => {
      const newSet = new Set(prev);
      removedFilePages.forEach((pageId) => newSet.delete(pageId));
      return newSet;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getRotationDegrees = (rotation: number) => {
    switch (rotation) {
      case 90:
        return "90°";
      case 180:
        return "180°";
      case 270:
        return "270°";
      default:
        return "0°";
    }
  };

  const hasFiles = files.length > 0;
  const hasRotations = files.some((file) =>
    file.pages.some((page) => page.rotation !== 0),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back to Home Button */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>

          {/* Enhanced Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <RotateCw className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Rotate PDF Pages
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Rotate your PDF pages online with precision. Simple, fast, and secure.
            </p>
          </div>

          {/* Main Content */}
          {!hasFiles ? (
            /* Enhanced Upload Area */
            <div className="flex justify-center px-4">
              <div
                className={cn(
                  "relative w-full max-w-3xl transition-all duration-300 cursor-pointer",
                  dragActive && "scale-[1.02]",
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <Card
                  className={cn(
                    "border-2 border-dashed transition-all duration-300 shadow-lg hover:shadow-xl",
                    dragActive
                      ? "border-blue-500 bg-blue-50 shadow-blue-100"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30",
                  )}
                >
                  <CardContent className="p-8 md:p-16 text-center">
                    <div
                      className={cn(
                        "w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300",
                        dragActive
                          ? "bg-blue-100 text-blue-600 scale-110"
                          : "bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-500",
                      )}
                    >
                      <Upload className="w-8 h-8 md:w-10 md:h-10" />
                    </div>

                    <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                      Upload Your PDF Files
                    </h3>

                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      <Upload className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                      Choose PDF Files
                    </Button>

                    <p className="text-gray-500 mt-4 text-sm md:text-base">
                      or drag and drop PDF files here
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs md:text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        Secure & Private
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        No Registration Required
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        Free to Use
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFilesAdded(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            /* Enhanced PDF Processing Area */
            <div className="space-y-6">
              {/* Enhanced Navigation & Controls */}
              <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Link
                      to="/"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors group"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                      <span className="font-medium">Back to Home</span>
                    </Link>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <span className="text-sm text-gray-600">
                      {files.length} file{files.length !== 1 ? 's' : ''} • {files.reduce((acc, file) => acc + file.pages.length, 0)} pages
                    </span>
                  </div>

                  {selectedPages.size > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''} selected
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rotateSelectedPages(-90)}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Rotate Left</span>
                          <span className="sm:hidden">Left</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rotateSelectedPages(90)}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <RotateCw className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Rotate Right</span>
                          <span className="sm:hidden">Right</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Selection Controls */}
              {hasFiles && (
                <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={selectAllPages}
                          className="bg-white hover:bg-blue-50 hover:border-blue-300"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={deselectAllPages}
                          className="bg-white hover:bg-gray-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Clear Selection
                        </Button>
                      </div>
                      <div className="text-sm font-medium text-gray-700 bg-white px-3 py-1 rounded-full">
                        {files.length} PDF{files.length !== 1 ? "s" : ""} loaded
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Files */}
              {files.map((file) => (
                <Card key={file.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4 md:p-6">
                    {/* Enhanced File Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                            {file.file.name}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500">
                            {formatFileSize(file.file.size)} • {file.totalPages}{" "}
                            page{file.totalPages !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                        {file.status === "processing" && (
                          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                            <Progress value={file.progress} className="w-20 md:w-24" />
                            <span className="text-xs md:text-sm font-medium text-blue-600">
                              {file.progress.toFixed(0)}%
                            </span>
                          </div>
                        )}

                        {file.status === "completed" && (
                          <Button
                            size="sm"
                            onClick={() => downloadFile(file)}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm"
                          >
                            <Download className="w-4 h-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Download</span>
                            <span className="sm:hidden">Get</span>
                          </Button>
                        )}

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rotateAllPages(file.id, -90)}
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            <span className="hidden md:inline">All Left</span>
                            <span className="md:hidden">Left</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rotateAllPages(file.id, 90)}
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            <RotateCw className="w-4 h-4 mr-1" />
                            <span className="hidden md:inline">All Right</span>
                            <span className="md:hidden">Right</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFile(file.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Page Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                      {file.pages.map((page) => (
                        <div
                          key={page.id}
                          className={cn(
                            "relative group cursor-pointer border-2 rounded-xl p-2 md:p-3 transition-all duration-200 hover:shadow-md",
                            selectedPages.has(page.id)
                              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md"
                              : "border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50",
                          )}
                          onClick={() => togglePageSelection(page.id)}
                        >
                          {/* Enhanced Page Preview */}
                          <div
                            className="w-full aspect-[3/4] bg-white border rounded-lg shadow-sm transition-all duration-300 overflow-hidden relative hover:shadow-md"
                            style={{
                              transform: `rotate(${page.rotation}deg)`,
                            }}
                          >
                            {/* Real PDF thumbnail if available */}
                            {page.thumbnail ? (
                              <div className="w-full h-full relative">
                                <img
                                  src={page.thumbnail}
                                  alt={`Page ${page.pageNumber}`}
                                  className="w-full h-full object-contain bg-white"
                                  style={{
                                    imageRendering: "-webkit-optimize-contrast",
                                  }}
                                  onError={(e) => {
                                    console.error(
                                      `Image load error for page ${page.pageNumber}:`,
                                      e,
                                    );
                                    // Mark as error if image fails to load
                                    setFiles((prev) =>
                                      prev.map((f) => ({
                                        ...f,
                                        pages: f.pages.map((p) =>
                                          p.id === page.id
                                            ? {
                                                ...p,
                                                thumbnailError: true,
                                                thumbnail: undefined,
                                              }
                                            : p,
                                        ),
                                      })),
                                    );
                                  }}
                                  onLoad={() => {
                                    console.log(
                                      `✅ Thumbnail loaded successfully for page ${page.pageNumber}`,
                                    );
                                  }}
                                />
                                {/* Content indicator */}
                                <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  Content
                                </div>
                              </div>
                            ) : page.thumbnailLoading ? (
                              <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                  <div className="text-xs text-blue-600">
                                    Generating preview...
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Page {page.pageNumber}
                                  </div>
                                </div>
                              </div>
                            ) : page.thumbnailError ? (
                              <div className="w-full h-full flex items-center justify-center bg-red-50 border-2 border-red-200">
                                <div className="text-center text-red-600">
                                  <Eye className="w-6 h-6 mx-auto mb-2" />
                                  <div className="text-xs font-medium">
                                    Preview Failed
                                  </div>
                                  <div className="text-xs text-red-500">
                                    Page {page.pageNumber}
                                  </div>
                                  <button
                                    className="text-xs text-red-700 underline mt-1"
                                    onClick={async () => {
                                      console.log(
                                        `🔄 Retrying thumbnail for page ${page.pageNumber}`,
                                      );
                                      // Retry thumbnail generation
                                      const fileItem = files.find((f) =>
                                        f.pages.some((p) => p.id === page.id),
                                      );
                                      if (fileItem) {
                                        // Mark as loading
                                        setFiles((prev) =>
                                          prev.map((f) =>
                                            f.id === fileItem.id
                                              ? {
                                                  ...f,
                                                  pages: f.pages.map((p) =>
                                                    p.id === page.id
                                                      ? {
                                                          ...p,
                                                          thumbnailLoading:
                                                            true,
                                                          thumbnailError: false,
                                                        }
                                                      : p,
                                                  ),
                                                }
                                              : f,
                                          ),
                                        );

                                        // Try generating again
                                        const thumbnail =
                                          await generatePDFThumbnail(
                                            fileItem.file,
                                            page.pageNumber,
                                          );
                                        setFiles((prev) =>
                                          prev.map((f) =>
                                            f.id === fileItem.id
                                              ? {
                                                  ...f,
                                                  pages: f.pages.map((p) =>
                                                    p.id === page.id
                                                      ? {
                                                          ...p,
                                                          thumbnail,
                                                          thumbnailLoading:
                                                            false,
                                                          thumbnailError:
                                                            !thumbnail,
                                                        }
                                                      : p,
                                                  ),
                                                }
                                              : f,
                                          ),
                                        );
                                      }
                                    }}
                                  >
                                    Retry
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Enhanced PDF page content simulation */
                              <div className="p-2 h-full relative">
                                {/* PDF-like header */}
                                <div className="w-full h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-1"></div>
                                <div className="w-3/4 h-1.5 bg-gray-400 rounded mb-2"></div>

                                {/* Main content area */}
                                <div className="space-y-1 mb-3">
                                  <div className="w-full h-1 bg-gray-200 rounded"></div>
                                  <div className="w-11/12 h-1 bg-gray-200 rounded"></div>
                                  <div className="w-full h-1 bg-gray-200 rounded"></div>
                                  <div className="w-5/6 h-1 bg-gray-200 rounded"></div>
                                  <div className="w-full h-1 bg-gray-200 rounded"></div>
                                  <div className="w-3/4 h-1 bg-gray-200 rounded"></div>
                                </div>

                                {/* Content blocks */}
                                <div className="space-y-2">
                                  <div className="w-2/3 h-1.5 bg-gray-300 rounded"></div>
                                  <div className="space-y-0.5">
                                    <div className="w-full h-0.5 bg-gray-100 rounded"></div>
                                    <div className="w-5/6 h-0.5 bg-gray-100 rounded"></div>
                                    <div className="w-full h-0.5 bg-gray-100 rounded"></div>
                                    <div className="w-4/5 h-0.5 bg-gray-100 rounded"></div>
                                  </div>
                                </div>

                                {/* Simulated table or structured content */}
                                <div className="mt-2 grid grid-cols-2 gap-1">
                                  <div className="h-2 bg-gray-200 rounded"></div>
                                  <div className="h-2 bg-gray-200 rounded"></div>
                                </div>

                                {/* More content */}
                                <div className="mt-3 space-y-1">
                                  <div className="w-full h-0.5 bg-gray-100 rounded"></div>
                                  <div className="w-3/4 h-0.5 bg-gray-100 rounded"></div>
                                  <div className="w-full h-0.5 bg-gray-100 rounded"></div>
                                  <div className="w-1/2 h-0.5 bg-gray-100 rounded"></div>
                                </div>

                                {/* Page number indicator - always visible */}
                                <div className="absolute bottom-1 right-1 text-xs font-mono text-gray-500 bg-white/80 px-1 rounded">
                                  {page.pageNumber}
                                </div>

                                {/* PDF content indicator */}
                                <div className="absolute top-1 left-1 text-xs text-orange-500 bg-orange-50 px-1 rounded">
                                  Generating...
                                </div>
                              </div>
                            )}

                            {/* Selection indicator */}
                            {selectedPages.has(page.id) && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}

                            {/* Rotation indicator */}
                            {page.rotation !== 0 && (
                              <div className="absolute bottom-1 left-1 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded">
                                {getRotationDegrees(page.rotation)}
                              </div>
                            )}
                          </div>

                          {/* Page Controls */}
                          <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center space-x-2 transition-opacity">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                rotatePage(file.id, page.id, -90);
                              }}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                rotatePage(file.id, page.id, 90);
                              }}
                            >
                              <RotateCw className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Page Number */}
                          <p className="text-xs text-center text-gray-600 mt-2">
                            Page {page.pageNumber}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Completed Downloads Section */}
              {files.some((f) => f.status === "completed") && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Rotation Complete!
                      </h3>
                      <p className="text-green-700 mb-4">
                        Your PDF files have been rotated successfully. Download
                        them below:
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {files
                          .filter((f) => f.status === "completed")
                          .map((file) => (
                            <Button
                              key={file.id}
                              onClick={() => downloadFile(file)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              {file.file.name.replace(".pdf", "_rotated.pdf")}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Action Buttons */}
              <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6 mt-8">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 md:px-6 py-2 md:py-3 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add More Files
                  </Button>

                  <Button
                    onClick={processFiles}
                    disabled={isProcessing || !hasRotations}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 md:px-8 py-2 md:py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Processing...</span>
                        <span className="sm:hidden">Processing</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        <span className="hidden sm:inline">Apply Rotations</span>
                        <span className="sm:hidden">Apply</span>
                      </>
                    )}
                  </Button>
                </div>

                {!hasRotations && files.length > 0 && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    Select pages and rotate them to enable processing
                  </p>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFilesAdded(Array.from(e.target.files));
                  }
                }}
                className="hidden"
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RotatePdfAdvanced;
