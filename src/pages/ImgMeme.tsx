import { useState, useRef, useCallback, useEffect } from "react";
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
import { Textarea } from "../components/ui/textarea";
import { generateMeme } from "../services/imageService";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { trackUsage } from "../services/usageService";
import {
  Upload,
  Download,
  RefreshCw,
  Type,
  Palette,
  Move,
  RotateCw,
  Sparkles,
  Laugh,
  Image as ImageIcon,
  Brush,
  Settings,
  Undo,
  Redo,
  Save,
  Eye,
  Search,
  TrendingUp,
  Star,
  Clock,
} from "lucide-react";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  bold: boolean;
  italic: boolean;
  uppercase: boolean;
  alignment: "left" | "center" | "right";
  rotation: number;
  opacity: number;
}

interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  category: string;
  popular: boolean;
}

const fontFamilies = [
  "Impact",
  "Arial Black",
  "Helvetica",
  "Times New Roman",
  "Comic Sans MS",
  "Courier New",
  "Georgia",
  "Verdana",
];

const colors = [
  "#FFFFFF",
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#FFD700",
  "#90EE90",
];

const popularTemplates: MemeTemplate[] = [
  {
    id: "1",
    name: "Drake Pointing",
    url: "/templates/drake.jpg",
    thumbnail: "/templates/drake-thumb.jpg",
    category: "reaction",
    popular: true,
  },
  {
    id: "2",
    name: "Distracted Boyfriend",
    url: "/templates/distracted.jpg",
    thumbnail: "/templates/distracted-thumb.jpg",
    category: "reaction",
    popular: true,
  },
  {
    id: "3",
    name: "Woman Yelling at Cat",
    url: "/templates/woman-cat.jpg",
    thumbnail: "/templates/woman-cat-thumb.jpg",
    category: "reaction",
    popular: true,
  },
  {
    id: "4",
    name: "Two Buttons",
    url: "/templates/two-buttons.jpg",
    thumbnail: "/templates/two-buttons-thumb.jpg",
    category: "choice",
    popular: true,
  },
  {
    id: "5",
    name: "Change My Mind",
    url: "/templates/change-mind.jpg",
    thumbnail: "/templates/change-mind-thumb.jpg",
    category: "opinion",
    popular: false,
  },
  {
    id: "6",
    name: "Expanding Brain",
    url: "/templates/expanding-brain.jpg",
    thumbnail: "/templates/expanding-brain-thumb.jpg",
    category: "comparison",
    popular: true,
  },
];

