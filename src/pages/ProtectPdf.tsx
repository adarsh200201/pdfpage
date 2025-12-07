import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import { useToolTracking } from "@/hooks/useToolTracking";
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
  AlertCircle,
} from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";

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
  isEncrypted: boolean;
}

const ProtectPdf = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const permissions: any = {};
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [protectionResult, setProtectionResult] = useState<ProtectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [encryptionAvailable, setEncryptionAvailable] = useState<boolean | null>(null);
  const [encryptionAvailabilityDetails, setEncryptionAvailabilityDetails] = useState<any>(null);
  const requestInFlightRef = useRef<boolean>(false);

  // Check backend encryption availability
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/pdf/protect-status');
        if (!mounted) return;
        if (!res.ok) {
          setEncryptionAvailable(false);
          return;
        }
        const json = await res.json();
        setEncryptionAvailable(!!json.usable);
        setEncryptionAvailabilityDetails(json.availability || json);
      } catch (err) {
        console.warn('Failed to fetch protect-status:', err);
        if (mounted) setEncryptionAvailable(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const { toast } = useToast();
  
  // Floating popup tracking
  const { trackToolUsage } = useFloatingPopup();

  // Mixpanel tracking
  const tracking = useToolTracking({
    toolName: "protect-pdf",
    category: "PDF Security",
    trackPageView: true,
    trackFunnel: true,
  });

  // Generate thumbnails using PDF.js
  const generateThumbnails = useCallback(async (pdfFile: File): Promise<string[]> => {
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
          console.warn(`Failed to generate thumbnail for page ${i}:`, pageError);
        }
      }

      return thumbnails;
    } catch (error) {
      console.error("Error generating thumbnails:", error);
      return [];
    }
  }, []);

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

  const handleFileSelect = useCallback(async (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter((file) => {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please select PDF files only.",
          variant: "destructive",
        });
        return false;
      }

      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "File size exceeds 100MB limit.",
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

    // Reset state
    setFiles([processedFile]);
    setProtectionResult(null);
    setProgress(0);

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
  }, [toast, generateThumbnails, getPageCount, tracking]);

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

  const protectPDF = async (file: File, userPassword: string, permissions: any): Promise<{data:Uint8Array, headers: Record<string,string>}> => {
    // Prevent multiple simultaneous requests
    if (requestInFlightRef.current) {
      throw new Error('A protection request is already in progress. Please wait.');
    }
    
    requestInFlightRef.current = true;
    
    try {
      // Use the backend service for professional AES-256 encryption
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', userPassword);
      formData.append('permissions', JSON.stringify(permissions));

      const response = await fetch('/api/pdf/protect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Try to parse JSON error, but be resilient if server returned non-JSON
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (parseErr) {
          // ignore, we'll handle based on status
        }

        // Fail fast: do not perform insecure client-side fallbacks. Server-side encryption is required.
        if (errorData && errorData.code === 'ENCRYPTION_FAILED') {
          throw new Error('Server encryption tools unavailable. Cannot securely protect this PDF.');
        }

        if (errorData && errorData.code === 'INVALID_PASSWORD') {
          throw new Error('Password must be at least 6 characters long and contain letters and numbers');
        }

        throw new Error((errorData && errorData.message) || `Server error: ${response.status}`);
      }

      // Get the encrypted PDF as array buffer
      const encryptedPdfArrayBuffer = await response.arrayBuffer();

      // Capture headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return { data: new Uint8Array(encryptedPdfArrayBuffer), headers };
    } catch (error) {
      console.error('Error encrypting PDF:', error);
      // Re-throw to be handled by caller; do not silently fallback to an insecure client-side protection.
      throw error;
    } finally {
      // Always release the lock when request completes
      requestInFlightRef.current = false;
    }
  };

  const createSecuredPDFWithNotice = async (file: File, password: string, permissions: any): Promise<Uint8Array> => {
    try {
      // Read the original PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Add a security notice page at the beginning
      const securityPage = pdfDoc.insertPage(0);
      const { width, height } = securityPage.getSize();

      // Remove this line: const { rgb } = require('pdf-lib');

      // Add security notice text - avoid emoji to prevent WinAnsi encoding issues
      securityPage.drawText('SECURITY PROTECTED DOCUMENT', {
        x: 50,
        y: height - 100,
        size: 20,
        color: rgb(0.80, 0.20, 0.20)
      });

      securityPage.drawText('This document has been processed for protection.', {
        x: 50,
        y: height - 140,
        size: 14,
        color: rgb(0.0, 0.0, 0.0)
      });

      securityPage.drawText(`Password Required: This file should be password protected.`, {
        x: 50,
        y: height - 170,
        size: 12,
        color: rgb(0.0, 0.0, 0.0)
      });

      securityPage.drawText('Note: For full AES-256 encryption, server processing is required.', {
        x: 50,
        y: height - 220,
        size: 10,
        color: rgb(0.60, 0.60, 0.60)
      });

      // Add metadata indicating protection attempt
      pdfDoc.setTitle(`Protected: ${file.name}`);
      pdfDoc.setSubject('Password Protected Document');
      pdfDoc.setCreator('PdfPage Security Tool');
      pdfDoc.setProducer('PdfPage AES-256 Protection');
      // pdf-lib expects keywords to be an array of strings
      pdfDoc.setKeywords([
        'password-protected',
        'encrypted',
        'secure',
        `${password.slice(0, 2)}***`,
      ]);

      // Return the modified PDF
      return await pdfDoc.save();
    } catch (error) {
      console.error("Error creating secured PDF with notice:", error);
      throw new Error("Failed to create protected document.");
    }
  };

  const protectFiles = async () => {
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
        description: "Password must be at least 6 characters long for security.",
        variant: "destructive",
      });
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProtectionResult(null);

    try {
      const file = files[0];
      const startTime = Date.now();

      // Track protection start
      tracking.trackConversionStart("PDF", "PDF Protected", [file.file]);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 300);

      console.log("🔐 Applying AES-256 encryption...");

      // Apply professional AES-256 encryption using server
      const result = await protectPDF(file.file, password, {});

      clearInterval(progressInterval);
      setProgress(100);

      // Create download URL
      const blob = new Blob([result.data], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);

      const isEncrypted = (result.headers['x-encrypted'] || '').toLowerCase() === 'true';

      const protectionResult: ProtectionResult = {
        originalSize: file.size,
        protectedSize: result.data.length,
        downloadUrl,
        filename: `${file.name.replace(/\.pdf$/i, "")}_protected.pdf`,
        isEncrypted,
      };

      if (!isEncrypted) {
        toast({
          title: "⚠️ Protection Applied (Not Encrypted)",
          description: "Server could not apply real encryption. A metadata-only notice was added. For secure password protection, install qpdf/Ghostscript on the server.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "🔐 PDF Protected Successfully!",
          description: "Your PDF is now protected with professional AES-256 encryption. PDF viewers will require the password to open it.",
        });
      }

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
        result.data.length,
        conversionTime,
      );

      // Track tool usage
      trackToolUsage();
    } catch (error: any) {
      console.error("Protection failed:", error);
      setProgress(0);
      setProtectionResult(null);

      toast({
        title: "Protection Failed",
        description: error.message || "An error occurred during protection. Please try again.",
        variant: "destructive",
      });

      // Track protection failure
      tracking.trackConversionError(
        "PDF",
        "PDF Protected",
        { fileName: files[0].name, fileSize: files[0].size, fileType: "application/pdf" },
        error.message
      );
    } finally {
      setIsProcessing(false);
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
      tracking.trackFileDownload({
        fileName: protectionResult.filename,
        fileSize: protectionResult.protectedSize,
        fileType: "application/pdf",
      });
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
            Add password protection to your PDF files with industry-standard encryption. Secure your documents from unauthorized access.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Security Notice */}
          <Card className="mb-8 border-2 border-blue-300 bg-blue-50 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 p-3 bg-blue-600 rounded-xl shadow-sm">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-blue-900 mb-2 text-lg">Secure Encryption</h2>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    Your PDFs are protected with industry-standard encryption. Once encrypted, the password is required to open the file in any PDF viewer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Area */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload PDF File
              </CardTitle>
              <CardDescription>
                Select a PDF file to protect with AES-256 encryption (max 100MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors cursor-pointer",
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
                            {formatFileSize(file.size)} • {file.pageCount || 0} pages
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

          {/* Protection Settings */}
          {files.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Encryption Settings
                </CardTitle>
                <CardDescription>
                  Configure password for AES-256 encryption
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
                        placeholder="Enter strong password (min 6 characters)"
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


                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    onClick={protectFiles}
                    disabled={
                      files.length === 0 ||
                      isProcessing ||
                      !password ||
                      password !== confirmPassword ||
                      password.length < 6 ||
                      encryptionAvailable === false
                    }
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Encrypting... ({Math.round(progress)}%)
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Protect PDF
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiles([]);
                      setProtectionResult(null);
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    size="lg"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Applying encryption...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {encryptionAvailable === false && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-700" />
                      <div>
                        <p className="font-semibold text-yellow-800">Server encryption unavailable</p>
                        <p className="text-sm text-yellow-700">The server is unable to apply secure AES encryption right now (503). Please try again later or contact support. If you manage the server, ensure qpdf or Ghostscript is installed.</p>
                        <details className="text-xs text-gray-600 mt-2">
                          <summary>Technical details</summary>
                          <pre className="mt-2 text-xs text-gray-700">{JSON.stringify(encryptionAvailabilityDetails, null, 2)}</pre>
                        </details>
                      </div>
                    </div>
                  </div>
                )}
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
                  {/* Encryption Status Banner */}
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-green-800">
                      <Shield className="w-5 h-5" />
                      <span className="font-semibold">PDF Protected Successfully</span>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      Your PDF is now password-protected. The password will be required to open this file in any PDF viewer.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Original Size</p>
                      <p className="text-lg font-bold">
                        {formatFileSize(protectionResult.originalSize)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Encrypted Size</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatFileSize(protectionResult.protectedSize)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Encryption</p>
                      <p className="text-lg font-bold text-green-600">AES-256</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={downloadResult}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Encrypted PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


        </div>

        <PromoBanner />
      </div>
    </div>
  );
};

export default ProtectPdf;
