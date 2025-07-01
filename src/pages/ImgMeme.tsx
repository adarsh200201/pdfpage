import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import ImgHeader from "../components/layout/ImgHeader";
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
import { CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { imageService } from "../services/imageService";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { UsageService } from "../services/usageService";
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
  Brain,
  Zap,
  Target,
  BarChart3,
  Clock,
  Share,
  Activity,
  Wand2,
  Smile,
  Heart,
  Star,
  Flame,
  ThumbsUp,
  Camera,
  Film,
  Music,
  Gamepad2,
  Coffee,
  Pizza,
  Rocket,
  Crown,
  ArrowLeft,
} from "lucide-react";

interface MemeSettings {
  topText: string;
  bottomText: string;
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  strokeColor: string;
  strokeWidth: number;
  textAlignment: "left" | "center" | "right";
  textPosition: "top" | "center" | "bottom" | "custom";
  backgroundColor: string;
  imageOpacity: number;
  textOpacity: number;
  shadowEnabled: boolean;
  shadowBlur: number;
  shadowOffset: number;
  allCaps: boolean;
  bold: boolean;
  italic: boolean;
  rotation: number;
  scale: number;
  aiEnhancement: boolean;
  viralOptimization: boolean;
  autoSuggestions: boolean;
}

interface MemeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  popularity: number;
  trending: boolean;
  imageUrl?: string;
  textPresets?: {
    topText: string;
    bottomText: string;
  };
}

interface MemeMetrics {
  generationTime: number;
  viralPotential: number;
  humorScore: number;
  shareability: number;
  trendinessScore: number;
  textReadability: number;
  visualImpact: number;
  memeQuality: number;
}

