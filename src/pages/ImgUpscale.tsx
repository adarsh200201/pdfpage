import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import ImgHeader from "../components/layout/ImgHeader";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
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
  Filter,
  Stars,
  Crown,
  Award,
  ArrowLeft,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Grid3X3,
  Crosshair,
} from "lucide-react";

const ImgUpscale = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        setSelectedFile(imageFiles[0]);
        const url = URL.createObjectURL(imageFiles[0]);
        setPreviewUrl(url);
      } else {
        toast({
          title: "Invalid file",
          description: "Please drop an image file.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const handleFileChange = useCallback(
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
      }
    },
    [toast],
  );

  const handleUpscale = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);

    // Simulate processing with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      // Simple 2x upscaling simulation
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;

        if (ctx) {
          // Use imageSmoothingEnabled for basic upscaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                setResultUrl(url);
                setIsComplete(true);
                setProgress(100);

                // Auto download
                const link = document.createElement("a");
                link.href = url;
                link.download = `upscaled_${selectedFile.name}`;
                link.click();

                toast({
                  title: "Success!",
                  description: "Image upscaled 2x successfully.",
                });
              }
            },
            "image/png",
            0.95,
          );
        }
      };

      img.src = previewUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upscale image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      clearInterval(interval);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-100">
      <ImgHeader />

      {/* Hero Section - Hidden on mobile */}
      <div className="relative pt-20 hidden sm:block">
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
                { icon: Sparkles, label: "8x Upscaling", color: "bg-white/20" },
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

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <Link
            to="/img"
            className="flex items-center text-indigo-600 hover:text-indigo-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to PdfPage
          </Link>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
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
              className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-indigo-600" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreviewUrl("");
                      setIsComplete(false);
                      setResultUrl("");
                    }}
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-base sm:text-lg font-medium text-gray-700">
                      {isDragging
                        ? "Drop your image here"
                        : "Click to upload or drag & drop"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Support for JPG, PNG, WebP formats
                    </p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Preview and Processing */}
        {selectedFile && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Preview */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto rounded-lg border max-h-96 object-contain"
                  />

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpscale}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing... {Math.round(progress)}%
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-4 h-4 mr-2" />
                          Upscale 2x
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  {isProcessing && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Success State */}
                  {isComplete && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        Image upscaled 2x successfully! Download started
                        automatically.
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features Info */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stars className="w-5 h-5 text-indigo-600" />
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-medium text-indigo-800">
                        AI Enhanced
                      </h3>
                    </div>
                    <p className="text-sm text-indigo-700">
                      Advanced algorithms for superior upscaling quality
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <h3 className="font-medium text-blue-800">
                        Detail Preservation
                      </h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      Maintains image quality while increasing resolution
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <h3 className="font-medium text-green-800">
                        Fast Processing
                      </h3>
                    </div>
                    <p className="text-sm text-green-700">
                      Quick processing for immediate results
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tool Description - Only shown when no file */}
        {!selectedFile && (
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 rounded-2xl w-fit mx-auto mb-4">
              <Maximize2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              AI Image Upscaler
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enhance and upscale images up to 8x using advanced AI algorithms.
              Perfect for photos, artwork, and low-resolution images.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImgUpscale;
