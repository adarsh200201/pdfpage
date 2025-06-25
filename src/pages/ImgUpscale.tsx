import { useState, useRef, useCallback } from "react";
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
import { upscaleImage } from "../services/imageService";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { trackUsage } from "../services/usageService";
import {
  Upload,
  Download,
  RefreshCw,
  ZoomIn,
  Zap,
  Sparkles,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Printer,
  Camera,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  Info,
} from "lucide-react";

interface UpscalePreset {
  id: string;
  label: string;
  factor: number;
  icon: any;
  description: string;
  maxSize: string;
}

interface UpscaleMode {
  id: string;
  label: string;
  description: string;
  speed: "fast" | "medium" | "slow";
  quality: "good" | "better" | "best";
}

const upscalePresets: UpscalePreset[] = [
  {
    id: "2x",
    label: "2x Upscale",
    factor: 2,
    icon: Smartphone,
    description: "Perfect for web and social media",
    maxSize: "4K",
  },
  {
    id: "4x",
    label: "4x Upscale",
    factor: 4,
    icon: Monitor,
    description: "Great for desktop wallpapers",
    maxSize: "8K",
  },
  {
    id: "6x",
    label: "6x Upscale",
    factor: 6,
    icon: Camera,
    description: "High quality for professional use",
    maxSize: "12K",
  },
  {
    id: "8x",
    label: "8x Upscale",
    factor: 8,
    icon: Printer,
    description: "Maximum quality for printing",
    maxSize: "16K",
  },
];

const upscaleModes: UpscaleMode[] = [
  {
    id: "fast",
    label: "Fast",
    description: "Quick processing with good quality",
    speed: "fast",
    quality: "good",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Balance between speed and quality",
    speed: "medium",
    quality: "better",
  },
  {
    id: "quality",
    label: "High Quality",
    description: "Best quality but slower processing",
    speed: "slow",
    quality: "best",
  },
];

