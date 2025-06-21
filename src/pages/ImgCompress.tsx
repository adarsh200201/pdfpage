import { useState } from "react";
import { Link } from "react-router-dom";
import ImgHeader from "@/components/layout/ImgHeader";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Download,
  ImageIcon,
  Minimize2,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Info,
  FileImage,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { imageService } from "@/services/imageService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/auth/AuthModal";

interface ProcessedImage {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  preview: string;
}

const ImgCompress = () => {
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [quality, setQuality] = useState([0.8]);
  const [maxWidth, setMaxWidth] = useState([1920]);
  const [maxHeight, setMaxHeight] = useState([1080]);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleFilesSelect = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];

      if (!imageService.isValidImageFile(file)) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (JPG, PNG, GIF, WebP)",
          variant: "destructive",
        });
        return;
      }

      try {
        const info = await imageService.getImageInfo(file);
        const preview = URL.createObjectURL(file);

        setImage({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          width: info.width,
          height: info.height,
          preview,
        });

        setIsComplete(false);
        setCompressionStats(null);
      } catch (error) {
        toast({
          title: "Error loading image",
          description: "Failed to load the selected image",
          variant: "destructive",
        });
      }
    }
  };

  const handleCompress = async () => {
    if (!image) return;

    setIsProcessing(true);

    try {
      const result = await imageService.compressImage(
        image.file,
        quality[0],
        maxWidth[0],
        maxHeight[0],
      );

      // Create download URL
      const url = URL.createObjectURL(result.file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `compressed_${image.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCompressionStats(result.stats);
      setIsComplete(true);

      toast({
        title: "Image compressed successfully!",
        description: `File size reduced by ${result.stats.compressionRatio}%`,
      });
    } catch (error) {
      toast({
        title: "Compression failed",
        description: "Failed to compress the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setImage(null);
    setIsComplete(false);
    setCompressionStats(null);
    setQuality([0.8]);
    setMaxWidth([1920]);
    setMaxHeight([1080]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ImgHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/img"
            className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to ImgPage
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl w-fit mx-auto mb-4">
            <Minimize2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Compress Image
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Reduce your image file size without compromising quality. Perfect
            for web optimization and faster loading times.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {!image ? (
            <Card>
              <CardContent className="p-8">
                <FileUpload
                  onFilesSelect={handleFilesSelect}
                  acceptedFileTypes={{
                    "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
                  }}
                  maxFiles={1}
                  maxSize={50}
                />

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      High Quality
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Maintain image quality while reducing file size
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <FileImage className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Multiple Formats
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Support for JPG, PNG, WebP, and more
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <Minimize2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Advanced Options
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Control quality, dimensions, and compression level
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Image Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Image Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <img
                        src={image.preview}
                        alt="Preview"
                        className="w-full h-auto rounded-lg border"
                        style={{ maxHeight: "300px", objectFit: "contain" }}
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Filename:
                        </span>
                        <p className="text-gray-900">{image.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Dimensions:
                        </span>
                        <p className="text-gray-900">
                          {image.width} × {image.height} pixels
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          File Size:
                        </span>
                        <p className="text-gray-900">
                          {imageService.formatFileSize(image.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compression Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Compression Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality: {Math.round(quality[0] * 100)}%
                    </label>
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Higher quality = larger file size
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Width: {maxWidth[0]}px
                      </label>
                      <Slider
                        value={maxWidth}
                        onValueChange={setMaxWidth}
                        min={100}
                        max={4000}
                        step={50}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Height: {maxHeight[0]}px
                      </label>
                      <Slider
                        value={maxHeight}
                        onValueChange={setMaxHeight}
                        min={100}
                        max={4000}
                        step={50}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compression Stats */}
              {compressionStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">
                      Compression Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-600">Original Size</p>
                        <p className="text-lg font-semibold text-red-600">
                          {imageService.formatFileSize(
                            compressionStats.originalSize,
                          )}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Compressed Size</p>
                        <p className="text-lg font-semibold text-green-600">
                          {imageService.formatFileSize(
                            compressionStats.compressedSize,
                          )}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Size Reduction</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {compressionStats.compressionRatio}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="flex-1"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Compress & Download
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={resetState}
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  Compress Another Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default ImgCompress;
