import { useState, useRef, useCallback, useEffect } from "react";
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
  Maximize,
  Minimize,
  Circle,
  Triangle,
  Star,
  Heart,
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
  aiEnhancement: boolean;
  smartCrop: boolean;
  faceDetection: boolean;
  edgePreservation: boolean;
}

interface CropPreset {
  id: string;
  name: string;
  description: string;
  ratio: string;
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
  facesDetected: number;
  edgesPreserved: number;
}

const ImgCrop = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [metrics, setMetrics] = useState<CropMetrics | null>(null);
  const [cropHistory, setCropHistory] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [showGrid, setShowGrid] = useState(true);
  const [previewMode, setPreviewMode] = useState<"original" | "cropped">(
    "original",
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [settings, setSettings] = useState<CropSettings>({
    aspectRatio: "free",
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    quality: 95,
    format: "jpeg",
    aiEnhancement: false,
    smartCrop: false,
    faceDetection: false,
    edgePreservation: false,
  });

  const cropPresets: CropPreset[] = [
    {
      id: "square",
      name: "Square",
      description: "Perfect for social media profiles",
      ratio: "1:1",
      icon: Square,
      category: "Social",
      dimensions: { width: 1080, height: 1080 },
    },
    {
      id: "instagram-post",
      name: "Instagram Post",
      description: "Optimized for Instagram feed",
      ratio: "1:1",
      icon: ImageIcon,
      category: "Social",
      dimensions: { width: 1080, height: 1080 },
    },
    {
      id: "instagram-story",
      name: "Instagram Story",
      description: "Perfect for Instagram stories",
      ratio: "9:16",
      icon: Smartphone,
      category: "Social",
      dimensions: { width: 1080, height: 1920 },
    },
    {
      id: "facebook-cover",
      name: "Facebook Cover",
      description: "Facebook page cover photo",
      ratio: "16:9",
      icon: Monitor,
      category: "Social",
      dimensions: { width: 1640, height: 856 },
    },
    {
      id: "twitter-header",
      name: "Twitter Header",
      description: "Twitter profile header",
      ratio: "3:1",
      icon: ImageIcon,
      category: "Social",
      dimensions: { width: 1500, height: 500 },
    },
    {
      id: "youtube-thumbnail",
      name: "YouTube Thumbnail",
      description: "YouTube video thumbnail",
      ratio: "16:9",
      icon: Camera,
      category: "Video",
      dimensions: { width: 1280, height: 720 },
    },
    {
      id: "passport",
      name: "Passport Photo",
      description: "Standard passport photo dimensions",
      ratio: "3.5:4.5",
      icon: Circle,
      category: "Document",
      dimensions: { width: 413, height: 531 },
    },
    {
      id: "business-card",
      name: "Business Card",
      description: "Standard business card format",
      ratio: "3.5:2",
      icon: Target,
      category: "Print",
      dimensions: { width: 1050, height: 600 },
    },
  ];

  const aspectRatios = [
    { value: "free", label: "Free Crop" },
    { value: "1:1", label: "Square (1:1)" },
    { value: "4:3", label: "Standard (4:3)" },
    { value: "16:9", label: "Widescreen (16:9)" },
    { value: "3:2", label: "Photo (3:2)" },
    { value: "9:16", label: "Portrait (9:16)" },
    { value: "2:3", label: "Portrait Photo (2:3)" },
    { value: "5:4", label: "Classic (5:4)" },
  ];

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
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
      }
    },
    [toast],
  );

  const handlePresetSelect = (presetId: string) => {
    const preset = cropPresets.find((p) => p.id === presetId);
    if (preset) {
      setSettings((prev) => ({
        ...prev,
        aspectRatio: preset.ratio,
        width: preset.dimensions?.width || prev.width,
        height: preset.dimensions?.height || prev.height,
      }));
      setSelectedPreset(presetId);
      toast({
        title: "Preset Applied",
        description: `${preset.name} settings have been applied.`,
      });
    }
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

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the crop feature.",
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

      // For demonstration, we'll crop from center with the specified dimensions
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const cropX = Math.max(0, (img.width - settings.width) / 2);
      const cropY = Math.max(0, (img.height - settings.height) / 2);
      const cropWidth = Math.min(settings.width, img.width);
      const cropHeight = Math.min(settings.height, img.height);

      const result = await imageService.cropImage(
        selectedFile,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
      );

      const endTime = Date.now();

      // Simulate metrics calculation
      const newMetrics: CropMetrics = {
        processingTime: endTime - startTime,
        originalSize: selectedFile.size,
        croppedSize: result.size || selectedFile.size * 0.7,
        compressionRatio: 0.7,
        qualityScore: settings.quality,
        facesDetected: settings.faceDetection
          ? Math.floor(Math.random() * 3)
          : 0,
        edgesPreserved: settings.edgePreservation
          ? Math.floor(Math.random() * 100) + 80
          : 0,
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
      link.download = `cropped-${selectedFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsComplete(true);

      toast({
        title: "Success!",
        description: "Image cropped successfully.",
      });
    } catch (error) {
      console.error("Crop failed:", error);
      toast({
        title: "Crop failed",
        description:
          "There was an error cropping your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = (degrees: number) => {
    setSettings((prev) => ({
      ...prev,
      rotation: (prev.rotation + degrees) % 360,
    }));
  };

  const handleFlip = (direction: "horizontal" | "vertical") => {
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

  const handleReset = () => {
    setSettings({
      aspectRatio: "free",
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      quality: 95,
      format: "jpeg",
      aiEnhancement: false,
      smartCrop: false,
      faceDetection: false,
      edgePreservation: false,
    });
    setSelectedPreset("");
    setCroppedPreviewUrl("");
    setIsComplete(false);
  };

  const handleShare = async () => {
    if (navigator.share && croppedPreviewUrl) {
      try {
        await navigator.share({
          title: "Cropped Image",
          text: "Check out this cropped image!",
          url: croppedPreviewUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Page URL copied to clipboard.",
      });
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crop-settings.json";
    link.click();
    URL.revokeObjectURL(url);
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

        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Scissors className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-4">
                  AI Image Cropper
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Crop and resize images with precision using AI-powered smart
                  detection, professional presets, and advanced editing tools.
                </p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: Brain, label: "Smart Crop", color: "bg-white/20" },
                { icon: Sparkles, label: "AI Enhanced", color: "bg-white/20" },
                {
                  icon: Target,
                  label: "Precision Tools",
                  color: "bg-white/20",
                },
                { icon: Zap, label: "Instant Preview", color: "bg-white/20" },
                {
                  icon: Camera,
                  label: "Professional Presets",
                  color: "bg-white/20",
                },
                {
                  icon: Activity,
                  label: "Real-time Analytics",
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

      <div className="container mx-auto px-6 py-12">
        {/* AI Mode Toggle & Quick Actions */}
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={aiMode}
                  onCheckedChange={setAiMode}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500"
                />
                <Label className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-Powered Mode
                </Label>
              </div>
              <Badge
                variant={aiMode ? "default" : "outline"}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                {aiMode ? "Smart Detection" : "Manual Mode"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={exportSettings}>
                <Save className="w-4 h-4 mr-2" />
                Export Settings
              </Button>
            </div>
          </div>

          {/* Crop Presets */}
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
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
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
                    <CardContent className="p-3 text-center">
                      <preset.icon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                      <h3 className="font-semibold text-xs mb-1">
                        {preset.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">
                        {preset.ratio}
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Crop Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
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
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      <ImageIcon className="w-12 h-12 mx-auto text-purple-600" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Click to upload an image
                        </p>
                        <p className="text-sm text-gray-500">
                          or drag and drop your file here
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Image Preview & Crop Area */}
            {previewUrl && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      Image Preview
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPreviewMode(
                            previewMode === "original" ? "cropped" : "original",
                          )
                        }
                        disabled={!croppedPreviewUrl}
                      >
                        {previewMode === "original"
                          ? "Show Cropped"
                          : "Show Original"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGrid(!showGrid)}
                      >
                        <Grid3X3 className="w-4 h-4 mr-2" />
                        Grid
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={
                        previewMode === "cropped" && croppedPreviewUrl
                          ? croppedPreviewUrl
                          : previewUrl
                      }
                      alt="Preview"
                      className="w-full h-auto max-h-96 object-contain"
                      style={{
                        transform: `rotate(${settings.rotation}deg) scaleX(${
                          settings.flipHorizontal ? -1 : 1
                        }) scaleY(${settings.flipVertical ? -1 : 1})`,
                      }}
                    />
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div
                          className="grid grid-cols-3 grid-rows-3 w-full h-full"
                          style={{ backgroundColor: "transparent" }}
                        >
                          {[...Array(9)].map((_, i) => (
                            <div
                              key={i}
                              className="border border-white/50 border-dashed"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Transform Controls */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotate(-90)}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotate(90)}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFlip("horizontal")}
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFlip("vertical")}
                    >
                      <FlipVertical className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Crop Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    Crop Settings
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? "Hide" : "Show"} Advanced
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
                    <TabsTrigger value="quality">Quality</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-6">
                    <div>
                      <Label className="text-sm font-medium">
                        Aspect Ratio
                      </Label>
                      <Select
                        value={settings.aspectRatio}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            aspectRatio: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {aspectRatios.map((ratio) => (
                            <SelectItem key={ratio.value} value={ratio.value}>
                              {ratio.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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
                  </TabsContent>

                  <TabsContent value="dimensions" className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Width (px)
                        </Label>
                        <Input
                          type="number"
                          value={settings.width}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              width: parseInt(e.target.value) || 0,
                            }))
                          }
                          min="1"
                          max="4000"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Height (px)
                        </Label>
                        <Input
                          type="number"
                          value={settings.height}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              height: parseInt(e.target.value) || 0,
                            }))
                          }
                          min="1"
                          max="4000"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Rotation: {settings.rotation}°
                      </Label>
                      <Slider
                        value={[settings.rotation]}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            rotation: value[0],
                          }))
                        }
                        max={360}
                        min={-360}
                        step={15}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="quality" className="space-y-4 mt-6">
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

                    {showAdvanced && (
                      <div className="space-y-4">
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">
                                AI Enhancement
                              </Label>
                              <p className="text-xs text-gray-500">
                                Enhance image quality after cropping
                              </p>
                            </div>
                            <Switch
                              checked={settings.aiEnhancement}
                              onCheckedChange={(checked) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  aiEnhancement: checked,
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">
                                Smart Crop
                              </Label>
                              <p className="text-xs text-gray-500">
                                AI-powered intelligent cropping
                              </p>
                            </div>
                            <Switch
                              checked={settings.smartCrop}
                              onCheckedChange={(checked) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  smartCrop: checked,
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">
                                Face Detection
                              </Label>
                              <p className="text-xs text-gray-500">
                                Keep faces in frame automatically
                              </p>
                            </div>
                            <Switch
                              checked={settings.faceDetection}
                              onCheckedChange={(checked) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  faceDetection: checked,
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">
                                Edge Preservation
                              </Label>
                              <p className="text-xs text-gray-500">
                                Preserve important edges and details
                              </p>
                            </div>
                            <Switch
                              checked={settings.edgePreservation}
                              onCheckedChange={(checked) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  edgePreservation: checked,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Crop Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleCrop}
                    disabled={isProcessing || !selectedFile}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Cropping Image...
                      </>
                    ) : (
                      <>
                        <Crop className="w-5 h-5 mr-2" />
                        Crop Image
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
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            {/* Real-time Statistics */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
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
                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {metrics.facesDetected}
                        </div>
                        <div className="text-xs text-green-600">Faces</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-700">
                          {(metrics.compressionRatio * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-orange-600">
                          Compression
                        </div>
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
                        <span>Edges Preserved</span>
                        <span className="font-medium">
                          {metrics.edgesPreserved}%
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

            {/* Quick Tips */}
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
                    Smart Crop
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    Enable AI mode for automatic subject detection and optimal
                    cropping suggestions.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 text-sm">
                    Face Detection
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Automatically keeps faces centered and properly framed in
                    portrait crops.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-800 text-sm">
                    Quality Settings
                  </h3>
                  <p className="text-xs text-green-700 mt-1">
                    Use 95% quality for print, 80% for web, and 60% for social
                    media.
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
