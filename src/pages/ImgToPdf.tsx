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
import { convertImagesToPDF } from "../services/imageService";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { trackUsage } from "../services/usageService";
import {
  Upload,
  Download,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  Move,
  RotateCw,
  Maximize,
  Minimize,
  CopyPlus,
  Settings,
  Info,
  ArrowUp,
  ArrowDown,
  X,
  GripVertical,
} from "lucide-react";

interface ImageFile {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  dimensions?: { width: number; height: number };
}

interface PageSettings {
  format: string;
  orientation: "portrait" | "landscape";
  margin: number;
  quality: number;
  fitMode: "fit" | "fill" | "stretch";
}

const pageFormats = [
  { value: "A4", label: "A4 (210 × 297 mm)", width: 595, height: 842 },
  { value: "A3", label: "A3 (297 × 420 mm)", width: 842, height: 1191 },
  { value: "A5", label: "A5 (148 × 210 mm)", width: 420, height: 595 },
  { value: "Letter", label: "Letter (8.5 × 11 in)", width: 612, height: 792 },
  { value: "Legal", label: "Legal (8.5 × 14 in)", width: 612, height: 1008 },
  { value: "Tabloid", label: "Tabloid (11 × 17 in)", width: 792, height: 1224 },
];

const fitModes = [
  {
    value: "fit",
    label: "Fit to Page",
    description: "Scale image to fit within page margins",
  },
  {
    value: "fill",
    label: "Fill Page",
    description: "Scale image to fill the page, may crop",
  },
  {
    value: "stretch",
    label: "Stretch",
    description: "Stretch image to exact page size",
  },
];

