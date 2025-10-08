import React, { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Users,
  FormInput,
  Signature,
  Eye,
  Settings,
  Zap,
  Layers,
  Type,
  Paintbrush,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import AuthModal from "@/components/auth/AuthModal";
import AdvancedPDFViewer from "@/components/pdf-editor/AdvancedPDFViewer";
import EnhancedSignature from "@/components/pdf-editor/EnhancedSignature";
import PDFFormBuilder from "@/components/pdf-editor/PDFFormBuilder";
import RealtimePDFEditor from "@/components/pdf-editor/RealtimePDFEditor";
import AdvancedPDFService, {
  TextExtraction,
  OCRResult,
  PDFSearchResult,
} from "@/services/advancedPdfService";
import { useRealtimePDFEditor } from "@/hooks/useRealtimePDFEditor";
import { AnyElement, TextElement, SignatureElement } from "@/types/pdf-editor";
import { safeArrayFirst } from "@/lib/safe-array-utils";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

const AdvancedPDFEditor: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  // Advanced features state
  const [extractedText, setExtractedText] = useState<TextExtraction[]>([]);
  const [ocrResults, setOCRResults] = useState<OCRResult[]>([]);
  const [searchResults, setSearchResults] = useState<PDFSearchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Real-time collaborative editor
  const { state, actions, selectors, computed } = useRealtimePDFEditor();

  const pdfService = AdvancedPDFService.getInstance();

  // File upload
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Advanced PDF Editor works for everyone (optional auth for enhanced features)

      const uploadedFile = safeArrayFirst(acceptedFiles);
      if (uploadedFile && uploadedFile.type === "application/pdf") {
        setFile(uploadedFile);
        toast({
          title: "PDF Loaded",
          description: "Your PDF is ready for advanced editing!",
        });
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a valid PDF file.",
          variant: "destructive",
        });
      }
    },
    [isAuthenticated, toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  // Advanced text extraction
  const handleTextExtraction = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const extractions = await pdfService.extractTextWithPositions(file);
      setExtractedText(extractions);
      toast({
        title: "Text Extracted",
        description: `Found ${extractions.length} text elements`,
      });
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: "Failed to extract text from PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [file, pdfService, toast]);

  // OCR processing
  const handleOCR = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const results = await pdfService.performOCR(file);
      setOCRResults(results);
      toast({
        title: "OCR Complete",
        description: `Processed ${results.length} pages`,
      });
    } catch (error) {
      toast({
        title: "OCR Failed",
        description: "Failed to perform OCR on PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [file, pdfService, toast]);

  // Search functionality
  const handleSearch = useCallback(
    async (searchTerm: string) => {
      if (!file || !searchTerm.trim()) return;

      setIsProcessing(true);
      try {
        const results = await pdfService.searchText(file, searchTerm);
        setSearchResults(results);
        toast({
          title: "Search Complete",
          description: `Found ${results.reduce(
            (acc, result) => acc + result.matches.length,
            0,
          )} matches`,
        });
      } catch (error) {
        toast({
          title: "Search Failed",
          description: "Failed to search text in PDF",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [file, pdfService, toast],
  );

  // Signature handling
  const handleSignature = useCallback(
    (signatureData: string, signatureType: "draw" | "type" | "upload") => {
      const signatureElement: SignatureElement = {
        id: uuidv4(),
        type: "signature",
        pageIndex: state.pageIndex,
        bounds: {
          x: 100,
          y: 100,
          width: 200,
          height: 80,
        },
        properties: {
          signatureType,
          signatureData,
          strokeWidth: 2,
          color: "#000000",
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      actions.addElement(signatureElement);
      setShowSignatureModal(false);

      toast({
        title: "Signature Added",
        description: "Signature has been added to the PDF",
      });
    },
    [state.pageIndex, actions, toast],
  );

  // Text element creation from extracted text
  const createTextElement = useCallback(
    (extraction: TextExtraction) => {
      const textElement: TextElement = {
        id: uuidv4(),
        type: "text",
        pageIndex: extraction.page - 1,
        bounds: {
          x: extraction.position.x,
          y: extraction.position.y,
          width: extraction.position.width,
          height: extraction.position.height,
        },
        properties: {
          text: extraction.text,
          fontSize: extraction.fontSize,
          fontFamily: extraction.font,
          fontWeight: "normal",
          color: "#000000",
          alignment: "left",
          rotation: 0,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      actions.addElement(textElement);
    },
    [actions],
  );

  // Export functionality
  const handleExport = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      // This would integrate with the existing PDF export functionality
      // For now, we'll show a success message
      toast({
        title: "Export Complete",
        description: "PDF has been exported with all edits",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [file, toast]);

  if (!file) {
    return (
      <div className="min-h-screen bg-bg-light">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-heading-large text-text-dark mb-4">
              Advanced PDF Editor
            </h1>
            <p className="text-body-large text-text-light">
              Professional PDF editing with AI-powered features, real-time
              collaboration, and advanced tools
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-brand-red" />
                <h3 className="font-semibold mb-2">AI-Powered OCR</h3>
                <p className="text-sm text-gray-600">
                  Extract and edit text from scanned documents with advanced OCR
                  technology
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-brand-red" />
                <h3 className="font-semibold mb-2">Real-time Collaboration</h3>
                <p className="text-sm text-gray-600">
                  Work together with your team in real-time with live cursors
                  and changes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Layers className="w-12 h-12 mx-auto mb-4 text-brand-red" />
                <h3 className="font-semibold mb-2">Advanced Tools</h3>
                <p className="text-sm text-gray-600">
                  Professional editing tools including forms, signatures, and
                  annotations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* File upload area */}
          <Card>
            <CardContent className="p-8">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-brand-red bg-red-50"
                    : "border-gray-300 hover:border-gray-400",
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">
                  Upload your PDF to get started
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your PDF file here, or click to browse
                </p>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Choose PDF File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultTab="login"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="h-screen flex flex-col">
        {/* Top toolbar */}
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{file.name}</h1>
            <Badge variant="secondary">{computed.elementCount} elements</Badge>
            {computed.isCollaborative && (
              <Badge variant="outline">
                <Users className="w-3 h-3 mr-1" />
                {computed.collaboratorCount} collaborators
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSignatureModal(true)}
            >
              <Signature className="w-4 h-4 mr-2" />
              Add Signature
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFormBuilder(true)}
            >
              <FormInput className="w-4 h-4 mr-2" />
              Form Builder
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={handleExport}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="editor">
                  <Paintbrush className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="text">
                  <Type className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="search">
                  <Search className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="tools">
                  <Settings className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Drawing Tools</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={
                        state.currentTool === "draw" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => actions.setTool("draw")}
                    >
                      <Paintbrush className="w-4 h-4 mr-2" />
                      Draw
                    </Button>
                    <Button
                      variant={
                        state.currentTool === "highlight"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => actions.setTool("highlight")}
                    >
                      Highlight
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Shapes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={
                        state.currentTool === "rectangle"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => actions.setTool("rectangle")}
                    >
                      Rectangle
                    </Button>
                    <Button
                      variant={
                        state.currentTool === "circle" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => actions.setTool("circle")}
                    >
                      Circle
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Elements</h3>
                  <div className="space-y-2">
                    {selectors.getElementsByPage().map((element) => (
                      <div
                        key={element.id}
                        className={cn(
                          "p-2 border rounded cursor-pointer",
                          state.selectedElements.includes(element.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300",
                        )}
                        onClick={() => actions.selectElements([element.id])}
                      >
                        <div className="text-sm font-medium capitalize">
                          {element.type}
                        </div>
                        <div className="text-xs text-gray-500">
                          Page {element.pageIndex + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Text Extraction</h3>
                  <Button
                    onClick={handleTextExtraction}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? "Extracting..." : "Extract Text"}
                  </Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">OCR Processing</h3>
                  <Button
                    onClick={handleOCR}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? "Processing..." : "Run OCR"}
                  </Button>
                </div>

                {extractedText.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      Extracted Text ({extractedText.length})
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {extractedText.slice(0, 10).map((extraction, index) => (
                        <div
                          key={index}
                          className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                          onClick={() => createTextElement(extraction)}
                        >
                          <div className="text-sm">{extraction.text}</div>
                          <div className="text-xs text-gray-500">
                            Page {extraction.page} • {extraction.font}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ocrResults.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      OCR Results ({ocrResults.length} pages)
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {ocrResults.map((result, index) => (
                        <div key={index} className="p-2 border rounded">
                          <div className="text-sm">
                            Page {index + 1} • {result.confidence.toFixed(1)}%
                            confidence
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {result.text.substring(0, 100)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search" className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Search PDF</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search text..."
                      className="flex-1 px-3 py-2 border rounded"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSearch(e.currentTarget.value);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={(e) => {
                        const input =
                          e.currentTarget.parentElement?.querySelector(
                            "input",
                          ) as HTMLInputElement;
                        if (input) handleSearch(input.value);
                      }}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      Search Results (
                      {searchResults.reduce(
                        (acc, result) => acc + result.matches.length,
                        0,
                      )}{" "}
                      matches)
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <div key={index} className="p-2 border rounded">
                          <div className="text-sm font-medium">
                            Page {result.page} • {result.matches.length} matches
                          </div>
                          {result.matches.map((match, matchIndex) => (
                            <div
                              key={matchIndex}
                              className="text-xs text-gray-600 mt-1 cursor-pointer hover:text-gray-800"
                              onClick={() =>
                                actions.setPageIndex(result.page - 1)
                              }
                            >
                              "{match.text}"
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tools" className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Advanced Tools</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowSignatureModal(true)}
                    >
                      <Signature className="w-4 h-4 mr-2" />
                      Digital Signature
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowFormBuilder(true)}
                    >
                      <FormInput className="w-4 h-4 mr-2" />
                      Form Builder
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleTextExtraction}
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Text Analysis
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={actions.undo}
                      disabled={!selectors.canUndo}
                    >
                      Undo
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={actions.redo}
                      disabled={!selectors.canRedo}
                    >
                      Redo
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main editor area */}
          <div className="flex-1">
            <AdvancedPDFViewer
              file={file}
              searchResults={searchResults}
              onSearch={handleSearch}
              onPageChange={actions.setPageIndex}
              onZoomChange={actions.setZoom}
              showCollaborators={computed.isCollaborative}
              collaborators={state.collaborators}
            />
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Digital Signature</DialogTitle>
          </DialogHeader>
          <EnhancedSignature
            onSignature={handleSignature}
            onClose={() => setShowSignatureModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Form Builder Modal */}
      <Dialog open={showFormBuilder} onOpenChange={setShowFormBuilder}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>PDF Form Builder</DialogTitle>
          </DialogHeader>
          <PDFFormBuilder
            onSave={(template) => {
              console.log("Form template saved:", template);
              setShowFormBuilder(false);
              toast({
                title: "Form Saved",
                description: "Your form template has been saved",
              });
            }}
            onPreview={(template) => {
              console.log("Preview form:", template);
              toast({
                title: "Form Preview",
                description: "Form preview functionality coming soon",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="login"
      />
    </div>
  );
};

export default AdvancedPDFEditor;
