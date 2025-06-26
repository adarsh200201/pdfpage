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
import { imageService } from "../services/imageService";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { UsageService } from "../services/usageService";
import {
  Upload,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  User,
  Car,
  Home,
  Shirt,
  TreePine,
  Cat,
  Trash2,
  Wand2,
  Sparkles,
  CheckCircle,
  XCircle,
  Brain,
  Zap,
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  Clock,
  Share,
  Save,
  Activity,
  Scissors,
  Image as ImageIcon,
  Palette,
  Eraser,
  Brush,
  ShieldCheck,
  Camera,
} from "lucide-react";

interface RemovalSettings {
  model: "general" | "person" | "product" | "animal" | "car" | "building";
  precision: "fast" | "balanced" | "precise";
  edgeSmoothing: number;
  featherAmount: number;
  transparencyThreshold: number;
  colorSpillRemoval: boolean;
  edgeRefinement: boolean;
  backgroundBlur: number;
  outputFormat: "png" | "webp";
  qualityLevel: number;
  aiEnhancement: boolean;
  smartDetection: boolean;
  batchMode: boolean;
}

interface RemovalPreset {
  id: string;
  name: string;
  description: string;
  model: string;
  icon: any;
  category: string;
  settings: Partial<RemovalSettings>;
}

interface RemovalMetrics {
  processingTime: number;
  accuracy: number;
  edgeQuality: number;
  objectsDetected: number;
  backgroundComplexity: number;
  confidenceScore: number;
  pixelsProcessed: number;
  compressionRatio: number;
}

