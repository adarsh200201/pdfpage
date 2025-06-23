import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import PDFViewer from "@/components/ui/pdf-viewer";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  PenTool,
  Type,
  Upload,
  Crown,
  Star,
  Eye,
  EyeOff,
} from "lucide-react";

const SignPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [signatureType, setSignatureType] = useState<
    "draw" | "type" | "upload"
  >("draw");
  const [signatureText, setSignatureText] = useState("");
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signaturePosition, setSignaturePosition] = useState({
    x: 100,
    y: 200,
    page: 1,
    width: 150,
    height: 50,
  });
  const [signedFile, setSignedFile] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      const selectedFile = uploadedFiles[0];
      setFile(selectedFile);
      setIsComplete(false);
      setSignedFile(null);

      try {
        const { loadPDFDocument } = await import("@/lib/pdf-utils");
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await loadPDFDocument(arrayBuffer);
        setPdfPages(pdfDoc.getPageCount());

        toast({
          title: "PDF loaded successfully",
          description: `Document has ${pdfDoc.getPageCount()} page(s)`,
        });
      } catch (error) {
        console.error("Error reading PDF:", error);
        setPdfPages(1);
      }
    }
  };

  const handleSignatureImageUpload = (uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      setSignatureImage(uploadedFiles[0]);
      toast({
        title: "Signature image uploaded",
        description: "Your signature image is ready to be added to the PDF",
      });
      setTimeout(() => updateSignaturePreview(), 100);
    }
  };

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
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000000";
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setTimeout(() => updateSignaturePreview(), 100);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignaturePreview(null);
  };

  const updateSignaturePreview = () => {
    if (signatureType === "draw") {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL();
        setSignaturePreview(dataURL);
      }
    } else if (signatureType === "type" && signatureText) {
      setSignaturePreview(signatureText);
    } else if (signatureType === "upload" && signatureImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSignaturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(signatureImage);
    }
  };

  const handleSignPdf = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to sign.",
        variant: "destructive",
      });
      return;
    }

    if (signatureType === "type" && !signatureText.trim()) {
      toast({
        title: "No signature text",
        description: "Please enter your signature text.",
        variant: "destructive",
      });
      return;
    }

    if (signatureType === "upload" && !signatureImage) {
      toast({
        title: "No signature image",
        description: "Please upload a signature image.",
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
        title: `🔄 Adding signature to ${file.name}...`,
        description: "Processing PDF with your signature",
      });

      let signatureData: string | null = null;

      if (signatureType === "draw") {
        const canvas = canvasRef.current;
        if (canvas) {
          signatureData = canvas.toDataURL();
        }
      } else if (signatureType === "upload" && signatureImage) {
        signatureData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(signatureImage);
        });
      }

      const signedPdf = await addSignatureToPdf(file, {
        type: signatureType,
        text: signatureText,
        imageData: signatureData,
        position: signaturePosition,
      });

      const blob = new Blob([signedPdf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setSignedFile({
        name: file.name.replace(/\.pdf$/i, "_signed.pdf"),
        url,
        size: blob.size,
      });
      setIsComplete(true);

      await PDFService.trackUsage("sign-pdf", 1, file.size);

      toast({
        title: "🎉 Signing completed!",
        description: "PDF has been signed successfully.",
      });
    } catch (error) {
      console.error("Error signing PDF:", error);
      toast({
        title: "Signing failed",
        description: "There was an error signing your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addSignatureToPdf = async (
    file: File,
    signature: {
      type: string;
      text?: string;
      imageData?: string | null;
      position: { x: number; y: number; page: number };
    },
  ): Promise<Uint8Array> => {
    console.log("🔄 Adding signature to PDF...");

    try {
      const { loadPDFDocument, getRGBColor, safePDFOperation } = await import(
        "@/lib/pdf-utils"
      );

      return await safePDFOperation(
        async () => {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await loadPDFDocument(arrayBuffer);
          const pages = pdfDoc.getPages();

          if (signature.position.page <= pages.length) {
            const page = pages[signature.position.page - 1];
            const { height } = page.getSize();

            if (signature.type === "type" && signature.text) {
              const rgb = await getRGBColor(0, 0, 0.8);
              page.drawText(signature.text, {
                x: signature.position.x,
                y: height - signature.position.y,
                size: 18,
                color: rgb,
              });
              console.log(`✅ Added text signature: "${signature.text}"`);
            } else if (signature.imageData) {
              try {
                let embeddedImage;
                if (signature.imageData.includes("data:image/png")) {
                  const pngImageBytes = signature.imageData.split(",")[1];
                  const pngBytes = Uint8Array.from(atob(pngImageBytes), (c) =>
                    c.charCodeAt(0),
                  );
                  embeddedImage = await pdfDoc.embedPng(pngBytes);
                } else {
                  const jpgImageBytes = signature.imageData.split(",")[1];
                  const jpgBytes = Uint8Array.from(atob(jpgImageBytes), (c) =>
                    c.charCodeAt(0),
                  );
                  embeddedImage = await pdfDoc.embedJpg(jpgBytes);
                }

                const imageDims = embeddedImage.scale(0.3);

                page.drawImage(embeddedImage, {
                  x: signature.position.x,
                  y: height - signature.position.y - imageDims.height,
                  width: imageDims.width,
                  height: imageDims.height,
                });
                console.log(`✅ Added image signature`);
              } catch (imageError) {
                console.error("Error embedding signature image:", imageError);
                const fallbackRgb = await getRGBColor(0, 0, 0.8);
                page.drawText("Digital Signature", {
                  x: signature.position.x,
                  y: height - signature.position.y,
                  size: 18,
                  color: fallbackRgb,
                });
              }
            }

            const currentDate = new Date().toLocaleDateString();
            const metaRgb = await getRGBColor(0.5, 0.5, 0.5);
            page.drawText(`Signed on: ${currentDate}`, {
              x: signature.position.x,
              y: height - signature.position.y - 30,
              size: 8,
              color: metaRgb,
            });
          }

          pdfDoc.setSubject(`Digitally signed PDF`);
          pdfDoc.setCreator(`PdfPage - PDF Signature Tool`);

          const pdfBytes = await pdfDoc.save();
          console.log(`🎉 PDF signing completed: ${pdfBytes.length} bytes`);

          return pdfBytes;
        },
        undefined,
        "PDF signing",
      );
    } catch (error) {
      console.error("PDF signing failed:", error);
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
    setSignedFile(null);
    setIsComplete(false);
    setSignatureText("");
    setSignatureImage(null);
    clearSignature();
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PenTool className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">Sign PDF</h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Sign your PDF documents with interactive positioning. Create,
            position, and apply digital signatures with ease.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <span className="mr-2">✨</span>
            Interactive positioning with PDF preview!
          </div>
        </div>

        {!isComplete ? (
          <div className="space-y-8">
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

            {file && (
              <div className="space-y-8">
                <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div>
                    <h3 className="text-lg font-semibold text-text-dark">
                      {file.name}
                    </h3>
                    <p className="text-sm text-text-light">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {pdfPages}{" "}
                      page(s)
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`flex items-center space-x-2 ${
                          !showPreview
                            ? "bg-violet-600 hover:bg-violet-700 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span>Hide Preview</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>📄 View PDF & Position Signature</span>
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setFile(null)}>
                        Select Different File
                      </Button>
                    </div>
                    {!showPreview && (
                      <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                        👆 Click to see your PDF and position signature
                        interactively
                      </div>
                    )}
                  </div>
                </div>

                {showPreview && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-text-dark mb-2">
                        📄 PDF Preview & Signature Positioning
                      </h3>
                      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        💡 <strong>How to use:</strong>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>
                            Create your signature below (draw, type, or upload)
                          </li>
                          <li>
                            Click anywhere on the PDF to position your signature
                          </li>
                          <li>Drag the blue box to adjust the position</li>
                          <li>
                            Use the manual controls to fine-tune size and
                            position
                          </li>
                        </ol>
                      </div>
                    </div>
                    <PDFViewer
                      file={file}
                      signaturePosition={signaturePosition}
                      onPositionChange={setSignaturePosition}
                      signaturePreview={signaturePreview}
                      signatureType={signatureType}
                      signatureText={signatureText}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-text-dark mb-4">
                      ✍️ Create Your Signature
                    </h3>

                    <div className="space-y-4 mb-6">
                      <div className="flex space-x-4">
                        {[
                          { value: "draw", label: "Draw", icon: PenTool },
                          { value: "type", label: "Type", icon: Type },
                          { value: "upload", label: "Upload", icon: Upload },
                        ].map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSignatureType(option.value as any);
                                setTimeout(() => updateSignaturePreview(), 100);
                              }}
                              className={`flex items-center px-4 py-2 rounded border ${
                                signatureType === option.value
                                  ? "border-violet-500 bg-violet-50 text-violet-700"
                                  : "border-gray-300 text-gray-700 hover:border-gray-400"
                              }`}
                            >
                              <IconComponent className="w-4 h-4 mr-2" />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>

                      {signatureType === "draw" && (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-text-dark">
                            Draw your signature below:
                          </label>
                          <div className="border border-gray-300 rounded-lg">
                            <canvas
                              ref={canvasRef}
                              width={400}
                              height={150}
                              className="w-full cursor-crosshair rounded-lg"
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              onClick={clearSignature}
                              className="flex-1"
                            >
                              Clear Signature
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowPreview(true)}
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview Position
                            </Button>
                          </div>
                        </div>
                      )}

                      {signatureType === "type" && (
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-2">
                            Type your signature:
                          </label>
                          <input
                            type="text"
                            value={signatureText}
                            onChange={(e) => {
                              setSignatureText(e.target.value);
                              setTimeout(() => updateSignaturePreview(), 100);
                            }}
                            placeholder="Enter your name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-xl font-serif"
                          />
                          {signatureText && (
                            <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                              <p className="text-lg font-serif text-blue-600">
                                {signatureText}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Preview • Click "Show Preview" to position it
                              </p>
                              <Button
                                variant="outline"
                                onClick={() => setShowPreview(true)}
                                className="mt-2 w-full"
                                size="sm"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview Position
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {signatureType === "upload" && (
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-2">
                            Upload signature image:
                          </label>
                          <FileUpload
                            onFilesSelect={handleSignatureImageUpload}
                            accept="image/*"
                            multiple={false}
                            maxSize={5}
                            allowedTypes={["image"]}
                            uploadText="Select signature image"
                            supportText="PNG, JPG supported • Max 5MB"
                          />
                          {signatureImage && (
                            <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                              <p className="text-sm text-green-600 mb-2">
                                ✅ {signatureImage.name} uploaded
                              </p>
                              <Button
                                variant="outline"
                                onClick={() => setShowPreview(true)}
                                className="w-full"
                                size="sm"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview Position
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h4 className="text-md font-semibold text-text-dark mb-4">
                      ⚙️ Position Controls
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Page Number (1-{pdfPages})
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={pdfPages}
                          value={signaturePosition.page}
                          onChange={(e) =>
                            setSignaturePosition({
                              ...signaturePosition,
                              page: Math.min(
                                pdfPages,
                                Math.max(1, parseInt(e.target.value) || 1),
                              ),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-2">
                            Width
                          </label>
                          <input
                            type="number"
                            min="50"
                            max="400"
                            value={Math.round(signaturePosition.width)}
                            onChange={(e) =>
                              setSignaturePosition({
                                ...signaturePosition,
                                width: Math.max(
                                  50,
                                  parseInt(e.target.value) || 150,
                                ),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-2">
                            Height
                          </label>
                          <input
                            type="number"
                            min="20"
                            max="200"
                            value={Math.round(signaturePosition.height)}
                            onChange={(e) =>
                              setSignaturePosition({
                                ...signaturePosition,
                                height: Math.max(
                                  20,
                                  parseInt(e.target.value) || 50,
                                ),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button
                        onClick={handleSignPdf}
                        disabled={
                          isProcessing || (!signaturePreview && !signatureText)
                        }
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Signing PDF...
                          </>
                        ) : (
                          <>
                            <PenTool className="w-4 h-4 mr-2" />
                            Sign PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                Signing Complete!
              </h3>
              <p className="text-text-light">
                Successfully added your digital signature to the PDF
              </p>
            </div>

            {signedFile && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-violet-500" />
                  <div>
                    <p className="font-medium text-text-dark">
                      {signedFile.name}
                    </p>
                    <p className="text-sm text-text-light">
                      {(signedFile.size / 1024 / 1024).toFixed(2)} MB •
                      Digitally Signed
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() =>
                  signedFile && downloadFile(signedFile.url, signedFile.name)
                }
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Signed PDF
              </Button>
              <Button variant="outline" onClick={reset}>
                Sign Another PDF
              </Button>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="register"
      />
    </div>
  );
};

export default SignPdf;
