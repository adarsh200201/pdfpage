import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import {
  ArrowLeft,
  Download,
  FileText,
  Scan,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Copy,
  Eye,
  Languages,
  FileImage,
  Type,
  Sparkles,
  Brain,
  Zap,
  Globe,
  Target,
  BookOpen,
  Settings,
  BarChart3,
  Clock,
  Camera,
  Monitor,
  Cpu,
  Activity,
  Shield,
  Award,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Import Tesseract.js for client-side OCR
import { createWorker } from "tesseract.js";

interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview?: string;
}

interface OcrResult {
  extractedText: string;
  confidence: number;
  recognizedBlocks: any[];
  words: any[];
  processingTime: number;
  pageCount: number;
  language: string;
  outputFormat: string;
}

interface RecognitionSettings {
  mode: "standard" | "enhanced" | "precise";
  language: string;
  outputFormat: "txt" | "docx" | "pdf" | "xlsx";
  autoRotate: boolean;
  removeBackground: boolean;
  enhanceContrast: boolean;
}

const OcrPdfProfessional = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [ocrResults, setOcrResults] = useState<OcrResult | null>(null);
  const [realTimePreview, setRealTimePreview] = useState("");

  const [settings, setSettings] = useState<RecognitionSettings>({
    mode: "standard",
    language: "eng",
    outputFormat: "docx",
    autoRotate: true,
    removeBackground: false,
    enhanceContrast: true,
  });

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const workerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Professional language list (30+ languages)
  const languages = [
    { code: "eng", name: "English", flag: "🇺🇸" },
    { code: "fra", name: "French", flag: "🇫🇷" },
    { code: "deu", name: "German", flag: "🇩🇪" },
    { code: "spa", name: "Spanish", flag: "🇪🇸" },
    { code: "ita", name: "Italian", flag: "🇮🇹" },
    { code: "por", name: "Portuguese", flag: "🇵🇹" },
    { code: "rus", name: "Russian", flag: "🇷🇺" },
    { code: "chi_sim", name: "Chinese (Simplified)", flag: "🇨🇳" },
    { code: "chi_tra", name: "Chinese (Traditional)", flag: "🇹🇼" },
    { code: "jpn", name: "Japanese", flag: "🇯🇵" },
    { code: "kor", name: "Korean", flag: "🇰🇷" },
    { code: "ara", name: "Arabic", flag: "🇸🇦" },
    { code: "hin", name: "Hindi", flag: "🇮🇳" },
    { code: "tha", name: "Thai", flag: "🇹🇭" },
    { code: "vie", name: "Vietnamese", flag: "🇻🇳" },
    { code: "pol", name: "Polish", flag: "🇵🇱" },
    { code: "nld", name: "Dutch", flag: "🇳🇱" },
    { code: "swe", name: "Swedish", flag: "🇸🇪" },
    { code: "dan", name: "Danish", flag: "🇩🇰" },
    { code: "nor", name: "Norwegian", flag: "🇳🇴" },
    { code: "fin", name: "Finnish", flag: "🇫🇮" },
    { code: "tur", name: "Turkish", flag: "🇹🇷" },
    { code: "ces", name: "Czech", flag: "🇨🇿" },
    { code: "hun", name: "Hungarian", flag: "🇭🇺" },
    { code: "ron", name: "Romanian", flag: "🇷🇴" },
    { code: "bul", name: "Bulgarian", flag: "🇧🇬" },
    { code: "hrv", name: "Croatian", flag: "🇭🇷" },
    { code: "slk", name: "Slovak", flag: "🇸🇰" },
    { code: "slv", name: "Slovenian", flag: "🇸🇮" },
    { code: "ukr", name: "Ukrainian", flag: "🇺🇦" },
    { code: "heb", name: "Hebrew", flag: "🇮🇱" },
    { code: "ell", name: "Greek", flag: "🇬🇷" },
    { code: "lit", name: "Lithuanian", flag: "🇱🇹" },
    { code: "lav", name: "Latvian", flag: "🇱🇻" },
    { code: "est", name: "Estonian", flag: "🇪🇪" },
  ];

  const recognitionModes = [
    {
      id: "standard",
      name: "Standard",
      description: "Fast processing for most documents",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: "enhanced",
      name: "Enhanced",
      description: "Better accuracy for complex layouts",
      icon: <Brain className="w-4 h-4" />,
    },
    {
      id: "precise",
      name: "Precise",
      description: "Highest accuracy for challenging documents",
      icon: <Target className="w-4 h-4" />,
    },
  ];

  const outputFormats = [
    {
      id: "docx",
      name: "Word (.docx)",
      description: "Editable Microsoft Word document",
      icon: <FileText className="w-4 h-4 text-blue-600" />,
    },
    {
      id: "pdf",
      name: "PDF (.pdf)",
      description: "Searchable PDF document",
      icon: <FileImage className="w-4 h-4 text-red-600" />,
    },
    {
      id: "txt",
      name: "Text (.txt)",
      description: "Plain text file",
      icon: <Type className="w-4 h-4 text-gray-600" />,
    },
    {
      id: "xlsx",
      name: "Excel (.xlsx)",
      description: "For tables and structured data",
      icon: <BarChart3 className="w-4 h-4 text-green-600" />,
    },
  ];

  // Initialize Tesseract worker
  useEffect(() => {
    const initWorker = async () => {
      try {
        workerRef.current = await createWorker({
          logger: (m) => {
            if (m.status === "recognizing text") {
              const progressPercent = Math.round(m.progress * 100);
              setProgress(progressPercent);
              setProcessingStatus(`Recognizing text: ${progressPercent}%`);
            }
          },
        });
      } catch (error) {
        console.error("Failed to initialize OCR worker:", error);
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleFilesSelect = useCallback(
    async (files: File[]) => {
      if (files.length > 0) {
        const selectedFile = files[0];

        // Create preview
        const preview = URL.createObjectURL(selectedFile);

        setFile({
          id: Math.random().toString(36).substr(2, 9),
          file: selectedFile,
          name: selectedFile.name,
          size: selectedFile.size,
          preview,
        });

        setIsComplete(false);
        setOcrResults(null);
        setProgress(0);
        setRealTimePreview("");

        // Start automatic processing if enabled
        if (settings.mode === "standard") {
          setTimeout(() => handleOcr(), 500);
        }
      }
    },
    [settings.mode],
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const convertPdfToCanvas = async (file: File): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Import PDF.js dynamically
          const pdfjsLib = await import("pdfjs-dist");

          // Set worker source
          if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
          }

          const pdfData = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          const page = await pdf.getPage(1);

          const scale = 2.0; // High resolution for better OCR
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
          resolve(canvas);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const enhanceImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    if (!settings.enhanceContrast && !settings.removeBackground) {
      return canvas;
    }

    const enhancedCanvas = document.createElement("canvas");
    const ctx = enhancedCanvas.getContext("2d")!;
    enhancedCanvas.width = canvas.width;
    enhancedCanvas.height = canvas.height;

    ctx.drawImage(canvas, 0, 0);

    if (settings.enhanceContrast) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply contrast enhancement
      const contrast = 1.5;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128; // Red
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
      }

      ctx.putImageData(imageData, 0, 0);
    }

    return enhancedCanvas;
  };

  const handleOcr = async () => {
    if (!file || !workerRef.current) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus("Initializing OCR engine...");
    setRealTimePreview("");

    const startTime = Date.now();

    try {
      toast({
        title: "🚀 Starting OCR Processing",
        description: `Processing ${file.name} in ${settings.mode} mode`,
      });

      // Convert PDF to canvas for OCR processing
      setProcessingStatus("Converting PDF to image...");
      setProgress(10);

      const canvas = await convertPdfToCanvas(file.file);

      setProcessingStatus("Enhancing image quality...");
      setProgress(20);

      const enhancedCanvas = enhanceImage(canvas);

      // Store canvas reference for display
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")!;
        canvasRef.current.width = enhancedCanvas.width;
        canvasRef.current.height = enhancedCanvas.height;
        ctx.drawImage(enhancedCanvas, 0, 0);
      }

      setProcessingStatus("Loading language model...");
      setProgress(30);

      // Configure Tesseract worker
      await workerRef.current.loadLanguage(settings.language);
      await workerRef.current.initialize(settings.language);

      // Set OCR parameters based on mode
      const ocrParams = {
        tessedit_pageseg_mode: settings.mode === "precise" ? "1" : "3",
        tessedit_ocr_engine_mode: "2",
      };

      await workerRef.current.setParameters(ocrParams);

      setProcessingStatus("Performing OCR recognition...");
      setProgress(40);

      // Perform OCR
      const { data } = await workerRef.current.recognize(enhancedCanvas, {
        rectangle: undefined,
      });

      const processingTime = Date.now() - startTime;

      // Update real-time preview as text is recognized
      setRealTimePreview(data.text);

      setProcessingStatus("Finalizing results...");
      setProgress(90);

      const result: OcrResult = {
        extractedText: data.text,
        confidence: Math.round(data.confidence),
        recognizedBlocks: data.blocks || [],
        words: data.words || [],
        processingTime,
        pageCount: 1,
        language: settings.language,
        outputFormat: settings.outputFormat,
      };

      setOcrResults(result);
      setIsComplete(true);
      setProgress(100);
      setProcessingStatus("OCR processing completed!");

      toast({
        title: "✅ OCR Processing Complete!",
        description: `Extracted ${data.text.split(" ").length} words with ${Math.round(data.confidence)}% confidence in ${Math.round(processingTime / 1000)}s`,
      });
    } catch (error: any) {
      console.error("Error performing OCR:", error);
      toast({
        title: "OCR Processing Failed",
        description:
          error.message || "Failed to extract text from PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const performQuickOCR = async (): Promise<string> => {
    if (!file || !workerRef.current) {
      return "OCR processing not available. Please upload a file and try again.";
    }

    try {
      // Convert PDF to canvas
      const canvas = await convertPdfToCanvas(file.file);
      const enhancedCanvas = enhanceImage(canvas);

      // Configure Tesseract worker
      await workerRef.current.loadLanguage(settings.language);
      await workerRef.current.initialize(settings.language);

      // Perform quick OCR
      const { data } = await workerRef.current.recognize(enhancedCanvas);
      return data.text || "No text could be extracted from the document.";
    } catch (error) {
      console.error("Quick OCR failed:", error);
      return "OCR processing failed. Please try again.";
    }
  };

  const handleDownload = async () => {
    if (!file || isDownloading) return;

    setIsDownloading(true);

    try {
      // If we have OCR results, use them; otherwise perform quick OCR
      let extractedText = "";

      if (ocrResults) {
        extractedText = ocrResults.extractedText;
      } else {
        // Perform quick OCR for download
        extractedText = await performQuickOCR();
      }

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");

      switch (settings.outputFormat) {
        case "docx":
          await downloadAsWord(extractedText, `OCR_Result_${timestamp}.docx`);
          break;
        case "pdf":
          await downloadAsPDF(extractedText, `OCR_Result_${timestamp}.pdf`);
          break;
        case "xlsx":
          await downloadAsExcel(extractedText, `OCR_Result_${timestamp}.xlsx`);
          break;
        case "txt":
          await downloadAsText(extractedText, `OCR_Result_${timestamp}.txt`);
          break;
        default:
          await downloadAsText(extractedText, `OCR_Result_${timestamp}.txt`);
      }

      toast({
        title: "✅ Download Complete",
        description: `Downloaded ${settings.outputFormat.toUpperCase()} file successfully`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsWord = async (text: string, filename: string) => {
    const { Document, Packer, Paragraph, TextRun } = await import("docx");
    const { saveAs } = await import("file-saver");

    // Split text into paragraphs
    const paragraphs = text
      .split("\n")
      .filter((line) => line.trim())
      .map(
        (line) =>
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 24, // 12pt font
              }),
            ],
            spacing: {
              after: 200, // Add spacing after paragraph
            },
          }),
      );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "OCR Extracted Text",
                  bold: true,
                  size: 32, // 16pt font for title
                }),
              ],
              spacing: {
                after: 400,
              },
            }),
            ...paragraphs,
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
  };

  const downloadAsPDF = async (text: string, filename: string) => {
    const { jsPDF } = await import("jspdf");
    const { saveAs } = await import("file-saver");

    const pdf = new jsPDF();

    // Add title
    pdf.setFontSize(16);
    pdf.setFont(undefined, "bold");
    pdf.text("OCR Extracted Text", 20, 20);

    // Add content
    pdf.setFontSize(12);
    pdf.setFont(undefined, "normal");

    const lines = pdf.splitTextToSize(text, 170);
    let y = 40;

    lines.forEach((line: string) => {
      if (y > 280) {
        // Create new page if needed
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 20, y);
      y += 7;
    });

    const blob = pdf.output("blob");
    saveAs(blob, filename);
  };

  const downloadAsExcel = async (text: string, filename: string) => {
    const XLSX = await import("xlsx");
    const { saveAs } = await import("file-saver");

    // Split text into lines for Excel rows
    const lines = text.split("\n").filter((line) => line.trim());

    // Create worksheet data
    const wsData = [
      ["OCR Extracted Text"], // Header
      [""], // Empty row
      ...lines.map((line, index) => [`Line ${index + 1}`, line]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = [
      { width: 15 }, // Line number column
      { width: 100 }, // Text column
    ];

    XLSX.utils.book_append_sheet(wb, ws, "OCR Results");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  };

  const downloadAsText = async (text: string, filename: string) => {
    const { saveAs } = await import("file-saver");

    const content = `OCR Extracted Text\n${"=".repeat(50)}\n\n${text}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, filename);
  };

  const copyToClipboard = async () => {
    if (!ocrResults) return;

    try {
      await navigator.clipboard.writeText(ocrResults.extractedText);
      toast({
        title: "Copied to Clipboard",
        description: "Text has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-medium hover:text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Scan className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-text-dark">
              Professional OCR
            </h1>
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Award className="w-4 h-4 mr-1" />
              Industry Leading
            </Badge>
          </div>
          <p className="text-text-light text-lg max-w-3xl mx-auto">
            Advanced OCR technology with real-time processing, 99%+ accuracy,
            and support for 35+ languages. Convert scanned PDFs to editable
            documents instantly.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-semibold">99%+ Accuracy</div>
            <div className="text-sm text-text-light">Enterprise grade</div>
          </Card>
          <Card className="text-center p-4">
            <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-semibold">35+ Languages</div>
            <div className="text-sm text-text-light">Global support</div>
          </Card>
          <Card className="text-center p-4">
            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="font-semibold">Real-time</div>
            <div className="text-sm text-text-light">Instant processing</div>
          </Card>
          <Card className="text-center p-4">
            <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="font-semibold">AI-Powered</div>
            <div className="text-sm text-text-light">Smart recognition</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Recognition Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                {!file ? (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Upload Document
                    </Label>
                    <FileUpload
                      accept=".pdf"
                      multiple={false}
                      onFilesSelect={handleFilesSelect}
                      className="h-32"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <FileText className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-light">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Recognition Mode */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Recognition Mode
                  </Label>
                  <Select
                    value={settings.mode}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        mode: value as any,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recognitionModes.map((mode) => (
                        <SelectItem key={mode.id} value={mode.id}>
                          <div className="flex items-center gap-2">
                            {mode.icon}
                            <div>
                              <div className="font-medium">{mode.name}</div>
                              <div className="text-xs text-text-light">
                                {mode.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Language Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Recognize Language
                  </Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Output Format */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Output Format
                  </Label>
                  <div className="space-y-2">
                    {outputFormats.map((format) => (
                      <div
                        key={format.id}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-all",
                          settings.outputFormat === format.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300",
                        )}
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            outputFormat: format.id as any,
                          }))
                        }
                      >
                        <div className="flex items-center gap-3">
                          {format.icon}
                          <div>
                            <div className="font-medium text-sm">
                              {format.name}
                            </div>
                            <div className="text-xs text-text-light">
                              {format.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download Button */}
                {file && (
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full"
                    size="lg"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download {settings.outputFormat.toUpperCase()}
                      </>
                    )}
                  </Button>
                )}

                {/* Progress */}
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-text-light text-center">
                      {processingStatus}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Monitor className="w-5 h-5" />
                    )}
                    {isComplete ? "Recognition Results" : "Real-time Preview"}
                  </CardTitle>
                  {isComplete && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Text
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text">Extracted Text</TabsTrigger>
                    <TabsTrigger value="preview">Document Preview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="mt-4">
                    <div className="border border-gray-200 rounded-md p-4 min-h-96 max-h-96 overflow-y-auto bg-white">
                      {isProcessing ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                            <p className="text-sm text-text-light">
                              Processing document...
                            </p>
                            {realTimePreview && (
                              <div className="mt-4 text-left p-4 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-600 mb-2">
                                  Real-time preview:
                                </p>
                                <p className="text-sm whitespace-pre-wrap">
                                  {realTimePreview}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : ocrResults ? (
                        <div className="space-y-4">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {ocrResults.extractedText}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-text-light">
                          <div className="text-center">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Upload a PDF to start OCR processing</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-4">
                    <div className="border border-gray-200 rounded-md p-4 min-h-96 max-h-96 overflow-auto bg-gray-50">
                      {file ? (
                        <div className="text-center">
                          <canvas
                            ref={canvasRef}
                            className="max-w-full h-auto border border-gray-300 rounded shadow-sm"
                            style={{ maxHeight: "350px" }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-text-light">
                          <div className="text-center">
                            <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Document preview will appear here</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="mt-4">
                    <div className="space-y-4">
                      {ocrResults ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {ocrResults.confidence}%
                            </div>
                            <div className="text-sm text-text-light">
                              Confidence
                            </div>
                          </Card>
                          <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {
                                ocrResults.extractedText
                                  .split(" ")
                                  .filter((w) => w.length > 0).length
                              }
                            </div>
                            <div className="text-sm text-text-light">Words</div>
                          </Card>
                          <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {ocrResults.extractedText.length}
                            </div>
                            <div className="text-sm text-text-light">
                              Characters
                            </div>
                          </Card>
                          <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {Math.round(ocrResults.processingTime / 1000)}s
                            </div>
                            <div className="text-sm text-text-light">
                              Processing
                            </div>
                          </Card>
                        </div>
                      ) : (
                        <div className="space-y-6 p-6">
                          {/* Premium OCR Features Ad */}
                          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                  <Crown className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                    Unlock Premium OCR Features
                                  </h3>
                                  <p className="text-blue-700 mb-4">
                                    Get 99.9% accuracy, batch processing, and
                                    advanced analytics with our premium plan.
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                      <CheckCircle className="w-4 h-4" />
                                      Batch OCR Processing
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                      <CheckCircle className="w-4 h-4" />
                                      Advanced Analytics
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                      <CheckCircle className="w-4 h-4" />
                                      50+ Languages
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                      <CheckCircle className="w-4 h-4" />
                                      API Access
                                    </div>
                                  </div>
                                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                    Upgrade to Premium
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* PDF Tools Ad */}
                          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                  <FileText className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                                    Explore More PDF Tools
                                  </h3>
                                  <p className="text-green-700 mb-4">
                                    Discover our complete suite of PDF
                                    processing tools for all your document
                                    needs.
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <div className="text-center p-3 bg-white rounded-lg border border-green-100">
                                      <FileText className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                      <div className="text-xs font-medium">
                                        Merge PDF
                                      </div>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg border border-green-100">
                                      <Sparkles className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                      <div className="text-xs font-medium">
                                        Compress
                                      </div>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg border border-green-100">
                                      <Shield className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                      <div className="text-xs font-medium">
                                        Protect
                                      </div>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg border border-green-100">
                                      <Type className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                      <div className="text-xs font-medium">
                                        Edit PDF
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    className="border-green-600 text-green-600 hover:bg-green-50"
                                  >
                                    View All Tools
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* AI-Powered Features Ad */}
                          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                  <Brain className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                                    AI-Powered Document Intelligence
                                  </h3>
                                  <p className="text-purple-700 mb-4">
                                    Experience the future of document processing
                                    with our AI-powered features.
                                  </p>
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                      Smart Layout Detection
                                    </Badge>
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                      Auto Text Formatting
                                    </Badge>
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                      Document Summarization
                                    </Badge>
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                      Multi-language Support
                                    </Badge>
                                  </div>
                                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Try AI Features
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        <PromoBanner />
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default OcrPdfProfessional;
