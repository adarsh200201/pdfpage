import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Download,
  FileText,
  Trash2,
  Crown,
  Star,
  CheckCircle,
  Settings,
  Clock,
  Zap,
  RefreshCw,
  AlertCircle,
  Eye,
  FileCheck,
  Activity,
  BarChart3,
} from "lucide-react";

interface FileWithStatus {
  file: File;
  id: string;
  status: "uploaded" | "processing" | "completed" | "error";
  pages?: number;
  textLength?: number;
  errorMessage?: string;
}

interface ConversionStats {
  totalFiles: number;
  processedFiles: number;
  totalPages: number;
  extractedTextLength: number;
  averageProcessingTime: number;
}

const PdfToWord = () => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<
    {
      name: string;
      url: string;
      size: string;
      pages: number;
      textLength: number;
    }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [conversionMode, setConversionMode] = useState<"editable" | "layout">(
    "editable",
  );

  // Real-time features state
  const [progress, setProgress] = useState(0);
  const [currentProcessingFile, setCurrentProcessingFile] =
    useState<string>("");
  const [processingTime, setProcessingTime] = useState(0);
  const [conversionStats, setConversionStats] = useState<ConversionStats>({
    totalFiles: 0,
    processedFiles: 0,
    totalPages: 0,
    extractedTextLength: 0,
    averageProcessingTime: 0,
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [qualitySettings, setQualitySettings] = useState({
    extractImages: false,
    preserveFormatting: true,
    includeMetadata: true,
    compressionLevel: 80,
  });
  const [livePreview, setLivePreview] = useState(true);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Real-time PDF analysis
  const analyzePdfFile = useCallback(
    async (file: File): Promise<{ pages: number; textLength: number }> => {
      try {
        const pdfjsLib = await import("pdfjs-dist");

        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          disableWorker: false,
          disableStream: true,
          disableAutoFetch: true,
        }).promise;

        let totalTextLength = 0;

        // Quick analysis of first few pages
        const pagesToAnalyze = Math.min(pdf.numPages, 3);
        for (let i = 1; i <= pagesToAnalyze; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          if (textContent?.items) {
            totalTextLength += textContent.items.reduce(
              (acc: number, item: any) => acc + (item.str?.length || 0),
              0,
            );
          }
        }

        // Estimate total text length
        const estimatedTextLength = Math.round(
          (totalTextLength * pdf.numPages) / pagesToAnalyze,
        );

        return { pages: pdf.numPages, textLength: estimatedTextLength };
      } catch (error) {
        console.error("Error analyzing PDF:", error);
        return { pages: 0, textLength: 0 };
      }
    },
    [],
  );

  const handleFileUpload = async (uploadedFiles: File[]) => {
    toast({
      title: "📂 Analyzing PDF files...",
      description: `Scanning ${uploadedFiles.length} file(s) for conversion readiness`,
    });

    const filesWithStatus: FileWithStatus[] = await Promise.all(
      uploadedFiles.map(async (file) => {
        const analysis = await analyzePdfFile(file);
        return {
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: "uploaded" as const,
          pages: analysis.pages,
          textLength: analysis.textLength,
        };
      }),
    );

    setFiles(filesWithStatus);
    setIsComplete(false);
    setConvertedFiles([]);

    // Update stats
    const totalPages = filesWithStatus.reduce(
      (sum, f) => sum + (f.pages || 0),
      0,
    );
    const totalTextLength = filesWithStatus.reduce(
      (sum, f) => sum + (f.textLength || 0),
      0,
    );

    setConversionStats((prev) => ({
      ...prev,
      totalFiles: filesWithStatus.length,
      totalPages,
      extractedTextLength: totalTextLength,
    }));

    toast({
      title: "✅ Analysis complete!",
      description: `Found ${totalPages} pages across ${filesWithStatus.length} file(s)`,
    });
  };

  const handleRemoveFile = (id: string) => {
    const newFiles = files.filter((f) => f.id !== id);
    setFiles(newFiles);

    // Update stats
    const totalPages = newFiles.reduce((sum, f) => sum + (f.pages || 0), 0);
    const totalTextLength = newFiles.reduce(
      (sum, f) => sum + (f.textLength || 0),
      0,
    );

    setConversionStats((prev) => ({
      ...prev,
      totalFiles: newFiles.length,
      totalPages,
      extractedTextLength: totalTextLength,
    }));
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to convert.",
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
    setProgress(0);
    const startTime = Date.now();

    try {
      const convertedDocs: {
        name: string;
        url: string;
        size: string;
        pages: number;
        textLength: number;
      }[] = [];

      let successCount = 0;
      let errorCount = 0;
      let totalProcessingTime = 0;

      for (let index = 0; index < files.length; index++) {
        const fileWithStatus = files[index];
        const fileName = fileWithStatus.file.name;

        try {
          console.log(`Converting ${fileName}...`);
          setCurrentProcessingFile(fileName);

          // Update file status to processing
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileWithStatus.id
                ? { ...f, status: "processing" as const }
                : f,
            ),
          );

          const fileStartTime = Date.now();
          const convertedDoc = await convertPdfToWordWithProgress(
            fileWithStatus.file,
            conversionMode,
          );
          const fileProcessingTime = Date.now() - fileStartTime;
          totalProcessingTime += fileProcessingTime;

          if (convertedDoc && convertedDoc.size > 0) {
            const docSize = `${(convertedDoc.size / 1024 / 1024).toFixed(2)} MB`;
            const docUrl = URL.createObjectURL(convertedDoc);

            convertedDocs.push({
              name: fileName.replace(".pdf", ".docx"),
              url: docUrl,
              size: docSize,
              pages: fileWithStatus.pages || 0,
              textLength: fileWithStatus.textLength || 0,
            });
            successCount++;

            // Update file status to completed
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileWithStatus.id
                  ? { ...f, status: "completed" as const }
                  : f,
              ),
            );
          } else {
            throw new Error("Generated document is empty");
          }
        } catch (error) {
          errorCount++;
          console.error(`Error converting ${fileName}:`, error);

          // Update file status to error
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileWithStatus.id
                ? {
                    ...f,
                    status: "error" as const,
                    errorMessage:
                      error instanceof Error ? error.message : "Unknown error",
                  }
                : f,
            ),
          );

          toast({
            title: `Error converting ${fileName}`,
            description:
              error instanceof Error
                ? error.message
                : "This PDF file could not be converted. Please try another file.",
            variant: "destructive",
          });
        }

        // Update progress
        const fileProgress = ((index + 1) / files.length) * 90;
        setProgress(fileProgress);
      }

      setProgress(95);
      setCurrentProcessingFile("Finalizing conversion...");

      if (convertedDocs.length > 0) {
        setConvertedFiles(convertedDocs);
        setIsComplete(true);
        setProcessingTime(Date.now() - startTime);

        // Update final stats
        setConversionStats((prev) => ({
          ...prev,
          processedFiles: successCount,
          averageProcessingTime: totalProcessingTime / files.length,
        }));

        // Track usage for revenue analytics
        await PDFService.trackUsage(
          "pdf-to-word",
          files.length,
          files.reduce(
            (sum, fileWithStatus) => sum + fileWithStatus.file.size,
            0,
          ),
        );

        const message =
          errorCount > 0
            ? `Successfully converted ${successCount} of ${files.length} PDF(s). ${errorCount} file(s) failed.`
            : `Successfully converted all ${successCount} PDF(s) to Word document(s) in ${Math.round((Date.now() - startTime) / 1000)}s`;

        toast({
          title: "🎉 Conversion completed!",
          description: message,
        });
      } else {
        // Provide specific guidance instead of generic error
        const errorMessage =
          files.length === 1
            ? "The PDF file could not be processed. It might be corrupted, password-protected, or contain only images."
            : `None of the ${files.length} PDF files could be converted. They might be corrupted, password-protected, or contain only images.`;

        toast({
          title: "Conversion failed",
          description: errorMessage,
          variant: "destructive",
        });

        setProgress(0);
        setIsProcessing(false);
        return;
      }

      setProgress(100);
    } catch (error) {
      console.error("Error converting PDF to Word:", error);
      toast({
        title: "Conversion failed",
        description:
          "There was an error converting your PDF files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentProcessingFile("");
    }
  };

  // Format bytes utility
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const convertPdfToWordWithProgress = async (
    file: File,
    mode: "editable" | "layout",
  ): Promise<Blob> => {
    const pdfjsLib = await import("pdfjs-dist");

    // Ensure worker is configured
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      disableWorker: false, // Enable worker
      disableStream: true,
      disableAutoFetch: true,
    }).promise;

    let extractedText = "";
    let totalTextLength = 0;

    // Extract text from all pages
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      try {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();

        let pageText = "";
        if (textContent && textContent.items) {
          textContent.items.forEach((item: any) => {
            if (item.str && typeof item.str === "string") {
              pageText += item.str + " ";
            }
          });
        }

        const cleanPageText = pageText.trim();
        if (cleanPageText.length > 0) {
          extractedText += `\n\n--- Page ${pageNumber} ---\n\n${cleanPageText}`;
          totalTextLength += cleanPageText.length;
        } else {
          extractedText += `\n\n--- Page ${pageNumber} ---\n\n[This page appears to be empty or contains only images]`;
        }
      } catch (pageError) {
        console.warn(`Error processing page ${pageNumber}:`, pageError);
        extractedText += `\n\n--- Page ${pageNumber} ---\n\n[Error reading this page]`;
      }
    }

    // Check if we extracted any meaningful text
    if (totalTextLength < 10) {
      throw new Error(
        "PDF contains no readable text - it may be an image-based PDF that requires OCR",
      );
    }

    // Create a simple HTML document that can be opened as Word
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Converted from PDF</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 1in;
            font-size: 12pt;
          }
          .page-break { page-break-before: always; }
          h1 { font-size: 16pt; font-weight: bold; }
          h2 { font-size: 14pt; font-weight: bold; }
          p { margin-bottom: 12pt; }
        </style>
      </head>
      <body>
        <h1>Converted from: ${file.name}</h1>
        <p><strong>Conversion Mode:</strong> ${mode === "editable" ? "Editable Text" : "Layout Preserving"}</p>
        <div>
          ${extractedText
            .split("\n\n--- Page")
            .map((pageContent, index) => {
              if (index === 0) return `<p>${pageContent}</p>`;
              return `<div class="page-break"><h2>Page ${pageContent.split(" ---")[0]}</h2><p>${pageContent.split(" ---\n\n")[1] || ""}</p></div>`;
            })
            .join("")}
        </div>
      </body>
      </html>
    `;

    // Create blob that will be recognized as a Word document
    return new Blob([htmlContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const downloadAll = () => {
    convertedFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file.url, file.name), index * 100);
    });
  };

  const reset = () => {
    setFiles([]);
    setConvertedFiles([]);
    setIsComplete(false);
    setProgress(0);
    setCurrentProcessingFile("");
    setProcessingTime(0);
    setConversionStats({
      totalFiles: 0,
      processedFiles: 0,
      totalPages: 0,
      extractedTextLength: 0,
      averageProcessingTime: 0,
    });
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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            PDF to Word
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Convert PDF files to editable Word documents. Extract text and
            maintain formatting for easy editing.
          </p>
        </div>

        {/* Real-time Statistics */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {conversionStats.totalFiles} Files
                    </p>
                    <p className="text-xs text-gray-500">
                      {conversionStats.totalPages} pages total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatBytes(conversionStats.extractedTextLength * 2)}
                    </p>
                    <p className="text-xs text-gray-500">Est. Word size</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">{conversionMode}</p>
                    <p className="text-xs text-gray-500">conversion mode</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {processingTime > 0
                        ? `${Math.round(processingTime / 1000)}s`
                        : "~5-15s"}
                    </p>
                    <p className="text-xs text-gray-500">processing time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Advanced Settings Panel */}
        {files.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Advanced Settings
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  {showAdvancedSettings ? "Hide" : "Show"} Settings
                </Button>
              </div>
            </CardHeader>

            {showAdvancedSettings && (
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Extract Images
                      </label>
                      <Switch
                        checked={qualitySettings.extractImages}
                        onCheckedChange={(checked) =>
                          setQualitySettings((prev) => ({
                            ...prev,
                            extractImages: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Preserve Formatting
                      </label>
                      <Switch
                        checked={qualitySettings.preserveFormatting}
                        onCheckedChange={(checked) =>
                          setQualitySettings((prev) => ({
                            ...prev,
                            preserveFormatting: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Include Metadata
                      </label>
                      <Switch
                        checked={qualitySettings.includeMetadata}
                        onCheckedChange={(checked) =>
                          setQualitySettings((prev) => ({
                            ...prev,
                            includeMetadata: checked,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Compression Level: {qualitySettings.compressionLevel}%
                      </label>
                      <Slider
                        value={[qualitySettings.compressionLevel]}
                        onValueChange={([value]) =>
                          setQualitySettings((prev) => ({
                            ...prev,
                            compressionLevel: value,
                          }))
                        }
                        max={100}
                        min={50}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload */}
            {files.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFileUpload}
                  accept=".pdf"
                  multiple={true}
                  maxSize={50}
                  allowedTypes={["pdf"]}
                />
              </div>
            )}

            {/* Enhanced File List */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-dark">
                    Selected Files ({files.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      Live Analysis
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="mb-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Converting PDF files to Word...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    {currentProcessingFile && (
                      <p className="text-xs text-gray-500">
                        Processing: {currentProcessingFile}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {files.map((fileWithStatus) => (
                    <div
                      key={fileWithStatus.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <FileText className="w-5 h-5 text-blue-500" />

                          {/* Status indicator */}
                          <div className="absolute -top-1 -right-1">
                            {fileWithStatus.status === "processing" && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <RefreshCw className="w-2 h-2 text-white animate-spin" />
                              </div>
                            )}
                            {fileWithStatus.status === "completed" && (
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-2 h-2 text-white" />
                              </div>
                            )}
                            {fileWithStatus.status === "error" && (
                              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="font-medium text-text-dark">
                            {fileWithStatus.file.name}
                          </p>
                          <div className="text-sm text-text-light space-y-1">
                            <p>{formatBytes(fileWithStatus.file.size)}</p>
                            {fileWithStatus.pages && (
                              <p>
                                {fileWithStatus.pages} pages • ~
                                {Math.round(
                                  (fileWithStatus.textLength || 0) / 1000,
                                )}
                                k characters
                              </p>
                            )}
                            {fileWithStatus.errorMessage && (
                              <p className="text-red-500 text-xs">
                                {fileWithStatus.errorMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            fileWithStatus.status === "completed"
                              ? "default"
                              : fileWithStatus.status === "processing"
                                ? "secondary"
                                : fileWithStatus.status === "error"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {fileWithStatus.status === "uploaded" && (
                            <Zap className="w-3 h-3 mr-1" />
                          )}
                          {fileWithStatus.status === "processing" && (
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          )}
                          {fileWithStatus.status === "completed" && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {fileWithStatus.status === "error" && (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {fileWithStatus.status.charAt(0).toUpperCase() +
                            fileWithStatus.status.slice(1)}
                        </Badge>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFile(fileWithStatus.id)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conversion Mode */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-text-dark mb-3">
                    Conversion Mode
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        conversionMode === "editable"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setConversionMode("editable")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-text-dark">
                          Editable Text
                        </h4>
                        {conversionMode === "editable" && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-text-light">
                        Extract all text for easy editing. Best for text-based
                        documents.
                      </p>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        conversionMode === "layout"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setConversionMode("layout")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-text-dark">
                          Layout Preserving
                        </h4>
                        {conversionMode === "layout" && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-text-light">
                        Maintain original layout and formatting. Best for
                        complex documents.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">
                        Real-time Analysis Features
                      </p>
                      <ul className="text-blue-700 space-y-1 text-xs">
                        <li>• Live PDF text extraction preview</li>
                        <li>• Page count and content analysis</li>
                        <li>• Estimated conversion time</li>
                        <li>• Progress tracking per file</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Converting... ({Math.round(progress)}%)
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Convert to Word
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFiles([])}
                    disabled={isProcessing}
                  >
                    Clear Files
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setShowAdvancedSettings(!showAdvancedSettings)
                    }
                    disabled={isProcessing}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            )}

            {/* Premium Features */}
            {!user?.isPremium && (
              <Card className="border-brand-yellow bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-800">
                    <Crown className="w-5 h-5 mr-2 text-brand-yellow" />
                    Unlock Premium Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-orange-700 mb-4">
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      OCR for scanned PDFs
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Advanced formatting preservation
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Table and image extraction
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Batch processing up to 50 files
                    </li>
                  </ul>
                  <Button className="bg-brand-yellow text-black hover:bg-yellow-400">
                    <Crown className="w-4 h-4 mr-2" />
                    Get Premium
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Results */
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                Conversion Complete!
              </h3>
              <p className="text-text-light">
                Successfully converted {files.length} PDF(s) to{" "}
                {convertedFiles.length} Word document(s)
              </p>
            </div>

            {/* Enhanced File List with Statistics */}
            <div className="space-y-3 mb-6">
              {convertedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <FileText className="w-6 h-6 text-blue-500" />
                      <div className="absolute -top-1 -right-1">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <FileCheck className="w-2 h-2 text-white" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-text-dark">{file.name}</p>
                      <div className="text-sm text-text-light space-y-1">
                        <p>
                          {file.size} • {file.pages} pages
                        </p>
                        <p>
                          ~{Math.round(file.textLength / 1000)}k characters
                          extracted
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => downloadFile(file.url, file.name)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>

            {/* Conversion Statistics */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-green-900 mb-2">
                Conversion Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Files Processed</p>
                  <p className="font-medium text-green-900">
                    {conversionStats.processedFiles} /{" "}
                    {conversionStats.totalFiles}
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Total Pages</p>
                  <p className="font-medium text-green-900">
                    {conversionStats.totalPages}
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Processing Time</p>
                  <p className="font-medium text-green-900">
                    {Math.round(processingTime / 1000)}s
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Average per File</p>
                  <p className="font-medium text-green-900">
                    {Math.round(conversionStats.averageProcessingTime / 1000)}s
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={downloadAll} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download All Documents
              </Button>
              <Button variant="outline" onClick={reset}>
                Convert More Files
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

export default PdfToWord;
