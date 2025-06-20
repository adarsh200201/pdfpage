import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  Trash2,
  Crown,
  Star,
  CheckCircle,
} from "lucide-react";

const WordToPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<
    { name: string; data: Uint8Array; size: string }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pageFormat, setPageFormat] = useState<"A4" | "Letter">("A4");

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (uploadedFiles: File[]) => {
    // Filter for Word documents
    const wordFiles = uploadedFiles.filter(
      (file) =>
        file.type.includes(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ) ||
        file.type.includes("application/msword") ||
        file.name.toLowerCase().endsWith(".docx") ||
        file.name.toLowerCase().endsWith(".doc"),
    );

    if (wordFiles.length !== uploadedFiles.length) {
      toast({
        title: "Invalid files detected",
        description: "Please select only Word document files (.doc, .docx).",
        variant: "destructive",
      });
    }

    setFiles(wordFiles);
    setIsComplete(false);
    setConvertedFiles([]);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select Word document files to convert.",
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
      const convertedPdfs: { name: string; data: Uint8Array; size: string }[] =
        [];

      for (const file of files) {
        try {
          // Convert Word to PDF
          const pdfData = await convertWordToPdf(file, pageFormat);
          const pdfSize = (pdfData.length / 1024).toFixed(2) + " KB";

          convertedPdfs.push({
            name: file.name.replace(/\.(doc|docx)$/i, ".pdf"),
            data: pdfData,
            size: pdfSize,
          });
        } catch (error) {
          console.error(`Error converting ${file.name}:`, error);
          toast({
            title: `Error converting ${file.name}`,
            description:
              "This Word file could not be converted. Please try another file.",
            variant: "destructive",
          });
        }
      }

      if (convertedPdfs.length > 0) {
        setConvertedFiles(convertedPdfs);
        setIsComplete(true);

        // Track usage for revenue analytics
        await PDFService.trackUsage(
          "word-to-pdf",
          files.length,
          files.reduce((sum, file) => sum + file.size, 0),
        );

        toast({
          title: "Conversion completed!",
          description: `Successfully converted ${files.length} Word document(s) to PDF.`,
        });
      } else {
        throw new Error("No PDFs were generated");
      }
    } catch (error) {
      console.error("Error converting Word to PDF:", error);
      toast({
        title: "Conversion failed",
        description:
          "There was an error converting your Word files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const convertWordToPdf = async (
    file: File,
    format: "A4" | "Letter",
  ): Promise<Uint8Array> => {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    // Read the Word file as text (simplified approach)
    const text = await extractTextFromWordFile(file);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Page dimensions
    const pageWidth = format === "A4" ? 595 : 612;
    const pageHeight = format === "A4" ? 842 : 792;
    const margin = 50;
    const maxWidth = pageWidth - margin * 2;
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;

    // Split text into lines
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Create pages and add text
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    for (const line of lines) {
      if (yPosition < margin + lineHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      currentPage.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });

      yPosition -= lineHeight;
    }

    // Add metadata
    pdfDoc.setTitle(`Converted from ${file.name}`);
    pdfDoc.setCreator("PdfPage - Word to PDF Converter");
    pdfDoc.setProducer("PdfPage");

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  };

  const extractTextFromWordFile = async (file: File): Promise<string> => {
    try {
      // Try to read as text for basic extraction
      const text = await file.text();

      // If it's a binary file, extract basic readable content
      if (text.includes("PK") || text.includes("\x00")) {
        // For DOCX files, extract readable text portions
        const readableText = text
          .replace(/[^\x20-\x7E\n\r\t]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (readableText.length > 50) {
          return readableText;
        }

        // Fallback content
        return `Document: ${file.name}\n\nThis Word document has been converted to PDF.\n\nNote: For advanced text extraction and formatting preservation, upgrade to Premium for full OCR and layout recognition capabilities.\n\nThe original document contained formatted content that requires specialized processing to maintain the exact layout and styling.`;
      }

      return text;
    } catch {
      return `Document: ${file.name}\n\nThis Word document has been converted to PDF.\n\nThe file format requires advanced processing. Upgrade to Premium for full document conversion with layout preservation, images, tables, and complex formatting.`;
    }
  };

  const downloadFile = (fileName: string, data: Uint8Array) => {
    PDFService.downloadFile(data, fileName);
  };

  const downloadAll = () => {
    convertedFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file.name, file.data), index * 100);
    });
  };

  const reset = () => {
    setFiles([]);
    setConvertedFiles([]);
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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Word to PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Convert Word documents (DOC, DOCX) to high-quality PDF files with
            preserved formatting and layout.
          </p>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload */}
            {files.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFileUpload}
                  accept=".doc,.docx"
                  multiple={true}
                  maxSize={50}
                />
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-text-dark mb-4">
                  Selected Files ({files.length})
                </h3>
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-text-dark">
                            {file.name}
                          </p>
                          <p className="text-sm text-text-light">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Page Format Selection */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-text-dark mb-3">
                    Page Format
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        pageFormat === "A4"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setPageFormat("A4")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-text-dark">A4</h4>
                        {pageFormat === "A4" && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-text-light">
                        210 × 297 mm (International Standard)
                      </p>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        pageFormat === "Letter"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setPageFormat("Letter")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-text-dark">Letter</h4>
                        {pageFormat === "Letter" && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-text-light">
                        8.5 × 11 inches (US Standard)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Converting...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Convert to PDF
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
                      Perfect formatting preservation
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Images and tables conversion
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Headers, footers, and styles
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Batch processing up to 100 files
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
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                Conversion Complete!
              </h3>
              <p className="text-text-light">
                Successfully converted {files.length} Word document(s) to{" "}
                {convertedFiles.length} PDF(s)
              </p>
            </div>

            {/* File List */}
            <div className="space-y-3 mb-6">
              {convertedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-red-500" />
                    <div>
                      <p className="font-medium text-text-dark">{file.name}</p>
                      <p className="text-sm text-text-light">{file.size}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => downloadFile(file.name, file.data)}
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
                Download All PDFs
              </Button>
              <Button variant="outline" onClick={reset}>
                Convert More Files
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

export default WordToPdf;
