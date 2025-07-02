import React, { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MousePointer,
  Type,
  PenTool,
  Highlighter,
  Square,
  Circle,
  ArrowRight,
  Image,
  Stamp,
  StickyNote,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Download,
  Save,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  Grid,
  Eye,
  Trash2,
  Copy,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Professional PDF Editor following the development guide
interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  category: "select" | "text" | "draw" | "shapes" | "elements";
}

interface EditElement {
  id: string;
  type:
    | "text"
    | "drawing"
    | "rectangle"
    | "circle"
    | "arrow"
    | "image"
    | "signature"
    | "note";
  pageIndex: number;
  bounds: { x: number; y: number; width: number; height: number };
  properties: any;
  createdAt: number;
  updatedAt: number;
}

interface ProfessionalPDFEditorProps {
  file: File;
  onSave?: (elements: EditElement[]) => void;
}

export default function ProfessionalPDFEditor({
  file,
  onSave,
}: ProfessionalPDFEditorProps) {
  // Core state management
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [pageViewport, setPageViewport] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [isLoading, setIsLoading] = useState(true);

  // Editor state
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [elements, setElements] = useState<EditElement[]>([]);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [history, setHistory] = useState<EditElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawPath, setCurrentDrawPath] = useState<
    { x: number; y: number }[]
  >([]);

  // Tool settings
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Arial");

  const { toast } = useToast();

  // Professional tool categories following the guide
  const tools: Tool[] = [
    // Selection tools
    { id: "select", name: "Select", icon: MousePointer, category: "select" },

    // Text tools
    { id: "text", name: "Text", icon: Type, category: "text" },

    // Drawing tools
    { id: "pen", name: "Pen", icon: PenTool, category: "draw" },
    {
      id: "highlighter",
      name: "Highlighter",
      icon: Highlighter,
      category: "draw",
    },

    // Shape tools
    { id: "rectangle", name: "Rectangle", icon: Square, category: "shapes" },
    { id: "circle", name: "Circle", icon: Circle, category: "shapes" },
    { id: "arrow", name: "Arrow", icon: ArrowRight, category: "shapes" },

    // Element tools
    { id: "image", name: "Image", icon: Image, category: "elements" },
    { id: "signature", name: "Signature", icon: Stamp, category: "elements" },
    { id: "note", name: "Sticky Note", icon: StickyNote, category: "elements" },
  ];

  // Load PDF using PDF.js (following the guide)
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        const pdfjsLib = await import("pdfjs-dist");

        // Configure PDF.js worker
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          verbosity: 0,
        });

        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);

        await renderPDFPage(pdf, currentPage);

        toast({
          title: "✅ PDF Loaded Successfully",
          description: `Professional editor ready with ${pdf.numPages} pages`,
        });
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast({
          title: "Error",
          description: "Failed to load PDF file",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [file, toast]);

  // Render PDF page with layered canvas system (guide recommendation)
  const renderPDFPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom });
      setPageViewport(viewport);

      // Setup layered canvas system
      setupCanvasLayers(viewport);

      // Render PDF on base canvas with retry mechanism
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("Canvas ref is null, retrying in 100ms");
        setTimeout(() => renderPage(pageNum, zoom), 100);
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        console.error("Cannot get 2D context from canvas");
        return;
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      console.log(
        `📄 Page ${pageNum} rendered at ${Math.round(zoom * 100)}% zoom`,
      );
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  };

  // Setup layered canvas system (key architecture from guide)
  const setupCanvasLayers = (viewport: any) => {
    const canvases = [
      canvasRef.current,
      editCanvasRef.current,
      drawCanvasRef.current,
    ];

    canvases.forEach((canvas) => {
      if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const context = canvas.getContext("2d");
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });
  };

  // History management for undo/redo (guide feature)
  const addToHistory = useCallback(
    (newElements: EditElement[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...newElements]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  }, [history, historyIndex]);

  // Drawing functionality (guide recommendation)
  const startDrawing = useCallback(
    (e: React.MouseEvent) => {
      if (selectedTool !== "pen" && selectedTool !== "highlighter") return;

      const canvas = drawCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDrawing(true);
      setCurrentDrawPath([{ x, y }]);
    },
    [selectedTool],
  );

  const continueDrawing = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return;

      const canvas = drawCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newPath = [...currentDrawPath, { x, y }];
      setCurrentDrawPath(newPath);

      // Draw on canvas (reuse existing canvas variable)
      const context = canvas.getContext("2d");
      if (!context) return;

      context.strokeStyle = strokeColor;
      context.lineWidth =
        selectedTool === "highlighter" ? strokeWidth * 3 : strokeWidth;
      context.lineCap = "round";
      context.lineJoin = "round";

      if (selectedTool === "highlighter") {
        context.globalCompositeOperation = "multiply";
        context.globalAlpha = 0.3;
      } else {
        context.globalCompositeOperation = "source-over";
        context.globalAlpha = 1;
      }

      context.beginPath();
      if (newPath.length > 1) {
        const prev = newPath[newPath.length - 2];
        const curr = newPath[newPath.length - 1];
        context.moveTo(prev.x, prev.y);
        context.lineTo(curr.x, curr.y);
        context.stroke();
      }
    },
    [isDrawing, currentDrawPath, strokeColor, strokeWidth, selectedTool],
  );

  const endDrawing = useCallback(() => {
    if (!isDrawing || currentDrawPath.length < 2) {
      setIsDrawing(false);
      setCurrentDrawPath([]);
      return;
    }

    // Create drawing element
    const minX = Math.min(...currentDrawPath.map((p) => p.x));
    const minY = Math.min(...currentDrawPath.map((p) => p.y));
    const maxX = Math.max(...currentDrawPath.map((p) => p.x));
    const maxY = Math.max(...currentDrawPath.map((p) => p.y));

    const newElement: EditElement = {
      id: `drawing-${Date.now()}`,
      type: "drawing",
      pageIndex: currentPage - 1,
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
      properties: {
        path: currentDrawPath,
        strokeColor,
        strokeWidth:
          selectedTool === "highlighter" ? strokeWidth * 3 : strokeWidth,
        toolType: selectedTool,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    addToHistory(newElements);

    setIsDrawing(false);
    setCurrentDrawPath([]);
  }, [
    isDrawing,
    currentDrawPath,
    strokeColor,
    strokeWidth,
    selectedTool,
    currentPage,
    elements,
    addToHistory,
  ]);

  // Text tool functionality
  const addTextElement = useCallback(
    (e: React.MouseEvent) => {
      if (selectedTool !== "text") return;

      const canvas = editCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newElement: EditElement = {
        id: `text-${Date.now()}`,
        type: "text",
        pageIndex: currentPage - 1,
        bounds: { x, y, width: 200, height: fontSize + 4 },
        properties: {
          text: "Click to edit text",
          fontSize,
          fontFamily,
          color: strokeColor,
          isEditing: true,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newElements = [...elements, newElement];
      setElements(newElements);
      addToHistory(newElements);
    },
    [
      selectedTool,
      currentPage,
      fontSize,
      fontFamily,
      strokeColor,
      elements,
      addToHistory,
    ],
  );

  // Shape tool functionality
  const addShapeElement = useCallback(
    (type: "rectangle" | "circle" | "arrow", bounds: any) => {
      const newElement: EditElement = {
        id: `${type}-${Date.now()}`,
        type,
        pageIndex: currentPage - 1,
        bounds,
        properties: {
          strokeColor,
          fillColor,
          strokeWidth,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newElements = [...elements, newElement];
      setElements(newElements);
      addToHistory(newElements);
    },
    [currentPage, strokeColor, fillColor, strokeWidth, elements, addToHistory],
  );

  // Navigation controls
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (pdfDocument) renderPDFPage(pdfDocument, currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (pdfDocument) renderPDFPage(pdfDocument, currentPage + 1);
    }
  };

  // Zoom controls
  const zoomIn = () => {
    const newZoom = Math.min(zoom + 0.25, 3);
    setZoom(newZoom);
    if (pdfDocument) renderPDFPage(pdfDocument, currentPage);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom - 0.25, 0.5);
    setZoom(newZoom);
    if (pdfDocument) renderPDFPage(pdfDocument, currentPage);
  };

  // Save/Export functionality (guide feature)
  const handleSave = useCallback(() => {
    const pageElements = elements.filter(
      (el) => el.pageIndex === currentPage - 1,
    );

    onSave?.(elements);

    toast({
      title: "💾 PDF Saved",
      description: `${elements.length} elements saved across ${totalPages} pages`,
    });
  }, [elements, currentPage, totalPages, onSave, toast]);

  // Auto-save using localStorage (guide pro tip)
  useEffect(() => {
    if (elements.length > 0) {
      localStorage.setItem(`pdf-editor-${file.name}`, JSON.stringify(elements));
    }
  }, [elements, file.name]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`pdf-editor-${file.name}`);
    if (saved) {
      try {
        const savedElements = JSON.parse(saved);
        setElements(savedElements);
        addToHistory(savedElements);
      } catch (error) {
        console.error("Error loading saved elements:", error);
      }
    }
  }, [file.name, addToHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">
            Loading Professional PDF Editor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar - Professional UI */}
      <div className="bg-white border-b shadow-sm px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-800">{file.name}</h1>
            <Badge variant="secondary">
              {elements.filter((el) => el.pageIndex === currentPage - 1).length}{" "}
              elements
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Tool Palette */}
        <div className="w-64 bg-white border-r flex flex-col">
          {/* Tools Section */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tools</h3>
            <div className="space-y-2">
              {Object.entries(
                tools.reduce(
                  (acc, tool) => {
                    if (!acc[tool.category]) acc[tool.category] = [];
                    acc[tool.category].push(tool);
                    return acc;
                  },
                  {} as Record<string, Tool[]>,
                ),
              ).map(([category, categoryTools]) => (
                <div key={category} className="space-y-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {category}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {categoryTools.map((tool) => (
                      <Button
                        key={tool.id}
                        variant={selectedTool === tool.id ? "default" : "ghost"}
                        size="sm"
                        className="h-10 flex flex-col items-center"
                        onClick={() => setSelectedTool(tool.id)}
                        title={tool.name}
                      >
                        <tool.icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Properties Panel */}
          <div className="p-4 flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Properties
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Stroke Color
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-8 h-8 rounded border"
                  />
                  <span className="text-sm text-gray-600">{strokeColor}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">
                  Stroke Width
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full mt-1"
                />
                <span className="text-xs text-gray-500">{strokeWidth}px</span>
              </div>

              {selectedTool === "text" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Font Size
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="72"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                    <span className="text-xs text-gray-500">{fontSize}px</span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full mt-1 text-sm border rounded px-2 py-1"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Courier">Courier</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Page Navigation */}
          <div className="bg-white border-b px-4 py-2 flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* PDF Canvas Area with Layered System */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8">
            <div className="flex justify-center">
              <div className="relative shadow-2xl bg-white">
                {/* Base PDF Canvas */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0"
                  style={{ zIndex: 1 }}
                />

                {/* Edit Elements Canvas */}
                <canvas
                  ref={editCanvasRef}
                  className="absolute inset-0"
                  style={{ zIndex: 2 }}
                  onClick={addTextElement}
                />

                {/* Drawing Canvas */}
                <canvas
                  ref={drawCanvasRef}
                  className="absolute inset-0 cursor-crosshair"
                  style={{ zIndex: 3 }}
                  onMouseDown={startDrawing}
                  onMouseMove={continueDrawing}
                  onMouseUp={endDrawing}
                />

                {/* Interactive Overlay for Elements */}
                <div
                  ref={overlayRef}
                  className="absolute inset-0"
                  style={{ zIndex: 4 }}
                >
                  {elements
                    .filter((el) => el.pageIndex === currentPage - 1)
                    .map((element) => (
                      <div
                        key={element.id}
                        className={cn(
                          "absolute border-2 border-transparent hover:border-blue-400",
                          selectedElements.includes(element.id) &&
                            "border-blue-500",
                        )}
                        style={{
                          left: element.bounds.x,
                          top: element.bounds.y,
                          width: element.bounds.width,
                          height: element.bounds.height,
                        }}
                        onClick={() => {
                          if (selectedTool === "select") {
                            setSelectedElements([element.id]);
                          }
                        }}
                      >
                        {element.type === "text" && (
                          <div
                            style={{
                              fontSize: element.properties.fontSize,
                              fontFamily: element.properties.fontFamily,
                              color: element.properties.color,
                              padding: "2px",
                            }}
                          >
                            {element.properties.text}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t px-4 py-2 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div>Ready • {elements.length} total elements • Auto-saved</div>
          <div>
            Zoom: {Math.round(zoom * 100)}% • Tool:{" "}
            {tools.find((t) => t.id === selectedTool)?.name}
          </div>
        </div>
      </div>
    </div>
  );
}
