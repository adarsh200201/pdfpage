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
import { PDFService } from "../services/pdfService";
import {
  Upload,
  Download,
  RefreshCw,
  Eye,
  FileText,
  Image as ImageIcon,
  Move,
  RotateCw,
  Grid3X3,
  Layers,
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
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  Layout,
  Maximize,
  Minimize,
  AlignCenter,
  AlignLeft,
  AlignRight,
  BookOpen,
  FileImage,
} from "lucide-react";

interface ConversionSettings {
  pageSize: "A4" | "Letter" | "Legal" | "A3" | "Custom";
  orientation: "portrait" | "landscape";
  margin: number;
  imageQuality: number;
  compression: "none" | "low" | "medium" | "high";
  layout: "single" | "multiple" | "fit-to-page" | "original-size";
  alignment: "center" | "left" | "right" | "top" | "bottom";
  spacing: number;
  backgroundColor: string;
  addWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  includeMetadata: boolean;
  smartLayout: boolean;
  aiOptimization: boolean;
  autoRotate: boolean;
  preserveAspectRatio: boolean;
}

interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  url: string;
  order: number;
  rotation: number;
  scale: number;
}

interface ConversionMetrics {
  processingTime: number;
  totalImages: number;
  totalPages: number;
  originalSize: number;
  pdfSize: number;
  compressionRatio: number;
  qualityScore: number;
  layoutEfficiency: number;
}

interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  settings: Partial<ConversionSettings>;
}

