import React, { useState, useRef, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  Download,
  Save,
  Type,
  Square,
  Circle,
  PenTool,
  Image,
  MousePointer,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Trash2,
  RotateCcw,
  Palette,
  Edit3,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import AuthModal from "@/components/auth/AuthModal";
import { PDFEditorCore } from "@/components/pdf-editor/PDFEditorCore";
import { PDFEditorToolbar } from "@/components/pdf-editor/PDFEditorToolbar";
import { PDFEditorSidebar } from "@/components/pdf-editor/PDFEditorSidebar";
import { SimplePDFEditorTest } from "@/components/pdf-editor/SimplePDFEditorTest";
import { PDFEditorErrorBoundary } from "@/components/pdf-editor/PDFEditorErrorBoundary";
import { MinimalPDFEditor } from "@/components/pdf-editor/MinimalPDFEditor";
import { AdvancedTextEditor } from "@/components/pdf-editor/AdvancedTextEditor";
import { usePDFEditor } from "@/hooks/usePDFEditor";
import { cn } from "@/lib/utils";

const EditPdf: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [useMinimalEditor, setUseMinimalEditor] = useState(true);
  const [editorMode, setEditorMode] = useState<"minimal" | "text" | "advanced">(
    "text",
  );

  // PDF Editor hook for state management
  const {
    pdfDocument,
    currentPage,
    totalPages,
    zoom,
    elements,
    selectedElements,
    currentTool,
    isDrawing,
    currentDrawPath,
    history,
    historyIndex,
    canUndo,
    canRedo,
    settings,
    actions,
  } = usePDFEditor();

  // File upload handling
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a PDF file smaller than 50MB.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        await actions.loadPDF(file);
        setUploadedFile(file);
        toast({
          title: "PDF loaded successfully",
          description: `${file.name} is ready for editing.`,
        });
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast({
          title: "Error loading PDF",
          description: "Please try again with a different file.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [actions, toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  // Export PDF functionality
  const handleExportPDF = useCallback(async () => {
    if (!pdfDocument) {
      toast({
        title: "No PDF loaded",
        description: "Please load a PDF file first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const pdfBytes = await actions.exportPDF();

      // Create download link
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        uploadedFile?.name?.replace(/\.pdf$/, "_edited.pdf") || "edited.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF exported successfully",
        description: "Your edited PDF has been downloaded.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pdfDocument, actions, uploadedFile, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              canRedo && actions.redo();
            } else {
              canUndo && actions.undo();
            }
            break;
          case "s":
            e.preventDefault();
            handleExportPDF();
            break;
          case "Delete":
          case "Backspace":
            if (selectedElements.length > 0) {
              e.preventDefault();
              actions.deleteElements(selectedElements);
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, selectedElements, actions, handleExportPDF]);

  if (!uploadedFile || !pdfDocument) {
    return (
      <div className="min-h-screen bg-white">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              PDF Editor
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Edit your PDF files with our advanced online editor. Add text,
              shapes, images, signatures, and more.
            </p>
          </div>

          {/* Upload Area */}
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 hover:border-red-400 hover:bg-gray-50",
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-lg text-red-600">Drop your PDF here...</p>
                ) : (
                  <div>
                    <p className="text-lg text-gray-600 mb-2">
                      Drop your PDF here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF files up to 50MB
                    </p>
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="mt-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading PDF...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardContent className="p-6">
                <Type className="w-8 h-8 text-red-600 mb-4" />
                <h3 className="font-semibold mb-2">Text Editing</h3>
                <p className="text-sm text-gray-600">
                  Add, edit, and format text anywhere on your PDF
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <PenTool className="w-8 h-8 text-red-600 mb-4" />
                <h3 className="font-semibold mb-2">Drawing Tools</h3>
                <p className="text-sm text-gray-600">
                  Draw, annotate, and highlight with professional tools
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Image className="w-8 h-8 text-red-600 mb-4" />
                <h3 className="font-semibold mb-2">Image Insertion</h3>
                <p className="text-sm text-gray-600">
                  Insert and position images, logos, and signatures
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* PDF Editor Interface */}
      <div className="flex h-[calc(100vh-64px)]">
        {testMode ? (
          /* Test Mode - Simplified PDF Editor */
          <div className="w-full p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">PDF Editor Test Mode</h2>
              <Button
                variant="outline"
                onClick={() => setTestMode(false)}
                className="text-sm"
              >
                Switch to Full Editor
              </Button>
            </div>
            <SimplePDFEditorTest file={uploadedFile!} />
          </div>
        ) : (
          <>
            {/* Sidebar */}
            <PDFEditorSidebar
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              elements={elements}
              selectedElements={selectedElements}
              onElementSelect={actions.selectElements}
              onElementDelete={actions.deleteElements}
              onElementUpdate={actions.updateElement}
              onElementDuplicate={actions.duplicateElements}
              settings={settings}
              onSettingsChange={actions.updateSettings}
            />

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              <PDFEditorToolbar
                currentTool={currentTool}
                onToolChange={actions.setTool}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={actions.undo}
                onRedo={actions.redo}
                zoom={zoom}
                onZoomChange={actions.setZoom}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={actions.setPage}
                onExport={handleExportPDF}
                settings={settings}
                onSettingsChange={actions.updateSettings}
                isCollapsed={toolbarCollapsed}
                onToggleCollapse={() => setToolbarCollapsed(!toolbarCollapsed)}
                isLoading={isLoading}
              />

              {/* Canvas Area */}
              <div className="flex-1 overflow-hidden bg-gray-100 relative">
                {pdfDocument ? (
                  <div className="w-full h-full">
                    {/* Editor Mode Selector */}
                    <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold">PDF Editor</h3>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant={
                              editorMode === "text" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setEditorMode("text")}
                          >
                            Text Editor (Recommended)
                          </Button>
                          <Button
                            variant={
                              editorMode === "minimal" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setEditorMode("minimal")}
                          >
                            Simple Editor
                          </Button>
                          <Button
                            variant={
                              editorMode === "advanced" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setEditorMode("advanced")}
                          >
                            Advanced (Beta)
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setTestMode(true)}
                        size="sm"
                      >
                        Test Mode
                      </Button>
                    </div>

                    {/* Editor Content */}
                    {editorMode === "text" && (
                      <AdvancedTextEditor
                        pdfDocument={pdfDocument}
                        currentPage={currentPage}
                        zoom={zoom}
                      />
                    )}

                    {editorMode === "minimal" && (
                      <MinimalPDFEditor
                        pdfDocument={pdfDocument}
                        currentPage={currentPage}
                        zoom={zoom}
                      />
                    )}

                    {editorMode === "advanced" && (
                      <PDFEditorErrorBoundary
                        onReset={() => {
                          setEditorMode("text");
                        }}
                      >
                        <PDFEditorCore
                          pdfDocument={pdfDocument}
                          currentPage={currentPage}
                          zoom={zoom}
                          elements={elements}
                          selectedElements={selectedElements}
                          currentTool={currentTool}
                          settings={settings}
                          onElementAdd={actions.addElement}
                          onElementUpdate={actions.updateElement}
                          onElementSelect={actions.selectElements}
                          onPageSizeChange={actions.setPageSize}
                        />
                      </PDFEditorErrorBoundary>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        Editor initializing...
                      </p>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setTestMode(true)}
                        >
                          Try Test Mode
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditorMode("text")}
                        >
                          Try Text Editor
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign in to continue"
        description="Please sign in to access the PDF editor."
      />
    </div>
  );
};

export default EditPdf;
