import { useState } from "react";
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
import {
  ArrowLeft,
  Download,
  Image,
  FileText,
  Trash2,
  Crown,
  Star,
  GripVertical,
} from "lucide-react";

interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
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

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (uploadedFiles: File[]) => {
    const imageFiles: ImageFile[] = uploadedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...imageFiles]);
    setIsComplete(false);
    setConvertedPdf(null);
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
      if (!usageCheck.canUpload) {
        setShowAuthModal(true);
        return;
      }
    } catch (error) {
      console.error("Error checking usage limit:", error);
    }

    setIsProcessing(true);

    try {
      toast({
        title: "🔄 Converting images to PDF...",
        description: `Processing ${images.length} image(s)`,
      });

      // Convert images to PDF
      const pdfContent = await convertImagesToPdf(images);
      const blob = new Blob([pdfContent], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setConvertedPdf({
        name: `images-to-pdf-${Date.now()}.pdf`,
        url,
        size: blob.size,
      });
      setIsComplete(true);

      // Track usage for revenue analytics
      await PDFService.trackUsage(
        "jpg-to-pdf",
        images.length,
        images.reduce((sum, img) => sum + img.size, 0),
      );

      toast({
        title: "🎉 Conversion completed!",
        description: `Successfully converted ${images.length} image(s) to PDF.`,
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
    }
  };

  const convertImagesToPdf = async (
    imageFiles: ImageFile[],
  ): Promise<Uint8Array> => {
    console.log(`🔄 Converting ${imageFiles.length} images to PDF...`);

    try {
      const { PDFDocument } = await import("pdf-lib");

      // Create new PDF document
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
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

          // Calculate page size to fit image
          let pageWidth = imageDims.width;
          let pageHeight = imageDims.height;

          // Limit maximum page size to reasonable dimensions
          const maxSize = 792; // Standard letter width
          if (pageWidth > maxSize || pageHeight > maxSize) {
            const scale = Math.min(maxSize / pageWidth, maxSize / pageHeight);
            pageWidth = pageWidth * scale;
            pageHeight = pageHeight * scale;
          }

          // Add page with image
          const page = pdfDoc.addPage([pageWidth, pageHeight]);

          // Draw image to fill the page
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          });

          console.log(
            `✅ Image ${i + 1} added to PDF: ${Math.round(pageWidth)}x${Math.round(pageHeight)}`,
          );
        } catch (imageError) {
          console.error(
            `❌ Error processing image ${imageFile.name}:`,
            imageError,
          );
          // Continue with other images
        }
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      console.log(`🎉 PDF creation completed: ${pdfBytes.length} bytes`);

      return pdfBytes;
    } catch (error) {
      console.error("PDF conversion failed:", error);
      throw error;
    }
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
                  uploadText="Select images or drop image files here"
                  supportText="Supports JPG, PNG, GIF, BMP, WebP formats"
                />
              </div>
            )}

            {/* Image List */}
            {images.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-text-dark mb-4">
                  Selected Images ({images.length})
                </h3>

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

                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-16 h-16 object-cover rounded border"
                      />

                      <div className="flex-1">
                        <p className="font-medium text-text-dark">
                          {image.name}
                        </p>
                        <p className="text-sm text-text-light">
                          {(image.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage(image.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-text-light mb-6">
                  💡 Tip: Drag and drop to reorder images. The order will be
                  preserved in the PDF.
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
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Converting...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Convert to PDF
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setImages([])}>
                    Clear Images
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
