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
import { AdvancedSignatureCreator } from "@/components/pdf-editor/AdvancedSignatureCreator";
import { TemplateLibrary } from "@/components/pdf-editor/TemplateLibrary";
import { SignaturePropertiesPanel } from "@/components/pdf-editor/SignaturePropertiesPanel";
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
  Sparkles,
  Wand2,
  Zap,
  Monitor,
  Smartphone,
  Tablet,
  Layout,
  Maximize,
  MoreHorizontal,
  ChevronDown,
  BookOpen,
  Target,
  Shield,
  Rocket,
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
  const [zoom, setZoom] = useState(1.44);
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
  const [sidebarTab, setSidebarTab] = useState<"signatures" | "templates" | "settings">("signatures");
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

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
        setZoom(1.44);

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
        title: "✨ Signature created",
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
      title: "🎯 Signature placed",
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
        title: "📋 Signature duplicated",
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
        title: "🗑️ Signature removed",
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
  const handleZoomReset = () => setZoom(1.44);

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
    setZoom(1.44);
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

  // Success screen with celebration design
  if (isComplete && signedFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <Header />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PromoBanner className="mb-8" />

          <div className="flex items-center space-x-2 mb-8">
            <Link
              to="/"
              className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
          </div>

          {/* Celebration Card */}
          <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-200/20 to-transparent rounded-full transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full transform -translate-x-48 translate-y-48"></div>
            
            <div className="relative p-8 lg:p-12">
              <div className="text-center mb-8">
                <div className="relative mx-auto mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Check className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-emerald-700 to-blue-700 bg-clip-text text-transparent mb-3">
                  🎉 PDF Signed Successfully!
                </h3>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Your document has been digitally signed with {signatures.filter((s) => s.visible).length} professional signature{signatures.filter((s) => s.visible).length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* File Info Card */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-1">
                        {signedFile.name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          {(signedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="flex items-center">
                          <Shield className="w-4 h-4 mr-1" />
                          Digitally Secured
                        </span>
                        <span className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {signatures.filter((s) => s.visible).length} Signatures
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleDownload}
                  className="h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 hover:from-emerald-700 hover:via-emerald-800 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Download className="w-5 h-5 mr-3" />
                  Download Signed PDF
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="h-14 text-lg font-semibold border-2 hover:bg-gray-50 transition-all duration-300"
                >
                  <RotateCcw className="w-5 h-5 mr-3" />
                  Sign Another PDF
                </Button>
              </div>

              {/* Success Stats */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/50 rounded-xl border border-gray-100">
                  <div className="text-2xl font-bold text-emerald-600">{signatures.filter((s) => s.visible).length}</div>
                  <div className="text-sm text-gray-600">Signatures Added</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl border border-gray-100">
                  <div className="text-2xl font-bold text-blue-600">{pdfPages}</div>
                  <div className="text-sm text-gray-600">Pages Processed</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl border border-gray-100">
                  <div className="text-2xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-gray-600">Security Level</div>
                </div>
              </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Header />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PromoBanner className="mb-6" />

        {/* Hero Section - only show when no file is uploaded */}
        {!file && (
          <div className="text-center mb-16">
            <div className="relative mb-8">
              <div className="w-28 h-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <PenTool className="w-14 h-14 text-white" />
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-6">
              Professional PDF Signing
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
              Create, place, and manage digital signatures with precision. 
              <span className="font-semibold text-blue-700"> Professional tools</span> for 
              <span className="font-semibold text-indigo-700"> modern workflows</span>.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <div className="inline-flex items-center px-6 py-3 rounded-full text-sm bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 font-semibold shadow-md">
                <PenTool className="w-4 h-4 mr-2" />
                Draw & Upload Signatures
              </div>
              <div className="inline-flex items-center px-6 py-3 rounded-full text-sm bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 font-semibold shadow-md">
                <Wand2 className="w-4 h-4 mr-2" />
                Advanced Styling
              </div>
              <div className="inline-flex items-center px-6 py-3 rounded-full text-sm bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 font-semibold shadow-md">
                <Move className="w-4 h-4 mr-2" />
                Drag & Resize
              </div>
              <div className="inline-flex items-center px-6 py-3 rounded-full text-sm bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 font-semibold shadow-md">
                <Star className="w-4 h-4 mr-2" />
                Template Library
              </div>
            </div>

            {/* Upload Section */}
            <div className="max-w-4xl mx-auto">
              <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
                <div className="relative p-8 lg:p-12">
                  <FileUpload
                    onFilesSelect={handleFileUpload}
                    accept=".pdf"
                    multiple={false}
                    maxSize={50}
                    allowedTypes={["pdf"]}
                    uploadText="Drop your PDF here or click to browse"
                    supportText="Support for PDF files up to 50MB • Your files are processed securely"
                  />
                </div>
              </div>


            </div>
          </div>
        )}

        {/* Conditional Content */}
        {showSignatureCreator ? (
          // Signature Creator Modal
          <AdvancedSignatureCreator
            type={signatureMode!}
            onComplete={handleSignatureComplete}
            onCancel={() => {
              setShowSignatureCreator(false);
              setSignatureMode(null);
            }}
          />
        ) : showTemplateLibrary ? (
          // Template Library Modal
          <TemplateLibrary
            templates={signatureTemplates}
            onSelect={handleTemplateSelect}
            onDelete={(id) =>
              saveTemplates(signatureTemplates.filter((t) => t.id !== id))
            }
            onClose={() => setShowTemplateLibrary(false)}
          />
        ) : (
          // Main Editor Interface
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar */}
            <div className="lg:w-80 space-y-6">
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Link
                  to="/"
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </div>

              {/* Signature Tools Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                  <h3 className="text-xl font-bold flex items-center">
                    <Wand2 className="w-5 h-5 mr-2" />
                    Signature Tools
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">Create and manage your signatures</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Tab Navigation */}
                  <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setSidebarTab("signatures")}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                        sidebarTab === "signatures"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900",
                      )}
                    >
                      <PenTool className="w-4 h-4 mx-auto mb-1" />
                      Create
                    </button>
                    <button
                      onClick={() => setSidebarTab("templates")}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                        sidebarTab === "templates"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900",
                      )}
                    >
                      <BookOpen className="w-4 h-4 mx-auto mb-1" />
                      Library
                    </button>
                    <button
                      onClick={() => setSidebarTab("settings")}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                        sidebarTab === "settings"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900",
                      )}
                    >
                      <Settings className="w-4 h-4 mx-auto mb-1" />
                      Settings
                    </button>
                  </div>

                  {/* Create Signatures Tab */}
                  {sidebarTab === "signatures" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleCreateSignature("draw")}
                          variant="outline"
                          className="h-20 flex-col space-y-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <PenTool className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-xs font-medium">Draw</span>
                        </Button>
                        <Button
                          onClick={() => handleCreateSignature("type")}
                          variant="outline"
                          className="h-20 flex-col space-y-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Type className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-xs font-medium">Type</span>
                        </Button>
                        <Button
                          onClick={() => handleCreateSignature("upload")}
                          variant="outline"
                          className="h-20 flex-col space-y-2 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="text-xs font-medium">Upload</span>
                        </Button>
                        <Button
                          onClick={() => setShowTemplateLibrary(true)}
                          variant="outline"
                          className="h-20 flex-col space-y-2 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                        >
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Star className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="text-xs font-medium">Templates</span>
                        </Button>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-sm">Quick Add</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleCreateSignature("date")}
                            variant="outline"
                            size="sm"
                            className="justify-start hover:bg-yellow-50"
                          >
                            <Calendar className="w-3 h-3 mr-2 text-yellow-600" />
                            Date
                          </Button>
                          <Button
                            onClick={() => handleCreateSignature("text")}
                            variant="outline"
                            size="sm"
                            className="justify-start hover:bg-indigo-50"
                          >
                            <Type className="w-3 h-3 mr-2 text-indigo-600" />
                            Text
                          </Button>
                        </div>
                      </div>

                      {/* Current Page Signatures */}
                      {currentPageSignatures.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              Page {currentPage} Signatures
                            </h4>
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                              {currentPageSignatures.length}
                            </span>
                          </div>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {currentPageSignatures.map((sig) => (
                              <div
                                key={sig.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                  selectedSignatureId === sig.id
                                    ? "bg-blue-50 border-blue-300 shadow-sm"
                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100",
                                )}
                                onClick={() => handleSignatureSelect(sig.id)}
                              >
                                <div className="flex items-center min-w-0 space-x-2">
                                  {sig.type === "draw" && (
                                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <PenTool className="w-3 h-3 text-blue-600" />
                                    </div>
                                  )}
                                  {sig.type === "type" && (
                                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                                      <Type className="w-3 h-3 text-green-600" />
                                    </div>
                                  )}
                                  {sig.type === "upload" && (
                                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                                      <ImageIcon className="w-3 h-3 text-purple-600" />
                                    </div>
                                  )}
                                  {sig.type === "date" && (
                                    <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                                      <Calendar className="w-3 h-3 text-yellow-600" />
                                    </div>
                                  )}
                                  {sig.type === "text" && (
                                    <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                                      <FileText className="w-3 h-3 text-indigo-600" />
                                    </div>
                                  )}
                                  <span className="truncate text-sm font-medium">
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
                                    className="p-1 hover:bg-white rounded-lg transition-colors"
                                  >
                                    {sig.visible ? (
                                      <Eye className="w-3 h-3 text-gray-500" />
                                    ) : (
                                      <EyeOff className="w-3 h-3 text-gray-400" />
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSignature(sig.id);
                                    }}
                                    className="p-1 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        {signatures.filter((s) => s.visible).length > 0 && (
                          <Button
                            onClick={handleSavePdf}
                            disabled={isProcessing}
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg font-semibold"
                          >
                            {isProcessing ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                                Processing...
                              </div>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-3" />
                                Sign & Download PDF
                                <Rocket className="w-4 h-4 ml-2" />
                              </>
                            )}
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

                  {/* Templates Tab */}
                  {sidebarTab === "templates" && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Manage your saved signature templates
                      </p>
                      <Button
                        onClick={() => setShowTemplateLibrary(true)}
                        className="w-full"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Open Template Library
                      </Button>
                    </div>
                  )}

                  {/* Settings Tab */}
                  {sidebarTab === "settings" && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 text-sm">View Options</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Show Grid</span>
                            <button
                              onClick={() => setShowGrid(!showGrid)}
                              className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                showGrid ? "bg-blue-600" : "bg-gray-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                  showGrid ? "translate-x-6" : "translate-x-1"
                                )}
                              />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Snap to Grid</span>
                            <button
                              onClick={() => setSnapToGrid(!snapToGrid)}
                              className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                snapToGrid ? "bg-blue-600" : "bg-gray-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                  snapToGrid ? "translate-x-6" : "translate-x-1"
                                )}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 text-sm">Preview Mode</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setViewMode("desktop")}
                            className={cn(
                              "p-3 rounded-lg border text-center transition-all",
                              viewMode === "desktop"
                                ? "bg-blue-50 border-blue-300 text-blue-700"
                                : "border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            <Monitor className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-xs font-medium">Desktop</span>
                          </button>
                          <button
                            onClick={() => setViewMode("tablet")}
                            className={cn(
                              "p-3 rounded-lg border text-center transition-all",
                              viewMode === "tablet"
                                ? "bg-blue-50 border-blue-300 text-blue-700"
                                : "border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            <Tablet className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-xs font-medium">Tablet</span>
                          </button>
                          <button
                            onClick={() => setViewMode("mobile")}
                            className={cn(
                              "p-3 rounded-lg border text-center transition-all",
                              viewMode === "mobile"
                                ? "bg-blue-50 border-blue-300 text-blue-700"
                                : "border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            <Smartphone className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-xs font-medium">Mobile</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0">
              {/* PDF Viewer Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-full">
                {/* Viewer Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <h3 className="font-bold text-gray-900 flex items-center">
                      <Layout className="w-5 h-5 mr-2 text-blue-600" />
                      PDF Workspace
                    </h3>
                    {placingSignature && (
                      <div className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-xl text-sm font-medium animate-pulse">
                        <Target className="w-4 h-4 mr-2" />
                        Click to place signature
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Zoom Controls */}
                    <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.25}
                        className="h-8 w-8"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                        className="h-8 w-8"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                      >
                        ←
                      </Button>
                      <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                        {currentPage} / {pdfPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pdfPages}
                        className="h-8 w-8"
                      >
                        →
                      </Button>
                    </div>

                    {/* View Options */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant={showGrid ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowGrid(!showGrid)}
                        className="h-8"
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                        className="h-8"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* PDF Canvas */}
                <div className="relative flex-1 overflow-auto bg-gray-50" style={{ height: "calc(100vh - 200px)" }}>
                  <div className="flex items-center justify-center min-h-full p-8">
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
                  </div>

                  {/* Processing overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
                      <div className="text-center p-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Signing Your PDF
                        </h3>
                        <p className="text-gray-600">
                          Adding your signatures with precision and security...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Properties Panel */}
            {showPropertiesPanel && selectedSignature && (
              <div className="lg:w-80">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
                    <h3 className="font-bold flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Signature Properties
                    </h3>
                    <p className="text-purple-100 text-sm mt-1">Customize your signature</p>
                  </div>
                  <div className="p-4">
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
                </div>
              </div>
            )}
          </div>
        )}

        {/* Premium upgrade prompt */}
        {!user?.isPremium && signatures.length > 3 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 border-2 border-yellow-200 rounded-3xl p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-300/20 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-amber-900">
                      Unlock Premium Power
                    </h3>
                    <p className="text-amber-700">Take your PDF signing to the next level</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center bg-white/60 rounded-xl p-3">
                    <Star className="w-5 h-5 mr-3 text-yellow-600" />
                    <span className="text-amber-800 font-medium">
                      Unlimited signatures per document
                    </span>
                  </div>
                  <div className="flex items-center bg-white/60 rounded-xl p-3">
                    <Zap className="w-5 h-5 mr-3 text-yellow-600" />
                    <span className="text-amber-800 font-medium">
                      Advanced signature templates
                    </span>
                  </div>
                  <div className="flex items-center bg-white/60 rounded-xl p-3">
                    <Rocket className="w-5 h-5 mr-3 text-yellow-600" />
                    <span className="text-amber-800 font-medium">
                      Batch document signing
                    </span>
                  </div>
                  <div className="flex items-center bg-white/60 rounded-xl p-3">
                    <Shield className="w-5 h-5 mr-3 text-yellow-600" />
                    <span className="text-amber-800 font-medium">
                      Priority support & updates
                    </span>
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-yellow-600 via-orange-600 to-amber-600 text-white hover:from-yellow-700 hover:via-orange-700 hover:to-amber-700 shadow-lg font-semibold text-lg h-12 px-8">
                  <Crown className="w-5 h-5 mr-3" />
                  Upgrade to Premium
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
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
    <div className="relative inline-block shadow-2xl rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={onCanvasClick}
        onMouseMove={onDrag}
        onMouseUp={onDragEnd}
        className={cn(
          "border-2 border-gray-300 shadow-lg rounded-xl",
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
        {signatures.filter((sig, index, arr) =>
          arr.findIndex(s => s.id === sig.id) === index // Remove duplicates
        ).map((signature) => (
          <div
            key={`signature-${signature.id}-${signature.pageNumber}`}
            style={getSignatureStyle(signature)}
            className="pointer-events-auto group"
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
                className="w-full h-full object-contain rounded-lg"
                draggable={false}
              />
            )}

            {/* Selection handles */}
            {selectedSignatureId === signature.id && !signature.locked && (
              <>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
              </>
            )}
          </div>
        ))}

        {/* Placing signature preview */}
        {placingSignature && (
          <div
            className="absolute opacity-60 border-2 border-dashed border-blue-500 bg-blue-50 pointer-events-none rounded-lg"
            style={{
              width: placingSignature.width * zoom,
              height: placingSignature.height * zoom,
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-blue-600 text-sm font-medium">
              <Target className="w-4 h-4 mr-2" />
              Click to place
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignPdf;