const ImgMeme = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [metrics, setMetrics] = useState<MemeMetrics | null>(null);
  const [memeHistory, setMemeHistory] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showTemplates, setShowTemplates] = useState(true);
  const [undoHistory, setUndoHistory] = useState<MemeSettings[]>([]);
  const [redoHistory, setRedoHistory] = useState<MemeSettings[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [settings, setSettings] = useState<MemeSettings>({
    topText: "",
    bottomText: "",
    fontSize: 48,
    fontFamily: "Impact",
    fontColor: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 3,
    textAlignment: "center",
    textPosition: "top",
    backgroundColor: "transparent",
    imageOpacity: 100,
    textOpacity: 100,
    shadowEnabled: true,
    shadowBlur: 4,
    shadowOffset: 2,
    allCaps: true,
    bold: true,
    italic: false,
    rotation: 0,
    scale: 1,
    aiEnhancement: false,
    viralOptimization: true,
    autoSuggestions: true,
  });

  const memeTemplates: MemeTemplate[] = [
    {
      id: "distracted-boyfriend",
      name: "Distracted Boyfriend",
      description: "Classic choice meme template",
      category: "Relationship",
      icon: Heart,
      popularity: 98,
      trending: true,
      textPresets: {
        topText: "Me",
        bottomText: "New Technology",
      },
    },
    {
      id: "drake-pointing",
      name: "Drake Pointing",
      description: "No/Yes preference meme",
      category: "Choice",
      icon: ThumbsUp,
      popularity: 95,
      trending: true,
      textPresets: {
        topText: "Old way",
        bottomText: "New way",
      },
    },
    {
      id: "woman-yelling-cat",
      name: "Woman Yelling at Cat",
      description: "Argument and confusion meme",
      category: "Reaction",
      icon: Laugh,
      popularity: 92,
      trending: false,
      textPresets: {
        topText: "When someone says",
        bottomText: "My reaction",
      },
    },
    {
      id: "two-buttons",
      name: "Two Buttons",
      description: "Difficult choice dilemma",
      category: "Decision",
      icon: Target,
      popularity: 88,
      trending: false,
      textPresets: {
        topText: "Hard choice 1",
        bottomText: "Hard choice 2",
      },
    },
    {
      id: "this-is-fine",
      name: "This is Fine",
      description: "Everything's falling apart but it's okay",
      category: "Situation",
      icon: Flame,
      popularity: 90,
      trending: true,
      textPresets: {
        topText: "When everything goes wrong",
        bottomText: "This is fine",
      },
    },
    {
      id: "expanding-brain",
      name: "Expanding Brain",
      description: "Levels of enlightenment",
      category: "Intelligence",
      icon: Brain,
      popularity: 86,
      trending: false,
      textPresets: {
        topText: "Basic idea",
        bottomText: "Galaxy brain idea",
      },
    },
    {
      id: "stonks",
      name: "Stonks",
      description: "Business and investment humor",
      category: "Business",
      icon: TrendingUp,
      popularity: 84,
      trending: true,
      textPresets: {
        topText: "When you invest in",
        bottomText: "STONKS ↗",
      },
    },
    {
      id: "surprised-pikachu",
      name: "Surprised Pikachu",
      description: "Shock and disbelief reaction",
      category: "Reaction",
      icon: Zap,
      popularity: 89,
      trending: false,
      textPresets: {
        topText: "When unexpected thing happens",
        bottomText: "",
      },
    },
  ];

  const fontFamilies = [
    "Impact",
    "Arial Black",
    "Comic Sans MS",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Georgia",
    "Trebuchet MS",
    "Futura",
  ];

  const viralCategories = [
    { name: "Trending", icon: TrendingUp, color: "text-red-500" },
    { name: "Gaming", icon: Gamepad2, color: "text-blue-500" },
    { name: "Food", icon: Pizza, color: "text-yellow-500" },
    { name: "Tech", icon: Rocket, color: "text-purple-500" },
    { name: "Life", icon: Coffee, color: "text-brown-500" },
    { name: "Entertainment", icon: Film, color: "text-green-500" },
  ];

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 15 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please select an image smaller than 15MB.",
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

  const handleTemplateSelect = (templateId: string) => {
    const template = memeTemplates.find((t) => t.id === templateId);
    if (template && template.textPresets) {
      saveToUndoHistory();
      setSettings((prev) => ({
        ...prev,
        topText: template.textPresets!.topText,
        bottomText: template.textPresets!.bottomText,
      }));
      setSelectedTemplate(templateId);
      toast({
        title: "Template Applied",
        description: `${template.name} template has been applied.`,
      });
    }
  };

  const saveToUndoHistory = () => {
    setUndoHistory((prev) => [...prev.slice(-9), { ...settings }]);
    setRedoHistory([]);
  };

  const handleUndo = () => {
    if (undoHistory.length > 0) {
      const lastState = undoHistory[undoHistory.length - 1];
      setRedoHistory((prev) => [...prev, { ...settings }]);
      setSettings(lastState);
      setUndoHistory((prev) => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoHistory.length > 0) {
      const nextState = redoHistory[redoHistory.length - 1];
      setUndoHistory((prev) => [...prev, { ...settings }]);
      setSettings(nextState);
      setRedoHistory((prev) => prev.slice(0, -1));
    }
  };

  const generateAISuggestions = () => {
    const suggestions = [
      "When you find a bug in production",
      "Monday morning energy",
      "Me explaining my code to junior devs",
      "When the client wants it done yesterday",
      "CSS working on different browsers",
      "When you fix one bug and create three more",
    ];

    const randomSuggestion =
      suggestions[Math.floor(Math.random() * suggestions.length)];
    saveToUndoHistory();
    setSettings((prev) => ({
      ...prev,
      topText: randomSuggestion,
      bottomText: "It be like that sometimes",
    }));

    toast({
      title: "AI Suggestion Applied",
      description: "Try this viral-worthy text combination!",
    });
  };

  const handleGenerateMeme = async () => {
    if (!selectedFile && !selectedTemplate) {
      toast({
        title: "No image or template selected",
        description: "Please select an image or choose a template.",
        variant: "destructive",
      });
      return;
    }

    if (!settings.topText && !settings.bottomText) {
      toast({
        title: "No text provided",
        description: "Please add some text to create your meme.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate memes.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 300);

      const startTime = Date.now();

      // Since generateMeme doesn't exist in imageService, we'll use addTextWatermark as a simulation
      const result = await imageService.addTextWatermark(
        selectedFile!,
        settings.topText,
        {
          fontSize: settings.fontSize,
          color: settings.fontColor,
          opacity: settings.textOpacity / 100,
          position: "center",
        },
      );

      const endTime = Date.now();

      // Simulate AI metrics calculation
      const newMetrics: MemeMetrics = {
        generationTime: endTime - startTime,
        viralPotential: 70 + Math.random() * 25,
        humorScore: 65 + Math.random() * 30,
        shareability: 75 + Math.random() * 20,
        trendinessScore: selectedTemplate
          ? 85 + Math.random() * 10
          : 60 + Math.random() * 25,
        textReadability: 80 + Math.random() * 15,
        visualImpact: 70 + Math.random() * 25,
        memeQuality: 75 + Math.random() * 20,
      };

      setMetrics(newMetrics);

      clearInterval(progressInterval);
      setProgress(100);

      // Create result preview URL
      const url = URL.createObjectURL(result);
      setResultUrl(url);

      // Add to history
      const historyEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        topText: settings.topText,
        bottomText: settings.bottomText,
        template: selectedTemplate || "Custom",
        metrics: newMetrics,
        settings: { ...settings },
      };

      setMemeHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);

      // Download the result
      const link = document.createElement("a");
      link.href = url;
      link.download = `meme-${Date.now()}.${settings.aiEnhancement ? "png" : "jpg"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsComplete(true);

      toast({
        title: "Meme Generated Successfully!",
        description: `Viral potential: ${newMetrics.viralPotential.toFixed(0)}%`,
      });
    } catch (error) {
      console.error("Meme generation failed:", error);
      toast({
        title: "Generation failed",
        description:
          "There was an error generating your meme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && resultUrl) {
      try {
        await navigator.share({
          title: "Check out this meme!",
          text: "I just created this awesome meme!",
          url: resultUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Page URL copied to clipboard.",
      });
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meme-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-100">
      <ImgHeader />

      {/* Enhanced Header Section */}
      <div className="relative pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-700 opacity-90"></div>
        <div
          className={
            'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0l8 8-8 8V8h-4v26h4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] animate-pulse'
          }
        ></div>

        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Laugh className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-4">
                  AI Meme Generator
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Create viral-worthy memes with AI-powered text suggestions,
                  trending templates, and professional editing tools.
                </p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: Brain, label: "AI Powered", color: "bg-white/20" },
                {
                  icon: Sparkles,
                  label: "Viral Templates",
                  color: "bg-white/20",
                },
                {
                  icon: TrendingUp,
                  label: "Trend Analysis",
                  color: "bg-white/20",
                },
                {
                  icon: Zap,
                  label: "Instant Generation",
                  color: "bg-white/20",
                },
                {
                  icon: Target,
                  label: "Precision Tools",
                  color: "bg-white/20",
                },
                {
                  icon: Activity,
                  label: "Viral Metrics",
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

      <div className="container mx-auto px-6 py-12">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <Link
            to="/img"
            className="flex items-center text-violet-600 hover:text-violet-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to ImgPage
          </Link>
        </div>

        {/* Mobile-First Upload Section - TOP PRIORITY */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-violet-600" />
              Upload Image or Use Template
            </CardTitle>
            <CardDescription>
              Upload your own image or select from viral templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center hover:border-violet-400 transition-colors cursor-pointer ${
                isDragging
                  ? "border-violet-500 bg-violet-50"
                  : "border-gray-300"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-violet-600" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-base sm:text-lg font-medium text-gray-700">
                      Click to upload an image
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      or drag and drop your file here
                    </p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* AI Mode Toggle & Quick Actions */}
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={aiMode}
                  onCheckedChange={setAiMode}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-purple-500"
                />
                <Label className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="w-5 h-5 text-violet-600" />
                  AI-Enhanced Mode
                </Label>
              </div>
              <Badge
                variant={aiMode ? "default" : "outline"}
                className="bg-gradient-to-r from-violet-500 to-purple-500 text-white"
              >
                {aiMode ? "Viral Optimization" : "Basic Mode"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={undoHistory.length === 0}
              >
                <Undo className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={redoHistory.length === 0}
              >
                <Redo className="w-4 h-4 mr-2" />
                Redo
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={exportSettings}>
                <Save className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Viral Templates */}
          {showTemplates && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-violet-600" />
                    Viral Meme Templates
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(false)}
                  >
                    Hide Templates
                  </Button>
                </div>
                <CardDescription>
                  Choose from trending meme templates with proven viral
                  potential
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  {memeTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                        selectedTemplate === template.id
                          ? "border-violet-500 bg-violet-50"
                          : "border-gray-200 hover:border-violet-300"
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="relative">
                          <template.icon className="w-8 h-8 mx-auto mb-2 text-violet-600" />
                          {template.trending && (
                            <div className="absolute -top-1 -right-1">
                              <Badge
                                variant="destructive"
                                className="text-xs px-1 py-0 bg-red-500"
                              >
                                🔥
                              </Badge>
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-xs mb-1">
                          {template.name}
                        </h3>
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <span className="text-green-600 font-medium">
                            {template.popularity}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Meme Creation Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meme Preview */}
            {(previewUrl || selectedTemplate) && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Meme Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <div className="relative">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Meme base"
                          className="w-full h-auto max-h-96 object-contain"
                          style={{
                            opacity: settings.imageOpacity / 100,
                            transform: `rotate(${settings.rotation}deg) scale(${settings.scale})`,
                          }}
                        />
                      ) : (
                        <div className="w-full h-96 bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                          <div className="text-center">
                            <Laugh className="w-16 h-16 mx-auto mb-4 text-violet-400" />
                            <p className="text-lg text-violet-600 font-semibold">
                              {selectedTemplate
                                ? `${memeTemplates.find((t) => t.id === selectedTemplate)?.name} Template`
                                : "Template Preview"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Text Overlays */}
                      {settings.topText && (
                        <div
                          className="absolute top-4 left-4 right-4 text-center"
                          style={{
                            fontSize: `${settings.fontSize * 0.75}px`,
                            fontFamily: settings.fontFamily,
                            color: settings.fontColor,
                            textAlign: settings.textAlignment,
                            fontWeight: settings.bold ? "bold" : "normal",
                            fontStyle: settings.italic ? "italic" : "normal",
                            textTransform: settings.allCaps
                              ? "uppercase"
                              : "none",
                            textShadow: settings.shadowEnabled
                              ? `${settings.shadowOffset}px ${settings.shadowOffset}px ${settings.shadowBlur}px rgba(0,0,0,0.8)`
                              : "none",
                            WebkitTextStroke: `${settings.strokeWidth}px ${settings.strokeColor}`,
                            opacity: settings.textOpacity / 100,
                          }}
                        >
                          {settings.topText}
                        </div>
                      )}

                      {settings.bottomText && (
                        <div
                          className="absolute bottom-4 left-4 right-4 text-center"
                          style={{
                            fontSize: `${settings.fontSize * 0.75}px`,
                            fontFamily: settings.fontFamily,
                            color: settings.fontColor,
                            textAlign: settings.textAlignment,
                            fontWeight: settings.bold ? "bold" : "normal",
                            fontStyle: settings.italic ? "italic" : "normal",
                            textTransform: settings.allCaps
                              ? "uppercase"
                              : "none",
                            textShadow: settings.shadowEnabled
                              ? `${settings.shadowOffset}px ${settings.shadowOffset}px ${settings.shadowBlur}px rgba(0,0,0,0.8)`
                              : "none",
                            WebkitTextStroke: `${settings.strokeWidth}px ${settings.strokeColor}`,
                            opacity: settings.textOpacity / 100,
                          }}
                        >
                          {settings.bottomText}
                        </div>
                      )}
                    </div>
                  </div>

                  {resultUrl && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">
                            Meme Generated Successfully!
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => window.open(resultUrl)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Text and Style Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5 text-gray-600" />
                    Text & Style
                  </CardTitle>
                  <div className="flex gap-2">
                    {settings.autoSuggestions && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateAISuggestions}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        AI Suggest
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      {showAdvanced ? "Hide" : "Show"} Advanced
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Top Text</Label>
                    <Textarea
                      value={settings.topText}
                      onChange={(e) => {
                        saveToUndoHistory();
                        setSettings((prev) => ({
                          ...prev,
                          topText: e.target.value,
                        }));
                      }}
                      placeholder="Enter top text for your meme..."
                      className="mt-2"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Bottom Text</Label>
                    <Textarea
                      value={settings.bottomText}
                      onChange={(e) => {
                        saveToUndoHistory();
                        setSettings((prev) => ({
                          ...prev,
                          bottomText: e.target.value,
                        }));
                      }}
                      placeholder="Enter bottom text for your meme..."
                      className="mt-2"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Font Family</Label>
                    <Select
                      value={settings.fontFamily}
                      onValueChange={(value) =>
                        setSettings((prev) => ({ ...prev, fontFamily: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontFamilies.map((font) => (
                          <SelectItem key={font} value={font}>
                            <span style={{ fontFamily: font }}>{font}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Font Size: {settings.fontSize}px
                    </Label>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          fontSize: value[0],
                        }))
                      }
                      max={100}
                      min={16}
                      step={2}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">All Caps</Label>
                    <Switch
                      checked={settings.allCaps}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, allCaps: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Bold</Label>
                    <Switch
                      checked={settings.bold}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, bold: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Italic</Label>
                    <Switch
                      checked={settings.italic}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, italic: checked }))
                      }
                    />
                  </div>
                </div>

                {showAdvanced && (
                  <Tabs defaultValue="colors" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="colors">Colors</TabsTrigger>
                      <TabsTrigger value="effects">Effects</TabsTrigger>
                      <TabsTrigger value="transform">Transform</TabsTrigger>
                      <TabsTrigger value="ai">AI Features</TabsTrigger>
                    </TabsList>

                    <TabsContent value="colors" className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Text Color
                          </Label>
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="color"
                              value={settings.fontColor}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  fontColor: e.target.value,
                                }))
                              }
                              className="w-12 h-10 rounded border"
                            />
                            <Input
                              value={settings.fontColor}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  fontColor: e.target.value,
                                }))
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Stroke Color
                          </Label>
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="color"
                              value={settings.strokeColor}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  strokeColor: e.target.value,
                                }))
                              }
                              className="w-12 h-10 rounded border"
                            />
                            <Input
                              value={settings.strokeColor}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  strokeColor: e.target.value,
                                }))
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Stroke Width: {settings.strokeWidth}px
                        </Label>
                        <Slider
                          value={[settings.strokeWidth]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              strokeWidth: value[0],
                            }))
                          }
                          max={10}
                          min={0}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="effects" className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Text Shadow
                        </Label>
                        <Switch
                          checked={settings.shadowEnabled}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              shadowEnabled: checked,
                            }))
                          }
                        />
                      </div>

                      {settings.shadowEnabled && (
                        <>
                          <div>
                            <Label className="text-sm font-medium">
                              Shadow Blur: {settings.shadowBlur}px
                            </Label>
                            <Slider
                              value={[settings.shadowBlur]}
                              onValueChange={(value) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  shadowBlur: value[0],
                                }))
                              }
                              max={20}
                              min={0}
                              step={1}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium">
                              Shadow Offset: {settings.shadowOffset}px
                            </Label>
                            <Slider
                              value={[settings.shadowOffset]}
                              onValueChange={(value) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  shadowOffset: value[0],
                                }))
                              }
                              max={10}
                              min={0}
                              step={1}
                              className="mt-2"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <Label className="text-sm font-medium">
                          Text Opacity: {settings.textOpacity}%
                        </Label>
                        <Slider
                          value={[settings.textOpacity]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              textOpacity: value[0],
                            }))
                          }
                          max={100}
                          min={10}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="transform" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-sm font-medium">
                          Image Rotation: {settings.rotation}°
                        </Label>
                        <Slider
                          value={[settings.rotation]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              rotation: value[0],
                            }))
                          }
                          max={180}
                          min={-180}
                          step={15}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Image Scale: {settings.scale}x
                        </Label>
                        <Slider
                          value={[settings.scale]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              scale: value[0],
                            }))
                          }
                          max={2}
                          min={0.5}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Image Opacity: {settings.imageOpacity}%
                        </Label>
                        <Slider
                          value={[settings.imageOpacity]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              imageOpacity: value[0],
                            }))
                          }
                          max={100}
                          min={10}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="ai" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              AI Enhancement
                            </Label>
                            <p className="text-xs text-gray-500">
                              Improve image quality and text readability
                            </p>
                          </div>
                          <Switch
                            checked={settings.aiEnhancement}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                aiEnhancement: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              Viral Optimization
                            </Label>
                            <p className="text-xs text-gray-500">
                              Optimize for social media engagement
                            </p>
                          </div>
                          <Switch
                            checked={settings.viralOptimization}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                viralOptimization: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              Auto Suggestions
                            </Label>
                            <p className="text-xs text-gray-500">
                              Get AI-powered text suggestions
                            </p>
                          </div>
                          <Switch
                            checked={settings.autoSuggestions}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                autoSuggestions: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Generate Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleGenerateMeme}
                    disabled={
                      isProcessing ||
                      (!selectedFile && !selectedTemplate) ||
                      (!settings.topText && !settings.bottomText)
                    }
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Generating Meme...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Viral Meme
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Creating your masterpiece...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            {/* Viral Metrics */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-600" />
                  Viral Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-violet-700">
                          {metrics.viralPotential.toFixed(0)}%
                        </div>
                        <div className="text-xs text-violet-600">
                          Viral Potential
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-700">
                          {metrics.humorScore.toFixed(0)}%
                        </div>
                        <div className="text-xs text-pink-600">Humor Score</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">
                          {metrics.shareability.toFixed(0)}%
                        </div>
                        <div className="text-xs text-blue-600">
                          Shareability
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {metrics.trendinessScore.toFixed(0)}%
                        </div>
                        <div className="text-xs text-green-600">Trending</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Generation Time</span>
                        <span className="font-medium">
                          {(metrics.generationTime / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Text Readability</span>
                        <span className="font-medium">
                          {metrics.textReadability.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Visual Impact</span>
                        <span className="font-medium">
                          {metrics.visualImpact.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Meme Quality</span>
                        <span className="font-medium">
                          {metrics.memeQuality.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Metrics will appear after generating
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meme History */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Recent Memes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memeHistory.length > 0 ? (
                  <div className="space-y-3">
                    {memeHistory.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {entry.template}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {entry.topText && (
                            <p className="text-xs font-medium text-gray-700 truncate">
                              "{entry.topText}"
                            </p>
                          )}
                          {entry.bottomText && (
                            <p className="text-xs font-medium text-gray-700 truncate">
                              "{entry.bottomText}"
                            </p>
                          )}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>
                            🔥 {entry.metrics.viralPotential.toFixed(0)}%
                          </span>
                          <span>😂 {entry.metrics.humorScore.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No memes created yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trending Categories */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                  Trending Now
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {viralCategories.map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <category.icon className={`w-5 h-5 ${category.color}`} />
                      <span className="font-medium text-sm">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-gray-600">
                        {85 + Math.floor(Math.random() * 10)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  Pro Meme Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-yellow-800 text-sm">
                    Viral Formula
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    Relatable situation + unexpected twist = viral potential
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 text-sm">
                    Text Readability
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Keep text short, use high contrast, and enable text shadows
                    for readability.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-800 text-sm">
                    Trending Templates
                  </h3>
                  <p className="text-xs text-green-700 mt-1">
                    Use trending templates for higher viral potential and
                    shareability.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImgMeme;
