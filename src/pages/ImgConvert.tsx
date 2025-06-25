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
import { convertImageFormat } from "../services/imageService";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { trackUsage } from "../services/usageService";
import {
  Upload,
  Download,
  RefreshCw,
  Image as ImageIcon,
  ArrowRight,
  Settings,
  Info,
  FileType,
  Zap,
  Palette,
  Layers,
  Maximize,
  Minimize,
  RotateCw,
  Archive,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface ConversionJob {
  id: string;
  file: File;
  originalFormat: string;
  targetFormat: string;
  status: "pending" | "processing" | "completed" | "error";
  originalUrl: string;
  convertedUrl?: string;
  originalSize: number;
  convertedSize?: number;
  progress: number;
  error?: string;
}

interface FormatInfo {
  extension: string;
  name: string;
  description: string;
  supports: {
    transparency: boolean;
    animation: boolean;
    compression: boolean;
    lossless: boolean;
  };
  useCases: string[];
  maxQuality: number;
}

const formats: Record<string, FormatInfo> = {
  jpeg: {
    extension: "jpg",
    name: "JPEG",
    description: "Best for photos with many colors",
    supports: {
      transparency: false,
      animation: false,
      compression: true,
      lossless: false,
    },
    useCases: ["Photos", "Web images", "Social media"],
    maxQuality: 100,
  },
  png: {
    extension: "png",
    name: "PNG",
    description: "Best for graphics with transparency",
    supports: {
      transparency: true,
      animation: false,
      compression: true,
      lossless: true,
    },
    useCases: ["Logos", "Graphics", "Screenshots"],
    maxQuality: 100,
  },
  webp: {
    extension: "webp",
    name: "WebP",
    description: "Modern format with excellent compression",
    supports: {
      transparency: true,
      animation: true,
      compression: true,
      lossless: true,
    },
    useCases: ["Web optimization", "Modern browsers"],
    maxQuality: 100,
  },
  gif: {
    extension: "gif",
    name: "GIF",
    description: "Best for simple animations",
    supports: {
      transparency: true,
      animation: true,
      compression: true,
      lossless: false,
    },
    useCases: ["Animations", "Simple graphics"],
    maxQuality: 100,
  },
  bmp: {
    extension: "bmp",
    name: "BMP",
    description: "Uncompressed bitmap format",
    supports: {
      transparency: false,
      animation: false,
      compression: false,
      lossless: true,
    },
    useCases: ["Windows applications", "Raw data"],
    maxQuality: 100,
  },
  tiff: {
    extension: "tiff",
    name: "TIFF",
    description: "High-quality format for printing",
    supports: {
      transparency: true,
      animation: false,
      compression: true,
      lossless: true,
    },
    useCases: ["Printing", "Professional photography"],
    maxQuality: 100,
  },
  avif: {
    extension: "avif",
    name: "AVIF",
    description: "Next-gen format with superior compression",
    supports: {
      transparency: true,
      animation: true,
      compression: true,
      lossless: true,
    },
    useCases: ["Next-gen web", "High efficiency"],
    maxQuality: 100,
  },
};

export default function ImgConvert() {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("png");
  const [quality, setQuality] = useState(90);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const [resizeHeight, setResizeHeight] = useState<number | null>(null);
  const [enableResize, setEnableResize] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getFileFormat = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    if (extension === "jpg") return "jpeg";
    return extension;
  };

  const handleFileSelect = useCallback(
    (files: FileList) => {
      const newJobs: ConversionJob[] = [];

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file.`,
            variant: "destructive",
          });
          return;
        }

        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 50MB.`,
            variant: "destructive",
          });
          return;
        }

        const originalFormat = getFileFormat(file.name);
        const url = URL.createObjectURL(file);

        const job: ConversionJob = {
          id: generateId(),
          file,
          originalFormat,
          targetFormat,
          status: "pending",
          originalUrl: url,
          originalSize: file.size,
          progress: 0,
        };

        newJobs.push(job);
      });

      setJobs((prev) => [...prev, ...newJobs]);
    },
    [targetFormat, toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect],
  );

  const removeJob = (id: string) => {
    setJobs((prev) => {
      const updated = prev.filter((job) => job.id !== id);
      // Clean up object URLs
      const removed = prev.find((job) => job.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.originalUrl);
        if (removed.convertedUrl) {
          URL.revokeObjectURL(removed.convertedUrl);
        }
      }
      return updated;
    });
  };

  const clearAllJobs = () => {
    jobs.forEach((job) => {
      URL.revokeObjectURL(job.originalUrl);
      if (job.convertedUrl) {
        URL.revokeObjectURL(job.convertedUrl);
      }
    });
    setJobs([]);
  };

  const updateJobStatus = (id: string, updates: Partial<ConversionJob>) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job)),
    );
  };

  const convertSingleJob = async (job: ConversionJob) => {
    try {
      updateJobStatus(job.id, { status: "processing", progress: 0 });

      const options = {
        format: targetFormat,
        quality: quality / 100,
        resize: enableResize
          ? {
              width: resizeWidth,
              height: resizeHeight,
              maintainAspectRatio,
            }
          : undefined,
        onProgress: (progress: number) => {
          updateJobStatus(job.id, { progress });
        },
      };

      const result = await convertImageFormat(job.file, options);
      const convertedUrl = URL.createObjectURL(result.blob);

      updateJobStatus(job.id, {
        status: "completed",
        convertedUrl,
        convertedSize: result.blob.size,
        progress: 100,
      });
    } catch (error) {
      console.error("Conversion error:", error);
      updateJobStatus(job.id, {
        status: "error",
        error: error instanceof Error ? error.message : "Conversion failed",
        progress: 0,
      });
    }
  };

  const convertAllJobs = async () => {
    const pendingJobs = jobs.filter((job) => job.status === "pending");
    if (pendingJobs.length === 0) return;

    try {
      setIsProcessing(true);
      setBatchProgress(0);

      for (let i = 0; i < pendingJobs.length; i++) {
        await convertSingleJob(pendingJobs[i]);
        setBatchProgress(((i + 1) / pendingJobs.length) * 100);
      }

      if (user) {
        await trackUsage(user.uid, "imgConvert", pendingJobs.length);
      }

      toast({
        title: "Conversion completed!",
        description: `${pendingJobs.length} images converted successfully.`,
      });
    } catch (error) {
      console.error("Batch conversion error:", error);
      toast({
        title: "Conversion failed",
        description: "Some images could not be converted. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setBatchProgress(0);
    }
  };

  const downloadJob = (job: ConversionJob) => {
    if (!job.convertedUrl) return;

    const link = document.createElement("a");
    link.href = job.convertedUrl;
    const baseName = job.file.name.split(".").slice(0, -1).join(".");
    const targetExt = formats[targetFormat]?.extension || targetFormat;
    link.download = `${baseName}.${targetExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllCompleted = () => {
    const completedJobs = jobs.filter(
      (job) => job.status === "completed" && job.convertedUrl,
    );
    completedJobs.forEach((job) => downloadJob(job));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getCompressionRatio = (job: ConversionJob) => {
    if (!job.convertedSize) return null;
    const ratio =
      ((job.originalSize - job.convertedSize) / job.originalSize) * 100;
    return Math.round(ratio);
  };

  const getStatusIcon = (status: ConversionJob["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return (
          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
        );
    }
  };

  const pendingCount = jobs.filter((job) => job.status === "pending").length;
  const completedCount = jobs.filter(
    (job) => job.status === "completed",
  ).length;
  const errorCount = jobs.filter((job) => job.status === "error").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <ImgHeader
        title="Convert Images"
        description="Convert images between different formats with custom settings"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload and Jobs Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {/* Upload Area */}
                  <div
                    className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer mb-6"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Upload Images to Convert
                    </h3>
                    <p className="text-gray-500 mb-3">
                      Drag and drop multiple images here, or click to select
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports: JPG, PNG, WEBP, GIF, BMP, TIFF (Max 50MB each)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        e.target.files && handleFileSelect(e.target.files)
                      }
                      className="hidden"
                    />
                  </div>

                  {/* Conversion Jobs */}
                  {jobs.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <h4 className="font-medium">
                            Conversion Jobs ({jobs.length})
                          </h4>
                          <div className="flex space-x-2">
                            {pendingCount > 0 && (
                              <Badge variant="secondary">
                                {pendingCount} pending
                              </Badge>
                            )}
                            {completedCount > 0 && (
                              <Badge className="bg-green-100 text-green-800">
                                {completedCount} completed
                              </Badge>
                            )}
                            {errorCount > 0 && (
                              <Badge variant="destructive">
                                {errorCount} failed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Add More
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllJobs}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>

                      {/* Jobs List */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {jobs.map((job) => (
                          <div
                            key={job.id}
                            className="flex items-center space-x-3 p-3 border rounded-lg bg-white"
                          >
                            {getStatusIcon(job.status)}

                            <img
                              src={job.originalUrl}
                              alt={job.file.name}
                              className="w-12 h-12 object-cover rounded"
                            />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {job.file.name}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{formatFileSize(job.originalSize)}</span>
                                <span className="uppercase">
                                  {job.originalFormat}
                                </span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="uppercase">
                                  {job.targetFormat}
                                </span>
                                {job.convertedSize && (
                                  <>
                                    <span>
                                      {formatFileSize(job.convertedSize)}
                                    </span>
                                    {getCompressionRatio(job) !== null && (
                                      <Badge
                                        variant="secondary"
                                        className={`text-xs ${
                                          getCompressionRatio(job)! > 0
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {getCompressionRatio(job)! > 0
                                          ? "-"
                                          : "+"}
                                        {Math.abs(getCompressionRatio(job)!)}%
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                              {job.status === "processing" && (
                                <div className="mt-1">
                                  <Progress
                                    value={job.progress}
                                    className="h-1"
                                  />
                                </div>
                              )}
                              {job.status === "error" && job.error && (
                                <p className="text-xs text-red-600 mt-1">
                                  {job.error}
                                </p>
                              )}
                            </div>

                            <div className="flex space-x-1">
                              {job.status === "completed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadJob(job)}
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeJob(job.id)}
                                title="Remove"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Batch Progress */}
                      {isProcessing && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Converting images...</span>
                            <span>{Math.round(batchProgress)}%</span>
                          </div>
                          <Progress value={batchProgress} className="w-full" />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4 border-t">
                        <Button
                          onClick={convertAllJobs}
                          disabled={isProcessing || pendingCount === 0}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Converting...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Convert All ({pendingCount})
                            </>
                          )}
                        </Button>

                        {completedCount > 0 && (
                          <Button
                            variant="outline"
                            onClick={downloadAllCompleted}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Download All ({completedCount})
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Format Selection */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileType className="h-5 w-5 mr-2" />
                    Output Format
                  </h3>

                  <div className="space-y-3">
                    {Object.entries(formats).map(([key, format]) => (
                      <Button
                        key={key}
                        variant={targetFormat === key ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => setTargetFormat(key)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{format.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {format.description}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            {format.supports.transparency && (
                              <Badge variant="secondary" className="text-xs">
                                α
                              </Badge>
                            )}
                            {format.supports.animation && (
                              <Badge variant="secondary" className="text-xs">
                                🎬
                              </Badge>
                            )}
                            {format.supports.lossless && (
                              <Badge variant="secondary" className="text-xs">
                                ∞
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quality Settings */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Quality & Compression
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Quality: {quality}%
                      </Label>
                      <Slider
                        value={[quality]}
                        onValueChange={(value) => setQuality(value[0])}
                        min={10}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher quality = larger file size
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="enable-resize"
                          checked={enableResize}
                          onCheckedChange={setEnableResize}
                        />
                        <Label htmlFor="enable-resize" className="text-sm">
                          Resize images
                        </Label>
                      </div>

                      {enableResize && (
                        <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Width (px)</Label>
                              <Input
                                type="number"
                                placeholder="Auto"
                                value={resizeWidth || ""}
                                onChange={(e) =>
                                  setResizeWidth(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : null,
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Height (px)</Label>
                              <Input
                                type="number"
                                placeholder="Auto"
                                value={resizeHeight || ""}
                                onChange={(e) =>
                                  setResizeHeight(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : null,
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="maintain-aspect"
                              checked={maintainAspectRatio}
                              onCheckedChange={setMaintainAspectRatio}
                            />
                            <Label
                              htmlFor="maintain-aspect"
                              className="text-xs"
                            >
                              Maintain aspect ratio
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Format Info */}
              {targetFormat && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Format Info</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">
                          {formats[targetFormat].name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {formats[targetFormat].description}
                        </p>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium mb-2">Features:</h5>
                        <div className="flex flex-wrap gap-2">
                          {formats[targetFormat].supports.transparency && (
                            <Badge variant="secondary" className="text-xs">
                              Transparency
                            </Badge>
                          )}
                          {formats[targetFormat].supports.animation && (
                            <Badge variant="secondary" className="text-xs">
                              Animation
                            </Badge>
                          )}
                          {formats[targetFormat].supports.lossless && (
                            <Badge variant="secondary" className="text-xs">
                              Lossless
                            </Badge>
                          )}
                          {formats[targetFormat].supports.compression && (
                            <Badge variant="secondary" className="text-xs">
                              Compression
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium mb-2">Best for:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {formats[targetFormat].useCases.map(
                            (useCase, index) => (
                              <li key={index}>• {useCase}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Conversion Tips:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• WebP offers best compression for web</li>
                    <li>• PNG for graphics with transparency</li>
                    <li>• JPEG for photos and complex images</li>
                    <li>• TIFF for high-quality professional use</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
