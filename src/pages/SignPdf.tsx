import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  PenTool,
  Upload,
  Type,
  Image as ImageIcon,
  RotateCcw,
  Check,
  X,
  Settings,
  Calendar,
  Move,
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Save,
  Crown,
  Star,
  MousePointer,
  Square,
  Circle,
  Minus,
  Plus,
  Palette,
  AlignCenter,
  AlignLeft,
  AlignRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureData {
  id: string;
  type: "draw" | "type" | "upload" | "date" | "text";
  data: string;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  rotation: number;
  opacity: number;
  color: string;
  fontSize?: number;
  fontFamily?: string;
  locked: boolean;
  visible: boolean;
  style?: string;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  createdAt: Date;
}

interface SignatureTemplate {
  id: string;
  name: string;
  type: "draw" | "type" | "upload";
  data: string;
  text?: string;
  preview: string;
}

const SignPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [signedFile, setSignedFile] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);

  // Advanced signature states
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(
    null,
  );
  const [signatureTemplates, setSignatureTemplates] = useState<
    SignatureTemplate[]
  >([]);
  const [showSignatureCreator, setShowSignatureCreator] = useState(false);
  const [signatureMode, setSignatureMode] = useState<
    "draw" | "type" | "upload" | "date" | "text" | null
  >(null);
  const [placingSignature, setPlacingSignature] =
    useState<SignatureData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // UI states
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState<"sign" | "fill" | "protect">(
    "sign",
  );

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load signature templates on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem("pdfpage_signature_templates");
    if (savedTemplates) {
      setSignatureTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((templates: SignatureTemplate[]) => {
    localStorage.setItem(
      "pdfpage_signature_templates",
      JSON.stringify(templates),
    );
    setSignatureTemplates(templates);
  }, []);

  // Handle file upload and PDF loading
  const handleFileUpload = useCallback(
    async (uploadedFiles: File[]) => {
      if (uploadedFiles.length > 0) {
        const selectedFile = uploadedFiles[0];
        setFile(selectedFile);
        setIsComplete(false);
        setSignedFile(null);
        setSignatures([]);
        setCurrentPage(1);
        setZoom(1);

        try {
          // Load PDF to get page count
          const { getDocument } = await import("pdfjs-dist");
          const arrayBuffer = await selectedFile.arrayBuffer();
          const pdf = await getDocument(arrayBuffer).promise;
          setPdfPages(pdf.numPages);

          toast({
            title: "PDF loaded successfully",
            description: `Document has ${pdf.numPages} page(s). Ready for signing!`,
          });
        } catch (error) {
          console.error("Error reading PDF:", error);
          setPdfPages(1);
          toast({
            title: "PDF loaded",
            description: "PDF loaded successfully",
          });
        }
      }
    },
    [toast],
  );

  // Create signature with advanced options
  const createSignature = useCallback(
    (
      type: "draw" | "type" | "upload" | "date" | "text",
      data: string,
      text?: string,
      options?: Partial<SignatureData>,
    ) => {
      const newSignature: SignatureData = {
        id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        text,
        x: 100,
        y: 100,
        width: type === "date" ? 150 : type === "text" ? 200 : 200,
        height: type === "date" ? 30 : type === "text" ? 40 : 60,
        pageNumber: currentPage,
        rotation: 0,
        opacity: 1,
        color: "#000000",
        fontSize: type === "type" || type === "text" ? 18 : undefined,
        fontFamily: "Arial",
        locked: false,
        visible: true,
        createdAt: new Date(),
        ...options,
      };

      setPlacingSignature(newSignature);
      setShowSignatureCreator(false);
      setSignatureMode(null);

      toast({
        title: "Signature created",
        description: "Click on the PDF to position your signature",
      });
    },
    [currentPage, toast],
  );

  // Handle signature creation from templates or creator
  const handleCreateSignature = (
    type: "draw" | "type" | "upload" | "date" | "text",
  ) => {
    if (type === "date") {
      const currentDate = new Date().toLocaleDateString();
      createSignature("date", "", currentDate);
    } else if (type === "text") {
      const text = prompt("Enter text to add:");
      if (text && text.trim()) {
        createSignature("text", "", text.trim());
      }
    } else {
      setSignatureMode(type);
      setShowSignatureCreator(true);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: SignatureTemplate) => {
    createSignature(template.type, template.data, template.text);
    setShowTemplateLibrary(false);
  };

  // Handle signature completion from creator
  const handleSignatureComplete = (
    data: string,
    text?: string,
    saveAsTemplate?: boolean,
  ) => {
    if (saveAsTemplate && signatureMode) {
      const newTemplate: SignatureTemplate = {
        id: `template_${Date.now()}`,
        name: text || `${signatureMode} signature`,
        type: signatureMode,
        data,
        text,
        preview: data || text || "",
      };
      saveTemplates([...signatureTemplates, newTemplate]);
    }

    createSignature(signatureMode!, data, text);
  };

  // Handle signature placement on PDF canvas
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placingSignature) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    let finalX = x - placingSignature.width / 2;
    let finalY = y - placingSignature.height / 2;

    // Snap to grid if enabled
    if (snapToGrid) {
      const gridSize = 10;
      finalX = Math.round(finalX / gridSize) * gridSize;
      finalY = Math.round(finalY / gridSize) * gridSize;
    }

    const updatedSignature = {
      ...placingSignature,
      x: finalX,
      y: finalY,
    };

    setSignatures((prev) => [...prev, updatedSignature]);
    setPlacingSignature(null);
    setSelectedSignatureId(updatedSignature.id);

    toast({
      title: "Signature placed",
      description: "Signature added to page " + currentPage,
    });
  };

  // Handle signature selection
  const handleSignatureSelect = (signatureId: string) => {
    setSelectedSignatureId(signatureId);
  };

  // Handle signature drag start
  const handleDragStart = (event: React.MouseEvent, signatureId: string) => {
    event.preventDefault();
    const signature = signatures.find((s) => s.id === signatureId);
    if (!signature || signature.locked) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    setIsDragging(true);
    setSelectedSignatureId(signatureId);
    setDragOffset({
      x: x - signature.x,
      y: y - signature.y,
    });
  };

  // Handle signature drag
  const handleDrag = (event: React.MouseEvent) => {
    if (!isDragging || !selectedSignatureId) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    let newX = x - dragOffset.x;
    let newY = y - dragOffset.y;

    // Snap to grid if enabled
    if (snapToGrid) {
      const gridSize = 10;
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    setSignatures((prev) =>
      prev.map((sig) =>
        sig.id === selectedSignatureId ? { ...sig, x: newX, y: newY } : sig,
      ),
    );
  };

  // Handle signature drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Update signature properties
  const updateSignature = useCallback(
    (id: string, updates: Partial<SignatureData>) => {
      setSignatures((prev) =>
        prev.map((sig) => (sig.id === id ? { ...sig, ...updates } : sig)),
      );
    },
    [],
  );

  // Duplicate signature
  const duplicateSignature = useCallback(
    (id: string) => {
      const signature = signatures.find((s) => s.id === id);
      if (!signature) return;

      const newSignature: SignatureData = {
        ...signature,
        id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: signature.x + 20,
        y: signature.y + 20,
        createdAt: new Date(),
      };

      setSignatures((prev) => [...prev, newSignature]);
      setSelectedSignatureId(newSignature.id);

      toast({
        title: "Signature duplicated",
        description: "Created a copy of the signature",
      });
    },
    [signatures, toast],
  );

  // Remove signature
  const removeSignature = useCallback(
    (id: string) => {
      setSignatures((prev) => prev.filter((sig) => sig.id !== id));
      setSelectedSignatureId(null);
      toast({
        title: "Signature removed",
        description: "Signature has been removed from the document",
      });
    },
    [toast],
  );

  // Layer management
  const moveSignatureLayer = useCallback(
    (id: string, direction: "up" | "down") => {
      setSignatures((prev) => {
        const index = prev.findIndex((s) => s.id === id);
        if (index === -1) return prev;

        const newSignatures = [...prev];
        if (direction === "up" && index < newSignatures.length - 1) {
          [newSignatures[index], newSignatures[index + 1]] = [
            newSignatures[index + 1],
            newSignatures[index],
          ];
        } else if (direction === "down" && index > 0) {
          [newSignatures[index], newSignatures[index - 1]] = [
            newSignatures[index - 1],
            newSignatures[index],
          ];
        }

        return newSignatures;
      });
    },
    [],
  );

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.25));
  const handleZoomReset = () => setZoom(1);

  // Page navigation
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, pdfPages)));
    setSelectedSignatureId(null);
  };

  // Process and save PDF with signatures
  const handleSavePdf = useCallback(async () => {
    if (!file || signatures.length === 0) {
      toast({
        title: "No signatures to save",
        description: "Please add at least one signature before saving",
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
        title: "🔄 Processing PDF...",
        description: `Adding ${signatures.filter((s) => s.visible).length} signature(s) to PDF`,
      });

      const processedPdf = await applySignaturesToPDF(
        file,
        signatures.filter((s) => s.visible),
      );
      const blob = new Blob([processedPdf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setSignedFile({
        name: file.name.replace(/\.pdf$/i, "_signed.pdf"),
        url,
        size: blob.size,
      });
      setIsComplete(true);

      // Track usage
      await PDFService.trackUsage("sign-pdf", signatures.length, file.size);

      toast({
        title: "🎉 PDF signed successfully!",
        description: `Added ${signatures.filter((s) => s.visible).length} signature(s) to your document`,
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({
        title: "Signing failed",
        description: "There was an error signing your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [file, signatures, toast]);

  // Apply signatures to PDF using pdf-lib with advanced features
  const applySignaturesToPDF = async (
    file: File,
    signatures: SignatureData[],
  ): Promise<Uint8Array> => {
    const { PDFDocument, rgb, StandardFonts, degrees } = await import(
      "pdf-lib"
    );

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    // Group signatures by page
    const signaturesByPage = signatures.reduce(
      (acc, sig) => {
        if (!acc[sig.pageNumber]) acc[sig.pageNumber] = [];
        acc[sig.pageNumber].push(sig);
        return acc;
      },
      {} as Record<number, SignatureData[]>,
    );

    // Apply signatures to each page
    for (const [pageNum, pageSignatures] of Object.entries(signaturesByPage)) {
      const pageIndex = parseInt(pageNum) - 1;
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        const { height } = page.getSize();

        for (const signature of pageSignatures) {
          try {
            const yPos = height - signature.y - signature.height;

            if (
              signature.type === "type" ||
              signature.type === "text" ||
              signature.type === "date"
            ) {
              // Add text-based signatures with advanced styling
              const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
              const color = hexToRgb(signature.color);

              page.drawText(signature.text || "", {
                x: signature.x,
                y: yPos,
                size: signature.fontSize || 18,
                font,
                color: rgb(color.r, color.g, color.b),
                opacity: signature.opacity,
                rotate: degrees(signature.rotation),
              });

              // Add background if specified
              if (signature.backgroundColor) {
                const bgColor = hexToRgb(signature.backgroundColor);
                page.drawRectangle({
                  x: signature.x - 5,
                  y: yPos - 5,
                  width: signature.width + 10,
                  height: signature.height + 10,
                  color: rgb(bgColor.r, bgColor.g, bgColor.b),
                  opacity: 0.3,
                });
              }

              // Add border if specified
              if (signature.borderWidth && signature.borderColor) {
                const borderColor = hexToRgb(signature.borderColor);
                page.drawRectangle({
                  x: signature.x,
                  y: yPos,
                  width: signature.width,
                  height: signature.height,
                  borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
                  borderWidth: signature.borderWidth,
                  borderOpacity: signature.opacity,
                });
              }
            } else if (
              signature.type === "draw" ||
              signature.type === "upload"
            ) {
              // Add image signatures with advanced options
              try {
                const imageBytes = signature.data.split(",")[1];
                const imageData = Uint8Array.from(atob(imageBytes), (c) =>
                  c.charCodeAt(0),
                );

                let embeddedImage;
                if (signature.data.includes("data:image/png")) {
                  embeddedImage = await pdfDoc.embedPng(imageData);
                } else {
                  embeddedImage = await pdfDoc.embedJpg(imageData);
                }

                page.drawImage(embeddedImage, {
                  x: signature.x,
                  y: yPos,
                  width: signature.width,
                  height: signature.height,
                  opacity: signature.opacity,
                  rotate: degrees(signature.rotation),
                });
              } catch (imageError) {
                console.error("Error embedding signature image:", imageError);
              }
            }
          } catch (signatureError) {
            console.error("Error applying signature:", signatureError);
          }
        }
      }
    }

    // Add metadata
    pdfDoc.setTitle("Signed Document");
    pdfDoc.setSubject("Digitally signed with PdfPage");
    pdfDoc.setCreator("PdfPage - Advanced PDF Signing Tool");
    pdfDoc.setProducer("PdfPage v2.0");
    pdfDoc.setCreationDate(new Date());

    return await pdfDoc.save();
  };

  // Utility function to convert hex to RGB
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

  const handleDownload = useCallback(() => {
    if (signedFile) {
      const link = document.createElement("a");
      link.href = signedFile.url;
      link.download = signedFile.name;
      link.click();
    }
  }, [signedFile]);

  // Reset function
  const reset = useCallback(() => {
    setFile(null);
    setSignedFile(null);
    setIsComplete(false);
    setPdfPages(1);
    setCurrentPage(1);
    setZoom(1);
    setSignatures([]);
    setSelectedSignatureId(null);
    setPlacingSignature(null);
    if (signedFile) {
      URL.revokeObjectURL(signedFile.url);
    }
  }, [signedFile]);

  // Get current page signatures
  const currentPageSignatures = signatures.filter(
    (s) => s.pageNumber === currentPage,
  );
  const selectedSignature = signatures.find(
    (s) => s.id === selectedSignatureId,
  );

  // Success screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PromoBanner className="mb-8" />

          <div className="flex items-center space-x-2 mb-8">
            <Link
              to="/"
              className="text-body-medium text-text-light hover:text-brand-red transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" />
              Back to Home
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                PDF Signed Successfully!
              </h3>
              <p className="text-gray-600 text-lg">
                Added {signatures.filter((s) => s.visible).length} signature(s)
                to your document
              </p>
            </div>

            {signedFile && (
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-6 border border-blue-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {signedFile.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(signedFile.size / 1024 / 1024).toFixed(2)} MB •
                      Digitally Signed with{" "}
                      {signatures.filter((s) => s.visible).length} signature(s)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={handleDownload}
                className="h-12 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Signed PDF
              </Button>
              <Button
                variant="outline"
                onClick={reset}
                className="h-12 text-lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Sign Another PDF
              </Button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultTab="register"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PromoBanner className="mb-6" />

        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center text-gray-600 hover:text-brand-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>

          {file && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className={cn(showGrid && "bg-blue-50 border-blue-300")}
              >
                <Grid className="w-4 h-4 mr-1" />
                Grid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={cn(snapToGrid && "bg-blue-50 border-blue-300")}
              >
                <MousePointer className="w-4 h-4 mr-1" />
                Snap
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Properties
              </Button>
            </div>
          )}
        </div>

        {/* Header */}
        {!file && (
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <PenTool className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced PDF Signing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Professional PDF signing with advanced features. Create, position,
              and manage digital signatures with precision and style.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="inline-flex items-center px-6 py-3 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                <span className="mr-2">✍️</span>
                Draw & Upload Signatures
              </div>
              <div className="inline-flex items-center px-6 py-3 rounded-full text-sm bg-green-100 text-green-800 font-medium">
                <span className="mr-2">🎨</span>
                Advanced Styling
              </div>
              <div className="inline-flex items-center px-6 py-3 rounded-full text-sm bg-purple-100 text-purple-800 font-medium">
                <span className="mr-2">📱</span>
                Drag & Resize
              </div>
              <div className="inline-flex items-center px-6 py-3 rounded-full text-sm bg-orange-100 text-orange-800 font-medium">
                <span className="mr-2">💾</span>
                Template Library
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!file ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
              <FileUpload
                onFilesSelect={handleFileUpload}
                accept=".pdf"
                multiple={false}
                maxSize={50}
                allowedTypes={["pdf"]}
                uploadText="Select PDF file to sign"
                supportText="Supports PDF format • Max 50MB"
              />
            </div>

            {/* Feature showcase */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <PenTool className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Multiple Signature Types
                </h3>
                <p className="text-gray-600 text-sm">
                  Draw, type, upload images, add dates, and insert custom text
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Move className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drag & Drop Editing
                </h3>
                <p className="text-gray-600 text-sm">
                  Move, resize, rotate, and style signatures after placement
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Template Library
                </h3>
                <p className="text-gray-600 text-sm">
                  Save and reuse your signatures across different documents
                </p>
              </div>
            </div>
          </div>
        ) : showSignatureCreator ? (
          <AdvancedSignatureCreator
            type={signatureMode!}
            onComplete={handleSignatureComplete}
            onCancel={() => {
              setShowSignatureCreator(false);
              setSignatureMode(null);
            }}
          />
        ) : showTemplateLibrary ? (
          <TemplateLibrary
            templates={signatureTemplates}
            onSelect={handleTemplateSelect}
            onDelete={(id) =>
              saveTemplates(signatureTemplates.filter((t) => t.id !== id))
            }
            onClose={() => setShowTemplateLibrary(false)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Advanced Toolbar */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 h-fit">
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("sign")}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      activeTab === "sign"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    Sign
                  </button>
                  <button
                    onClick={() => setActiveTab("fill")}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      activeTab === "fill"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    Fill
                  </button>
                  <button
                    onClick={() => setActiveTab("protect")}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      activeTab === "protect"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    Protect
                  </button>
                </div>

                {/* Sign Tab */}
                {activeTab === "sign" && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">
                      Add Signature
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleCreateSignature("draw")}
                        variant="outline"
                        size="sm"
                        className="h-12 flex-col"
                      >
                        <PenTool className="w-4 h-4 mb-1" />
                        <span className="text-xs">Draw</span>
                      </Button>
                      <Button
                        onClick={() => handleCreateSignature("type")}
                        variant="outline"
                        size="sm"
                        className="h-12 flex-col"
                      >
                        <Type className="w-4 h-4 mb-1" />
                        <span className="text-xs">Type</span>
                      </Button>
                      <Button
                        onClick={() => handleCreateSignature("upload")}
                        variant="outline"
                        size="sm"
                        className="h-12 flex-col"
                      >
                        <ImageIcon className="w-4 h-4 mb-1" />
                        <span className="text-xs">Upload</span>
                      </Button>
                      <Button
                        onClick={() => setShowTemplateLibrary(true)}
                        variant="outline"
                        size="sm"
                        className="h-12 flex-col"
                      >
                        <Star className="w-4 h-4 mb-1" />
                        <span className="text-xs">Templates</span>
                      </Button>
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Add Elements
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleCreateSignature("date")}
                          variant="outline"
                          size="sm"
                          className="h-10 text-xs"
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          Date
                        </Button>
                        <Button
                          onClick={() => handleCreateSignature("text")}
                          variant="outline"
                          size="sm"
                          className="h-10 text-xs"
                        >
                          <Type className="w-3 h-3 mr-1" />
                          Text
                        </Button>
                      </div>
                    </div>

                    {/* Signatures list */}
                    {currentPageSignatures.length > 0 && (
                      <div className="border-t pt-3">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Page {currentPage} Signatures (
                          {currentPageSignatures.length})
                        </h4>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {currentPageSignatures.map((sig, index) => (
                            <div
                              key={sig.id}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-md text-xs border transition-colors cursor-pointer",
                                selectedSignatureId === sig.id
                                  ? "bg-blue-50 border-blue-300"
                                  : "bg-gray-50 border-gray-200 hover:bg-gray-100",
                              )}
                              onClick={() => handleSignatureSelect(sig.id)}
                            >
                              <div className="flex items-center min-w-0">
                                {sig.type === "draw" && (
                                  <PenTool className="w-3 h-3 mr-1 text-blue-500" />
                                )}
                                {sig.type === "type" && (
                                  <Type className="w-3 h-3 mr-1 text-green-500" />
                                )}
                                {sig.type === "upload" && (
                                  <ImageIcon className="w-3 h-3 mr-1 text-purple-500" />
                                )}
                                {sig.type === "date" && (
                                  <Calendar className="w-3 h-3 mr-1 text-orange-500" />
                                )}
                                {sig.type === "text" && (
                                  <FileText className="w-3 h-3 mr-1 text-indigo-500" />
                                )}
                                <span className="truncate">
                                  {sig.text || `${sig.type} signature`}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSignature(sig.id, {
                                      visible: !sig.visible,
                                    });
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  {sig.visible ? (
                                    <Eye className="w-3 h-3" />
                                  ) : (
                                    <EyeOff className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSignature(sig.id);
                                  }}
                                  className="p-1 hover:bg-red-100 rounded text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="border-t pt-3 space-y-2">
                      {signatures.filter((s) => s.visible).length > 0 && (
                        <Button
                          onClick={handleSavePdf}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Save Signed PDF
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={reset}
                        className="w-full"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Start Over
                      </Button>
                    </div>
                  </div>
                )}

                {/* Fill Tab */}
                {activeTab === "fill" && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Form Fields</h3>
                    <p className="text-sm text-gray-600">
                      Auto-detect and fill form fields (Coming soon)
                    </p>
                    <div className="grid grid-cols-2 gap-2 opacity-50">
                      <Button variant="outline" size="sm" disabled>
                        <Square className="w-4 h-4 mb-1" />
                        Text Field
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Circle className="w-4 h-4 mb-1" />
                        Checkbox
                      </Button>
                    </div>
                  </div>
                )}

                {/* Protect Tab */}
                {activeTab === "protect" && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Security</h3>
                    <p className="text-sm text-gray-600">
                      Add password protection and encryption (Coming soon)
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="w-full"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Add Password
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-lg border border-gray-200">
              {/* Viewer header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <h3 className="font-semibold text-gray-900">PDF Preview</h3>
                  {placingSignature && (
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      📍 Click to place signature
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Zoom controls */}
                  <div className="flex items-center space-x-1 border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.25}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="px-2 text-sm font-medium">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={zoom >= 3}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ←
                    </Button>
                    <span className="text-sm text-gray-600">
                      {currentPage} / {pdfPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pdfPages}
                    >
                      →
                    </Button>
                  </div>
                </div>
              </div>

              {/* PDF Canvas */}
              <div
                className="relative overflow-auto"
                style={{ height: "calc(100vh - 300px)" }}
              >
                <AdvancedPDFViewer
                  file={file}
                  pageNumber={currentPage}
                  zoom={zoom}
                  signatures={currentPageSignatures}
                  selectedSignatureId={selectedSignatureId}
                  placingSignature={placingSignature}
                  showGrid={showGrid}
                  onCanvasClick={handleCanvasClick}
                  onSignatureSelect={handleSignatureSelect}
                  onDragStart={handleDragStart}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                />

                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                      <span className="text-xl font-medium text-gray-900">
                        Signing PDF...
                      </span>
                      <p className="text-sm text-gray-600 mt-2">
                        Adding your signatures with advanced formatting
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Properties Panel */}
            {showPropertiesPanel && selectedSignature && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 h-fit">
                <SignaturePropertiesPanel
                  signature={selectedSignature}
                  onUpdate={(updates) =>
                    updateSignature(selectedSignature.id, updates)
                  }
                  onDuplicate={() => duplicateSignature(selectedSignature.id)}
                  onDelete={() => removeSignature(selectedSignature.id)}
                  onMoveLayer={(direction) =>
                    moveSignatureLayer(selectedSignature.id, direction)
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Premium upgrade prompt */}
        {!user?.isPremium && signatures.length > 3 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Crown className="w-6 h-6 text-yellow-600 mr-2" />
                <h3 className="text-lg font-semibold text-orange-800">
                  Unlock Premium Features
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-sm text-orange-700">
                    Unlimited signatures per document
                  </span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-sm text-orange-700">
                    Advanced signature templates
                  </span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-sm text-orange-700">
                    Batch document signing
                  </span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-sm text-orange-700">
                    Priority support & updates
                  </span>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-700 hover:to-orange-700">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultTab="register"
        />
      </div>
    </div>
  );
};

// Advanced PDF Viewer Component with drag and drop
interface AdvancedPDFViewerProps {
  file: File;
  pageNumber: number;
  zoom: number;
  signatures: SignatureData[];
  selectedSignatureId: string | null;
  placingSignature: SignatureData | null;
  showGrid: boolean;
  onCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onSignatureSelect: (id: string) => void;
  onDragStart: (event: React.MouseEvent, id: string) => void;
  onDrag: (event: React.MouseEvent) => void;
  onDragEnd: () => void;
}

const AdvancedPDFViewer: React.FC<AdvancedPDFViewerProps> = ({
  file,
  pageNumber,
  zoom,
  signatures,
  selectedSignatureId,
  placingSignature,
  showGrid,
  onCanvasClick,
  onSignatureSelect,
  onDragStart,
  onDrag,
  onDragEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pdfPage, setPdfPage] = useState<any>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const loadPDF = async () => {
      try {
        const { getDocument } = await import("pdfjs-dist");
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(pageNumber);
        setPdfPage(page);
      } catch (error) {
        console.error("Error loading PDF page:", error);
      }
    };

    loadPDF();
  }, [file, pageNumber]);

  React.useEffect(() => {
    const renderPage = async () => {
      if (!pdfPage || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const viewport = pdfPage.getViewport({ scale: zoom });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      setCanvasSize({ width: viewport.width, height: viewport.height });

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Render PDF
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await pdfPage.render(renderContext).promise;

      // Draw grid if enabled
      if (showGrid) {
        context.strokeStyle = "#e5e7eb";
        context.lineWidth = 1;
        const gridSize = 20 * zoom;

        for (let x = 0; x <= canvas.width; x += gridSize) {
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, canvas.height);
          context.stroke();
        }

        for (let y = 0; y <= canvas.height; y += gridSize) {
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(canvas.width, y);
          context.stroke();
        }
      }
    };

    renderPage();
  }, [pdfPage, zoom, showGrid]);

  const getSignatureStyle = (signature: SignatureData): React.CSSProperties => {
    const isSelected = selectedSignatureId === signature.id;

    return {
      position: "absolute",
      left: signature.x * zoom,
      top: signature.y * zoom,
      width: signature.width * zoom,
      height: signature.height * zoom,
      opacity: signature.opacity,
      transform: `rotate(${signature.rotation}deg)`,
      border: isSelected
        ? "2px solid #3b82f6"
        : signature.locked
          ? "1px dashed #ef4444"
          : "1px dashed transparent",
      cursor: signature.locked ? "not-allowed" : "move",
      zIndex: isSelected ? 20 : 10,
      backgroundColor: signature.backgroundColor || "transparent",
      color: signature.color,
      fontSize: signature.fontSize ? signature.fontSize * zoom : undefined,
      fontFamily: signature.fontFamily,
      display: signature.visible ? "flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
    };
  };

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        onClick={onCanvasClick}
        onMouseMove={onDrag}
        onMouseUp={onDragEnd}
        className={cn(
          "border border-gray-300 shadow-lg",
          placingSignature && "cursor-crosshair",
        )}
        style={{ display: "block" }}
      />

      {/* Signature overlays */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      >
        {signatures.map((signature) => (
          <div
            key={signature.id}
            style={getSignatureStyle(signature)}
            className="pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onSignatureSelect(signature.id);
            }}
            onMouseDown={(e) => {
              if (!signature.locked) {
                onDragStart(e, signature.id);
              }
            }}
          >
            {signature.type === "type" ||
            signature.type === "text" ||
            signature.type === "date" ? (
              <span className="w-full h-full flex items-center justify-center text-center break-words">
                {signature.text}
              </span>
            ) : (
              <img
                src={signature.data}
                alt="Signature"
                className="w-full h-full object-contain"
                draggable={false}
              />
            )}

            {/* Selection handles */}
            {selectedSignatureId === signature.id && !signature.locked && (
              <>
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
              </>
            )}
          </div>
        ))}

        {/* Placing signature preview */}
        {placingSignature && (
          <div
            className="absolute opacity-60 border-2 border-dashed border-blue-500 pointer-events-none"
            style={{
              width: placingSignature.width * zoom,
              height: placingSignature.height * zoom,
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-blue-600 text-sm">
              Click to place
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Advanced Signature Creator Component
interface AdvancedSignatureCreatorProps {
  type: "draw" | "type" | "upload" | "date" | "text";
  onComplete: (data: string, text?: string, saveAsTemplate?: boolean) => void;
  onCancel: () => void;
}

const AdvancedSignatureCreator: React.FC<AdvancedSignatureCreatorProps> = ({
  type,
  onComplete,
  onCancel,
}) => {
  const [signatureText, setSignatureText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [selectedFont, setSelectedFont] = useState("serif");
  const [selectedStyle, setSelectedStyle] = useState("normal");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);

  const fonts = [
    { value: "serif", label: "Serif", family: "serif" },
    { value: "sans-serif", label: "Sans Serif", family: "sans-serif" },
    { value: "cursive", label: "Cursive", family: "cursive" },
    { value: "monospace", label: "Monospace", family: "monospace" },
  ];

  const styles = [
    { value: "normal", label: "Normal" },
    { value: "italic", label: "Italic" },
    { value: "bold", label: "Bold" },
    { value: "bold-italic", label: "Bold Italic" },
  ];

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.strokeStyle = strokeColor;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = () => {
    if (type === "draw") {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL();
        onComplete(dataURL, "", saveAsTemplate);
      }
    } else if (type === "type" && signatureText.trim()) {
      onComplete("", signatureText.trim(), saveAsTemplate);
    } else if (type === "upload" && uploadedImage) {
      onComplete(uploadedImage, "", saveAsTemplate);
    }
  };

  const canComplete = () => {
    if (type === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return imageData.data.some((channel) => channel !== 0);
    } else if (type === "type") {
      return signatureText.trim().length > 0;
    } else if (type === "upload") {
      return uploadedImage !== null;
    }
    return false;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {type === "draw" && "Draw Your Signature"}
            {type === "type" && "Create Typed Signature"}
            {type === "upload" && "Upload Signature Image"}
          </h2>
          <p className="text-gray-600 text-lg">
            {type === "draw" &&
              "Use your mouse or touch to draw your signature"}
            {type === "type" &&
              "Enter your name to create a professional typed signature"}
            {type === "upload" && "Upload an image file of your signature"}
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          {type === "draw" && (
            <div className="space-y-6">
              {/* Drawing controls */}
              <div className="flex items-center justify-center space-x-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Color:
                  </label>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Thickness:
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">{strokeWidth}px</span>
                </div>
                <Button variant="outline" onClick={clearCanvas}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>

              {/* Drawing canvas */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={250}
                  className="w-full border-2 border-gray-400 rounded-lg bg-white cursor-crosshair shadow-inner"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <p className="text-center text-sm text-gray-600 mt-3">
                  Draw your signature in the box above
                </p>
              </div>
            </div>
          )}

          {type === "type" && (
            <div className="space-y-6">
              {/* Typography controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    {fonts.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    {styles.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl"
                />
              </div>

              {/* Preview */}
              {signatureText && (
                <div className="bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Preview:
                  </p>
                  <div
                    className="text-center"
                    style={{
                      fontFamily: fonts.find((f) => f.value === selectedFont)
                        ?.family,
                      fontSize: "3rem",
                      fontWeight: selectedStyle.includes("bold")
                        ? "bold"
                        : "normal",
                      fontStyle: selectedStyle.includes("italic")
                        ? "italic"
                        : "normal",
                      color: "#1f2937",
                    }}
                  >
                    {signatureText}
                  </div>
                </div>
              )}
            </div>
          )}

          {type === "upload" && (
            <div className="space-y-6">
              <FileUpload
                onFilesSelect={handleImageUpload}
                accept="image/*"
                multiple={false}
                maxSize={5}
                allowedTypes={["image"]}
                uploadText="Upload signature image"
                supportText="PNG, JPG, SVG supported • Max 5MB • Transparent backgrounds work best"
              />
              {uploadedImage && (
                <div className="bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Preview:
                  </p>
                  <img
                    src={uploadedImage}
                    alt="Signature preview"
                    className="max-w-full h-auto max-h-48 mx-auto shadow-lg rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save as template option */}
        <div className="flex items-center justify-center mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Save as template for future use
            </span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={onCancel} className="px-8 py-3">
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!canComplete()}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700"
          >
            {saveAsTemplate ? "Save & Use Signature" : "Use This Signature"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Signature Properties Panel Component
interface SignaturePropertiesPanelProps {
  signature: SignatureData;
  onUpdate: (updates: Partial<SignatureData>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveLayer: (direction: "up" | "down") => void;
}

const SignaturePropertiesPanel: React.FC<SignaturePropertiesPanelProps> = ({
  signature,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveLayer,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Properties</h3>

      {/* Position and size */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              X Position
            </label>
            <input
              type="number"
              value={Math.round(signature.x)}
              onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Y Position
            </label>
            <input
              type="number"
              value={Math.round(signature.y)}
              onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Width
            </label>
            <input
              type="number"
              value={Math.round(signature.width)}
              onChange={(e) =>
                onUpdate({ width: parseInt(e.target.value) || 50 })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Height
            </label>
            <input
              type="number"
              value={Math.round(signature.height)}
              onChange={(e) =>
                onUpdate({ height: parseInt(e.target.value) || 20 })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Rotation and opacity */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Rotation (degrees)
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={signature.rotation}
            onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-xs text-gray-600 text-center">
            {signature.rotation}°
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Opacity
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={signature.opacity}
            onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
          <div className="text-xs text-gray-600 text-center">
            {Math.round(signature.opacity * 100)}%
          </div>
        </div>
      </div>

      {/* Color and styling */}
      {(signature.type === "type" ||
        signature.type === "text" ||
        signature.type === "date") && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Text Color
            </label>
            <input
              type="color"
              value={signature.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-full h-8 rounded border border-gray-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Font Size
            </label>
            <input
              type="number"
              value={signature.fontSize || 18}
              onChange={(e) =>
                onUpdate({ fontSize: parseInt(e.target.value) || 18 })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      )}

      {/* Layer controls */}
      <div className="border-t pt-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Layer Order
        </label>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMoveLayer("up")}
            className="flex-1"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMoveLayer("down")}
            className="flex-1"
          >
            <Minus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdate({ locked: !signature.locked })}
            className={cn(
              "flex-1",
              signature.locked && "bg-red-50 border-red-300 text-red-700",
            )}
          >
            <Lock className="w-3 h-3 mr-1" />
            {signature.locked ? "Unlock" : "Lock"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdate({ visible: !signature.visible })}
            className="flex-1"
          >
            {signature.visible ? (
              <Eye className="w-3 h-3 mr-1" />
            ) : (
              <EyeOff className="w-3 h-3 mr-1" />
            )}
            {signature.visible ? "Hide" : "Show"}
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          className="w-full"
        >
          <Copy className="w-3 h-3 mr-1" />
          Duplicate
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};

// Template Library Component
interface TemplateLibraryProps {
  templates: SignatureTemplate[];
  onSelect: (template: SignatureTemplate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  onSelect,
  onDelete,
  onClose,
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Signature Templates
          </h2>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            Close
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No templates yet
            </h3>
            <p className="text-gray-600">
              Create signatures and save them as templates for quick reuse
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => onSelect(template)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 truncate">
                    {template.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(template.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="bg-gray-100 rounded-md p-3 h-20 flex items-center justify-center">
                  {template.type === "type" || template.type === "text" ? (
                    <span className="text-lg font-serif text-gray-700">
                      {template.text}
                    </span>
                  ) : (
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>

                <div className="mt-2 flex items-center text-xs text-gray-500">
                  {template.type === "draw" && (
                    <PenTool className="w-3 h-3 mr-1" />
                  )}
                  {template.type === "type" && (
                    <Type className="w-3 h-3 mr-1" />
                  )}
                  {template.type === "upload" && (
                    <ImageIcon className="w-3 h-3 mr-1" />
                  )}
                  <span className="capitalize">{template.type} signature</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignPdf;
