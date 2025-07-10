import React, { useState, useRef, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMixpanel } from "@/hooks/useMixpanel";
import {
  Upload,
  Link as LinkIcon,
  FileCode,
  Download,
  Settings,
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Eye,
  Zap,
  Play,
  Copy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { sampleHtmlContent, sampleUrls } from "@/utils/sample-html";
import { HtmlToPdfService } from "@/services/htmlToPdfService";
import type { ConversionSettings } from "@/services/htmlToPdfService";

interface ConversionProgress {
  stage: "idle" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  message: string;
}

const HtmlToPdf: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const {
    trackToolUsage,
    trackConversionStart,
    trackConversionComplete,
    trackConversionError,
  } = useMixpanel();

  // File and content state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"file" | "content" | "url">("url");

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress>({
    stage: "idle",
    progress: 0,
    message: "",
  });

  // Settings
  const [settings, setSettings] = useState<ConversionSettings>({
    pageFormat: "A4",
    orientation: "portrait",
    printBackground: true,
    waitForNetworkIdle: true,
    margins: {
      top: "1cm",
      bottom: "1cm",
      left: "1cm",
      right: "1cm",
    },
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (
          !file.name.toLowerCase().endsWith(".html") &&
          file.type !== "text/html"
        ) {
          toast({
            title: "Invalid file type",
            description: "Please select an HTML file (.html)",
            variant: "destructive",
          });
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          toast({
            title: "File too large",
            description: "Please select a file smaller than 10MB",
            variant: "destructive",
          });
          return;
        }

        setSelectedFile(file);
        trackToolUsage("HTML to PDF", "File Selected", {
          fileSize: file.size,
          fileName: file.name,
        });
      }
    },
    [toast, trackToolUsage],
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      const htmlFile = files.find(
        (file) =>
          file.name.toLowerCase().endsWith(".html") ||
          file.type === "text/html",
      );

      if (htmlFile) {
        setSelectedFile(htmlFile);
        setActiveTab("file");
      } else {
        toast({
          title: "Invalid file type",
          description: "Please drop an HTML file",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Simulate progress updates
  const updateProgress = (
    stage: ConversionProgress["stage"],
    progress: number,
    message: string,
  ) => {
    setProgress({ stage, progress, message });
  };

  // Test backend connection
  const testConnection = async () => {
    try {
      const isConnected = await HtmlToPdfService.testConnection();
      toast({
        title: isConnected ? "✅ Backend Connected" : "❌ Backend Error",
        description: isConnected
          ? "Backend is responding correctly"
          : "Cannot connect to backend service",
        variant: isConnected ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "❌ Connection Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Handle conversion
  const handleConvert = async () => {
    if (!selectedFile && !htmlContent.trim() && !websiteUrl.trim()) {
      toast({
        title: "No input provided",
        description:
          "Please provide HTML content, upload a file, or enter a URL",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    updateProgress("uploading", 10, "Preparing conversion...");

    try {
      // Prepare input based on active tab
      let input;
      if (activeTab === "file" && selectedFile) {
        input = { type: "file" as const, file: selectedFile };
      } else if (activeTab === "content" && htmlContent.trim()) {
        input = { type: "content" as const, htmlContent };
      } else if (activeTab === "url" && websiteUrl.trim()) {
        input = { type: "url" as const, websiteUrl };
      } else {
        throw new Error("Invalid input configuration");
      }

      updateProgress("processing", 30, "Converting HTML to PDF...");

      // Track conversion start
      trackConversionStart(
        activeTab === "file"
          ? "html"
          : activeTab === "url"
            ? "webpage"
            : "html-content",
        "pdf",
        selectedFile?.name || "content",
        selectedFile?.size || htmlContent.length || websiteUrl.length,
        settings,
      );

      // Try backend conversion first, fallback to client-side
      console.log("🔄 Attempting backend conversion...");
      let result;

      try {
        result = await HtmlToPdfService.convertToPdf(input, settings, user?.id);
        console.log("🔍 Backend result:", result);
        console.log("🔍 Backend result.success:", result.success);
        console.log("🔍 Backend result type:", typeof result.success);
      } catch (serviceError) {
        console.warn(
          "🔄 Service threw exception, using client-side fallback:",
          serviceError,
        );
        result = {
          success: false,
          error:
            serviceError instanceof Error
              ? serviceError.message
              : "Service error",
        };
      }

      if (!result.success) {
        console.warn(
          "🔄 Backend conversion failed, trying client-side fallback:",
          result.error,
        );

        updateProgress(
          "processing",
          50,
          "Backend unavailable, using client-side conversion...",
        );

        toast({
          title: "Using Alternative Method",
          description:
            "Backend is unavailable, using client-side conversion as fallback",
        });

        result = await HtmlToPdfService.convertToPdfClientSide(input, settings);
      }

      if (!result.success) {
        throw new Error(
          result.error || "Both backend and client-side conversion failed",
        );
      }

      updateProgress("processing", 80, "Finalizing PDF...");

      if (result.blob && result.filename) {
        updateProgress("completed", 100, "Conversion completed!");

        // Download the file
        HtmlToPdfService.downloadPdf(result.blob, result.filename);

        toast({
          title: "Conversion successful!",
          description: `Your PDF has been downloaded as ${result.filename}`,
        });

        // Track success with additional details
        trackConversionComplete(
          activeTab === "file"
            ? "html"
            : activeTab === "url"
              ? "webpage"
              : "html-content",
          "pdf",
          result.filename || "converted.pdf",
          result.details?.originalSize || 0,
          result.details?.pdfSize || 0,
          result.details?.processingTime || 0,
        );
      }
    } catch (error) {
      console.error("Conversion error:", error);
      updateProgress("error", 0, "Conversion failed");

      toast({
        title: "Conversion failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });

      trackConversionError(
        activeTab === "file"
          ? "html"
          : activeTab === "url"
            ? "webpage"
            : "html-content",
        "pdf",
        selectedFile?.name || "content",
        selectedFile?.size || htmlContent.length || websiteUrl.length,
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setIsConverting(false);
      setTimeout(() => {
        if (progress.stage !== "error") {
          setProgress({ stage: "idle", progress: 0, message: "" });
        }
      }, 3000);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setHtmlContent("");
    setWebsiteUrl("");
    setProgress({ stage: "idle", progress: 0, message: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadSampleContent = () => {
    setHtmlContent(sampleHtmlContent);
    setActiveTab("content");
    toast({
      title: "Sample content loaded",
      description: "You can now convert this sample HTML to PDF",
    });
    trackToolUsage("HTML to PDF", "Sample Loaded", { type: "content" });
  };

  const loadSampleUrl = (url: string, name: string) => {
    setWebsiteUrl(url);
    setActiveTab("url");
    toast({
      title: "Sample URL loaded",
      description: `Ready to convert ${name} to PDF`,
    });
    trackToolUsage("HTML to PDF", "Sample Loaded", { type: "url", name });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "HTML content copied successfully",
    });
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-8">
          <Link
            to="/"
            className="text-body-medium text-text-light hover:text-brand-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1 inline" />
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-heading-large text-text-dark mb-4">
            HTML to PDF Converter
          </h1>
          <p className="text-body-large text-text-light max-w-3xl mx-auto">
            Convert HTML files, web pages, and HTML content to professional PDF
            documents. Our powerful conversion engine uses Chromium technology
            for pixel-perfect results.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Conversion Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Tabs */}
            <Card>
              <CardContent className="p-6">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as any)}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="url"
                      className="flex items-center gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Website URL
                    </TabsTrigger>
                    <TabsTrigger
                      value="file"
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload HTML
                    </TabsTrigger>
                    <TabsTrigger
                      value="content"
                      className="flex items-center gap-2"
                    >
                      <FileCode className="w-4 h-4" />
                      HTML Code
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="website-url">Website URL</Label>
                      <Input
                        id="website-url"
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="mt-2"
                      />
                      <p className="text-sm text-text-light mt-2">
                        Enter a website URL to convert the entire page to PDF
                      </p>
                    </div>

                    <div>
                      <Label>Sample URLs</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {sampleUrls.map((sample, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              loadSampleUrl(sample.url, sample.name)
                            }
                            className="justify-start text-left h-auto p-3"
                          >
                            <div>
                              <div className="font-medium">{sample.name}</div>
                              <div className="text-xs text-text-light">
                                {sample.description}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                        selectedFile
                          ? "border-brand-red bg-red-50"
                          : "border-gray-300 hover:border-brand-red",
                      )}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".html,text/html"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {selectedFile ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center w-16 h-16 bg-brand-red rounded-full mx-auto">
                            <FileText className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-text-dark">
                              {selectedFile.name}
                            </p>
                            <p className="text-sm text-text-light">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Choose Different File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <Upload className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-text-dark font-medium">
                              Upload HTML File
                            </p>
                            <p className="text-sm text-text-light">
                              Drag and drop your HTML file here, or click to
                              browse
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="html-content">HTML Content</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadSampleContent}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Load Sample
                          </Button>
                          {htmlContent && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(htmlContent)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          )}
                        </div>
                      </div>
                      <Textarea
                        id="html-content"
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        placeholder="Paste your HTML code here..."
                        className="mt-2 min-h-[200px] font-mono text-sm"
                      />
                      <p className="text-sm text-text-light mt-2">
                        Paste your HTML code directly. Include CSS styles for
                        best results.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Progress */}
            {progress.stage !== "idle" && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {progress.stage === "processing" && (
                        <Loader2 className="w-5 h-5 animate-spin text-brand-red" />
                      )}
                      {progress.stage === "completed" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {progress.stage === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium">{progress.message}</span>
                    </div>

                    {progress.stage !== "error" && (
                      <Progress value={progress.progress} className="h-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Convert Button */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="flex-1"
                    size="lg"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Convert to PDF
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={isConverting}
                  >
                    Reset
                  </Button>

                  <Button
                    variant="outline"
                    onClick={testConnection}
                    disabled={isConverting}
                  >
                    Test Backend
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Settings className="w-5 h-5" />
                  <h3 className="font-semibold">Conversion Settings</h3>
                </div>

                <div className="space-y-6">
                  {/* Page Format */}
                  <div>
                    <Label>Page Format</Label>
                    <Select
                      value={settings.pageFormat}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          pageFormat: value as ConversionSettings["pageFormat"],
                        }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                        <SelectItem value="Letter">
                          Letter (8.5 × 11 in)
                        </SelectItem>
                        <SelectItem value="Legal">
                          Legal (8.5 × 14 in)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Orientation */}
                  <div>
                    <Label>Orientation</Label>
                    <Select
                      value={settings.orientation}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          orientation:
                            value as ConversionSettings["orientation"],
                        }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Print Background */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Print Background</Label>
                      <p className="text-sm text-text-light">
                        Include background images and colors
                      </p>
                    </div>
                    <Switch
                      checked={settings.printBackground}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          printBackground: checked,
                        }))
                      }
                    />
                  </div>

                  {/* Wait for Network */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Wait for Network</Label>
                      <p className="text-sm text-text-light">
                        Wait for all resources to load
                      </p>
                    </div>
                    <Switch
                      checked={settings.waitForNetworkIdle}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          waitForNetworkIdle: checked,
                        }))
                      }
                    />
                  </div>

                  {/* Margins */}
                  <div>
                    <Label>Margins</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <Input
                          placeholder="Top"
                          value={settings.margins.top}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              margins: { ...prev.margins, top: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Bottom"
                          value={settings.margins.bottom}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              margins: {
                                ...prev.margins,
                                bottom: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Left"
                          value={settings.margins.left}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              margins: {
                                ...prev.margins,
                                left: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Right"
                          value={settings.margins.right}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              margins: {
                                ...prev.margins,
                                right: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <p className="text-sm text-text-light mt-1">
                      Use units like: 1cm, 1in, 10mm, 72pt
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Key Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-brand-red" />
                    <span className="text-sm">Chromium-powered rendering</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-brand-red" />
                    <span className="text-sm">Pixel-perfect conversion</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-brand-red" />
                    <span className="text-sm">Customizable settings</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-brand-red" />
                    <span className="text-sm">URL, file & code support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="mt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-heading-medium text-text-dark mb-4">
              How Our HTML to PDF Converter Works
            </h2>
            <p className="text-body-large text-text-light max-w-3xl mx-auto">
              Behind the scenes, we use powerful Chromium technology to ensure
              pixel-perfect conversions with professional results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Load Content</h3>
                <p className="text-sm text-text-light">
                  Upload HTML files, paste content, or provide website URLs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">2. Render Page</h3>
                <p className="text-sm text-text-light">
                  Chromium headless browser renders your content with full CSS
                  support
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">3. Apply Settings</h3>
                <p className="text-sm text-text-light">
                  Configure page format, orientation, margins, and other options
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold mb-2">4. Generate PDF</h3>
                <p className="text-sm text-text-light">
                  Professional PDF with preserved layout and styling
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-heading-small text-text-dark mb-4">
                🛠️ Technologies Used
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Frontend Technologies</h4>
                  <ul className="space-y-1 text-sm text-text-light">
                    <li>• React.js with TypeScript</li>
                    <li>• TailwindCSS for styling</li>
                    <li>• Drag & drop file upload</li>
                    <li>• Real-time progress tracking</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Backend Technologies</h4>
                  <ul className="space-y-1 text-sm text-text-light">
                    <li>• Node.js + Express API</li>
                    <li>• Puppeteer (Chromium headless)</li>
                    <li>• Advanced PDF generation</li>
                    <li>• Cloud-based processing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-heading-small text-text-dark mb-4">
                💡 Best Practices for Optimal Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">
                    ✅ Recommended
                  </h4>
                  <ul className="space-y-1 text-sm text-text-light">
                    <li>• Use inline CSS or external stylesheets</li>
                    <li>• Include proper meta viewport tags</li>
                    <li>• Use web-safe fonts or Google Fonts</li>
                    <li>• Optimize images for web (JPEG, PNG, SVG)</li>
                    <li>• Test with "Print Background" enabled</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">
                    ⚠️ Limitations
                  </h4>
                  <ul className="space-y-1 text-sm text-text-light">
                    <li>• Complex JavaScript interactions</li>
                    <li>• Video/audio elements</li>
                    <li>• Dynamic content that loads after page load</li>
                    <li>• Very large files (&gt;10MB)</li>
                    <li>• Password-protected websites</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hidden download link */}
        <a ref={downloadLinkRef} className="hidden" />
      </main>

      <Footer />
    </div>
  );
};

export default HtmlToPdf;
