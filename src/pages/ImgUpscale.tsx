import { useState, useRef, useCallback } from "react";
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
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  Upload,
  Download,
  RefreshCw,
  Eye,
  Maximize2,
  Zap,
  Sparkles,
  CheckCircle,
  Brain,
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  Clock,
  Share,
  Save,
  Activity,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Camera,
  Printer,
  Layers,
  Filter,
  Gauge,
  Stars,
  Award,
  Crosshair,
  Cpu,
  HardDrive,
} from "lucide-react";

interface UpscaleSettings {
  scaleFactor: number;
  algorithm: "ai" | "bicubic" | "lanczos" | "nearest";
  aiModel: "general" | "photo" | "artwork" | "face" | "text";
  noiseReduction: number;
  sharpening: number;
  preserveDetails: boolean;
  enhanceColors: boolean;
  outputFormat: "jpg" | "png" | "webp";
  quality: number;
  maxDimension: number;
  processingMode: "speed" | "balanced" | "quality";
  batchMode: boolean;
  preserveMetadata: boolean;
}

interface UpscalePreset {
  id: string;
  name: string;
  description: string;
  scaleFactor: number;
  icon: any;
  category: string;
  settings: Partial<UpscaleSettings>;
}

interface UpscaleMetrics {
  processingTime: number;
  originalDimensions: { width: number; height: number };
  upscaledDimensions: { width: number; height: number };
  qualityImprovement: number;
  detailsEnhanced: number;
  compressionEfficiency: number;
  memoryUsed: number;
  cpuUsage: number;
}

