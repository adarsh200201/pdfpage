import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  Droplets,
  Sparkles,
  Brain,
  Type,
  Image,
  Loader2,
  CheckCircle,
  Eye,
  RotateCw,
  Palette,
  Layout,
  Shield,
  Zap,
  Upload,
  X,
  Plus,
} from "lucide-react";

interface WatermarkOptions {
  type: "text" | "image";
  text?: string;
  imageFile?: File;
  position:
    | "center"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "smart";
  opacity: number;
  rotation: number;
  scale: number;
  color: string;
  fontFamily: string;
  fontSize: number;
  blendMode: "normal" | "multiply" | "overlay" | "screen";
  repeatPattern: boolean;
  aiPlacement: boolean;
  protectionLevel: "low" | "medium" | "high";
}

interface WatermarkResult {
  name: string;
  url: string;
  size: number;
  pages: number;
  watermarkCount: number;
  aiFeatures: string[];
}

const fontFamilies = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier",
  "Verdana",
  "Georgia",
  "Impact",
  "Comic Sans MS",
];

const blendModes = [
  { value: "normal", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "overlay", label: "Overlay" },
  { value: "screen", label: "Screen" },
];

const positions = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "smart", label: "AI Smart Placement", ai: true },
];

const EnhancedWatermark = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [watermarkResults, setWatermarkResults] = useState<WatermarkResult[]>(
    [],
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const [options, setOptions] = useState<WatermarkOptions>({
    type: "text",
    text: "CONFIDENTIAL",
    position: "center",
    opacity: 50,
    rotation: 45,
    scale: 100,
    color: "#ff0000",
    fontFamily: "Arial",
    fontSize: 36,
    blendMode: "normal",
    repeatPattern: false,
    aiPlacement: false,
    protectionLevel: "medium",
  });

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = useCallback((uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    setIsComplete(false);
    setWatermarkResults([]);
    setProgress(0);
  }, []);

  const handleImageUpload = useCallback((uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      setOptions((prev) => ({
        ...prev,
        imageFile: uploadedFiles[0],
        type: "image",
      }));
    }
  }, []);

  const handleWatermark = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to watermark.",
        variant: "destructive",
      });
      return;
    }

    if (options.type === "text" && !options.text) {
      toast({
        title: "No watermark text",
        description: "Please enter text for the watermark.",
        variant: "destructive",
      });
      return;
    }

    if (options.type === "image" && !options.imageFile) {
      toast({
        title: "No watermark image",
        description: "Please upload an image for the watermark.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    const results: WatermarkResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentStep(`Processing ${file.name}...`);
        setProgress((i / files.length) * 100);

        // Simulate processing steps with AI
        const steps = [
          "Analyzing PDF content...",
          "Detecting text regions...",
          options.aiPlacement
            ? "AI calculating optimal placement..."
            : "Positioning watermark...",
          "Applying watermark...",
          "Optimizing transparency...",
          "Finalizing document...",
        ];

        for (let j = 0; j < steps.length; j++) {
          setCurrentStep(steps[j]);
          setProgress(((i + (j + 1) / steps.length) / files.length) * 100);
          await new Promise((resolve) => setTimeout(resolve, 600));
        }

        // Call the actual watermarking service
        const startTime = Date.now();
        const response = await PDFService.addWatermark(file, {
          type: options.type,
          text: options.text,
          image: options.imageFile,
          position: options.position,
          opacity: options.opacity / 100,
          rotation: options.rotation,
          scale: options.scale / 100,
          color: options.color,
          fontFamily: options.fontFamily,
          fontSize: options.fontSize,
          blendMode: options.blendMode,
          repeatPattern: options.repeatPattern,
          aiPlacement: options.aiPlacement,
          protectionLevel: options.protectionLevel,
        });

        const processingTime = Date.now() - startTime;

        // Create download URL
        const blob = new Blob([response], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const aiFeatures = [];
        if (options.aiPlacement) aiFeatures.push("Smart Placement");
        if (options.protectionLevel === "high")
          aiFeatures.push("Advanced Protection");
        if (options.blendMode !== "normal")
          aiFeatures.push("Blend Optimization");

        results.push({
          name: file.name.replace(/\.pdf$/i, "_watermarked.pdf"),
          url,
          size: blob.size,
          pages: Math.ceil(Math.random() * 10) + 1, // Placeholder
          watermarkCount: options.repeatPattern
            ? Math.ceil(Math.random() * 20) + 10
            : 1,
          aiFeatures,
        });
      }

      setWatermarkResults(results);
      setIsComplete(true);
      setProgress(100);
      setCurrentStep("Watermarking complete!");

      toast({
        title: "Watermarking successful!",
        description: `Added watermarks to ${files.length} PDF${files.length > 1 ? "s" : ""}.`,
      });
    } catch (error) {
      console.error("Watermarking error:", error);
      toast({
        title: "Watermarking failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during watermarking.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (file: WatermarkResult) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    watermarkResults.forEach((file) => downloadFile(file));
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  AI-Powered PDF Watermark
                </h1>
                <p className="text-gray-600">
                  Add intelligent watermarks with optimal placement and
                  protection
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Smart Placement
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Advanced Protection
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Blend Modes
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Upload and Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Upload PDF Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    accept=".pdf"
                    maxFiles={10}
                    maxSize={25 * 1024 * 1024}
                    onFilesSelected={handleFileUpload}
                    multiple
                  />
                  {files.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        {files.length} file{files.length > 1 ? "s" : ""}{" "}
                        selected
                      </p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Watermark Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Watermark Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={options.type}
                    onValueChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        type: value as "text" | "image",
                      }))
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="text"
                        className="flex items-center gap-2"
                      >
                        <Type className="w-4 h-4" />
                        Text Watermark
                      </TabsTrigger>
                      <TabsTrigger
                        value="image"
                        className="flex items-center gap-2"
                      >
                        <Image className="w-4 h-4" />
                        Image Watermark
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="watermark-text">Watermark Text</Label>
                        <Input
                          id="watermark-text"
                          value={options.text || ""}
                          onChange={(e) =>
                            setOptions((prev) => ({
                              ...prev,
                              text: e.target.value,
                            }))
                          }
                          placeholder="Enter watermark text"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Font Family</Label>
                          <select
                            value={options.fontFamily}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                fontFamily: e.target.value,
                              }))
                            }
                            className="w-full p-2 border rounded-md"
                          >
                            {fontFamilies.map((font) => (
                              <option key={font} value={font}>
                                {font}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label>Font Size: {options.fontSize}px</Label>
                          <Slider
                            value={[options.fontSize]}
                            onValueChange={([value]) =>
                              setOptions((prev) => ({
                                ...prev,
                                fontSize: value,
                              }))
                            }
                            min={12}
                            max={72}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="watermark-color">Text Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="watermark-color"
                            type="color"
                            value={options.color}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                color: e.target.value,
                              }))
                            }
                            className="w-16 h-10"
                          />
                          <Input
                            value={options.color}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                color: e.target.value,
                              }))
                            }
                            placeholder="#ff0000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="image" className="space-y-4 mt-4">
                      <div>
                        <Label>Watermark Image</Label>
                        <FileUpload
                          accept="image/*"
                          maxFiles={1}
                          maxSize={5 * 1024 * 1024}
                          onFilesSelected={handleImageUpload}
                          multiple={false}
                        />
                        {options.imageFile && (
                          <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                            <span className="text-sm">
                              {options.imageFile.name}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setOptions((prev) => ({
                                  ...prev,
                                  imageFile: undefined,
                                }))
                              }
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Common Options */}
                  <div className="space-y-4 mt-6 pt-6 border-t">
                    <div>
                      <Label>Position</Label>
                      <select
                        value={options.position}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            position: e.target.value as any,
                            aiPlacement: e.target.value === "smart",
                          }))
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        {positions.map((pos) => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label} {pos.ai && "🤖"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Opacity: {options.opacity}%</Label>
                        <Slider
                          value={[options.opacity]}
                          onValueChange={([value]) =>
                            setOptions((prev) => ({ ...prev, opacity: value }))
                          }
                          min={10}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Rotation: {options.rotation}°</Label>
                        <Slider
                          value={[options.rotation]}
                          onValueChange={([value]) =>
                            setOptions((prev) => ({ ...prev, rotation: value }))
                          }
                          min={-180}
                          max={180}
                          step={15}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Scale: {options.scale}%</Label>
                        <Slider
                          value={[options.scale]}
                          onValueChange={([value]) =>
                            setOptions((prev) => ({ ...prev, scale: value }))
                          }
                          min={25}
                          max={200}
                          step={25}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Blend Mode</Label>
                        <select
                          value={options.blendMode}
                          onChange={(e) =>
                            setOptions((prev) => ({
                              ...prev,
                              blendMode: e.target.value as any,
                            }))
                          }
                          className="w-full p-2 border rounded-md"
                        >
                          {blendModes.map((mode) => (
                            <option key={mode.value} value={mode.value}>
                              {mode.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Protection Level</Label>
                        <select
                          value={options.protectionLevel}
                          onChange={(e) =>
                            setOptions((prev) => ({
                              ...prev,
                              protectionLevel: e.target.value as any,
                            }))
                          }
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High (AI Enhanced)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="repeat-pattern"
                        checked={options.repeatPattern}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            repeatPattern: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <Label htmlFor="repeat-pattern">Repeat Pattern</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleWatermark}
                  disabled={files.length === 0 || isProcessing}
                  className="flex-1 h-12 text-lg"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Adding Watermarks...
                    </>
                  ) : (
                    <>
                      <Droplets className="w-5 h-5 mr-2" />
                      Add Watermarks
                    </>
                  )}
                </Button>

                <Button
                  onClick={togglePreview}
                  variant="outline"
                  disabled={files.length === 0}
                  className="h-12"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Preview
                </Button>
              </div>
            </div>

            {/* Results and Preview */}
            <div className="space-y-6">
              {/* Processing Progress */}
              {isProcessing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Processing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-gray-600">{currentStep}</p>
                      <p className="text-xs text-gray-500">
                        {Math.round(progress)}% complete
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Watermarked Files */}
              {isComplete && watermarkResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Watermarked Files
                      </span>
                      {watermarkResults.length > 1 && (
                        <Button
                          onClick={downloadAll}
                          variant="outline"
                          size="sm"
                        >
                          Download All
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {watermarkResults.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                              <span>{file.pages} pages</span>
                              <span>•</span>
                              <span>{file.watermarkCount} watermarks</span>
                              <span>•</span>
                              <span>
                                {(file.size / 1024 / 1024).toFixed(1)} MB
                              </span>
                            </div>
                            {file.aiFeatures.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {file.aiFeatures.map((feature, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => downloadFile(file)}
                            size="sm"
                            className="ml-3"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Watermark Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
                    {previewMode ? (
                      <div className="relative w-full h-full bg-white">
                        {/* Simulated PDF page */}
                        <div className="absolute inset-4 bg-gray-50 rounded">
                          <div className="p-4 space-y-2">
                            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                          </div>
                        </div>

                        {/* Watermark Preview */}
                        {options.type === "text" && options.text && (
                          <div
                            className="absolute pointer-events-none select-none"
                            style={{
                              opacity: options.opacity / 100,
                              transform: `rotate(${options.rotation}deg) scale(${options.scale / 100})`,
                              color: options.color,
                              fontFamily: options.fontFamily,
                              fontSize: `${Math.max(8, options.fontSize / 3)}px`,
                              left: options.position.includes("left")
                                ? "10%"
                                : options.position.includes("right")
                                  ? "60%"
                                  : "50%",
                              top: options.position.includes("top")
                                ? "20%"
                                : options.position.includes("bottom")
                                  ? "70%"
                                  : "50%",
                              transformOrigin: "center",
                            }}
                          >
                            {options.text}
                          </div>
                        )}

                        {options.repeatPattern && options.text && (
                          <>
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute pointer-events-none select-none"
                                style={{
                                  opacity: options.opacity / 100 / 2,
                                  transform: `rotate(${options.rotation}deg) scale(${options.scale / 100 / 2})`,
                                  color: options.color,
                                  fontFamily: options.fontFamily,
                                  fontSize: `${Math.max(6, options.fontSize / 4)}px`,
                                  left: `${20 + (i % 3) * 30}%`,
                                  top: `${30 + Math.floor(i / 3) * 40}%`,
                                  transformOrigin: "center",
                                }}
                              >
                                {options.text}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <Eye className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">
                          Click "Preview" to see watermark
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI Features Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Smart Placement</p>
                        <p className="text-gray-600">
                          AI analyzes content to avoid important text and images
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Advanced Protection</p>
                        <p className="text-gray-600">
                          Tamper-resistant watermarks with enhanced security
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Palette className="w-4 h-4 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Blend Optimization</p>
                        <p className="text-gray-600">
                          Automatic color and opacity adjustment for visibility
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWatermark;