export default function ImgMeme() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(
    null,
  );
  const [baseImage, setBaseImage] = useState<string>("");
  const [finalMeme, setFinalMeme] = useState<string>("");
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [searchQuery, setSearchQuery] = useState("");
  const [templateCategory, setTemplateCategory] = useState("all");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateId = () => Math.random().toString(36).substr(2, 9);

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
      setSelectedTemplate(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBaseImage(result);
        setFinalMeme("");

        // Get image dimensions and update canvas
        const img = new Image();
        img.onload = () => {
          const maxSize = 800;
          const ratio = Math.min(maxSize / img.width, maxSize / img.height);
          setCanvasSize({
            width: img.width * ratio,
            height: img.height * ratio,
          });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    },
    [toast],
  );

  const handleTemplateSelect = (template: MemeTemplate) => {
    setSelectedTemplate(template);
    setSelectedFile(null);
    setBaseImage(template.url);
    setFinalMeme("");

    // Load template image and set canvas size
    const img = new Image();
    img.onload = () => {
      const maxSize = 800;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      setCanvasSize({
        width: img.width * ratio,
        height: img.height * ratio,
      });
    };
    img.src = template.url;
  };

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

  const addTextOverlay = () => {
    const newOverlay: TextOverlay = {
      id: generateId(),
      text: "Your text here",
      x: 50,
      y: 20,
      fontSize: 48,
      fontFamily: "Impact",
      color: "#FFFFFF",
      strokeColor: "#000000",
      strokeWidth: 3,
      bold: true,
      italic: false,
      uppercase: true,
      alignment: "center",
      rotation: 0,
      opacity: 100,
    };
    setTextOverlays((prev) => [...prev, newOverlay]);
    setSelectedOverlay(newOverlay.id);
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === id ? { ...overlay, ...updates } : overlay,
      ),
    );
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
    if (selectedOverlay === id) {
      setSelectedOverlay(null);
    }
  };

  const generateMemeImage = async () => {
    if (!baseImage) return;

    try {
      setIsProcessing(true);
      setProgress(0);

      setProgress(20);

      const memeOptions = {
        baseImage,
        textOverlays,
        canvasSize,
        quality: 0.9,
      };

      setProgress(50);
      const result = await generateMeme(memeOptions);

      setProgress(80);
      const memeUrl = URL.createObjectURL(result);
      setFinalMeme(memeUrl);

      setProgress(100);

      if (user) {
        await trackUsage(user.uid, "imgMeme", 1);
      }

      toast({
        title: "Meme generated successfully!",
        description: "Your meme is ready for download.",
      });
    } catch (error) {
      console.error("Error generating meme:", error);
      toast({
        title: "Generation failed",
        description:
          "An error occurred while generating the meme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const downloadMeme = () => {
    if (!finalMeme) return;

    const link = document.createElement("a");
    link.href = finalMeme;
    link.download = `meme-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewMeme = () => {
    if (!canvasRef.current || !baseImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const img = new Image();
    img.onload = () => {
      // Draw base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw text overlays
      textOverlays.forEach((overlay) => {
        ctx.save();

        // Set text properties
        const fontSize = (overlay.fontSize * canvas.width) / 500;
        ctx.font = `${overlay.bold ? "bold" : "normal"} ${overlay.italic ? "italic" : "normal"} ${fontSize}px ${overlay.fontFamily}`;
        ctx.textAlign = overlay.alignment;
        ctx.globalAlpha = overlay.opacity / 100;

        const x = (overlay.x * canvas.width) / 100;
        const y = (overlay.y * canvas.height) / 100;

        // Apply rotation
        if (overlay.rotation !== 0) {
          ctx.translate(x, y);
          ctx.rotate((overlay.rotation * Math.PI) / 180);
          ctx.translate(-x, -y);
        }

        // Draw stroke
        if (overlay.strokeWidth > 0) {
          ctx.strokeStyle = overlay.strokeColor;
          ctx.lineWidth = overlay.strokeWidth;
          ctx.strokeText(
            overlay.uppercase ? overlay.text.toUpperCase() : overlay.text,
            x,
            y,
          );
        }

        // Draw fill
        ctx.fillStyle = overlay.color;
        ctx.fillText(
          overlay.uppercase ? overlay.text.toUpperCase() : overlay.text,
          x,
          y,
        );

        ctx.restore();
      });
    };
    img.src = baseImage;
  };

  useEffect(() => {
    previewMeme();
  }, [baseImage, textOverlays, canvasSize]);

  const filteredTemplates = popularTemplates.filter((template) => {
    const matchesSearch = template.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      templateCategory === "all" || template.category === templateCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedOverlayData = textOverlays.find(
    (overlay) => overlay.id === selectedOverlay,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <ImgHeader
        title="Meme Generator"
        description="Create hilarious memes with custom text and popular templates"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Canvas and Templates Section */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="canvas" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="canvas">Meme Canvas</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="canvas">
                  <Card>
                    <CardContent className="p-6">
                      {!baseImage ? (
                        <div
                          className="border-2 border-dashed border-yellow-300 rounded-lg p-12 text-center hover:border-yellow-400 transition-colors cursor-pointer"
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Upload Image or Choose Template
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Drag and drop your image here, or click to select
                          </p>
                          <p className="text-sm text-gray-400">
                            Supports: JPG, PNG, WEBP, GIF (Max 10MB)
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
                        <div className="space-y-4">
                          {/* Meme Preview */}
                          <div className="relative bg-gray-100 rounded-lg p-4">
                            <canvas
                              ref={canvasRef}
                              className="max-w-full h-auto mx-auto border rounded"
                              style={{ maxHeight: "500px" }}
                            />

                            {/* Text Overlay Indicators */}
                            {textOverlays.map((overlay, index) => (
                              <div
                                key={overlay.id}
                                className={`absolute border-2 border-dashed cursor-pointer ${
                                  selectedOverlay === overlay.id
                                    ? "border-yellow-500"
                                    : "border-gray-400"
                                }`}
                                style={{
                                  left: `${overlay.x}%`,
                                  top: `${overlay.y}%`,
                                  transform: "translate(-50%, -50%)",
                                }}
                                onClick={() => setSelectedOverlay(overlay.id)}
                              >
                                <Badge variant="secondary" className="text-xs">
                                  Text {index + 1}
                                </Badge>
                              </div>
                            ))}
                          </div>

                          {/* Text Controls */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={addTextOverlay}
                              variant="outline"
                              size="sm"
                            >
                              <Type className="h-4 w-4 mr-1" />
                              Add Text
                            </Button>

                            <Button
                              onClick={generateMemeImage}
                              disabled={isProcessing}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              {isProcessing ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Generate Meme
                                </>
                              )}
                            </Button>

                            {finalMeme && (
                              <Button onClick={downloadMeme} variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              New Image
                            </Button>
                          </div>

                          {/* Processing Progress */}
                          {isProcessing && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Generating meme...</span>
                                <span>{progress}%</span>
                              </div>
                              <Progress value={progress} className="w-full" />
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="templates">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Template Search and Filter */}
                        <div className="flex space-x-2">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search templates..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <Select
                            value={templateCategory}
                            onValueChange={setTemplateCategory}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="reaction">Reaction</SelectItem>
                              <SelectItem value="choice">Choice</SelectItem>
                              <SelectItem value="opinion">Opinion</SelectItem>
                              <SelectItem value="comparison">
                                Comparison
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Template Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                          {filteredTemplates.map((template) => (
                            <div
                              key={template.id}
                              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                selectedTemplate?.id === template.id
                                  ? "border-yellow-500 ring-2 ring-yellow-200"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => handleTemplateSelect(template)}
                            >
                              <img
                                src={template.thumbnail}
                                alt={template.name}
                                className="w-full h-24 object-cover"
                              />
                              <div className="p-2">
                                <p className="text-xs font-medium truncate">
                                  {template.name}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {template.category}
                                  </Badge>
                                  {template.popular && (
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {filteredTemplates.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Search className="h-8 w-8 mx-auto mb-2" />
                            <p>No templates found</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Text Editor Panel */}
            <div className="space-y-6">
              {/* Text Overlays List */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Text Overlays</h3>
                    <Button
                      onClick={addTextOverlay}
                      size="sm"
                      variant="outline"
                    >
                      <Type className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {textOverlays.map((overlay, index) => (
                      <div
                        key={overlay.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedOverlay === overlay.id
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedOverlay(overlay.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {overlay.text || `Text ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {overlay.fontFamily}, {overlay.fontSize}px
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTextOverlay(overlay.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {textOverlays.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Type className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No text overlays yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Text Editor */}
              {selectedOverlayData && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Edit Text</h3>
                    <div className="space-y-4">
                      {/* Text Content */}
                      <div>
                        <Label className="text-sm font-medium">Text</Label>
                        <Textarea
                          value={selectedOverlayData.text}
                          onChange={(e) =>
                            updateTextOverlay(selectedOverlay!, {
                              text: e.target.value,
                            })
                          }
                          placeholder="Enter your meme text..."
                          className="mt-1"
                          rows={2}
                        />
                      </div>

                      {/* Font Settings */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium">Font</Label>
                          <Select
                            value={selectedOverlayData.fontFamily}
                            onValueChange={(value) =>
                              updateTextOverlay(selectedOverlay!, {
                                fontFamily: value,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontFamilies.map((font) => (
                                <SelectItem key={font} value={font}>
                                  {font}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Size: {selectedOverlayData.fontSize}
                          </Label>
                          <Slider
                            value={[selectedOverlayData.fontSize]}
                            onValueChange={(value) =>
                              updateTextOverlay(selectedOverlay!, {
                                fontSize: value[0],
                              })
                            }
                            min={16}
                            max={120}
                            step={2}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Colors */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium">
                            Text Color
                          </Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {colors.map((color) => (
                              <button
                                key={color}
                                className={`w-6 h-6 rounded border-2 ${
                                  selectedOverlayData.color === color
                                    ? "border-gray-400"
                                    : "border-gray-200"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() =>
                                  updateTextOverlay(selectedOverlay!, { color })
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Stroke Color
                          </Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {colors.map((color) => (
                              <button
                                key={color}
                                className={`w-6 h-6 rounded border-2 ${
                                  selectedOverlayData.strokeColor === color
                                    ? "border-gray-400"
                                    : "border-gray-200"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() =>
                                  updateTextOverlay(selectedOverlay!, {
                                    strokeColor: color,
                                  })
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Position */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium">
                            X Position: {selectedOverlayData.x}%
                          </Label>
                          <Slider
                            value={[selectedOverlayData.x]}
                            onValueChange={(value) =>
                              updateTextOverlay(selectedOverlay!, {
                                x: value[0],
                              })
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Y Position: {selectedOverlayData.y}%
                          </Label>
                          <Slider
                            value={[selectedOverlayData.y]}
                            onValueChange={(value) =>
                              updateTextOverlay(selectedOverlay!, {
                                y: value[0],
                              })
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Style Options */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="bold"
                              checked={selectedOverlayData.bold}
                              onCheckedChange={(checked) =>
                                updateTextOverlay(selectedOverlay!, {
                                  bold: checked,
                                })
                              }
                            />
                            <Label htmlFor="bold" className="text-sm">
                              Bold
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="uppercase"
                              checked={selectedOverlayData.uppercase}
                              onCheckedChange={(checked) =>
                                updateTextOverlay(selectedOverlay!, {
                                  uppercase: checked,
                                })
                              }
                            />
                            <Label htmlFor="uppercase" className="text-sm">
                              UPPER
                            </Label>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Stroke Width: {selectedOverlayData.strokeWidth}
                          </Label>
                          <Slider
                            value={[selectedOverlayData.strokeWidth]}
                            onValueChange={(value) =>
                              updateTextOverlay(selectedOverlay!, {
                                strokeWidth: value[0],
                              })
                            }
                            min={0}
                            max={10}
                            step={1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Opacity: {selectedOverlayData.opacity}%
                          </Label>
                          <Slider
                            value={[selectedOverlayData.opacity]}
                            onValueChange={(value) =>
                              updateTextOverlay(selectedOverlay!, {
                                opacity: value[0],
                              })
                            }
                            min={0}
                            max={100}
                            step={5}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              <Alert>
                <Laugh className="h-4 w-4" />
                <AlertDescription>
                  <strong>Meme Tips:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Keep text short and punchy</li>
                    <li>• Use high contrast colors</li>
                    <li>• Popular fonts: Impact, Arial Black</li>
                    <li>• Place text at top and bottom</li>
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
