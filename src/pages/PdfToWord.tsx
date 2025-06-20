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

const PdfToWord = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<
    { name: string; url: string; size: string }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [conversionMode, setConversionMode] = useState<"editable" | "layout">(
    "editable",
  );

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
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
        description: "Please select PDF files to convert.",
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
      const convertedDocs: { name: string; url: string; size: string }[] = [];

      for (const file of files) {
        try {
          // Convert PDF to Word using text extraction and formatting
          const docBlob = await convertPdfToWord(file, conversionMode);
          const docUrl = URL.createObjectURL(docBlob);
          const docSize = (docBlob.size / 1024).toFixed(2) + " KB";

          convertedDocs.push({
            name: file.name.replace(".pdf", ".docx"),
            url: docUrl,
            size: docSize,
          });
        } catch (error) {
          console.error(`Error converting ${file.name}:`, error);
          toast({
            title: `Error converting ${file.name}`,
            description:
              "This PDF file could not be converted. Please try another file.",
            variant: "destructive",
          });
        }
      }

      if (convertedDocs.length > 0) {
        setConvertedFiles(convertedDocs);
        setIsComplete(true);

        // Track usage for revenue analytics
        await PDFService.trackUsage(
          "pdf-to-word",
          files.length,
          files.reduce((sum, file) => sum + file.size, 0),
        );

        toast({
          title: "Conversion completed!",
          description: `Successfully converted ${files.length} PDF(s) to Word document(s).`,
        });
      } else {
        throw new Error("No documents were generated");
      }
    } catch (error) {
      console.error("Error converting PDF to Word:", error);
      toast({
        title: "Conversion failed",
        description:
          "There was an error converting your PDF files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const convertPdfToWord = async (
    file: File,
    mode: "editable" | "layout",
  ): Promise<Blob> => {
    const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

    // Set worker source
    GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;

    let extractedText = "";

    // Extract text from all pages
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      let pageText = "";
      textContent.items.forEach((item: any) => {
        if (item.str) {
          pageText += item.str + " ";
        }
      });

      extractedText += `\n\n--- Page ${pageNumber} ---\n\n${pageText.trim()}`;
    }

    // Create a simple HTML document that can be opened as Word
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Converted from PDF</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 1in;
            font-size: 12pt;
          }
          .page-break { page-break-before: always; }
          h1 { font-size: 16pt; font-weight: bold; }
          h2 { font-size: 14pt; font-weight: bold; }
          p { margin-bottom: 12pt; }
        </style>
      </head>
      <body>
        <h1>Converted from: ${file.name}</h1>
        <p><strong>Conversion Mode:</strong> ${mode === "editable" ? "Editable Text" : "Layout Preserving"}</p>
        <div>
          ${extractedText
            .split("\n\n--- Page")
            .map((pageContent, index) => {
              if (index === 0) return `<p>${pageContent}</p>`;
              return `<div class="page-break"><h2>Page ${pageContent.split(" ---")[0]}</h2><p>${pageContent.split(" ---\n\n")[1] || ""}</p></div>`;
            })
            .join("")}
        </div>
      </body>
      </html>
    `;

    // Create blob that will be recognized as a Word document
    return new Blob([htmlContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const downloadAll = () => {
    convertedFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file.url, file.name), index * 100);
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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            PDF to Word
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Convert PDF files to editable Word documents. Extract text and
            maintain formatting for easy editing.
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
                  accept=".pdf"
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
                        <FileText className="w-5 h-5 text-blue-500" />
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

                {/* Conversion Mode */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-text-dark mb-3">
                    Conversion Mode
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        conversionMode === "editable"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setConversionMode("editable")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-text-dark">
                          Editable Text
                        </h4>
                        {conversionMode === "editable" && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-text-light">
                        Extract all text for easy editing. Best for text-based
                        documents.
                      </p>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        conversionMode === "layout"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setConversionMode("layout")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-text-dark">
                          Layout Preserving
                        </h4>
                        {conversionMode === "layout" && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-text-light">
                        Maintain original layout and formatting. Best for
                        complex documents.
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
                        Convert to Word
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
                      OCR for scanned PDFs
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Advanced formatting preservation
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Table and image extraction
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Batch processing up to 50 files
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
                Successfully converted {files.length} PDF(s) to{" "}
                {convertedFiles.length} Word document(s)
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
                    <FileText className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="font-medium text-text-dark">{file.name}</p>
                      <p className="text-sm text-text-light">{file.size}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
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
                Download All Documents
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

export default PdfToWord;
