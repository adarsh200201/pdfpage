import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import FaviconHeader from "@/components/layout/FaviconHeader";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Download,
  DownloadCloud,
  Archive,
  CheckCircle,
  Loader2,
  Sparkles,
  Info,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UsageService } from "@/services/usageService";
import AuthModal from "@/components/auth/AuthModal";

interface FaviconSize {
  size: number;
  name: string;
  description: string;
  platforms: string[];
  format: "ico" | "png";
  required?: boolean;
}

interface ProcessedFavicon {
  size: number;
  name: string;
  format: "ico" | "png";
  blob: Blob;
  url: string;
  fileSize: number;
}

interface OriginalImage {
  file: File;
  name: string;
  preview: string;
  width: number;
  height: number;
  size: number;
}

const FAVICON_SIZES: FaviconSize[] = [
  {
    size: 16,
    name: "favicon-16x16.png",
    description: "Browser tab icon",
    platforms: ["Web"],
    format: "png",
    required: true,
  },
  {
    size: 32,
    name: "favicon-32x32.png",
    description: "Browser bookmarks",
    platforms: ["Web"],
    format: "png",
    required: true,
  },
  {
    size: 48,
    name: "favicon-48x48.png",
    description: "Browser tab (high DPI)",
    platforms: ["Web"],
    format: "png",
  },
  {
    size: 96,
    name: "favicon-96x96.png",
    description: "Desktop shortcut",
    platforms: ["Desktop"],
    format: "png",
  },
  {
    size: 180,
    name: "apple-touch-icon.png",
    description: "iOS home screen",
    platforms: ["iOS"],
    format: "png",
    required: true,
  },
  {
    size: 192,
    name: "android-chrome-192x192.png",
    description: "Android home screen",
    platforms: ["Android"],
    format: "png",
    required: true,
  },
  {
    size: 512,
    name: "android-chrome-512x512.png",
    description: "Android splash screen",
    platforms: ["Android"],
    format: "png",
    required: true,
  },
  {
    size: 0,
    name: "favicon.ico",
    description: "Legacy browser support",
    platforms: ["Legacy Web"],
    format: "ico",
    required: true,
  },
];

