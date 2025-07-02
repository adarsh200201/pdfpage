import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Download,
  FileText,
  Scissors,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Info,
  Eye,
  Package,
  Layers,
  SeparatorHorizontal,
  Grid,
  Archive,
  DownloadCloud,
  Combine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAutoToolTracking } from "@/hooks/useAutoToolTracking";
import AuthModal from "@/components/auth/AuthModal";

interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

const Split = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [splitPages, setSplitPages] = useState<Uint8Array[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitMode, setSplitMode] = useState<"pages" | "ranges" | "bulk">(
    "pages",
  );
  const [pageRanges, setPageRanges] = useState("");
  const [bulkSize, setBulkSize] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [downloadAll, setDownloadAll] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const track = useAutoToolTracking();

  const handleFilesSelect = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];

      // Track file upload
      track.fileUpload([selectedFile]);

      setFile({
        id: Math.random().toString(36).substr(2, 9),
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
      });
      setIsComplete(false);
      setSplitPages([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSplit = async () => {
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
        title: `🔄 Splitting ${file.name}...`,
        description: `Mode: ${splitMode} • Processing your PDF`,
      });

      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      setProgress(20);

      const splitPdfPages = await PDFService.splitPDF(
        file.file,
        (progressPercent) => {
          setProgress(20 + progressPercent * 0.7);
        },
      );

      setSplitPages(splitPdfPages);
      setTotalPages(splitPdfPages.length);

      // Track usage
      await PDFService.trackUsage("split", 1, file.size);

      setProgress(100);

      // Auto-download based on preferences
      if (downloadAll && splitPdfPages.length <= 10) {
        // Download all pages if user wants and it's reasonable
        splitPdfPages.forEach((page, index) => {
          setTimeout(() => {
            PDFService.downloadFile(page, `page-${index + 1}-${file.name}`);
          }, index * 200); // Stagger downloads
        });
      } else if (splitPdfPages.length > 0) {
        // Just download first page as preview
        PDFService.downloadFile(splitPdfPages[0], `page-1-${file.name}`);
      }

      setIsComplete(true);

      toast({
        title: "Success!",
        description: `PDF split into ${splitPdfPages.length} page(s)`,
      });
    } catch (error: any) {
      console.error("Error splitting PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to split PDF file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPage = (pageIndex: number) => {
    if (splitPages[pageIndex]) {
      PDFService.downloadFile(
        splitPages[pageIndex],
        `page-${pageIndex + 1}-${file?.name}`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">Split PDF</h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Separate one page or a whole set for easy conversion into
            independent PDF files.
          </p>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-6 sm:space-y-8">
            {/* File Upload */}
            {!file && (
              <div className="bg-white rounded-xl p-4 sm:p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFilesSelect}
                  multiple={false}
                  maxSize={25}
                />
              </div>
            )}

            {/* File Display */}
            {file && (
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
                  <h3 className="text-heading-small text-text-dark">
                    PDF File to Split
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => setFile(null)}
                    className="w-full sm:w-auto"
                  >
                    Choose Different File
                  </Button>
                </div>

                {/* File Info */}
                <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-dark truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-text-light">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                {/* Advanced Split Options */}
                <Tabs
                  value={splitMode}
                  onValueChange={(value) => setSplitMode(value as any)}
                  className="mb-6"
                >
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger
                      value="pages"
                      className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm"
                    >
                      <Layers className="w-4 h-4" />
                      <span className="hidden sm:inline">Extract Pages</span>
                      <span className="sm:hidden">Extract</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="ranges"
                      className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm"
                    >
                      <SeparatorHorizontal className="w-4 h-4" />
                      <span className="hidden sm:inline">Split Ranges</span>
                      <span className="sm:hidden">Ranges</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="bulk"
                      className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm"
                    >
                      <Grid className="w-4 h-4" />
                      <span className="hidden sm:inline">Fixed Intervals</span>
                      <span className="sm:hidden">Intervals</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pages" className="space-y-4 mt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Layers className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-800 mb-1">
                            Extract Individual Pages
                          </h4>
                          <p className="text-sm text-green-700">
                            Each page will be extracted as a separate PDF file.
                            Perfect for getting specific pages.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="downloadAll"
                        checked={downloadAll}
                        onChange={(e) => setDownloadAll(e.target.checked)}
                        className="rounded"
                      />
                      <label
                        htmlFor="downloadAll"
                        className="text-sm text-gray-700"
                      >
                        Download all pages automatically (recommended for ≤10
                        pages)
                      </label>
                    </div>
                  </TabsContent>

                  <TabsContent value="ranges" className="space-y-4 mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <SeparatorHorizontal className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800 mb-1">
                            Split by Page Ranges
                          </h4>
                          <p className="text-sm text-blue-700">
                            Define specific ranges to extract. Use commas to
                            separate ranges (e.g., 1-5, 8-12, 15).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Ranges
                      </label>
                      <input
                        type="text"
                        value={pageRanges}
                        onChange={(e) => setPageRanges(e.target.value)}
                        placeholder="e.g., 1-3, 5, 7-9"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Examples: "1-5" (pages 1 to 5), "1,3,5" (specific
                        pages), "1-3,7-9" (multiple ranges)
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="bulk" className="space-y-4 mt-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Grid className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-purple-800 mb-1">
                            Split by Fixed Intervals
                          </h4>
                          <p className="text-sm text-purple-700">
                            Split the PDF into multiple files, each containing a
                            fixed number of pages.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pages per file: {bulkSize}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={bulkSize}
                        onChange={(e) => setBulkSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1 page</span>
                        <span>20 pages</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        This will create multiple PDF files, each containing{" "}
                        {bulkSize} page{bulkSize > 1 ? "s" : ""}.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
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

            {/* Split Button */}
            {file && !usageLimitReached && (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleSplit}
                  disabled={isProcessing}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Splitting PDF...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-5 h-5 mr-2" />
                      {splitMode === "pages"
                        ? "Extract All Pages"
                        : splitMode === "ranges"
                          ? "Split by Ranges"
                          : `Split Every ${bulkSize} Page${bulkSize > 1 ? "s" : ""}`}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Splitting your PDF...
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  Mode:{" "}
                  {splitMode === "pages"
                    ? "Individual Pages"
                    : splitMode === "ranges"
                      ? "Page Ranges"
                      : "Fixed Intervals"}
                </p>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Processing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="text-xs text-gray-500">
                  {progress < 30
                    ? "Analyzing PDF structure..."
                    : progress < 70
                      ? "Extracting pages..."
                      : progress < 95
                        ? "Finalizing files..."
                        : "Almost done!"}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-heading-small text-text-dark mb-2">
                🎉 PDF Split Successfully!
              </h3>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Badge className="bg-green-100 text-green-800">
                  <Package className="w-3 h-3 mr-1" />
                  {splitPages.length} Files Created
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  <Scissors className="w-3 h-3 mr-1" />
                  {splitMode === "pages"
                    ? "Individual Pages"
                    : splitMode === "ranges"
                      ? "Page Ranges"
                      : "Fixed Intervals"}
                </Badge>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <Button
                onClick={() => {
                  splitPages.forEach((page, index) => {
                    setTimeout(() => {
                      PDFService.downloadFile(
                        page,
                        `page-${index + 1}-${file?.name}`,
                      );
                    }, index * 300);
                  });
                }}
                className="bg-green-600 hover:bg-green-700"
                disabled={splitPages.length > 20}
              >
                <DownloadCloud className="w-4 h-4 mr-2" />
                Download All{" "}
                {splitPages.length > 20
                  ? "(Too Many)"
                  : `(${splitPages.length})`}
              </Button>

              {splitPages.length > 20 && (
                <Button
                  onClick={() => {
                    // Download first 10 pages
                    splitPages.slice(0, 10).forEach((page, index) => {
                      setTimeout(() => {
                        PDFService.downloadFile(
                          page,
                          `page-${index + 1}-${file?.name}`,
                        );
                      }, index * 300);
                    });
                  }}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download First 10
                </Button>
              )}

              <Button
                onClick={() => {
                  setFile(null);
                  setIsComplete(false);
                  setSplitPages([]);
                  setProgress(0);
                }}
                variant="outline"
              >
                <Scissors className="w-4 h-4 mr-2" />
                Split Another PDF
              </Button>
            </div>

            {/* Split Pages Grid - Better Layout */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  Split Files ({splitPages.length})
                </h4>
                <div className="text-sm text-gray-500">
                  Click any file to download individually
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {splitPages.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => downloadPage(index)}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-green-50 hover:border-green-300 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Page {index + 1}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {file?.name?.replace(".pdf", "")}-page-{index + 1}.pdf
                      </p>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-4">
                All {splitPages.length} files are ready for download. Files are
                processed locally and secure.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <Link to="/merge">
                  <Button variant="outline" size="sm">
                    <Combine className="w-4 h-4 mr-2" />
                    Merge PDFs
                  </Button>
                </Link>
                <Link to="/compress">
                  <Button variant="outline" size="sm">
                    <Archive className="w-4 h-4 mr-2" />
                    Compress PDFs
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" size="sm">
                    More Tools
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 sm:mt-12 px-4 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center px-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-6 h-6 text-green-500" />
              </div>
              <h4 className="font-semibold text-text-dark mb-2 text-sm sm:text-base">
                Precise Splitting
              </h4>
              <p className="text-xs sm:text-sm text-text-light leading-relaxed max-w-xs mx-auto">
                Extract individual pages or page ranges with perfect accuracy
              </p>
            </div>

            <div className="text-center px-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="font-semibold text-text-dark mb-2 text-sm sm:text-base">
                High Quality
              </h4>
              <p className="text-xs sm:text-sm text-text-light leading-relaxed max-w-xs mx-auto">
                Maintain original quality and formatting in each split file
              </p>
            </div>

            <div className="text-center px-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
              <h4 className="font-semibold text-text-dark mb-2 text-sm sm:text-base">
                Easy Download
              </h4>
              <p className="text-xs sm:text-sm text-text-light leading-relaxed max-w-xs mx-auto">
                Download individual pages or all files at once
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

export default Split;
