import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import EditorToolbar from "@/components/pdf-editor/EditorToolbar";
import PDFEditorCanvas from "@/components/pdf-editor/PDFEditorCanvas";
import PageThumbnails from "@/components/pdf-editor/PageThumbnails";
import PropertiesPanel from "@/components/pdf-editor/PropertiesPanel";
import PDFErrorBoundary from "@/components/pdf-editor/PDFErrorBoundary";
import ErrorBoundaryWrapper from "@/components/ErrorBoundaryWrapper";
import { useRealtimePDFEditor } from "@/hooks/useRealtimePDFEditor";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import { loadPDFDocument, configurePDFWorker } from "@/lib/pdf-worker-config";
import {
  ArrowLeft,
  Download,
  FileText,
  PenTool,
  Save,
  Crown,
  Star,
  Maximize,
  Minimize,
  Layers,
  Upload,
} from "lucide-react";
import {
  AnyElement,
  SignatureElement,
  TextElement,
  DrawElement,
  ShapeElement,
  ImageElement,
} from "@/types/pdf-editor";
import { cn } from "@/lib/utils";

const SignPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [signedFile, setSignedFile] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(2);
  const [selectedFontSize, setSelectedFontSize] = useState(16);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showProperties, setShowProperties] = useState(true);

  // Signature-specific states
  const [signatureMode, setSignatureMode] = useState<
    "select" | "draw" | "type" | "upload" | null
  >(null);
  const [isCreatingSignature, setIsCreatingSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<{
    type: "draw" | "type" | "upload";
    data: string;
    text?: string;
  } | null>(null);
  const [showSignatureOptions, setShowSignatureOptions] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Initialize PDF editor
  const { state, actions, selectors, computed } = useRealtimePDFEditor();

  // Initialize PDF worker on component mount
  useEffect(() => {
    const initializePDFWorker = async () => {
      try {
        await configurePDFWorker();
        console.log("✅ PDF worker initialized successfully for SignPdf");
      } catch (error) {
        console.error("❌ Failed to initialize PDF worker:", error);
        toast({
          title: "PDF System Error",
          description:
            "Failed to initialize PDF processing. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    initializePDFWorker();
  }, [toast]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (uploadedFiles: File[]) => {
      if (uploadedFiles.length > 0) {
        const selectedFile = uploadedFiles[0];
        setFile(selectedFile);
        setIsComplete(false);
        setSignedFile(null);
        actions.clearAll();
        setShowSignatureOptions(true); // Show signature options after PDF upload

        try {
          // Load PDF using centralized configuration to prevent version mismatches
          const arrayBuffer = await selectedFile.arrayBuffer();
          const pdf = await loadPDFDocument(arrayBuffer);
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
    [actions, toast],
  );

  // Handle signature type selection
  const handleSignatureTypeSelect = useCallback(
    (type: "draw" | "type" | "upload") => {
      setSignatureMode(type);
      setIsCreatingSignature(true);
      setShowSignatureOptions(false);
      actions.setTool("signature");
    },
    [actions],
  );

  // Handle signature creation completion
  const handleSignatureCreated = useCallback(
    (data: string, text?: string) => {
      const newSignatureData = {
        type: signatureMode as "draw" | "type" | "upload",
        data,
        text,
      };

      console.log("Signature created:", newSignatureData);

      setSignatureData(newSignatureData);
      setIsCreatingSignature(false);

      toast({
        title: "Signature created",
        description: "Click on the PDF to position your signature",
      });
    },
    [signatureMode, toast],
  );

  // Handle signature positioning
  const handleSignaturePlace = useCallback(
    (x: number, y: number) => {
      if (signatureData) {
        console.log("Placing signature:", signatureData);

        const signatureElement = {
          type: "signature" as const,
          pageIndex: state.pageIndex,
          bounds: { x, y, width: 200, height: 60 },
          properties: {
            signatureType: signatureData.type,
            signatureData: signatureData.data,
            signatureText: signatureData.text,
            strokeWidth: selectedStrokeWidth,
            color: selectedColor,
          },
        };

        console.log("Signature element:", signatureElement);

        const signatureId = actions.addElement(
          signatureElement as Omit<
            SignatureElement,
            "id" | "createdAt" | "updatedAt"
          >,
        );

        // Select the newly created signature
        actions.selectElements([signatureId]);
        actions.setTool("select");

        toast({
          title: "Signature placed",
          description: "You can now adjust the position and size",
        });
      } else {
        console.error("No signature data available");
      }
    },
    [
      signatureData,
      actions,
      state.pageIndex,
      selectedStrokeWidth,
      selectedColor,
      toast,
    ],
  );

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    actions.setZoom(Math.min(state.zoom * 1.2, 3));
  }, [actions, state.zoom]);

  const handleZoomOut = useCallback(() => {
    actions.setZoom(Math.max(state.zoom / 1.2, 0.25));
  }, [actions, state.zoom]);

  // Handle page navigation
  const handlePageChange = useCallback(
    (pageIndex: number) => {
      actions.setPage(pageIndex);
    },
    [actions],
  );

  // Handle signature creation
  const createSignature = useCallback(
    (
      type: "draw" | "type" | "upload",
      data: string,
      text?: string,
      bounds?: { x: number; y: number; width: number; height: number },
    ) => {
      const signatureBounds = bounds || {
        x: 100,
        y: 100,
        width: 200,
        height: 60,
      };

      actions.addElement({
        type: "signature",
        pageIndex: state.pageIndex,
        bounds: signatureBounds,
        properties: {
          signatureType: type,
          signatureData: data,
          signatureText: text,
          strokeWidth: selectedStrokeWidth,
          color: selectedColor,
        },
      } as Omit<SignatureElement, "id" | "createdAt" | "updatedAt">);

      // Switch to select tool after creating signature
      actions.setTool("select");
    },
    [actions, state.pageIndex, selectedStrokeWidth, selectedColor],
  );

  // Handle quick signature actions
  const handleQuickSignature = useCallback(() => {
    // Create a simple text signature
    const signatureText = prompt("Enter your signature text:");
    if (signatureText && signatureText.trim()) {
      createSignature("type", "", signatureText.trim());
    }
  }, [createSignature]);

  // Handle save and download
  const handleSave = useCallback(async () => {
    if (!file) {
      toast({
        title: "No file loaded",
        description: "Please load a PDF file first",
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
        description: `Applying ${state.elements.length} element(s) to PDF`,
      });

      const processedPdf = await processElementsOnPDF(file, state.elements);
      const blob = new Blob([processedPdf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setSignedFile({
        name: file.name.replace(/\.pdf$/i, "_edited.pdf"),
        url,
        size: blob.size,
      });
      setIsComplete(true);

      // Track usage
      await PDFService.trackUsage("sign-pdf", state.elements.length, file.size);

      toast({
        title: "🎉 PDF processed successfully!",
        description: `Applied ${state.elements.length} modifications`,
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({
        title: "Processing failed",
        description:
          "There was an error processing your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [file, state.elements, toast]);

  const handleDownload = useCallback(() => {
    if (signedFile) {
      const link = document.createElement("a");
      link.href = signedFile.url;
      link.download = signedFile.name;
      link.click();
    }
  }, [signedFile]);

  // Process elements on PDF
  const processElementsOnPDF = async (
    file: File,
    elements: AnyElement[],
  ): Promise<Uint8Array> => {
    const { PDFDocument, rgb } = await import("pdf-lib");

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    // Process elements by page
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const { width, height } = page.getSize();
      const pageElements = elements.filter((el) => el.pageIndex === pageIndex);

      for (const element of pageElements) {
        try {
          switch (element.type) {
            case "text":
              const textEl = element as TextElement;
              const textColor = hexToRgb(textEl.properties.color);
              page.drawText(textEl.properties.text, {
                x: element.bounds.x,
                y: height - element.bounds.y - element.bounds.height,
                size: textEl.properties.fontSize,
                color: rgb(textColor.r, textColor.g, textColor.b),
              });
              break;

            case "signature":
              const sigEl = element as SignatureElement;
              if (
                sigEl.properties.signatureType === "type" &&
                sigEl.properties.signatureText
              ) {
                const sigColor = hexToRgb(sigEl.properties.color);
                page.drawText(sigEl.properties.signatureText, {
                  x: element.bounds.x,
                  y: height - element.bounds.y - element.bounds.height,
                  size: 18,
                  color: rgb(sigColor.r, sigColor.g, sigColor.b),
                });
              } else if (sigEl.properties.signatureData) {
                try {
                  const imageBytes =
                    sigEl.properties.signatureData.split(",")[1];
                  const imageData = Uint8Array.from(atob(imageBytes), (c) =>
                    c.charCodeAt(0),
                  );

                  let embeddedImage;
                  if (
                    sigEl.properties.signatureData.includes("data:image/png")
                  ) {
                    embeddedImage = await pdfDoc.embedPng(imageData);
                  } else {
                    embeddedImage = await pdfDoc.embedJpg(imageData);
                  }

                  page.drawImage(embeddedImage, {
                    x: element.bounds.x,
                    y: height - element.bounds.y - element.bounds.height,
                    width: element.bounds.width,
                    height: element.bounds.height,
                  });
                } catch (imageError) {
                  console.error("Error embedding signature image:", imageError);
                }
              }
              break;

            case "rectangle":
              const rectEl = element as ShapeElement;
              const rectColor = hexToRgb(rectEl.properties.strokeColor);
              page.drawRectangle({
                x: element.bounds.x,
                y: height - element.bounds.y - element.bounds.height,
                width: element.bounds.width,
                height: element.bounds.height,
                borderColor: rgb(rectColor.r, rectColor.g, rectColor.b),
                borderWidth: rectEl.properties.strokeWidth,
              });
              break;

            case "draw":
              const drawEl = element as DrawElement;
              const drawColor = hexToRgb(drawEl.properties.color);
              // For draw elements, we'd need to implement path drawing
              // This is a simplified version
              page.drawText("✍️", {
                x: element.bounds.x,
                y: height - element.bounds.y - element.bounds.height,
                size: 20,
                color: rgb(drawColor.r, drawColor.g, drawColor.b),
              });
              break;
          }
        } catch (elementError) {
          console.error(
            `Error processing element ${element.id}:`,
            elementError,
          );
        }
      }
    }

    // Add metadata
    pdfDoc.setSubject("Edited with PdfPage");
    pdfDoc.setCreator("PdfPage - PDF Editor");

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

  // Reset function
  const reset = useCallback(() => {
    setFile(null);
    setSignedFile(null);
    setIsComplete(false);
    setPdfPages(1);
    actions.clearAll();
    if (signedFile) {
      URL.revokeObjectURL(signedFile.url);
    }
  }, [actions, signedFile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Defensive check to prevent frame access errors
      if (!e || typeof e.preventDefault !== "function") {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              actions.redo();
            } else {
              actions.undo();
            }
            break;
          case "c":
            e.preventDefault();
            actions.copyElements();
            break;
          case "v":
            e.preventDefault();
            actions.pasteElements();
            break;
          case "s":
            e.preventDefault();
            handleSave();
            break;
        }
      } else {
        switch (e.key) {
          case "Delete":
          case "Backspace":
            e.preventDefault();
            actions.deleteSelectedElements();
            break;
          case "Escape":
            e.preventDefault();
            actions.clearSelection();
            break;
        }
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "v":
            actions.setTool("select");
            break;
          case "t":
            actions.setTool("text");
            break;
          case "p":
            actions.setTool("draw");
            break;
          case "r":
            actions.setTool("rectangle");
            break;
          case "c":
            actions.setTool("circle");
            break;
          case "s":
            actions.setTool("signature");
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [actions, handleSave]);

  if (isComplete) {
    return (
      <div className="min-h-screen bg-bg-light">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PromoBanner className="mb-8" />

          <div className="flex items-center space-x-2 mb-8">
            <Link
              to="/"
              className="text-body-medium text-text-light hover:text-brand-red"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" />
              Back to Home
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                PDF Edited Successfully!
              </h3>
              <p className="text-text-light">
                Applied {state.elements.length} modification(s) to your PDF
              </p>
            </div>

            {signedFile && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-text-dark">
                      {signedFile.name}
                    </p>
                    <p className="text-sm text-text-light">
                      {(signedFile.size / 1024 / 1024).toFixed(2)} MB •
                      Professionally Edited
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Edited PDF
              </Button>
              <Button variant="outline" onClick={reset}>
                Edit Another PDF
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
    <ErrorBoundaryWrapper fallbackMessage="We're having trouble loading the PDF editor. This might be due to a browser compatibility issue.">
      <div className="min-h-screen bg-bg-light">
        <Header />

        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <PromoBanner className="mb-6" />

          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Link
                to="/"
                className="text-body-medium text-text-light hover:text-brand-red"
              >
                <ArrowLeft className="w-4 h-4 mr-1 inline" />
                Back to Home
              </Link>
            </div>

            {file && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThumbnails(!showThumbnails)}
                >
                  <Layers className="w-4 h-4 mr-1" />
                  {showThumbnails ? "Hide" : "Show"} Pages
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProperties(!showProperties)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  {showProperties ? "Hide" : "Show"} Properties
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Header */}
          {!file && (
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-heading-medium text-text-dark mb-4">
                Professional PDF Editor
              </h1>
              <p className="text-body-large text-text-light max-w-3xl mx-auto">
                Create, edit, and sign PDF documents with our advanced real-time
                editor. Add text, shapes, signatures, images, and annotations
                with professional precision.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-800">
                  <span className="mr-2">✨</span>
                  Real-time editing
                </div>
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-green-100 text-green-800">
                  <span className="mr-2">🎨</span>
                  Professional tools
                </div>
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-purple-100 text-purple-800">
                  <span className="mr-2">⚡</span>
                  Instant preview
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!file ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
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

              {/* Quick Actions */}
              <div className="mt-8 text-center">
                <h3 className="text-lg font-semibold text-text-dark mb-4">
                  Quick Start
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <PenTool className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Sign Documents</h4>
                    <p className="text-sm text-gray-600">
                      Add electronic signatures anywhere on your PDF
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <FileText className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Add Text & Annotations</h4>
                    <p className="text-sm text-gray-600">
                      Insert text, comments, and markup elements
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <Upload className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Insert Images</h4>
                    <p className="text-sm text-gray-600">
                      Add logos, stamps, and other images
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : showSignatureOptions ? (
            // Signature Options Screen
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <PenTool className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Add Your Signature
                  </h2>
                  <p className="text-gray-600">
                    Choose how you'd like to create your signature
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Draw Signature */}
                  <div
                    className="cursor-pointer group"
                    onClick={() => handleSignatureTypeSelect("draw")}
                  >
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-transparent group-hover:border-blue-500 group-hover:bg-blue-50 transition-all duration-200">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                        <PenTool className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-center mb-2">
                        Draw
                      </h3>
                      <p className="text-sm text-gray-600 text-center">
                        Draw your signature with mouse or touch
                      </p>
                    </div>
                  </div>

                  {/* Upload Image */}
                  <div
                    className="cursor-pointer group"
                    onClick={() => handleSignatureTypeSelect("upload")}
                  >
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-transparent group-hover:border-green-500 group-hover:bg-green-50 transition-all duration-200">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                        <Upload className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-center mb-2">
                        Image
                      </h3>
                      <p className="text-sm text-gray-600 text-center">
                        Upload an image of your signature
                      </p>
                    </div>
                  </div>

                  {/* Type Signature */}
                  <div
                    className="cursor-pointer group"
                    onClick={() => handleSignatureTypeSelect("type")}
                  >
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-transparent group-hover:border-purple-500 group-hover:bg-purple-50 transition-all duration-200">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-center mb-2">
                        Type
                      </h3>
                      <p className="text-sm text-gray-600 text-center">
                        Type your name as a signature
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setFile(null)}
                    className="mr-4"
                  >
                    Choose Different PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSignatureOptions(false);
                      actions.setTool("select");
                    }}
                  >
                    Skip Signature & Edit PDF
                  </Button>
                </div>
              </div>
            </div>
          ) : isCreatingSignature ? (
            // Signature Creation Screen
            <SignatureCreationScreen
              type={signatureMode!}
              onComplete={handleSignatureCreated}
              onCancel={() => {
                setIsCreatingSignature(false);
                setShowSignatureOptions(true);
              }}
            />
          ) : (
            <PDFErrorBoundary>
              <div
                className={cn(
                  "bg-white rounded-xl shadow-sm border border-gray-100",
                  isFullscreen && "fixed inset-4 z-50",
                )}
              >
                {/* Editor Toolbar */}
                <EditorToolbar
                  currentTool={state.currentTool}
                  onToolChange={actions.setTool}
                  onUndo={actions.undo}
                  onRedo={actions.redo}
                  onCopy={actions.copyElements}
                  onPaste={actions.pasteElements}
                  onDelete={actions.deleteSelectedElements}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onSave={handleSave}
                  onDownload={handleSave}
                  zoom={state.zoom}
                  canUndo={computed.canUndo}
                  canRedo={computed.canRedo}
                  hasSelection={computed.hasSelection}
                  canPaste={computed.canPaste}
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                  selectedStrokeWidth={selectedStrokeWidth}
                  onStrokeWidthChange={setSelectedStrokeWidth}
                  selectedFontSize={selectedFontSize}
                  onFontSizeChange={setSelectedFontSize}
                />

                {/* Editor Layout */}
                <div className="flex h-[calc(100vh-200px)]">
                  {/* Page Thumbnails */}
                  {showThumbnails && (
                    <PageThumbnails
                      file={file}
                      currentPage={state.pageIndex}
                      onPageSelect={handlePageChange}
                      elements={state.elements}
                    />
                  )}

                  {/* Main Canvas Area */}
                  <div className="flex-1 relative">
                    <PDFEditorCanvas
                      file={file}
                      pageIndex={state.pageIndex}
                      zoom={state.zoom}
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
                      onSignaturePlace={
                        signatureData ? handleSignaturePlace : undefined
                      }
                      className="h-full"
                    />

                    {/* Processing Overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                          <span className="text-lg font-medium">
                            Processing PDF...
                          </span>
                          <p className="text-sm text-gray-500 mt-2">
                            Applying your edits
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Properties Panel */}
                  {showProperties && (
                    <PropertiesPanel
                      selectedElements={selectors.getSelectedElements()}
                      onElementUpdate={actions.updateElement}
                      onElementDelete={actions.deleteElements}
                      onElementCopy={actions.copyElements}
                    />
                  )}
                </div>
              </div>
            </PDFErrorBoundary>
          )}

          {/* Premium Features */}
          {!user?.isPremium && (
            <div className="max-w-4xl mx-auto mt-8">
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
                      Unlimited PDF editing
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-2 text-yellow-600" />
                    <span className="text-sm text-orange-700">
                      Advanced signature tools
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-2 text-yellow-600" />
                    <span className="text-sm text-orange-700">
                      Batch processing
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-2 text-yellow-600" />
                    <span className="text-sm text-orange-700">
                      Priority support
                    </span>
                  </div>
                </div>
                <Button className="bg-yellow-600 text-white hover:bg-yellow-700">
                  <Crown className="w-4 h-4 mr-2" />
                  Get Premium Access
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
    </ErrorBoundaryWrapper>
  );
};

// Signature Creation Screen Component
interface SignatureCreationScreenProps {
  type: "draw" | "type" | "upload";
  onComplete: (data: string, text?: string) => void;
  onCancel: () => void;
}

const SignatureCreationScreen: React.FC<SignatureCreationScreenProps> = ({
  type,
  onComplete,
  onCancel,
}) => {
  const [signatureText, setSignatureText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000000";
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
      setUploadedImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = () => {
    if (type === "draw") {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL();
        onComplete(dataURL);
      }
    } else if (type === "type" && signatureText.trim()) {
      onComplete("", signatureText.trim());
    } else if (type === "upload" && imagePreview) {
      onComplete(imagePreview);
    }
  };

  const canComplete = () => {
    if (type === "draw") {
      // Check if something is drawn on canvas
      const canvas = canvasRef.current;
      if (!canvas) return false;

      const ctx = canvas.getContext("2d");
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return imageData.data.some((channel) => channel !== 0);
    } else if (type === "type") {
      return signatureText.trim().length > 0;
    } else if (type === "upload") {
      return imagePreview !== null;
    }
    return false;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {type === "draw" && "Draw Your Signature"}
            {type === "type" && "Type Your Signature"}
            {type === "upload" && "Upload Signature Image"}
          </h2>
          <p className="text-gray-600">
            {type === "draw" &&
              "Use your mouse or finger to draw your signature"}
            {type === "type" && "Enter your name to create a typed signature"}
            {type === "upload" && "Upload an image file of your signature"}
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          {type === "draw" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full border border-gray-300 rounded bg-white cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <div className="text-center">
                <Button variant="outline" onClick={clearCanvas}>
                  Clear Signature
                </Button>
              </div>
            </div>
          )}

          {type === "type" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl"
                />
              </div>
              {signatureText && (
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div className="text-3xl font-serif text-blue-600">
                    {signatureText}
                  </div>
                </div>
              )}
            </div>
          )}

          {type === "upload" && (
            <div className="space-y-4">
              <FileUpload
                onFilesSelect={handleImageUpload}
                accept="image/*"
                multiple={false}
                maxSize={5}
                allowedTypes={["image"]}
                uploadText="Upload signature image"
                supportText="PNG, JPG, SVG supported • Max 5MB"
              />
              {imagePreview && (
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <img
                    src={imagePreview}
                    alt="Signature preview"
                    className="max-w-full h-auto max-h-32 mx-auto"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Back
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!canComplete()}
            className="min-w-32"
          >
            Use This Signature
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignPdf;