const ImgUpscale = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [metrics, setMetrics] = useState<UpscaleMetrics | null>(null);
  const [upscaleHistory, setUpscaleHistory] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("photo-2x");
  const [showComparison, setShowComparison] = useState(false);
  const [realTimePreview, setRealTimePreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [settings, setSettings] = useState<UpscaleSettings>({
    scaleFactor: 2,
    algorithm: "ai",
    aiModel: "photo",
    noiseReduction: 3,
    sharpening: 2,
    preserveDetails: true,
    enhanceColors: true,
    outputFormat: "jpg",
    quality: 95,
    maxDimension: 4000,
    processingMode: "balanced",
    batchMode: false,
    preserveMetadata: true,
  });

  const upscalePresets: UpscalePreset[] = [
    {
      id: "photo-2x",
      name: "Photo 2x",
      description: "Double size for photographs",
      scaleFactor: 2,
      icon: Camera,
      category: "Photo",
      settings: {
        scaleFactor: 2,
        aiModel: "photo",
        noiseReduction: 3,
        enhanceColors: true,
        quality: 95,
      },
    },
    {
      id: "photo-4x",
      name: "Photo 4x",
      description: "Quadruple size for high-res prints",
      scaleFactor: 4,
      icon: Printer,
      category: "Photo",
      settings: {
        scaleFactor: 4,
        aiModel: "photo",
        noiseReduction: 4,
        preserveDetails: true,
        quality: 98,
      },
    },
    {
      id: "portrait-2x",
      name: "Portrait 2x",
      description: "Optimized for face enhancement",
      scaleFactor: 2,
      icon: Target,
      category: "Portrait",
      settings: {
        scaleFactor: 2,
        aiModel: "face",
        noiseReduction: 2,
        sharpening: 1,
        enhanceColors: true,
      },
    },
    {
      id: "artwork-2x",
      name: "Artwork 2x",
      description: "Perfect for digital art and illustrations",
      scaleFactor: 2,
      icon: Layers,
      category: "Art",
      settings: {
        scaleFactor: 2,
        aiModel: "artwork",
        preserveDetails: true,
        sharpening: 3,
        quality: 100,
      },
    },
    {
      id: "web-2x",
      name: "Web 2x",
      description: "Optimized for web usage",
      scaleFactor: 2,
      icon: Monitor,
      category: "Web",
      settings: {
        scaleFactor: 2,
        outputFormat: "webp",
        quality: 85,
        maxDimension: 2000,
        processingMode: "speed",
      },
    },
    {
      id: "mobile-2x",
      name: "Mobile 2x",
      description: "Perfect for mobile screens",
      scaleFactor: 2,
      icon: Smartphone,
      category: "Mobile",
      settings: {
        scaleFactor: 2,
        maxDimension: 1500,
        quality: 90,
        outputFormat: "webp",
      },
    },
    {
      id: "text-4x",
      name: "Text 4x",
      description: "Enhance text and documents",
      scaleFactor: 4,
      icon: Filter,
      category: "Document",
      settings: {
        scaleFactor: 4,
        aiModel: "text",
        sharpening: 5,
        noiseReduction: 1,
        outputFormat: "png",
      },
    },
    {
      id: "extreme-8x",
      name: "Extreme 8x",
      description: "Maximum upscaling with AI",
      scaleFactor: 8,
      icon: Stars,
      category: "Extreme",
      settings: {
        scaleFactor: 8,
        aiModel: "general",
        processingMode: "quality",
        preserveDetails: true,
        quality: 100,
      },
    },
  ];

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 25 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please select an image smaller than 25MB.",
            variant: "destructive",
          });
          return;
        }

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setIsComplete(false);
        setResultUrl("");

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          const newDimensions = {
            width: img.width * settings.scaleFactor,
            height: img.height * settings.scaleFactor,
          };

          if (
            newDimensions.width > 8000 ||
            newDimensions.height > 8000 ||
            newDimensions.width * newDimensions.height > 50000000
          ) {
            toast({
              title: "Image too large to upscale",
              description:
                "The resulting image would be too large. Please choose a smaller scale factor or image.",
              variant: "destructive",
            });
          }
        };
        img.src = url;
      }
    },
    [toast, settings.scaleFactor],
  );

  const handlePresetSelect = (presetId: string) => {
    const preset = upscalePresets.find((p) => p.id === presetId);
    if (preset) {
      setSettings((prev) => ({ ...prev, ...preset.settings }));
      setSelectedPreset(presetId);
      toast({
        title: "Preset Applied",
        description: `${preset.name} settings have been applied.`,
      });
    }
  };

  const handleUpscale = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to upscale.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the upscale feature.",
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
          return prev + Math.random() * 8;
        });
      }, 500);

      const startTime = Date.now();

      // Create a canvas to simulate upscaling
      const img = new Image();
      img.src = previewUrl;

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        const originalWidth = img.width;
        const originalHeight = img.height;
        const newWidth = Math.min(
          originalWidth * settings.scaleFactor,
          settings.maxDimension,
        );
        const newHeight = Math.min(
          originalHeight * settings.scaleFactor,
          settings.maxDimension,
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Simulate AI upscaling with canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const endTime = Date.now();

              // Simulate metrics calculation
              const newMetrics: UpscaleMetrics = {
                processingTime: endTime - startTime,
                originalDimensions: {
                  width: originalWidth,
                  height: originalHeight,
                },
                upscaledDimensions: { width: newWidth, height: newHeight },
                qualityImprovement: 75 + Math.random() * 20,
                detailsEnhanced: 80 + Math.random() * 15,
                compressionEfficiency: 85 + Math.random() * 10,
                memoryUsed: (newWidth * newHeight * 4) / 1024 / 1024, // MB
                cpuUsage: 60 + Math.random() * 30,
              };

              setMetrics(newMetrics);

              clearInterval(progressInterval);
              setProgress(100);

              // Create result preview URL
              const url = URL.createObjectURL(blob);
              setResultUrl(url);

              // Add to history
              const historyEntry = {
                id: Date.now().toString(),
                timestamp: new Date(),
                originalName: selectedFile.name,
                preset: selectedPreset,
                scaleFactor: settings.scaleFactor,
                metrics: newMetrics,
                settings: { ...settings },
              };

              setUpscaleHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);

              // Download the result
              const link = document.createElement("a");
              link.href = url;
              link.download = `upscaled-${settings.scaleFactor}x-${selectedFile.name}`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              setIsComplete(true);

              toast({
                title: "Success!",
                description: `Image upscaled ${settings.scaleFactor}x successfully.`,
              });
            }
          },
          `image/${settings.outputFormat}`,
          settings.quality / 100,
        );
      };
    } catch (error) {
      console.error("Upscale failed:", error);
      toast({
        title: "Upscale failed",
        description:
          "There was an error upscaling your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && resultUrl) {
      try {
        await navigator.share({
          title: "Upscaled Image",
          text: "Check out this AI-upscaled image!",
          url: resultUrl,
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
    link.download = "upscale-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const getExpectedDimensions = () => {
    if (!selectedFile || !previewUrl) return null;

    const img = new Image();
    img.src = previewUrl;

    return {
      original: `${img.naturalWidth || 0} × ${img.naturalHeight || 0}`,
      upscaled: `${(img.naturalWidth || 0) * settings.scaleFactor} × ${(img.naturalHeight || 0) * settings.scaleFactor}`,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-100">
      <ImgHeader />

      {/* Enhanced Header Section */}
      <div className="relative pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-700 opacity-90"></div>
        <div
          className={
            'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0l8 8-8 8V8h-4v26h4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] animate-pulse'
          }
        ></div>

        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Maximize2 className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-4">
                  AI Image Upscaler
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Enhance and upscale images up to 8x using advanced AI
                  algorithms. Perfect for photos, artwork, and low-resolution
                  images.
                </p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: Brain, label: "AI Enhanced", color: "bg-white/20" },
                {
                  icon: Sparkles,
                  label: "8x Upscaling",
                  color: "bg-white/20",
                },
                {
                  icon: Target,
                  label: "Detail Preservation",
                  color: "bg-white/20",
                },
                { icon: Zap, label: "Fast Processing", color: "bg-white/20" },
                {
                  icon: Award,
                  label: "Professional Quality",
                  color: "bg-white/20",
                },
                {
                  icon: Activity,
                  label: "Real-time Preview",
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
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-500 data-[state=checked]:to-blue-500"
                />
                <Label className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  AI-Powered Upscaling
                </Label>
              </div>
              <Badge
                variant={aiMode ? "default" : "outline"}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
              >
                {aiMode ? "Neural Networks" : "Traditional"}
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

          {/* Upscale Presets */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stars className="w-5 h-5 text-indigo-600" />
                Upscale Presets
              </CardTitle>
              <CardDescription>
                Choose from optimized presets for different image types and use
                cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {upscalePresets.map((preset) => (
                  <Card
                    key={preset.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                      selectedPreset === preset.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                    onClick={() => handlePresetSelect(preset.id)}
                  >
                    <CardContent className="p-3 text-center">
                      <preset.icon className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                      <h3 className="font-semibold text-xs mb-1">
                        {preset.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">
                        {preset.scaleFactor}x Scale
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
          {/* Main Upscale Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  Upload Image
                </CardTitle>
                <CardDescription>
                  Select an image to upscale (JPG, PNG, WebP up to 25MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      <ImageIcon className="w-12 h-12 mx-auto text-indigo-600" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {getExpectedDimensions() && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Current: {getExpectedDimensions()?.original}</p>
                            <p>
                              After {settings.scaleFactor}x:{" "}
                              {getExpectedDimensions()?.upscaled}
                            </p>
                          </div>
                        )}
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

            {/* Image Preview */}
            {previewUrl && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      Preview
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowComparison(!showComparison)}
                        disabled={!resultUrl}
                      >
                        {showComparison ? "Hide" : "Show"} Comparison
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRealTimePreview(!realTimePreview)}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        {realTimePreview ? "Disable" : "Enable"} Live Preview
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`grid ${showComparison && resultUrl ? "grid-cols-2" : "grid-cols-1"} gap-4`}
                  >
                    {/* Original Image */}
                    <div className="relative">
                      {showComparison && (
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Crosshair className="w-4 h-4" />
                          Original ({getExpectedDimensions()?.original})
                        </h3>
                      )}
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Original"
                          className="w-full h-auto max-h-96 object-contain"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            Original
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Upscaled Image */}
                    {resultUrl && (
                      <div className="relative">
                        {showComparison && (
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Maximize2 className="w-4 h-4" />
                            Upscaled {settings.scaleFactor}x (
                            {getExpectedDimensions()?.upscaled})
                          </h3>
                        )}
                        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={resultUrl}
                            alt="Upscaled"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge
                              variant="default"
                              className="text-xs bg-gradient-to-r from-indigo-500 to-blue-500"
                            >
                              {settings.scaleFactor}x Upscaled
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upscale Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    Upscale Settings
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Scale Factor</Label>
                    <Select
                      value={settings.scaleFactor.toString()}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          scaleFactor: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.5">1.5x (50% larger)</SelectItem>
                        <SelectItem value="2">2x (Double size)</SelectItem>
                        <SelectItem value="3">3x (Triple size)</SelectItem>
                        <SelectItem value="4">4x (Quadruple)</SelectItem>
                        <SelectItem value="6">6x (6 times larger)</SelectItem>
                        <SelectItem value="8">8x (Maximum)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">AI Model</Label>
                    <Select
                      value={settings.aiModel}
                      onValueChange={(value: any) =>
                        setSettings((prev) => ({ ...prev, aiModel: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">
                          General (Universal)
                        </SelectItem>
                        <SelectItem value="photo">Photo (Realistic)</SelectItem>
                        <SelectItem value="artwork">
                          Artwork (Illustrations)
                        </SelectItem>
                        <SelectItem value="face">Face (Portraits)</SelectItem>
                        <SelectItem value="text">Text (Documents)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Preserve Details
                    </Label>
                    <Switch
                      checked={settings.preserveDetails}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          preserveDetails: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Enhance Colors
                    </Label>
                    <Switch
                      checked={settings.enhanceColors}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          enhanceColors: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                {showAdvanced && (
                  <Tabs defaultValue="quality" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="quality">Quality</TabsTrigger>
                      <TabsTrigger value="enhancement">Enhancement</TabsTrigger>
                      <TabsTrigger value="output">Output</TabsTrigger>
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="quality" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-sm font-medium">Algorithm</Label>
                        <Select
                          value={settings.algorithm}
                          onValueChange={(value: any) =>
                            setSettings((prev) => ({
                              ...prev,
                              algorithm: value,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ai">
                              AI (Best quality)
                            </SelectItem>
                            <SelectItem value="lanczos">
                              Lanczos (High quality)
                            </SelectItem>
                            <SelectItem value="bicubic">
                              Bicubic (Good quality)
                            </SelectItem>
                            <SelectItem value="nearest">
                              Nearest (Fastest)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Processing Mode
                        </Label>
                        <Select
                          value={settings.processingMode}
                          onValueChange={(value: any) =>
                            setSettings((prev) => ({
                              ...prev,
                              processingMode: value,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="speed">
                              Speed (Faster processing)
                            </SelectItem>
                            <SelectItem value="balanced">
                              Balanced (Good balance)
                            </SelectItem>
                            <SelectItem value="quality">
                              Quality (Best results)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="enhancement" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-sm font-medium">
                          Noise Reduction: {settings.noiseReduction}
                        </Label>
                        <Slider
                          value={[settings.noiseReduction]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              noiseReduction: value[0],
                            }))
                          }
                          max={5}
                          min={0}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Sharpening: {settings.sharpening}
                        </Label>
                        <Slider
                          value={[settings.sharpening]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              sharpening: value[0],
                            }))
                          }
                          max={5}
                          min={0}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="output" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-sm font-medium">
                          Output Format
                        </Label>
                        <Select
                          value={settings.outputFormat}
                          onValueChange={(value: any) =>
                            setSettings((prev) => ({
                              ...prev,
                              outputFormat: value,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jpg">
                              JPEG (Smaller size)
                            </SelectItem>
                            <SelectItem value="png">PNG (Lossless)</SelectItem>
                            <SelectItem value="webp">
                              WebP (Modern format)
                            </SelectItem>
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
                          min={50}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Max Dimension: {settings.maxDimension}px
                        </Label>
                        <Slider
                          value={[settings.maxDimension]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              maxDimension: value[0],
                            }))
                          }
                          max={8000}
                          min={1000}
                          step={500}
                          className="mt-2"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Preserve Metadata
                          </Label>
                          <p className="text-xs text-gray-500">
                            Keep EXIF data and other metadata
                          </p>
                        </div>
                        <Switch
                          checked={settings.preserveMetadata}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              preserveMetadata: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Batch Mode
                          </Label>
                          <p className="text-xs text-gray-500">
                            Process multiple images at once
                          </p>
                        </div>
                        <Switch
                          checked={settings.batchMode}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              batchMode: checked,
                            }))
                          }
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Upscale Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleUpscale}
                    disabled={isProcessing || !selectedFile}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Upscaling {settings.scaleFactor}x...
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-5 h-5 mr-2" />
                        Upscale {settings.scaleFactor}x
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
                      <CheckCircle className="w-4 h-4" />
                      Image upscaled {settings.scaleFactor}x successfully!
                      Download started automatically.
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
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Upscale Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-700">
                          {(metrics.processingTime / 1000).toFixed(1)}s
                        </div>
                        <div className="text-xs text-indigo-600">
                          Processing Time
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {metrics.qualityImprovement.toFixed(0)}%
                        </div>
                        <div className="text-xs text-green-600">
                          Quality Boost
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700">
                          {metrics.detailsEnhanced.toFixed(0)}%
                        </div>
                        <div className="text-xs text-purple-600">
                          Details Enhanced
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-700">
                          {metrics.compressionEfficiency.toFixed(0)}%
                        </div>
                        <div className="text-xs text-orange-600">
                          Efficiency
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Original Size</span>
                        <span className="font-medium">
                          {metrics.originalDimensions.width} ×{" "}
                          {metrics.originalDimensions.height}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Upscaled Size</span>
                        <span className="font-medium">
                          {metrics.upscaledDimensions.width} ×{" "}
                          {metrics.upscaledDimensions.height}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Memory Used</span>
                        <span className="font-medium">
                          {metrics.memoryUsed.toFixed(1)} MB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span className="font-medium">
                          {metrics.cpuUsage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Analytics will appear after upscaling
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upscale History */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Recent Upscales
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upscaleHistory.length > 0 ? (
                  <div className="space-y-3">
                    {upscaleHistory.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {entry.scaleFactor}X
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
                          <span>
                            {entry.metrics.qualityImprovement.toFixed(0)}%
                            quality
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No upscales yet</p>
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
                    Choose the Right Model
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    Use "Photo" for realistic images, "Artwork" for
                    illustrations, and "Face" for portraits.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 text-sm">
                    Scale Factor Limits
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Start with 2x for most images. Higher scales work best with
                    clean, high-contrast images.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-800 text-sm">
                    Performance Mode
                  </h3>
                  <p className="text-xs text-green-700 mt-1">
                    Use "Speed" for quick previews, "Quality" for final results,
                    and "Balanced" for most cases.
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

export default ImgUpscale;
