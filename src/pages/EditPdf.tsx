import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import { usePDFEditor } from "@/hooks/usePDFEditor";
import EnhancedPDFEditorCanvas from "@/components/pdf-editor/EnhancedPDFEditorCanvas";
import ImageUpload, { ImageTool } from "@/components/pdf-editor/ImageUpload";
import { exportPDFWithEdits, downloadPDF } from "@/utils/pdfExport";
import {
  ArrowLeft,
  Download,
  FileText,
  Upload,
  Crown,
  Star,
  MousePointer,
  Type,
  PenTool,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Image,
  Stamp,
  StickyNote,
  Copy,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EditPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [editedFile, setEditedFile] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(2);
  const [selectedFontSize, setSelectedFontSize] = useState(16);
  const [totalPages, setTotalPages] = useState(1);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [zoom, setZoom] = useState(1);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { state, actions, selectors, computed } = usePDFEditor();

  const handleFileUpload = useCallback(
    (uploadedFiles: File[]) => {
      if (uploadedFiles.length > 0) {
        const selectedFile = uploadedFiles[0];
        setFile(selectedFile);
        setIsComplete(false);
        setEditedFile(null);
        actions.clearAll();
        actions.setPage(0);
      }
    },
    [actions],
  );

  const handleImageSelect = useCallback(
    (imageFile: File) => {
      setShowImageUpload(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;

        // Create an image element to get dimensions
        const img = new window.Image();
        img.onload = () => {
          const maxWidth = 200;
          const maxHeight = 200;
          let { width, height } = img;

          // Scale down if too large
          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width *= scale;
            height *= scale;
          }

          actions.addElement({
            type: "image",
            pageIndex: state.currentPage,
            bounds: {
              x: 100, // Default position
              y: 100,
              width,
              height,
            },
            properties: {
              imageUrl,
              originalWidth: img.width,
              originalHeight: img.height,
              opacity: 1,
            },
          });

          toast({
            title: "Image added",
            description: "Image has been added to the PDF",
          });
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(imageFile);
    },
    [actions, state.currentPage, toast],
  );

  const handleToolSelect = useCallback(
    (tool: string) => {
      if (tool === "image") {
        setShowImageUpload(true);
      } else {
        actions.setTool(tool as any);
      }
    },
    [actions],
  );

  const handleSaveEdits = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to edit.",
        variant: "destructive",
      });
      return;
    }

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
        description: `Processing PDF with ${state.elements.length} elements`,
      });

      const editedPdfBytes = await exportPDFWithEdits({
        originalFile: file,
        elements: state.elements,
        pageCount: totalPages,
      });

      const filename = file.name.replace(/\.pdf$/i, "_edited.pdf");
      await downloadPDF(editedPdfBytes, filename);

      await PDFService.trackUsage("edit-pdf", 1, file.size);

      toast({
        title: "🎉 PDF downloaded successfully!",
        description: `${filename} has been saved to your downloads.`,
      });

      setIsComplete(true);
    } catch (error) {
      console.error("Error editing PDF:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const applyEditsToPdf = async (
    file: File,
    elements: any[],
  ): Promise<Uint8Array> => {
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      const elementsByPage = elements.reduce(
        (acc, element) => {
          if (!acc[element.pageIndex]) acc[element.pageIndex] = [];
          acc[element.pageIndex].push(element);
          return acc;
        },
        {} as Record<number, any[]>,
      );

      Object.entries(elementsByPage).forEach(([pageIndexStr, pageElements]) => {
        const pageIndex = parseInt(pageIndexStr, 10);
        if (pageIndex < pages.length) {
          const page = pages[pageIndex];
          const { height } = page.getSize();

          pageElements.forEach((element) => {
            switch (element.type) {
              case "text":
                const textColor = hexToRgb(element.properties.color);
                page.drawText(element.properties.text || "", {
                  x: element.bounds.x,
                  y: height - element.bounds.y - element.bounds.height,
                  size: element.properties.fontSize || 16,
                  color: rgb(textColor.r, textColor.g, textColor.b),
                });
                break;
              case "rectangle":
                const rectColor = hexToRgb(element.properties.strokeColor);
                page.drawRectangle({
                  x: element.bounds.x,
                  y: height - element.bounds.y - element.bounds.height,
                  width: element.bounds.width,
                  height: element.bounds.height,
                  borderColor: rgb(rectColor.r, rectColor.g, rectColor.b),
                  borderWidth: element.properties.strokeWidth || 2,
                });
                break;
            }
          });
        }
      });

      pdfDoc.setSubject(`Edited PDF - ${elements.length} elements added`);
      pdfDoc.setCreator(`PdfPage - Advanced PDF Editor`);

      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error("PDF editing failed:", error);
      throw error;
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const reset = () => {
    setFile(null);
    setEditedFile(null);
    setIsComplete(false);
    actions.clearAll();
    actions.setPage(0);
  };

  const toolbarItems = [
    { tool: "select", icon: MousePointer, label: "Select" },
    { tool: "text", icon: Type, label: "Text" },
    { tool: "draw", icon: PenTool, label: "Draw" },
    { tool: "rectangle", icon: Square, label: "Rectangle" },
    { tool: "circle", icon: Circle, label: "Circle" },
    { tool: "line", icon: Minus, label: "Line" },
    { tool: "arrow", icon: ArrowRight, label: "Arrow" },
    { tool: "image", icon: Image, label: "Image" },
    { tool: "stamp", icon: Stamp, label: "Stamp" },
    { tool: "sticky-note", icon: StickyNote, label: "Note" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
        <PromoBanner className="mb-4" />

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="flex items-center text-sm text-gray-600 hover:text-brand-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          {file && (
            <div className="flex items-center text-sm text-gray-500">
              <FileText className="w-4 h-4 mr-2" />
              {file.name}
            </div>
          )}
        </div>

        {/* Header */}
        {!file && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Edit PDF</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Add text, images, shapes, and annotations to your PDF documents
            </p>
          </div>
        )}

        {!isComplete ? (
          <div className="space-y-4">
            {/* File Upload */}
            {!file && (
              <Card className="border-2 border-dashed border-gray-300 hover:border-red-400 transition-colors">
                <CardContent className="p-8">
                  <FileUpload
                    onFilesSelect={handleFileUpload}
                    accept=".pdf"
                    multiple={false}
                    maxSize={50}
                    allowedTypes={["pdf"]}
                    uploadText="Drop your PDF here or click to upload"
                    supportText="Supports PDF files up to 50MB"
                  />
                </CardContent>
              </Card>
            )}

            {/* Editor Interface - Exact LightPDF Style */}
            {file && (
              <div
                className="bg-white border border-gray-200 overflow-hidden"
                style={{ height: "calc(100vh - 200px)" }}
              >
                {/* Top Toolbar */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {/* Tools */}
                      {toolbarItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <Button
                            key={item.tool}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToolSelect(item.tool)}
                            className={cn(
                              "h-9 w-9 p-0 rounded",
                              state.currentTool === item.tool
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : "hover:bg-gray-200 text-gray-700",
                            )}
                            title={item.label}
                          >
                            <IconComponent className="h-4 w-4" />
                          </Button>
                        );
                      })}

                      <div className="h-6 w-px bg-gray-300 mx-3" />

                      {/* Undo/Redo */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={actions.undo}
                        disabled={!computed.canUndo}
                        className="h-9 w-9 p-0 rounded hover:bg-gray-200"
                        title="Undo"
                      >
                        <Undo className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={actions.redo}
                        disabled={!computed.canRedo}
                        className="h-9 w-9 p-0 rounded hover:bg-gray-200"
                        title="Redo"
                      >
                        <Redo className="h-4 w-4" />
                      </Button>

                      <div className="h-6 w-px bg-gray-300 mx-3" />

                      {/* Zoom */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          actions.setZoom(Math.max(state.zoom / 1.2, 0.25))
                        }
                        className="h-9 w-9 p-0 rounded hover:bg-gray-200"
                        title="Zoom Out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <div className="text-sm font-medium px-3 py-1 bg-white border border-gray-300 rounded min-w-[60px] text-center">
                        {Math.round(state.zoom * 100)}%
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          actions.setZoom(Math.min(state.zoom * 1.2, 3))
                        }
                        className="h-9 w-9 p-0 rounded hover:bg-gray-200"
                        title="Zoom In"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={handleSaveEdits}
                        disabled={isProcessing || state.elements.length === 0}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Property Bar */}
                <div className="bg-white border-b border-gray-200 px-4 py-2">
                  <div className="flex items-center space-x-6">
                    {/* Color */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        Color:
                      </span>
                      <div className="flex items-center space-x-1">
                        <div
                          className="w-6 h-6 rounded border border-gray-400 cursor-pointer"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <span className="text-sm text-gray-600">■</span>
                      </div>
                    </div>

                    {/* Stroke */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        Stroke:
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-sm border-gray-300"
                      >
                        {selectedStrokeWidth}px
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </div>

                    {/* Font Size */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        Font Size:
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-sm border-gray-300"
                      >
                        {selectedFontSize}px
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        Align:
                      </span>
                      <div className="flex border border-gray-300 rounded">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-none border-r border-gray-300"
                        >
                          <AlignLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-none border-r border-gray-300"
                        >
                          <AlignCenter className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-none"
                        >
                          <AlignRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="ml-auto">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex" style={{ height: "calc(100vh - 340px)" }}>
                  {/* Left Sidebar - Pages */}
                  <div className="w-44 bg-gray-50 border-r border-gray-200 flex flex-col">
                    <div className="p-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-800">
                        Pages
                      </h3>
                    </div>
                    <div className="flex-1 flex flex-col">
                      {/* Page Navigation */}
                      <div className="p-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={state.pageIndex === 0}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-gray-600">
                            {state.pageIndex + 1} / {totalPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={state.pageIndex >= totalPages - 1}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Zoom Controls */}
                      <div className="p-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                            disabled={zoom <= 0.5}
                          >
                            <ZoomOut className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-gray-600">
                            {Math.round(zoom * 100)}%
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                            disabled={zoom >= 3}
                          >
                            <ZoomIn className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Page Thumbnails */}
                      <div className="flex-1 overflow-y-auto p-3">
                        <div className="space-y-2">
                          <div className="border-2 border-blue-500 rounded bg-white p-1">
                            <div className="w-full h-32 bg-gray-100 rounded text-xs text-gray-500 flex items-center justify-center">
                              Page {state.pageIndex + 1}
                            </div>
                            <div className="text-center mt-1">
                              <span className="inline-block bg-blue-500 text-white text-xs px-1 rounded">
                                Current
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center - PDF Viewer */}
                  <div className="flex-1 bg-gray-100 overflow-hidden">
                    <EnhancedPDFEditorCanvas
                      file={file}
                      zoom={zoom}
                      elements={state.elements}
                      selectedElements={state.selectedElements}
                      currentTool={state.currentTool}
                      isDrawing={state.isDrawing}
                      currentDrawPath={state.currentDrawPath}
                      selectedColor={selectedColor}
                      selectedStrokeWidth={selectedStrokeWidth}
                      selectedFontSize={selectedFontSize}
                      onElementAdd={actions.addElement}
                      onElementUpdate={actions.updateElement}
                      onElementSelect={actions.selectElements}
                      onElementToggleSelect={actions.toggleElementSelection}
                      onStartDrawing={actions.startDrawing}
                      onAddDrawPoint={actions.addDrawPoint}
                      onEndDrawing={actions.endDrawing}
                      onCanvasSizeChange={actions.setCanvasSize}
                      onPageChange={actions.setPage}
                      onTotalPagesChange={setTotalPages}
                      className="h-full"
                    />
                  </div>

                  {/* Right Sidebar - Properties */}
                  <div className="w-64 bg-white border-l border-gray-200">
                    <div className="p-4">
                      {state.selectedElements.length === 0 ? (
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Selection
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Select an element to edit its properties, or use the
                            toolbar to add new elements.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Properties
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Position
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    X
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    defaultValue="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Y
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    defaultValue="0"
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Size
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Width
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    defaultValue="100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Height
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    defaultValue="20"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Features */}
            {!user?.isPremium && file && (
              <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Crown className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-orange-800 mb-2">
                        Unlock Premium Features
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-orange-700 mb-3">
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          Advanced image tools
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          Form field editing
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          Professional stamps
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          Unlimited file size
                        </div>
                      </div>
                      <Button className="bg-yellow-500 text-black hover:bg-yellow-400 text-sm">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Results */
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                PDF Editing Complete!
              </h3>
              <p className="text-gray-600 mb-6">
                Successfully applied {state.elements.length} edits to your PDF
              </p>

              {editedFile && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="w-8 h-8 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {editedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(editedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() =>
                    editedFile && downloadFile(editedFile.url, editedFile.name)
                  }
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Edited PDF
                </Button>
                <Button variant="outline" onClick={reset}>
                  Edit Another PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ImageUpload
        isActive={showImageUpload}
        onImageSelect={handleImageSelect}
        onClose={() => setShowImageUpload(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="register"
      />
    </div>
  );
};

export default EditPdf;
