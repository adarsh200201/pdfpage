import React, { useState, useEffect, useRef, useCallback } from "react";
import { pdfjs } from "react-pdf";
import * as fabric from "fabric";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Type,
  Square,
  Circle,
  MousePointer,
  Image,
  Pen,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Save,
  Trash2,
  Edit3,
  Check,
  X,
  Move,
  RotateCcw,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  FileImage,
  Signature,
  Layers,
  Eye,
  EyeOff,
  Settings,
  Copy,
  Paste,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFService } from "@/services/pdfService";

interface TextObject {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  pageIndex: number;
  isOriginal: boolean;
  isEditing: boolean;
  fabricObject?: fabric.Textbox;
}

interface ProfessionalPDFEditorProps {
  className?: string;
  onSave?: (pdfData: ArrayBuffer) => void;
}

export function ProfessionalPDFEditor({
  className,
  onSave,
}: ProfessionalPDFEditorProps) {
  const { toast } = useToast();

  // Core state
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canvas and editing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF and text state
  const [textObjects, setTextObjects] = useState<TextObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>("select");
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Text editing properties
  const [textProperties, setTextProperties] = useState({
    fontSize: 16,
    fontFamily: "Arial",
    color: "#000000",
    backgroundColor: "transparent",
    bold: false,
    italic: false,
    underline: false,
    align: "left" as "left" | "center" | "right",
  });

  // Configure PDF.js
  useEffect(() => {
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
  }, []);

  // Initialize Fabric.js canvas
  const initializeFabricCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    // Dispose existing canvas
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    // Create new fabric canvas
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      selection: true,
      preserveObjectStacking: true,
      enableRetinaScaling: true,
      backgroundColor: "transparent",
      selectionBorderColor: "rgba(0, 123, 255, 0.8)",
      selectionLineWidth: 2,
      selectionDashArray: [5, 5],
      skipOffscreen: false,
      controlsAboveOverlay: true,
    });

    // Set up event handlers with error protection
    fabricCanvas.on("object:selected", (e) => {
      try {
        const obj = e.target;
        if (obj && obj.data && obj.data.id) {
          setSelectedObject(obj.data.id);

          // Update text properties if it's a text object
          if (obj.type === "textbox") {
            const textObj = obj as fabric.Textbox;
            setTextProperties({
              fontSize: textObj.fontSize || 16,
              fontFamily: textObj.fontFamily || "Arial",
              color: (textObj.fill as string) || "#000000",
              backgroundColor:
                (textObj.backgroundColor as string) || "transparent",
              bold: textObj.fontWeight === "bold",
              italic: textObj.fontStyle === "italic",
              underline: textObj.underline || false,
              align: (textObj.textAlign as any) || "left",
            });
          }
        }
      } catch (error) {
        console.warn("Error in object:selected event:", error);
        setSelectedObject(null);
      }
    });

    fabricCanvas.on("selection:cleared", () => {
      try {
        setSelectedObject(null);
      } catch (error) {
        console.warn("Error in selection:cleared event:", error);
      }
    });

    fabricCanvas.on("object:modified", (e) => {
      try {
        const obj = e.target;
        if (obj && obj.data && obj.data.id) {
          updateTextObject(obj.data.id, {
            x: obj.left || 0,
            y: obj.top || 0,
            width: obj.width || 0,
            height: obj.height || 0,
          });
        }
      } catch (error) {
        console.warn("Error in object:modified event:", error);
      }
    });

    fabricCanvas.on("text:changed", (e) => {
      try {
        const obj = e.target as fabric.Textbox;
        if (obj && obj.data && obj.data.id) {
          updateTextObject(obj.data.id, {
            content: obj.text || "",
          });
        }
      } catch (error) {
        console.warn("Error in text:changed event:", error);
      }
    });

    fabricCanvasRef.current = fabricCanvas;
    return fabricCanvas;
  }, []);

  // Update text object properties
  const updateTextObject = useCallback(
    (id: string, updates: Partial<TextObject>) => {
      setTextObjects((prev) =>
        prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj)),
      );

      // Sync with backend
      if (sessionId) {
        const textObject = textObjects.find((obj) => obj.id === id);
        if (textObject) {
          PDFService.updateElement(sessionId, id, {
            ...textObject,
            ...updates,
            type: "text",
            modified: true,
          }).catch(console.error);
        }
      }
    },
    [textObjects, sessionId],
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file || file.type !== "application/pdf") {
        toast({
          title: "Invalid file",
          description: "Please select a valid PDF file",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setError(null);
      setTextObjects([]);

      try {
        // Create edit session
        const sessionData = await PDFService.createEditSession(file, {
          collaborative: true,
        });
        setSessionId(sessionData.sessionId);

        // Load PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);

        toast({
          title: "PDF loaded successfully",
          description: `${pdf.numPages} pages ready for editing`,
        });

        // Initialize canvas and extract text
        const canvas = initializeFabricCanvas();
        if (canvas) {
          await extractAndRenderPage(pdf, 1, canvas);
        }
      } catch (error) {
        console.error("Failed to load PDF:", error);
        setError("Failed to load PDF. Please try again.");
        toast({
          title: "Upload failed",
          description: "Could not load the PDF file",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, initializeFabricCanvas],
  );

  // Extract text and render page
  const extractAndRenderPage = useCallback(
    async (pdf: any, pageNum: number, canvas: fabric.Canvas) => {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });

        // Set canvas size
        canvas.setDimensions({
          width: viewport.width,
          height: viewport.height,
        });

        // Clear existing objects
        canvas.clear();

        // Create background image from PDF page
        const tempCanvas = document.createElement("canvas");
        const tempContext = tempCanvas.getContext("2d");
        if (!tempContext) return;

        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;

        await page.render({
          canvasContext: tempContext,
          viewport: viewport,
        }).promise;

        // Add PDF background as image
        const backgroundImage = tempCanvas.toDataURL();
        fabric.Image.fromURL(backgroundImage, (img) => {
          img.set({
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
          });
          canvas.add(img);
          canvas.sendToBack(img);
        });

        // Extract text content for editing
        const textContent = await page.getTextContent();
        const pageTextObjects: TextObject[] = [];

        textContent.items.forEach((item: any, index: number) => {
          if (item.str && item.str.trim()) {
            const transform = item.transform;
            const x = transform[4];
            const y = viewport.height - transform[5]; // Flip Y coordinate
            const fontSize = Math.abs(transform[0]);
            const width = item.width || fontSize * item.str.length * 0.6;
            const height = item.height || fontSize;

            const textObj: TextObject = {
              id: `text-${pageNum}-${index}`,
              content: item.str,
              x,
              y: y - height,
              width,
              height,
              fontSize,
              fontFamily: "Arial", // Default, could be extracted from PDF
              color: "#000000",
              pageIndex: pageNum - 1,
              isOriginal: true,
              isEditing: false,
            };

            // Create fabric textbox for this text
            const fabricText = new fabric.Textbox(item.str, {
              left: x,
              top: y - height,
              width: width,
              fontSize: fontSize,
              fontFamily: "Arial",
              fill: "#000000",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              editable: true,
              selectable: true,
              lockRotation: false,
              borderColor: "#007bff",
              cornerColor: "#007bff",
              cornerSize: 8,
              transparentCorners: false,
              data: { id: textObj.id, type: "original-text" },
            });

            textObj.fabricObject = fabricText;
            pageTextObjects.push(textObj);
            canvas.add(fabricText);
          }
        });

        setTextObjects(pageTextObjects);
        canvas.renderAll();

        console.log(
          `✅ Extracted ${pageTextObjects.length} editable text objects`,
        );
      } catch (error) {
        console.error("Failed to extract text:", error);
        toast({
          title: "Text extraction failed",
          description: "Some text may not be editable",
          variant: "destructive",
        });
      }
    },
    [zoom, toast],
  );

  // Handle page change
  const changePage = useCallback(
    async (newPage: number) => {
      if (!pdfDocument || !fabricCanvasRef.current) return;

      setCurrentPage(newPage);
      await extractAndRenderPage(pdfDocument, newPage, fabricCanvasRef.current);
    },
    [pdfDocument, extractAndRenderPage],
  );

  // Handle zoom change
  const handleZoom = useCallback(
    (newZoom: number) => {
      setZoom(newZoom);
      if (pdfDocument && fabricCanvasRef.current) {
        extractAndRenderPage(pdfDocument, currentPage, fabricCanvasRef.current);
      }
    },
    [pdfDocument, currentPage, extractAndRenderPage],
  );

  // Add new text
  const addNewText = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;

    const newTextObj: TextObject = {
      id: `new-text-${Date.now()}`,
      content: "New Text",
      x: centerX - 50,
      y: centerY - 10,
      width: 100,
      height: 20,
      fontSize: textProperties.fontSize,
      fontFamily: textProperties.fontFamily,
      color: textProperties.color,
      pageIndex: currentPage - 1,
      isOriginal: false,
      isEditing: true,
    };

    const fabricText = new fabric.Textbox(newTextObj.content, {
      left: newTextObj.x,
      top: newTextObj.y,
      width: newTextObj.width,
      fontSize: newTextObj.fontSize,
      fontFamily: newTextObj.fontFamily,
      fill: newTextObj.color,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      editable: true,
      selectable: true,
      borderColor: "#28a745",
      cornerColor: "#28a745",
      data: { id: newTextObj.id, type: "new-text" },
    });

    newTextObj.fabricObject = fabricText;
    canvas.add(fabricText);
    canvas.setActiveObject(fabricText);

    setTextObjects((prev) => [...prev, newTextObj]);
    setSelectedObject(newTextObj.id);

    // Enter editing mode
    fabricText.enterEditing();

    canvas.renderAll();
  }, [textProperties, currentPage]);

  // Update selected object properties
  const updateSelectedObjectProperties = useCallback(() => {
    if (!selectedObject || !fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const activeObject = canvas.getActiveObject() as fabric.Textbox;

    if (activeObject && activeObject.type === "textbox") {
      activeObject.set({
        fontSize: textProperties.fontSize,
        fontFamily: textProperties.fontFamily,
        fill: textProperties.color,
        backgroundColor:
          textProperties.backgroundColor === "transparent"
            ? ""
            : textProperties.backgroundColor,
        fontWeight: textProperties.bold ? "bold" : "normal",
        fontStyle: textProperties.italic ? "italic" : "normal",
        underline: textProperties.underline,
        textAlign: textProperties.align,
      });

      canvas.renderAll();

      // Update in state
      updateTextObject(selectedObject, {
        fontSize: textProperties.fontSize,
        fontFamily: textProperties.fontFamily,
        color: textProperties.color,
      });
    }
  }, [selectedObject, textProperties, updateTextObject]);

  // Delete selected object
  const deleteSelectedObject = useCallback(() => {
    if (!selectedObject || !fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      canvas.remove(activeObject);
      setTextObjects((prev) => prev.filter((obj) => obj.id !== selectedObject));
      setSelectedObject(null);
      canvas.renderAll();

      // Sync deletion with backend
      if (sessionId) {
        PDFService.deleteElement(sessionId, selectedObject).catch(
          console.error,
        );
      }
    }
  }, [selectedObject, sessionId]);

  // Save edited PDF
  const saveEditedPDF = useCallback(async () => {
    if (!sessionId || !fabricCanvasRef.current) {
      toast({
        title: "Cannot save",
        description: "Please upload a PDF first",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Saving PDF...",
        description: "Applying all edits to your PDF",
      });

      // Send all text objects to backend
      for (const textObj of textObjects) {
        await PDFService.updateElement(sessionId, textObj.id, {
          ...textObj,
          type: "text",
          modified: !textObj.isOriginal,
        });
      }

      const pdfBuffer = await PDFService.saveEditedPDF(sessionId);

      // Download the file
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited_document_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF saved successfully!",
        description: "Your edited PDF has been downloaded",
      });

      if (onSave) {
        onSave(pdfBuffer);
      }
    } catch (error) {
      console.error("Failed to save PDF:", error);
      toast({
        title: "Save failed",
        description: "Could not save the edited PDF",
        variant: "destructive",
      });
    }
  }, [sessionId, textObjects, onSave, toast]);

  // Apply property changes when they update
  useEffect(() => {
    updateSelectedObjectProperties();
  }, [textProperties, updateSelectedObjectProperties]);

  // Handle tool changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;

      try {
        switch (activeTool) {
          case "select":
            canvas.selection = true;
            canvas.defaultCursor = "default";
            canvas.hoverCursor = "move";
            break;
          case "text":
            canvas.selection = true;
            canvas.defaultCursor = "text";
            canvas.hoverCursor = "text";
            break;
          default:
            canvas.selection = true;
            canvas.defaultCursor = "default";
        }
        canvas.renderAll();
      } catch (error) {
        console.warn("Error updating canvas tool state:", error);
      }
    }
  }, [activeTool]);

  const currentPageTextObjects = textObjects.filter(
    (obj) => obj.pageIndex === currentPage - 1,
  );

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Top Toolbar */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>

              {pdfDocument && (
                <Button variant="outline" onClick={saveEditedPDF}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Edited PDF
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Tools */}
              <div className="flex gap-1">
                <Button
                  variant={activeTool === "select" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActiveTool("select");
                    // Ensure canvas is in selection mode
                    if (fabricCanvasRef.current) {
                      fabricCanvasRef.current.selection = true;
                      fabricCanvasRef.current.defaultCursor = "default";
                    }
                  }}
                >
                  <MousePointer className="w-4 h-4" />
                </Button>
                <Button
                  variant={activeTool === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActiveTool("text");
                    addNewText();
                  }}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelectedObject}
                  disabled={!selectedObject}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Zoom */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom(zoom * 0.9)}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm w-16 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom(zoom * 1.1)}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              {sessionId && (
                <Badge variant="secondary">
                  Session: {sessionId.slice(-8)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-1">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Page Navigation */}
          {pdfDocument && (
            <div className="flex items-center justify-center p-2 bg-white border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="mx-4 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  changePage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* Canvas Container */}
          <div
            ref={containerRef}
            className="flex-1 overflow-auto bg-gray-100 p-8 flex items-center justify-center"
          >
            {isLoading && (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading PDF and extracting text...</p>
              </div>
            )}

            {error && (
              <div className="text-center text-red-600">
                <p>{error}</p>
                <Button
                  variant="outline"
                  onClick={() => setError(null)}
                  className="mt-2"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {!pdfDocument && !isLoading && !error && (
              <div className="text-center">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Upload PDF for Professional Editing
                </h3>
                <p className="text-gray-600 mb-4">
                  Direct text editing with fabric.js - exactly like LightPDF
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose PDF File
                </Button>
              </div>
            )}

            {pdfDocument && (
              <div className="relative shadow-lg">
                <canvas ref={canvasRef} className="block bg-white" />
              </div>
            )}
          </div>
        </div>

        {/* Right Properties Panel */}
        {pdfDocument && (
          <Card className="w-80 rounded-none border-y-0 border-r-0">
            <CardHeader>
              <CardTitle className="text-lg">Direct Edit Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructions */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Instructions
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Click on any text in the PDF to edit it directly</p>
                  <p>• Use the Text tool to add new text elements</p>
                  <p>• Double-click text to enter editing mode</p>
                  <p>• Drag corners to resize text boxes</p>
                  <p>• Use properties panel to format text</p>
                </div>
              </div>

              <Separator />

              {/* Text Properties */}
              {selectedObject && (
                <div className="space-y-4">
                  <h4 className="font-medium">Text Properties</h4>

                  <div className="space-y-3">
                    <div>
                      <Label>Font Size</Label>
                      <Slider
                        value={[textProperties.fontSize]}
                        onValueChange={([value]) =>
                          setTextProperties((prev) => ({
                            ...prev,
                            fontSize: value,
                          }))
                        }
                        min={8}
                        max={72}
                        step={1}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-500">
                        {textProperties.fontSize}px
                      </span>
                    </div>

                    <div>
                      <Label>Font Family</Label>
                      <Select
                        value={textProperties.fontFamily}
                        onValueChange={(value) =>
                          setTextProperties((prev) => ({
                            ...prev,
                            fontFamily: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times">Times</SelectItem>
                          <SelectItem value="Courier">Courier</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={textProperties.color}
                          onChange={(e) =>
                            setTextProperties((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={textProperties.color}
                          onChange={(e) =>
                            setTextProperties((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={textProperties.bold ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setTextProperties((prev) => ({
                            ...prev,
                            bold: !prev.bold,
                          }))
                        }
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={textProperties.italic ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setTextProperties((prev) => ({
                            ...prev,
                            italic: !prev.italic,
                          }))
                        }
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={
                          textProperties.underline ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setTextProperties((prev) => ({
                            ...prev,
                            underline: !prev.underline,
                          }))
                        }
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={
                          textProperties.align === "left"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setTextProperties((prev) => ({
                            ...prev,
                            align: "left",
                          }))
                        }
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={
                          textProperties.align === "center"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setTextProperties((prev) => ({
                            ...prev,
                            align: "center",
                          }))
                        }
                      >
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={
                          textProperties.align === "right"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setTextProperties((prev) => ({
                            ...prev,
                            align: "right",
                          }))
                        }
                      >
                        <AlignRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Text Objects List */}
              <div className="space-y-4">
                <h4 className="font-medium">Current Page Text</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {currentPageTextObjects.map((obj) => (
                    <div
                      key={obj.id}
                      className={cn(
                        "p-2 rounded text-xs border cursor-pointer transition-colors",
                        selectedObject === obj.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300",
                        !obj.isOriginal && "border-green-500 bg-green-50",
                      )}
                      onClick={() => {
                        if (fabricCanvasRef.current && obj.fabricObject) {
                          fabricCanvasRef.current.setActiveObject(
                            obj.fabricObject,
                          );
                          fabricCanvasRef.current.renderAll();
                        }
                      }}
                    >
                      <div className="font-medium truncate">{obj.content}</div>
                      <div className="text-gray-500 mt-1">
                        {obj.fontSize}px • {obj.fontFamily}
                        {!obj.isOriginal && " • New"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Statistics</h4>
                <div className="text-sm text-gray-600">
                  <p>Total objects: {textObjects.length}</p>
                  <p>Current page: {currentPageTextObjects.length}</p>
                  <p>
                    New objects:{" "}
                    {textObjects.filter((obj) => !obj.isOriginal).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        }}
      />
    </div>
  );
}

export default ProfessionalPDFEditor;
