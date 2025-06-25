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
import { removeBackground } from "../services/imageService";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { trackUsage } from "../services/usageService";
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
  Magic,
  Sparkles,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface BackgroundType {
  id: string;
  label: string;
  icon: any;
  description: string;
}

const backgroundTypes: BackgroundType[] = [
  {
    id: "auto",
    label: "Auto Detect",
    icon: Magic,
    description: "Automatically detect and remove background",
  },
  {
    id: "person",
    label: "Person",
    icon: User,
    description: "Optimized for people and portraits",
  },
  {
    id: "object",
    label: "Objects",
    icon: Shirt,
    description: "Best for products and objects",
  },
  {
    id: "vehicle",
    label: "Vehicles",
    icon: Car,
    description: "Cars, bikes, and other vehicles",
  },
  {
    id: "animal",
    label: "Animals",
    icon: Cat,
    description: "Pets and wildlife",
  },
  {
    id: "nature",
    label: "Nature",
    icon: TreePine,
    description: "Plants, trees, and natural objects",
  },
];

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
}

export default function ImgRemoveBg() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>("");
  const [processedImage, setProcessedImage] = useState<string>("");
  const [maskImage, setMaskImage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedType, setSelectedType] = useState<string>("auto");
  const [quality, setQuality] = useState(80);
  const [featherEdges, setFeatherEdges] = useState(true);
  const [edgeSmoothing, setEdgeSmoothing] = useState(2);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showMask, setShowMask] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: "analyze", label: "Analyzing image", status: "pending" },
    { id: "detect", label: "Detecting objects", status: "pending" },
    { id: "segment", label: "Creating mask", status: "pending" },
    { id: "refine", label: "Refining edges", status: "pending" },
    { id: "render", label: "Rendering result", status: "pending" },
  ]);

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

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result);
        setProcessedImage("");
        setMaskImage("");

        // Reset processing steps
        setProcessingSteps((steps) =>
          steps.map((step) => ({ ...step, status: "pending" })),
        );
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

  const updateProcessingStep = (
    stepId: string,
    status: ProcessingStep["status"],
  ) => {
    setProcessingSteps((steps) =>
      steps.map((step) => (step.id === stepId ? { ...step, status } : step)),
    );
  };

  const processImage = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setProgress(0);

      // Simulate processing steps
      updateProcessingStep("analyze", "processing");
      setProgress(10);
      await new Promise((resolve) => setTimeout(resolve, 500));

      updateProcessingStep("analyze", "completed");
      updateProcessingStep("detect", "processing");
      setProgress(25);
      await new Promise((resolve) => setTimeout(resolve, 800));

      updateProcessingStep("detect", "completed");
      updateProcessingStep("segment", "processing");
      setProgress(50);

      const options = {
        type: selectedType,
        quality: quality / 100,
        featherEdges,
        edgeSmoothing: edgeSmoothing / 10,
      };

      const result = await removeBackground(selectedFile, options);

      updateProcessingStep("segment", "completed");
      updateProcessingStep("refine", "processing");
      setProgress(75);
      await new Promise((resolve) => setTimeout(resolve, 500));

      updateProcessingStep("refine", "completed");
      updateProcessingStep("render", "processing");
      setProgress(90);

      const processedUrl = URL.createObjectURL(result.processedImage);
      setProcessedImage(processedUrl);

      if (result.maskImage) {
        const maskUrl = URL.createObjectURL(result.maskImage);
        setMaskImage(maskUrl);
      }

      updateProcessingStep("render", "completed");
      setProgress(100);

      if (user) {
        await trackUsage(user.uid, "imgRemoveBg", 1);
      }

      toast({
        title: "Background removed successfully!",
        description: "Your image is ready for download.",
      });
    } catch (error) {
      console.error("Error removing background:", error);

      // Mark current processing step as error
      const currentStep = processingSteps.find(
        (step) => step.status === "processing",
      );
      if (currentStep) {
        updateProcessingStep(currentStep.id, "error");
      }

      toast({
        title: "Processing failed",
        description:
          "An error occurred while removing the background. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetProcessing = () => {
    setProcessedImage("");
    setMaskImage("");
    setProgress(0);
    setProcessingSteps((steps) =>
      steps.map((step) => ({ ...step, status: "pending" })),
    );
  };

  const getStepIcon = (status: ProcessingStep["status"]) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <ImgHeader
        title="Remove Background"
        description="Automatically remove backgrounds from your images with AI"
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
                      className="border-2 border-dashed border-purple-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Upload Image to Remove Background
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Drag and drop your image here, or click to select
                      </p>
                      <p className="text-sm text-gray-400">
                        Supports: JPG, PNG, WEBP (Max 10MB)
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
                      {/* Image Preview */}
                      <Tabs defaultValue="result" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="original">Original</TabsTrigger>
                          <TabsTrigger value="result">Result</TabsTrigger>
                          <TabsTrigger value="mask" disabled={!maskImage}>
                            Mask
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="original" className="mt-4">
                          <div className="relative bg-gray-100 rounded-lg p-4">
                            <img
                              src={originalImage}
                              alt="Original"
                              className="w-full h-auto max-h-96 object-contain mx-auto"
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="result" className="mt-4">
                          <div className="relative">
                            {/* Checkered background for transparency */}
                            <div
                              className="absolute inset-0 opacity-20 rounded-lg"
                              style={{
                                backgroundImage: `
                                  linear-gradient(45deg, #ccc 25%, transparent 25%), 
                                  linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                                  linear-gradient(45deg, transparent 75%, #ccc 75%), 
                                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                                `,
                                backgroundSize: "20px 20px",
                                backgroundPosition:
                                  "0 0, 0 10px, 10px -10px, -10px 0px",
                              }}
                            />
                            <div className="relative bg-white/50 rounded-lg p-4">
                              <img
                                src={processedImage || originalImage}
                                alt="Processed"
                                className="w-full h-auto max-h-96 object-contain mx-auto"
                              />
                              {!processedImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                  <div className="text-center">
                                    <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                                    <p className="text-gray-600">
                                      Background removal result will appear here
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="mask" className="mt-4">
                          {maskImage && (
                            <div className="relative bg-gray-100 rounded-lg p-4">
                              <img
                                src={maskImage}
                                alt="Mask"
                                className="w-full h-auto max-h-96 object-contain mx-auto"
                              />
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>

                      {/* Processing Steps */}
                      {isProcessing && (
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-3">
                              Processing Steps
                            </h4>
                            <div className="space-y-2">
                              {processingSteps.map((step) => (
                                <div
                                  key={step.id}
                                  className="flex items-center space-x-3"
                                >
                                  {getStepIcon(step.status)}
                                  <span
                                    className={`text-sm ${
                                      step.status === "completed"
                                        ? "text-green-600"
                                        : step.status === "error"
                                          ? "text-red-600"
                                          : step.status === "processing"
                                            ? "text-blue-600"
                                            : "text-gray-500"
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

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

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={processImage}
                          disabled={isProcessing}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Magic className="h-4 w-4 mr-2" />
                              Remove Background
                            </>
                          )}
                        </Button>

                        {processedImage && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() =>
                                downloadImage(
                                  processedImage,
                                  `no-bg-${selectedFile?.name || "image.png"}`,
                                )
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download PNG
                            </Button>

                            {maskImage && (
                              <Button
                                variant="outline"
                                onClick={() =>
                                  downloadImage(
                                    maskImage,
                                    `mask-${selectedFile?.name || "image.png"}`,
                                  )
                                }
                              >
                                <Layers className="h-4 w-4 mr-2" />
                                Download Mask
                              </Button>
                            )}
                          </>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          New Image
                        </Button>

                        {processedImage && (
                          <Button variant="outline" onClick={resetProcessing}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Reset
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
              {selectedFile && (
                <>
                  {/* Background Type */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Detection Type
                      </h3>
                      <div className="space-y-2">
                        {backgroundTypes.map((type) => (
                          <Button
                            key={type.id}
                            variant={
                              selectedType === type.id ? "default" : "outline"
                            }
                            className="w-full justify-start text-left h-auto p-3"
                            onClick={() => setSelectedType(type.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <type.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {type.description}
                                </div>
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
                      <h3 className="text-lg font-semibold mb-4">
                        Quality Settings
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Output Quality: {quality}%
                          </Label>
                          <Slider
                            value={[quality]}
                            onValueChange={(value) => setQuality(value[0])}
                            min={50}
                            max={100}
                            step={5}
                            className="mt-2"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Higher quality produces better results but takes
                            longer
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="feather-edges"
                              checked={featherEdges}
                              onCheckedChange={setFeatherEdges}
                            />
                            <Label htmlFor="feather-edges" className="text-sm">
                              Feather edges
                            </Label>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">
                              Edge Smoothing: {edgeSmoothing}
                            </Label>
                            <Slider
                              value={[edgeSmoothing]}
                              onValueChange={(value) =>
                                setEdgeSmoothing(value[0])
                              }
                              min={0}
                              max={5}
                              step={1}
                              className="mt-2"
                              disabled={!featherEdges}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Adjust edge smoothness for better blending
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* File Information */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">File Info</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Name:</span>
                          <span className="text-right break-all">
                            {selectedFile.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span>{selectedFile.type}</span>
                        </div>
                        {processedImage && (
                          <>
                            <Separator />
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-800"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Processed
                              </Badge>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tips */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Tips for Best Results
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Use high-contrast images with clear subjects</li>
                        <li>• Avoid cluttered backgrounds</li>
                        <li>• Ensure good lighting on the main subject</li>
                        <li>
                          • Choose the right detection type for your image
                        </li>
                        <li>
                          • Higher quality settings work better for detailed
                          images
                        </li>
                      </ul>
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