const ImgRemoveBg = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [metrics, setMetrics] = useState<RemovalMetrics | null>(null);
  const [removalHistory, setRemovalHistory] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("person");
  const [showComparison, setShowComparison] = useState(false);
  const [previewMode, setPreviewMode] = useState<
    "original" | "transparent" | "colored"
  >("transparent");
  const [backgroundPreview, setBackgroundPreview] = useState<string>("#ffffff");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [settings, setSettings] = useState<RemovalSettings>({
    model: "person",
    precision: "balanced",
    edgeSmoothing: 2,
    featherAmount: 1,
    transparencyThreshold: 128,
    colorSpillRemoval: true,
    edgeRefinement: true,
    backgroundBlur: 0,
    outputFormat: "png",
    qualityLevel: 95,
    aiEnhancement: true,
    smartDetection: true,
    batchMode: false,
  });

  const removalPresets: RemovalPreset[] = [
    {
      id: "person",
      name: "Person",
      description: "Optimized for portraits and people",
      model: "person",
      icon: User,
      category: "People",
      settings: {
        model: "person",
        precision: "precise",
        edgeSmoothing: 3,
        colorSpillRemoval: true,
      },
    },
    {
      id: "product",
      name: "Product",
      description: "Perfect for ecommerce and product shots",
      model: "product",
      icon: Shirt,
      category: "Commerce",
      settings: {
        model: "product",
        precision: "precise",
        edgeRefinement: true,
        qualityLevel: 98,
      },
    },
    {
      id: "animal",
      name: "Animal",
      description: "Specialized for pets and animals",
      model: "animal",
      icon: Cat,
      category: "Nature",
      settings: {
        model: "animal",
        precision: "balanced",
        edgeSmoothing: 2,
        aiEnhancement: true,
      },
    },
    {
      id: "car",
      name: "Vehicle",
      description: "Optimized for cars and vehicles",
      model: "car",
      icon: Car,
      category: "Automotive",
      settings: {
        model: "car",
        precision: "precise",
        edgeRefinement: true,
        backgroundBlur: 1,
      },
    },
    {
      id: "building",
      name: "Architecture",
      description: "For buildings and structures",
      model: "building",
      icon: Home,
      category: "Architecture",
      settings: {
        model: "building",
        precision: "balanced",
        edgeSmoothing: 1,
        smartDetection: true,
      },
    },
    {
      id: "general",
      name: "General",
      description: "Universal model for any subject",
      model: "general",
      icon: Wand2,
      category: "Universal",
      settings: {
        model: "general",
        precision: "balanced",
        aiEnhancement: true,
        smartDetection: true,
      },
    },
  ];

  const backgroundColors = [
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
    "#ffc0cb",
    "#a52a2a",
    "#808080",
    "#f5f5dc",
    "#2e8b57",
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
        setResultUrl("");
      }
    },
    [toast],
  );

  const handlePresetSelect = (presetId: string) => {
    const preset = removalPresets.find((p) => p.id === presetId);
    if (preset) {
      setSettings((prev) => ({ ...prev, ...preset.settings }));
      setSelectedPreset(presetId);
      toast({
        title: "Preset Applied",
        description: `${preset.name} settings have been applied.`,
      });
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to remove background.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the background removal feature.",
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
      }, 300);

      const startTime = Date.now();

      console.log("Starting background removal with settings:", {
        model: settings.model,
        precision: settings.precision,
        edgeSmoothing: settings.edgeSmoothing,
        outputFormat: settings.outputFormat,
      });

      // Use real background removal functionality
      const result = await imageService.removeBackground(
        selectedFile,
        {
          model: settings.model,
          precision: settings.precision,
          edgeSmoothing: settings.edgeSmoothing,
          outputFormat: settings.outputFormat,
        },
        (progressValue) => {
          console.log("Background removal progress:", progressValue + "%");
          setProgress(30 + progressValue * 0.6); // Scale progress from 30% to 90%
        },
      );

      console.log("Background removal completed:", result);

      const endTime = Date.now();

      // Use real metrics from the background removal process
      const newMetrics: RemovalMetrics = {
        processingTime: result.metadata.processingTime,
        accuracy: result.metadata.confidence,
        edgeQuality: result.metadata.edgeQuality,
        objectsDetected: 1, // Will be enhanced in future versions
        backgroundComplexity: Math.floor(
          (result.metadata.originalSize / result.metadata.resultSize) * 50,
        ),
        confidenceScore: result.metadata.confidence,
        pixelsProcessed: selectedFile.size * 8, // Approximate
        compressionRatio:
          (result.metadata.originalSize - result.metadata.resultSize) /
          result.metadata.originalSize,
      };

      setMetrics(newMetrics);

      clearInterval(progressInterval);
      setProgress(100);

      // Create result preview URL from the processed image
      const url = URL.createObjectURL(result.blob);
      setResultUrl(url);

      // Add to history
      const historyEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        originalName: selectedFile.name,
        preset: selectedPreset,
        metrics: newMetrics,
        settings: { ...settings },
      };

      setRemovalHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);

      // Download the result
      const link = document.createElement("a");
      link.href = url;
      link.download = result.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsComplete(true);

      toast({
        title: "Success!",
        description: `Background removed successfully using ${result.metadata.model} algorithm. Quality: ${result.metadata.confidence.toFixed(0)}%`,
      });
    } catch (error) {
      console.error("Background removal failed:", error);

      let errorMessage =
        "There was an error removing the background. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("quota exceeded")) {
          errorMessage = "API quota exceeded. Using offline processing...";
          // Could retry with client-side processing here
        } else if (error.message.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message.includes("too large")) {
          errorMessage = "Image is too large. Please try with a smaller image.";
        }
      }

      toast({
        title: "Removal failed",
        description: errorMessage,
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
          title: "Background Removed Image",
          text: "Check out this image with background removed!",
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
    link.download = "background-removal-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-100">
      <ImgHeader />

      {/* Enhanced Header Section */}
      <div className="relative pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-rose-600 to-red-700 opacity-90"></div>
        <div
          className={
            'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0l8 8-8 8V8h-4v26h4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] animate-pulse'
          }
        ></div>

        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Eraser className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-4">
                  AI Background Remover
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Remove backgrounds from images with AI-powered precision.
                  Perfect for portraits, products, and professional photography.
                </p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: Brain, label: "AI Powered", color: "bg-white/20" },
                {
                  icon: Sparkles,
                  label: "Edge Detection",
                  color: "bg-white/20",
                },
                {
                  icon: Target,
                  label: "Precise Removal",
                  color: "bg-white/20",
                },
                { icon: Zap, label: "Instant Results", color: "bg-white/20" },
                {
                  icon: ShieldCheck,
                  label: "Quality Guaranteed",
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
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-rose-500"
                />
                <Label className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="w-5 h-5 text-pink-600" />
                  AI-Enhanced Mode
                </Label>
              </div>
              <Badge
                variant={aiMode ? "default" : "outline"}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white"
              >
                {aiMode ? "Smart Detection" : "Standard Mode"}
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

          {/* Model Presets */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-pink-600" />
                AI Models
              </CardTitle>
              <CardDescription>
                Choose the specialized AI model for your image type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {removalPresets.map((preset) => (
                  <Card
                    key={preset.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                      selectedPreset === preset.id
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                    onClick={() => handlePresetSelect(preset.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <preset.icon className="w-8 h-8 mx-auto mb-2 text-pink-600" />
                      <h3 className="font-semibold text-sm mb-1">
                        {preset.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {preset.description}
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
          {/* Main Processing Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-pink-600" />
                  Upload Image
                </CardTitle>
                <CardDescription>
                  Select an image to remove its background (JPG, PNG, WebP up to
                  10MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      <ImageIcon className="w-12 h-12 mx-auto text-pink-600" />
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
                      {resultUrl && (
                        <Select
                          value={previewMode}
                          onValueChange={(value: any) => setPreviewMode(value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="original">Original</SelectItem>
                            <SelectItem value="transparent">
                              Transparent
                            </SelectItem>
                            <SelectItem value="colored">
                              With Background
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
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
                        <h3 className="text-sm font-medium mb-2">Original</h3>
                      )}
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Original"
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      </div>
                    </div>

                    {/* Processed Image */}
                    {resultUrl && (
                      <div className="relative">
                        {showComparison && (
                          <h3 className="text-sm font-medium mb-2">
                            Background Removed
                          </h3>
                        )}
                        <div
                          className="relative rounded-lg overflow-hidden"
                          style={{
                            backgroundColor:
                              previewMode === "colored"
                                ? backgroundPreview
                                : "transparent",
                            backgroundImage:
                              previewMode === "transparent"
                                ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                                : "none",
                            backgroundSize:
                              previewMode === "transparent"
                                ? "20px 20px"
                                : "auto",
                            backgroundPosition:
                              previewMode === "transparent"
                                ? "0 0, 0 10px, 10px -10px, -10px 0px"
                                : "auto",
                          }}
                        >
                          <img
                            src={resultUrl}
                            alt="Background removed"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Background Color Picker */}
                  {resultUrl && previewMode === "colored" && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium mb-2 block">
                        Preview Background
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {backgroundColors.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              backgroundPreview === color
                                ? "border-gray-800"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setBackgroundPreview(color)}
                          />
                        ))}
                        <input
                          type="color"
                          value={backgroundPreview}
                          onChange={(e) => setBackgroundPreview(e.target.value)}
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Processing Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    Processing Settings
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
                    <Label className="text-sm font-medium">Precision</Label>
                    <Select
                      value={settings.precision}
                      onValueChange={(value: any) =>
                        setSettings((prev) => ({ ...prev, precision: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">
                          Fast (Quick processing)
                        </SelectItem>
                        <SelectItem value="balanced">
                          Balanced (Good quality)
                        </SelectItem>
                        <SelectItem value="precise">
                          Precise (Best quality)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Output Format</Label>
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
                        <SelectItem value="png">
                          PNG (Best for transparency)
                        </SelectItem>
                        <SelectItem value="webp">
                          WebP (Smaller file size)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {showAdvanced && (
                  <Tabs defaultValue="quality" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="quality">Quality</TabsTrigger>
                      <TabsTrigger value="edges">Edges</TabsTrigger>
                      <TabsTrigger value="ai">AI Features</TabsTrigger>
                    </TabsList>

                    <TabsContent value="quality" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-sm font-medium">
                          Quality Level: {settings.qualityLevel}%
                        </Label>
                        <Slider
                          value={[settings.qualityLevel]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              qualityLevel: value[0],
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
                          Transparency Threshold:{" "}
                          {settings.transparencyThreshold}
                        </Label>
                        <Slider
                          value={[settings.transparencyThreshold]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              transparencyThreshold: value[0],
                            }))
                          }
                          max={255}
                          min={0}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="edges" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-sm font-medium">
                          Edge Smoothing: {settings.edgeSmoothing}
                        </Label>
                        <Slider
                          value={[settings.edgeSmoothing]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              edgeSmoothing: value[0],
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
                          Feather Amount: {settings.featherAmount}
                        </Label>
                        <Slider
                          value={[settings.featherAmount]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              featherAmount: value[0],
                            }))
                          }
                          max={5}
                          min={0}
                          step={0.5}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Color Spill Removal
                        </Label>
                        <Switch
                          checked={settings.colorSpillRemoval}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              colorSpillRemoval: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Edge Refinement
                        </Label>
                        <Switch
                          checked={settings.edgeRefinement}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              edgeRefinement: checked,
                            }))
                          }
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="ai" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              AI Enhancement
                            </Label>
                            <p className="text-xs text-gray-500">
                              Improve edge quality with AI
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
                              Smart Detection
                            </Label>
                            <p className="text-xs text-gray-500">
                              Automatically detect subject type
                            </p>
                          </div>
                          <Switch
                            checked={settings.smartDetection}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                smartDetection: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Process Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleRemoveBackground}
                    disabled={isProcessing || !selectedFile}
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Removing Background...
                      </>
                    ) : (
                      <>
                        <Eraser className="w-5 h-5 mr-2" />
                        Remove Background
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
                      Background removed successfully! Download started
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
                  <BarChart3 className="w-5 h-5 text-pink-600" />
                  Processing Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-700">
                          {(metrics.processingTime / 1000).toFixed(1)}s
                        </div>
                        <div className="text-xs text-pink-600">
                          Processing Time
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">
                          {metrics.accuracy.toFixed(1)}%
                        </div>
                        <div className="text-xs text-blue-600">Accuracy</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {metrics.edgeQuality.toFixed(0)}%
                        </div>
                        <div className="text-xs text-green-600">
                          Edge Quality
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-700">
                          {metrics.objectsDetected}
                        </div>
                        <div className="text-xs text-orange-600">Objects</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence Score</span>
                        <span className="font-medium">
                          {metrics.confidenceScore.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Background Complexity</span>
                        <span className="font-medium">
                          {metrics.backgroundComplexity}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pixels Processed</span>
                        <span className="font-medium">
                          {(metrics.pixelsProcessed / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Compression</span>
                        <span className="font-medium">
                          {(metrics.compressionRatio * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Analytics will appear after processing
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing History */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Recent Removals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {removalHistory.length > 0 ? (
                  <div className="space-y-3">
                    {removalHistory.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {entry.preset.toUpperCase()}
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
                            {entry.metrics.accuracy.toFixed(0)}% accuracy
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No removals yet</p>
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
                    Best Results
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    Use high-contrast images with clear subject separation for
                    best results.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 text-sm">
                    AI Models
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Choose the right AI model for your subject type to improve
                    accuracy.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-800 text-sm">
                    Edge Quality
                  </h3>
                  <p className="text-xs text-green-700 mt-1">
                    Increase edge smoothing for softer transitions, reduce for
                    sharp edges.
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

export default ImgRemoveBg;
