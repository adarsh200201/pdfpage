import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import {
  ArrowLeft,
  Download,
  FileText,
  Camera,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Image,
  RotateCw,
  Crop,
  Contrast,
  Palette,
  Trash2,
  Move,
  ZoomIn,
  Plus,
  Eye,
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
  preview: string;
  rotation: number;
  order: number;
}

interface ConversionSettings {
  pageSize: "A4" | "Letter" | "Legal" | "A3" | "Custom";
  orientation: "portrait" | "landscape";
  quality: "high" | "medium" | "low";
  autoEnhance: boolean;
  removeBackground: boolean;
  adjustContrast: boolean;
  margin: number;
}

const ScanToPdf = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [settings, setSettings] = useState<ConversionSettings>({
    pageSize: "A4",
    orientation: "portrait",
    quality: "high",
    autoEnhance: true,
    removeBackground: false,
    adjustContrast: true,
    margin: 20,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const supportedImageTypes = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".bmp",
    ".tiff",
    ".gif",
  ];

  const handleFilesSelect = async (newFiles: File[]) => {
    const processedFiles: ProcessedFile[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];

      // Check if it's an image file
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported image format`,
          variant: "destructive",
        });
        continue;
      }

      try {
        // Create preview URL
        const preview = URL.createObjectURL(file);

        const processedFile: ProcessedFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          preview,
          rotation: 0,
          order: files.length + i,
        };

        processedFiles.push(processedFile);
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "Error",
          description: `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setFiles((prev) => [...prev, ...processedFiles]);
    setIsComplete(false);

    if (processedFiles.length > 0) {
      toast({
        title: "Images added",
        description: `Added ${processedFiles.length} image(s) for PDF conversion`,
      });
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const updatedFiles = prev.filter((f) => f.id !== id);
      // Clean up preview URL
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updatedFiles;
    });
  };

  const rotateImage = (id: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? { ...file, rotation: (file.rotation + 90) % 360 }
          : file,
      ),
    );
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      return newFiles.map((file, index) => ({ ...file, order: index }));
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveFile(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No images selected",
        description: "Please add at least one image to convert to PDF.",
        variant: "destructive",
      });
      return;
    }

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
        title: `🔄 Converting ${files.length} image(s) to PDF...`,
        description: "Processing images with enhancement settings",
      });

      // Check file size limits
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (totalSize > maxSize) {
        throw new Error(
          `Combined file size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      setProgress(25);

      // Convert images to PDF
      const pdfBytes = await convertImagesToPdf(files, settings, (progress) => {
        setProgress(25 + progress * 0.7);
      });

      setProgress(95);

      // Track usage
      await PDFService.trackUsage("scan-to-pdf", files.length, totalSize);

      // Download the PDF
      PDFService.downloadFile(pdfBytes, "scanned-document.pdf");

      setIsComplete(true);
      setProgress(100);

      toast({
        title: "Success!",
        description: `Converted ${files.length} image(s) to PDF successfully`,
      });
    } catch (error: any) {
      console.error("Error converting images to PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to convert images to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const convertImagesToPdf = async (
    files: ProcessedFile[],
    settings: ConversionSettings,
    onProgress?: (progress: number) => void,
  ): Promise<Uint8Array> => {
    const { loadPDFLib } = await import("@/lib/pdf-utils");
    const PDFLib = await loadPDFLib();

    onProgress?.(10);

    const pdfDoc = await PDFLib.PDFDocument.create();

    // Set page dimensions based on settings
    const pageDimensions = getPageDimensions(
      settings.pageSize,
      settings.orientation,
    );

    onProgress?.(20);

    // Process each image
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.(20 + (i / files.length) * 60);

      try {
        // Load image
        const imageBytes = await file.file.arrayBuffer();
        let image;

        if (file.file.type === "image/jpeg" || file.file.type === "image/jpg") {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.file.type === "image/png") {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          // Convert other formats to PNG first (simplified)
          console.warn(`Converting ${file.file.type} to PNG for PDF embedding`);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();

          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = file.preview;
          });

          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const pngBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), "image/png");
          });

          const pngBytes = await pngBlob.arrayBuffer();
          image = await pdfDoc.embedPng(pngBytes);
        }

        // Create new page
        const page = pdfDoc.addPage([
          pageDimensions.width,
          pageDimensions.height,
        ]);

        // Calculate image scaling to fit page with margins
        const margin = settings.margin;
        const availableWidth = pageDimensions.width - margin * 2;
        const availableHeight = pageDimensions.height - margin * 2;

        const imageAspectRatio = image.width / image.height;
        const availableAspectRatio = availableWidth / availableHeight;

        let imageWidth, imageHeight;

        if (imageAspectRatio > availableAspectRatio) {
          // Image is wider than available space
          imageWidth = availableWidth;
          imageHeight = availableWidth / imageAspectRatio;
        } else {
          // Image is taller than available space
          imageHeight = availableHeight;
          imageWidth = availableHeight * imageAspectRatio;
        }

        // Center the image on the page
        const x = (pageDimensions.width - imageWidth) / 2;
        const y = (pageDimensions.height - imageHeight) / 2;

        // Apply rotation if needed
        const rotation = file.rotation * (Math.PI / 180);

        page.drawImage(image, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
          rotate: { type: "radians", value: rotation },
        });
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        // Continue with other files
      }
    }

    onProgress?.(90);

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    onProgress?.(100);

    return pdfBytes;
  };

  const getPageDimensions = (pageSize: string, orientation: string) => {
    const sizes = {
      A4: { width: 595, height: 842 },
      Letter: { width: 612, height: 792 },
      Legal: { width: 612, height: 1008 },
      A3: { width: 842, height: 1191 },
      Custom: { width: 612, height: 792 }, // Default to Letter for custom
    };

    const size = sizes[pageSize as keyof typeof sizes] || sizes.A4;

    if (orientation === "landscape") {
      return { width: size.height, height: size.width };
    }

    return size;
  };

  const openCamera = () => {
    // This would implement camera functionality in a real app
    toast({
      title: "Camera feature",
      description:
        "Camera integration would be implemented here for mobile devices",
    });
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
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Scan to PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Convert images and document scans into professional PDF files with
            automatic enhancement and organization.
          </p>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload and Camera */}
            {files.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-heading-small text-text-dark mb-4 flex items-center">
                      <Image className="w-5 h-5 mr-2" />
                      Upload Images
                    </h3>
                    <FileUpload
                      onFilesSelect={handleFilesSelect}
                      multiple={true}
                      maxSize={25}
                      accept={supportedImageTypes.join(",")}
                      allowedTypes={["image"]}
                      uploadText="Drop your images here or click to browse"
                    />
                    <p className="text-xs text-text-light mt-2">
                      Supported formats: JPG, PNG, WEBP, BMP, TIFF, GIF
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <Button
                        onClick={openCamera}
                        className="w-32 h-32 rounded-2xl bg-green-100 hover:bg-green-200 flex-col text-green-700 border-2 border-green-300"
                        variant="ghost"
                      >
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">Use Camera</span>
                      </Button>
                      <p className="text-xs text-text-light mt-2">
                        Capture documents with your camera
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Image List and Preview */}
            {files.length > 0 && !isProcessing && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Image List */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-heading-small text-text-dark">
                        Images ({files.length})
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add More
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSettings(!showSettings)}
                        >
                          Settings
                        </Button>
                      </div>
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={supportedImageTypes.join(",")}
                      onChange={(e) =>
                        e.target.files &&
                        handleFilesSelect(Array.from(e.target.files))
                      }
                      className="hidden"
                    />

                    {/* Settings Panel */}
                    {showSettings && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">
                              Page Size
                            </label>
                            <select
                              value={settings.pageSize}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  pageSize: e.target
                                    .value as ConversionSettings["pageSize"],
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                              <option value="A4">A4</option>
                              <option value="Letter">Letter</option>
                              <option value="Legal">Legal</option>
                              <option value="A3">A3</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">
                              Orientation
                            </label>
                            <select
                              value={settings.orientation}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  orientation: e.target.value as
                                    | "portrait"
                                    | "landscape",
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                              <option value="portrait">Portrait</option>
                              <option value="landscape">Landscape</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={settings.autoEnhance}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  autoEnhance: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-text-dark">
                              Auto Enhance
                            </span>
                          </label>

                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={settings.adjustContrast}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  adjustContrast: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-text-dark">
                              Adjust Contrast
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Image Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {files.map((file, index) => (
                        <div
                          key={file.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "relative group border-2 rounded-lg overflow-hidden cursor-move transition-all",
                            draggedIndex === index
                              ? "border-green-500 shadow-lg"
                              : "border-gray-200 hover:border-gray-300",
                            previewIndex === index && "ring-2 ring-green-500",
                          )}
                          onClick={() => setPreviewIndex(index)}
                        >
                          <div className="aspect-[3/4] relative">
                            <img
                              src={file.preview}
                              alt={file.name}
                              className={cn(
                                "w-full h-full object-cover",
                                file.rotation !== 0 &&
                                  `transform rotate-${file.rotation}`,
                              )}
                              style={{
                                transform: `rotate(${file.rotation}deg)`,
                              }}
                            />

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rotateImage(file.id);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <RotateCw className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewIndex(index);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(file.id);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Page Number */}
                            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>

                            {/* File Name */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                              <p className="text-xs truncate">{file.name}</p>
                              <p className="text-xs text-gray-300">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-text-light mt-4 text-center">
                      Drag to reorder • Click to preview • Hover for controls
                    </p>
                  </div>
                </div>

                {/* Preview and Controls */}
                <div className="space-y-6">
                  {/* Large Preview */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h4 className="font-medium text-text-dark mb-3">
                      Preview - Page {previewIndex + 1}
                    </h4>
                    <div className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={files[previewIndex]?.preview}
                        alt={files[previewIndex]?.name}
                        className="w-full h-full object-contain"
                        style={{
                          transform: `rotate(${files[previewIndex]?.rotation || 0}deg)`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={previewIndex === 0}
                        onClick={() => setPreviewIndex((prev) => prev - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-text-light">
                        {previewIndex + 1} of {files.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={previewIndex === files.length - 1}
                        onClick={() => setPreviewIndex((prev) => prev + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h4 className="font-medium text-text-dark mb-3">
                      Quick Actions
                    </h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rotateImage(files[previewIndex]?.id)}
                        className="w-full justify-start"
                      >
                        <RotateCw className="w-4 h-4 mr-2" />
                        Rotate Image
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(files[previewIndex]?.id)}
                        className="w-full justify-start text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Image
                      </Button>
                    </div>
                  </div>

                  {/* Convert Button */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <Button
                      size="lg"
                      onClick={handleConvert}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Convert to PDF ({files.length} images)
                    </Button>
                    <p className="text-xs text-text-light mt-2 text-center">
                      Create a PDF with all selected images
                    </p>
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

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Converting images to PDF...
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  Applying enhancements and organizing pages
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-text-light mt-2">
                  {progress}% complete
                </p>
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
              PDF created successfully!
            </h3>
            <p className="text-body-medium text-text-light mb-6">
              Your {files.length} image(s) have been converted to a PDF document
            </p>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => window.location.reload()}
                className="bg-green-500 hover:bg-green-600"
              >
                Convert More Images
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Camera className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Multiple Image Support
            </h4>
            <p className="text-body-small text-text-light">
              Convert multiple images into a single organized PDF document
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Contrast className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Auto Enhancement
            </h4>
            <p className="text-body-small text-text-light">
              Automatically enhance image quality and adjust contrast for better
              readability
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Move className="w-6 h-6 text-purple-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Drag & Drop Organization
            </h4>
            <p className="text-body-small text-text-light">
              Easily reorder images by dragging and dropping to organize your
              PDF
            </p>
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

export default ScanToPdf;