const LogoToFavicon = () => {
  const [originalImage, setOriginalImage] = useState<OriginalImage | null>(
    null,
  );
  const [processedFavicons, setProcessedFavicons] = useState<
    ProcessedFavicon[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<number[]>(
    FAVICON_SIZES.filter((s) => s.required).map((s) => s.size),
  );
  const [showAuthModal, setShowAuthModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Safe toast wrapper to prevent errors
  const safeToast = useCallback(
    (toastOptions: any) => {
      try {
        toast(toastOptions);
      } catch (error) {
        console.warn("Toast error:", error);
        if (toastOptions.variant === "destructive") {
          console.error(toastOptions.title, toastOptions.description);
        }
      }
    },
    [toast],
  );

  const handleFilesSelect = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];

      if (!file.type.startsWith("image/")) {
        safeToast({
          title: "Invalid file type",
          description:
            "Please select a valid image file (PNG, JPG, GIF, WebP, SVG)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        safeToast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      try {
        const img = new window.Image();
        const preview = URL.createObjectURL(file);

        img.onload = () => {
          setOriginalImage({
            file,
            name: file.name,
            preview,
            width: img.width,
            height: img.height,
            size: file.size,
          });
          setIsComplete(false);
          setProcessedFavicons([]);
        };

        img.onerror = () => {
          URL.revokeObjectURL(preview);
          safeToast({
            title: "Error loading image",
            description:
              "Failed to load the selected image. Please try a different file.",
            variant: "destructive",
          });
        };

        img.src = preview;
      } catch (error) {
        safeToast({
          title: "Error loading image",
          description: "Failed to load the selected image",
          variant: "destructive",
        });
      }
    }
  };

  const generateCanvas = async (size: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = size;
      canvas.height = size;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, size, size);

      if (originalImage) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          // Logo optimization: Center and scale appropriately
          const aspectRatio = img.width / img.height;
          let drawWidth = size;
          let drawHeight = size;
          let offsetX = 0;
          let offsetY = 0;

          // For logos, we want to maintain aspect ratio and add some padding
          const padding = size * 0.1; // 10% padding on all sides
          const availableSize = size - padding * 2;

          if (aspectRatio > 1) {
            // Wider than tall
            drawWidth = availableSize;
            drawHeight = availableSize / aspectRatio;
          } else {
            // Taller than wide or square
            drawHeight = availableSize;
            drawWidth = availableSize * aspectRatio;
          }

          offsetX = (size - drawWidth) / 2;
          offsetY = (size - drawHeight) / 2;

          // Optional: Add subtle background for better visibility
          if (size >= 32) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.fillRect(0, 0, size, size);
          }

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to generate blob"));
              }
            },
            size === 0 ? "image/x-icon" : "image/png",
            0.95,
          );
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = originalImage.preview;
      }
    });
  };

  const generateFavicons = async () => {
    if (!originalImage) {
      safeToast({
        title: "No logo selected",
        description: "Please select a logo to optimize for favicon",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const sizesToGenerate = FAVICON_SIZES.filter(
        (s) => selectedSizes.includes(s.size) || s.size === 0,
      );

      const results: ProcessedFavicon[] = [];

      for (let i = 0; i < sizesToGenerate.length; i++) {
        const faviconSize = sizesToGenerate[i];
        setProcessingProgress(((i + 1) / sizesToGenerate.length) * 100);

        try {
          const size = faviconSize.size === 0 ? 32 : faviconSize.size;
          const blob = await generateCanvas(size);
          const url = URL.createObjectURL(blob);

          results.push({
            size: faviconSize.size,
            name: faviconSize.name,
            format: faviconSize.format,
            blob,
            url,
            fileSize: blob.size,
          });
        } catch (error) {
          console.error(`Failed to generate ${faviconSize.name}:`, error);
          safeToast({
            title: "Generation Error",
            description: `Failed to generate ${faviconSize.name}`,
            variant: "destructive",
          });
        }
      }

      setProcessedFavicons(results);
      setIsComplete(true);

      if (user) {
        const totalSize = results.reduce(
          (sum, result) => sum + result.fileSize,
          0,
        );
        await UsageService.trackUsage("logoToFavicon", totalSize);
      }

      safeToast({
        title: "Favicons optimized successfully!",
        description: `Generated ${results.length} optimized favicon files from your logo`,
      });
    } catch (error) {
      console.error("Error generating favicons:", error);
      safeToast({
        title: "Generation failed",
        description: "An error occurred while generating favicons",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFavicon = (favicon: ProcessedFavicon) => {
    const link = document.createElement("a");
    link.href = favicon.url;
    link.download = favicon.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllFavicons = async () => {
    try {
      safeToast({
        title: "Creating ZIP file",
        description: `Preparing ${processedFavicons.length} favicon files...`,
      });

      // Dynamically import JSZip
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Add each favicon to the zip
      for (const favicon of processedFavicons) {
        // Convert blob to array buffer
        const arrayBuffer = await favicon.blob.arrayBuffer();
        zip.file(favicon.name, arrayBuffer);
      }

      // Add a README file with usage instructions
      const readmeContent = `# Logo Favicon Files

Generated from: ${originalImage?.name || "your logo"}
Optimized: Centered with 10% padding for perfect display
Generated on: ${new Date().toLocaleDateString()}

## Files included:
${processedFavicons.map((f) => `- ${f.name} (${(f.fileSize / 1024).toFixed(1)} KB)`).join("\n")}

## How to use:
1. Upload all PNG files to your website's root directory
2. Add this HTML to your <head> section:

<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">

Generated with PdfPage.com - Free Logo to Favicon Optimizer`;

      zip.file("README.txt", readmeContent);

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "logo-favicons.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      safeToast({
        title: "Download complete!",
        description: `Downloaded ${processedFavicons.length} favicon files in logo-favicons.zip`,
      });
    } catch (error) {
      console.error("ZIP download error:", error);
      safeToast({
        title: "Download failed",
        description:
          "Failed to create ZIP file. Try downloading individual files.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Cleanup blob URLs when component unmounts or processedFavicons changes
  useEffect(() => {
    return () => {
      processedFavicons.forEach((favicon) => {
        if (favicon.url) {
          URL.revokeObjectURL(favicon.url);
        }
      });
    };
  }, [processedFavicons]);

  return (
    <div className="min-h-screen bg-bg-light">
      <FaviconHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/favicon"
            className="inline-flex items-center text-text-light hover:text-text-dark"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Favicon Tools
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Logo to Favicon Optimizer
          </div>
          <h1 className="text-heading-large text-text-dark mb-4">
            Optimize Logos for Perfect Favicon Display
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Upload your company logo and we'll optimize it for perfect favicon
            display across all platforms. Automatically adjusts scaling and
            padding for best results.
          </p>
        </div>

        {/* Optimization Tips */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Logo Optimization Tips:</strong> Best results with square
            logos, high contrast designs, and simple graphics. Complex logos may
            lose detail at smaller sizes.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Upload Logo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!originalImage ? (
                  <FileUpload
                    onFilesSelect={handleFilesSelect}
                    acceptedFileTypes={{
                      "image/*": [
                        ".jpg",
                        ".jpeg",
                        ".png",
                        ".gif",
                        ".webp",
                        ".svg",
                      ],
                    }}
                    maxFiles={1}
                    maxSize={10}
                    multiple={false}
                    uploadText="Select logo file or drop logo file here"
                    supportText="Supports JPG, PNG, GIF, WebP, SVG • Best results with square logos and transparent backgrounds"
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border">
                          <img
                            src={originalImage.preview}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-text-dark">
                            {originalImage.name}
                          </h3>
                          <p className="text-sm text-text-light">
                            {originalImage.width} × {originalImage.height} •{" "}
                            {formatFileSize(originalImage.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setOriginalImage(null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Logo Analysis */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Logo Analysis
                      </h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p>
                          <strong>Aspect Ratio:</strong>{" "}
                          {originalImage.width === originalImage.height
                            ? "Square (Perfect ✓)"
                            : originalImage.width > originalImage.height
                              ? "Landscape (Will be centered)"
                              : "Portrait (Will be centered)"}
                        </p>
                        <p>
                          <strong>Resolution:</strong>{" "}
                          {Math.min(
                            originalImage.width,
                            originalImage.height,
                          ) >= 512
                            ? "High quality ✓"
                            : "Consider higher resolution for best results"}
                        </p>
                        <p>
                          <strong>Optimization:</strong> Logo will be centered
                          with 10% padding for optimal display
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Size Selection */}
            {originalImage && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Favicon Sizes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {FAVICON_SIZES.map((size) => (
                      <div
                        key={size.size}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          id={`size-${size.size}`}
                          checked={
                            selectedSizes.includes(size.size) || size.required
                          }
                          disabled={size.required}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSizes([...selectedSizes, size.size]);
                            } else {
                              setSelectedSizes(
                                selectedSizes.filter((s) => s !== size.size),
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`size-${size.size}`}
                          className="flex-1 flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{size.name}</span>
                              {size.required && (
                                <Badge variant="secondary" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-text-light">
                              {size.description}
                            </p>
                          </div>
                          <div className="text-sm text-text-light">
                            {size.platforms.join(", ")}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate Button */}
            {originalImage && (
              <Button
                onClick={generateFavicons}
                disabled={isProcessing}
                className="w-full bg-brand-red hover:bg-red-600"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Optimizing Logo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Optimize for Favicon
                  </>
                )}
              </Button>
            )}

            {/* Processing Progress */}
            {isProcessing && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Optimizing logo...
                      </span>
                      <span className="text-sm text-text-light">
                        {Math.round(processingProgress)}%
                      </span>
                    </div>
                    <Progress value={processingProgress} className="w-full" />
                    <p className="text-xs text-text-light">
                      Applying centering, scaling, and platform optimizations
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {isComplete && processedFavicons.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Optimized Favicons
                      </span>
                      <Button
                        onClick={downloadAllFavicons}
                        size="sm"
                        className="bg-brand-red hover:bg-red-600"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Download ZIP
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {processedFavicons.map((favicon) => (
                        <div
                          key={favicon.name}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border rounded-lg overflow-hidden bg-white flex items-center justify-center">
                              <img
                                src={favicon.url}
                                alt={favicon.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">
                                {favicon.name}
                              </h3>
                              <p className="text-xs text-text-light">
                                {formatFileSize(favicon.fileSize)} • Optimized
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => downloadFavicon(favicon)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Optimization Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Optimization Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>✓ Centered:</strong> Logo positioned for optimal
                        visibility
                      </p>
                      <p>
                        <strong>✓ Scaled:</strong> Maintains aspect ratio with
                        10% padding
                      </p>
                      <p>
                        <strong>✓ Optimized:</strong> Perfect for all platforms
                        and devices
                      </p>
                      <p>
                        <strong>✓ Multiple sizes:</strong> From 16px to 512px
                        for all use cases
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default LogoToFavicon;
