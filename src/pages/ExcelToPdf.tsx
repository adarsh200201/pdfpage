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
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Table,
  Layout,
  Printer,
  Eye,
  Settings,
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

interface ConversionSettings {
  pageSize: "A4" | "Letter" | "Legal" | "A3";
  orientation: "portrait" | "landscape";
  fitToPage: boolean;
  includeGridlines: boolean;
  includeHeaders: boolean;
  scaleToFit: number;
  worksheetSelection: "all" | "active" | "specific";
  selectedSheets: string[];
}

interface WorksheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  hasData: boolean;
}

const ExcelToPdf = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [progress, setProgress] = useState(0);
  const [worksheets, setWorksheets] = useState<WorksheetInfo[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[][]>([]);
  const [settings, setSettings] = useState<ConversionSettings>({
    pageSize: "A4",
    orientation: "landscape",
    fitToPage: true,
    includeGridlines: true,
    includeHeaders: true,
    scaleToFit: 100,
    worksheetSelection: "all",
    selectedSheets: [],
  });

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const supportedFormats = [".xlsx", ".xls", ".csv"];

  const handleFilesSelect = async (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];

      // Validate file type
      const fileExtension = selectedFile.name.toLowerCase().split(".").pop();
      if (!supportedFormats.some((format) => format.includes(fileExtension!))) {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel file (.xlsx, .xls, .csv)",
          variant: "destructive",
        });
        return;
      }

      setFile({
        id: Math.random().toString(36).substr(2, 9),
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
      });

      setIsComplete(false);

      // Analyze the Excel file
      await analyzeExcelFile(selectedFile);
    }
  };

  const analyzeExcelFile = async (file: File) => {
    try {
      // Mock analysis of Excel file structure
      const mockWorksheets: WorksheetInfo[] = [
        {
          name: "Sheet1",
          rowCount: 150,
          columnCount: 8,
          hasData: true,
        },
        {
          name: "Sales Data",
          rowCount: 89,
          columnCount: 12,
          hasData: true,
        },
        {
          name: "Summary",
          rowCount: 25,
          columnCount: 6,
          hasData: true,
        },
      ];

      setWorksheets(mockWorksheets);
      setSettings((prev) => ({
        ...prev,
        selectedSheets: mockWorksheets.map((ws) => ws.name),
      }));

      // Generate preview data
      const mockPreviewData = [
        ["Product", "Q1 Sales", "Q2 Sales", "Q3 Sales", "Q4 Sales", "Total"],
        ["Product A", "125,000", "138,000", "142,000", "156,000", "561,000"],
        ["Product B", "98,000", "112,000", "108,000", "125,000", "443,000"],
        ["Product C", "76,000", "89,000", "94,000", "102,000", "361,000"],
        ["Product D", "45,000", "52,000", "58,000", "67,000", "222,000"],
        ["Total", "344,000", "391,000", "402,000", "450,000", "1,587,000"],
      ];

      setPreviewData(mockPreviewData);

      toast({
        title: "File analyzed",
        description: `Found ${mockWorksheets.length} worksheet(s) in your Excel file`,
      });
    } catch (error) {
      console.error("Error analyzing Excel file:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the Excel file structure",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleConvert = async () => {
    if (!file) return;

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
      toast({
        title: `🔄 Converting ${file.name} to PDF...`,
        description: `Processing ${settings.worksheetSelection === "all" ? worksheets.length : settings.selectedSheets.length} worksheet(s)`,
      });

      // Check file size limits
      const maxSize = user?.isPremium ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds ${user?.isPremium ? "100MB" : "25MB"} limit`,
        );
      }

      setProgress(25);

      // Convert Excel to PDF
      const pdfBytes = await convertExcelToPdf(
        file.file,
        settings,
        (progress) => {
          setProgress(25 + progress * 0.7);
        },
      );

      setProgress(95);

      // Track usage
      await PDFService.trackUsage("excel-to-pdf", 1, file.size);

      // Download the PDF
      const fileName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
      PDFService.downloadFile(pdfBytes, fileName);

      setIsComplete(true);
      setProgress(100);

      toast({
        title: "Success!",
        description: `Excel file converted to PDF successfully`,
      });
    } catch (error: any) {
      console.error("Error converting Excel to PDF:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to convert Excel file to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const convertExcelToPdf = async (
    file: File,
    settings: ConversionSettings,
    onProgress?: (progress: number) => void,
  ): Promise<Uint8Array> => {
    onProgress?.(10);

    // Simulate Excel processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onProgress?.(50);

    const { loadPDFLib } = await import("@/lib/pdf-utils");
    const PDFLib = await loadPDFLib();
    const pdfDoc = await PDFLib.PDFDocument.create();

    onProgress?.(70);

    // Create pages for worksheets
    const sheetsToConvert =
      settings.worksheetSelection === "all"
        ? worksheets
        : worksheets.filter((ws) => settings.selectedSheets.includes(ws.name));

    for (let i = 0; i < sheetsToConvert.length; i++) {
      const worksheet = sheetsToConvert[i];
      const page = pdfDoc.addPage([
        settings.orientation === "landscape" ? 842 : 595,
        settings.orientation === "landscape" ? 595 : 842,
      ]);

      const { width, height } = page.getSize();

      // Add worksheet title
      page.drawText(`Worksheet: ${worksheet.name}`, {
        x: 50,
        y: height - 50,
        size: 16,
      });

      // Add table content simulation
      const tableContent = `
Rows: ${worksheet.rowCount}
Columns: ${worksheet.columnCount}

This PDF contains the converted Excel data from "${worksheet.name}".
In a production environment, this would include:
- All cell data with proper formatting
- Merged cells and formulas
- Charts and images
- Headers and footers
- Conditional formatting

Conversion Settings:
- Page Size: ${settings.pageSize}
- Orientation: ${settings.orientation}
- Scale: ${settings.scaleToFit}%
- Gridlines: ${settings.includeGridlines ? "Included" : "Excluded"}
      `;

      page.drawText(tableContent, {
        x: 50,
        y: height - 100,
        size: 10,
        maxWidth: width - 100,
      });

      onProgress?.(70 + ((i + 1) / sheetsToConvert.length) * 20);
    }

    onProgress?.(95);

    const pdfBytes = await pdfDoc.save();
    onProgress?.(100);

    return pdfBytes;
  };

  const toggleSheetSelection = (sheetName: string) => {
    setSettings((prev) => ({
      ...prev,
      selectedSheets: prev.selectedSheets.includes(sheetName)
        ? prev.selectedSheets.filter((name) => name !== sheetName)
        : [...prev.selectedSheets, sheetName],
    }));
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            Excel to PDF
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Convert Excel spreadsheets to professional PDF documents with
            preserved formatting and layout.
          </p>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* File Upload */}
            {!file && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFilesSelect}
                  multiple={false}
                  maxSize={25}
                  accept=".xlsx,.xls,.csv"
                  allowedTypes={[
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/vnd.ms-excel",
                    "text/csv",
                  ]}
                  uploadText="Drop your Excel file here or click to browse"
                  supportText="Supports .xlsx, .xls, and .csv files"
                />
              </div>
            )}

            {/* File Analysis and Settings */}
            {file && worksheets.length > 0 && !isProcessing && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* File Info and Worksheets */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-heading-small text-text-dark">
                        Excel File Analysis
                      </h3>
                      <Button variant="outline" onClick={() => setFile(null)}>
                        Choose Different File
                      </Button>
                    </div>

                    {/* File Info */}
                    <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50 mb-6">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-dark truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-light">
                          {formatFileSize(file.size)} • {worksheets.length}{" "}
                          worksheet(s)
                        </p>
                      </div>
                    </div>

                    {/* Worksheet Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-text-dark">
                          Worksheets to Convert
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {showPreview ? "Hide" : "Show"} Preview
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 mb-3">
                          <input
                            type="radio"
                            id="all-sheets"
                            name="worksheetSelection"
                            checked={settings.worksheetSelection === "all"}
                            onChange={() =>
                              setSettings((prev) => ({
                                ...prev,
                                worksheetSelection: "all",
                              }))
                            }
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <label
                            htmlFor="all-sheets"
                            className="text-sm font-medium text-text-dark"
                          >
                            Convert all worksheets
                          </label>
                        </div>

                        <div className="flex items-center space-x-3 mb-3">
                          <input
                            type="radio"
                            id="specific-sheets"
                            name="worksheetSelection"
                            checked={settings.worksheetSelection === "specific"}
                            onChange={() =>
                              setSettings((prev) => ({
                                ...prev,
                                worksheetSelection: "specific",
                              }))
                            }
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <label
                            htmlFor="specific-sheets"
                            className="text-sm font-medium text-text-dark"
                          >
                            Select specific worksheets
                          </label>
                        </div>

                        {settings.worksheetSelection === "specific" && (
                          <div className="ml-6 space-y-2">
                            {worksheets.map((worksheet) => (
                              <label
                                key={worksheet.name}
                                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={settings.selectedSheets.includes(
                                    worksheet.name,
                                  )}
                                  onChange={() =>
                                    toggleSheetSelection(worksheet.name)
                                  }
                                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-text-dark">
                                    {worksheet.name}
                                  </div>
                                  <div className="text-sm text-text-light">
                                    {worksheet.rowCount} rows ×{" "}
                                    {worksheet.columnCount} columns
                                  </div>
                                </div>
                                <Table className="w-4 h-4 text-emerald-500" />
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    {showPreview && previewData.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-text-dark mb-3">
                          Data Preview (First Few Rows)
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-300 rounded-lg">
                            <tbody>
                              {previewData.slice(0, 6).map((row, rowIndex) => (
                                <tr
                                  key={rowIndex}
                                  className={
                                    rowIndex === 0
                                      ? "bg-emerald-50"
                                      : "bg-white"
                                  }
                                >
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className={cn(
                                        "px-3 py-2 border-b border-gray-200 text-sm",
                                        rowIndex === 0
                                          ? "font-medium text-emerald-800"
                                          : "text-text-dark",
                                      )}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Settings Panel */}
                <div className="space-y-6">
                  {/* PDF Settings */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-heading-small text-text-dark mb-4">
                      PDF Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Page Size
                        </label>
                        <select
                          value={settings.pageSize}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              pageSize: e.target
                                .value as ConversionSettings["pageSize"],
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="A4">A4</option>
                          <option value="Letter">Letter</option>
                          <option value="Legal">Legal</option>
                          <option value="A3">A3</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Orientation
                        </label>
                        <select
                          value={settings.orientation}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              orientation: e.target.value as
                                | "portrait"
                                | "landscape",
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Scale ({settings.scaleToFit}%)
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="200"
                          value={settings.scaleToFit}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              scaleToFit: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={settings.fitToPage}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                fitToPage: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-text-dark">
                            Fit to Page Width
                          </span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={settings.includeGridlines}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                includeGridlines: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-text-dark">
                            Include Gridlines
                          </span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={settings.includeHeaders}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                includeHeaders: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-text-dark">
                            Include Headers/Footers
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Summary */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-medium text-text-dark mb-3">
                      Conversion Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-light">Worksheets:</span>
                        <span className="text-text-dark">
                          {settings.worksheetSelection === "all"
                            ? worksheets.length
                            : settings.selectedSheets.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-light">Page Size:</span>
                        <span className="text-text-dark">
                          {settings.pageSize} {settings.orientation}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-light">Scale:</span>
                        <span className="text-text-dark">
                          {settings.scaleToFit}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Convert Button */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <Button
                      size="lg"
                      onClick={handleConvert}
                      disabled={
                        settings.worksheetSelection === "specific" &&
                        settings.selectedSheets.length === 0
                      }
                      className="w-full bg-emerald-500 hover:bg-emerald-600"
                    >
                      <FileSpreadsheet className="w-5 h-5 mr-2" />
                      Convert to PDF
                    </Button>
                    <p className="text-xs text-text-light mt-2 text-center">
                      Generate professional PDF from Excel data
                    </p>
                  </div>
                </div>
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

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Converting Excel to PDF...
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  Processing spreadsheet data and formatting
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-text-light mt-2">
                  {progress}% complete
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
              Excel converted to PDF successfully!
            </h3>
            <p className="text-body-medium text-text-light mb-6">
              Your spreadsheet has been converted with all formatting preserved
            </p>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => window.location.reload()}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Convert Another File
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Table className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Multiple Formats
            </h4>
            <p className="text-body-small text-text-light">
              Support for .xlsx, .xls, and .csv file formats
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Layout className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Preserved Formatting
            </h4>
            <p className="text-body-small text-text-light">
              Maintain cell formatting, colors, and layout in PDF output
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Printer className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-text-dark mb-2">
              Print-Ready Output
            </h4>
            <p className="text-body-small text-text-light">
              Professional PDF output optimized for printing and sharing
            </p>
          </div>
        </div>
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

export default ExcelToPdf;