export default function ImgUpscale() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>("");
  const [upscaledImage, setUpscaledImage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string>("2x");
  const [selectedMode, setSelectedMode] = useState<string>("balanced");
  const [customFactor, setCustomFactor] = useState(2);
  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [newDimensions, setNewDimensions] = useState({ width: 0, height: 0 });
  const [processingTime, setProcessingTime] = useState(0);
  const [enhanceDetails, setEnhanceDetails] = useState(true);
  const [reduceNoise, setReduceNoise] = useState(true);
  const [preserveColors, setPreserveColors] = useState(true);

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

      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 25MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result);
        setUpscaledImage("");

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height });
          updateNewDimensions(img.width, img.height, selectedPreset);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    },
    [selectedPreset, toast],
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

  const updateNewDimensions = (
    width: number,
    height: number,
    preset: string,
  ) => {
    const factor =
      preset === "custom"
        ? customFactor
        : upscalePresets.find((p) => p.id === preset)?.factor || 2;
    setNewDimensions({
      width: Math.round(width * factor),
      height: Math.round(height * factor),
    });
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (originalDimensions.width > 0) {
      updateNewDimensions(
        originalDimensions.width,
        originalDimensions.height,
        preset,
      );
    }
  };

  const processUpscale = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setProgress(0);
      const startTime = Date.now();

      const factor =
        selectedPreset === "custom"
          ? customFactor
          : upscalePresets.find((p) => p.id === selectedPreset)?.factor || 2;

      const options = {
        factor,
        mode: selectedMode,
        enhanceDetails,
        reduceNoise,
        preserveColors,
        onProgress: (progressValue: number) => {
          setProgress(progressValue);
        },
      };

      setProgress(10);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setProgress(30);
      const result = await upscaleImage(selectedFile, options);

      setProgress(80);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const upscaledUrl = URL.createObjectURL(result);
      setUpscaledImage(upscaledUrl);

      setProgress(100);
      const endTime = Date.now();
      setProcessingTime(Math.round((endTime - startTime) / 1000));

      if (user) {
        await trackUsage(user.uid, "imgUpscale", 1);
      }

      toast({
        title: "Image upscaled successfully!",
        description: `Your image has been enhanced and is ready for download.`,
      });
    } catch (error) {
      console.error("Error upscaling image:", error);
      toast({
        title: "Upscaling failed",
        description:
          "An error occurred while upscaling the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const downloadUpscaledImage = () => {
    if (!upscaledImage) return;

    const link = document.createElement("a");
    link.href = upscaledImage;
    const factor =
      selectedPreset === "custom"
        ? customFactor
        : upscalePresets.find((p) => p.id === selectedPreset)?.factor || 2;
    link.download = `upscaled-${factor}x-${selectedFile?.name || "image.jpg"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEstimatedTime = () => {
    if (!originalDimensions.width) return "Unknown";

    const factor =
      selectedPreset === "custom"
        ? customFactor
        : upscalePresets.find((p) => p.id === selectedPreset)?.factor || 2;
    const pixels =
      originalDimensions.width * originalDimensions.height * factor * factor;
    const mode = upscaleModes.find((m) => m.id === selectedMode);

    let baseTime = pixels / 100000; // Base calculation

    if (mode?.speed === "fast") baseTime *= 0.5;
    else if (mode?.speed === "slow") baseTime *= 2;

    if (baseTime < 10) return "Under 10 seconds";
    if (baseTime < 60) return `~${Math.round(baseTime)} seconds`;
    return `~${Math.round(baseTime / 60)} minutes`;
  };

  const getQualityBadge = (quality: string) => {
    const colors = {
      good: "bg-yellow-100 text-yellow-800",
      better: "bg-blue-100 text-blue-800",
      best: "bg-green-100 text-green-800",
    };
    return colors[quality as keyof typeof colors] || colors.good;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <ImgHeader
        title="Upscale Image"
        description="Enhance and enlarge your images with AI-powered upscaling"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload and Preview Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {!selectedFile ? (
                    <div
                      className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Upload Image to Upscale
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Drag and drop your image here, or click to select
                      </p>
                      <p className="text-sm text-gray-400">
                        Supports: JPG, PNG, WEBP, BMP (Max 25MB)
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
                    <div className="space-y-6">
                      {/* Before/After Comparison */}
                      <Tabs defaultValue="before" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="before">
                            Original ({originalDimensions.width}×
                            {originalDimensions.height})
                          </TabsTrigger>
                          <TabsTrigger value="after" disabled={!upscaledImage}>
                            Upscaled ({newDimensions.width}��
                            {newDimensions.height})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="before" className="mt-4">
                          <div className="relative bg-gray-100 rounded-lg p-4">
                            <img
                              src={originalImage}
                              alt="Original"
                              className="w-full h-auto max-h-96 object-contain mx-auto"
                            />
                            <Badge className="absolute top-2 left-2 bg-gray-800 text-white">
                              Original
                            </Badge>
                          </div>
                        </TabsContent>

                        <TabsContent value="after" className="mt-4">
                          <div className="relative bg-gray-100 rounded-lg p-4">
                            {upscaledImage ? (
                              <>
                                <img
                                  src={upscaledImage}
                                  alt="Upscaled"
                                  className="w-full h-auto max-h-96 object-contain mx-auto"
                                />
                                <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                                  <ZoomIn className="h-3 w-3 mr-1" />
                                  Upscaled
                                </Badge>
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-96 text-gray-500">
                                <div className="text-center">
                                  <Sparkles className="h-12 w-12 mx-auto mb-2 text-blue-400" />
                                  <p>Upscaled image will appear here</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Processing Progress */}
                      {isProcessing && (
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Upscaling image...</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="w-full" />
                          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>
                              This may take a few moments depending on image
                              size
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Results Summary */}
                      {upscaledImage && (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <h4 className="font-medium text-green-800">
                                Upscaling Complete!
                              </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">
                                  Original Size:
                                </span>
                                <div className="font-medium">
                                  {originalDimensions.width}×
                                  {originalDimensions.height}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">New Size:</span>
                                <div className="font-medium text-green-600">
                                  {newDimensions.width}×{newDimensions.height}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Enhancement:
                                </span>
                                <div className="font-medium">
                                  {Math.round(
                                    (newDimensions.width *
                                      newDimensions.height) /
                                      (originalDimensions.width *
                                        originalDimensions.height),
                                  )}
                                  x more pixels
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Processing Time:
                                </span>
                                <div className="font-medium">
                                  {processingTime}s
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={processUpscale}
                          disabled={isProcessing}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Upscaling...
                            </>
                          ) : (
                            <>
                              <ZoomIn className="h-4 w-4 mr-2" />
                              Upscale Image
                            </>
                          )}
                        </Button>

                        {upscaledImage && (
                          <Button
                            variant="outline"
                            onClick={downloadUpscaledImage}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Enhanced
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          New Image
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              {selectedFile && (
                <>
                  {/* Upscale Presets */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Upscale Factor
                      </h3>
                      <div className="space-y-3">
                        {upscalePresets.map((preset) => (
                          <Button
                            key={preset.id}
                            variant={
                              selectedPreset === preset.id
                                ? "default"
                                : "outline"
                            }
                            className="w-full justify-start text-left h-auto p-3"
                            onClick={() => handlePresetChange(preset.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <preset.icon className="h-5 w-5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium">
                                  {preset.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {preset.description}
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {preset.maxSize}
                              </Badge>
                            </div>
                          </Button>
                        ))}

                        {/* Custom Factor */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Custom Factor
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Slider
                              value={[customFactor]}
                              onValueChange={(value) => {
                                setCustomFactor(value[0]);
                                setSelectedPreset("custom");
                                if (originalDimensions.width > 0) {
                                  updateNewDimensions(
                                    originalDimensions.width,
                                    originalDimensions.height,
                                    "custom",
                                  );
                                }
                              }}
                              min={1.5}
                              max={10}
                              step={0.5}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12">
                              {customFactor}x
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Processing Mode */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Processing Mode
                      </h3>
                      <div className="space-y-3">
                        {upscaleModes.map((mode) => (
                          <Button
                            key={mode.id}
                            variant={
                              selectedMode === mode.id ? "default" : "outline"
                            }
                            className="w-full justify-start text-left h-auto p-3"
                            onClick={() => setSelectedMode(mode.id)}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="font-medium">{mode.label}</div>
                                <div className="text-xs text-gray-500">
                                  {mode.description}
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Badge variant="outline" className="text-xs">
                                  {mode.speed}
                                </Badge>
                                <Badge
                                  className={`text-xs ${getQualityBadge(mode.quality)}`}
                                >
                                  {mode.quality}
                                </Badge>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhancement Options */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Enhancement Options
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enhance-details"
                            checked={enhanceDetails}
                            onCheckedChange={setEnhanceDetails}
                          />
                          <Label
                            htmlFor="enhance-details"
                            className="text-sm flex-1"
                          >
                            Enhance details
                            <p className="text-xs text-gray-500 mt-1">
                              Sharpen edges and improve clarity
                            </p>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="reduce-noise"
                            checked={reduceNoise}
                            onCheckedChange={setReduceNoise}
                          />
                          <Label
                            htmlFor="reduce-noise"
                            className="text-sm flex-1"
                          >
                            Reduce noise
                            <p className="text-xs text-gray-500 mt-1">
                              Remove artifacts and grain
                            </p>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="preserve-colors"
                            checked={preserveColors}
                            onCheckedChange={setPreserveColors}
                          />
                          <Label
                            htmlFor="preserve-colors"
                            className="text-sm flex-1"
                          >
                            Preserve colors
                            <p className="text-xs text-gray-500 mt-1">
                              Maintain original color accuracy
                            </p>
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Processing Info */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Processing Info
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Current Size:</span>
                          <span>
                            {originalDimensions.width}×
                            {originalDimensions.height}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>New Size:</span>
                          <span className="text-blue-600 font-medium">
                            {newDimensions.width}×{newDimensions.height}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>File Size:</span>
                          <span>{formatFileSize(selectedFile.size)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span>Estimated Time:</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{getEstimatedTime()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tips */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Pro Tips:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Higher factors work best on smaller images</li>
                        <li>• Use "High Quality" mode for final outputs</li>
                        <li>• Enable all enhancements for photos</li>
                        <li>• PNG format preserves the best quality</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
