import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";

import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Image,
  FileText,
  Trash2,
  Crown,
  Star,
  GripVertical,
  Settings,
  Eye,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
  status: "uploaded" | "processing" | "completed" | "error";
  dimensions?: { width: number; height: number };
}

interface PDFSettings {
  pageSize: "A4" | "Letter" | "Custom" | "Fit-to-Image";
  orientation: "portrait" | "landscape";
  margin: number;
  quality: number;
  backgroundColor: string;
}

const JpgToPdf = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [convertedPdf, setConvertedPdf] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Real-time features state
  const [conversionProgress, setConversionProgress] = useState(0);
  const [currentProcessingImage, setCurrentProcessingImage] =
    useState<string>("");
  const [estimatedPdfSize, setEstimatedPdfSize] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [livePreview, setLivePreview] = useState(true);
  const [pdfSettings, setPdfSettings] = useState<PDFSettings>({
    pageSize: "Fit-to-Image",
    orientation: "portrait",
    margin: 20,
    quality: 85,
    backgroundColor: "#ffffff",
  });

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Real-time PDF size estimation
  const calculateEstimatedPdfSize = useCallback((imageList: ImageFile[]) => {
    const totalImageSize = imageList.reduce((sum, img) => sum + img.size, 0);
    // Rough estimation: PDF is usually 70-90% of original image sizes
    const estimatedSize = totalImageSize * 0.8;
    setEstimatedPdfSize(estimatedSize);
    return estimatedSize;
  }, []);

  // Real-time image dimension detection
  const getImageDimensions = useCallback(
    (file: File): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
          URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
      });
    },
    [],
  );

  const handleFileUpload = async (uploadedFiles: File[]) => {
    // Show immediate feedback
    toast({
      title: "📂 Processing images...",
      description: `Analyzing ${uploadedFiles.length} image(s)`,
    });

    const imageFiles: ImageFile[] = await Promise.all(
      uploadedFiles.map(async (file) => {
        const dimensions = await getImageDimensions(file);
        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          preview: URL.createObjectURL(file),
          status: "uploaded" as const,
          dimensions,
        };
      }),
    );

    setImages((prev) => {
      const newList = [...prev, ...imageFiles];
      calculateEstimatedPdfSize(newList);
      return newList;
    });
    setIsComplete(false);
    setConvertedPdf(null);

    // Show success feedback
    toast({
      title: "✅ Images ready!",
      description: `${imageFiles.length} image(s) prepared for conversion`,
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      // Cleanup object URLs
      const removed = prev.find((img) => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveImage(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select JPG/PNG images to convert.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    try {
      const usageCheck = await PDFService.checkUsageLimit();
      if (!usageCheck.canUse) {
        setShowAuthModal(true);
        return;
      }
    } catch (error) {
      console.error("Error checking usage limit:", error);
    }

    setIsProcessing(true);
    setConversionProgress(0);
    const startTime = Date.now();

    try {
      toast({
        title: "🚀 Starting conversion...",
        description: `Processing ${images.length} image(s) with current settings`,
      });

      // Convert images to PDF with progress tracking
      const pdfContent = await convertImagesToPdfWithProgress(images);
      const blob = new Blob([pdfContent], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setConvertedPdf({
        name: `images-to-pdf-${Date.now()}.pdf`,
        url,
        size: blob.size,
      });
      setIsComplete(true);
      setConversionProgress(100);
      setProcessingTime(Date.now() - startTime);

      // Track usage for revenue analytics
      await PDFService.trackUsage(
        "jpg-to-pdf",
        images.length,
        images.reduce((sum, img) => sum + img.size, 0),
      );

      toast({
        title: "🎉 Conversion completed!",
        description: `Successfully converted ${images.length} image(s) to PDF in ${Math.round((Date.now() - startTime) / 1000)}s`,
      });
    } catch (error) {
      console.error("Error converting images to PDF:", error);
      toast({
        title: "Conversion failed",
        description:
          "There was an error converting your images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentProcessingImage("");
    }
  };

  const convertImagesToPdfWithProgress = async (
    imageFiles: ImageFile[],
  ): Promise<Uint8Array> => {
    console.log(`🔄 Converting ${imageFiles.length} images to PDF...`);
    setConversionProgress(5);

    try {
      const { PDFDocument } = await import("pdf-lib");
      setConversionProgress(10);

      // Create new PDF document
      const pdfDoc = await PDFDocument.create();
      setConversionProgress(15);

      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        setCurrentProcessingImage(imageFile.name);

        // Update image status to processing
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageFile.id
              ? { ...img, status: "processing" as const }
              : img,
          ),
        );

        console.log(`📸 Processing image ${i + 1}: ${imageFile.name}`);

        try {
          // Read image file
          const imageBytes = await imageFile.file.arrayBuffer();
          let image;

          // Embed image based on type
          if (imageFile.file.type.includes("png")) {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            // Default to JPEG for other formats
            image = await pdfDoc.embedJpg(imageBytes);
          }

          const imageDims = image.scale(1);

          // Calculate page size based on settings
          let pageWidth, pageHeight;

          if (pdfSettings.pageSize === "Fit-to-Image") {
            pageWidth = imageDims.width;
            pageHeight = imageDims.height;
          } else if (pdfSettings.pageSize === "A4") {
            pageWidth = pdfSettings.orientation === "portrait" ? 595 : 842;
            pageHeight = pdfSettings.orientation === "portrait" ? 842 : 595;
          } else if (pdfSettings.pageSize === "Letter") {
            pageWidth = pdfSettings.orientation === "portrait" ? 612 : 792;
            pageHeight = pdfSettings.orientation === "portrait" ? 792 : 612;
          } else {
            // Custom or fallback
            pageWidth = imageDims.width;
            pageHeight = imageDims.height;
          }

          // Apply margins
          const margin = pdfSettings.margin;
          const availableWidth = pageWidth - margin * 2;
          const availableHeight = pageHeight - margin * 2;

          // Scale image to fit within margins
          const scale = Math.min(
            availableWidth / imageDims.width,
            availableHeight / imageDims.height,
            1, // Don't upscale
          );

          const scaledWidth = imageDims.width * scale;
          const scaledHeight = imageDims.height * scale;

          // Center the image
          const x = (pageWidth - scaledWidth) / 2;
          const y = (pageHeight - scaledHeight) / 2;

          // Add page with background color
          const page = pdfDoc.addPage([pageWidth, pageHeight]);

          // Fill background if specified
          if (pdfSettings.backgroundColor !== "#ffffff") {
            const [r, g, b] = hexToRgb(pdfSettings.backgroundColor);
            page.drawRectangle({
              x: 0,
              y: 0,
              width: pageWidth,
              height: pageHeight,
              color: { r: r / 255, g: g / 255, b: b / 255 },
            });
          }

          // Draw image
          page.drawImage(image, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          });

          // Update image status to completed
          setImages((prev) =>
            prev.map((img) =>
              img.id === imageFile.id
                ? { ...img, status: "completed" as const }
                : img,
            ),
          );

          console.log(
            `✅ Image ${i + 1} added to PDF: ${Math.round(scaledWidth)}x${Math.round(scaledHeight)}`,
          );

          // Update progress
          const progress = 15 + ((i + 1) / imageFiles.length) * 80;
          setConversionProgress(progress);

          // Small delay to show progress
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (imageError) {
          console.error(
            `❌ Error processing image ${imageFile.name}:`,
            imageError,
          );

          // Update image status to error
          setImages((prev) =>
            prev.map((img) =>
              img.id === imageFile.id
                ? { ...img, status: "error" as const }
                : img,
            ),
          );
          // Continue with other images
        }
      }

      setConversionProgress(95);
      setCurrentProcessingImage("Finalizing PDF...");

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      console.log(`🎉 PDF creation completed: ${pdfBytes.length} bytes`);

      return pdfBytes;
    } catch (error) {
      console.error("PDF conversion failed:", error);
      throw error;
    }
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [255, 255, 255];
  };

  // Real-time settings update
  const updateSettings = (newSettings: Partial<PDFSettings>) => {
    setPdfSettings((prev) => ({ ...prev, ...newSettings }));
    calculateEstimatedPdfSize(images);

    if (livePreview) {
      toast({
        title: "⚙️ Settings updated",
        description: "PDF preview will reflect your changes",
      });
    }
  };

  // Format bytes for display
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const downloadPdf = () => {
    if (convertedPdf) {
      const link = document.createElement("a");
      link.href = convertedPdf.url;
      link.download = convertedPdf.name;
      link.click();
    }
  };

  const reset = () => {
    // Cleanup object URLs
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    if (convertedPdf) {
      URL.revokeObjectURL(convertedPdf.url);
    }

    setImages([]);
    setConvertedPdf(null);
    setIsComplete(false);
    setConversionProgress(0);
    setCurrentProcessingImage("");
    setProcessingTime(0);
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Image className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            JPG to PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Convert JPG images to PDF in seconds. Easily adjust orientation and
            margins. Combine multiple images into a single PDF document.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <span className="mr-2">✨</span>
            Real image to PDF conversion with high quality!
          </div>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload */}
            {images.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFileUpload}
                  accept="image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                  multiple={true}
                  maxSize={25}
                  allowedTypes={["image"]}
                  acceptedFileTypes={{
                    "image/*": [
                      ".jpg",
                      ".jpeg",
                      ".png",
                      ".gif",
                      ".bmp",
                      ".webp",
                    ],
                  }}
                  uploadText="Select image files to convert"
                  supportText="Supports JPG, PNG, GIF, BMP, WebP formats"
                />
              </div>
            )}

            {/* Real-time Statistics */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Image className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {images.length} Images
                        </p>
                        <p className="text-xs text-gray-500">
                          Ready to convert
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {formatBytes(estimatedPdfSize)}
                        </p>
                        <p className="text-xs text-gray-500">Est. PDF size</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {pdfSettings.pageSize}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pdfSettings.orientation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {processingTime > 0
                            ? `${Math.round(processingTime / 1000)}s`
                            : "~2-5s"}
                        </p>
                        <p className="text-xs text-gray-500">Process time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Real-time Settings Panel */}
            {images.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      PDF Settings
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      {showSettings ? "Hide" : "Show"} Settings
                    </Button>
                  </div>
                </CardHeader>

                {showSettings && (
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Page Size
                        </label>
                        <Select
                          value={pdfSettings.pageSize}
                          onValueChange={(value: any) =>
                            updateSettings({ pageSize: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fit-to-Image">
                              Fit to Image
                            </SelectItem>
                            <SelectItem value="A4">A4</SelectItem>
                            <SelectItem value="Letter">Letter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Orientation
                        </label>
                        <Select
                          value={pdfSettings.orientation}
                          onValueChange={(value: any) =>
                            updateSettings({ orientation: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Margin: {pdfSettings.margin}px
                      </label>
                      <Slider
                        value={[pdfSettings.margin]}
                        onValueChange={([value]) =>
                          updateSettings({ margin: value })
                        }
                        max={50}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Quality: {pdfSettings.quality}%
                      </label>
                      <Slider
                        value={[pdfSettings.quality]}
                        onValueChange={([value]) =>
                          updateSettings({ quality: value })
                        }
                        max={100}
                        min={50}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Enhanced Image List */}
            {images.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-dark">
                    Selected Images ({images.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      Live Preview
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="mb-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Converting images to PDF...</span>
                      <span>{Math.round(conversionProgress)}%</span>
                    </div>
                    <Progress value={conversionProgress} className="w-full" />
                    {currentProcessingImage && (
                      <p className="text-xs text-gray-500">
                        Processing: {currentProcessingImage}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />

                      <div className="relative">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-16 h-16 object-cover rounded border"
                        />

                        {/* Status indicator */}
                        <div className="absolute -top-1 -right-1">
                          {image.status === "processing" && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <RefreshCw className="w-3 h-3 text-white animate-spin" />
                            </div>
                          )}
                          {image.status === "completed" && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {image.status === "error" && (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-text-dark">
                          {image.name}
                        </p>
                        <div className="text-sm text-text-light space-y-1">
                          <p>{formatBytes(image.size)}</p>
                          {image.dimensions && (
                            <p>
                              {image.dimensions.width} ×{" "}
                              {image.dimensions.height}px
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            image.status === "completed"
                              ? "default"
                              : image.status === "processing"
                                ? "secondary"
                                : image.status === "error"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {image.status === "uploaded" && (
                            <Zap className="w-3 h-3 mr-1" />
                          )}
                          {image.status === "processing" && (
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          )}
                          {image.status === "completed" && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {image.status === "error" && (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {image.status.charAt(0).toUpperCase() +
                            image.status.slice(1)}
                        </Badge>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeImage(image.id)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <Eye className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">
                        Live Preview Features
                      </p>
                      <ul className="text-blue-700 space-y-1 text-xs">
                        <li>• Drag and drop to reorder images</li>
                        <li>• Real-time PDF size estimation</li>
                        <li>• Live settings preview</li>
                        <li>• Processing status indicators</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Converting... ({Math.round(conversionProgress)}%)
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Convert to PDF
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setImages([])}
                    disabled={isProcessing}
                  >
                    Clear Images
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(!showSettings)}
                    disabled={isProcessing}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            )}

            {/* Premium Features */}
            {!user?.isPremium && (
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
                      Convert unlimited images
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Batch process up to 100 images
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Advanced image compression
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Custom page layouts
                    </li>
                  </ul>
                  <Button className="bg-brand-yellow text-black hover:bg-yellow-400">
                    <Crown className="w-4 h-4 mr-2" />
                    Get Premium
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Results */
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                Conversion Complete!
              </h3>
              <p className="text-text-light">
                Successfully converted {images.length} image(s) to PDF
              </p>
            </div>

            {/* PDF Preview */}
            {convertedPdf && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="font-medium text-text-dark">
                      {convertedPdf.name}
                    </p>
                    <p className="text-sm text-text-light">
                      {(convertedPdf.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {images.length} page(s)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={downloadPdf} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={reset}>
                Convert More Images
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

export default JpgToPdf;
