import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  Edit,
  Sparkles,
  Brain,
  Eye,
  Type,
  Image,
  Loader2,
  CheckCircle,
  AlertCircle,
  MousePointer,
  Square,
  Circle,
  PenTool,
  Eraser,
  Undo,
  Redo,
  Save,
  Search,
  Replace,
  Highlighter,
  Trash2,
  Copy,
  Paste,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Settings,
} from "lucide-react";

interface EditTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  aiPowered?: boolean;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  isEditing: boolean;
  confidence?: number; // OCR confidence
}

interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alt?: string;
}

interface EditSession {
  file: File;
  pages: number;
  currentPage: number;
  textElements: TextElement[];
  imageElements: ImageElement[];
  ocrProcessed: boolean;
  aiEnhanced: boolean;
}

const editTools: EditTool[] = [
  {
    id: "select",
    name: "Select",
    icon: <MousePointer className="w-4 h-4" />,
    description: "Select and move elements",
  },
  {
    id: "text",
    name: "Add Text",
    icon: <Type className="w-4 h-4" />,
    description: "Add new text elements",
  },
  {
    id: "ocr",
    name: "OCR Text",
    icon: <Brain className="w-4 h-4" />,
    description: "Extract text from images with AI",
    aiPowered: true,
  },
  {
    id: "highlight",
    name: "Highlight",
    icon: <Highlighter className="w-4 h-4" />,
    description: "Highlight text sections",
  },
  {
    id: "draw",
    name: "Draw",
    icon: <PenTool className="w-4 h-4" />,
    description: "Draw shapes and annotations",
  },
  {
    id: "image",
    name: "Add Image",
    icon: <Image className="w-4 h-4" />,
    description: "Insert images",
  },
  {
    id: "erase",
    name: "Erase",
    icon: <Eraser className="w-4 h-4" />,
    description: "Remove elements",
  },
];

