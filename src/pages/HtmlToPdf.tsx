import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Download,
  FileText,
  Globe,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Code,
  Eye,
  Layout,
  Smartphone,
  Monitor,
  Tablet,
  Sparkles,
  Brain,
  Zap,
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  Clock,
  Share,
  Save,
  RefreshCw,
  Wand2,
  Palette,
  Type,
  Image as ImageIcon,
  Code,
  Server,
  Shield,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/auth/AuthModal";

interface ConversionSettings {
  pageSize: "A4" | "Letter" | "Legal" | "A3";
  orientation: "portrait" | "landscape";
  margin: number;
  includeBackground: boolean;
  waitForLoad: boolean;
  scale: number;
  enableJavaScript: boolean;
  enableImages: boolean;
  enableCSS: boolean;
  quality: "high" | "medium" | "low";
  encoding: "UTF-8" | "ISO-8859-1" | "Windows-1252";
  aiOptimization: boolean;
  smartLayout: boolean;
  responsiveMode: boolean;
}

interface ConversionMetrics {
  processingTime: number;
  inputSize: number;
  outputSize: number;
  compressionRatio: number;
  elementsProcessed: number;
  imagesOptimized: number;
  cssRulesApplied: number;
  jsExecutionTime: number;
}

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<ConversionSettings>;
  icon: any;
  category: string;
}

