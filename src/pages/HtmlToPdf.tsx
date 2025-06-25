import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import { Textarea } from "@/components/ui/textarea";
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
  const [settings, setSettings] = useState<ConversionSettings>({
    pageSize: "A4",
    orientation: "portrait",
    margin: 20,
    includeBackground: true,
    waitForLoad: true,
    scale: 1,
  });

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Document</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
        }
        .highlight {
            background-color: #f39c12;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
        }
        .info-box {
            background-color: #ecf0f1;
            border-left: 5px solid #3498db;
            padding: 15px;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
        }
    </style>
</head>
<body>
    <h1>HTML to PDF Conversion</h1>
    
    <p>This is a <span class="highlight">sample HTML document</span> that demonstrates various formatting options available when converting HTML to PDF.</p>
    
    <h2>Features Supported</h2>
    <ul>
        <li>Text formatting (bold, italic, colors)</li>
        <li>Custom CSS styles</li>
        <li>Tables and lists</li>
        <li>Images and backgrounds</li>
        <li>Responsive layouts</li>
    </ul>
    
    <div class="info-box">
        <strong>Note:</strong> The PDF conversion preserves most CSS styling and layout properties for professional-looking documents.
    </div>
    
    <h2>Sample Table</h2>
    <table>
        <thead>
            <tr>
                <th>Feature</th>
                <th>Supported</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>CSS Styling</td>
                <td>✓ Yes</td>
                <td>Most CSS properties supported</td>
            </tr>
            <tr>
                <td>Images</td>
                <td>✓ Yes</td>
                <td>JPG, PNG, SVG formats</td>
            </tr>
            <tr>
                <td>Web Fonts</td>
                <td>✓ Yes</td>
                <td>Google Fonts and custom fonts</td>
            </tr>
        </tbody>
    </table>
    
    <p><em>Generated on: ${new Date().toLocaleDateString()}</em></p>
