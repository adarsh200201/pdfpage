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
  Edit3,
  Type,
  Square,
  Image,
  Crown,
  Star,
} from "lucide-react";

interface EditElement {
  id: string;
  type: "text" | "rectangle" | "image";
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  fontSize?: number;
  color?: string;
  pageNumber: number;
}

const EditPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [editElements, setEditElements] = useState<EditElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<
    "text" | "rectangle" | "image"
  >("text");
  const [textContent, setTextContent] = useState("New Text");
  const [fontSize, setFontSize] = useState([12]);
  const [textColor, setTextColor] = useState("#000000");
  const [currentPage, setCurrentPage] = useState(1);
  const [editedFile, setEditedFile] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      const selectedFile = uploadedFiles[0];
      setFile(selectedFile);
      setIsComplete(false);
      setEditedFile(null);
      setEditElements([]);
      setCurrentPage(1);
    }
  };

  const addTextElement = () => {
    const newElement: EditElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: "text",
      x: 100,
      y: 300,
      content: textContent,
      fontSize: fontSize[0],
      color: textColor,
      pageNumber: currentPage,
    };
    setEditElements([...editElements, newElement]);

    toast({
      title: "Text added",
      description: `Added text "${textContent}" to page ${currentPage}`,
    });
  };

  const addRectangleElement = () => {
    const newElement: EditElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: "rectangle",
      x: 100,
      y: 300,
      width: 150,
      height: 100,
      color: textColor,
      pageNumber: currentPage,
    };
    setEditElements([...editElements, newElement]);

    toast({
      title: "Rectangle added",
      description: `Added rectangle to page ${currentPage}`,
    });
  };

  const removeElement = (id: string) => {
    setEditElements(editElements.filter((el) => el.id !== id));
  };

  const handleSaveEdits = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to edit.",
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
        title: `🔄 Applying edits to ${file.name}...`,
        description: "Processing PDF with your edits",
      });

      // Apply edits to PDF
      const editedPdf = await applyEditsToPdf(file, editElements);
      const blob = new Blob([editedPdf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setEditedFile({
        name: file.name.replace(/\.pdf$/i, "_edited.pdf"),
        url,
        size: blob.size,
      });
      setIsComplete(true);

      // Track usage for revenue analytics
      await PDFService.trackUsage("edit-pdf", 1, file.size);

      toast({
        title: "🎉 Editing completed!",
        description: "PDF has been edited successfully.",
      });
    } catch (error) {
      console.error("Error editing PDF:", error);
      toast({
        title: "Editing failed",
        description: "There was an error editing your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const applyEditsToPdf = async (
    file: File,
    elements: EditElement[],
  ): Promise<Uint8Array> => {
    console.log("🔄 Applying edits to PDF...");

    try {
      const { PDFDocument, rgb } = await import("pdf-lib");

      // Load the PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      console.log(`📑 Applying ${elements.length} edits to PDF`);

      // Apply edits to appropriate pages
      elements.forEach((element) => {
        if (element.pageNumber <= pages.length) {
          const page = pages[element.pageNumber - 1];
          const { height } = page.getSize();

          // Convert color
          const colorMatch = element.color?.match(/^#([0-9a-f]{6})$/i);
          const color = colorMatch
            ? rgb(
                parseInt(colorMatch[1].substr(0, 2), 16) / 255,
                parseInt(colorMatch[1].substr(2, 2), 16) / 255,
                parseInt(colorMatch[1].substr(4, 2), 16) / 255,
              )
            : rgb(0, 0, 0);

          switch (element.type) {
            case "text":
              page.drawText(element.content || "", {
                x: element.x,
                y: height - element.y, // Flip Y coordinate
                size: element.fontSize || 12,
                color,
              });
              console.log(
                `✅ Added text "${element.content}" to page ${element.pageNumber}`,
              );
              break;

            case "rectangle":
              page.drawRectangle({
                x: element.x,
                y: height - element.y - (element.height || 100), // Flip Y coordinate
                width: element.width || 150,
                height: element.height || 100,
                borderColor: color,
                borderWidth: 2,
              });
              console.log(`✅ Added rectangle to page ${element.pageNumber}`);
              break;

            default:
              console.log(`⚠️ Unknown element type: ${element.type}`);
          }
        }
      });

      // Add metadata
      pdfDoc.setSubject(`Edited PDF - ${elements.length} elements added`);
      pdfDoc.setCreator(`PdfPage - PDF Editor Tool`);

      // Save the edited PDF
      const pdfBytes = await pdfDoc.save();
      console.log(`🎉 PDF editing completed: ${pdfBytes.length} bytes`);

      return pdfBytes;
    } catch (error) {
      console.error("PDF editing failed:", error);
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
    setEditElements([]);
    setEditedFile(null);
    setIsComplete(false);
    setCurrentPage(1);
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
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Edit3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">Edit PDF</h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Add text, images, shapes or freehand annotations to a PDF document.
            Edit the size, font, and color of the added content.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <span className="mr-2">✏️</span>
            Real PDF editing with visual elements!
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

            {/* Editor Interface */}
            {file && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tools Panel */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-text-dark mb-4">
                    Editing Tools
                  </h3>

                  {/* Tool Selection */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-2">
                        Select Tool
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "text", label: "Text", icon: Type },
                          {
                            value: "rectangle",
                            label: "Rectangle",
                            icon: Square,
                          },
                          { value: "image", label: "Image", icon: Image },
                        ].map((tool) => {
                          const IconComponent = tool.icon;
                          return (
                            <button
                              key={tool.value}
                              onClick={() => setSelectedTool(tool.value as any)}
                              className={`w-full flex items-center px-3 py-2 rounded border ${
                                selectedTool === tool.value
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                  : "border-gray-300 text-gray-700 hover:border-gray-400"
                              }`}
                            >
                              <IconComponent className="w-4 h-4 mr-2" />
                              {tool.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Text Settings */}
                    {selectedTool === "text" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-2">
                            Text Content
                          </label>
                          <input
                            type="text"
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-2">
                            Font Size: {fontSize[0]}pt
                          </label>
                          <Slider
                            value={fontSize}
                            onValueChange={setFontSize}
                            max={48}
                            min={8}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-2">
                            Text Color
                          </label>
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <Button onClick={addTextElement} className="w-full">
                          <Type className="w-4 h-4 mr-2" />
                          Add Text
                        </Button>
                      </div>
                    )}

                    {/* Rectangle Settings */}
                    {selectedTool === "rectangle" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-2">
                            Border Color
                          </label>
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <Button
                          onClick={addRectangleElement}
                          className="w-full"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Add Rectangle
                        </Button>
                      </div>
                    )}

                    {/* Image Settings */}
                    {selectedTool === "image" && (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                          Image upload functionality available in premium
                          version.
                        </div>
                        <Button disabled className="w-full">
                          <Image className="w-4 h-4 mr-2" />
                          Add Image (Premium)
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Page Selection */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-text-dark mb-2">
                      Current Page
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentPage}
                      onChange={(e) =>
                        setCurrentPage(parseInt(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Preview and Elements */}
                <div className="lg:col-span-2 space-y-6">
                  {/* File Info */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-text-dark">
                          {file.name}
                        </h3>
                        <p className="text-sm text-text-light">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setFile(null)}>
                        Select Different File
                      </Button>
                    </div>

                    {/* Preview Area */}
                    <div className="relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">PDF Preview</p>
                        <p className="text-sm">
                          Page {currentPage} • Click "Add" buttons to place
                          elements
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Elements List */}
                  {editElements.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h4 className="text-md font-semibold text-text-dark mb-4">
                        Added Elements ({editElements.length})
                      </h4>
                      <div className="space-y-3">
                        {editElements.map((element) => (
                          <div
                            key={element.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              {element.type === "text" && (
                                <Type className="w-4 h-4 text-indigo-500" />
                              )}
                              {element.type === "rectangle" && (
                                <Square className="w-4 h-4 text-indigo-500" />
                              )}
                              {element.type === "image" && (
                                <Image className="w-4 h-4 text-indigo-500" />
                              )}
                              <div>
                                <p className="font-medium text-text-dark">
                                  {element.type === "text"
                                    ? element.content
                                    : `${element.type}`}
                                </p>
                                <p className="text-sm text-text-light">
                                  Page {element.pageNumber} • {element.x},{" "}
                                  {element.y}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeElement(element.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <Button
                      onClick={handleSaveEdits}
                      disabled={isProcessing || editElements.length === 0}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving Edits...
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Save Edited PDF
                        </>
                      )}
                    </Button>
                  </div>
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
                      Image insertion and manipulation
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Advanced drawing tools
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Form field editing
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Collaborative editing
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
                <Edit3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                Editing Complete!
              </h3>
              <p className="text-text-light">
                Successfully applied {editElements.length} edit(s) to your PDF
              </p>
            </div>

            {/* File Preview */}
            {editedFile && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-indigo-500" />
                  <div>
                    <p className="font-medium text-text-dark">
                      {editedFile.name}
                    </p>
                    <p className="text-sm text-text-light">
                      {(editedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {editElements.length} element(s) added
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() =>
                  editedFile && downloadFile(editedFile.url, editedFile.name)
                }
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Edited PDF
              </Button>
              <Button variant="outline" onClick={reset}>
                Edit Another PDF
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

export default EditPdf;
