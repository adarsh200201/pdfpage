/**
 * LibreOffice Conversion Service
 * Handles all document conversions using LibreOffice backend
 */

interface ConversionOptions {
  preserveFormatting?: boolean;
  includeMetadata?: boolean;
  quality?: "high" | "medium" | "low" | "standard" | "premium";
  onProgress?: (progress: number, message: string) => void;
}

interface ConversionResult {
  success: boolean;
  data?: ArrayBuffer;
  fileName?: string;
  error?: string;
  metadata?: {
    originalSize: number;
    convertedSize: number;
    processingTime: number;
    conversionMethod: string;
  };
}

export class LibreOfficeService {
  private static API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://pdfpage-app.onrender.com";

  /**
   * Make LibreOffice conversion request to specific endpoint
   */
  private static async makeConversionRequest(
    file: File,
    endpoint: string,
    targetExtension: string,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    const startTime = Date.now();

    try {
      options.onProgress?.(10, `Starting LibreOffice conversion...`);

      // Create FormData for the conversion
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "preserveFormatting",
        String(options.preserveFormatting ?? true),
      );
      formData.append("quality", options.quality ?? "standard");

      options.onProgress?.(30, "Sending to LibreOffice server...");

      // Make API request to LibreOffice backend
      const response = await fetch(
        `${this.API_URL}/api/libreoffice/${endpoint}`,
        {
          method: "POST",
          body: formData,
        },
      );

      options.onProgress?.(80, "Processing conversion...");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Conversion failed: ${response.status}`,
        );
      }

      // Get the converted file
      const arrayBuffer = await response.arrayBuffer();
      const processingTime = Date.now() - startTime;

      options.onProgress?.(95, "Finalizing...");

      // Generate appropriate filename
      const fileName = this.generateFileName(file.name, targetExtension);

      // Extract metadata from headers
      const metadata = {
        originalSize: file.size,
        convertedSize: arrayBuffer.byteLength,
        processingTime,
        conversionMethod: "LibreOffice",
      };

      options.onProgress?.(100, "Conversion completed!");

      return {
        success: true,
        data: arrayBuffer,
        fileName,
        metadata,
      };
    } catch (error) {
      console.error("LibreOffice conversion failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Conversion failed",
      };
    }
  }

  /**
   * Document to PDF conversions
   */
  static async textToPdf(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "text-to-pdf", "pdf", options);
  }

  static async odtToPdf(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "odt-to-pdf", "pdf", options);
  }

  static async rtfToPdf(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "rtf-to-pdf", "pdf", options);
  }

  /**
   * Document format conversions
   */
  static async rtfToDocx(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "rtf-to-docx", "docx", options);
  }

  static async odtToDocx(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "odt-to-docx", "docx", options);
  }

  static async docxToOdt(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "docx-to-odt", "odt", options);
  }

  static async docToOdt(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "doc-to-odt", "odt", options);
  }

  /**
   * Spreadsheet conversions
   */
  static async csvToXlsx(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "csv-to-xlsx", "xlsx", options);
  }

  static async xlsToCsv(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "xls-to-csv", "csv", options);
  }

  static async xlsxToOds(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "xlsx-to-ods", "ods", options);
  }

  /**
   * Presentation conversions
   */
  static async pptxToPng(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "pptx-to-png", "png", options);
  }

  static async pptxToOdp(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.makeConversionRequest(file, "pptx-to-odp", "odp", options);
  }

  /**
   * Helper Methods
   */
  static generateFileName(
    originalName: string,
    targetExtension: string,
  ): string {
    const baseName =
      originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    return `${baseName}.${targetExtension}`;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  static async downloadFile(
    arrayBuffer: ArrayBuffer,
    fileName: string,
  ): Promise<void> {
    const blob = new Blob([arrayBuffer]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
