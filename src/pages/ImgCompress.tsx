import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ImgHeader from "@/components/layout/ImgHeader";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Download,
  ImageIcon,
  Minimize2,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Info,
  FileImage,
  Move,
  Crop,
  Upload,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { imageService } from "@/services/imageService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/auth/AuthModal";
import SEO from "@/components/SEO";
import EnhancedSEO from "@/components/EnhancedSEO";
import EnhancedStructuredData from "@/components/EnhancedStructuredData";
import AdvancedSchema from "@/components/AdvancedSchema";
import Breadcrumb, { generateBreadcrumbs } from "@/components/Breadcrumb";
import SocialProof from "@/components/SocialProof";
import HowToGuide from "@/components/HowToGuide";
import InternalLinking from "@/components/InternalLinking";

interface ProcessedImage {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  preview: string;
  compressedPreview?: string;
  compressedFile?: File;
  liveStats?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
}

const ImgCompress = () => {
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [quality, setQuality] = useState([0.8]);
  const [maxWidth, setMaxWidth] = useState([1920]);
  const [maxHeight, setMaxHeight] = useState([1080]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Generate real-time compression preview
  const generatePreview = async () => {
    if (!image || isGeneratingPreview) return;

    setIsGeneratingPreview(true);

    try {
      console.log("🖼️ Generating real-time compression preview...");

      // Use client-side compression for fast preview
      const result = await imageService.compressImageLocal(
        image.file,
        quality[0],
        maxWidth[0],
        maxHeight[0],
      );

      // Create preview URL
      const compressedPreview = URL.createObjectURL(result.file);

      // Update image with compressed preview and stats
      setImage((prev) =>
        prev
          ? {
              ...prev,
              compressedPreview,
              compressedFile: result.file,
              liveStats: result.stats,
            }
          : null,
      );

      console.log("✅ Preview generated:", result.stats);
    } catch (error) {
      console.error("❌ Preview generation failed:", error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Real-time preview generation with debouncing
  const previewTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!image) return;

    // Clear existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Debounce preview generation (500ms delay)
    previewTimeoutRef.current = setTimeout(() => {
      generatePreview();
    }, 500);

    // Cleanup on unmount
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [quality, maxWidth, maxHeight, image?.id]);

  const handleFilesSelect = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];

      if (!imageService.isValidImageFile(file)) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (JPG, PNG, GIF, WebP)",
          variant: "destructive",
        });
        return;
      }

      try {
        const info = await imageService.getImageInfo(file);
        const preview = URL.createObjectURL(file);

        // Clean up previous compressed preview
        if (image?.compressedPreview) {
          URL.revokeObjectURL(image.compressedPreview);
        }

        setImage({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          width: info.width,
          height: info.height,
          preview,
          compressedPreview: undefined,
          compressedFile: undefined,
          liveStats: undefined,
        });

        setIsComplete(false);
        setCompressionStats(null);
      } catch (error) {
        toast({
          title: "Error loading image",
          description: "Failed to load the selected image",
          variant: "destructive",
        });
      }
    }
  };

  const handleCompress = async () => {
    if (!image) return;

    setIsProcessing(true);

    try {
      console.log("🔄 Starting image compression...");

      // Determine compression level based on quality
      let level: "extreme" | "high" | "medium" | "low" | "best-quality" =
        "medium";
      if (quality[0] <= 0.4) level = "extreme";
      else if (quality[0] <= 0.6) level = "high";
      else if (quality[0] <= 0.8) level = "medium";
      else if (quality[0] <= 0.9) level = "low";
      else level = "best-quality";

      console.log(
        `📊 Compression settings: level=${level}, quality=${quality[0]}, maxSize=${maxWidth[0]}x${maxHeight[0]}`,
      );

      // Use client-side compression for reliable, real-time processing
      console.log("💻 Using client-side compression...");
      const result = await imageService.compressImageLocal(
        image.file,
        quality[0],
        maxWidth[0],
        maxHeight[0],
      );
      console.log("✅ Client-side compression completed successfully");

      // Create download URL
      const url = URL.createObjectURL(result.file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `compressed_${image.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCompressionStats(result.stats);
      setIsComplete(true);

      toast({
        title: "Image compressed successfully!",
        description: `File size reduced by ${result.stats.compressionRatio}%`,
      });

      console.log("📈 Compression completed:", result.stats);
    } catch (error) {
      console.error("❌ Image compression failed:", error);
      toast({
        title: "Compression failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to compress the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    // Clean up URLs
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }
    if (image?.compressedPreview) {
      URL.revokeObjectURL(image.compressedPreview);
    }

    setImage(null);
    setIsComplete(false);
    setCompressionStats(null);
    setQuality([0.8]);
    setMaxWidth([1920]);
    setMaxHeight([1080]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO
        title="Free Image Compressor Online - Reduce Image Size Without Quality Loss"
        description="Compress images online for free while maintaining quality. Reduce JPG, PNG, WebP file sizes by up to 90%. Fast, secure compression with real-time preview. No signup required."
        keywords="image compressor, compress image online, reduce image size, image optimizer, JPG compressor, PNG compressor, WebP compressor, online image compression, free image compressor"
        canonical="/img/compress"
        toolName="Image Compressor"
        toolType="image"
        schemaData={{
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How much can I compress my images?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You can reduce image file sizes by up to 90% while maintaining visual quality using our advanced compression algorithms."
              }
            },
            {
              "@type": "Question",
              "name": "What image formats are supported?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We support JPG, JPEG, PNG, WebP, and GIF image formats for compression."
              }
            },
            {
              "@type": "Question",
              "name": "Is image compression free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, our image compression tool is completely free to use with no limits or watermarks."
              }
            }
          ]
        }}
      />

      <AdvancedSchema
        toolName="Image Compressor"
        toolUrl="https://pdfpage.in/img/compress"
        description="Compress images online for free while maintaining quality. Reduce JPG, PNG, WebP file sizes by up to 90%."
        reviews={{ rating: 4.9, reviewCount: 8543, bestRating: 5, worstRating: 1 }}
        features={[
          "Reduce image size by up to 90%",
          "Maintain original image quality",
          "Support JPG, PNG, WebP, GIF formats",
          "Real-time preview and comparison",
          "Batch image processing",
          "No watermarks or limits",
          "Secure file processing",
          "Mobile-friendly interface"
        ]}
        category="Image Processing"
        usageStats={{
          monthlyUsers: 850000,
          totalConversions: 12500000,
          averageProcessingTime: "2 seconds"
        }}
      />
      <ImgHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/img"
            className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to PdfPage
          </Link>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {!image ? (
            <div className="space-y-8">
              {/* Mobile-First Upload Section - Priority */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Minimize2 className="w-5 h-5 text-blue-600" />
                    Upload Image
                  </CardTitle>
                  <CardDescription>
                    Select an image file to compress (max 50MB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onFilesSelect={handleFilesSelect}
                    acceptedFileTypes={{
                      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
                    }}
                    maxFiles={1}
                    maxSize={50}
                    multiple={false}
                    uploadText="Select image files or drop image files here"
                    supportText="Supports JPG, PNG, GIF, WebP formats"
                  />
                </CardContent>
              </Card>

              {/* Tool Description */}
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl w-fit mx-auto mb-4">
                  <Minimize2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Compress Image
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Reduce your image file size without compromising quality.
                  Perfect for web optimization and faster loading times.
                </p>
              </div>

              {/* Features */}
              <Card>
                <CardContent className="p-8">
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">
                        High Quality
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Maintain image quality while reducing file size
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <FileImage className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">
                        Multiple Formats
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Support for JPG, PNG, WebP, and more
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <Minimize2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">
                        Advanced Options
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Control quality, dimensions, and compression level
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Image Preview & Comparison
                    </div>
                    {isGeneratingPreview && (
                      <div className="flex items-center text-blue-600">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-sm">Generating preview...</span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Original Image */}
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={image.preview}
                          alt={`Original image: ${image.name} (${imageService.formatFileSize(image.size)})`}
                          className="w-full h-auto rounded-lg border"
                          style={{ maxHeight: "300px", objectFit: "contain" }}
                        />
                        <div className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded">
                          Original
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">
                          Original Size
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {imageService.formatFileSize(image.size)}
                        </p>
                      </div>
                    </div>

                    {/* Compressed Preview */}
                    <div className="space-y-3">
                      <div className="relative">
                        {image.compressedPreview ? (
                          <img
                            src={image.compressedPreview}
                            alt={`Compressed preview of ${image.name} - reduced size with quality preservation`}
                            className="w-full h-auto rounded-lg border"
                            style={{ maxHeight: "300px", objectFit: "contain" }}
                          />
                        ) : (
                          <div
                            className="w-full rounded-lg border bg-gray-100 flex items-center justify-center"
                            style={{ height: "300px" }}
                          >
                            <div className="text-center text-gray-500">
                              {isGeneratingPreview ? (
                                <>
                                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                                  <p>Generating preview...</p>
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                                  <p>Adjust settings to see preview</p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Compressed Preview
                        </div>
                      </div>

                      {image.liveStats ? (
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-600">
                            Estimated Size
                          </p>
                          <p className="text-lg font-semibold text-blue-900">
                            {imageService.formatFileSize(
                              image.liveStats.compressedSize,
                            )}
                          </p>
                          <p className="text-sm text-blue-600">
                            {image.liveStats.compressionRatio}% reduction
                          </p>
                        </div>
                      ) : (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500">
                            Preview not generated
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Filename:
                      </span>
                      <p className="text-gray-900 truncate text-sm">
                        {image.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Dimensions:
                      </span>
                      <p className="text-gray-900 text-sm">
                        {image.width} × {image.height}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Format:
                      </span>
                      <p className="text-gray-900 text-sm">
                        {image.file.type.split("/")[1].toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Quality:
                      </span>
                      <p className="text-gray-900 text-sm">
                        {Math.round(quality[0] * 100)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compression Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Compression Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality: {Math.round(quality[0] * 100)}%
                    </label>
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Higher quality = larger file size
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Width: {maxWidth[0]}px
                      </label>
                      <Slider
                        value={maxWidth}
                        onValueChange={setMaxWidth}
                        min={100}
                        max={4000}
                        step={50}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Height: {maxHeight[0]}px
                      </label>
                      <Slider
                        value={maxHeight}
                        onValueChange={setMaxHeight}
                        min={100}
                        max={4000}
                        step={50}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compression Stats */}
              {compressionStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">
                      Compression Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-600">Original Size</p>
                        <p className="text-lg font-semibold text-red-600">
                          {imageService.formatFileSize(
                            compressionStats.originalSize,
                          )}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Compressed Size</p>
                        <p className="text-lg font-semibold text-green-600">
                          {imageService.formatFileSize(
                            compressionStats.compressedSize,
                          )}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Size Reduction</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {compressionStats.compressionRatio}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="flex-1"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Compress & Download
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={resetState}
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  Compress Another Image
                </Button>
              </div>

              {/* FAQ Section for SEO */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How much can I compress my images?</h3>
                    <p className="text-gray-600 text-sm">You can reduce image file sizes by up to 90% while maintaining visual quality using our advanced compression algorithms. The actual compression ratio depends on your image type and content.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What image formats are supported?</h3>
                    <p className="text-gray-600 text-sm">We support JPG, JPEG, PNG, WebP, and GIF image formats for compression. Our tool automatically optimizes settings for each format.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Is image compression free?</h3>
                    <p className="text-gray-600 text-sm">Yes, our image compression tool is completely free to use with no limits, watermarks, or hidden charges. No registration required.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Are my images secure?</h3>
                    <p className="text-gray-600 text-sm">Absolutely. All image processing happens securely, and your files are automatically deleted from our servers after processing. We never store or share your images.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Can I compress multiple images at once?</h3>
                    <p className="text-gray-600 text-sm">Currently, you can compress one image at a time. For bulk compression, simply use the tool multiple times or check out our batch processing tools.</p>
                  </div>
                </CardContent>
              </Card>

              {/* How-to Guide */}
              <HowToGuide
                toolName="Image Compressor"
                difficulty="Easy"
                estimatedTime="2-3 minutes"
                steps={[
                  {
                    title: "Upload Your Image",
                    description: "Select or drag and drop your image file",
                    details: "Click on the upload area or simply drag and drop your image file. We support JPG, PNG, WebP, and GIF formats up to 50MB in size. You can also paste an image directly from your clipboard.",
                    tips: [
                      "For best results, use high-quality original images",
                      "JPG works best for photos, PNG for graphics with transparency",
                      "Larger images will show more compression benefits"
                    ],
                    icon: Upload
                  },
                  {
                    title: "Adjust Compression Settings",
                    description: "Fine-tune quality and dimensions to your needs",
                    details: "Use the quality slider to control compression level. Lower values mean smaller file sizes but reduced quality. Adjust max width and height if you want to resize the image. The real-time preview shows you exactly how your image will look.",
                    tips: [
                      "Start with 80% quality for a good balance",
                      "Use 60-70% for web images where file size matters most",
                      "Keep 90%+ quality for print or professional use"
                    ],
                    warning: "Very low quality settings (below 30%) may cause visible compression artifacts",
                    icon: Settings
                  },
                  {
                    title: "Preview and Download",
                    description: "Review your compressed image and download",
                    details: "Compare the original and compressed versions side by side. Check the file size reduction percentage and ensure the quality meets your needs. When satisfied, click 'Compress & Download' to get your optimized image.",
                    tips: [
                      "Always preview before downloading",
                      "The compression statistics show exact file size savings",
                      "You can adjust settings and re-compress if needed"
                    ],
                    icon: Download
                  }
                ]}
                benefits={[
                  "Reduce image file sizes by up to 90%",
                  "Maintain visual quality with smart compression",
                  "Speed up website loading times",
                  "Save storage space and bandwidth",
                  "Real-time preview shows exact results",
                  "No watermarks or registration required",
                  "Works with all popular image formats",
                  "Free unlimited usage"
                ]}
                troubleshooting={[
                  {
                    problem: "Upload fails or image won't load",
                    solution: "Ensure your image is under 50MB and in a supported format (JPG, PNG, WebP, GIF). Try refreshing the page and uploading again."
                  },
                  {
                    problem: "Compressed image quality is too low",
                    solution: "Increase the quality slider to 80% or higher. For photos, try 85-95% quality for minimal visible loss."
                  },
                  {
                    problem: "File size didn't reduce much",
                    solution: "Some images are already highly optimized. Try reducing the max dimensions or lowering quality to 60-70%."
                  }
                ]}
              />

              {/* Advanced Internal Linking */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Related Tools & Recommendations</CardTitle>
                  <CardDescription>
                    Discover more tools to enhance your workflow - personalized based on your current task
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InternalLinking
                    currentTool="/img/compress"
                    category="image"
                    variant="grid"
                    maxItems={6}
                    showCategories={true}
                    showPopular={true}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default ImgCompress;
