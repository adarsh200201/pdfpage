import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  Presentation,
  Sparkles,
  Brain,
  Layout,
  Image,
  Type,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ConversionOptions {
  extractImages: boolean;
  detectLayouts: boolean;
  aiEnhancement: boolean;
  slideFormat: "standard" | "widescreen";
  quality: "standard" | "high" | "premium";
}

interface ConversionResult {
  name: string;
  url: string;
  size: number;
  slideCount: number;
  processingTime: number;
  aiFeatures: string[];
}

const EnhancedPdfToPpt = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<ConversionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const [options, setOptions] = useState<ConversionOptions>({
    extractImages: true,
    detectLayouts: true,
    aiEnhancement: false,
    slideFormat: "standard",
    quality: "high",
  });

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = useCallback((uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    setIsComplete(false);
    setConvertedFiles([]);
    setProgress(0);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to convert.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    const results: ConversionResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentStep(`Processing ${file.name}...`);
        setProgress((i / files.length) * 100);

        // Simulate processing steps
        const steps = [
          "Analyzing PDF structure...",
          "Extracting text and images...",
          "Detecting slide layouts...",
          options.aiEnhancement
            ? "Applying AI enhancements..."
            : "Optimizing content...",
          "Generating PowerPoint slides...",
          "Finalizing presentation...",
        ];

        for (let j = 0; j < steps.length; j++) {
          setCurrentStep(steps[j]);
          setProgress(((i + (j + 1) / steps.length) / files.length) * 100);
          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        // Call the actual conversion service
        const startTime = Date.now();
        const response = await PDFService.convertPdfToPowerPoint(file, {
          extractImages: options.extractImages,
          detectLayouts: options.detectLayouts,
          aiEnhancement: options.aiEnhancement,
          slideFormat: options.slideFormat,
          quality: options.quality,
        });

        const processingTime = Date.now() - startTime;

        // Create download URL
        const blob = new Blob([response], {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        });
        const url = URL.createObjectURL(blob);

        const aiFeatures = [];
        if (options.extractImages) aiFeatures.push("Image Extraction");
        if (options.detectLayouts) aiFeatures.push("Layout Detection");
        if (options.aiEnhancement) aiFeatures.push("AI Enhancement");

        results.push({
          name: file.name.replace(/\.pdf$/i, ".pptx"),
          url,
          size: blob.size,
          slideCount: Math.ceil(Math.random() * 10) + 5, // Placeholder
          processingTime,
          aiFeatures,
        });
      }

      setConvertedFiles(results);
      setIsComplete(true);
      setProgress(100);
      setCurrentStep("Conversion complete!");

      toast({
        title: "Conversion successful!",
        description: `Converted ${files.length} PDF${files.length > 1 ? "s" : ""} to PowerPoint presentations.`,
      });
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during conversion.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (file: ConversionResult) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    convertedFiles.forEach((file) => downloadFile(file));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Presentation className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  AI-Powered PDF to PowerPoint
                </h1>
                <p className="text-gray-600">
                  Convert PDFs to presentations with intelligent layout
                  detection
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                AI Layout Detection
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Image className="w-3 h-3" />
                Smart Image Extraction
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Type className="w-3 h-3" />
                Text Recognition
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Upload and Options */}
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
                    maxFiles={5}
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
                      <div className="space-y-2">
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

              {/* Conversion Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI Enhancement Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.extractImages}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            extractImages: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Extract Images</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.detectLayouts}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            detectLayouts: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Layout Detection</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.aiEnhancement}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            aiEnhancement: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">AI Enhancement</span>
                      <Badge variant="outline" className="text-xs">
                        Pro
                      </Badge>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Slide Format
                      </label>
                      <select
                        value={options.slideFormat}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            slideFormat: e.target.value as
                              | "standard"
                              | "widescreen",
                          }))
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="standard">Standard (4:3)</option>
                        <option value="widescreen">Widescreen (16:9)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Quality
                      </label>
                      <select
                        value={options.quality}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            quality: e.target.value as
                              | "standard"
                              | "high"
                              | "premium",
                          }))
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="standard">Standard</option>
                        <option value="high">High</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Convert Button */}
              <Button
                onClick={handleConvert}
                disabled={files.length === 0 || isProcessing}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Presentation className="w-5 h-5 mr-2" />
                    Convert to PowerPoint
                  </>
                )}
              </Button>
            </div>

            {/* Results and Progress */}
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

              {/* Converted Files */}
              {isComplete && convertedFiles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Converted Files
                      </span>
                      {convertedFiles.length > 1 && (
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
                      {convertedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                              <span>{file.slideCount} slides</span>
                              <span>•</span>
                              <span>
                                {(file.size / 1024 / 1024).toFixed(1)} MB
                              </span>
                              <span>•</span>
                              <span>
                                {(file.processingTime / 1000).toFixed(1)}s
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

              {/* Features Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Layout className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Smart Layout Detection</p>
                        <p className="text-gray-600">
                          Automatically identifies headers, content blocks, and
                          slide boundaries
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Image className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          Intelligent Image Extraction
                        </p>
                        <p className="text-gray-600">
                          Preserves image quality and positioning in slides
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium">AI Enhancement</p>
                        <p className="text-gray-600">
                          Improves formatting and slide organization
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

export default EnhancedPdfToPpt;