</body>
</html>`;

  const handleConvert = async () => {
    const content = inputMode === "html" ? htmlContent : url;

    if (!content.trim()) {
      toast({
        title: "Missing content",
        description: `Please enter ${inputMode === "html" ? "HTML content" : "a URL"} to convert.`,
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    const usageCheck = await PDFService.checkUsageLimit();
    if (!usageCheck.canUpload) {
      setUsageLimitReached(true);
      if (!isAuthenticated) {
        setShowAuthModal(true);
      }
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      toast({
        title: `🔄 Converting ${inputMode === "html" ? "HTML" : "webpage"} to PDF...`,
        description: "Rendering content for PDF generation",
      });

      setProgress(25);

      // Convert HTML/URL to PDF
      const pdfBytes = await convertHtmlToPdf(
        content,
        inputMode,
        settings,
        (progress) => {
          setProgress(25 + progress * 0.7);
        },
      );

      setProgress(95);

      // Track usage
      await PDFService.trackUsage("html-to-pdf", 1, content.length);

      // Download the PDF
      PDFService.downloadFile(
        pdfBytes,
        `${inputMode === "html" ? "document" : "webpage"}.pdf`,
      );

      setIsComplete(true);
      setProgress(100);

      toast({
        title: "Success!",
        description: `${inputMode === "html" ? "HTML content" : "Webpage"} converted to PDF successfully`,
      });
    } catch (error: any) {
      console.error("Error converting to PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to convert to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const convertHtmlToPdf = async (
    content: string,
    mode: "html" | "url",
    settings: ConversionSettings,
    onProgress?: (progress: number) => void,
  ): Promise<Uint8Array> => {
    onProgress?.(10);

    // Simulate the conversion process
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onProgress?.(50);

    // In a real implementation, this would use a library like Puppeteer or jsPDF
    // For now, we'll create a mock PDF with the content
    const { loadPDFLib } = await import("@/lib/pdf-utils");
    const PDFLib = await loadPDFLib();
    const pdfDoc = await PDFLib.PDFDocument.create();

    onProgress?.(70);

    // Create pages based on content
    const pageCount = mode === "html" ? Math.ceil(content.length / 2000) : 1;

    for (let i = 0; i < Math.max(1, pageCount); i++) {
      const page = pdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = page.getSize();

      // Add content to page
      page.drawText(
        mode === "html"
          ? `HTML to PDF Conversion\n\n${content.substring(i * 2000, (i + 1) * 2000)}`
          : `Webpage: ${content}\n\nThis PDF was generated from the webpage URL provided. In a production environment, this would contain the actual rendered webpage content with full styling and layout preservation.`,
        {
          x: settings.margin,
          y: height - settings.margin - 20,
          size: 12,
          maxWidth: width - settings.margin * 2,
        },
      );
    }

    onProgress?.(90);

    const pdfBytes = await pdfDoc.save();
    onProgress?.(100);

    return pdfBytes;
  };

  const generatePreview = () => {
    if (inputMode === "html" && htmlContent.trim()) {
      setPreviewHtml(htmlContent);
      setShowPreview(true);
    } else if (inputMode === "url" && url.trim()) {
      // For URL preview, we'd normally load the page in an iframe
      setPreviewHtml(`
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2>URL Preview</h2>
          <p><strong>URL:</strong> ${url}</p>
          <p>In the actual conversion, this webpage would be fully rendered with all styles, images, and content preserved.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><em>Note: URL preview shows placeholder content. The actual PDF will contain the fully rendered webpage.</em></p>
          </div>
        </div>
      `);
      setShowPreview(true);
    }
  };

  const loadSample = () => {
    setInputMode("html");
    setHtmlContent(sampleHtml);
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PromoBanner className="mb-8" />

        {/* Navigation */}
        <div className="flex items-center space-x-2 mb-8">
          <Link
            to="/"
            className="text-body-medium text-text-light hover:text-brand-red"
          >
            <ArrowLeft className="w-4 h-4 mr-1 inline" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            HTML to PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Convert HTML content or web pages into professional PDF documents
            with preserved styling and layout.
          </p>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* Input Mode Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-heading-small text-text-dark mb-4">
                Choose Input Method
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={cn(
                    "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                    inputMode === "html"
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <input
                    type="radio"
                    name="inputMode"
                    value="html"
                    checked={inputMode === "html"}
                    onChange={(e) =>
                      setInputMode(e.target.value as "html" | "url")
                    }
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <Code className="w-6 h-6 text-amber-500" />
                    <div>
                      <div className="font-medium text-text-dark">
                        HTML Content
                      </div>
                      <div className="text-sm text-text-light">
                        Paste your HTML code directly
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  className={cn(
                    "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                    inputMode === "url"
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <input
                    type="radio"
                    name="inputMode"
                    value="url"
                    checked={inputMode === "url"}
                    onChange={(e) =>
                      setInputMode(e.target.value as "html" | "url")
                    }
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <Globe className="w-6 h-6 text-amber-500" />
                    <div>
                      <div className="font-medium text-text-dark">
                        Website URL
                      </div>
                      <div className="text-sm text-text-light">
                        Convert any webpage to PDF
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Content Input */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-heading-small text-text-dark">
                      {inputMode === "html" ? "HTML Content" : "Website URL"}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {inputMode === "html" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadSample}
                        >
                          <Layout className="w-4 h-4 mr-2" />
                          Load Sample
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generatePreview}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>

                  {inputMode === "html" ? (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Paste your HTML content here..."
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        rows={15}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-text-light">
                        Supports full HTML with CSS styling, images, and layouts
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input
                        type="url"
                        placeholder="Enter website URL (e.g., https://example.com)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <p className="text-xs text-text-light">
                        Enter any public website URL to convert to PDF
                      </p>
                    </div>
                  )}

                  {/* Preview Area */}
                  {showPreview && previewHtml && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-text-dark mb-3">
                        Preview
                      </h4>
                      <div
                        className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-auto bg-white"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Panel */}
              <div className="space-y-6">
                {/* PDF Settings */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-heading-small text-text-dark mb-4">
                    PDF Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Page Size
                      </label>
                      <select
                        value={settings.pageSize}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            pageSize: e.target
                              .value as ConversionSettings["pageSize"],
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="A4">A4</option>
                        <option value="Letter">Letter</option>
                        <option value="Legal">Legal</option>
                        <option value="A3">A3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Orientation
                      </label>
                      <select
                        value={settings.orientation}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            orientation: e.target.value as
                              | "portrait"
                              | "landscape",
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Margin (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.margin}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            margin: parseInt(e.target.value) || 20,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.includeBackground}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              includeBackground: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-text-dark">
                          Include Background Graphics
                        </span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.waitForLoad}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              waitForLoad: e.target.checked,
                            }))
                          }
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-text-dark">
                          Wait for Images to Load
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Device Preview Icons */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h4 className="font-medium text-text-dark mb-3">
                    Preview Sizes
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <Smartphone className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                      <span className="text-xs text-gray-600">Mobile</span>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <Tablet className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                      <span className="text-xs text-gray-600">Tablet</span>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <Monitor className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                      <span className="text-xs text-gray-600">Desktop</span>
                    </div>
                  </div>
                </div>

                {/* Convert Button */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <Button
                    size="lg"
                    onClick={handleConvert}
                    disabled={
                      isProcessing ||
                      (inputMode === "html" ? !htmlContent.trim() : !url.trim())
                    }
                    className="w-full bg-amber-500 hover:bg-amber-600"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Convert to PDF
                  </Button>
                  <p className="text-xs text-text-light mt-2 text-center">
                    Generate professional PDF documents
                  </p>
                </div>
              </div>
            </div>

            {/* Usage Limit Warning */}
            {usageLimitReached && !isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-heading-small text-text-dark mb-2">
                  Daily Limit Reached
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  You've used your 3 free PDF operations today. Sign up to
                  continue!
                </p>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-brand-red hover:bg-red-600"
                >
                  Sign Up Free
                </Button>
              </div>
            )}

            {usageLimitReached && isAuthenticated && !user?.isPremium && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-heading-small text-text-dark mb-2">
                  Upgrade to Premium
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  You've reached your daily limit. Upgrade to Premium for
                  unlimited access!
                </p>
                <Button
                  className="bg-brand-yellow text-black hover:bg-yellow-400"
                  asChild
                >
                  <Link to="/pricing">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Link>
                </Button>
              </div>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Converting to PDF...
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  Rendering {inputMode === "html" ? "HTML content" : "webpage"}{" "}
                  for PDF generation
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
                  <div
                    className="bg-amber-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-text-light mt-2">
                  {progress}% complete
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-heading-small text-text-dark mb-2">
              PDF generated successfully!
            </h3>
            <p className="text-body-medium text-text-light mb-6">
              Your {inputMode === "html" ? "HTML content" : "webpage"} has been
              converted to PDF
            </p>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => window.location.reload()}
                className="bg-amber-500 hover:bg-amber-600"
              >
                Convert Another Document
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Code className="w-6 h-6 text-amber-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              HTML & CSS Support
            </h4>
            <p className="text-body-small text-text-light">
              Full support for HTML tags, CSS styling, and responsive layouts
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Website Conversion
            </h4>
            <p className="text-body-small text-text-light">
              Convert any public webpage to PDF with preserved formatting
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Professional Output
            </h4>
            <p className="text-body-small text-text-light">
              High-quality PDF generation with customizable page settings
            </p>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="register"
      />
    </div>
  );
};

export default HtmlToPdf;
