/**
 * LibreOffice Conversion Service
 * Handles all document conversions using LibreOffice backend
 */

interface ConversionOptions {
  preserveFormatting?: boolean;
  includeMetadata?: boolean;
  quality?: "high" | "medium" | "low";
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
  private static API_URL = "https://pdfpage-app.onrender.com";

  /**
   * Convert any supported document format using LibreOffice
   */
  static async convertDocument(
    file: File,
    targetFormat: string,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    const startTime = Date.now();

    try {
      options.onProgress?.(
        10,
        `Starting ${this.getFormatName(targetFormat)} conversion...`,
      );

      // Validate file
      this.validateFile(file, targetFormat);

      options.onProgress?.(20, "Preparing file for LibreOffice processing...");

      // Create FormData for the conversion
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetFormat", targetFormat);
      formData.append(
        "preserveFormatting",
        String(options.preserveFormatting ?? true),
      );
      formData.append(
        "includeMetadata",
        String(options.includeMetadata ?? true),
      );
      formData.append("quality", options.quality ?? "high");

      options.onProgress?.(30, "Sending to LibreOffice server...");

      // Make API request to LibreOffice backend
      const response = await fetch(`${this.API_URL}/api/libreoffice/convert`, {
        method: "POST",
        body: formData,
      });

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
      const fileName = this.generateFileName(file.name, targetFormat);

      // Extract metadata from headers
      const metadata = {
        originalSize: file.size,
        convertedSize: arrayBuffer.byteLength,
        processingTime,
        conversionMethod:
          response.headers.get("X-Conversion-Method") || "LibreOffice",
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
   * Text to PDF conversion
   */
  static async textToPdf(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "pdf", options);
  }

  /**
   * ODT to PDF conversion
   */
  static async odtToPdf(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "pdf", options);
  }

  /**
   * RTF to PDF conversion
   */
  static async rtfToPdf(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "pdf", options);
  }

  /**
   * CSV to XLSX conversion
   */
  static async csvToXlsx(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "xlsx", options);
  }

  /**
   * ODT to DOCX conversion
   */
  static async odtToDocx(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "docx", options);
  }

  /**
   * RTF to DOCX conversion
   */
  static async rtfToDocx(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "docx", options);
  }

  /**
   * DOCX to ODT conversion
   */
  static async docxToOdt(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "odt", options);
  }

  /**
   * XLS to CSV conversion
   */
  static async xlsToCsv(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "csv", options);
  }

  /**
   * XLSX to ODS conversion
   */
  static async xlsxToOds(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "ods", options);
  }

  /**
   * PPTX to ODP conversion
   */
  static async pptxToOdp(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "odp", options);
  }

  /**
   * PPTX to PNG conversion
   */
  static async pptxToPng(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "png", options);
  }

  /**
   * DOC to ODT conversion
   */
  static async docToOdt(
    file: File,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    return this.convertDocument(file, "odt", options);
  }

  /**
   * Validate file for conversion
   */
  private static validateFile(file: File, targetFormat: string): void {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.size === 0) {
      throw new Error("File is empty");
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      throw new Error("File is too large (max 50MB)");
    }

    // Validate file type based on conversion
    const allowedExtensions = this.getAllowedExtensions(targetFormat);
    const fileExtension = file.name.toLowerCase().split(".").pop();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      throw new Error(
        `Unsupported file type. Allowed: ${allowedExtensions.join(", ")}`,
      );
    }
  }

  /**
   * Get allowed file extensions for each conversion type
   */
  private static getAllowedExtensions(targetFormat: string): string[] {
    const extensionMap: Record<string, string[]> = {
      pdf: ["txt", "odt", "rtf", "doc", "docx"],
      docx: ["odt", "rtf", "doc", "txt"],
      odt: ["docx", "doc", "rtf", "txt"],
      xlsx: ["csv", "xls", "ods"],
      csv: ["xls", "xlsx", "ods"],
      ods: ["xlsx", "xls", "csv"],
      odp: ["pptx", "ppt"],
      png: ["pptx", "ppt", "odp"],
    };

    return extensionMap[targetFormat] || [];
  }

  /**
   * Generate appropriate filename for converted file
   */
  private static generateFileName(
    originalName: string,
    targetFormat: string,
  ): string {
    const baseName = originalName.replace(/\.[^/.]+$/, "");
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${baseName}_converted_${timestamp}.${targetFormat}`;
  }

  /**
   * Get human-readable format name
   */
  private static getFormatName(format: string): string {
    const formatNames: Record<string, string> = {
      pdf: "PDF",
      docx: "Word Document",
      odt: "OpenDocument Text",
      xlsx: "Excel Spreadsheet",
      csv: "CSV",
      ods: "OpenDocument Spreadsheet",
      odp: "OpenDocument Presentation",
      png: "PNG Image",
      rtf: "Rich Text Format",
    };

    return formatNames[format] || format.toUpperCase();
  }

  /**
   * Download converted file
   */
  static downloadFile(arrayBuffer: ArrayBuffer, fileName: string): void {
    const blob = new Blob([arrayBuffer]);
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

export default LibreOfficeService;