const EnhancedPdfEditor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [editSession, setEditSession] = useState<EditSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [selectedTool, setSelectedTool] = useState("select");
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = useCallback((uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      setFile(uploadedFiles[0]);
      initializeEditSession(uploadedFiles[0]);
    }
  }, []);

  const initializeEditSession = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep("Loading PDF...");

    try {
      // Simulate PDF processing
      setProgress(25);
      setCurrentStep("Analyzing document structure...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProgress(50);
      setCurrentStep("Extracting text elements...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProgress(75);
      setCurrentStep("Preparing editor...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Initialize edit session
      const session: EditSession = {
        file,
        pages: Math.floor(Math.random() * 10) + 1,
        currentPage: 1,
        textElements: [
          {
            id: "text1",
            text: "Sample text element",
            x: 100,
            y: 100,
            width: 200,
            height: 30,
            fontSize: 14,
            fontFamily: "Arial",
            color: "#000000",
            isEditing: false,
            confidence: 0.95,
          },
        ],
        imageElements: [],
        ocrProcessed: false,
        aiEnhanced: false,
      };

      setEditSession(session);
      setProgress(100);
      setCurrentStep("Ready to edit!");

      toast({
        title: "PDF loaded successfully",
        description: `Ready to edit ${session.pages} page${session.pages > 1 ? "s" : ""}.`,
      });
    } catch (error) {
      toast({
        title: "Failed to load PDF",
        description: "Please try again with a different file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const runOCR = async () => {
    if (!editSession) return;

    setIsProcessing(true);
    setCurrentStep("Running OCR analysis...");
    setProgress(0);

    try {
      // Simulate OCR processing
      const steps = [
        "Scanning for text regions...",
        "Extracting text with AI...",
        "Analyzing text confidence...",
        "Creating editable elements...",
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setProgress(((i + 1) / steps.length) * 100);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Add OCR-detected text elements
      const ocrElements: TextElement[] = [
        {
          id: "ocr1",
          text: "OCR-detected text with high confidence",
          x: 150,
          y: 200,
          width: 300,
          height: 25,
          fontSize: 12,
          fontFamily: "Arial",
          color: "#000000",
          isEditing: false,
          confidence: 0.98,
        },
        {
          id: "ocr2",
          text: "Lower confidence text (may need review)",
          x: 150,
          y: 250,
          width: 280,
          height: 25,
          fontSize: 12,
          fontFamily: "Arial",
          color: "#666666",
          isEditing: false,
          confidence: 0.72,
        },
      ];

      setEditSession((prev) =>
        prev
          ? {
              ...prev,
              textElements: [...prev.textElements, ...ocrElements],
              ocrProcessed: true,
            }
          : prev,
      );

      toast({
        title: "OCR completed",
        description: `Extracted ${ocrElements.length} text elements with AI.`,
      });
    } catch (error) {
      toast({
        title: "OCR failed",
        description: "Unable to extract text from the document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const applyAIEnhancements = async () => {
    if (!editSession) return;

    setIsProcessing(true);
    setCurrentStep("Applying AI enhancements...");
    setProgress(0);

    try {
      const steps = [
        "Analyzing document layout...",
        "Improving text positioning...",
        "Optimizing font choices...",
        "Enhancing readability...",
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setProgress(((i + 1) / steps.length) * 100);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Simulate AI enhancements
      setEditSession((prev) =>
        prev
          ? {
              ...prev,
              aiEnhanced: true,
              textElements: prev.textElements.map((el) => ({
                ...el,
                fontSize: Math.max(12, el.fontSize),
                color:
                  el.confidence && el.confidence < 0.8 ? "#ff6b6b" : el.color,
              })),
            }
          : prev,
      );

      toast({
        title: "AI enhancements applied",
        description: "Document has been optimized for better readability.",
      });
    } catch (error) {
      toast({
        title: "Enhancement failed",
        description: "Unable to apply AI enhancements.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const searchAndReplace = () => {
    if (!editSession || !searchText) return;

    let replacements = 0;
    const updatedElements = editSession.textElements.map((element) => {
      if (element.text.includes(searchText)) {
        replacements++;
        return {
          ...element,
          text: element.text.replace(new RegExp(searchText, "g"), replaceText),
        };
      }
      return element;
    });

    setEditSession((prev) =>
      prev ? { ...prev, textElements: updatedElements } : prev,
    );

    toast({
      title: "Search and replace completed",
      description: `Made ${replacements} replacement${replacements !== 1 ? "s" : ""}.`,
    });
  };

  const downloadEditedPDF = async () => {
    if (!editSession) return;

    setIsProcessing(true);
    setCurrentStep("Generating edited PDF...");

    try {
      // Simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create a blob URL for download
      const blob = new Blob(["edited pdf content"], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = editSession.file.name.replace(/\.pdf$/i, "_edited.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF downloaded",
        description: "Your edited PDF has been saved.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to generate the edited PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Link>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    AI-Powered PDF Editor
                  </h1>
                  <p className="text-gray-600">
                    Edit PDFs with intelligent text recognition and AI
                    enhancements
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  OCR Enabled
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Enhanced
                </Badge>
              </div>
            </div>
          </div>

          {!file ? (
            /* File Upload */
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Upload PDF to Edit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  accept=".pdf"
                  maxFiles={1}
                  maxSize={25 * 1024 * 1024}
                  onFilesSelected={handleFileUpload}
                  multiple={false}
                />
              </CardContent>
            </Card>
          ) : (
            /* Editor Interface */
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
              {/* Toolbar */}
              <div className="col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tools</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {editTools.map((tool) => (
                      <Button
                        key={tool.id}
                        variant={
                          selectedTool === tool.id ? "default" : "outline"
                        }
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedTool(tool.id)}
                      >
                        {tool.icon}
                        <span className="ml-2">{tool.name}</span>
                        {tool.aiPowered && (
                          <Sparkles className="w-3 h-3 ml-auto text-purple-500" />
                        )}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={runOCR}
                      disabled={isProcessing || editSession?.ocrProcessed}
                      size="sm"
                      className="w-full"
                      variant="outline"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      {editSession?.ocrProcessed ? "OCR Complete" : "Run OCR"}
                    </Button>

                    <Button
                      onClick={applyAIEnhancements}
                      disabled={isProcessing || editSession?.aiEnhanced}
                      size="sm"
                      className="w-full"
                      variant="outline"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {editSession?.aiEnhanced ? "AI Enhanced" : "AI Enhance"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Search & Replace</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="search">Search</Label>
                      <Input
                        id="search"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Find text..."
                        size="sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="replace">Replace</Label>
                      <Input
                        id="replace"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        placeholder="Replace with..."
                        size="sm"
                      />
                    </div>
                    <Button
                      onClick={searchAndReplace}
                      disabled={!searchText}
                      size="sm"
                      className="w-full"
                    >
                      <Replace className="w-4 h-4 mr-2" />
                      Replace All
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Main Editor */}
              <div className="col-span-8">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Page {editSession?.currentPage} of{" "}
                          {editSession?.pages}
                        </span>
                        {editSession?.ocrProcessed && (
                          <Badge variant="secondary" className="text-xs">
                            OCR Processed
                          </Badge>
                        )}
                        {editSession?.aiEnhanced && (
                          <Badge variant="secondary" className="text-xs">
                            AI Enhanced
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoom(Math.max(25, zoom - 25))}
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-600 min-w-16 text-center">
                          {zoom}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoom(Math.min(200, zoom + 25))}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowGrid(!showGrid)}
                        >
                          <Grid className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-80px)] p-0">
                    {isProcessing ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                        <p className="text-gray-600 mb-2">{currentStep}</p>
                        <Progress value={progress} className="w-64" />
                      </div>
                    ) : (
                      <div className="relative h-full bg-white border-2 border-gray-200 m-4 rounded-lg overflow-hidden">
                        {/* PDF Canvas */}
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full"
                          style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: "top left",
                          }}
                        />

                        {/* Text Elements Overlay */}
                        {editSession?.textElements.map((element) => (
                          <div
                            key={element.id}
                            className={`absolute border-2 cursor-pointer ${
                              selectedElement === element.id
                                ? "border-blue-500 bg-blue-50"
                                : element.confidence && element.confidence < 0.8
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300 bg-gray-50"
                            }`}
                            style={{
                              left: element.x * (zoom / 100),
                              top: element.y * (zoom / 100),
                              width: element.width * (zoom / 100),
                              height: element.height * (zoom / 100),
                              fontSize: element.fontSize * (zoom / 100),
                              fontFamily: element.fontFamily,
                              color: element.color,
                            }}
                            onClick={() => setSelectedElement(element.id)}
                          >
                            {element.isEditing ? (
                              <Textarea
                                value={element.text}
                                onChange={(e) => {
                                  /* Update text */
                                }}
                                className="w-full h-full border-none bg-transparent resize-none"
                                style={{ fontSize: "inherit" }}
                              />
                            ) : (
                              <div className="p-1 w-full h-full overflow-hidden">
                                {element.text}
                                {element.confidence &&
                                  element.confidence < 0.8 && (
                                    <Badge
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 text-xs"
                                    >
                                      {Math.round(element.confidence * 100)}%
                                    </Badge>
                                  )}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Grid Overlay */}
                        {showGrid && (
                          <div
                            className="absolute inset-0 opacity-20"
                            style={{
                              backgroundImage: `
                                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                              `,
                              backgroundSize: "20px 20px",
                            }}
                          />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Properties Panel */}
              <div className="col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Properties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedElement ? (
                      <div className="space-y-3">
                        <div>
                          <Label>Font Size</Label>
                          <Input type="number" defaultValue="12" size="sm" />
                        </div>
                        <div>
                          <Label>Color</Label>
                          <Input
                            type="color"
                            defaultValue="#000000"
                            size="sm"
                          />
                        </div>
                        <div>
                          <Label>Font Family</Label>
                          <select className="w-full p-2 border rounded text-sm">
                            <option>Arial</option>
                            <option>Times New Roman</option>
                            <option>Helvetica</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Select an element to edit properties
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={downloadEditedPDF}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>

                    <Button variant="outline" className="w-full" size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save Session
                    </Button>

                    <Button variant="outline" className="w-full" size="sm">
                      <Undo className="w-4 h-4 mr-2" />
                      Undo
                    </Button>

                    <Button variant="outline" className="w-full" size="sm">
                      <Redo className="w-4 h-4 mr-2" />
                      Redo
                    </Button>
                  </CardContent>
                </Card>

                {editSession && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Document Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Pages:</span>
                          <span>{editSession.pages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Text Elements:</span>
                          <span>{editSession.textElements.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Images:</span>
                          <span>{editSession.imageElements.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>OCR Status:</span>
                          <span>
                            {editSession.ocrProcessed ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>AI Enhanced:</span>
                          <span>
                            {editSession.aiEnhanced ? (
                              <CheckCircle className="w-4 h-4 text-purple-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPdfEditor;
