import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
  qualityScore: number;
  languageConfidence: { [key: string]: number };
  processingTime: number;
  textStructure: {
    headers: number;
    paragraphs: number;
    lists: number;
    tables: number;
  };
  metadata: {
    originalLanguage: string;
    outputFormat: string;
    enhancementApplied: boolean;
    formattingPreserved: boolean;
    processedAt: string;
  };
  downloadUrl?: string;
  fileName?: string;
}

interface OcrSettings {
  language: string;
  outputFormat: "txt" | "pdf" | "docx" | "json";
  preserveFormatting: boolean;
  enhanceQuality: boolean;
  detectLanguages: boolean;
}

const OcrPdfEnhanced = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResults, setOcrResults] = useState<OcrResult | null>(null);
  const [ocrSettings, setOcrSettings] = useState<OcrSettings>({
    language: "eng",
    outputFormat: "json",
    preserveFormatting: true,
    enhanceQuality: true,
    detectLanguages: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [processingStatus, setProcessingStatus] = useState("");
  const [supportedLanguages, setSupportedLanguages] = useState<
    Array<{ code: string; name: string }>
  >([]);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Load supported languages on component mount
  useEffect(() => {
    const loadSupportedLanguages = async () => {
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiUrl}/ocr/languages`);
        const data = await response.json();
        if (data.success) {
          // Filter out any existing "auto" option to avoid duplicates
          const filteredLanguages = data.data.filter(
            (lang: { code: string }) => lang.code !== "auto",
          );
          setSupportedLanguages([
            { code: "auto", name: "Auto-detect" },
            ...filteredLanguages,
          ]);
        }
      } catch (error) {
        console.error("Failed to load languages:", error);
        // Fallback languages (already unique)
        setSupportedLanguages([
          { code: "auto", name: "Auto-detect" },
          { code: "eng", name: "English" },
          { code: "fra", name: "French" },
          { code: "deu", name: "German" },
          { code: "spa", name: "Spanish" },
        ]);
      }
    };

    loadSupportedLanguages();
  }, []);

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
      setProgress(0);
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

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus("Initializing OCR engine...");

    try {
      toast({
        title: `🔄 Starting OCR processing...`,
        description: `Processing ${file.name} with ${
          supportedLanguages.find((lang) => lang.code === ocrSettings.language)
            ?.name || "selected"
        } language`,
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("pdf", file.file);
      formData.append("language", ocrSettings.language);
      formData.append("outputFormat", ocrSettings.outputFormat);
      formData.append(
        "preserveFormatting",
        ocrSettings.preserveFormatting.toString(),
      );
      formData.append("enhanceQuality", ocrSettings.enhanceQuality.toString());
      formData.append(
        "detectLanguages",
        ocrSettings.detectLanguages.toString(),
      );

      setProgress(10);
      setProcessingStatus("Uploading document...");

      // Call backend OCR API
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/ocr/process`, {
        method: "POST",
        body: formData,
      });

      setProgress(90);
      setProcessingStatus("Finalizing results...");

      // Handle response based on status
      if (!response.ok) {
        let errorMessage = "OCR processing failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "OCR processing failed");
      }

      setOcrResults(result.data);
      setIsComplete(true);
      setProgress(100);
      setProcessingStatus("OCR processing completed!");

      toast({
        title: "🎉 OCR Processing Complete!",
        description: `Extracted ${result.data.wordCount} words from ${result.data.processedPages} pages with ${result.data.confidence}% confidence`,
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

  const handleDownload = async () => {
    if (!ocrResults?.downloadUrl) return;

    try {
      const response = await fetch(ocrResults.downloadUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download =
        ocrResults.fileName || `ocr_result.${ocrSettings.outputFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: `Downloaded ${ocrResults.fileName}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the processed file",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Text has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const searchInText = (text: string, term: string): string => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  const filteredPages =
    ocrResults?.extractedText.filter(
      (page) =>
        !searchTerm || page.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-medium hover:text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Scan className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-text-dark">PDF OCR Pro</h1>
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <Sparkles className="w-4 h-4 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-text-light text-lg max-w-3xl mx-auto">
            Convert scanned PDFs to searchable text with industry-leading
            accuracy. Support for 30+ languages, advanced image enhancement, and
            intelligent text structure analysis.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-semibold">99%+ Accuracy</div>
            <div className="text-sm text-text-light">
              Industry-leading precision
            </div>
          </Card>
          <Card className="text-center p-4">
            <Languages className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-semibold">30+ Languages</div>
            <div className="text-sm text-text-light">
              Auto-detection supported
            </div>
          </Card>
          <Card className="text-center p-4">
            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="font-semibold">Lightning Fast</div>
            <div className="text-sm text-text-light">Optimized processing</div>
          </Card>
          <Card className="text-center p-4">
            <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="font-semibold">Smart Analysis</div>
            <div className="text-sm text-text-light">
              Structure preservation
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Document Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!file ? (
                  <FileUpload
                    accept=".pdf"
                    multiple={false}
                    onFilesSelect={handleFilesSelect}
                    className="h-40"
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <FileText className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-light">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    {/* OCR Settings */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={ocrSettings.language}
                          onValueChange={(value) =>
                            setOcrSettings((prev) => ({
                              ...prev,
                              language: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {supportedLanguages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="outputFormat">Output Format</Label>
                        <Select
                          value={ocrSettings.outputFormat}
                          onValueChange={(value: any) =>
                            setOcrSettings((prev) => ({
                              ...prev,
                              outputFormat: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="json">JSON (Preview)</SelectItem>
                            <SelectItem value="txt">Text File</SelectItem>
                            <SelectItem value="pdf">Searchable PDF</SelectItem>
                            <SelectItem value="docx">Word Document</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="enhance">Enhance Quality</Label>
                          <Switch
                            id="enhance"
                            checked={ocrSettings.enhanceQuality}
                            onCheckedChange={(checked) =>
                              setOcrSettings((prev) => ({
                                ...prev,
                                enhanceQuality: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="formatting">
                            Preserve Formatting
                          </Label>
                          <Switch
                            id="formatting"
                            checked={ocrSettings.preserveFormatting}
                            onCheckedChange={(checked) =>
                              setOcrSettings((prev) => ({
                                ...prev,
                                preserveFormatting: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="detect">Auto-detect Languages</Label>
                          <Switch
                            id="detect"
                            checked={ocrSettings.detectLanguages}
                            onCheckedChange={(checked) =>
                              setOcrSettings((prev) => ({
                                ...prev,
                                detectLanguages: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleOcr}
                      disabled={isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Scan className="w-4 h-4 mr-2" />
                          Start OCR Processing
                        </>
                      )}
                    </Button>

                    {isProcessing && (
                      <div className="space-y-2">
                        <Progress value={progress} className="w-full" />
                        <p className="text-sm text-text-light text-center">
                          {processingStatus}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {ocrResults ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      OCR Results
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(ocrResults.extractedText.join("\n\n"))
                        }
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy All
                      </Button>
                      {ocrResults.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4">
                      {/* Search */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search in extracted text..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Page Navigation */}
                      {ocrResults.extractedText.length > 1 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-light">
                            Page {currentPage} of{" "}
                            {ocrResults.extractedText.length}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage((prev) => prev - 1)}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                currentPage === ocrResults.extractedText.length
                              }
                              onClick={() => setCurrentPage((prev) => prev + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Text Content */}
                      <div className="border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                        <Textarea
                          value={
                            searchTerm
                              ? filteredPages.join("\n\n--- Page Break ---\n\n")
                              : ocrResults.extractedText[currentPage - 1] || ""
                          }
                          readOnly
                          className="min-h-80 border-none resize-none focus:ring-0"
                          placeholder="Extracted text will appear here..."
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="analysis" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {ocrResults.confidence}%
                          </div>
                          <div className="text-sm text-text-light">
                            Confidence
                          </div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {ocrResults.wordCount}
                          </div>
                          <div className="text-sm text-text-light">Words</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {ocrResults.characterCount}
                          </div>
                          <div className="text-sm text-text-light">
                            Characters
                          </div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {Math.round(ocrResults.processingTime / 1000)}s
                          </div>
                          <div className="text-sm text-text-light">
                            Processing
                          </div>
                        </Card>
                      </div>

                      {/* Text Structure */}
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">
                          Text Structure Analysis
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold">
                              {ocrResults.textStructure.headers}
                            </div>
                            <div className="text-sm text-text-light">
                              Headers
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">
                              {ocrResults.textStructure.paragraphs}
                            </div>
                            <div className="text-sm text-text-light">
                              Paragraphs
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">
                              {ocrResults.textStructure.lists}
                            </div>
                            <div className="text-sm text-text-light">Lists</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">
                              {ocrResults.textStructure.tables}
                            </div>
                            <div className="text-sm text-text-light">
                              Tables
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Language Detection */}
                      {ocrResults.detectedLanguages.length > 0 && (
                        <Card className="p-4">
                          <h4 className="font-semibold mb-3">
                            Language Detection
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {ocrResults.detectedLanguages.map((lang) => (
                              <Badge key={lang} variant="outline">
                                {supportedLanguages.find((l) => l.code === lang)
                                  ?.name || lang}
                                {ocrResults.languageConfidence[lang] && (
                                  <span className="ml-1 text-xs">
                                    (
                                    {Math.round(
                                      ocrResults.languageConfidence[lang],
                                    )}
                                    %)
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="metadata" className="space-y-4">
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">
                          Processing Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Original Language:</span>
                            <span>
                              {supportedLanguages.find(
                                (l) =>
                                  l.code ===
                                  ocrResults.metadata.originalLanguage,
                              )?.name || ocrResults.metadata.originalLanguage}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Output Format:</span>
                            <span className="uppercase">
                              {ocrResults.metadata.outputFormat}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Enhancement Applied:</span>
                            <span>
                              {ocrResults.metadata.enhancementApplied
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Formatting Preserved:</span>
                            <span>
                              {ocrResults.metadata.formattingPreserved
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processed At:</span>
                            <span>
                              {new Date(
                                ocrResults.metadata.processedAt,
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quality Score:</span>
                            <span>{ocrResults.qualityScore}/100</span>
                          </div>
                        </div>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center text-text-light">
                  <Scan className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    Upload a PDF and start OCR processing to see results here
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <PromoBanner />
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default OcrPdfEnhanced;
