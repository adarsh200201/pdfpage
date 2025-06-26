import { useState } from "react";
import { Link } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
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

    // Check usage limits
    const usageCheck = await PDFService.checkUsageLimit();
    if (!usageCheck.canUpload) {
      setUsageLimitReached(true);
      if (!isAuthenticated) {
        setShowAuthModal(true);
      }
      return;
    }

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
      toast({
        title: "Error",
        description:
          error.message || `Failed to process files. Please try again.`,
        variant: "destructive",
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

            {/* Usage Limit Warning */}
            {usageLimitReached && !isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-heading-small text-text-dark mb-2">
                  Daily Limit Reached
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  You've used your 3 free PDF operations today. Sign up to
                  continue!
                </p>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-brand-red hover:bg-red-600"
                >
                  Sign Up Free
                </Button>
              </div>
            )}

            {usageLimitReached && isAuthenticated && !user?.isPremium && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-heading-small text-text-dark mb-2">
                  Upgrade to Premium
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  You've reached your daily limit. Upgrade to Premium for
                  unlimited access!
                </p>
                <Button
                  className="bg-brand-yellow text-black hover:bg-yellow-400"
                  asChild
                >
                  <Link to="/pricing">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Link>
                </Button>
              </div>
            )}

            {/* Process Button */}
            {files.length > 0 && !usageLimitReached && (
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
                onClick={() => {
                  setFiles([]);
                  setIsComplete(false);
                }}
                className={`bg-${color}-500 hover:bg-${color}-600`}
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

export const PdfToPowerPoint = () => {
  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    // Convert PDF to PowerPoint using service
    const result = await PDFService.convertPdfToWord(file.file); // Placeholder logic
    PDFService.downloadFile(result, `${file.name.replace(".pdf", "")}.pptx`);
    await PDFService.trackUsage("pdf-to-powerpoint", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="PDF to PowerPoint"
      description="Convert PDF files to PowerPoint presentations with perfect formatting."
      icon={Presentation}
      color="red"
      onProcess={handleProcess}
      acceptedTypes=".pdf"
    />
  );
};

export const PdfToExcel = () => {
  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    // Convert PDF to Excel using service
    const result = await PDFService.convertPdfToWord(file.file); // Placeholder logic
    PDFService.downloadFile(result, `${file.name.replace(".pdf", "")}.xlsx`);
    await PDFService.trackUsage("pdf-to-excel", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="PDF to Excel"
      description="Extract data from PDF files and convert them to Excel spreadsheets."
      icon={Sheet}
      color="emerald"
      onProcess={handleProcess}
      acceptedTypes=".pdf"
    />
  );
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

export const Watermark = () => {
  const [watermarkText, setWatermarkText] = useState("");
  const [opacity, setOpacity] = useState(0.5);

  const handleProcess = async (files: ProcessedFile[]) => {
    for (const file of files) {
      // Add watermark using PDF service (simplified)
      const result = await PDFService.compressPDF(file.file); // Placeholder logic
      PDFService.downloadFile(result, `watermarked-${file.name}`);
      await PDFService.trackUsage("watermark", 1, file.size);
    }
  };

  return (
    <BasePDFTool
      toolName="Watermark PDF"
      description="Add text or image watermarks to your PDF files."
      icon={Palette}
      color="cyan"
      onProcess={handleProcess}
      allowMultiple={true}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Watermark Text
          </label>
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Enter watermark text"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacity: {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </BasePDFTool>
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

  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    const result = await PDFService.protectPdf(file.file, password);
    PDFService.downloadFile(result, `protected-${file.name}`);
    await PDFService.trackUsage("protect", 1, file.size);
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
          placeholder="Enter new password"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
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

export const HtmlToPdf = () => {
  const [url, setUrl] = useState("");

  const handleProcess = async () => {
    // Convert HTML/URL to PDF
    const result = await PDFService.convertWordToPdf(
      new File([], "webpage.html"),
    ); // Placeholder
    PDFService.downloadFile(result, "webpage.pdf");
    await PDFService.trackUsage("html-to-pdf", 1, 0);
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
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            HTML to PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Convert web pages and HTML content to PDF files.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL or HTML Content
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <Button
              onClick={handleProcess}
              disabled={!url}
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              <Globe className="w-5 h-5 mr-2" />
              Convert to PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
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
  const [position, setPosition] = useState("bottom-right");
  const [startNumber, setStartNumber] = useState(1);

  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    // Add page numbers using service
    const result = await PDFService.compressPDF(file.file); // Placeholder logic
    PDFService.downloadFile(result, `numbered-${file.name}`);
    await PDFService.trackUsage("page-numbers", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="Add Page Numbers"
      description="Add page numbers to your PDF documents with customizable positioning."
      icon={Hash}
      color="purple"
      onProcess={handleProcess}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position
          </label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-center">Bottom Center</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Number
          </label>
          <input
            type="number"
            value={startNumber}
            onChange={(e) => setStartNumber(parseInt(e.target.value))}
            min="1"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
    </BasePDFTool>
  );
};

export const ScanToPdf = () => {
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
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scan className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Scan to PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Capture documents with your device camera and convert them to PDF.
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Scan className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-heading-small text-text-dark mb-4">
            Mobile Scanning Feature
          </h3>
          <p className="text-body-medium text-text-light mb-6">
            This feature works best on mobile devices with camera access. You
            can also upload scanned images to convert them to PDF.
          </p>
          <div className="space-y-4">
            <Button className="w-full bg-green-500 hover:bg-green-600">
              <Scan className="w-5 h-5 mr-2" />
              Open Camera Scanner
            </Button>
            <Link to="/jpg-to-pdf">
              <Button variant="outline" className="w-full">
                <FileImage className="w-5 h-5 mr-2" />
                Upload Scanned Images
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OcrPdf = () => {
  const [language, setLanguage] = useState("auto");

  const handleProcess = async (files: ProcessedFile[]) => {
    const file = files[0];
    const result = await PDFService.extractTextOCR(file.file, language);
    // Create a new PDF with searchable text
    const searchablePdf = await PDFService.compressPDF(file.file); // Placeholder
    PDFService.downloadFile(searchablePdf, `ocr-${file.name}`);
    await PDFService.trackUsage("ocr", 1, file.size);
  };

  return (
    <BasePDFTool
      toolName="OCR PDF"
      description="Extract text from scanned PDFs and make them searchable."
      icon={Eye}
      color="blue"
      onProcess={handleProcess}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recognition Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="auto">Auto-detect</option>
          <option value="eng">English</option>
          <option value="spa">Spanish</option>
          <option value="fra">French</option>
          <option value="deu">German</option>
          <option value="chi">Chinese</option>
          <option value="jpn">Japanese</option>
        </select>
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
    const result = await PDFService.convertWordToPdf(file.file); // Placeholder logic
    PDFService.downloadFile(
      result,
      `${file.name.replace(/\.(ppt|pptx)$/i, "")}.pdf`,
    );
    await PDFService.trackUsage("powerpoint-to-pdf", 1, file.size);
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
    const result = await PDFService.convertWordToPdf(file.file); // Placeholder logic
    PDFService.downloadFile(
      result,
      `${file.name.replace(/\.(xls|xlsx)$/i, "")}.pdf`,
    );
    await PDFService.trackUsage("excel-to-pdf", 1, file.size);
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
