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
  RotateCw,
  CheckCircle,
  Loader2,
  RotateCcw,
  Rotate3d,
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

const ImgRotate = () => {
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotationAngle, setRotationAngle] = useState([0]);
  const [rotatedPreview, setRotatedPreview] = useState<string | null>(null);

  const { toast } = useToast();

  const quickRotationOptions = [
    { label: "90° CW", angle: 90, icon: RotateCw },
    { label: "180°", angle: 180, icon: Rotate3d },
    { label: "270° CW", angle: 270, icon: RotateCw },
    { label: "90° CCW", angle: -90, icon: RotateCcw },
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

        setRotationAngle([0]);
        setRotatedPreview(null);
      } catch (error) {
        toast({
          title: "Error loading image",
          description: "Failed to load the selected image",
          variant: "destructive",
        });
      }
    }
  };

  const handleQuickRotation = (angle: number) => {
    setRotationAngle([angle]);
    generatePreview(angle);
  };

  const generatePreview = async (angle: number) => {
    if (!image || angle === 0) {
      setRotatedPreview(null);
      return;
    }

    try {
      const rotatedFile = await imageService.rotateImage(image.file, angle);
      const preview = URL.createObjectURL(rotatedFile);
      setRotatedPreview(preview);
    } catch (error) {
      console.error("Failed to generate preview:", error);
    }
  };

  const handleRotate = async () => {
    if (!image || rotationAngle[0] === 0) return;

    setIsProcessing(true);

    try {
      const rotatedFile = await imageService.rotateImage(
        image.file,
        rotationAngle[0],
      );

      // Create download URL
      const url = URL.createObjectURL(rotatedFile);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rotated_${image.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update preview
      setRotatedPreview(url);

      toast({
        title: "Image rotated successfully!",
        description: `Rotated by ${rotationAngle[0]}°`,
      });
    } catch (error) {
      toast({
        title: "Rotation failed",
        description: "Failed to rotate the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setImage(null);
    setRotationAngle([0]);
    setRotatedPreview(null);
  };

  const handleAngleChange = (angle: number[]) => {
    setRotationAngle(angle);
    generatePreview(angle[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ImgHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/img"
            className="flex items-center text-orange-600 hover:text-orange-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to ImgPage
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-2xl w-fit mx-auto mb-4">
            <RotateCw className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Rotate Image
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Rotate your images by any angle. Fix orientation issues or create
            artistic effects with precise angle control.
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
                    <RotateCw className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Quick Rotation
                    </h3>
                    <p className="text-gray-600 text-sm">
                      90°, 180°, 270° rotation with one click
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <Rotate3d className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Custom Angle
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Rotate to any angle from -180° to 180°
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Live Preview
                    </h3>
                    <p className="text-gray-600 text-sm">
                      See your rotation in real-time before downloading
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
                    {/* Original Image */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">
                        Original
                      </h4>
                      <img
                        src={image.preview}
                        alt="Original"
                        className="w-full h-auto rounded-lg border"
                        style={{ maxHeight: "300px", objectFit: "contain" }}
                      />
                    </div>

                    {/* Rotated Preview */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">
                        Rotated Preview ({rotationAngle[0]}°)
                      </h4>
                      <div className="w-full h-full min-h-[200px] border rounded-lg flex items-center justify-center bg-gray-50">
                        {rotatedPreview ? (
                          <img
                            src={rotatedPreview}
                            alt="Rotated"
                            className="max-w-full max-h-[300px] rounded"
                            style={{ objectFit: "contain" }}
                          />
                        ) : (
                          <div className="text-center text-gray-500">
                            <RotateCw className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">
                              {rotationAngle[0] === 0
                                ? "Adjust angle to see preview"
                                : "Generating preview..."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rotation Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Rotation Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quick Rotation Buttons */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Quick Rotation
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {quickRotationOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <Button
                            key={option.angle}
                            variant="outline"
                            onClick={() => handleQuickRotation(option.angle)}
                            className="h-auto p-4"
                          >
                            <div className="text-center">
                              <IconComponent className="w-6 h-6 mx-auto mb-1" />
                              <div className="text-sm font-medium">
                                {option.label}
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Angle Slider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Angle: {rotationAngle[0]}°
                    </label>
                    <Slider
                      value={rotationAngle}
                      onValueChange={handleAngleChange}
                      min={-180}
                      max={180}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-180°</span>
                      <span>0°</span>
                      <span>180°</span>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRotationAngle([0]);
                        setRotatedPreview(null);
                      }}
                      disabled={rotationAngle[0] === 0}
                    >
                      Reset to 0°
                    </Button>
                  </div>

                  {/* Image Info */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Image Information
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Original Dimensions:</strong> {image.width} ×{" "}
                        {image.height} pixels
                      </p>
                      <p>
                        <strong>File Size:</strong>{" "}
                        {imageService.formatFileSize(image.size)}
                      </p>
                      <p>
                        <strong>Rotation:</strong> {rotationAngle[0]}°
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleRotate}
                  disabled={isProcessing || rotationAngle[0] === 0 || !image}
                  className="flex-1"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rotating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Rotate & Download
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={resetState}
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  Rotate Another Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImgRotate;
