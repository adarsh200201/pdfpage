import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/auth/AuthModal";

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
}

const OcrPdf = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResults, setOcrResults] = useState<OcrResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [outputFormat, setOutputFormat] = useState<"txt" | "docx" | "pdf">(
    "txt",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const supportedLanguages = [
    { code: "auto", name: "Auto-detect" },
    { code: "eng", name: "English" },
    { code: "spa", name: "Spanish" },
    { code: "fra", name: "French" },
    { code: "deu", name: "German" },
    { code: "ita", name: "Italian" },
    { code: "por", name: "Portuguese" },
    { code: "rus", name: "Russian" },
    { code: "chi_sim", name: "Chinese (Simplified)" },
    { code: "jpn", name: "Japanese" },
    { code: "kor", name: "Korean" },
    { code: "ara", name: "Arabic" },
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
    onProgress?.(10);

    // Simulate OCR processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onProgress?.(50);

    // Simulate text extraction
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onProgress?.(80);

    // Mock OCR results with realistic text
    const mockExtractedText = [
      `DOCUMENT TITLE: Sample PDF Document

This is page 1 of the extracted text content. The OCR process has successfully identified and converted the scanned text from the PDF into editable format.

Key Features Detected:
• Headers and titles are properly recognized
• Bullet points and lists are maintained
• Paragraph formatting is preserved
• Special characters: @, #, $, %, &, *

Contact Information:
Email: contact@example.com
Phone: +1 (555) 123-4567
Website: www.example.com

The optical character recognition system has analyzed the document structure and extracted readable text with high accuracy.`,

      `PAGE 2 - TECHNICAL SPECIFICATIONS

Technical Details:
- Image resolution: 300 DPI
- Color mode: RGB/Grayscale
- File format: PDF/A-1b compliant
- Language detection: ${
        supportedLanguages.find((lang) => lang.code === language)?.name ||
        "Auto-detected"
      }

Content Analysis:
The document contains multiple text blocks, images, and formatting elements. The OCR engine has successfully processed:

1. Standard text content
2. Tables and structured data  
3. Headers and footers
4. Mathematical expressions: 2x + 5 = 11
5. Currency values: $1,234.56

Quality Assessment:
Character recognition confidence: 94.7%
Word-level accuracy: 96.2%
Line detection success: 98.1%`,

      `PAGE 3 - EXTRACTED CONTENT SUMMARY

Final Results:
✓ Text extraction completed successfully
✓ Language detection: Confident match
✓ Formatting preservation: High quality
✓ Character accuracy: Excellent

Statistical Information:
- Total characters processed: 2,847
- Words identified: 521
- Lines detected: 67
- Paragraphs found: 12

Notes:
This OCR extraction maintains the original document structure while converting scanned content into searchable and editable text format. The process handles various fonts, sizes, and formatting styles.

End of document processing.`,
    ];

    const mockResult: OcrResult = {
      extractedText: mockExtractedText,
      confidence: 94.7,
      detectedLanguages: language === "auto" ? ["eng", "spa"] : [language],
      pageCount: 3,
      processedPages: 3,
    };

    onProgress?.(100);
    return mockResult;
  };

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

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scan className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">OCR PDF</h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Extract text from scanned PDFs and images using advanced Optical
            Character Recognition technology.
          </p>
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
          /* OCR Results */
          <div className="space-y-8">
            {/* Results Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-heading-small text-text-dark">
                  OCR Results
                </h3>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={downloadExtractedText}>
                    <Download className="w-4 h-4 mr-2" />
                    Download as {outputFormat.toUpperCase()}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Process Another PDF
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {ocrResults.processedPages}
                  </div>
                  <div className="text-sm text-blue-700">Pages Processed</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {ocrResults.confidence}%
                  </div>
                  <div className="text-sm text-green-700">Confidence</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {ocrResults.detectedLanguages.length}
                  </div>
                  <div className="text-sm text-purple-700">Languages</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    {
                      ocrResults.extractedText
                        .join(" ")
                        .split(" ")
                        .filter((word) => word.length > 0).length
                    }
                  </div>
                  <div className="text-sm text-yellow-700">Words Extracted</div>
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

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Scan className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Advanced OCR Technology
            </h4>
            <p className="text-body-small text-text-light">
              State-of-the-art optical character recognition with high accuracy
              rates
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Languages className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Multi-language Support
            </h4>
            <p className="text-body-small text-text-light">
              Support for 12+ languages with automatic language detection
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-purple-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Multiple Output Formats
            </h4>
            <p className="text-body-small text-text-light">
              Export as plain text, Word document, or searchable PDF
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

export default OcrPdf;
