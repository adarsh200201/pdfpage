import { useState, useRef, useCallback, useEffect } from "react";
import { ImgHeader } from "../components/layout/ImgHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Progress } from "../components/ui/progress";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { cropImage } from "../services/imageService";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { UsageService } from "../services/usageService";
import {
  Upload,
  Download,
  RotateCw,
  Move,
  Square,
  Smartphone,
  Monitor,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  RefreshCw,
  Lock,
  Unlock,
} from "lucide-react";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AspectRatio {
  label: string;
  value: number | null;
  icon: any;
}

const aspectRatios: AspectRatio[] = [
  { label: "Free", value: null, icon: Move },
  { label: "Square (1:1)", value: 1, icon: Square },
  { label: "Portrait (3:4)", value: 3 / 4, icon: Smartphone },
  { label: "Landscape (4:3)", value: 4 / 3, icon: Monitor },
  { label: "Instagram (1:1)", value: 1, icon: Square },
  { label: "Facebook Cover (16:9)", value: 16 / 9, icon: Monitor },
  { label: "A4 (210:297)", value: 210 / 297, icon: Smartphone },
  { label: "Custom", value: 0, icon: Grid3X3 },
];

export default function ImgCrop() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string>("");
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(
    null,
  );
  const [customAspectRatio, setCustomAspectRatio] = useState({
    width: 16,
    height: 9,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });
  const [imageDisplaySize, setImageDisplaySize] = useState({
    width: 0,
    height: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result);
        setPreviewImage(result);

        // Reset crop settings
        setCropArea({ x: 10, y: 10, width: 80, height: 80 });
        setZoom(100);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    },
    [toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageNaturalSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
      setImageDisplaySize({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight,
      });
    }
  };

  const applyCrop = async () => {
    if (!selectedFile || !canvasRef.current || !imageRef.current) return;

    try {
      setIsProcessing(true);
      setProgress(0);

      const scaleX = imageNaturalSize.width / imageDisplaySize.width;
      const scaleY = imageNaturalSize.height / imageDisplaySize.height;

      const cropData = {
        x: (cropArea.x / 100) * imageDisplaySize.width * scaleX,
        y: (cropArea.y / 100) * imageDisplaySize.height * scaleY,
        width: (cropArea.width / 100) * imageDisplaySize.width * scaleX,
        height: (cropArea.height / 100) * imageDisplaySize.height * scaleY,
        zoom: zoom / 100,
        rotation,
      };

      setProgress(30);

      const croppedBlob = await cropImage(selectedFile, cropData);

      setProgress(70);

      const croppedUrl = URL.createObjectURL(croppedBlob);
      setPreviewImage(croppedUrl);

      setProgress(100);

      if (user) {
        await UsageService.trackUsage("imgCrop", selectedFile.size);
      }

      toast({
        title: "Image cropped successfully!",
        description: "Your image has been cropped and is ready for download.",
      });
    } catch (error) {
      console.error("Error cropping image:", error);
      toast({
        title: "Cropping failed",
        description:
          "An error occurred while cropping the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadCroppedImage = () => {
    if (!previewImage || previewImage === originalImage) return;

    const link = document.createElement("a");
    link.href = previewImage;
    link.download = `cropped-${selectedFile?.name || "image.jpg"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAspectRatioChange = (ratio: number | null) => {
    setSelectedAspectRatio(ratio);
    if (ratio && ratio > 0) {
      const newHeight = cropArea.width / ratio;
      setCropArea((prev) => ({ ...prev, height: newHeight }));
      setLockAspectRatio(true);
    } else {
      setLockAspectRatio(false);
    }
  };

  const handleCustomAspectRatio = () => {
    const ratio = customAspectRatio.width / customAspectRatio.height;
    handleAspectRatioChange(ratio);
  };

  const resetCrop = () => {
    setCropArea({ x: 10, y: 10, width: 80, height: 80 });
    setZoom(100);
    setRotation(0);
    setPreviewImage(originalImage);
    setSelectedAspectRatio(null);
    setLockAspectRatio(false);
  };

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    setDragStart({
      x: e.clientX - (cropArea.x / 100) * imageDisplaySize.width,
      y: e.clientY - (cropArea.y / 100) * imageDisplaySize.height,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const rect = imageRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = ((e.clientX - rect.left) / imageDisplaySize.width) * 100;
      const y = ((e.clientY - rect.top) / imageDisplaySize.height) * 100;

      if (isDragging) {
        setCropArea((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(100 - prev.width, x)),
          y: Math.max(0, Math.min(100 - prev.height, y)),
        }));
      } else if (isResizing) {
        // Handle resize logic based on handle
        setCropArea((prev) => {
          let newArea = { ...prev };

          if (resizeHandle.includes("right")) {
            newArea.width = Math.max(5, Math.min(100 - prev.x, x - prev.x));
          }
          if (resizeHandle.includes("bottom")) {
            newArea.height = Math.max(5, Math.min(100 - prev.y, y - prev.y));
          }

          // Maintain aspect ratio if locked
          if (lockAspectRatio && selectedAspectRatio) {
            if (resizeHandle.includes("right")) {
              newArea.height = newArea.width / selectedAspectRatio;
            } else if (resizeHandle.includes("bottom")) {
              newArea.width = newArea.height * selectedAspectRatio;
            }
          }

          return newArea;
        });
      }
    },
    [
      isDragging,
      isResizing,
      resizeHandle,
      imageDisplaySize,
      lockAspectRatio,
      selectedAspectRatio,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle("");
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <ImgHeader
        title="Crop Image"
        description="Crop and resize your images with precision"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {!selectedFile ? (
                    <div
                      className="border-2 border-dashed border-orange-300 rounded-lg p-12 text-center hover:border-orange-400 transition-colors cursor-pointer"
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Upload Image to Crop
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Drag and drop your image here, or click to select
                      </p>
                      <p className="text-sm text-gray-400">
                        Supports: JPG, PNG, WEBP, BMP, TIFF (Max 10MB)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleFileSelect(e.target.files[0])
                        }
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Image Preview with Crop Area */}
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          ref={imageRef}
                          src={originalImage}
                          alt="Original"
                          className="w-full h-auto max-h-96 object-contain"
                          onLoad={handleImageLoad}
                          style={{
                            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                          }}
                        />

                        {/* Crop Overlay */}
                        {imageDisplaySize.width > 0 && (
                          <div className="absolute inset-0">
                            {/* Grid */}
                            {showGrid && (
                              <div
                                className="absolute border border-white/50"
                                style={{
                                  left: `${cropArea.x}%`,
                                  top: `${cropArea.y}%`,
                                  width: `${cropArea.width}%`,
                                  height: `${cropArea.height}%`,
                                }}
                              >
                                <div className="grid grid-cols-3 grid-rows-3 h-full">
                                  {Array.from({ length: 9 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="border border-white/30"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Crop Area */}
                            <div
                              ref={cropAreaRef}
                              className="absolute border-2 border-orange-500 bg-orange-500/10 cursor-move"
                              style={{
                                left: `${cropArea.x}%`,
                                top: `${cropArea.y}%`,
                                width: `${cropArea.width}%`,
                                height: `${cropArea.height}%`,
                              }}
                              onMouseDown={(e) => handleMouseDown(e)}
                            >
                              {/* Resize Handles */}
                              <div
                                className="absolute -bottom-1 -right-1 w-3 h-3 bg-orange-500 cursor-se-resize"
                                onMouseDown={(e) =>
                                  handleMouseDown(e, "bottom-right")
                                }
                              />
                              <div
                                className="absolute -bottom-1 right-1/2 w-3 h-3 bg-orange-500 cursor-s-resize transform -translate-x-1/2"
                                onMouseDown={(e) =>
                                  handleMouseDown(e, "bottom")
                                }
                              />
                              <div
                                className="absolute bottom-1/2 -right-1 w-3 h-3 bg-orange-500 cursor-e-resize transform -translate-y-1/2"
                                onMouseDown={(e) => handleMouseDown(e, "right")}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={applyCrop}
                          disabled={isProcessing}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Cropping...
                            </>
                          ) : (
                            <>
                              <Crop className="h-4 w-4 mr-2" />
                              Apply Crop
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={resetCrop}
                          disabled={isProcessing}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>

                        <Button
                          variant="outline"
                          onClick={downloadCroppedImage}
                          disabled={previewImage === originalImage}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          New Image
                        </Button>
                      </div>

                      {/* Progress Bar */}
                      {isProcessing && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Processing...</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="w-full" />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              {selectedFile && (
                <>
                  {/* Aspect Ratio */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Aspect Ratio
                      </h3>
                      <div className="space-y-3">
                        {aspectRatios.map((ratio) => (
                          <Button
                            key={ratio.label}
                            variant={
                              selectedAspectRatio === ratio.value
                                ? "default"
                                : "outline"
                            }
                            className="w-full justify-start"
                            onClick={() => handleAspectRatioChange(ratio.value)}
                            disabled={ratio.value === 0}
                          >
                            <ratio.icon className="h-4 w-4 mr-2" />
                            {ratio.label}
                          </Button>
                        ))}

                        {/* Custom Ratio */}
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Width"
                              value={customAspectRatio.width}
                              onChange={(e) =>
                                setCustomAspectRatio((prev) => ({
                                  ...prev,
                                  width: parseInt(e.target.value) || 16,
                                }))
                              }
                              className="flex-1"
                            />
                            <span className="self-center">:</span>
                            <Input
                              type="number"
                              placeholder="Height"
                              value={customAspectRatio.height}
                              onChange={(e) =>
                                setCustomAspectRatio((prev) => ({
                                  ...prev,
                                  height: parseInt(e.target.value) || 9,
                                }))
                              }
                              className="flex-1"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCustomAspectRatio}
                            className="w-full"
                          >
                            Apply Custom Ratio
                          </Button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="lock-ratio"
                            checked={lockAspectRatio}
                            onCheckedChange={setLockAspectRatio}
                          />
                          <Label htmlFor="lock-ratio" className="text-sm">
                            {lockAspectRatio ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                            Lock aspect ratio
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transform Controls */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Transform</h3>
                      <div className="space-y-4">
                        {/* Zoom */}
                        <div>
                          <Label className="text-sm font-medium">
                            Zoom: {zoom}%
                          </Label>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setZoom(Math.max(50, zoom - 10))}
                            >
                              <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Slider
                              value={[zoom]}
                              onValueChange={(value) => setZoom(value[0])}
                              min={50}
                              max={200}
                              step={10}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setZoom(Math.min(200, zoom + 10))}
                            >
                              <ZoomIn className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Rotation */}
                        <div>
                          <Label className="text-sm font-medium">
                            Rotation: {rotation}°
                          </Label>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRotation((rotation - 90) % 360)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Slider
                              value={[rotation]}
                              onValueChange={(value) => setRotation(value[0])}
                              min={0}
                              max={360}
                              step={15}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRotation((rotation + 90) % 360)}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Grid Toggle */}
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-grid"
                            checked={showGrid}
                            onCheckedChange={setShowGrid}
                          />
                          <Label htmlFor="show-grid" className="text-sm">
                            <Grid3X3 className="h-4 w-4 mr-1 inline" />
                            Show grid
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Crop Information */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Crop Info</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Position:</span>
                          <span>
                            {Math.round(cropArea.x)}%, {Math.round(cropArea.y)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>
                            {Math.round(cropArea.width)}% ×{" "}
                            {Math.round(cropArea.height)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Actual Size:</span>
                          <span>
                            {Math.round(
                              (cropArea.width / 100) * imageNaturalSize.width,
                            )}{" "}
                            ×{" "}
                            {Math.round(
                              (cropArea.height / 100) * imageNaturalSize.height,
                            )}
                            px
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
