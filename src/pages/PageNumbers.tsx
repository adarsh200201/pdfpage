import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import { Slider } from "@/components/ui/slider";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  Hash,
  Crown,
  Star,
  Eye,
  EyeOff,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

interface PagePreview {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const PageNumbers = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [numberingSettings, setNumberingSettings] = useState({
    position: "bottom-center",
    format: "1",
    startNumber: 1,
    fontSize: [12],
    margin: [20],
    includeFirstPage: true,
  });
  const [numberedFiles, setNumberedFiles] = useState<
    { name: string; url: string; size: number }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // New state for PDF preview
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [pagesPreviews, setPagesPreviews] = useState<PagePreview[]>([]);
  const [pdfDocument, setPdfDocument] =
    useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    setIsComplete(false);
    setNumberedFiles([]);

    // Auto-enable preview and load for the first file
    if (uploadedFiles.length > 0) {
      setShowPreview(true);
      loadPDFForPreview(uploadedFiles[0]);
    }
  };

  // Load PDF for preview
  const loadPDFForPreview = async (file: File) => {
    setIsLoadingPreview(true);
    setPagesPreviews([]);
    setPdfDocument(null);
    setTotalPages(0);

    try {
      console.log("🔄 Loading PDF for preview:", file.name);

      // Configure PDF.js worker with fallbacks
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        try {
          // Use the most compatible worker URL
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js`;
          console.log(
            "📋 PDF.js worker configured:",
            pdfjsLib.GlobalWorkerOptions.workerSrc,
          );
        } catch (workerError) {
          console.warn("⚠️ Worker configuration warning:", workerError);
        }
      }

      console.log("📂 Reading file...");
      const arrayBuffer = await file.arrayBuffer();
      console.log("📄 PDF ArrayBuffer loaded, size:", arrayBuffer.byteLength);

      console.log("🔨 Creating PDF loading task...");
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0, // Reduce PDF.js verbosity
      });

      console.log("⏳ Waiting for PDF document...");
      const pdf = await loadingTask.promise;
      console.log("✅ PDF document loaded successfully!");
      console.log("📖 Pages found:", pdf.numPages);
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log("✅ PDF document loaded, pages:", pdf.numPages);

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);

      // Generate previews for all pages
      const previews: PagePreview[] = [];
      const maxPreviewPages = Math.min(pdf.numPages, 20); // Limit to 20 pages for performance
      console.log(`🖼️ Generating previews for ${maxPreviewPages} pages`);

      for (let pageNum = 1; pageNum <= maxPreviewPages; pageNum++) {
        try {
          console.log(`📄 Processing page ${pageNum}/${maxPreviewPages}...`);

          const page = await pdf.getPage(pageNum);
          console.log(`✅ Page ${pageNum} loaded`);

          const scale = 0.5; // Increased scale for better visibility
          const viewport = page.getViewport({ scale });
          console.log(
            `📏 Page ${pageNum} viewport:`,
            viewport.width,
            "x",
            viewport.height,
          );

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            console.error(
              `❌ Failed to get canvas context for page ${pageNum}`,
            );
            continue;
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          console.log(
            `🎨 Canvas ${pageNum} created:`,
            canvas.width,
            "x",
            canvas.height,
          );

          const renderTask = page.render({
            canvasContext: context,
            viewport: viewport,
          });

          await renderTask.promise;
          console.log(`🎯 Page ${pageNum} rendered to canvas`);

          // Verify canvas has content
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          const hasContent = imageData.data.some((value) => value !== 255); // Check if not all white
          console.log(`🔍 Page ${pageNum} has content:`, hasContent);

          if (hasContent) {
            previews.push({
              pageNumber: pageNum,
              canvas,
              width: viewport.width,
              height: viewport.height,
            });
            console.log(`✅ Preview ${pageNum} added to collection`);
          } else {
            console.warn(`⚠️ Page ${pageNum} appears to be empty`);
          }
        } catch (pageError) {
          console.error(`❌ Error processing page ${pageNum}:`, pageError);
        }
      }

      setPagesPreviews(previews);
      console.log(`🎉 Successfully generated ${previews.length} page previews`);

      toast({
        title: "📖 PDF Preview Loaded",
        description: `Showing preview for ${previews.length} of ${pdf.numPages} pages with page number positions`,
      });
    } catch (error) {
      console.error("❌ Error loading PDF preview:", error);

      // More specific error messages
      let errorMessage =
        "Failed to load PDF preview. You can still add page numbers.";
      if (error instanceof Error) {
        if (error.message.includes("worker")) {
          errorMessage =
            "PDF worker initialization failed. Please refresh the page.";
        } else if (error.message.includes("Invalid PDF")) {
          errorMessage = "Invalid PDF file format.";
        }
      }

      toast({
        title: "Preview Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Calculate page number position for preview overlay
  const calculatePageNumberPosition = (
    pageWidth: number,
    pageHeight: number,
  ) => {
    let x, y;
    const margin = numberingSettings.margin[0] * 0.3; // Scaled for preview

    switch (numberingSettings.position) {
      case "top-left":
        x = margin;
        y = margin;
        break;
      case "top-center":
        x = pageWidth / 2;
        y = margin;
        break;
      case "top-right":
        x = pageWidth - margin;
        y = margin;
        break;
      case "bottom-left":
        x = margin;
        y = pageHeight - margin;
        break;
      case "bottom-center":
        x = pageWidth / 2;
        y = pageHeight - margin;
        break;
      case "bottom-right":
        x = pageWidth - margin;
        y = pageHeight - margin;
        break;
      default:
        x = pageWidth / 2;
        y = pageHeight - margin;
    }

    return { x, y };
  };

  // Format page number for display
  const formatPageNumber = (pageNumber: number) => {
    const actualNumber = pageNumber + numberingSettings.startNumber - 1;
    switch (numberingSettings.format) {
      case "1":
        return actualNumber.toString();
      case "Page 1":
        return `Page ${actualNumber}`;
      case "1 / Total":
        return `${actualNumber} / ${totalPages}`;
      case "Page 1 of Total":
        return `Page ${actualNumber} of ${totalPages}`;
      default:
        return actualNumber.toString();
    }
  };

  // Re-render previews when settings change
  useEffect(() => {
    if (pagesPreviews.length > 0) {
      // Force re-render by updating the state
      setPagesPreviews([...pagesPreviews]);
    }
  }, [numberingSettings]);

  const handleAddNumbers = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to add page numbers.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    try {
      const usageCheck = await PDFService.checkUsageLimit();
      if (!usageCheck.canUpload) {
        setShowAuthModal(true);
        return;
      }
    } catch (error) {
      console.error("Error checking usage limit:", error);
    }

    setIsProcessing(true);

    try {
      const numberedResults: { name: string; url: string; size: number }[] = [];

      for (const file of files) {
        try {
          toast({
            title: `���� Adding page numbers to ${file.name}...`,
            description: "Processing PDF with page numbering",
          });

          // Add page numbers to PDF
          const numberedPdf = await addPageNumbersToPdf(
            file,
            numberingSettings,
          );
          const blob = new Blob([numberedPdf], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);

          numberedResults.push({
            name: file.name.replace(/\.pdf$/i, "_numbered.pdf"),
            url,
            size: blob.size,
          });

          toast({
            title: `✅ ${file.name} processed successfully`,
            description: "Page numbers added to PDF",
          });
        } catch (error) {
          console.error(`Error adding page numbers to ${file.name}:`, error);
          toast({
            title: `❌ Error processing ${file.name}`,
            description: "Failed to add page numbers to this PDF file.",
            variant: "destructive",
          });
        }
      }

      if (numberedResults.length > 0) {
        setNumberedFiles(numberedResults);
        setIsComplete(true);

        // Track usage for revenue analytics
        await PDFService.trackUsage(
          "page-numbers",
          files.length,
          files.reduce((sum, file) => sum + file.size, 0),
        );

        toast({
          title: "🎉 Page numbering completed!",
          description: `Successfully added page numbers to ${numberedResults.length} PDF(s).`,
        });
      }
    } catch (error) {
      console.error("Error adding page numbers:", error);
      toast({
        title: "Page numbering failed",
        description:
          "There was an error adding page numbers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addPageNumbersToPdf = async (
    file: File,
    settings: typeof numberingSettings,
  ): Promise<Uint8Array> => {
    console.log("🔄 Adding page numbers to PDF...");

    try {
      const { PDFDocument, rgb } = await import("pdf-lib");

      // Load the PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      console.log(`📑 Adding page numbers to ${pages.length} pages`);

      // Add page numbers to each page
      pages.forEach((page, index) => {
        const pageNumber = index + 1;

        // Skip first page if specified
        if (!settings.includeFirstPage && pageNumber === 1) {
          return;
        }

        const { width, height } = page.getSize();

        // Calculate position based on settings
        let x, y;
        switch (settings.position) {
          case "top-left":
            x = settings.margin[0];
            y = height - settings.margin[0];
            break;
          case "top-center":
            x = width / 2;
            y = height - settings.margin[0];
            break;
          case "top-right":
            x = width - settings.margin[0];
            y = height - settings.margin[0];
            break;
          case "bottom-left":
            x = settings.margin[0];
            y = settings.margin[0];
            break;
          case "bottom-center":
            x = width / 2;
            y = settings.margin[0];
            break;
          case "bottom-right":
            x = width - settings.margin[0];
            y = settings.margin[0];
            break;
          default:
            x = width / 2;
            y = settings.margin[0];
        }

        // Format page number
        let displayNumber;
        const actualNumber = pageNumber + settings.startNumber - 1;
        switch (settings.format) {
          case "1":
            displayNumber = actualNumber.toString();
            break;
          case "Page 1":
            displayNumber = `Page ${actualNumber}`;
            break;
          case "1 / Total":
            displayNumber = `${actualNumber} / ${pages.length}`;
            break;
          case "Page 1 of Total":
            displayNumber = `Page ${actualNumber} of ${pages.length}`;
            break;
          default:
            displayNumber = actualNumber.toString();
        }

        // Add page number
        page.drawText(displayNumber, {
          x: settings.position.includes("center")
            ? x - (displayNumber.length * settings.fontSize[0]) / 4
            : x,
          y,
          size: settings.fontSize[0],
          color: rgb(0.3, 0.3, 0.3),
        });

        console.log(
          `✅ Added page number to page ${pageNumber}: ${displayNumber}`,
        );
      });

      // Add metadata
      pdfDoc.setSubject(`PDF with page numbers - ${settings.format} format`);
      pdfDoc.setCreator(`PdfPage - Page Numbers Tool`);

      // Save the numbered PDF
      const pdfBytes = await pdfDoc.save();
      console.log(`🎉 Page numbering completed: ${pdfBytes.length} bytes`);

      return pdfBytes;
    } catch (error) {
      console.error("Page numbering failed:", error);
      throw error;
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const downloadAll = () => {
    numberedFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file.url, file.name), index * 100);
    });
  };

  const reset = () => {
    setFiles([]);
    setNumberedFiles([]);
    setIsComplete(false);
    setShowPreview(false);
    setPagesPreviews([]);
    setPdfDocument(null);
    setTotalPages(0);
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Hash className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Page Numbers
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Add page numbers into PDFs with ease. Choose your positions,
            dimensions, typography and numbering format with live preview.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <span className="mr-2">🔢</span>
            Real page numbering with live preview!
          </div>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Settings and File Upload */}
            <div className="lg:col-span-1 space-y-6">
              {/* File Upload */}
              {files.length === 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <FileUpload
                    onFilesSelect={handleFileUpload}
                    accept=".pdf"
                    multiple={true}
                    maxSize={50}
                    allowedTypes={["pdf"]}
                    uploadText="Select PDF files"
                    supportText="Drop PDF files here"
                  />
                </div>
              )}

              {/* File List and Settings */}
              {files.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-dark">
                      Selected Files ({files.length})
                    </h3>
                    {files.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Hide Preview
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Show Preview
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-text-dark">
                              {file.name}
                            </p>
                            <p className="text-sm text-text-light">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                              {totalPages > 0 && ` • ${totalPages} pages`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Numbering Settings */}
                  <div className="space-y-6">
                    <h4 className="text-md font-semibold text-text-dark">
                      Page Number Settings
                    </h4>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Position
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "top-left", label: "Top Left" },
                          { value: "top-center", label: "Top Center" },
                          { value: "top-right", label: "Top Right" },
                          { value: "bottom-left", label: "Bottom Left" },
                          { value: "bottom-center", label: "Bottom Center" },
                          { value: "bottom-right", label: "Bottom Right" },
                        ].map((pos) => (
                          <button
                            key={pos.value}
                            onClick={() =>
                              setNumberingSettings({
                                ...numberingSettings,
                                position: pos.value,
                              })
                            }
                            className={`px-3 py-2 text-sm rounded border ${
                              numberingSettings.position === pos.value
                                ? "border-purple-500 bg-purple-50 text-purple-700"
                                : "border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Format */}
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Number Format
                      </label>
                      <select
                        value={numberingSettings.format}
                        onChange={(e) =>
                          setNumberingSettings({
                            ...numberingSettings,
                            format: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="1">1, 2, 3...</option>
                        <option value="Page 1">Page 1, Page 2...</option>
                        <option value="1 / Total">1 / 5, 2 / 5...</option>
                        <option value="Page 1 of Total">
                          Page 1 of 5, Page 2 of 5...
                        </option>
                      </select>
                    </div>

                    {/* Start Number */}
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Start Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={numberingSettings.startNumber}
                        onChange={(e) =>
                          setNumberingSettings({
                            ...numberingSettings,
                            startNumber: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Font Size: {numberingSettings.fontSize[0]}pt
                      </label>
                      <Slider
                        value={numberingSettings.fontSize}
                        onValueChange={(value) =>
                          setNumberingSettings({
                            ...numberingSettings,
                            fontSize: value,
                          })
                        }
                        max={24}
                        min={8}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Margin */}
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Margin from Edge: {numberingSettings.margin[0]}pt
                      </label>
                      <Slider
                        value={numberingSettings.margin}
                        onValueChange={(value) =>
                          setNumberingSettings({
                            ...numberingSettings,
                            margin: value,
                          })
                        }
                        max={100}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    {/* Include First Page */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={numberingSettings.includeFirstPage}
                        onChange={(e) =>
                          setNumberingSettings({
                            ...numberingSettings,
                            includeFirstPage: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Include page number on first page
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 mt-6">
                    <Button
                      onClick={handleAddNumbers}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding Numbers...
                        </>
                      ) : (
                        <>
                          <Hash className="w-4 h-4 mr-2" />
                          Add Page Numbers
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setFiles([])}>
                      Clear Files
                    </Button>
                  </div>
                </div>
              )}

              {/* Premium Features */}
              {!user?.isPremium && files.length > 0 && (
                <Card className="border-brand-yellow bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-800">
                      <Crown className="w-5 h-5 mr-2 text-brand-yellow" />
                      Unlock Premium Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-orange-700 mb-4">
                      <li className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                        Custom fonts and colors
                      </li>
                      <li className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                        Roman numeral formatting
                      </li>
                      <li className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                        Different numbering per section
                      </li>
                      <li className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                        Headers and footers
                      </li>
                    </ul>
                    <Button className="bg-brand-yellow text-black hover:bg-yellow-400 w-full">
                      <Crown className="w-4 h-4 mr-2" />
                      Get Premium
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Side - PDF Preview */}
            <div className="lg:col-span-2">
              {files.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-dark">
                      Live Preview
                    </h3>
                    <div className="text-sm text-text-light">
                      {isLoadingPreview && "Loading preview..."}
                      {!isLoadingPreview &&
                        totalPages > 0 &&
                        `${totalPages} pages`}
                    </div>
                  </div>

                  {!showPreview ? (
                    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-text-light mb-2">Preview Hidden</p>
                        <p className="text-sm text-gray-500">
                          Click "Show Preview" to see page number positions
                        </p>
                      </div>
                    </div>
                  ) : isLoadingPreview ? (
                    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-text-light">
                          Loading PDF preview...
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Generating page thumbnails...
                        </p>
                      </div>
                    </div>
                  ) : pagesPreviews.length > 0 ? (
                    <div
                      ref={previewContainerRef}
                      className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4"
                    >
                      <div className="mb-2 text-sm text-gray-600">
                        Showing {pagesPreviews.length} pages • Click on position
                        buttons to see changes
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {pagesPreviews.map((preview) => {
                          const shouldShowNumber =
                            numberingSettings.includeFirstPage ||
                            preview.pageNumber !== 1;
                          const position = calculatePageNumberPosition(
                            preview.width,
                            preview.height,
                          );
                          const pageNumberText = formatPageNumber(
                            preview.pageNumber,
                          );

                          return (
                            <div
                              key={preview.pageNumber}
                              className="relative border border-gray-200 rounded bg-white overflow-hidden"
                            >
                              <img
                                src={preview.canvas.toDataURL()}
                                alt={`Page ${preview.pageNumber}`}
                                className="w-full h-auto"
                              />

                              {/* Page number overlay */}
                              {shouldShowNumber && (
                                <div
                                  className="absolute bg-red-500 text-white text-xs px-1 py-0.5 rounded shadow-lg z-10 font-mono"
                                  style={{
                                    left: `${(position.x / preview.width) * 100}%`,
                                    top: `${(position.y / preview.height) * 100}%`,
                                    transform:
                                      numberingSettings.position.includes(
                                        "center",
                                      )
                                        ? "translate(-50%, -50%)"
                                        : numberingSettings.position.includes(
                                              "right",
                                            )
                                          ? "translate(-100%, -50%)"
                                          : "translate(0%, -50%)",
                                    fontSize: `${Math.max(8, numberingSettings.fontSize[0] * 0.3)}px`,
                                  }}
                                >
                                  {pageNumberText}
                                </div>
                              )}

                              {/* Page number indicator */}
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                                {preview.pageNumber}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalPages > pagesPreviews.length && (
                        <div className="text-center mt-4 text-sm text-gray-500">
                          Showing {pagesPreviews.length} of {totalPages} pages
                        </div>
                      )}
                    </div>
                  ) : files.length > 0 ? (
                    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-text-light mb-2">
                          Preview not generated
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                          Debug info: {pagesPreviews.length} previews,{" "}
                          {totalPages} total pages
                        </p>
                        <p className="text-xs text-gray-400">
                          Check browser console for details
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() =>
                            files[0] && loadPDFForPreview(files[0])
                          }
                        >
                          Retry Preview
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-text-light mb-2">
                          Upload a PDF to see live preview
                        </p>
                        <p className="text-sm text-gray-500">
                          Preview shows where page numbers will be placed
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Results */
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hash className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                Page Numbering Complete!
              </h3>
              <p className="text-text-light">
                Successfully added page numbers to {files.length} PDF(s)
              </p>
            </div>

            {/* File List */}
            <div className="space-y-3 mb-6">
              {numberedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Hash className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-text-dark">{file.name}</p>
                      <p className="text-sm text-text-light">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Numbered
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file.url, file.name)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={downloadAll} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download All Files
              </Button>
              <Button variant="outline" onClick={reset}>
                Add Numbers to More Files
              </Button>
            </div>
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

export default PageNumbers;
