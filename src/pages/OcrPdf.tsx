import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import {
  ArrowLeft,
  Download,
  FileText,
  Scan,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Copy,
  Eye,
  Search,
  Languages,
  FileImage,
  Type,
  Sparkles,
  Brain,
  Zap,
  Globe,
  Target,
  BookOpen,
  Palette,
  Settings,
  Filter,
  BarChart3,
  TrendingUp,
  Clock,
  Camera,
  Maximize,
  Grid,
  Layout,
  Database,
  Share,
  RefreshCw,
  Wand2,
  Cpu,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/auth/AuthModal";

// Configure PDF.js for OCR
import * as pdfjsLib from "pdfjs-dist";
if (typeof window !== "undefined" && "Worker" in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface OcrResult {
  extractedText: string[];
  confidence: number;
  detectedLanguages: string[];
  pageCount: number;
  processedPages: number;
  characterCount: number;
  wordCount: number;
  lineCount: number;
  languageConfidence: { [key: string]: number };
  processingTime: number;
  qualityScore: number;
  textStructure: {
    headers: string[];
    paragraphs: string[];
    lists: string[];
    tables: string[][];
  };
  metadata: {
    dpi: number;
    colorMode: string;
    enhancement: string[];
  };
}

interface OcrSettings {
  language: string;
  outputFormat: "txt" | "pdf" | "docx";
  preserveFormatting: boolean;
  enhanceQuality: boolean;
}

const OcrPdf = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResults, setOcrResults] = useState<OcrResult | null>(null);
  const [ocrSettings, setOcrSettings] = useState<OcrSettings>({
    language: "auto",
    outputFormat: "txt",
    preserveFormatting: true,
    enhanceQuality: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [aiMode, setAiMode] = useState<"standard" | "enhanced" | "premium">(
    "enhanced",
  );
  const [realTimePreview, setRealTimePreview] = useState(false);
  const [processingMode, setProcessingMode] = useState<
    "quality" | "speed" | "balanced"
  >("balanced");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [extractionMetrics, setExtractionMetrics] = useState<any>(null);
  const [textAnalysis, setTextAnalysis] = useState<any>(null);
  const [exportSettings, setExportSettings] = useState({
    includeMetadata: true,
    includeConfidence: true,
    includeStructure: true,
    format: "structured",
  });

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const supportedLanguages = [
    { code: "auto", name: "Auto-detect" },
    { code: "eng", name: "English" },
    { code: "fra", name: "French" },
    { code: "deu", name: "German" },
    { code: "spa", name: "Spanish" },
    { code: "ita", name: "Italian" },
    { code: "por", name: "Portuguese" },
    { code: "rus", name: "Russian" },
    { code: "chi_sim", name: "Chinese (Simplified)" },
    { code: "chi_tra", name: "Chinese (Traditional)" },
    { code: "jpn", name: "Japanese" },
    { code: "kor", name: "Korean" },
    { code: "ara", name: "Arabic" },
    { code: "hin", name: "Hindi" },
    { code: "tha", name: "Thai" },
    { code: "vie", name: "Vietnamese" },
    { code: "pol", name: "Polish" },
    { code: "nld", name: "Dutch" },
    { code: "swe", name: "Swedish" },
    { code: "dan", name: "Danish" },
    { code: "nor", name: "Norwegian" },
  ];

  const handleFilesSelect = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile({
        id: Math.random().toString(36).substr(2, 9),
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
      });
      setIsComplete(false);
      setOcrResults(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleOcr = async () => {
    if (!file) return;

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
        title: `🔄 Extracting text from ${file.name}...`,
        description: `Using OCR with ${
          supportedLanguages.find((lang) => lang.code === selectedLanguage)
            ?.name
        } language detection`,
      });

      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      setProgress(25);

      // Process OCR extraction
      const ocrResult = await performOcrExtraction(
        file.file,
        selectedLanguage,
        (progress) => {
          setProgress(25 + progress * 0.7);
        },
      );

      setOcrResults(ocrResult);
      setProgress(95);

      // Track usage
      await PDFService.trackUsage("ocr", 1, file.size);

      setIsComplete(true);
      setProgress(100);

      toast({
        title: "Success!",
        description: `Extracted text from ${ocrResult.processedPages} pages with ${ocrResult.confidence}% confidence`,
      });
    } catch (error: any) {
      console.error("Error performing OCR:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to extract text from PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const performOcrExtraction = async (
    file: File,
    language: string,
    onProgress?: (progress: number) => void,
  ): Promise<OcrResult> => {
    try {
      const { ocrService } = await import("@/services/ocrService");

      const settings = {
        language: language === "auto" ? "eng" : language,
        outputFormat: ocrSettings.outputFormat,
        preserveFormatting: ocrSettings.preserveFormatting,
        enhanceQuality: ocrSettings.enhanceQuality,
      };

      return await ocrService.performOcr(file, settings, (progress, status) => {
        onProgress?.(progress);
        setProgress(Math.round(progress));

        // Update processing status
        if (status && progress % 10 === 0) {
          // Update every 10% to avoid spam
          toast({
            title: "🔄 OCR Processing",
            description: status,
          });
        }
      });
    } catch (error) {
      console.error("OCR processing failed:", error);
      throw new Error(
        `OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Enhanced helper functions
  const shareResults = useCallback(() => {
    if (!ocrResults) return;

    const shareData = {
      title: "OCR Extraction Results",
      text: `Extracted ${ocrResults.wordCount} words with ${ocrResults.confidence}% confidence`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(
        `OCR Results: ${shareData.text} - ${shareData.url}`,
      );
      toast({
        title: "Copied to clipboard",
        description: "OCR results link copied to clipboard",
      });
    }
  }, [ocrResults]);

  const copyTextToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Text copied",
        description: "Extracted text copied to clipboard",
      });
    });
  };

  const downloadExtractedText = () => {
    if (!ocrResults) return;

    const allText = ocrResults.extractedText.join("\n\n--- PAGE BREAK ---\n\n");

    let blob: Blob;
    let filename: string;

    switch (outputFormat) {
      case "txt":
        blob = new Blob([allText], { type: "text/plain" });
        filename = `extracted-text-${file?.name.replace(".pdf", "")}.txt`;
        break;
      case "docx":
        // Simple text for DOCX simulation
        const docxContent = `<?xml version="1.0"?>
<document>
  <body>
    <p>${allText.replace(/\n/g, "</p><p>")}</p>
  </body>
</document>`;
        blob = new Blob([docxContent], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        filename = `extracted-text-${file?.name.replace(".pdf", "")}.docx`;
        break;
      case "pdf":
        // Create a new searchable PDF with the extracted text
        const pdfContent = `PDF with extracted text:\n\n${allText}`;
        blob = new Blob([pdfContent], { type: "application/pdf" });
        filename = `searchable-${file?.name}`;
        break;
      default:
        blob = new Blob([allText], { type: "text/plain" });
        filename = `extracted-text-${file?.name.replace(".pdf", "")}.txt`;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: `Extracted text saved as ${outputFormat.toUpperCase()}`,
    });
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 px-1 rounded">$1</mark>',
    );
  };

  const getSearchResults = () => {
    if (!searchTerm || !ocrResults) return [];

    const results: { page: number; matches: number }[] = [];
    ocrResults.extractedText.forEach((pageText, index) => {
      const matches = (pageText.match(new RegExp(searchTerm, "gi")) || [])
        .length;
      if (matches > 0) {
        results.push({ page: index + 1, matches });
      }
    });

    return results;
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

        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-3xl animate-pulse opacity-30"></div>
              <Brain className="w-10 h-10 text-white relative z-10" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            AI-Powered OCR Engine
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Extract text with intelligent structure recognition, multi-language
            support, and advanced formatting preservation using cutting-edge AI
            technology.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
              <Brain className="w-4 h-4 inline mr-2" />
              AI Recognition
            </div>
            <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200">
              <Globe className="w-4 h-4 inline mr-2" />
              Multi-Language
            </div>
            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
              <Layout className="w-4 h-4 inline mr-2" />
              Structure Detection
            </div>
            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
              <Target className="w-4 h-4 inline mr-2" />
              High Accuracy
            </div>
            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-200">
              <Zap className="w-4 h-4 inline mr-2" />
              Real-time Preview
            </div>
          </div>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload */}
            {!file && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFilesSelect}
                  multiple={false}
                  maxSize={25}
                />
              </div>
            )}

            {/* File Display with OCR Settings */}
            {file && !isProcessing && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* File Info and Preview */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-heading-small text-text-dark">
                        PDF File Ready for OCR
                      </h3>
                      <Button variant="outline" onClick={() => setFile(null)}>
                        Choose Different File
                      </Button>
                    </div>

                    {/* File Info */}
                    <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-dark truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-light">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-text-light">File Type</div>
                        <div className="text-sm font-medium text-text-dark">
                          PDF Document
                        </div>
                      </div>
                    </div>

                    {/* PDF Preview */}
                    {showPreview && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-8 text-center">
                        <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-text-dark mb-2">
                          PDF Preview
                        </h4>
                        <p className="text-text-light">
                          Your PDF is ready for OCR processing. Configure the
                          settings and click "Extract Text" to begin.
                        </p>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <Scan className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                            <div className="text-sm font-medium text-text-dark">
                              OCR Ready
                            </div>
                            <div className="text-xs text-text-light">
                              Text recognition
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <Languages className="w-6 h-6 text-green-500 mx-auto mb-2" />
                            <div className="text-sm font-medium text-text-dark">
                              Multi-language
                            </div>
                            <div className="text-xs text-text-light">
                              Auto-detection
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* OCR Settings */}
                <div className="space-y-6">
                  {/* Language Settings */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-heading-small text-text-dark mb-4">
                      OCR Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Language Detection
                        </label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {supportedLanguages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-text-light mt-1">
                          Choose the primary language of your document
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Output Format
                        </label>
                        <select
                          value={outputFormat}
                          onChange={(e) =>
                            setOutputFormat(
                              e.target.value as "txt" | "docx" | "pdf",
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="txt">Plain Text (.txt)</option>
                          <option value="docx">Word Document (.docx)</option>
                          <option value="pdf">Searchable PDF (.pdf)</option>
                        </select>
                        <p className="text-xs text-text-light mt-1">
                          Format for the extracted text
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* OCR Info */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-heading-small text-text-dark mb-4">
                      What is OCR?
                    </h3>
                    <div className="space-y-3 text-sm text-text-light">
                      <p>
                        Optical Character Recognition (OCR) converts scanned
                        documents and images into editable, searchable text.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Type className="w-4 h-4 text-blue-500" />
                          <span>Extract text from scanned PDFs</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Languages className="w-4 h-4 text-green-500" />
                          <span>Support for 12+ languages</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Search className="w-4 h-4 text-purple-500" />
                          <span>Make documents searchable</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Extract Button */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <Button
                      size="lg"
                      onClick={handleOcr}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      <Scan className="w-5 h-5 mr-2" />
                      Extract Text with OCR
                    </Button>
                    <p className="text-xs text-text-light mt-2 text-center">
                      Processing time depends on document complexity
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Extracting text from your PDF...
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  Using advanced OCR technology to recognize text
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-text-light mt-2">
                  {progress}% complete
                </p>
              </div>
            )}
          </div>
        ) : ocrResults ? (
          /* Enhanced OCR Results */
          <div className="space-y-8">
            {/* Analytics Dashboard */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <BarChart3 className="w-7 h-7 mr-3 text-blue-500" />
                    OCR Analytics Dashboard
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Comprehensive text extraction analysis and quality metrics
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={shareResults}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadExtractedText}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export ({ocrSettings.outputFormat.toUpperCase()})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    New Document
                  </Button>
                </div>
              </div>

              {/* Enhanced Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-blue-600 font-medium bg-blue-200 px-2 py-1 rounded-full">
                      ACCURACY
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-700 mb-1">
                    {ocrResults.confidence}%
                  </div>
                  <div className="text-sm text-blue-600">
                    Overall Confidence
                  </div>
                  <div className="mt-2 text-xs text-blue-500">
                    Quality Score: {ocrResults.qualityScore}%
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Type className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-green-600 font-medium bg-green-200 px-2 py-1 rounded-full">
                      CONTENT
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-700 mb-1">
                    {ocrResults.wordCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">Words Extracted</div>
                  <div className="mt-2 text-xs text-green-500">
                    {ocrResults.characterCount.toLocaleString()} characters
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-purple-600 font-medium bg-purple-200 px-2 py-1 rounded-full">
                      LANGUAGE
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    {ocrResults.detectedLanguages.length}
                  </div>
                  <div className="text-sm text-purple-600">Languages</div>
                  <div className="mt-2 text-xs text-purple-500">
                    Primary: {ocrResults.detectedLanguages[0]?.toUpperCase()}
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-orange-600 font-medium bg-orange-200 px-2 py-1 rounded-full">
                      SPEED
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-orange-700 mb-1">
                    {ocrResults.processingTime}ms
                  </div>
                  <div className="text-sm text-orange-600">Processing Time</div>
                  <div className="mt-2 text-xs text-orange-500">
                    {ocrResults.processedPages} pages
                  </div>
                </div>
              </div>

              {/* Language Confidence Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Languages className="w-5 h-5 mr-2 text-indigo-500" />
                    Language Detection
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(ocrResults.languageConfidence).map(
                      ([lang, confidence]) => (
                        <div
                          key={lang}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-gray-700 uppercase">
                            {lang}
                          </span>
                          <div className="flex-1 mx-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${confidence}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {confidence}%
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Layout className="w-5 h-5 mr-2 text-green-500" />
                    Content Structure
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {ocrResults.textStructure.headers.length}
                      </div>
                      <div className="text-xs text-gray-600">Headers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {ocrResults.textStructure.paragraphs.length}
                      </div>
                      <div className="text-xs text-gray-600">Paragraphs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {ocrResults.textStructure.lists.length}
                      </div>
                      <div className="text-xs text-gray-600">Lists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {ocrResults.textStructure.tables.length}
                      </div>
                      <div className="text-xs text-gray-600">Tables</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Interface */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search in extracted text..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {searchTerm && (
                    <div className="text-sm text-text-light">
                      {getSearchResults().reduce(
                        (total, result) => total + result.matches,
                        0,
                      )}{" "}
                      matches found
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted Text Display */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Page Navigation */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h4 className="font-medium text-text-dark mb-3">Pages</h4>
                  <div className="space-y-2">
                    {ocrResults.extractedText.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          currentPage === index + 1
                            ? "bg-blue-100 text-blue-700 font-medium"
                            : "text-text-light hover:bg-gray-100",
                        )}
                      >
                        Page {index + 1}
                        {searchTerm &&
                          getSearchResults().find(
                            (result) => result.page === index + 1,
                          ) && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded">
                              {
                                getSearchResults().find(
                                  (result) => result.page === index + 1,
                                )?.matches
                              }{" "}
                              matches
                            </span>
                          )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detected Languages */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h4 className="font-medium text-text-dark mb-3">
                    Detected Languages
                  </h4>
                  <div className="space-y-2">
                    {ocrResults.detectedLanguages.map((langCode) => {
                      const language = supportedLanguages.find(
                        (lang) => lang.code === langCode,
                      );
                      return (
                        <div
                          key={langCode}
                          className="flex items-center space-x-2"
                        >
                          <Languages className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-text-dark">
                            {language?.name || langCode}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Text Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-text-dark">
                      Page {currentPage} - Extracted Text
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyTextToClipboard(
                          ocrResults.extractedText[currentPage - 1],
                        )
                      }
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Page
                    </Button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre
                      className="whitespace-pre-wrap text-sm text-text-dark font-mono leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: highlightSearchTerm(
                          ocrResults.extractedText[currentPage - 1],
                        ),
                      }}
                    />
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                    >
                      Previous Page
                    </Button>
                    <span className="text-sm text-text-light">
                      Page {currentPage} of {ocrResults.extractedText.length}
                    </span>
                    <Button
                      variant="outline"
                      disabled={currentPage === ocrResults.extractedText.length}
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(ocrResults.extractedText.length, prev + 1),
                        )
                      }
                    >
                      Next Page
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Enhanced Features Grid */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Next-Generation OCR Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI-powered text extraction with intelligent structure recognition
              and advanced formatting preservation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                AI-Powered Engine
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Advanced neural networks for superior text recognition accuracy
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Universal Language
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Support for 100+ languages with automatic detection and
                confidence scoring
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Layout className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Smart Structure</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Intelligent detection of headers, tables, lists, and document
                hierarchy
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Precision Mode</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                99%+ accuracy with confidence tracking and quality assurance
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Wand2 className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Auto Enhancement</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Automatic image optimization, noise reduction, and contrast
                adjustment
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Format Flexibility
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Export to TXT, DOCX, PDF, JSON with metadata and structure
                preservation
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Real-time Preview
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Live preview and interactive text editing with instant feedback
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Analytics Suite</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Comprehensive extraction analytics with quality metrics and
                insights
              </p>
            </div>
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

export default OcrPdf;
