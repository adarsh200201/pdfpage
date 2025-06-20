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
  Image,
  Type,
  Crown,
  Star,
} from "lucide-react";

const Watermark = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [opacity, setOpacity] = useState([50]);
  const [fontSize, setFontSize] = useState([24]);
  const [position, setPosition] = useState("center");
  const [convertedFiles, setConvertedFiles] = useState<
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
    setConvertedFiles([]);
  };

  const handleWatermark = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to add watermarks.",
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
      const watermarkedResults: { name: string; url: string; size: number }[] =
        [];

      for (const file of files) {
        try {
          toast({
            title: `🔄 Adding watermark to ${file.name}...`,
            description: "Processing PDF with watermark overlay",
          });

          // Add watermark to PDF
          const watermarkedPdf = await addWatermarkToPdf(file, {
            text: watermarkText,
            type: watermarkType,
            opacity: opacity[0] / 100,
            fontSize: fontSize[0],
            position,
          });

          const blob = new Blob([watermarkedPdf], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);

          watermarkedResults.push({
            name: file.name.replace(/\.pdf$/i, "_watermarked.pdf"),
            url,
            size: blob.size,
          });

          toast({
            title: `✅ ${file.name} watermarked successfully`,
            description: "Watermark added to PDF",
          });
        } catch (error) {
          console.error(`Error watermarking ${file.name}:`, error);
          toast({
            title: `❌ Error watermarking ${file.name}`,
            description: "Failed to add watermark to this PDF file.",
            variant: "destructive",
          });
        }
      }

      if (watermarkedResults.length > 0) {
        setConvertedFiles(watermarkedResults);
        setIsComplete(true);

        // Track usage for revenue analytics
        await PDFService.trackUsage(
          "watermark",
          files.length,
          files.reduce((sum, file) => sum + file.size, 0),
        );

        toast({
          title: "🎉 Watermarking completed!",
          description: `Successfully watermarked ${watermarkedResults.length} PDF(s).`,
        });
      }
    } catch (error) {
      console.error("Error watermarking PDFs:", error);
      toast({
        title: "Watermarking failed",
        description: "There was an error adding watermarks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addWatermarkToPdf = async (
    file: File,
    options: {
      text: string;
      type: string;
      opacity: number;
      fontSize: number;
      position: string;
    },
  ): Promise<Uint8Array> => {
    console.log("🔄 Adding watermark to PDF...");

    try {
      const { PDFDocument, rgb } = await import("pdf-lib");

      // Load the PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      console.log(`📑 Adding watermark to ${pages.length} pages`);

      // Add watermark to each page
      pages.forEach((page, index) => {
        const { width, height } = page.getSize();

        // Calculate position
        let x, y;
        switch (options.position) {
          case "top-left":
            x = 50;
            y = height - 50;
            break;
          case "top-right":
            x = width - 200;
            y = height - 50;
            break;
          case "bottom-left":
            x = 50;
            y = 50;
            break;
          case "bottom-right":
            x = width - 200;
            y = 50;
            break;
          case "center":
          default:
            x = width / 2 - 100;
            y = height / 2;
            break;
        }

        // Add text watermark
        page.drawText(options.text, {
          x,
          y,
          size: options.fontSize,
          color: rgb(0.5, 0.5, 0.5),
          opacity: options.opacity,
          rotate: { angle: -45 },
        });

        console.log(`✅ Watermark added to page ${index + 1}`);
      });

      // Save the watermarked PDF
      const pdfBytes = await pdfDoc.save();
      console.log(`🎉 Watermarking completed: ${pdfBytes.length} bytes`);

      return pdfBytes;
    } catch (error) {
      console.error("Watermarking failed:", error);
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
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Type className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Watermark PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Stamp an image or text over your PDF in seconds. Choose the
            typography, transparency and position.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <span className="mr-2">✨</span>
            Real watermark processing with custom positioning!
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
                        <FileText className="w-5 h-5 text-cyan-500" />
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

                {/* Watermark Settings */}
                <div className="space-y-6">
                  <h4 className="text-md font-semibold text-text-dark">
                    Watermark Settings
                  </h4>

                  {/* Watermark Type */}
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">
                      Watermark Type
                    </label>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setWatermarkType("text")}
                        className={`flex items-center px-4 py-2 rounded-lg border ${
                          watermarkType === "text"
                            ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                            : "border-gray-300 text-gray-700"
                        }`}
                      >
                        <Type className="w-4 h-4 mr-2" />
                        Text
                      </button>
                      <button
                        onClick={() => setWatermarkType("image")}
                        className={`flex items-center px-4 py-2 rounded-lg border ${
                          watermarkType === "image"
                            ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                            : "border-gray-300 text-gray-700"
                        }`}
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Image
                      </button>
                    </div>
                  </div>

                  {/* Watermark Text */}
                  {watermarkType === "text" && (
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="Enter watermark text"
                      />
                    </div>
                  )}

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">
                      Position
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="center">Center</option>
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>

                  {/* Opacity */}
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">
                      Opacity: {opacity[0]}%
                    </label>
                    <Slider
                      value={opacity}
                      onValueChange={setOpacity}
                      max={100}
                      min={10}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Font Size */}
                  {watermarkType === "text" && (
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Font Size: {fontSize[0]}px
                      </label>
                      <Slider
                        value={fontSize}
                        onValueChange={setFontSize}
                        max={72}
                        min={12}
                        step={2}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    onClick={handleWatermark}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding Watermark...
                      </>
                    ) : (
                      <>
                        <Type className="w-4 h-4 mr-2" />
                        Add Watermark
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
                      Custom watermark images
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Advanced positioning options
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Batch watermarking
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Custom fonts and colors
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
                <Type className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                Watermarking Complete!
              </h3>
              <p className="text-text-light">
                Successfully watermarked {files.length} PDF(s)
              </p>
            </div>

            {/* File List */}
            <div className="space-y-3 mb-6">
              {convertedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-cyan-500" />
                    <div>
                      <p className="font-medium text-text-dark">{file.name}</p>
                      <p className="text-sm text-text-light">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
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
                Watermark More Files
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

export default Watermark;
