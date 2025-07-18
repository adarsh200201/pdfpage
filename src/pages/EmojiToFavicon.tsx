import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import FaviconHeader from "@/components/layout/FaviconHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Download,
  DownloadCloud,
  Archive,
  CheckCircle,
  Loader2,
  Smile,
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
  "🌟",
  "⚡",
  "🎨",
  "🎭",
  "🎪",
  "🎸",
  "🎵",
  "🍀",
  "🌈",
  "🌊",
  "🔮",
  "💫",
  "🦄",
  "🐱",
  "🐶",
  "🐸",
  "🐼",
  "🦊",
];

const EmojiToFavicon = () => {
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

  // Emoji to Favicon state
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const [emojiSettings, setEmojiSettings] = useState({
    backgroundColor: "#ffffff",
    size: 80,
    borderRadius: 0,
  });

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
    });
  };

  const generateFavicons = async () => {
    if (!selectedEmoji) {
      safeToast({
        title: "No emoji selected",
        description: "Please select an emoji to convert to favicon",
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
        await UsageService.trackUsage("emojiToFavicon", totalSize);
      }

      safeToast({
        title: "Favicons generated successfully!",
        description: `Generated ${results.length} favicon files from your emoji`,
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
      const readmeContent = `# Emoji Favicon Files

Generated from: ${selectedEmoji}
Background: ${emojiSettings.backgroundColor}
Size: ${emojiSettings.size}%
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

Generated with PdfPage.com - Free Emoji to Favicon Generator`;

      zip.file("README.txt", readmeContent);

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "emoji-favicons.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      safeToast({
        title: "Download complete!",
        description: `Downloaded ${processedFavicons.length} favicon files in emoji-favicons.zip`,
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
          <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Smile className="w-4 h-4" />
            Emoji to Favicon Generator
          </div>
          <h1 className="text-heading-large text-text-dark mb-4">
            Generate Favicons from Emojis
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Create fun and memorable favicon files from your favorite emojis.
            Perfect for personal projects, fun websites, and creative brands.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Emoji Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="w-5 h-5" />
                  Select Emoji
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-8 gap-2">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={cn(
                        "w-12 h-12 text-2xl rounded-lg border-2 hover:border-brand-red transition-colors",
                        selectedEmoji === emoji
                          ? "border-brand-red bg-red-50"
                          : "border-gray-200 hover:bg-gray-50",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div>
                  <Label htmlFor="customEmoji">Or enter custom emoji</Label>
                  <Input
                    id="customEmoji"
                    value={selectedEmoji}
                    onChange={(e) => setSelectedEmoji(e.target.value)}
                    placeholder="Enter any emoji"
                    className="text-2xl text-center"
                    maxLength={10}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emoji Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Style Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="backgroundColor"
                      value={emojiSettings.backgroundColor}
                      onChange={(e) =>
                        setEmojiSettings({
                          ...emojiSettings,
                          backgroundColor: e.target.value,
                        })
                      }
                      className="w-12 h-10 rounded border"
                    />
                    <Input
                      value={emojiSettings.backgroundColor}
                      onChange={(e) =>
                        setEmojiSettings({
                          ...emojiSettings,
                          backgroundColor: e.target.value,
                        })
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="emojiSize">
                    Emoji Size: {emojiSettings.size}%
                  </Label>
                  <input
                    type="range"
                    id="emojiSize"
                    min="50"
                    max="100"
                    value={emojiSettings.size}
                    onChange={(e) =>
                      setEmojiSettings({
                        ...emojiSettings,
                        size: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="borderRadius">
                    Border Radius: {emojiSettings.borderRadius}px
                  </Label>
                  <input
                    type="range"
                    id="borderRadius"
                    min="0"
                    max="32"
                    value={emojiSettings.borderRadius}
                    onChange={(e) =>
                      setEmojiSettings({
                        ...emojiSettings,
                        borderRadius: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div
                    className="w-16 h-16 flex items-center justify-center text-4xl rounded-lg border-2 border-gray-200"
                    style={{
                      backgroundColor: emojiSettings.backgroundColor,
                      borderRadius: `${emojiSettings.borderRadius * 2}px`,
                    }}
                  >
                    {selectedEmoji}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Size Selection */}
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

            {/* Generate Button */}
            <Button
              onClick={generateFavicons}
              disabled={isProcessing || !selectedEmoji}
              className="w-full bg-brand-red hover:bg-red-600"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Favicons...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Generate Favicons
                </>
              )}
            </Button>

            {/* Processing Progress */}
            {isProcessing && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Processing...</span>
                      <span className="text-sm text-text-light">
                        {Math.round(processingProgress)}%
                      </span>
                    </div>
                    <Progress value={processingProgress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {isComplete && processedFavicons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Generated Favicons
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
                              className="max-w-full max-h-full"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">
                              {favicon.name}
                            </h3>
                            <p className="text-xs text-text-light">
                              {formatFileSize(favicon.fileSize)}
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
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default EmojiToFavicon;
