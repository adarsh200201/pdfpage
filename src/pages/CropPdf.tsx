import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import { Slider } from "@/components/ui/slider";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  Scissors,
  Crop,
  Crown,
  Star,
} from "lucide-react";

const CropPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [cropSettings, setCropSettings] = useState({
    top: [20],
    bottom: [20],
    left: [20],
    right: [20],
  });
  const [applyToAllPages, setApplyToAllPages] = useState(true);
  const [pageRange, setPageRange] = useState("1-1");
  const [croppedFiles, setCroppedFiles] = useState<
    { name: string; url: string; size: number }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    setIsComplete(false);
    setCroppedFiles([]);
  };

  const handleCrop = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to crop.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    try {
      const usageCheck = await PDFService.checkUsageLimit();
      if (!usageCheck.canUpload) {
        setShowAuthModal(true);
        return;
      }
    } catch (error) {
      console.error("Error checking usage limit:", error);
    }

    setIsProcessing(true);

    try {
      const croppedResults: { name: string; url: string; size: number }[] = [];

      for (const file of files) {
        try {
          toast({
            title: `🔄 Cropping ${file.name}...`,
            description: "Applying crop margins to PDF pages",
          });

          // Crop PDF
          const croppedPdf = await cropPdfFile(file, {
            margins: {
              top: cropSettings.top[0],
              bottom: cropSettings.bottom[0],
              left: cropSettings.left[0],
              right: cropSettings.right[0],
            },
            applyToAllPages,
            pageRange,
          });

          const blob = new Blob([croppedPdf], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);

          croppedResults.push({
            name: file.name.replace(/\.pdf$/i, "_cropped.pdf"),
            url,
            size: blob.size,
          });

          toast({
            title: `✅ ${file.name} cropped successfully`,
            description: "Crop margins applied to PDF",
          });
        } catch (error) {
          console.error(`Error cropping ${file.name}:`, error);
          toast({
            title: `❌ Error cropping ${file.name}`,
            description: "Failed to crop this PDF file.",
            variant: "destructive",
          });
        }
      }

      if (croppedResults.length > 0) {
        setCroppedFiles(croppedResults);
        setIsComplete(true);

        // Track usage for revenue analytics
        await PDFService.trackUsage(
          "crop-pdf",
          files.length,
          files.reduce((sum, file) => sum + file.size, 0),
        );

        toast({
          title: "🎉 Cropping completed!",
          description: `Successfully cropped ${croppedResults.length} PDF(s).`,
        });
      }
    } catch (error) {
      console.error("Error cropping PDFs:", error);
      toast({
        title: "Cropping failed",
        description: "There was an error cropping your PDFs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cropPdfFile = async (
    file: File,
    options: {
      margins: { top: number; bottom: number; left: number; right: number };
      applyToAllPages: boolean;
      pageRange: string;
    },
  ): Promise<Uint8Array> => {
    console.log("🔄 Cropping PDF pages...");

    try {
      const { PDFDocument } = await import("pdf-lib");

      // Load the PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      console.log(
        `📑 Cropping ${pages.length} pages with margins:`,
        options.margins,
      );

      // Apply cropping to pages
      if (options.applyToAllPages) {
        // Apply to all pages
        pages.forEach((page, index) => {
          const { width, height } = page.getSize();

          // Calculate new dimensions after cropping
          const newWidth = width - options.margins.left - options.margins.right;
          const newHeight =
            height - options.margins.top - options.margins.bottom;

          // Set new page size (crop by adjusting media box)
          page.setSize(newWidth, newHeight);

          // Adjust content to fit new size
          page.translateContent(-options.margins.left, -options.margins.bottom);

          console.log(
            `✅ Cropped page ${index + 1}: ${Math.round(newWidth)}x${Math.round(newHeight)}`,
          );
        });
      } else {
        // Apply to specific page range
        const [startPage, endPage] = options.pageRange
          .split("-")
          .map((p) => parseInt(p.trim()));

        for (let i = startPage - 1; i < Math.min(endPage, pages.length); i++) {
          const page = pages[i];
          const { width, height } = page.getSize();

          const newWidth = width - options.margins.left - options.margins.right;
          const newHeight =
            height - options.margins.top - options.margins.bottom;

          page.setSize(newWidth, newHeight);
          page.translateContent(-options.margins.left, -options.margins.bottom);

          console.log(
            `✅ Cropped page ${i + 1}: ${Math.round(newWidth)}x${Math.round(newHeight)}`,
          );
        }
      }

      // Add metadata
      pdfDoc.setSubject(`Cropped PDF - Margins applied`);
      pdfDoc.setCreator(`PdfPage - PDF Crop Tool`);

      // Save the cropped PDF
      const pdfBytes = await pdfDoc.save();
      console.log(`🎉 PDF cropping completed: ${pdfBytes.length} bytes`);

      return pdfBytes;
    } catch (error) {
      console.error("PDF cropping failed:", error);
      throw error;
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const downloadAll = () => {
    croppedFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file.url, file.name), index * 100);
    });
  };

  const reset = () => {
    setFiles([]);
    setCroppedFiles([]);
    setIsComplete(false);
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
          <div className="w-16 h-16 bg-gradient-to-br from-green-700 to-green-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crop className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">Crop PDF</h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Crop margins of PDF documents or select specific areas, then apply
            the changes to one page or the whole document.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <span className="mr-2">✂️</span>
            Real PDF cropping with custom margins!
          </div>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload */}
            {files.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFileUpload}
                  accept=".pdf"
                  multiple={true}
                  maxSize={50}
                  allowedTypes={["pdf"]}
                  uploadText="Select PDF files or drop PDF files here"
                  supportText="Supports PDF format"
                />
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-text-dark mb-4">
                  Selected Files ({files.length})
                </h3>
                <div className="space-y-3 mb-6">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-green-700" />
                        <div>
                          <p className="font-medium text-text-dark">
                            {file.name}
                          </p>
                          <p className="text-sm text-text-light">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Crop Settings */}
                <div className="space-y-6">
                  <h4 className="text-md font-semibold text-text-dark">
                    Crop Settings
                  </h4>

                  {/* Page Application */}
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">
                      Apply To
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={applyToAllPages}
                          onChange={() => setApplyToAllPages(true)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          All pages
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!applyToAllPages}
                          onChange={() => setApplyToAllPages(false)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Specific pages
                        </span>
                      </label>
                    </div>

                    {!applyToAllPages && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Page Range (e.g., 1-3)
                        </label>
                        <input
                          type="text"
                          value={pageRange}
                          onChange={(e) => setPageRange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="1-3"
                        />
                      </div>
                    )}
                  </div>

                  {/* Margin Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Top Margin: {cropSettings.top[0]}pt
                      </label>
                      <Slider
                        value={cropSettings.top}
                        onValueChange={(value) =>
                          setCropSettings({ ...cropSettings, top: value })
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Bottom Margin: {cropSettings.bottom[0]}pt
                      </label>
                      <Slider
                        value={cropSettings.bottom}
                        onValueChange={(value) =>
                          setCropSettings({ ...cropSettings, bottom: value })
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Left Margin: {cropSettings.left[0]}pt
                      </label>
                      <Slider
                        value={cropSettings.left}
                        onValueChange={(value) =>
                          setCropSettings({ ...cropSettings, left: value })
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Right Margin: {cropSettings.right[0]}pt
                      </label>
                      <Slider
                        value={cropSettings.right}
                        onValueChange={(value) =>
                          setCropSettings({ ...cropSettings, right: value })
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Preview Info */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-green-800 mb-2">
                      Crop Preview
                    </h5>
                    <div className="text-sm text-green-700">
                      <p>
                        Margins will be removed from{" "}
                        {applyToAllPages ? "all pages" : `pages ${pageRange}`}:
                      </p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>Top: {cropSettings.top[0]}pt</li>
                        <li>Bottom: {cropSettings.bottom[0]}pt</li>
                        <li>Left: {cropSettings.left[0]}pt</li>
                        <li>Right: {cropSettings.right[0]}pt</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    onClick={handleCrop}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cropping...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-4 h-4 mr-2" />
                        Crop PDF
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setFiles([])}>
                    Clear Files
                  </Button>
                </div>
              </div>
            )}

            {/* Premium Features */}
            {!user?.isPremium && (
              <Card className="border-brand-yellow bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-800">
                    <Crown className="w-5 h-5 mr-2 text-brand-yellow" />
                    Unlock Premium Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-orange-700 mb-4">
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Visual crop selection
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Batch cropping
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Advanced page selection
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Custom aspect ratios
                    </li>
                  </ul>
                  <Button className="bg-brand-yellow text-black hover:bg-yellow-400">
                    <Crown className="w-4 h-4 mr-2" />
                    Get Premium
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Results */
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crop className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                Cropping Complete!
              </h3>
              <p className="text-text-light">
                Successfully cropped {files.length} PDF(s)
              </p>
            </div>

            {/* File List */}
            <div className="space-y-3 mb-6">
              {croppedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Crop className="w-5 h-5 text-green-700" />
                    <div>
                      <p className="font-medium text-text-dark">{file.name}</p>
                      <p className="text-sm text-text-light">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Cropped
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file.url, file.name)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={downloadAll} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download All Files
              </Button>
              <Button variant="outline" onClick={reset}>
                Crop More Files
              </Button>
            </div>
          </div>
        )}
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

export default CropPdf;
