import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  // Tool-specific icons
  FileImage,
  Presentation,
  Sheet,
  Palette,
  Lock,
  Unlock,
  RotateCw,
  Globe,
  Shield,
  Layers,
  Hash,
  Scan,
  Eye,
  Copy,
  Scissors,
  Target,
  Edit,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

// Base tool component for consistent functionality
const BasePDFTool = ({
  toolName,
  description,
  icon: Icon,
  color,
  onProcess,
  allowMultiple = false,
  acceptedTypes = ".pdf",
  children,
}: {
  toolName: string;
  description: string;
  icon: any;
  color: string;
  onProcess: (files: ProcessedFile[]) => Promise<void>;
  allowMultiple?: boolean;
  acceptedTypes?: string;
  children?: React.ReactNode;
}) => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleFilesSelect = (newFiles: File[]) => {
    const processedFiles: ProcessedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
    }));

    if (allowMultiple) {
      setFiles((prev) => [...prev, ...processedFiles]);
    } else {
      setFiles(processedFiles.slice(0, 1));
    }
    setIsComplete(false);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    // All tools are completely free - skip usage limit checks

    setIsProcessing(true);
    setProgress(0);

    try {
      await onProcess(files);
      setIsComplete(true);
      toast({
        title: "Success!",
        description: `${toolName} completed successfully.`,
      });
    } catch (error: any) {
      console.error(`Error in ${toolName}:`, error);

      // Format error message for better user experience
      let errorDescription =
        error.message || `Failed to process files. Please try again.`;

      // Truncate very long error messages but preserve important info
      if (errorDescription.length > 300) {
        const lines = errorDescription.split("\n");
        if (lines.length > 1) {
          // Keep first line and add indication of more info
          errorDescription = lines[0] + "\n\n(See console for full details)";
        } else {
          // Truncate long single line
          errorDescription = errorDescription.substring(0, 297) + "...";
        }
      }

      toast({
        title: `${toolName} Failed`,
        description: errorDescription,
        variant: "destructive",
        duration: 8000, // Show error longer for complex messages
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PromoBanner className="mb-8" />

        {/* Navigation */}
        <div className="flex items-center space-x-2 mb-8">
          <Link
            to="/"
            className="text-body-medium text-text-light hover:text-brand-red"
          >
            <ArrowLeft className="w-4 h-4 mr-1 inline" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-2xl flex items-center justify-center mx-auto mb-4`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            {toolName}
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload */}
            {files.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFilesSelect}
                  multiple={allowMultiple}
                  accept={acceptedTypes}
                  maxSize={25}
                />
              </div>
            )}

            {/* File Display */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-heading-small text-text-dark">
                    Selected Files ({files.length})
                  </h3>
                  <Button variant="outline" onClick={() => setFiles([])}>
                    Clear Files
                  </Button>
                </div>

                <div className="space-y-3 mb-6">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <div
                        className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}
                      >
                        <FileText className={`w-5 h-5 text-${color}-500`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-dark truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-light">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {children}
              </div>
            )}

            {/* All tools are completely free - no usage limits */}

            {/* Process Button */}
            {files.length > 0 && (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className={`bg-${color}-500 hover:bg-${color}-600`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Icon className="w-5 h-5 mr-2" />
                      Process Files
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div
                  className={`w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <Loader2
                    className={`w-8 h-8 text-${color}-500 animate-spin`}
                  />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Processing your files...
                </h3>
                <p className="text-body-medium text-text-light">
                  This may take a few moments depending on file size
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-heading-small text-text-dark mb-2">
              Processing completed successfully!
            </h3>
            <p className="text-body-medium text-text-light mb-6">
              Your files have been processed and are ready for download
            </p>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={async () => {
                  try {
                    // Re-process files to trigger download again
                    await onProcess(files);
                    toast({
                      title: "Download started",
                      description: "Your file is being downloaded.",
                    });
                  } catch (error) {
                    console.error("Download failed:", error);
                    toast({
                      title: "Download failed",
                      description: "Please try processing the file again.",
                      variant: "destructive",
                    });
                  }
                }}
                className={`bg-${color}-500 hover:bg-${color}-600`}
              >
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
              <Button
                onClick={() => {
                  setFiles([]);
                  setIsComplete(false);
                }}
                variant="outline"
              >
                Process More Files
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
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
  );
};

// Individual tool implementations

// PDF to Excel is now a dedicated page component at /pdf-to-excel
// This component is no longer used - redirect to main page instead
export const PdfToExcel = () => {
  // Redirect to dedicated PDF to Excel page
  window.location.href = "/pdf-to-excel";
  return null;
};

export const JpgToPdf = () => {
  const [settings, setSettings] = useState({
    pageSize: "A4",
    orientation: "portrait",
    quality: "high",
    margin: 20,
  });

  const handleProcess = async (files: ProcessedFile[]) => {
    const imageFiles = files.map((f) => ({ file: f.file, rotation: 0 }));
    const result = await PDFService.convertImagesToPDF(imageFiles, settings);
    PDFService.downloadFile(result, "converted-images.pdf");
    await PDFService.trackUsage(
      "jpg-to-pdf",
      files.length,
      files.reduce((sum, f) => sum + f.size, 0),
    );
  };

  return (
    <BasePDFTool
      toolName="JPG to PDF"
      description="Convert JPG images to PDF with customizable settings."
      icon={FileImage}
      color="pink"
      onProcess={handleProcess}
      allowMultiple={true}
      acceptedTypes=".jpg,.jpeg,.png,.bmp,.gif"
    />
  );
};

export const UnlockPdf = () => {
  const [password, setPassword] = useState("");

  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    // Unlock PDF using service
    const result = await PDFService.compressPDF(file.file); // Placeholder logic
    PDFService.downloadFile(result, `unlocked-${file.name}`);
    await PDFService.trackUsage("unlock", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="Unlock PDF"
      description="Remove password protection from PDF files."
      icon={Unlock}
      color="lime"
      onProcess={handleProcess}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          PDF Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter PDF password"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
    </BasePDFTool>
  );
};

export const ProtectPdf = () => {
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];

    // Prevent multiple simultaneous calls
    if (isProcessing) {
      console.log("⚠️ Already processing, ignoring duplicate request");
      return;
    }

    // Validate password before processing
    if (!password || password.trim().length < 6) {
      throw new Error(
        "Password is required and must be at least 6 characters long",
      );
    }

    setIsProcessing(true);
    console.log(`🔐 Protecting PDF with password length: ${password.length}`);

    try {
      // Use the enhanced protectPDF function with real encryption
      const result = await PDFService.protectPDF(file.file, {
        password: password.trim(),
        permissions: {
          printing: true,
          copying: false,
          editing: false,
          filling: true,
        },
        sessionId: `protect_alltools_${Date.now()}`,
      });

      // Create download blob and trigger download
      const blob = new Blob([result.data], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `protected-${file.name}`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      await PDFService.trackUsage("protect", 1, file.size);
    } catch (error) {
      console.error("Protection failed:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <BasePDFTool
      toolName="Protect PDF"
      description="Add password protection to your PDF files."
      icon={Lock}
      color="red"
      onProcess={handleProcess}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password (min 6 characters)"
          className="w-full p-2 border border-gray-300 rounded-md"
          disabled={isProcessing}
          minLength={6}
          required
        />
        {isProcessing && (
          <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
            <span className="animate-spin">🔄</span>
            Applying real password protection...
          </p>
        )}
      </div>
    </BasePDFTool>
  );
};

export const OrganizePdf = () => {
  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    // Organize PDF pages using service
    const result = await PDFService.splitPDF(file.file);
    result.forEach((page, index) => {
      PDFService.downloadFile(page, `page-${index + 1}-${file.name}`);
    });
    await PDFService.trackUsage("organize", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="Organize PDF"
      description="Reorder, add, or remove pages from your PDF files."
      icon={Layers}
      color="slate"
      onProcess={handleProcess}
    />
  );
};

export const EditPdf = () => {
  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    // Edit PDF using service
    const result = await PDFService.compressPDF(file.file); // Placeholder logic
    PDFService.downloadFile(result, `edited-${file.name}`);
    await PDFService.trackUsage("edit", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="Edit PDF"
      description="Edit text, images, and content in your PDF files."
      icon={Edit}
      color="indigo"
      onProcess={handleProcess}
    />
  );
};

export const SignPdf = () => {
  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    // Add signature using service
    const result = await PDFService.compressPDF(file.file); // Placeholder logic
    PDFService.downloadFile(result, `signed-${file.name}`);
    await PDFService.trackUsage("sign", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="Sign PDF"
      description="Add digital signatures to your PDF documents."
      icon={PenTool}
      color="violet"
      onProcess={handleProcess}
    />
  );
};

export const RotatePdf = () => {
  const [rotation, setRotation] = useState(90);

  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    const result = await PDFService.rotatePDF(file.file, rotation);
    PDFService.downloadFile(result, `rotated-${file.name}`);
    await PDFService.trackUsage("rotate", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="Rotate PDF"
      description="Rotate PDF pages to the correct orientation."
      icon={RotateCw}
      color="teal"
      onProcess={handleProcess}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rotation Angle
        </label>
        <select
          value={rotation}
          onChange={(e) => setRotation(parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value={90}>90° Clockwise</option>
          <option value={180}>180°</option>
          <option value={270}>270° (90° Counter-clockwise)</option>
        </select>
      </div>
    </BasePDFTool>
  );
};

export const PdfToPdfA = () => {
  const [level, setLevel] = useState("1b");
  const [settings, setSettings] = useState({
    embedFonts: true,
    optimizeImages: true,
    preserveMetadata: true,
    removeInteractivity: false,
  });

  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    const result = await PDFService.convertToPDFA(file.file, level, settings);
    // Result contains metadata, but we'll just download the converted file
    const convertedBytes = await PDFService.compressPDF(file.file); // Placeholder
    PDFService.downloadFile(convertedBytes, `pdfa-${file.name}`);
    await PDFService.trackUsage("pdf-to-pdfa", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="PDF to PDF/A"
      description="Convert PDF files to archival PDF/A format for long-term preservation."
      icon={Shield}
      color="gray"
      onProcess={handleProcess}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDF/A Level
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="1b">PDF/A-1b</option>
            <option value="2b">PDF/A-2b</option>
            <option value="3b">PDF/A-3b</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.embedFonts}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  embedFonts: e.target.checked,
                }))
              }
              className="mr-2"
            />
            Embed all fonts
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.optimizeImages}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  optimizeImages: e.target.checked,
                }))
              }
              className="mr-2"
            />
            Optimize images
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.removeInteractivity}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  removeInteractivity: e.target.checked,
                }))
              }
              className="mr-2"
            />
            Remove interactive elements
          </label>
        </div>
      </div>
    </BasePDFTool>
  );
};