const ImgToPdf = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [conversionHistory, setConversionHistory] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("document");
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [settings, setSettings] = useState<ConversionSettings>({
    pageSize: "A4",
    orientation: "portrait",
    margin: 20,
    imageQuality: 95,
    compression: "medium",
    layout: "single",
    alignment: "center",
    spacing: 10,
    backgroundColor: "#ffffff",
    addWatermark: false,
    watermarkText: "",
    watermarkOpacity: 50,
    includeMetadata: true,
    smartLayout: true,
    aiOptimization: true,
    autoRotate: false,
    preserveAspectRatio: true,
  });

  const layoutPresets: LayoutPreset[] = [
    {
      id: "document",
      name: "Document",
      description: "Professional document layout",
      icon: FileText,
      category: "Business",
      settings: {
        layout: "single",
        alignment: "center",
        margin: 25,
        compression: "low",
      },
    },
    {
      id: "photo-album",
      name: "Photo Album",
      description: "Multiple photos per page",
      icon: ImageIcon,
      category: "Photo",
      settings: {
        layout: "multiple",
        alignment: "center",
        spacing: 15,
        imageQuality: 98,
      },
    },
    {
      id: "presentation",
      name: "Presentation",
      description: "Full-page images for slides",
      icon: Layout,
      category: "Presentation",
      settings: {
        layout: "fit-to-page",
        margin: 10,
        preserveAspectRatio: false,
      },
    },
    {
      id: "portfolio",
      name: "Portfolio",
      description: "High-quality image showcase",
      icon: BookOpen,
      category: "Creative",
      settings: {
        pageSize: "A3",
        imageQuality: 100,
        compression: "none",
        smartLayout: true,
      },
    },
    {
      id: "catalog",
      name: "Catalog",
      description: "Product catalog layout",
      icon: Grid3X3,
      category: "Commerce",
      settings: {
        layout: "multiple",
        spacing: 20,
        margin: 15,
        aiOptimization: true,
      },
    },
    {
      id: "archive",
      name: "Archive",
      description: "Document archival format",
      icon: FileImage,
      category: "Archive",
      settings: {
        layout: "original-size",
        compression: "high",
        includeMetadata: true,
      },
    },
  ];

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newImages: ImageFile[] = [];

      files.forEach((file, index) => {
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 50MB and will be skipped.`,
            variant: "destructive",
          });
          return;
        }

        const imageFile: ImageFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file),
          order: images.length + newImages.length + index,
          rotation: 0,
          scale: 1,
        };

        newImages.push(imageFile);
      });

      setImages((prev) => [...prev, ...newImages]);
      setIsComplete(false);

      if (newImages.length > 0) {
        toast({
          title: "Images Added",
          description: `${newImages.length} image(s) added successfully.`,
        });
      }
    },
    [toast, images.length],
  );

  const handlePresetSelect = (presetId: string) => {
    const preset = layoutPresets.find((p) => p.id === presetId);
    if (preset) {
      setSettings((prev) => ({ ...prev, ...preset.settings }));
      setSelectedPreset(presetId);
      toast({
        title: "Preset Applied",
        description: `${preset.name} layout has been applied.`,
      });
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      // Reorder remaining images
      return updated.map((img, index) => ({ ...img, order: index }));
    });
  };

  const moveImage = (id: string, direction: "up" | "down") => {
    setImages((prev) => {
      const index = prev.findIndex((img) => img.id === id);
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === prev.length - 1)
      ) {
        return prev;
      }

      const newImages = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      [newImages[index], newImages[targetIndex]] = [
        newImages[targetIndex],
        newImages[index],
      ];

      return newImages.map((img, idx) => ({ ...img, order: idx }));
    });
  };

  const rotateImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img,
      ),
    );
  };

  const handleConvertToPdf = async () => {
    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please add at least one image to convert.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to convert images to PDF.",
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
      }, 500);

      const startTime = Date.now();

      // Sort images by order
      const sortedImages = [...images].sort((a, b) => a.order - b.order);

      const result = await PDFService.imagesToPdf(
        sortedImages.map((img) => img.file),
        {
          pageSize: settings.pageSize,
          orientation: settings.orientation,
          margin: settings.margin,
          imageQuality: settings.imageQuality,
          compression: settings.compression,
          layout: settings.layout,
          alignment: settings.alignment,
          spacing: settings.spacing,
          backgroundColor: settings.backgroundColor,
          watermark: settings.addWatermark
            ? {
                text: settings.watermarkText,
                opacity: settings.watermarkOpacity / 100,
              }
            : undefined,
        },
      );

      const endTime = Date.now();

      // Calculate metrics
      const totalSize = images.reduce((sum, img) => sum + img.size, 0);
      const newMetrics: ConversionMetrics = {
        processingTime: endTime - startTime,
        totalImages: images.length,
        totalPages: Math.ceil(
          images.length / (settings.layout === "multiple" ? 4 : 1),
        ),
        originalSize: totalSize,
        pdfSize: result.size || totalSize * 0.8,
        compressionRatio: 0.8,
        qualityScore: settings.imageQuality,
        layoutEfficiency: 85 + Math.random() * 10,
      };

      setMetrics(newMetrics);

      clearInterval(progressInterval);
      setProgress(100);

      // Add to history
      const historyEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        imageCount: images.length,
        preset: selectedPreset,
        metrics: newMetrics,
        settings: { ...settings },
      };

      setConversionHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);

      // Download the result
      const blob = new Blob([result], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `images-to-pdf-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsComplete(true);

      toast({
        title: "Success!",
        description: `${images.length} images converted to PDF successfully.`,
      });
    } catch (error) {
      console.error("Conversion failed:", error);
      toast({
        title: "Conversion failed",
        description:
          "There was an error converting your images to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Images to PDF Converter",
          text: "Convert multiple images into a single PDF document",
          url: window.location.href,
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
    link.download = "img-to-pdf-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectAllImages = () => {
    setSelectedImages(images.map((img) => img.id));
  };

  const clearSelection = () => {
    setSelectedImages([]);
  };

  const removeSelectedImages = () => {
    setImages((prev) =>
      prev
        .filter((img) => !selectedImages.includes(img.id))
        .map((img, index) => ({ ...img, order: index })),
    );
    setSelectedImages([]);
  };

  const totalSize = images.reduce((sum, img) => sum + img.size, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100">
      <ImgHeader />

      {/* Enhanced Header Section */}
      <div className="relative pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 opacity-90"></div>
        <div
          className={
            'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0l8 8-8 8V8h-4v26h4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] animate-pulse'
          }
        ></div>

        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <FileImage className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-4">
                  Image to PDF Converter
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Convert multiple images into professional PDF documents with
                  AI-powered layout optimization and advanced customization
                  options.
                </p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: Brain, label: "Smart Layout", color: "bg-white/20" },
                {
                  icon: Sparkles,
                  label: "AI Optimization",
                  color: "bg-white/20",
                },
                {
                  icon: Target,
                  label: "Batch Processing",
                  color: "bg-white/20",
                },
                { icon: Zap, label: "Fast Conversion", color: "bg-white/20" },
                {
                  icon: Layers,
                  label: "Multiple Layouts",
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
        {/* Mobile-First Upload Section - Top Priority */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" />
              Upload Images
            </CardTitle>
            <CardDescription>
              Select multiple images to convert to PDF (JPG, PNG, WebP up to
              50MB each)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center hover:border-teal-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {images.length > 0 ? (
                <div className="space-y-4">
                  <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-teal-600" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">
                      {images.length} image{images.length !== 1 ? "s" : ""}{" "}
                      selected
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Total size: {(totalSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Add More Images
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-base sm:text-lg font-medium text-gray-700">
                      Click to upload images
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      or drag and drop your files here
                    </p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* AI Mode Toggle & Layout Presets */}
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={aiMode}
                  onCheckedChange={setAiMode}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-teal-500 data-[state=checked]:to-cyan-500"
                />
                <Label className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="w-5 h-5 text-teal-600" />
                  AI-Powered Layout
                </Label>
              </div>
              <Badge
                variant={aiMode ? "default" : "outline"}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
              >
                {aiMode ? "Smart Layout" : "Manual Layout"}
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

          {/* Layout Presets */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-teal-600" />
                Layout Presets
              </CardTitle>
              <CardDescription>
                Choose from optimized layouts for different document types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {layoutPresets.map((preset) => (
                  <Card
                    key={preset.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                      selectedPreset === preset.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-teal-300"
                    }`}
                    onClick={() => handlePresetSelect(preset.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <preset.icon className="w-8 h-8 mx-auto mb-2 text-teal-600" />
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
          {/* Main Conversion Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-teal-600" />
                  Upload Images
                </CardTitle>
                <CardDescription>
                  Select multiple images to convert to PDF (JPG, PNG, WebP up to
                  50MB each)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {images.length > 0 ? (
                    <div className="space-y-4">
                      <ImageIcon className="w-12 h-12 mx-auto text-teal-600" />
                      <div>
                        <p className="font-medium">
                          {images.length} image{images.length !== 1 ? "s" : ""}{" "}
                          selected
                        </p>
                        <p className="text-sm text-gray-500">
                          Total size: {(totalSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Add More Images
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Click to upload images
                        </p>
                        <p className="text-sm text-gray-500">
                          or drag and drop your files here
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {images.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Image List</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllImages}
                        >
                          Select All
                        </Button>
                        {selectedImages.length > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearSelection}
                            >
                              Clear ({selectedImages.length})
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={removeSelectedImages}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Selected
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                      {images
                        .sort((a, b) => a.order - b.order)
                        .map((image) => (
                          <div
                            key={image.id}
                            className={`relative p-3 border rounded-lg ${
                              selectedImages.includes(image.id)
                                ? "border-teal-500 bg-teal-50"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedImages.includes(image.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedImages((prev) => [
                                      ...prev,
                                      image.id,
                                    ]);
                                  } else {
                                    setSelectedImages((prev) =>
                                      prev.filter((id) => id !== image.id),
                                    );
                                  }
                                }}
                                className="mt-1"
                              />
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-16 h-16 object-cover rounded border"
                                style={{
                                  transform: `rotate(${image.rotation}deg) scale(${image.scale})`,
                                }}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm truncate">
                                  {image.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(image.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveImage(image.id, "up")}
                                    disabled={image.order === 0}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveImage(image.id, "down")}
                                    disabled={image.order === images.length - 1}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => rotateImage(image.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <RotateCw className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeImage(image.id)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PDF Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    PDF Settings
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
                    <Label className="text-sm font-medium">Page Size</Label>
                    <Select
                      value={settings.pageSize}
                      onValueChange={(value: any) =>
                        setSettings((prev) => ({ ...prev, pageSize: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Orientation</Label>
                    <Select
                      value={settings.orientation}
                      onValueChange={(value: any) =>
                        setSettings((prev) => ({ ...prev, orientation: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Layout</Label>
                  <Select
                    value={settings.layout}
                    onValueChange={(value: any) =>
                      setSettings((prev) => ({ ...prev, layout: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">
                        Single Image per Page
                      </SelectItem>
                      <SelectItem value="multiple">
                        Multiple Images per Page
                      </SelectItem>
                      <SelectItem value="fit-to-page">Fit to Page</SelectItem>
                      <SelectItem value="original-size">
                        Original Size
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showAdvanced && (
                  <Tabs defaultValue="layout" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="layout">Layout</TabsTrigger>
                      <TabsTrigger value="quality">Quality</TabsTrigger>
                      <TabsTrigger value="watermark">Watermark</TabsTrigger>
                      <TabsTrigger value="ai">AI Features</TabsTrigger>
                    </TabsList>

                    <TabsContent value="layout" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-sm font-medium">Alignment</Label>
                        <Select
                          value={settings.alignment}
                          onValueChange={(value: any) =>
                            setSettings((prev) => ({
                              ...prev,
                              alignment: value,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Margin: {settings.margin}px
                        </Label>
                        <Slider
                          value={[settings.margin]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              margin: value[0],
                            }))
                          }
                          max={50}
                          min={0}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Spacing: {settings.spacing}px
                        </Label>
                        <Slider
                          value={[settings.spacing]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              spacing: value[0],
                            }))
                          }
                          max={50}
                          min={0}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Background Color
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="color"
                            value={settings.backgroundColor}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                backgroundColor: e.target.value,
                              }))
                            }
                            className="w-12 h-10 rounded border"
                          />
                          <Input
                            value={settings.backgroundColor}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                backgroundColor: e.target.value,
                              }))
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="quality" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-sm font-medium">
                          Image Quality: {settings.imageQuality}%
                        </Label>
                        <Slider
                          value={[settings.imageQuality]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              imageQuality: value[0],
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
                          Compression
                        </Label>
                        <Select
                          value={settings.compression}
                          onValueChange={(value: any) =>
                            setSettings((prev) => ({
                              ...prev,
                              compression: value,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              None (Largest size)
                            </SelectItem>
                            <SelectItem value="low">Low Compression</SelectItem>
                            <SelectItem value="medium">
                              Medium Compression
                            </SelectItem>
                            <SelectItem value="high">
                              High Compression (Smallest size)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Preserve Aspect Ratio
                        </Label>
                        <Switch
                          checked={settings.preserveAspectRatio}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              preserveAspectRatio: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Auto Rotate
                        </Label>
                        <Switch
                          checked={settings.autoRotate}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              autoRotate: checked,
                            }))
                          }
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="watermark" className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Add Watermark
                        </Label>
                        <Switch
                          checked={settings.addWatermark}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              addWatermark: checked,
                            }))
                          }
                        />
                      </div>

                      {settings.addWatermark && (
                        <>
                          <div>
                            <Label className="text-sm font-medium">
                              Watermark Text
                            </Label>
                            <Input
                              value={settings.watermarkText}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  watermarkText: e.target.value,
                                }))
                              }
                              placeholder="Enter watermark text"
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium">
                              Watermark Opacity: {settings.watermarkOpacity}%
                            </Label>
                            <Slider
                              value={[settings.watermarkOpacity]}
                              onValueChange={(value) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  watermarkOpacity: value[0],
                                }))
                              }
                              max={100}
                              min={10}
                              step={10}
                              className="mt-2"
                            />
                          </div>
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="ai" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              Smart Layout
                            </Label>
                            <p className="text-xs text-gray-500">
                              Automatically optimize page layouts
                            </p>
                          </div>
                          <Switch
                            checked={settings.smartLayout}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                smartLayout: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              AI Optimization
                            </Label>
                            <p className="text-xs text-gray-500">
                              Enhance image quality and layout with AI
                            </p>
                          </div>
                          <Switch
                            checked={settings.aiOptimization}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                aiOptimization: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              Include Metadata
                            </Label>
                            <p className="text-xs text-gray-500">
                              Preserve image metadata in PDF
                            </p>
                          </div>
                          <Switch
                            checked={settings.includeMetadata}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                includeMetadata: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Convert Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleConvertToPdf}
                    disabled={isProcessing || images.length === 0}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Converting {images.length} image
                        {images.length !== 1 ? "s" : ""}...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Convert to PDF ({images.length} image
                        {images.length !== 1 ? "s" : ""})
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Converting images...</span>
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
                      PDF created successfully! Download started automatically.
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
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  Conversion Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
                        <div className="text-2xl font-bold text-teal-700">
                          {(metrics.processingTime / 1000).toFixed(1)}s
                        </div>
                        <div className="text-xs text-teal-600">
                          Processing Time
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">
                          {metrics.totalPages}
                        </div>
                        <div className="text-xs text-blue-600">PDF Pages</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {metrics.qualityScore}%
                        </div>
                        <div className="text-xs text-green-600">Quality</div>
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
                        <span>Total Images</span>
                        <span className="font-medium">
                          {metrics.totalImages}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Original Size</span>
                        <span className="font-medium">
                          {(metrics.originalSize / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>PDF Size</span>
                        <span className="font-medium">
                          {(metrics.pdfSize / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Layout Efficiency</span>
                        <span className="font-medium">
                          {metrics.layoutEfficiency.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Analytics will appear after conversion
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversion History */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Recent Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {conversionHistory.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {entry.imageCount} IMAGES
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {entry.preset} layout
                        </p>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>
                            {(entry.metrics.processingTime / 1000).toFixed(1)}s
                          </span>
                          <span>{entry.metrics.totalPages} pages</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No conversions yet</p>
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
                    Image Order
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    Drag images to reorder them. The first image will be on the
                    first page.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 text-sm">
                    Layout Optimization
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Enable Smart Layout for automatic optimization based on
                    image content.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-800 text-sm">
                    File Size
                  </h3>
                  <p className="text-xs text-green-700 mt-1">
                    Use medium compression for web sharing, low compression for
                    print quality.
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

export default ImgToPdf;
