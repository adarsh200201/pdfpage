import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import ImgHeader from "@/components/layout/ImgHeader";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Download,
  DownloadCloud,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Info,
  Archive,
  Sparkles,
  Eye,
  RefreshCw,
  Copy,
  Type,
  Smile,
  Image,
  Palette,
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

const POPULAR_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😊",
  "😍",
  "🥰",
  "😘",
  "😎",
  "🤔",
  "😴",
  "😂",
  "🥳",
  "😇",
  "🙂",
  "😉",
  "🚀",
  "⭐",
  "🎉",
  "💎",
  "🔥",
  "💡",
  "🎯",
  "🏆",
  "❤️",
  "💙",
  "💚",
  "💛",
  "💜",
  "🖤",
  "🤍",
  "🤎",
];

const FaviconConverter = () => {
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
  const [activeTab, setActiveTab] = useState("image");

  // Text to Favicon state
  const [textSettings, setTextSettings] = useState({
    text: "A",
    fontSize: 64,
    fontFamily: "Arial",
    textColor: "#ffffff",
    backgroundColor: "#000000",
    fontWeight: "bold",
    borderRadius: 0,
  });

  // Emoji to Favicon state
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const [emojiSettings, setEmojiSettings] = useState({
    backgroundColor: "#ffffff",
    size: 80,
    borderRadius: 0,
  });

  // Web manifest settings
  const [generateWebManifest, setGenerateWebManifest] = useState(false);
  const [manifestData, setManifestData] = useState({
    name: "My Website",
    shortName: "My Site",
    description: "My awesome website",
    themeColor: "#000000",
    backgroundColor: "#ffffff",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleFilesSelect = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description:
            "Please select a valid image file (PNG, JPG, GIF, WebP, SVG)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      try {
        const img = new Image();
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

        img.src = preview;
      } catch (error) {
        toast({
          title: "Error loading image",
          description: "Failed to load the selected image",
          variant: "destructive",
        });
      }
    }
  };

  const generateCanvas = async (size: number, type: string): Promise<Blob> => {
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

      if (type === "text") {
        // Generate text favicon
        ctx.fillStyle = textSettings.backgroundColor;
        if (textSettings.borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(
            0,
            0,
            size,
            size,
            (textSettings.borderRadius / 64) * size,
          );
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, size, size);
        }

        const fontSize = Math.floor((textSettings.fontSize / 100) * size);
        ctx.font = `${textSettings.fontWeight} ${fontSize}px ${textSettings.fontFamily}`;
        ctx.fillStyle = textSettings.textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(textSettings.text, size / 2, size / 2);
      } else if (type === "emoji") {
        // Generate emoji favicon
        ctx.fillStyle = emojiSettings.backgroundColor;
        if (emojiSettings.borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(
            0,
            0,
            size,
            size,
            (emojiSettings.borderRadius / 64) * size,
          );
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, size, size);
        }

        const emojiSize = Math.floor((emojiSettings.size / 100) * size);
        ctx.font = `${emojiSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(selectedEmoji, size / 2, size / 2);
      } else if (type === "image" && originalImage) {
        // Generate image favicon
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          const aspectRatio = img.width / img.height;
          let drawWidth = size;
          let drawHeight = size;
          let offsetX = 0;
          let offsetY = 0;

          if (aspectRatio > 1) {
            drawHeight = size / aspectRatio;
            offsetY = (size - drawHeight) / 2;
          } else {
            drawWidth = size * aspectRatio;
            offsetX = (size - drawWidth) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to generate favicon blob"));
            },
            "image/png",
            1,
          );
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = originalImage.preview;
        return; // Early return for async image loading
      }

      // For text and emoji (synchronous)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to generate favicon blob"));
        },
        "image/png",
        1,
      );
    });
  };

  const generateFavicons = async () => {
    // Validation
    if (activeTab === "image" && !originalImage) return;
    if (activeTab === "logo" && !originalImage) return;
    if (activeTab === "text" && !textSettings.text.trim()) return;
    if (activeTab === "emoji" && !selectedEmoji) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const sizesToGenerate = FAVICON_SIZES.filter(
        (s) => selectedSizes.includes(s.size) || s.size === 0, // Always include ICO
      );

      const results: ProcessedFavicon[] = [];

      for (let i = 0; i < sizesToGenerate.length; i++) {
        const faviconSize = sizesToGenerate[i];
        setProcessingProgress(((i + 1) / sizesToGenerate.length) * 100);

        try {
          const size = faviconSize.size === 0 ? 32 : faviconSize.size;
          const blob = await generateCanvas(
            size,
            activeTab === "logo" ? "image" : activeTab,
          );
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
          toast({
            title: "Generation Error",
            description: `Failed to generate ${faviconSize.name}`,
            variant: "destructive",
          });
        }
      }

      // Generate web manifest if requested
      if (generateWebManifest) {
        const manifestContent = JSON.stringify(
          {
            name: manifestData.name,
            short_name: manifestData.shortName,
            description: manifestData.description,
            theme_color: manifestData.themeColor,
            background_color: manifestData.backgroundColor,
            display: "standalone",
            start_url: "/",
            icons: [
              {
                src: "/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
              {
                src: "/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
              },
            ],
          },
          null,
          2,
        );

        const manifestBlob = new Blob([manifestContent], {
          type: "application/json",
        });
        const manifestUrl = URL.createObjectURL(manifestBlob);

        results.push({
          size: 0,
          name: "site.webmanifest",
          format: "png" as any,
          blob: manifestBlob,
          url: manifestUrl,
          fileSize: manifestBlob.size,
        });
      }

      setProcessedFavicons(results);
      setIsComplete(true);

      // Track usage
      if (user) {
        const totalSize = results.reduce(
          (sum, result) => sum + result.fileSize,
          0,
        );
        await UsageService.trackUsage("faviconConverter", totalSize);
      }

      toast({
        title: "Favicons generated successfully!",
        description: `Generated ${results.length} favicon files${generateWebManifest ? " + web manifest" : ""}`,
      });
    } catch (error) {
      console.error("Error generating favicons:", error);
      toast({
        title: "Generation failed",
        description: "An error occurred while generating favicons",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
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

  const downloadAllAsZip = async () => {
    if (processedFavicons.length === 0) return;

    try {
      toast({
        title: "Downloading favicons",
        description: `Downloading ${processedFavicons.length} favicon files...`,
      });

      for (let i = 0; i < processedFavicons.length; i++) {
        const favicon = processedFavicons[i];
        setTimeout(() => {
          downloadFavicon(favicon);

          if (i === processedFavicons.length - 1) {
            setTimeout(() => {
              toast({
                title: "Download complete!",
                description: "All favicon files have been downloaded",
              });
            }, 500);
          }
        }, 300 * i);
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download favicon files",
        variant: "destructive",
      });
    }
  };

  const toggleSizeSelection = (size: number) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getPlatformColor = (platforms: string[]): string => {
    if (platforms.includes("iOS")) return "bg-blue-100 text-blue-800";
    if (platforms.includes("Android")) return "bg-green-100 text-green-800";
    if (platforms.includes("Web")) return "bg-purple-100 text-purple-800";
    if (platforms.includes("Desktop")) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  const copyHtmlCode = async () => {
    const htmlCode = `<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- Android Chrome -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">`;

    try {
      await navigator.clipboard.writeText(htmlCode);
      toast({
        title: "Copied to clipboard!",
        description: "HTML code has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy HTML code to clipboard",
        variant: "destructive",
      });
    }
  };

  const hasValidInput = () => {
    if (activeTab === "image" || activeTab === "logo") return !!originalImage;
    if (activeTab === "text") return textSettings.text.trim().length > 0;
    if (activeTab === "emoji") return !!selectedEmoji;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <ImgHeader
        title="Favicon Converter"
        description="Convert images, text, emojis, and logos to favicon files for web, iOS, and Android"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center gap-2 mb-6">
            <Link
              to="/img"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Image Tools
            </Link>
          </div>

          {/* Info Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Globe className="h-4 w-4" />
              Complete Favicon Generator Suite
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create Favicons from Anything
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Generate professional favicon files from images, text, emojis, or
              logos. Create all required sizes with perfect quality for web,
              iOS, and Android.
            </p>
          </div>

          {/* Main Tabs */}
          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger
                    value="image"
                    className="flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger
                    value="emoji"
                    className="flex items-center gap-2"
                  >
                    <Smile className="w-4 h-4" />
                    Emoji
                  </TabsTrigger>
                  <TabsTrigger value="logo" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Logo
                  </TabsTrigger>
                </TabsList>

                {/* Image to Favicon */}
                <TabsContent value="image" className="space-y-6">
                  {!originalImage ? (
                    <>
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
                        uploadText="Select image file or drop image file here"
                        supportText="Supports JPG, PNG, GIF, WebP, SVG • Best results with square images"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4">
                          <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <h3 className="font-semibold text-gray-900">
                            Web Ready
                          </h3>
                          <p className="text-gray-600 text-sm">
                            All standard web favicon sizes
                          </p>
                        </div>
                        <div className="text-center p-4">
                          <Smartphone className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <h3 className="font-semibold text-gray-900">
                            Mobile Optimized
                          </h3>
                          <p className="text-gray-600 text-sm">
                            iOS and Android app icons
                          </p>
                        </div>
                        <div className="text-center p-4">
                          <Archive className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <h3 className="font-semibold text-gray-900">
                            Batch Download
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Download all sizes at once
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-medium">
                        Image uploaded successfully!
                      </p>
                      <p className="text-green-600 text-sm">
                        Proceed to size selection below
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Text to Favicon */}
                <TabsContent value="text" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Text Settings</h3>

                      <div>
                        <Label>Text (1-3 characters)</Label>
                        <Input
                          value={textSettings.text}
                          onChange={(e) =>
                            setTextSettings((prev) => ({
                              ...prev,
                              text: e.target.value.slice(0, 3),
                            }))
                          }
                          placeholder="A"
                          className="text-lg text-center font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Font Family</Label>
                          <Select
                            value={textSettings.fontFamily}
                            onValueChange={(value) =>
                              setTextSettings((prev) => ({
                                ...prev,
                                fontFamily: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Helvetica">
                                Helvetica
                              </SelectItem>
                              <SelectItem value="Times New Roman">
                                Times New Roman
                              </SelectItem>
                              <SelectItem value="Courier New">
                                Courier New
                              </SelectItem>
                              <SelectItem value="Verdana">Verdana</SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                              <SelectItem value="Impact">Impact</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Font Weight</Label>
                          <Select
                            value={textSettings.fontWeight}
                            onValueChange={(value) =>
                              setTextSettings((prev) => ({
                                ...prev,
                                fontWeight: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                              <SelectItem value="lighter">Light</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Text Color</Label>
                          <Input
                            type="color"
                            value={textSettings.textColor}
                            onChange={(e) =>
                              setTextSettings((prev) => ({
                                ...prev,
                                textColor: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Background Color</Label>
                          <Input
                            type="color"
                            value={textSettings.backgroundColor}
                            onChange={(e) =>
                              setTextSettings((prev) => ({
                                ...prev,
                                backgroundColor: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Font Size: {textSettings.fontSize}%</Label>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={textSettings.fontSize}
                          onChange={(e) =>
                            setTextSettings((prev) => ({
                              ...prev,
                              fontSize: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label>
                          Border Radius: {textSettings.borderRadius}px
                        </Label>
                        <input
                          type="range"
                          min="0"
                          max="32"
                          value={textSettings.borderRadius}
                          onChange={(e) =>
                            setTextSettings((prev) => ({
                              ...prev,
                              borderRadius: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Live Preview</h3>
                      <div className="flex items-center gap-4">
                        {[64, 32, 16].map((size) => (
                          <div key={size} className="text-center">
                            <div
                              className="border rounded flex items-center justify-center font-bold"
                              style={{
                                width: `${size}px`,
                                height: `${size}px`,
                                backgroundColor: textSettings.backgroundColor,
                                color: textSettings.textColor,
                                fontFamily: textSettings.fontFamily,
                                fontWeight: textSettings.fontWeight,
                                fontSize: `${Math.floor((textSettings.fontSize * size) / 100)}px`,
                                borderRadius: `${(textSettings.borderRadius * size) / 64}px`,
                              }}
                            >
                              {textSettings.text}
                            </div>
                            <span className="text-xs text-gray-600 mt-1 block">
                              {size}×{size}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white border rounded p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: textSettings.backgroundColor,
                              color: textSettings.textColor,
                              fontFamily: textSettings.fontFamily,
                              borderRadius: `${textSettings.borderRadius / 4}px`,
                            }}
                          >
                            {textSettings.text}
                          </div>
                          <span className="text-gray-700">Your Website</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Browser Tab Preview
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Emoji to Favicon */}
                <TabsContent value="emoji" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Emoji Settings</h3>

                      <div>
                        <Label>Selected Emoji</Label>
                        <Input
                          value={selectedEmoji}
                          onChange={(e) =>
                            setSelectedEmoji(e.target.value.slice(0, 2))
                          }
                          placeholder="😀"
                          className="text-2xl text-center h-12"
                        />
                      </div>

                      <div>
                        <Label>Background Color</Label>
                        <Input
                          type="color"
                          value={emojiSettings.backgroundColor}
                          onChange={(e) =>
                            setEmojiSettings((prev) => ({
                              ...prev,
                              backgroundColor: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label>Emoji Size: {emojiSettings.size}%</Label>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          value={emojiSettings.size}
                          onChange={(e) =>
                            setEmojiSettings((prev) => ({
                              ...prev,
                              size: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label>
                          Border Radius: {emojiSettings.borderRadius}px
                        </Label>
                        <input
                          type="range"
                          min="0"
                          max="32"
                          value={emojiSettings.borderRadius}
                          onChange={(e) =>
                            setEmojiSettings((prev) => ({
                              ...prev,
                              borderRadius: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">Popular Emojis</Label>
                        <div className="grid grid-cols-8 gap-2">
                          {POPULAR_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => setSelectedEmoji(emoji)}
                              className={`p-2 text-lg border rounded hover:bg-gray-100 ${
                                selectedEmoji === emoji
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200"
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Live Preview</h3>
                      <div className="flex items-center gap-4">
                        {[64, 32, 16].map((size) => (
                          <div key={size} className="text-center">
                            <div
                              className="border rounded flex items-center justify-center"
                              style={{
                                width: `${size}px`,
                                height: `${size}px`,
                                backgroundColor: emojiSettings.backgroundColor,
                                fontSize: `${Math.floor((emojiSettings.size * size) / 100)}px`,
                                borderRadius: `${(emojiSettings.borderRadius * size) / 64}px`,
                              }}
                            >
                              {selectedEmoji}
                            </div>
                            <span className="text-xs text-gray-600 mt-1 block">
                              {size}×{size}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white border rounded p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: emojiSettings.backgroundColor,
                              borderRadius: `${emojiSettings.borderRadius / 4}px`,
                            }}
                          >
                            {selectedEmoji}
                          </div>
                          <span className="text-gray-700">Your Website</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Browser Tab Preview
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Logo to Favicon */}
                <TabsContent value="logo" className="space-y-6">
                  {!originalImage ? (
                    <>
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
                        supportText="Supports JPG, PNG, GIF, WebP, SVG • Optimized for logo processing"
                      />
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-600" />
                          Logo Optimization Tips:
                        </h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>
                            • Use high-contrast logos for better visibility at
                            small sizes
                          </li>
                          <li>
                            • Simple designs work better than complex details
                          </li>
                          <li>• Avoid thin lines or small text elements</li>
                          <li>• PNG format with transparency is recommended</li>
                          <li>
                            • Square or circular logos produce the best results
                          </li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-medium">
                        Logo uploaded successfully!
                      </p>
                      <p className="text-green-600 text-sm">
                        Proceed to size selection below
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Size Selection */}
          {hasValidInput() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Select Favicon Sizes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FAVICON_SIZES.filter((s) => s.size > 0).map((size) => (
                    <div
                      key={size.size}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-all",
                        selectedSizes.includes(size.size)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300",
                      )}
                      onClick={() => toggleSizeSelection(size.size)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {size.size}×{size.size}px
                        </span>
                        {size.required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {size.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {size.platforms.map((platform) => (
                          <Badge
                            key={platform}
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getPlatformColor(size.platforms),
                            )}
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Web Manifest Configuration */}
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="webmanifest"
                      checked={generateWebManifest}
                      onCheckedChange={(checked) =>
                        setGenerateWebManifest(checked as boolean)
                      }
                    />
                    <Label htmlFor="webmanifest" className="font-medium">
                      Generate Web App Manifest (PWA support)
                    </Label>
                  </div>

                  {generateWebManifest && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label>App Name</Label>
                        <Input
                          value={manifestData.name}
                          onChange={(e) =>
                            setManifestData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="My Awesome App"
                        />
                      </div>
                      <div>
                        <Label>Short Name</Label>
                        <Input
                          value={manifestData.shortName}
                          onChange={(e) =>
                            setManifestData((prev) => ({
                              ...prev,
                              shortName: e.target.value,
                            }))
                          }
                          placeholder="MyApp"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={manifestData.description}
                          onChange={(e) =>
                            setManifestData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Description of your web app"
                        />
                      </div>
                      <div>
                        <Label>Theme Color</Label>
                        <Input
                          type="color"
                          value={manifestData.themeColor}
                          onChange={(e) =>
                            setManifestData((prev) => ({
                              ...prev,
                              themeColor: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Background Color</Label>
                        <Input
                          type="color"
                          value={manifestData.backgroundColor}
                          onChange={(e) =>
                            setManifestData((prev) => ({
                              ...prev,
                              backgroundColor: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={generateFavicons}
                    disabled={isProcessing || selectedSizes.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating... {Math.round(processingProgress)}%
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Favicons ({selectedSizes.length + 1} files)
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setOriginalImage(null);
                      setProcessedFavicons([]);
                      setIsComplete(false);
                      setTextSettings((prev) => ({ ...prev, text: "A" }));
                      setSelectedEmoji("😀");
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {isProcessing && (
                  <Progress value={processingProgress} className="w-full" />
                )}
              </CardContent>
            </Card>
          )}

          {/* Generated Favicons */}
          {isComplete && processedFavicons.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Generated Favicons ({processedFavicons.length})
                  </CardTitle>
                  <Button onClick={downloadAllAsZip} variant="outline">
                    <DownloadCloud className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {processedFavicons.map((favicon) => (
                    <div
                      key={favicon.name}
                      className="border rounded-lg p-4 text-center hover:shadow-md transition-shadow"
                    >
                      <div className="mb-3">
                        {favicon.name.endsWith(".webmanifest") ? (
                          <div className="w-16 h-16 mx-auto bg-gray-100 rounded border flex items-center justify-center">
                            <Globe className="w-8 h-8 text-gray-500" />
                          </div>
                        ) : (
                          <img
                            src={favicon.url}
                            alt={favicon.name}
                            className="w-16 h-16 mx-auto object-contain bg-gray-50 rounded border"
                          />
                        )}
                      </div>
                      <h4 className="font-medium text-sm mb-1">
                        {favicon.size === 0 &&
                        !favicon.name.endsWith(".webmanifest")
                          ? "ICO"
                          : favicon.name.endsWith(".webmanifest")
                            ? "Manifest"
                            : `${favicon.size}×${favicon.size}`}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        {formatFileSize(favicon.fileSize)}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadFavicon(favicon)}
                        className="w-full text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">HTML Code for Your Website:</h4>
                    <Button size="sm" variant="outline" onClick={copyHtmlCode}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                    {`<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- Android Chrome -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">${generateWebManifest ? '\n\n<!-- Web App Manifest -->\n<link rel="manifest" href="/site.webmanifest">' : ""}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <canvas ref={canvasRef} className="hidden" />

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultTab="login"
        />
      )}
    </div>
  );
};

export default FaviconConverter;