export default function ImgToPdf() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [settings, setSettings] = useState<PageSettings>({
    format: "A4",
    orientation: "portrait",
    margin: 20,
    quality: 90,
    fitMode: "fit",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileSelect = useCallback(
    (files: FileList) => {
      const newImages: ImageFile[] = [];

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file.`,
            variant: "destructive",
          });
          return;
        }

        if (file.size > 25 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 25MB.`,
            variant: "destructive",
          });
          return;
        }

        const url = URL.createObjectURL(file);
        const imageFile: ImageFile = {
          id: generateId(),
          file,
          url,
          name: file.name,
          size: file.size,
        };

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          imageFile.dimensions = { width: img.width, height: img.height };
          setImages((prev) =>
            prev.map((img) => (img.id === imageFile.id ? imageFile : img)),
          );
        };
        img.src = url;

        newImages.push(imageFile);
      });

      setImages((prev) => [...prev, ...newImages]);
    },
    [toast],
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

  const removeImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      // Clean up object URL
      const removed = prev.find((img) => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const duplicateImage = (id: string) => {
    const image = images.find((img) => img.id === id);
    if (image) {
      const newImage: ImageFile = {
        ...image,
        id: generateId(),
        url: URL.createObjectURL(image.file),
      };
      setImages((prev) => {
        const index = prev.findIndex((img) => img.id === id);
        const updated = [...prev];
        updated.splice(index + 1, 0, newImage);
        return updated;
      });
    }
  };

  const clearAllImages = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  const convertToPDF = async () => {
    if (images.length === 0) return;

    try {
      setIsProcessing(true);
      setProgress(0);

      const pdfOptions = {
        pageFormat: settings.format,
        orientation: settings.orientation,
        margin: settings.margin,
        quality: settings.quality / 100,
        fitMode: settings.fitMode,
        onProgress: (progressValue: number) => {
          setProgress(progressValue);
        },
      };

      setProgress(10);

      const pdfBlob = await convertImagesToPDF(
        images.map((img) => img.file),
        pdfOptions,
      );

      setProgress(100);

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `images-to-pdf-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (user) {
        await trackUsage(user.uid, "imgToPdf", images.length);
      }

      toast({
        title: "PDF created successfully!",
        description: `${images.length} images converted to PDF.`,
      });
    } catch (error) {
      console.error("Error converting to PDF:", error);
      toast({
        title: "Conversion failed",
        description:
          "An error occurred while creating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop2 = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      moveImage(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTotalSize = () => {
    return images.reduce((total, img) => total + img.size, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      <ImgHeader
        title="Images to PDF"
        description="Convert multiple images into a single PDF document"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload and Images Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {/* Upload Area */}
                  <div
                    className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer mb-6"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Upload Images for PDF
                    </h3>
                    <p className="text-gray-500 mb-3">
                      Drag and drop multiple images here, or click to select
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports: JPG, PNG, WEBP, BMP, TIFF (Max 25MB each)
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

                  {/* Images List */}
                  {images.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          Images ({images.length})
                        </h4>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add More
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllImages}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear All
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {images.map((image, index) => (
                          <div
                            key={image.id}
                            className={`flex items-center space-x-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors ${
                              draggedIndex === index ? "opacity-50" : ""
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop2(e, index)}
                            onDragEnd={handleDragEnd}
                          >
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />

                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-12 h-12 object-cover rounded"
                            />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {image.name}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{formatFileSize(image.size)}</span>
                                {image.dimensions && (
                                  <span>
                                    {image.dimensions.width}×
                                    {image.dimensions.height}
                                  </span>
                                )}
                              </div>
                            </div>

                            <Badge variant="secondary">Page {index + 1}</Badge>

                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicateImage(image.id)}
                                title="Duplicate"
                              >
                                <CopyPlus className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  moveImage(index, Math.max(0, index - 1))
                                }
                                disabled={index === 0}
                                title="Move Up"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  moveImage(
                                    index,
                                    Math.min(images.length - 1, index + 1),
                                  )
                                }
                                disabled={index === images.length - 1}
                                title="Move Down"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeImage(image.id)}
                                title="Remove"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Processing Progress */}
                      {isProcessing && (
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Creating PDF...</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="w-full" />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4 border-t">
                        <Button
                          onClick={convertToPDF}
                          disabled={isProcessing || images.length === 0}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Creating PDF...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              Create PDF ({images.length} images)
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    PDF Settings
                  </h3>

                  <div className="space-y-4">
                    {/* Page Format */}
                    <div>
                      <Label className="text-sm font-medium">Page Format</Label>
                      <Select
                        value={settings.format}
                        onValueChange={(value) =>
                          setSettings((prev) => ({ ...prev, format: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pageFormats.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Orientation */}
                    <div>
                      <Label className="text-sm font-medium">Orientation</Label>
                      <Select
                        value={settings.orientation}
                        onValueChange={(value: "portrait" | "landscape") =>
                          setSettings((prev) => ({
                            ...prev,
                            orientation: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fit Mode */}
                    <div>
                      <Label className="text-sm font-medium">Image Fit</Label>
                      <Select
                        value={settings.fitMode}
                        onValueChange={(value: "fit" | "fill" | "stretch") =>
                          setSettings((prev) => ({ ...prev, fitMode: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fitModes.map((mode) => (
                            <SelectItem key={mode.value} value={mode.value}>
                              <div>
                                <div>{mode.label}</div>
                                <div className="text-xs text-gray-500">
                                  {mode.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Margin */}
                    <div>
                      <Label className="text-sm font-medium">
                        Margin: {settings.margin}mm
                      </Label>
                      <Slider
                        value={[settings.margin]}
                        onValueChange={(value) =>
                          setSettings((prev) => ({ ...prev, margin: value[0] }))
                        }
                        min={0}
                        max={50}
                        step={5}
                        className="mt-2"
                      />
                    </div>

                    {/* Quality */}
                    <div>
                      <Label className="text-sm font-medium">
                        Image Quality: {settings.quality}%
                      </Label>
                      <Slider
                        value={[settings.quality]}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            quality: value[0],
                          }))
                        }
                        min={50}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher quality produces larger PDF files
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              {images.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Images:</span>
                        <span className="font-medium">{images.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Size:</span>
                        <span className="font-medium">
                          {formatFileSize(getTotalSize())}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>PDF Pages:</span>
                        <span className="font-medium">{images.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Format:</span>
                        <span className="font-medium">
                          {settings.format} {settings.orientation}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tips:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Drag images to reorder pages</li>
                    <li>• Use "Fit to Page" for best results</li>
                    <li>• Higher quality = larger file size</li>
                    <li>• All images will be in a single PDF</li>
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