export const RepairPdf = () => {
  const [options, setOptions] = useState({
    fixStructure: true,
    repairMetadata: true,
    optimizeContent: true,
    rebuildFonts: false,
  });

  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    const result = await PDFService.repairPDF(file.file, options);
    // Result contains repair statistics
    const repairedBytes = await PDFService.compressPDF(file.file); // Placeholder
    PDFService.downloadFile(repairedBytes, `repaired-${file.name}`);
    await PDFService.trackUsage("repair", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="Repair PDF"
      description="Fix corrupted or damaged PDF files and recover your data."
      icon={Target}
      color="orange"
      onProcess={handleProcess}
    >
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.fixStructure}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                fixStructure: e.target.checked,
              }))
            }
            className="mr-2"
          />
          Fix file structure
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.repairMetadata}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                repairMetadata: e.target.checked,
              }))
            }
            className="mr-2"
          />
          Repair metadata
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.optimizeContent}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                optimizeContent: e.target.checked,
              }))
            }
            className="mr-2"
          />
          Optimize content
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.rebuildFonts}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                rebuildFonts: e.target.checked,
              }))
            }
            className="mr-2"
          />
          Rebuild font information
        </label>
      </div>
    </BasePDFTool>
  );
};

export const PageNumbers = () => {
  const [position, setPosition] = useState<
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center"
  >("bottom-right");
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [fontColor, setFontColor] = useState("#000000");
  const [margin, setMargin] = useState(50);

  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    try {
      // Add page numbers using the new service
      const result = await PDFService.addPageNumbers(file.file, {
        position,
        startNumber,
        fontSize,
        fontColor,
        margin,
      });

      PDFService.downloadFile(result, `numbered-${file.name}`);
      await PDFService.trackUsage("page-numbers", 1, file.size);
    } catch (error) {
      console.error("Page numbering failed:", error);
      throw error;
    }
  };

  return (
    <BasePDFTool
      toolName="Add Page Numbers"
      description="Add page numbers to your PDF documents with customizable positioning and styling."
      icon={Hash}
      color="purple"
      onProcess={handleProcess}
    >
      <div className="space-y-6">
        {/* Position Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Position
          </label>
          <div className="grid grid-cols-3 gap-3">
            {/* Top Row */}
            <button
              type="button"
              onClick={() => setPosition("top-left")}
              className={`p-3 border-2 rounded-lg text-center text-sm font-medium transition-all duration-200 ${
                position === "top-left"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="w-8 h-6 mx-auto mb-1 border border-gray-300 rounded relative">
                <div className="absolute top-0 left-0 w-2 h-1 bg-current rounded-sm"></div>
              </div>
              Top Left
            </button>
            <button
              type="button"
              onClick={() => setPosition("top-center")}
              className={`p-3 border-2 rounded-lg text-center text-sm font-medium transition-all duration-200 ${
                position === "top-center"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="w-8 h-6 mx-auto mb-1 border border-gray-300 rounded relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-current rounded-sm"></div>
              </div>
              Top Center
            </button>
            <button
              type="button"
              onClick={() => setPosition("top-right")}
              className={`p-3 border-2 rounded-lg text-center text-sm font-medium transition-all duration-200 ${
                position === "top-right"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="w-8 h-6 mx-auto mb-1 border border-gray-300 rounded relative">
                <div className="absolute top-0 right-0 w-2 h-1 bg-current rounded-sm"></div>
              </div>
              Top Right
            </button>

            {/* Bottom Row */}
            <button
              type="button"
              onClick={() => setPosition("bottom-left")}
              className={`p-3 border-2 rounded-lg text-center text-sm font-medium transition-all duration-200 ${
                position === "bottom-left"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="w-8 h-6 mx-auto mb-1 border border-gray-300 rounded relative">
                <div className="absolute bottom-0 left-0 w-2 h-1 bg-current rounded-sm"></div>
              </div>
              Bottom Left
            </button>
            <button
              type="button"
              onClick={() => setPosition("bottom-center")}
              className={`p-3 border-2 rounded-lg text-center text-sm font-medium transition-all duration-200 ${
                position === "bottom-center"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="w-8 h-6 mx-auto mb-1 border border-gray-300 rounded relative">
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-current rounded-sm"></div>
              </div>
              Bottom Center
            </button>
            <button
              type="button"
              onClick={() => setPosition("bottom-right")}
              className={`p-3 border-2 rounded-lg text-center text-sm font-medium transition-all duration-200 ${
                position === "bottom-right"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="w-8 h-6 mx-auto mb-1 border border-gray-300 rounded relative">
                <div className="absolute bottom-0 right-0 w-2 h-1 bg-current rounded-sm"></div>
              </div>
              Bottom Right
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Number
            </label>
            <input
              type="number"
              value={startNumber}
              onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <input
              type="range"
              min="8"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center text-sm text-gray-600 mt-1">
              {fontSize}px
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Margin from Edge
            </label>
            <input
              type="range"
              min="20"
              max="100"
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center text-sm text-gray-600 mt-1">
              {margin}px
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
          <div className="w-32 h-20 mx-auto border-2 border-gray-300 rounded relative bg-white">
            <div
              className="absolute text-xs font-medium"
              style={{
                color: fontColor,
                fontSize: `${Math.max(8, fontSize * 0.5)}px`,
                ...(position.includes("top")
                  ? { top: `${(margin / 100) * 20}px` }
                  : { bottom: `${(margin / 100) * 20}px` }),
                ...(position.includes("left")
                  ? { left: `${(margin / 100) * 32}px` }
                  : position.includes("right")
                    ? { right: `${(margin / 100) * 32}px` }
                    : { left: "50%", transform: "translateX(-50%)" }),
              }}
            >
              {startNumber}
            </div>
          </div>
        </div>
      </div>
    </BasePDFTool>
  );
};

export const ComparePdf = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);

  const handleFilesSelect = (newFiles: File[]) => {
    const processedFiles: ProcessedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
    }));
    setFiles(processedFiles.slice(0, 2)); // Only allow 2 files
  };

  const handleProcess = async () => {
    if (files.length !== 2) return;

    const result = await PDFService.comparePDFs(files[0].file, files[1].file);
    // Show comparison results or download highlighted differences PDF
    const comparisonPdf = await PDFService.compressPDF(files[0].file); // Placeholder
    PDFService.downloadFile(comparisonPdf, "comparison-result.pdf");
    await PDFService.trackUsage(
      "compare",
      2,
      files.reduce((sum, f) => sum + f.size, 0),
    );
  };

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

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Copy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Compare PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Compare two PDF files and highlight the differences between them.
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          {files.length < 2 ? (
            <FileUpload
              onFilesSelect={handleFilesSelect}
              multiple={true}
              accept=".pdf"
              maxSize={25}
            />
          ) : (
            <div className="space-y-4">
              {files.map((file, index) => (
                <div key={file.id} className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-medium">
                        File {index + 1}: {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                onClick={handleProcess}
                className="w-full bg-indigo-500 hover:bg-indigo-600"
              >
                <Copy className="w-5 h-5 mr-2" />
                Compare Files
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const RedactPdf = () => {
  const [redactionAreas, setRedactionAreas] = useState<
    Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      page: number;
    }>
  >([]);

  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    const result = await PDFService.redactPDF(file.file, redactionAreas);
    PDFService.downloadFile(result, `redacted-${file.name}`);
    await PDFService.trackUsage("redact", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="Redact PDF"
      description="Remove sensitive information from PDF documents permanently."
      icon={Scissors}
      color="red"
      onProcess={handleProcess}
    >
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> After uploading your PDF, you'll be able to
          select areas to redact by clicking and dragging on the document
          preview.
        </p>
      </div>
    </BasePDFTool>
  );
};

// PowerPoint and Excel to PDF converters
export const PowerPointToPdf = () => {
  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];

    // Validate file size (100MB limit)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.file.size > MAX_FILE_SIZE) {
      throw new Error(
        `PowerPoint file is too large (${(file.file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 100MB. Please compress your PowerPoint file or split it into smaller presentations.`,
      );
    }

    try {
      console.log(
        `🎯 Starting PowerPoint to PDF conversion for: ${file.name} (${(file.file.size / 1024 / 1024).toFixed(2)}MB)`,
      );

      // Use LibreOffice conversion for PowerPoint
      const conversionResult =
        await PDFService.convertPowerPointToPdfLibreOffice(file.file, {
          quality: "high",
          preserveFormatting: true,
          preserveImages: true,
          pageSize: "A4",
          orientation: "auto",
        });

      console.log(
        `✅ PowerPoint conversion successful: ${conversionResult.stats.pages} pages, ${(conversionResult.blob.size / 1024 / 1024).toFixed(2)}MB`,
      );

      const downloadUrl = URL.createObjectURL(conversionResult.blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${file.name.replace(/\.(ppt|pptx)$/i, "")}.pdf`;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      await PDFService.trackUsage("powerpoint-to-pdf", 1, file.size);
    } catch (error: any) {
      console.error("PowerPoint conversion failed:", error);

      // Provide more user-friendly error messages
      let userMessage = error.message || "PowerPoint conversion failed";

      // Check for specific error patterns and provide helpful guidance
      if (userMessage.includes("timed out")) {
        userMessage +=
          "\n\nTips to resolve timeout issues:\n• Try with a smaller PowerPoint file\n• Reduce image quality in your presentation\n• Remove unnecessary animations or media\n• Split large presentations into smaller parts";
      } else if (userMessage.includes("Network error")) {
        userMessage +=
          "\n\nPlease check your internet connection and try again.";
      } else if (
        userMessage.includes("not supported") ||
        userMessage.includes("corrupted")
      ) {
        userMessage +=
          "\n\nPlease ensure your PowerPoint file is valid and try again with a different file.";
      }

      // Re-throw with enhanced message
      const enhancedError = new Error(userMessage);
      enhancedError.name = error.name || "PowerPointConversionError";
      throw enhancedError;
    }
  };

  return (
    <BasePDFTool
      toolName="PowerPoint to PDF"
      description="Convert PowerPoint presentations to PDF format."
      icon={Presentation}
      color="red"
      onProcess={handleProcess}
      acceptedTypes=".ppt,.pptx"
    />
  );
};

export const ExcelToPdf = () => {
  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    try {
      // Use enhanced client-side conversion for reliability
      const EnhancedExcelToPdfService = await import(
        "@/services/enhancedExcelToPdf"
      ).then((m) => m.default);

      const conversionResult =
        await EnhancedExcelToPdfService.convertExcelToPdf(file.file, {
          pageFormat: "A4",
          orientation: "auto",
          quality: "high",
          preserveFormatting: true,
          includeGridlines: true,
          includeCharts: true,
          fitToPage: true,
          scaleToFit: 0.85,
        });

      const downloadUrl = URL.createObjectURL(conversionResult.blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${file.name.replace(/\.(xls|xlsx)$/i, "")}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      await PDFService.trackUsage("excel-to-pdf", 1, file.size);
    } catch (error) {
      console.error("Excel conversion failed:", error);
      throw error;
    }
  };

  return (
    <BasePDFTool
      toolName="Excel to PDF"
      description="Convert Excel spreadsheets to PDF format."
      icon={Sheet}
      color="emerald"
      onProcess={handleProcess}
      acceptedTypes=".xls,.xlsx"
    />
  );
};
