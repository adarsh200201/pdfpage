import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import ImgHeader from "@/components/layout/ImgHeader";
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
  Type,
  Palette,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ImgWatermark = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [watermarkText, setWatermarkText] = useState("© Your Watermark");
  const [fontSize, setFontSize] = useState([40]);
  const [opacity, setOpacity] = useState([50]);
  const [textColor, setTextColor] = useState("#ffffff");
  const [position, setPosition] = useState("bottom-right");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const positionOptions = [
    { value: "top-left", label: "Top Left" },
    { value: "top-center", label: "Top Center" },
    { value: "top-right", label: "Top Right" },
    { value: "center-left", label: "Center Left" },
    { value: "center", label: "Center" },
    { value: "center-right", label: "Center Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "bottom-center", label: "Bottom Center" },
    { value: "bottom-right", label: "Bottom Right" },
  ];

  const colorPresets = [
    "#ffffff",
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#ffa500",
    "#800080",
  ];

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 20MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    },
    [toast],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const getPositionCoordinates = (
    canvasWidth: number,
    canvasHeight: number,
    textWidth: number,
    textHeight: number,
  ) => {
    const padding = 30;

    switch (position) {
      case "top-left":
        return { x: padding, y: padding + textHeight };
      case "top-center":
        return { x: canvasWidth / 2, y: padding + textHeight };
      case "top-right":
        return { x: canvasWidth - padding, y: padding + textHeight };
      case "center-left":
        return { x: padding, y: canvasHeight / 2 };
      case "center":
        return { x: canvasWidth / 2, y: canvasHeight / 2 };
      case "center-right":
        return { x: canvasWidth - padding, y: canvasHeight / 2 };
      case "bottom-left":
        return { x: padding, y: canvasHeight - padding };
      case "bottom-center":
        return { x: canvasWidth / 2, y: canvasHeight - padding };
      case "bottom-right":
        return { x: canvasWidth - padding, y: canvasHeight - padding };
      default:
        return { x: canvasWidth - padding, y: canvasHeight - padding };
    }
  };

  const generateWatermark = useCallback(() => {
    if (!selectedFile || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Set up text styling
        const fontSizePx = Math.max(12, Math.min(fontSize[0], img.width / 10));
        ctx.font = `${fontSizePx}px Arial, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = opacity[0] / 100;

        // Measure text
        const metrics = ctx.measureText(watermarkText);
        const textWidth = metrics.width;
        const textHeight = fontSizePx;

        // Get position coordinates
        const { x, y } = getPositionCoordinates(
          canvas.width,
          canvas.height,
          textWidth,
          textHeight,
        );

        // Set text alignment based on position
        if (position.includes("center")) {
          ctx.textAlign = "center";
        } else if (position.includes("right")) {
          ctx.textAlign = "right";
        } else {
          ctx.textAlign = "left";
        }
        ctx.textBaseline = "middle";

        // Add text shadow for better visibility
        ctx.shadowColor = textColor === "#ffffff" ? "#000000" : "#ffffff";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Draw the watermark text
        ctx.fillText(watermarkText, x, y);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to generate watermark"));
          }
        }, "image/png");
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = previewUrl;
    });
  }, [
    selectedFile,
    previewUrl,
    watermarkText,
    fontSize,
    opacity,
    textColor,
    position,
  ]);

  const handleDownload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const blob = await generateWatermark();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `watermarked_${selectedFile.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Success!",
          description: "Watermarked image downloaded successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate watermark",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ImgHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/img"
            className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Image Tools
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl w-fit mx-auto mb-4">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Add Watermark to Image
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Protect your images with custom text watermarks. Add copyright
            notice, branding, or any text to your images.
          </p>
        </div>

        {!selectedFile ? (
          /* Upload Area */
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    {isDragging ? (
                      <Droplets className="w-8 h-8 text-blue-600" />
                    ) : (
                      <Upload className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {isDragging ? "Drop your image here" : "Select an image"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      or drag and drop it here
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Choose Image
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Supports JPG, PNG, WebP up to 20MB
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </CardContent>
          </Card>
        ) : (
          /* Watermark Editor */
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Preview
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={resetImage}>
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                    {/* Watermark Preview Overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none flex"
                      style={{
                        alignItems: position.includes("top")
                          ? "flex-start"
                          : position.includes("bottom")
                            ? "flex-end"
                            : "center",
                        justifyContent: position.includes("left")
                          ? "flex-start"
                          : position.includes("right")
                            ? "flex-end"
                            : "center",
                        padding: "30px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: `${Math.min(fontSize[0], 32)}px`,
                          color: textColor,
                          opacity: opacity[0] / 100,
                          textShadow:
                            textColor === "#ffffff"
                              ? "1px 1px 2px #000000"
                              : "1px 1px 2px #ffffff",
                          fontFamily: "Arial, sans-serif",
                          fontWeight: "bold",
                        }}
                      >
                        {watermarkText}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>
                      <strong>File:</strong> {selectedFile.name}
                    </p>
                    <p>
                      <strong>Size:</strong>{" "}
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Type className="w-5 h-5 mr-2" />
                    Watermark Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Watermark Text */}
                  <div>
                    <Label
                      htmlFor="watermark-text"
                      className="text-sm font-medium"
                    >
                      Watermark Text
                    </Label>
                    <Input
                      id="watermark-text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter your watermark text"
                      className="mt-2"
                    />
                  </div>

                  {/* Font Size */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Font Size: {fontSize[0]}px
                    </Label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      min={12}
                      max={100}
                      step={2}
                      className="mt-2"
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Opacity: {opacity[0]}%
                    </Label>
                    <Slider
                      value={opacity}
                      onValueChange={setOpacity}
                      min={10}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  {/* Text Color */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Text Color
                    </Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 h-12 rounded border cursor-pointer"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            onClick={() => setTextColor(color)}
                            className={`w-8 h-8 rounded border-2 ${
                              textColor === color
                                ? "border-blue-500"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Position
                    </Label>
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

                  {/* Download Button */}
                  <Button
                    onClick={handleDownload}
                    disabled={isProcessing || !watermarkText.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      "Processing..."
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Watermarked Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ImgWatermark;
