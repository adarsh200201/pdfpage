import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useToolTracking } from "@/hooks/useToolTracking";
import AuthModal from "@/components/auth/AuthModal";
import { useFloatingPopup } from "@/contexts/FloatingPopupContext";
import {
  ArrowLeft,
  Download,
  FileText,
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  Upload,
  X,
  Settings,
  Info,
} from "lucide-react";

interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  thumbnails?: string[];
  pageCount?: number;
  loadingThumbnails?: boolean;
}

interface ProtectionResult {
  originalSize: number;
  protectedSize: number;
  downloadUrl: string;
  filename: string;
  protectionLevel: string;
}

const ProtectPdf = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState({
    printing: true,
    copying: false,
    editing: false,
    filling: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [protectionResult, setProtectionResult] =
    useState<ProtectionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const protectionInProgress = useRef<boolean>(false);
  const previousFiles = useRef<ProcessedFile[]>([]);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Floating popup tracking
  const { trackToolUsage } = useFloatingPopup();

  // Mixpanel tracking
  const tracking = useToolTracking({
    toolName: "protect",
    category: "PDF Tool",
    trackPageView: true,
    trackFunnel: true,
  });

  // Generate thumbnails using PDF.js
  const generateThumbnails = useCallback(
    async (pdfFile: File): Promise<string[]> => {
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfjsLib = await import("pdfjs-dist");

        // Set up worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const thumbnails: string[] = [];
        const maxPages = Math.min(pdf.numPages, 3); // Show first 3 pages

        for (let i = 1; i <= maxPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              await page.render({
                canvasContext: context,
                viewport: viewport,
              }).promise;

              thumbnails.push(canvas.toDataURL());
            }
          } catch (pageError) {
            console.warn(
              `Failed to generate thumbnail for page ${i}:`,
              pageError,
            );
          }
        }

        return thumbnails;
      } catch (error) {
        console.error("Error generating thumbnails:", error);
        return [];
      }
    },
    [],
  );

  // Get page count from PDF
  const getPageCount = async (pdfFile: File): Promise<number> => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");

      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (error) {
      console.error("Error getting page count:", error);
      return 1;
    }
  };

  // Monitor file state changes to detect unwanted resets
  useEffect(() => {
    if (previousFiles.current.length > 0 && files.length === 0) {
      console.warn(
        "🚨 Files were unexpectedly cleared! Previous files:",
        previousFiles.current,
      );
    }
    previousFiles.current = [...files];
  }, [files, isProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any download URLs to prevent memory leaks
      if (protectionResult?.downloadUrl) {
        URL.revokeObjectURL(protectionResult.downloadUrl);
      }
    };
  }, [protectionResult?.downloadUrl]);

  const handleFileSelect = useCallback(
    async (selectedFiles: File[]) => {
      const validFiles = selectedFiles.filter((file) => {
        if (file.type !== "application/pdf") {
          toast({
            title: "Invalid file type",
            description: "Please select PDF files only.",
            variant: "destructive",
          });
          return false;
        }

        const maxSize = 100 * 1024 * 1024; // 100MB for all users
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `File size exceeds 100MB limit.`,
            variant: "destructive",
          });
          return false;
        }

        return true;
      });

      if (validFiles.length === 0) return;

      // For protection, we only handle one file at a time
      const file = validFiles[0];

      const processedFile: ProcessedFile = {
        id: Date.now().toString(),
        file,
        name: file.name,
        size: file.size,
        loadingThumbnails: true,
      };

      // Clear any existing download URLs to prevent memory leaks
      if (protectionResult?.downloadUrl) {
        URL.revokeObjectURL(protectionResult.downloadUrl);
      }

      // Reset all protection state when new file is selected
      protectionInProgress.current = false;
      setIsProcessing(false);
      setFiles([processedFile]);
      setProtectionResult(null);
      setProgress(0);

      console.log("🔄 File changed, protection state reset");

      // Track file upload
      tracking.trackFileUpload([file]);

      // Generate thumbnails and get page count
      try {
        const [thumbnails, pageCount] = await Promise.all([
          generateThumbnails(file),
          getPageCount(file),
        ]);

        setFiles([
          {
            ...processedFile,
            thumbnails,
            pageCount,
            loadingThumbnails: false,
          },
        ]);
      } catch (error) {
        console.error("Error processing file:", error);
        setFiles([
          {
            ...processedFile,
            loadingThumbnails: false,
          },
        ]);
      }
    },
    [toast, generateThumbnails, getPageCount, tracking],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFileSelect(selectedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelect(droppedFiles);
  };

  const removeFile = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId));
    setProtectionResult(null);
  };

  const protectFiles = async () => {
    // Multiple safety checks to prevent duplicate requests
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select a PDF file to protect.",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter a password to protect your PDF.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      tracking.trackAuthRequired();
      setShowAuthModal(true);
      return;
    }

    // Triple check to prevent multiple simultaneous protection requests
    if (isProcessing || protectionInProgress.current) {
      console.log(
        "⚠️ Protection already in progress, ignoring duplicate request",
      );
      return;
    }

    // Set flags to prevent duplicates
    protectionInProgress.current = true;
    setIsProcessing(true);
    setProgress(0);
    setProtectionResult(null); // Clear any previous results

    console.log(`🚀 Starting protection...`);

    try {
      const file = files[0];
      const startTime = Date.now();

      // Track protection start
      tracking.trackConversionStart("PDF", "PDF Protected", [file.file]);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      console.log(`Protecting with password and permissions`);

      const result = await PDFService.protectPDF(file.file, {
        password,
        permissions,
        sessionId: `protect_${Date.now()}`,
        onProgress: setProgress,
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Extract protection info from response headers
      const originalSize = parseInt(
        result.headers?.["x-original-size"] || file.size.toString(),
      );

      // Handle ArrayBuffer result data correctly
      const actualProtectedSize =
        result.data instanceof ArrayBuffer
          ? result.data.byteLength
          : (result.data as any).size || 0;

      const protectedSize = parseInt(
        result.headers?.["x-protected-size"] || actualProtectedSize.toString(),
      );

      const protectionLevel =
        result.headers?.["x-protection-level"] || "standard";

      console.log(`📊 Protection results:`, {
        originalSize,
        protectedSize,
        protectionLevel,
        dataType:
          result.data instanceof ArrayBuffer
            ? "ArrayBuffer"
            : typeof result.data,
      });

      // Create download URL
      const blob = new Blob([result.data], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);

      const protectionResult: ProtectionResult = {
        originalSize,
        protectedSize,
        protectionLevel,
        downloadUrl,
        filename: `${file.name.replace(/\.pdf$/i, "")}_protected.pdf`,
      };

      setProtectionResult(protectionResult);

      // Track successful protection
      const conversionTime = Date.now() - startTime;
      tracking.trackConversionComplete(
        "PDF",
        "PDF Protected",
        {
          fileName: file.file.name,
          fileSize: file.file.size,
          fileType: file.file.type,
        },
        protectedSize,
        conversionTime,
      );

      // Track for floating popup (only for anonymous users)
      if (!isAuthenticated) {
        trackToolUsage();
      }

      toast({
        title: "Protection Complete!",
        description: `PDF protected with password successfully`,
      });
    } catch (error: any) {
      console.error("Protection failed:", error);

      // Clear any partial progress
      setProgress(0);
      setProtectionResult(null);

      toast({
        title: "Protection Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "An error occurred during protection.",
        variant: "destructive",
      });

      // Track protection failure
      tracking.trackConversionFailed("PDF", "PDF Protected", error.message);
    } finally {
      // Reset all protection flags
      protectionInProgress.current = false;
      setIsProcessing(false);

      console.log(`✅ Protection cleanup completed`);
    }
  };

  const downloadResult = () => {
    if (!protectionResult) {
      toast({
        title: "No file to download",
        description: "Please protect a PDF first.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`📥 Downloading: ${protectionResult.filename}`);

      const link = document.createElement("a");
      link.href = protectionResult.downloadUrl;
      link.download = protectionResult.filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download started",
        description: `Downloading ${protectionResult.filename}`,
      });

      // Track successful download
      tracking.trackDownload(
        protectionResult.filename,
        protectionResult.protectedSize,
      );
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading your file.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <Header />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-red-600 rounded-2xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Protect PDF</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Add password protection to PDF files. Control access permissions and
            secure your documents with encryption.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* File Upload Area */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload PDF File
              </CardTitle>
              <CardDescription>
                Select a PDF file to protect with password (max 100MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors",
                  isDragging
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 hover:border-gray-400",
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragging
                    ? "Drop your PDF here"
                    : "Choose PDF file or drag & drop"}
                </h3>
                <p className="text-gray-500 mb-4">
                  Supports PDF files up to 100MB
                </p>
                <Button variant="outline">Browse Files</Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Preview */}
          {files.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  File Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-red-500" />
                        <div>
                          <h3 className="font-semibold">{file.name}</h3>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • {file.pageCount || 0}{" "}
                            pages
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Thumbnails */}
                    {file.loadingThumbnails ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="ml-2">Generating preview...</span>
                      </div>
                    ) : file.thumbnails && file.thumbnails.length > 0 ? (
                      <div className="flex gap-2 mb-4">
                        {file.thumbnails.map((thumbnail, index) => (
                          <img
                            key={index}
                            src={thumbnail}
                            alt={`Page ${index + 1}`}
                            className="w-16 h-20 object-cover border rounded shadow-sm"
                          />
                        ))}
                        {file.pageCount && file.pageCount > 3 && (
                          <div className="w-16 h-20 border rounded shadow-sm flex items-center justify-center bg-gray-50">
                            <span className="text-xs text-gray-500">
                              +{file.pageCount - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Protection Settings - Shown after upload */}
          {files.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Protection Settings
                </CardTitle>
                <CardDescription>
                  Configure password and permissions for your PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (min 6 characters)"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <Label className="text-base font-semibold">Permissions</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Control what users can do with the protected PDF
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={permissions.printing}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            printing: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm">Allow printing</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={permissions.copying}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            copying: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm">Allow copying text</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={permissions.editing}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            editing: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm">Allow editing</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={permissions.filling}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            filling: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm">Allow form filling</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Protection Results */}
          {protectionResult && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Protection Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Original Size</p>
                      <p className="text-lg font-bold">
                        {formatFileSize(protectionResult.originalSize)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Protected Size</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatFileSize(protectionResult.protectedSize)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Protection Level</p>
                      <p className="text-lg font-bold text-green-600">
                        {protectionResult.protectionLevel}
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={downloadResult}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Protected PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={protectFiles}
                  disabled={
                    files.length === 0 ||
                    isProcessing ||
                    protectionInProgress.current ||
                    !user ||
                    !password ||
                    password !== confirmPassword ||
                    password.length < 6
                  }
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isProcessing || protectionInProgress.current ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Protecting... ({Math.round(progress)}%)
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Protect PDF
                    </>
                  )}
                </Button>

                {files.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiles([]);
                      setProtectionResult(null);
                      setPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Protecting PDF...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                PDF Protection Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Protection Features:</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Password protection for document access</li>
                    <li>• Granular permission controls</li>
                    <li>• Secure server-side processing</li>
                    <li>• Metadata privacy protection</li>
                    <li>• Industry-standard encryption</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Permission Options:</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      • <strong>Printing:</strong> Allow/prevent document
                      printing
                    </li>
                    <li>
                      • <strong>Copying:</strong> Control text selection and
                      copying
                    </li>
                    <li>
                      • <strong>Editing:</strong> Allow/prevent document
                      modifications
                    </li>
                    <li>
                      • <strong>Form Filling:</strong> Control form field
                      editing
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <PromoBanner />
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="login"
        />
      )}
    </div>
  );
};

export default ProtectPdf;
