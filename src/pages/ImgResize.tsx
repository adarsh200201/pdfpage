import { useState } from "react";
import { Link } from "react-router-dom";
import ImgHeader from "@/components/layout/ImgHeader";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Download,
  ImageIcon,
  Move,
  CheckCircle,
  Loader2,
  Link as LinkIcon,
  Maximize2,
} from "lucide-react";
import { imageService } from "@/services/imageService";
import { useToast } from "@/hooks/use-toast";

interface ProcessedImage {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  preview: string;
}

const ImgResize = () => {
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetWidth, setTargetWidth] = useState("");
  const [targetHeight, setTargetHeight] = useState("");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [resizedPreview, setResizedPreview] = useState<string | null>(null);

  const { toast } = useToast();

  // Preset sizes
  const presetSizes = [
    { name: "Instagram Square", width: 1080, height: 1080 },
    { name: "Instagram Story", width: 1080, height: 1920 },
    { name: "Facebook Cover", width: 1640, height: 859 },
    { name: "Twitter Header", width: 1500, height: 500 },
    { name: "LinkedIn Banner", width: 1584, height: 396 },
    { name: "YouTube Thumbnail", width: 1280, height: 720 },
    { name: "HD Wallpaper", width: 1920, height: 1080 },
    { name: "4K Wallpaper", width: 3840, height: 2160 },
  ];

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

        // Set initial target dimensions to current dimensions
        setTargetWidth(info.width.toString());
        setTargetHeight(info.height.toString());
        setResizedPreview(null);
      } catch (error) {
        toast({
          title: "Error loading image",
          description: "Failed to load the selected image",
          variant: "destructive",
        });
      }
    }
  };

  const handleWidthChange = (value: string) => {
    setTargetWidth(value);
    if (maintainAspectRatio && image && value) {
      const aspectRatio = image.width / image.height;
      const newHeight = Math.round(parseInt(value) / aspectRatio);
      setTargetHeight(newHeight.toString());
    }
  };

  const handleHeightChange = (value: string) => {
    setTargetHeight(value);
    if (maintainAspectRatio && image && value) {
      const aspectRatio = image.width / image.height;
      const newWidth = Math.round(parseInt(value) * aspectRatio);
      setTargetWidth(newWidth.toString());
    }
  };

  const handlePresetSelect = (preset: { width: number; height: number }) => {
    setTargetWidth(preset.width.toString());
    setTargetHeight(preset.height.toString());
  };

  const handleResize = async () => {
    if (!image || !targetWidth || !targetHeight) return;

    setIsProcessing(true);

    try {
      const resizedFile = await imageService.resizeImage(
        image.file,
        parseInt(targetWidth),
        parseInt(targetHeight),
        maintainAspectRatio,
      );

      // Create download URL
      const url = URL.createObjectURL(resizedFile);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resized_${image.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Create preview
      setResizedPreview(url);

      toast({
        title: "Image resized successfully!",
        description: `New dimensions: ${targetWidth} × ${targetHeight} pixels`,
      });
    } catch (error) {
      toast({
        title: "Resize failed",
        description: "Failed to resize the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setImage(null);
    setTargetWidth("");
    setTargetHeight("");
    setMaintainAspectRatio(true);
    setResizedPreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ImgHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/img"
            className="flex items-center text-green-600 hover:text-green-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to ImgPage
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-2xl w-fit mx-auto mb-4">
            <Move className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Resize Image
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Change your image dimensions with precision. Perfect for social
            media, web design, and print materials.
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
                  multiple={false}
                  uploadText="Select image file or drop image file here"
                  supportText="Supports JPG, PNG, GIF, WebP formats"
                />

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <Maximize2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Precise Control
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Set exact pixel dimensions or use preset sizes
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <LinkIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Aspect Ratio
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Maintain proportions or create custom ratios
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      High Quality
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Professional scaling algorithms preserve image quality
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
                    Original Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <img
                        src={image.preview}
                        alt="Original"
                        className="w-full h-auto rounded-lg border"
                        style={{ maxHeight: "300px", objectFit: "contain" }}
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Current Dimensions:
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

              {/* Resize Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Resize Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preset Sizes */}
                  <div>
                    <Label className="text-base font-medium">
                      Quick Presets
                    </Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {presetSizes.map((preset, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSelect(preset)}
                          className="text-xs p-2 h-auto"
                        >
                          <div className="text-center">
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-gray-500">
                              {preset.width} × {preset.height}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Dimensions */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="aspect-ratio"
                        checked={maintainAspectRatio}
                        onCheckedChange={setMaintainAspectRatio}
                      />
                      <Label htmlFor="aspect-ratio">
                        Maintain aspect ratio
                      </Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="width">Width (pixels)</Label>
                        <Input
                          id="width"
                          type="number"
                          value={targetWidth}
                          onChange={(e) => handleWidthChange(e.target.value)}
                          placeholder="Width"
                          min="1"
                          max="10000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Height (pixels)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={targetHeight}
                          onChange={(e) => handleHeightChange(e.target.value)}
                          placeholder="Height"
                          min="1"
                          max="10000"
                        />
                      </div>
                    </div>

                    {targetWidth && targetHeight && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>New dimensions:</strong> {targetWidth} ×{" "}
                          {targetHeight} pixels
                        </p>
                        {image && (
                          <p className="text-sm text-blue-600 mt-1">
                            Scale factor:{" "}
                            {(
                              (parseInt(targetWidth) / image.width) *
                              100
                            ).toFixed(1)}
                            % width,{" "}
                            {(
                              (parseInt(targetHeight) / image.height) *
                              100
                            ).toFixed(1)}
                            % height
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resized Preview */}
              {resizedPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">
                      Resized Image Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={resizedPreview}
                      alt="Resized"
                      className="w-full h-auto rounded-lg border"
                      style={{ maxHeight: "400px", objectFit: "contain" }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleResize}
                  disabled={
                    isProcessing || !targetWidth || !targetHeight || !image
                  }
                  className="flex-1"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resizing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Resize & Download
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={resetState}
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  Resize Another Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImgResize;
