import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import ImgHeader from "../components/layout/ImgHeader";
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
import { CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { imageService } from "../services/imageService";
import { useToast } from "../hooks/use-toast";
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
  Sparkles,
  Brain,
  Zap,
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  Clock,
  Share,
  Save,
  Eye,
  Activity,
  Scissors,
  Image as ImageIcon,
  Camera,
  Circle,
  Lock,
  Unlock,
  ArrowLeft,
} from "lucide-react";

interface CropSettings {
  aspectRatio: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  quality: number;
  format: "jpeg" | "png" | "webp";
}

interface CropPreset {
  id: string;
  name: string;
  description: string;
  ratio: number | null;
  icon: any;
  category: string;
  dimensions?: { width: number; height: number };
}

interface CropMetrics {
  processingTime: number;
  originalSize: number;
  croppedSize: number;
  compressionRatio: number;
  qualityScore: number;
}

const ImgCrop = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [metrics, setMetrics] = useState<CropMetrics | null>(null);
  const [cropHistory, setCropHistory] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("free");
  const [isDragging, setIsDragging] = useState(false);
  const [cropperReady, setCropperReady] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  const [settings, setSettings] = useState<CropSettings>({
    aspectRatio: "free",
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    quality: 85,
    format: "jpeg",
  });

  const cropPresets: CropPreset[] = [
    {
      id: "free",
      name: "Free Form",
      description: "No aspect ratio constraint",
      ratio: null,
      icon: Move,
      category: "Basic",
    },
    {
      id: "square",
      name: "Square",
      description: "Perfect for social media profiles",
      ratio: 1,
      icon: Square,
      category: "Social",
      dimensions: { width: 1080, height: 1080 },
    },
    {
      id: "instagram-story",
      name: "Instagram Story",
      description: "Perfect for Instagram stories",
      ratio: 9 / 16,
      icon: Smartphone,
      category: "Social",
      dimensions: { width: 1080, height: 1920 },
    },
    {
      id: "youtube-thumbnail",
      name: "YouTube Thumbnail",
      description: "YouTube video thumbnail",
      ratio: 16 / 9,
      icon: Camera,
      category: "Video",
      dimensions: { width: 1280, height: 720 },
    },
    {
      id: "facebook-cover",
      name: "Facebook Cover",
      description: "Facebook page cover photo",
      ratio: 851 / 315,
      icon: Monitor,
      category: "Social",
      dimensions: { width: 1640, height: 856 },
    },
    {
      id: "4-3",
      name: "Standard 4:3",
      description: "Classic photo format",
      ratio: 4 / 3,
      icon: ImageIcon,
      category: "Basic",
    },
    {
      id: "3-2",
      name: "Photo 3:2",
      description: "Standard photo aspect ratio",
      ratio: 3 / 2,
      icon: Camera,
      category: "Basic",
    },
    {
      id: "passport",
      name: "Passport Photo",
      description: "Standard passport photo",
      ratio: 35 / 45,
      icon: Circle,
      category: "Document",
      dimensions: { width: 413, height: 531 },
    },
  ];

  const handleFileSelect = useCallback(
    (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setIsComplete(false);
      setCroppedPreviewUrl("");
      setCropperReady(false);
    },
    [toast],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        handleFileSelect(imageFiles[0]);
      } else {
        toast({
          title: "Invalid file",
          description: "Please drop an image file.",
          variant: "destructive",
        });
      }
    },
    [handleFileSelect, toast],
  );

  const getCropper = () => {
    return cropperRef.current?.cropper;
  };

  const getCropData = useCallback(() => {
    const cropper = getCropper();
    if (!cropper) return null;

    try {
      const cropBoxData = cropper.getCropBoxData();
      const canvasData = cropper.getCanvasData();
      const imageData = cropper.getImageData();

      // Calculate crop coordinates relative to the original image
      const scaleX = imageData.naturalWidth / imageData.width;
      const scaleY = imageData.naturalHeight / imageData.height;

      const x = Math.max(
        0,
        Math.round((cropBoxData.left - canvasData.left) * scaleX),
      );
      const y = Math.max(
        0,
        Math.round((cropBoxData.top - canvasData.top) * scaleY),
      );
      const width = Math.round(cropBoxData.width * scaleX);
      const height = Math.round(cropBoxData.height * scaleY);

      return { x, y, width, height };
    } catch (error) {
      console.error("Error getting crop data:", error);
      return null;
    }
  }, []);

  const handlePresetSelect = (presetId: string) => {
    const preset = cropPresets.find((p) => p.id === presetId);
    if (!preset) return;

    const cropper = getCropper();

    setSelectedPreset(presetId);
    setSettings((prev) => ({
      ...prev,
      aspectRatio: preset.id,
      width: preset.dimensions?.width || prev.width,
      height: preset.dimensions?.height || prev.height,
    }));

    if (cropper) {
      if (preset.ratio !== null) {
        cropper.setAspectRatio(preset.ratio);
        setAspectRatioLocked(true);
      } else {
        cropper.setAspectRatio(NaN);
        setAspectRatioLocked(false);
      }
    }

    toast({
      title: "Preset Applied",
      description: `${preset.name} settings have been applied.`,
    });
  };

  const handleCrop = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to crop.",
        variant: "destructive",
      });
      return;
    }

    const cropData = getCropData();
    if (!cropData) {
      toast({
        title: "Invalid crop area",
        description: "Please select a valid crop area.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const startTime = Date.now();

      // Prepare crop parameters - only include rotation if it's not 0
      const normalizedRotation = settings.rotation % 360;
      const cropParams = {
        ...cropData,
        ...(normalizedRotation !== 0 && { rotation: normalizedRotation }),
        ...(settings.flipHorizontal && { flipHorizontal: true }),
        ...(settings.flipVertical && { flipVertical: true }),
        quality: settings.quality,
        format: settings.format,
      };

      console.log("Crop parameters:", cropParams);

      // Process image with backend
      const result = await imageService.cropImage(selectedFile, cropParams);

      const endTime = Date.now();

      // Calculate metrics
      const newMetrics: CropMetrics = {
        processingTime: endTime - startTime,
        originalSize: selectedFile.size,
        croppedSize: result.size,
        compressionRatio: result.size / selectedFile.size,
        qualityScore: settings.quality,
      };

      setMetrics(newMetrics);

      clearInterval(progressInterval);
      setProgress(100);

      // Create cropped preview URL
      const croppedUrl = URL.createObjectURL(result);
      setCroppedPreviewUrl(croppedUrl);

      // Add to history
      const historyEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        originalName: selectedFile.name,
        preset: selectedPreset || "Custom",
        metrics: newMetrics,
        settings: { ...settings },
      };

      setCropHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);

      // Download the result
      const link = document.createElement("a");
      link.href = croppedUrl;
      link.download = result.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsComplete(true);

      toast({
        title: "Success!",
        description: "Image cropped successfully and downloaded.",
      });
    } catch (error) {
      console.error("Crop failed:", error);
      toast({
        title: "Crop failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error cropping your image.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = (degrees: number) => {
    const cropper = getCropper();
    if (cropper) {
      cropper.rotate(degrees);
    }
    setSettings((prev) => ({
      ...prev,
      rotation: (prev.rotation + degrees) % 360,
    }));
  };

  const handleFlip = (direction: "horizontal" | "vertical") => {
    const cropper = getCropper();
    if (cropper) {
      if (direction === "horizontal") {
        cropper.scaleX(settings.flipHorizontal ? 1 : -1);
      } else {
        cropper.scaleY(settings.flipVertical ? 1 : -1);
      }
    }

    if (direction === "horizontal") {
      setSettings((prev) => ({
        ...prev,
        flipHorizontal: !prev.flipHorizontal,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        flipVertical: !prev.flipVertical,
      }));
    }
  };

  const handleZoom = (delta: number) => {
    const cropper = getCropper();
    if (cropper) {
      cropper.zoom(delta);
    }
  };

  const handleReset = () => {
    const cropper = getCropper();
    if (cropper) {
      cropper.reset();
    }

    setSettings({
      aspectRatio: "free",
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      quality: 85,
      format: "jpeg",
    });
    setSelectedPreset("free");
    setCroppedPreviewUrl("");
    setIsComplete(false);
    setAspectRatioLocked(false);

    toast({
      title: "Reset complete",
      description: "Crop settings have been reset.",
    });
  };

  const onCropperReady = () => {
    setCropperReady(true);
    console.log("Cropper is ready");
  };

  const onCrop = () => {
    const cropData = getCropData();
    if (cropData) {
      setSettings((prev) => ({
        ...prev,
        x: cropData.x,
        y: cropData.y,
        width: cropData.width,
        height: cropData.height,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-violet-100">
      <ImgHeader />

      {/* Enhanced Header Section */}
      <div className="relative pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-violet-700 opacity-90"></div>
        <div
          className={
            'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0l8 8-8 8V8h-4v26h4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] animate-pulse'
          }
        ></div>

        <div className="relative container mx-auto px-6 py-20 hidden sm:block">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Scissors className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-4">
                  Professional Image Cropper
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Crop and resize images with precision using our interactive
                  cropping tool with real-time preview, zoom, rotate, and flip.
                </p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                {
                  icon: Brain,
                  label: "Interactive Cropping",
                  color: "bg-white/20",
                },
                { icon: Sparkles, label: "Live Preview", color: "bg-white/20" },
                {
                  icon: Target,
                  label: "Precision Tools",
                  color: "bg-white/20",
                },
                { icon: Zap, label: "Fast Processing", color: "bg-white/20" },
                {
                  icon: Camera,
                  label: "Professional Presets",
                  color: "bg-white/20",
                },
                {
                  icon: Activity,
                  label: "Live Analytics",
                  color: "bg-white/20",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`${feature.color} backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-white/90 border border-white/20`}
                >
                  <feature.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <Link
            to="/img"
            className="flex items-center text-purple-600 hover:text-purple-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to PdfPage
          </Link>
        </div>

        {!selectedFile ? (
          <div className="space-y-8">
            {/* Mobile-First Upload Section - TOP PRIORITY */}
            <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  Upload Image
                </CardTitle>
                <CardDescription>
                  Select an image to crop (JPG, PNG, WebP up to 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center hover:border-purple-400 transition-colors cursor-pointer ${
                    isDragging
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-300"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-base sm:text-lg font-medium text-gray-700">
                        {isDragging
                          ? "Drop your image here"
                          : "Click to upload or drag & drop"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Support for JPG, PNG, WebP formats
                      </p>
                    </div>
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

            {/* Tool Description - Only shown before upload */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl w-fit mx-auto mb-4">
                <Scissors className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Crop Image
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Crop and resize images with precision using our interactive
                cropping tool with real-time preview, zoom, rotate, and flip.
              </p>
            </div>

            {/* Features - Only shown before upload */}
            <Card>
              <CardContent className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Precision Tools
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Exact crop positioning and sizing
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Live Preview
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Real-time crop preview
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <Grid3X3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Smart Presets
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Platform-optimized ratios
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Info */}
            <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl("");
                      setCropperReady(false);
                    }}
                  >
                    Change Image
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Crop Presets - Shown after upload */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-purple-600" />
                  Crop Presets
                </CardTitle>
                <CardDescription>
                  Choose from optimized crop ratios for different platforms and
                  use cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
                  {cropPresets.map((preset) => (
                    <Card
                      key={preset.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                        selectedPreset === preset.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                      onClick={() => handlePresetSelect(preset.id)}
                    >
                      <CardContent className="p-2 sm:p-3 text-center">
                        <preset.icon className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-purple-600" />
                        <h3 className="font-semibold text-xs mb-1">
                          {preset.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-1">
                          {preset.ratio
                            ? `${preset.ratio.toFixed(2)}:1`
                            : "Free"}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {preset.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Crop Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Preview & Crop Area */}
            {previewUrl && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <span className="hidden sm:inline">
                        Interactive Crop Editor
                      </span>
                      <span className="sm:hidden">Crop Editor</span>
                      {cropperReady && (
                        <Badge variant="outline" className="ml-2">
                          Ready
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleZoom(0.1)}
                        disabled={!cropperReady}
                        className="flex-shrink-0"
                      >
                        <ZoomIn className="w-4 h-4" />
                        <span className="ml-1 hidden sm:inline">In</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleZoom(-0.1)}
                        disabled={!cropperReady}
                        className="flex-shrink-0"
                      >
                        <ZoomOut className="w-4 h-4" />
                        <span className="ml-1 hidden sm:inline">Out</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGrid(!showGrid)}
                        className="flex-shrink-0"
                      >
                        <Grid3X3 className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Grid</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                        className="flex-shrink-0"
                      >
                        {aspectRatioLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                        <span className="ml-1 hidden sm:inline">Lock</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <Cropper
                      ref={cropperRef}
                      src={previewUrl}
                      style={{ height: 400, width: "100%" }}
                      aspectRatio={
                        selectedPreset === "free"
                          ? NaN
                          : cropPresets.find((p) => p.id === selectedPreset)
                              ?.ratio || NaN
                      }
                      guides={showGrid}
                      background={false}
                      rotatable={true}
                      scalable={true}
                      zoomable={true}
                      viewMode={1}
                      dragMode="move"
                      minCropBoxHeight={10}
                      minCropBoxWidth={10}
                      autoCropArea={0.8}
                      checkOrientation={false}
                      responsive={true}
                      restore={false}
                      checkCrossOrigin={false}
                      cropBoxMovable={true}
                      cropBoxResizable={true}
                      toggleDragModeOnDblclick={false}
                      ready={onCropperReady}
                      crop={onCrop}
                    />
                  </div>

                  {/* Transform Controls */}
                  <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotate(-90)}
                      disabled={!cropperReady}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      -90°
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotate(90)}
                      disabled={!cropperReady}
                    >
                      <RotateCw className="w-4 h-4 mr-1" />
                      +90°
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFlip("horizontal")}
                      disabled={!cropperReady}
                    >
                      <FlipHorizontal className="w-4 h-4 mr-1" />
                      Flip H
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFlip("vertical")}
                      disabled={!cropperReady}
                    >
                      <FlipVertical className="w-4 h-4 mr-1" />
                      Flip V
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={!cropperReady}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  </div>

                  {/* Current crop info */}
                  {cropperReady && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-gray-600">X</Label>
                          <p className="font-semibold">{settings.x}px</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Y</Label>
                          <p className="font-semibold">{settings.y}px</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Width</Label>
                          <p className="font-semibold">{settings.width}px</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">
                            Height
                          </Label>
                          <p className="font-semibold">{settings.height}px</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Crop Settings */}
            {previewUrl && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-600" />
                      Output Settings
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Output Format
                      </Label>
                      <Select
                        value={settings.format}
                        onValueChange={(value: any) =>
                          setSettings((prev) => ({ ...prev, format: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="webp">WebP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Quality: {settings.quality}%
                      </Label>
                      <Slider
                        value={[settings.quality]}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            quality: value[0],
                          }))
                        }
                        max={100}
                        min={10}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Crop Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleCrop}
                      disabled={isProcessing || !selectedFile || !cropperReady}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Processing Image...
                        </>
                      ) : (
                        <>
                          <Crop className="w-5 h-5 mr-2" />
                          Crop & Download Image
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing image...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Success State */}
                  {isComplete && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="flex items-center gap-2 text-green-800">
                        <Download className="w-4 h-4" />
                        Image cropped successfully! Download started
                        automatically.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            {/* Real-time Statistics */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Crop Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700">
                          {(metrics.processingTime / 1000).toFixed(1)}s
                        </div>
                        <div className="text-xs text-purple-600">
                          Processing Time
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">
                          {metrics.qualityScore}%
                        </div>
                        <div className="text-xs text-blue-600">Quality</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Original Size</span>
                        <span className="font-medium">
                          {(metrics.originalSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cropped Size</span>
                        <span className="font-medium">
                          {(metrics.croppedSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Size Reduction</span>
                        <span className="font-medium text-green-600">
                          {((1 - metrics.compressionRatio) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Analytics will appear after cropping
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Crop History */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Recent Crops
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cropHistory.length > 0 ? (
                  <div className="space-y-3">
                    {cropHistory.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {entry.preset}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {entry.originalName}
                        </p>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>
                            {(entry.metrics.processingTime / 1000).toFixed(1)}s
                          </span>
                          <span>{entry.metrics.qualityScore}% quality</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No crops yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-yellow-800 text-sm">
                    Interactive Cropping
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    Drag corners to resize, click and drag inside to move the
                    crop area.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 text-sm">
                    Zoom & Pan
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Use zoom buttons or mouse wheel. Drag to pan around the
                    image.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-800 text-sm">
                    Quality Settings
                  </h3>
                  <p className="text-xs text-green-700 mt-1">
                    Higher quality = larger file size. Use 85%+ for best
                    results.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImgCrop;
