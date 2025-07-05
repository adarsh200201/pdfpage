import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PDFService } from "@/services/pdfService";
import { useToolTracking } from "@/hooks/useToolTracking";
import { useFloatingPopup } from "@/contexts/FloatingPopupContext";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
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
  Code,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  Settings,
  Eye,
  Monitor,
  Smartphone,
  Chrome,
  Zap,
  Shield,
  Layout,
} from "lucide-react";

interface ConversionResult {
  filename: string;
  downloadUrl: string;
  fileSize: number;
  processingTime: number;
  pageFormat: string;
  orientation: string;
}

const HtmlToPdf = () => {
  const [activeTab, setActiveTab] = useState<"content" | "file" | "url">(
    "content",
  );
  const [htmlContent, setHtmlContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    pageFormat: "A4",
    orientation: "portrait",
    printBackground: true,
    waitForNetworkIdle: true,
  });

  const { user } = useAuth();
  const { toast } = useToast();

  // Floating popup tracking
  const { trackToolUsage } = useFloatingPopup();

  // Mixpanel tracking
  const tracking = useToolTracking({
    toolName: "html-to-pdf",
    category: "PDF Tool",
    trackPageView: true,
    trackFunnel: true,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        !selectedFile.name.toLowerCase().endsWith(".html") &&
        selectedFile.type !== "text/html"
      ) {
        toast({
          title: "Invalid file type",
          description: "Please select an HTML file.",
          variant: "destructive",
        });
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        // 5MB limit for HTML files
        toast({
          title: "File too large",
          description: "HTML file must be under 5MB.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      setActiveTab("file");
      tracking.trackFileUpload([selectedFile]);
    }
  };

  const downloadResult = () => {
    if (!result) return;

    const link = document.createElement("a");
    link.href = result.downloadUrl;
    link.download = result.filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: `Downloading ${result.filename}`,
    });
  };

  const handleConvert = async () => {
    // Validate input
    if (activeTab === "content" && !htmlContent.trim()) {
      toast({
        title: "No HTML content",
        description: "Please enter HTML content to convert.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "url" && !url.trim()) {
      toast({
        title: "No URL provided",
        description: "Please enter a URL to convert.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "file" && !file) {
      toast({
        title: "No file selected",
        description: "Please select an HTML file to convert.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      tracking.trackAuthRequired();
      setShowAuthModal(true);
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now();

      // Track conversion start
      const inputType =
        activeTab === "content"
          ? "HTML Content"
          : activeTab === "url"
            ? "URL"
            : "HTML File";
      tracking.trackConversionStart(inputType, "PDF", file ? [file] : []);

      const conversionOptions = {
        htmlContent: activeTab === "content" ? htmlContent : undefined,
        url: activeTab === "url" ? url : undefined,
        file: activeTab === "file" ? file : undefined,
        pageFormat: settings.pageFormat,
        orientation: settings.orientation,
        printBackground: settings.printBackground,
        waitForNetworkIdle: settings.waitForNetworkIdle,
        sessionId: `html_to_pdf_${Date.now()}`,
        onProgress: setProgress,
      };

      const result = await PDFService.htmlToPdf(conversionOptions);

      const processingTime = Date.now() - startTime;

      // Extract info from headers
      const serverProcessingTime = parseInt(
        result.headers?.["x-processing-time"] || processingTime.toString(),
      );
      const pageFormat =
        result.headers?.["x-page-format"] || settings.pageFormat;
      const orientation =
        result.headers?.["x-orientation"] || settings.orientation;

      // Create download blob and URL
      const blob = new Blob([result.data], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);

      const filename =
        activeTab === "url"
          ? `${new URL(url).hostname}_converted.pdf`
          : activeTab === "file"
            ? `${file!.name.replace(/\.html$/i, "")}_converted.pdf`
            : "html_content_converted.pdf";

      const conversionResult: ConversionResult = {
        filename,
        downloadUrl,
        fileSize: result.data.byteLength,
        processingTime: serverProcessingTime,
        pageFormat,
        orientation,
      };

      setResult(conversionResult);

      // Track successful conversion
      tracking.trackConversionComplete(
        inputType,
        "PDF",
        {
          fileName: filename,
          fileSize: file ? file.size : htmlContent.length || url.length,
          fileType: activeTab,
        },
        result.data.byteLength,
        processingTime,
      );

      // Track for floating popup (only for anonymous users)
      if (!user.isPremiumActive) {
        trackToolUsage();
      }

      toast({
        title: "Conversion Complete!",
        description: `Successfully converted ${inputType} to PDF`,
      });
    } catch (error) {
      console.error("HTML to PDF conversion failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Conversion failed";
      setError(errorMessage);

      // Track conversion failure
      tracking.trackConversionFailed(
        activeTab === "content"
          ? "HTML Content"
          : activeTab === "url"
            ? "URL"
            : "HTML File",
        "PDF",
        errorMessage,
      );

      toast({
        title: "Conversion Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const resetAll = () => {
    setHtmlContent("");
    setUrl("");
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-100">
      <Header />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-600 rounded-2xl">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">HTML to PDF</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Convert HTML content, files, or web pages to high-quality PDF
            documents. Powered by headless Chrome for perfect rendering.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Features Banner */}
          <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Chrome className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">
                      Chrome Engine
                    </p>
                    <p className="text-sm text-purple-700">
                      Puppeteer headless browser
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">
                      Perfect Rendering
                    </p>
                    <p className="text-sm text-purple-700">
                      CSS, JS, and fonts preserved
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">
                      Multi-Source
                    </p>
                    <p className="text-sm text-purple-700">
                      Content, files, or URLs
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Tabs */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>HTML Input</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as any)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="content"
                    className="flex items-center gap-2"
                  >
                    <Code className="w-4 h-4" />
                    HTML Content
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    HTML File
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div>
                    <Label htmlFor="htmlContent">HTML Content</Label>
                    <Textarea
                      id="htmlContent"
                      placeholder="Paste your HTML code here... Example:
<!DOCTYPE html>
<html>
<head>
    <title>My Document</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Hello World!</h1>
    <p>This will be converted to PDF.</p>
</body>
</html>"
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Enter your complete HTML code including styles and scripts
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="file" className="space-y-4">
                  <div>
                    <Label htmlFor="fileUpload">Upload HTML File</Label>
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                        file
                          ? "border-green-400 bg-green-50"
                          : "border-gray-300 hover:border-gray-400",
                      )}
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      {file ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-900">
                              {file.name}
                            </p>
                            <p className="text-sm text-green-700">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold mb-2">
                            Choose HTML file or drag & drop
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Supports .html files up to 5MB
                          </p>
                          <Button variant="outline">Browse Files</Button>
                        </>
                      )}
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".html,text/html"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div>
                    <Label htmlFor="url">Website URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="text-lg"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Enter the full URL of the webpage you want to convert
                    </p>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      The page will be rendered exactly as it appears in Chrome
                    </span>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* PDF Settings */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                PDF Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="pageFormat">Page Format</Label>
                  <Select
                    value={settings.pageFormat}
                    onValueChange={(value) =>
                      setSettings({ ...settings, pageFormat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A3">A3</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="orientation">Orientation</Label>
                  <Select
                    value={settings.orientation}
                    onValueChange={(value) =>
                      setSettings({ ...settings, orientation: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Print Background</p>
                    <p className="text-sm text-gray-500">
                      Include CSS backgrounds
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.printBackground}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        printBackground: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Wait for Network</p>
                    <p className="text-sm text-gray-500">
                      Complete resource loading
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.waitForNetworkIdle}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        waitForNetworkIdle: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Results */}
          {result && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Conversion Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">File Size</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatFileSize(result.fileSize)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Processing Time</p>
                      <p className="text-lg font-bold text-green-600">
                        {result.processingTime}ms
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Page Format</p>
                      <p className="text-lg font-bold text-green-600">
                        {result.pageFormat}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Orientation</p>
                      <p className="text-lg font-bold text-green-600 capitalize">
                        {result.orientation}
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={downloadResult}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Conversion Failed</span>
                  </div>
                  <p className="text-red-600">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleConvert}
                  disabled={isProcessing || !user}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Converting... ({Math.round(progress)}%)
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Convert to PDF
                    </>
                  )}
                </Button>

                {(result || error) && (
                  <Button variant="outline" onClick={resetAll} size="lg">
                    Convert Another
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Processing HTML to PDF...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  HTML to PDF Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Chrome Rendering:</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Headless Chrome via Puppeteer</li>
                      <li>• Exact browser-quality rendering</li>
                      <li>• CSS3 and modern JavaScript support</li>
                      <li>• Web fonts and external resources</li>
                      <li>• Responsive design handling</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Input Options:</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Direct HTML content pasting</li>
                      <li>• HTML file upload (.html)</li>
                      <li>• Live website URL conversion</li>
                      <li>• Custom page formats and orientation</li>
                      <li>• Background and network loading control</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <PromoBanner />
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="login"
        />
      )}
    </div>
  );
};

export default HtmlToPdf;