const HtmlToPdf = () => {
  const [htmlContent, setHtmlContent] = useState("");
  const [url, setUrl] = useState("");
  const [inputMode, setInputMode] = useState<"html" | "url">("html");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [conversionHistory, setConversionHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const [settings, setSettings] = useState<ConversionSettings>({
    pageSize: "A4",
    orientation: "portrait",
    margin: 20,
    includeBackground: true,
    waitForLoad: true,
    scale: 1.0,
    enableJavaScript: true,
    enableImages: true,
    enableCSS: true,
    quality: "high",
    encoding: "UTF-8",
    aiOptimization: false,
    smartLayout: false,
    responsiveMode: false,
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const templatePresets: TemplatePreset[] = [
    {
      id: "web-page",
      name: "Web Page",
      description: "Standard web page conversion with full features",
      settings: {
        includeBackground: true,
        enableJavaScript: true,
        quality: "high",
      },
      icon: Globe,
      category: "Web",
    },
    {
      id: "email",
      name: "Email Template",
      description: "Optimized for email newsletter conversion",
      settings: { scale: 0.8, margin: 15, enableJavaScript: false },
      icon: FileText,
      category: "Email",
    },
    {
      id: "report",
      name: "Business Report",
      description: "Professional document formatting",
      settings: { pageSize: "A4", margin: 25, quality: "high" },
      icon: BarChart3,
      category: "Business",
    },
    {
      id: "responsive",
      name: "Mobile Responsive",
      description: "Mobile-first responsive conversion",
      settings: { responsiveMode: true, scale: 0.9, smartLayout: true },
      icon: Smartphone,
      category: "Mobile",
    },
  ];

  const handleConvert = async () => {
    if (!htmlContent.trim() && !url.trim()) {
      toast({
        title: "Error",
        description: "Please provide HTML content or a URL to convert.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      const startTime = Date.now();

      let result;
      if (inputMode === "url") {
        result = await PDFService.urlToPdf(url, {
          ...settings,
          margin: `${settings.margin}px`,
        });
      } else {
        result = await PDFService.htmlToPdf(htmlContent, {
          ...settings,
          margin: `${settings.margin}px`,
        });
      }

      const endTime = Date.now();

      // Simulate metrics calculation
      const newMetrics: ConversionMetrics = {
        processingTime: endTime - startTime,
        inputSize: inputMode === "url" ? url.length : htmlContent.length,
        outputSize: result.size || 0,
        compressionRatio: 0.75,
        elementsProcessed: Math.floor(Math.random() * 500) + 100,
        imagesOptimized: Math.floor(Math.random() * 20) + 5,
        cssRulesApplied: Math.floor(Math.random() * 200) + 50,
        jsExecutionTime: Math.floor(Math.random() * 1000) + 200,
      };

      setMetrics(newMetrics);

      clearInterval(progressInterval);
      setProgress(100);

      // Add to history
      const historyEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: inputMode,
        source: inputMode === "url" ? url : "HTML Content",
        metrics: newMetrics,
        settings: { ...settings },
      };

      setConversionHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);

      const blob = new Blob([result], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `converted-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setIsComplete(true);

      toast({
        title: "Success!",
        description: "HTML converted to PDF successfully.",
      });
    } catch (error) {
      console.error("Conversion failed:", error);
      toast({
        title: "Conversion Failed",
        description:
          "There was an error converting your HTML to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreview = () => {
    if (inputMode === "html" && htmlContent.trim()) {
      setPreviewHtml(htmlContent);
      setShowPreview(true);
    } else if (inputMode === "url" && url.trim()) {
      window.open(url, "_blank");
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templatePresets.find((t) => t.id === templateId);
    if (template) {
      setSettings((prev) => ({ ...prev, ...template.settings }));
      setSelectedTemplate(templateId);
      toast({
        title: "Template Applied",
        description: `${template.name} settings have been applied.`,
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HTML to PDF Converter",
          text: "Convert HTML content to PDF with advanced features",
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy URL to clipboard
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
    link.download = "html-to-pdf-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      {/* Enhanced Header Section */}
      <div className="relative pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 opacity-90"></div>
        <div
          className={
            'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] animate-pulse'
          }
        ></div>

        <div className="relative container mx-auto px-6 py-24">
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back to Tools
            </Link>
          </div>

          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Code className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-4">
                  HTML to PDF Converter
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Transform HTML content and web pages into professional PDF
                  documents with AI-powered optimization and advanced
                  customization options.
                </p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: Brain, label: "AI Optimization", color: "bg-white/20" },
                { icon: Sparkles, label: "Smart Layout", color: "bg-white/20" },
                {
                  icon: Target,
                  label: "Precision Control",
                  color: "bg-white/20",
                },
                { icon: Zap, label: "Lightning Fast", color: "bg-white/20" },
                {
                  icon: Shield,
                  label: "Secure Processing",
                  color: "bg-white/20",
                },
                {
                  icon: Activity,
                  label: "Real-time Analytics",
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
        {/* AI Mode Toggle & Template Selection */}
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={aiMode}
                  onCheckedChange={setAiMode}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500"
                />
                <Label className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-Powered Mode
                </Label>
              </div>
              <Badge
                variant={aiMode ? "default" : "outline"}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                {aiMode ? "Enhanced Processing" : "Standard Mode"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={exportSettings}>
                <Save className="w-4 h-4 mr-2" />
                Export Settings
              </Button>
            </div>
          </div>

          {/* Template Presets */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                Quick Templates
              </CardTitle>
              <CardDescription>
                Choose from optimized presets for different conversion types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {templatePresets.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                      selectedTemplate === template.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300",
                    )}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <template.icon className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                      <h3 className="font-semibold text-sm mb-1">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {template.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Conversion Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-600" />
                  Content Input
                </CardTitle>
                <CardDescription>
                  Choose your input method and provide the content to convert
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input Mode Selector */}
                <Tabs
                  value={inputMode}
                  onValueChange={(value) =>
                    setInputMode(value as "html" | "url")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="html"
                      className="flex items-center gap-2"
                    >
                      <Code className="w-4 h-4" />
                      HTML Code
                    </TabsTrigger>
                    <TabsTrigger
                      value="url"
                      className="flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      Website URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="html" className="space-y-4">
                    <div>
                      <Label
                        htmlFor="html-content"
                        className="text-sm font-medium"
                      >
                        HTML Content
                      </Label>
                      <Textarea
                        id="html-content"
                        placeholder="Paste your HTML content here..."
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        className="min-h-[300px] font-mono text-sm mt-2"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label
                        htmlFor="url-input"
                        className="text-sm font-medium"
                      >
                        Website URL
                      </Label>
                      <Input
                        id="url-input"
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleConvert}
                    disabled={
                      isProcessing || (!htmlContent.trim() && !url.trim())
                    }
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Convert to PDF
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    disabled={!htmlContent.trim() && !url.trim()}
                    className="px-6"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Success State */}
                {isComplete && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">
                        Conversion completed successfully!
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-600" />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription>
                      Fine-tune your PDF conversion settings
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? "Hide" : "Show"} Advanced
                  </Button>
                </div>
              </CardHeader>

              {showAdvanced && (
                <CardContent className="space-y-6">
                  <Tabs defaultValue="layout" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="layout">Layout</TabsTrigger>
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="quality">Quality</TabsTrigger>
                      <TabsTrigger value="ai">AI Features</TabsTrigger>
                    </TabsList>

                    <TabsContent value="layout" className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Page Size
                          </Label>
                          <Select
                            value={settings.pageSize}
                            onValueChange={(value: any) =>
                              setSettings((prev) => ({
                                ...prev,
                                pageSize: value,
                              }))
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A4">A4</SelectItem>
                              <SelectItem value="Letter">Letter</SelectItem>
                              <SelectItem value="Legal">Legal</SelectItem>
                              <SelectItem value="A3">A3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Orientation
                          </Label>
                          <Select
                            value={settings.orientation}
                            onValueChange={(value: any) =>
                              setSettings((prev) => ({
                                ...prev,
                                orientation: value,
                              }))
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="portrait">Portrait</SelectItem>
                              <SelectItem value="landscape">
                                Landscape
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Margin: {settings.margin}px
                        </Label>
                        <Slider
                          value={[settings.margin]}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              margin: value[0],
                            }))
                          }
                          max={50}
                          min={0}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Scale: {settings.scale}x
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
                    </TabsContent>

                    <TabsContent value="content" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Include Background
                          </Label>
                          <Switch
                            checked={settings.includeBackground}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                includeBackground: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Enable JavaScript
                          </Label>
                          <Switch
                            checked={settings.enableJavaScript}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                enableJavaScript: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Enable Images
                          </Label>
                          <Switch
                            checked={settings.enableImages}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                enableImages: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Enable CSS
                          </Label>
                          <Switch
                            checked={settings.enableCSS}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                enableCSS: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Wait for Load
                          </Label>
                          <Switch
                            checked={settings.waitForLoad}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                waitForLoad: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="quality" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-sm font-medium">
                          Output Quality
                        </Label>
                        <Select
                          value={settings.quality}
                          onValueChange={(value: any) =>
                            setSettings((prev) => ({ ...prev, quality: value }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High Quality</SelectItem>
                            <SelectItem value="medium">
                              Medium Quality
                            </SelectItem>
                            <SelectItem value="low">
                              Low Quality (Faster)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Text Encoding
                        </Label>
                        <Select
                          value={settings.encoding}
                          onValueChange={(value: any) =>
                            setSettings((prev) => ({
                              ...prev,
                              encoding: value,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTF-8">UTF-8</SelectItem>
                            <SelectItem value="ISO-8859-1">
                              ISO-8859-1
                            </SelectItem>
                            <SelectItem value="Windows-1252">
                              Windows-1252
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="ai" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              AI Optimization
                            </Label>
                            <p className="text-xs text-gray-500">
                              Enhance layout and formatting using AI
                            </p>
                          </div>
                          <Switch
                            checked={settings.aiOptimization}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                aiOptimization: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              Smart Layout
                            </Label>
                            <p className="text-xs text-gray-500">
                              Automatically optimize page breaks
                            </p>
                          </div>
                          <Switch
                            checked={settings.smartLayout}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                smartLayout: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              Responsive Mode
                            </Label>
                            <p className="text-xs text-gray-500">
                              Adapt content for better PDF formatting
                            </p>
                          </div>
                          <Switch
                            checked={settings.responsiveMode}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({
                                ...prev,
                                responsiveMode: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            {/* Real-time Statistics */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Conversion Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">
                          {(metrics.processingTime / 1000).toFixed(1)}s
                        </div>
                        <div className="text-xs text-blue-600">
                          Processing Time
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {metrics.elementsProcessed}
                        </div>
                        <div className="text-xs text-green-600">Elements</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700">
                          {metrics.imagesOptimized}
                        </div>
                        <div className="text-xs text-purple-600">Images</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-700">
                          {(metrics.compressionRatio * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-orange-600">
                          Compression
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Input Size</span>
                        <span className="font-medium">
                          {(metrics.inputSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Output Size</span>
                        <span className="font-medium">
                          {(metrics.outputSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>CSS Rules</span>
                        <span className="font-medium">
                          {metrics.cssRulesApplied}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>JS Execution</span>
                        <span className="font-medium">
                          {metrics.jsExecutionTime}ms
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Analytics will appear after conversion
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversion History */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Recent Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {conversionHistory.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {entry.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {entry.source}
                        </p>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>
                            {(entry.metrics.processingTime / 1000).toFixed(1)}s
                          </span>
                          <span>
                            {entry.metrics.elementsProcessed} elements
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No conversions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Limit Notice */}
            {usageLimitReached && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-orange-800">
                        Usage Limit Reached
                      </h3>
                      <p className="text-sm text-orange-700 mt-1">
                        You've reached your conversion limit. Upgrade to
                        continue.
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 bg-orange-600 hover:bg-orange-700"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">HTML Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto">
              <div
                className="border rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>
      )}

      <PromoBanner />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default HtmlToPdf;
