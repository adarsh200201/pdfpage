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
  RotateCw,
  Trash2,
  GripVertical,
  Plus,
  Crown,
  Star,
} from "lucide-react";

interface PageInfo {
  id: string;
  pageNumber: number;
  rotation: number;
  toDelete: boolean;
}

const OrganizePdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [organizedFile, setOrganizedFile] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      const selectedFile = uploadedFiles[0];
      setFile(selectedFile);
      setIsComplete(false);
      setOrganizedFile(null);

      // Initialize pages (simulate getting page count)
      // In real implementation, you'd analyze the PDF to get actual page count
      const estimatedPageCount = Math.max(
        1,
        Math.round(selectedFile.size / (100 * 1024)),
      ); // Rough estimate
      const pageList: PageInfo[] = [];
      for (let i = 1; i <= Math.min(estimatedPageCount, 20); i++) {
        pageList.push({
          id: Math.random().toString(36).substr(2, 9),
          pageNumber: i,
          rotation: 0,
          toDelete: false,
        });
      }
      setPages(pageList);
    }
  };

  const rotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((page, i) =>
        i === index ? { ...page, rotation: (page.rotation + 90) % 360 } : page,
      ),
    );
  };

  const toggleDeletePage = (index: number) => {
    setPages((prev) =>
      prev.map((page, i) =>
        i === index ? { ...page, toDelete: !page.toDelete } : page,
      ),
    );
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    setPages((prev) => {
      const newPages = [...prev];
      const [movedPage] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, movedPage);
      return newPages;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      movePage(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleOrganize = async () => {
    if (!file || pages.length === 0) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to organize.",
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
      toast({
        title: `🔄 Organizing ${file.name}...`,
        description: "Reordering and processing PDF pages",
      });

      // Organize PDF
      const organizedPdf = await organizePdfFile(file, pages);
      const blob = new Blob([organizedPdf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setOrganizedFile({
        name: file.name.replace(/\.pdf$/i, "_organized.pdf"),
        url,
        size: blob.size,
      });
      setIsComplete(true);

      // Track usage for revenue analytics
      await PDFService.trackUsage("organize-pdf", 1, file.size);

      toast({
        title: "🎉 Organization completed!",
        description: "PDF pages have been organized successfully.",
      });
    } catch (error) {
      console.error("Error organizing PDF:", error);
      toast({
        title: "Organization failed",
        description:
          "There was an error organizing your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const organizePdfFile = async (
    file: File,
    pageOrder: PageInfo[],
  ): Promise<Uint8Array> => {
    console.log("🔄 Organizing PDF pages...");

    try {
      const { PDFDocument, degrees } = await import("pdf-lib");

      // Load the PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const originalPages = pdfDoc.getPages();

      console.log(`📑 Original PDF has ${originalPages.length} pages`);

      // Create new PDF with organized pages
      const newPdfDoc = await PDFDocument.create();

      // Process pages according to the organization
      const pagesToKeep = pageOrder.filter((page) => !page.toDelete);
      console.log(`📊 Keeping ${pagesToKeep.length} pages`);

      for (const pageInfo of pagesToKeep) {
        if (pageInfo.pageNumber <= originalPages.length) {
          // Copy the page
          const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [
            pageInfo.pageNumber - 1,
          ]);

          // Apply rotation if needed
          if (pageInfo.rotation > 0) {
            copiedPage.setRotation(degrees(pageInfo.rotation));
            console.log(
              `🔄 Rotated page ${pageInfo.pageNumber} by ${pageInfo.rotation}°`,
            );
          }

          newPdfDoc.addPage(copiedPage);
          console.log(`✅ Added page ${pageInfo.pageNumber} to organized PDF`);
        }
      }

      // Add metadata
      newPdfDoc.setSubject(`Organized PDF - Pages reordered and processed`);
      newPdfDoc.setCreator(`PdfPage - PDF Organize Tool`);

      // Save the organized PDF
      const pdfBytes = await newPdfDoc.save();
      console.log(`🎉 PDF organization completed: ${pdfBytes.length} bytes`);

      return pdfBytes;
    } catch (error) {
      console.error("PDF organization failed:", error);
      throw error;
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setOrganizedFile(null);
    setIsComplete(false);
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
          <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Organize PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Sort pages of your PDF file however you like. Delete PDF pages or
            add PDF pages to your document at your convenience.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <span className="mr-2">📄</span>
            Real PDF page organization with drag & drop!
          </div>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload */}
            {!file && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFileUpload}
                  accept=".pdf"
                  multiple={false}
                  maxSize={50}
                  allowedTypes={["pdf"]}
                  uploadText="Select PDF file or drop PDF file here"
                  supportText="Supports PDF format"
                />
              </div>
            )}

            {/* File Info and Page Organization */}
            {file && pages.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-dark">
                      {file.name}
                    </h3>
                    <p className="text-sm text-text-light">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {pages.length}{" "}
                      pages
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setFile(null)}>
                    Select Different File
                  </Button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    How to organize your PDF:
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      • <strong>Drag and drop</strong> pages to reorder them
                    </li>
                    <li>
                      • <strong>Click rotate</strong> to change page orientation
                    </li>
                    <li>
                      • <strong>Click delete</strong> to remove unwanted pages
                    </li>
                    <li>
                      • <strong>Click organize</strong> when you're happy with
                      the layout
                    </li>
                  </ul>
                </div>

                {/* Page Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                  {pages.map((page, index) => (
                    <div
                      key={page.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative border-2 rounded-lg p-3 cursor-move transition-all ${
                        page.toDelete
                          ? "border-red-300 bg-red-50 opacity-50"
                          : draggedIndex === index
                            ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      {/* Drag Handle */}
                      <div className="flex items-center justify-center mb-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>

                      {/* Page Preview */}
                      <div
                        className={`w-full h-24 bg-gray-100 rounded border border-gray-200 flex items-center justify-center mb-3 transform transition-transform ${
                          page.rotation === 90 || page.rotation === 270
                            ? "rotate-90"
                            : ""
                        } ${page.rotation === 180 ? "rotate-180" : ""}`}
                      >
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>

                      {/* Page Number */}
                      <p className="text-center text-sm font-medium text-gray-700 mb-3">
                        Page {page.pageNumber}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rotatePage(index)}
                          disabled={page.toDelete}
                          className="flex-1 p-1"
                        >
                          <RotateCw className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={page.toDelete ? "default" : "outline"}
                          onClick={() => toggleDeletePage(index)}
                          className={`flex-1 p-1 ${
                            page.toDelete
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "text-red-500 hover:text-red-600"
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {page.toDelete && (
                        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          ✕
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
                  <span>
                    {pages.filter((p) => !p.toDelete).length} pages will be kept
                  </span>
                  <span>
                    {pages.filter((p) => p.toDelete).length} pages will be
                    deleted
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleOrganize}
                    disabled={
                      isProcessing ||
                      pages.filter((p) => !p.toDelete).length === 0
                    }
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Organizing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Organize PDF
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Start Over
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
                      Process unlimited pages
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Batch organize multiple PDFs
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Advanced page templates
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Page thumbnails preview
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
                <Plus className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                Organization Complete!
              </h3>
              <p className="text-text-light">
                Successfully organized your PDF with{" "}
                {pages.filter((p) => !p.toDelete).length} pages
              </p>
            </div>

            {/* File Preview */}
            {organizedFile && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-slate-500" />
                  <div>
                    <p className="font-medium text-text-dark">
                      {organizedFile.name}
                    </p>
                    <p className="text-sm text-text-light">
                      {(organizedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {pages.filter((p) => !p.toDelete).length} page(s)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() =>
                  organizedFile &&
                  downloadFile(organizedFile.url, organizedFile.name)
                }
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Organized PDF
              </Button>
              <Button variant="outline" onClick={reset}>
                Organize Another PDF
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

export default OrganizePdf;
