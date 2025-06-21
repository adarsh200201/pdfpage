import { useState } from "react";
import { Link } from "react-router-dom";
import ImgHeader from "@/components/layout/ImgHeader";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Download,
  ImageIcon,
  Droplets,
  CheckCircle,
  Loader2,
  Type,
  Palette,
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

const ImgWatermark = () => {
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermarkText, setWatermarkText] = useState("© Your Name");
  const [fontSize, setFontSize] = useState([48]);
  const [opacity, setOpacity] = useState([0.5]);
  const [textColor, setTextColor] = useState("#ffffff");
  const [position, setPosition] = useState("center");
  const [watermarkedPreview, setWatermarkedPreview] = useState<string | null>(
    null,
  );

  const { toast } = useToast();

  const positionOptions = [
    { value: "center", label: "Center" },
    { value: "top-left", label: "Top Left" },
    { value: "top-right", label: "Top Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "bottom-right", label: "Bottom Right" },
  ];

  const colorPresets = [
    { name: "White", value: "#ffffff" },
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#ff0000" },
    { name: "Blue", value: "#0000ff" },
    { name: "Yellow", value: "#ffff00" },
    { name: "Green", value: "#00ff00" },
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

        setWatermarkedPreview(null);
      } catch (error) {
        toast({
          title: "Error loading image",
          description: "Failed to load the selected image",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddWatermark = async () => {
    if (!image || !watermarkText.trim()) return;

    setIsProcessing(true);

    try {
      const watermarkedFile = await imageService.addTextWatermark(
        image.file,
        watermarkText,
        {
          fontSize: fontSize[0],
          color: textColor,
          opacity: opacity[0],
          position: position as any,
        },
      );

      // Create download URL
      const url = URL.createObjectURL(watermarkedFile);
      const link = document.createElement("a");
      link.href = url;
      link.download = `watermarked_${image.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Create preview
      setWatermarkedPreview(url);

      toast({
        title: "Watermark added successfully!",
        description: "Your watermarked image has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Watermark failed",
        description: "Failed to add watermark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setImage(null);
    setWatermarkText("© Your Name");
    setFontSize([48]);
    setOpacity([0.5]);
    setTextColor("#ffffff");
    setPosition("center");
    setWatermarkedPreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ImgHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/img"
            className="flex items-center text-cyan-600 hover:text-cyan-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to ImgPage
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 rounded-2xl w-fit mx-auto mb-4">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Add Watermark
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Protect your images with custom text watermarks. Perfect for
            photographers, artists, and content creators.
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
                    <Type className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">Custom Text</h3>
                    <p className="text-gray-600 text-sm">
                      Add your own text with custom styling
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <Palette className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Style Control
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Adjust size, color, opacity, and position
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Copyright Protection
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Protect your work from unauthorized use
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

              {/* Watermark Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Watermark Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Watermark Text */}
                  <div>
                    <Label htmlFor="watermark-text">Watermark Text</Label>
                    <Input
                      id="watermark-text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter your watermark text"
                      className="mt-1"
                    />
                  </div>

                  {/* Font Size */}
                  <div>
                    <Label className="block mb-2">
                      Font Size: {fontSize[0]}px
                    </Label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      min={12}
                      max={120}
                      step={4}
                      className="w-full"
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <Label className="block mb-2">
                      Opacity: {Math.round(opacity[0] * 100)}%
                    </Label>
                    <Slider
                      value={opacity}
                      onValueChange={setOpacity}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>

                  {/* Text Color */}
                  <div>
                    <Label className="block mb-2">Text Color</Label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 h-12 rounded border"
                      />
                      <div className="flex flex-wrap gap-2">
                        {colorPresets.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setTextColor(color.value)}
                            className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500"
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <Label className="block mb-2">Position</Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {positionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preview Settings */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Preview:</h4>
                    <div
                      className="inline-block px-4 py-2 rounded"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.1)",
                        fontSize: `${Math.min(fontSize[0], 24)}px`,
                        color: textColor,
                        opacity: opacity[0],
                      }}
                    >
                      {watermarkText || "Preview text"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Watermarked Preview */}
              {watermarkedPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">
                      Watermarked Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={watermarkedPreview}
                      alt="Watermarked"
                      className="w-full h-auto rounded-lg border"
                      style={{ maxHeight: "400px", objectFit: "contain" }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleAddWatermark}
                  disabled={isProcessing || !watermarkText.trim() || !image}
                  className="flex-1"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Watermark...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Add Watermark & Download
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={resetState}
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  Watermark Another Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImgWatermark;
