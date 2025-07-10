import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import * as fabric from "fabric";
import { saveAs } from "file-saver";
import {
  PDFElement,
  TextElement,
  DrawElement,
  ShapeElement,
  ImageElement,
  SignatureElement,
} from "@/hooks/usePDFEditor";

export interface ExportOptions {
  format: "pdf" | "png" | "jpg";
  quality?: number;
  dpi?: number;
  includeAnnotations?: boolean;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
}

export class PDFEditorService {
  private static instance: PDFEditorService;
  private pdfDocument: PDFDocument | null = null;
  private originalPdfBytes: Uint8Array | null = null;

  static getInstance(): PDFEditorService {
    if (!PDFEditorService.instance) {
      PDFEditorService.instance = new PDFEditorService();
    }
    return PDFEditorService.instance;
  }

  // Initialize PDF.js worker
  static initializePDFjs() {
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }

  // Load PDF document
  async loadPDF(file: File): Promise<{
    pdfDocument: pdfjsLib.PDFDocumentProxy;
    metadata: PDFMetadata;
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Store a copy to prevent ArrayBuffer detachment
      this.originalPdfBytes = new Uint8Array(arrayBuffer).slice();

      // Create a copy for pdf-lib to avoid ArrayBuffer detachment issues
      const pdfLibBuffer = new Uint8Array(this.originalPdfBytes.slice());

      // Load with PDF.js for rendering using a copy
      const pdfJsBuffer = new Uint8Array(this.originalPdfBytes.slice());
      const pdfDocument = await pdfjsLib.getDocument({
        data: pdfJsBuffer,
      }).promise;

      // Load with pdf-lib for editing using the copied buffer
      this.pdfDocument = await PDFDocument.load(pdfLibBuffer);

      // Extract metadata
      const metadata = await this.extractMetadata();

      return { pdfDocument, metadata };
    } catch (error) {
      console.error("Error loading PDF:", error);
      throw new Error("Failed to load PDF file");
    }
  }

  // Extract PDF metadata
  private async extractMetadata(): Promise<PDFMetadata> {
    if (!this.pdfDocument) return {};

    try {
      const title = this.pdfDocument.getTitle();
      const author = this.pdfDocument.getAuthor();
      const subject = this.pdfDocument.getSubject();
      const keywords = this.pdfDocument.getKeywords();
      const creator = this.pdfDocument.getCreator();
      const producer = this.pdfDocument.getProducer();

      return {
        title: title || undefined,
        author: author || undefined,
        subject: subject || undefined,
        keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
        creator: creator || undefined,
        producer: producer || undefined,
      };
    } catch (error) {
      console.warn("Could not extract PDF metadata:", error);
      return {};
    }
  }

  // Export PDF with elements
  async exportPDF(
    elements: PDFElement[],
    options: ExportOptions = { format: "pdf" },
  ): Promise<Uint8Array> {
    if (!this.pdfDocument) {
      throw new Error("No PDF document loaded");
    }

    if (!this.originalPdfBytes) {
      throw new Error("Original PDF data is not available");
    }

    try {
      // Check if originalPdfBytes is still valid
      if (!this.originalPdfBytes || this.originalPdfBytes.byteLength === 0) {
        throw new Error("Original PDF data is no longer available");
      }

      // Create a copy of the PDF using a fresh buffer copy
      const freshBuffer = new Uint8Array(this.originalPdfBytes.slice());
      const pdfDoc = await PDFDocument.load(freshBuffer);
      const pages = pdfDoc.getPages();

      // Group elements by page
      const elementsByPage = this.groupElementsByPage(elements);

      // Process each page
      for (const [pageIndex, pageElements] of elementsByPage.entries()) {
        const page = pages[pageIndex];
        if (!page) continue;

        await this.addElementsToPage(page, pageElements);
      }

      // Set metadata
      pdfDoc.setTitle("Edited PDF");
      pdfDoc.setProducer("PDFPage Editor");
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      return await pdfDoc.save();
    } catch (error) {
      console.error("Error exporting PDF:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("ArrayBuffer")) {
          throw new Error(
            "PDF data is corrupted or detached. Please reload the PDF file.",
          );
        } else if (error.message.includes("PDF")) {
          throw new Error(`PDF processing error: ${error.message}`);
        }
      }

      throw new Error("Failed to export PDF. Please try again.");
    }
  }

  // Export and download PDF using FileSaver.js
  async exportAndDownloadPDF(
    elements: PDFElement[],
    filename: string = "edited-document.pdf",
    options: ExportOptions = { format: "pdf" },
  ): Promise<void> {
    try {
      const pdfBytes = await this.exportPDF(elements, options);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, filename);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      throw error;
    }
  }

  // Group elements by page index
  private groupElementsByPage(
    elements: PDFElement[],
  ): Map<number, PDFElement[]> {
    const grouped = new Map<number, PDFElement[]>();

    for (const element of elements) {
      if (!element.visible) continue;

      const pageElements = grouped.get(element.pageIndex) || [];
      pageElements.push(element);
      grouped.set(element.pageIndex, pageElements);
    }

    return grouped;
  }

  // Add elements to a PDF page
  private async addElementsToPage(
    page: any,
    elements: PDFElement[],
  ): Promise<void> {
    const { width, height } = page.getSize();

    // Sort elements by creation time to maintain layer order
    const sortedElements = [...elements].sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    for (const element of sortedElements) {
      try {
        await this.addElementToPage(page, element, { width, height });
      } catch (error) {
        console.warn(`Failed to add element ${element.id}:`, error);
      }
    }
  }

  // Add a single element to a page
  private async addElementToPage(
    page: any,
    element: PDFElement,
    pageSize: { width: number; height: number },
  ): Promise<void> {
    const { bounds, opacity, rotation } = element;
    const x = bounds.x;
    const y = pageSize.height - bounds.y - bounds.height; // PDF coordinate system

    switch (element.type) {
      case "text":
        await this.addTextElement(page, element as TextElement, x, y);
        break;

      case "rectangle":
        await this.addRectangleElement(page, element as ShapeElement, x, y);
        break;

      case "circle":
        await this.addCircleElement(page, element as ShapeElement, x, y);
        break;

      case "draw":
        await this.addDrawElement(
          page,
          element as DrawElement,
          pageSize.height,
        );
        break;

      case "image":
        await this.addImageElement(page, element as ImageElement, x, y);
        break;

      case "signature":
        await this.addSignatureElement(page, element as SignatureElement, x, y);
        break;
    }
  }

  // Add text element
  private async addTextElement(
    page: any,
    element: TextElement,
    x: number,
    y: number,
  ): Promise<void> {
    const color = this.parseColor(element.color);

    page.drawText(element.content, {
      x,
      y,
      size: element.fontSize,
      color,
      opacity: element.opacity,
      rotate: {
        type: "degrees",
        angle: element.rotation,
      },
    });
  }

  // Add rectangle element
  private async addRectangleElement(
    page: any,
    element: ShapeElement,
    x: number,
    y: number,
  ): Promise<void> {
    const fillColor = this.parseColor(element.fillColor);
    const borderColor = this.parseColor(element.strokeColor);

    page.drawRectangle({
      x,
      y,
      width: element.bounds.width,
      height: element.bounds.height,
      color: element.filled ? fillColor : undefined,
      borderColor,
      borderWidth: element.strokeWidth,
      opacity: element.opacity,
      rotate: {
        type: "degrees",
        angle: element.rotation,
      },
    });
  }

  // Add circle element
  private async addCircleElement(
    page: any,
    element: ShapeElement,
    x: number,
    y: number,
  ): Promise<void> {
    const fillColor = this.parseColor(element.fillColor);
    const borderColor = this.parseColor(element.strokeColor);
    const radius = Math.min(element.bounds.width, element.bounds.height) / 2;

    page.drawCircle({
      x: x + radius,
      y: y + radius,
      size: radius,
      color: element.filled ? fillColor : undefined,
      borderColor,
      borderWidth: element.strokeWidth,
      opacity: element.opacity,
    });
  }

  // Add drawing element
  private async addDrawElement(
    page: any,
    element: DrawElement,
    pageHeight: number,
  ): Promise<void> {
    if (element.path.length < 2) return;

    // Convert path to SVG path string
    const pathString = this.convertPathToSVG(element.path, pageHeight);
    const color = this.parseColor(element.strokeColor);

    // Note: pdf-lib doesn't have direct path drawing
    // This is a simplified implementation
    // You might need to use additional libraries for complex paths
    console.warn("Complex path drawing not fully implemented in pdf-lib");
  }

  // Add image element
  private async addImageElement(
    page: any,
    element: ImageElement,
    x: number,
    y: number,
  ): Promise<void> {
    try {
      // Convert base64 to bytes
      const imageBytes = this.base64ToBytes(element.src);

      let image;
      if (element.src.includes("data:image/png")) {
        image = await page.doc.embedPng(imageBytes);
      } else if (
        element.src.includes("data:image/jpeg") ||
        element.src.includes("data:image/jpg")
      ) {
        image = await page.doc.embedJpg(imageBytes);
      } else {
        console.warn("Unsupported image format");
        return;
      }

      page.drawImage(image, {
        x,
        y,
        width: element.bounds.width,
        height: element.bounds.height,
        opacity: element.opacity,
        rotate: {
          type: "degrees",
          angle: element.rotation,
        },
      });
    } catch (error) {
      console.warn("Failed to add image:", error);
    }
  }

  // Add signature element
  private async addSignatureElement(
    page: any,
    element: SignatureElement,
    x: number,
    y: number,
  ): Promise<void> {
    try {
      const imageBytes = this.base64ToBytes(element.signatureData);
      const image = await page.doc.embedPng(imageBytes);

      page.drawImage(image, {
        x,
        y,
        width: element.bounds.width,
        height: element.bounds.height,
        opacity: element.opacity,
        rotate: {
          type: "degrees",
          angle: element.rotation,
        },
      });
    } catch (error) {
      console.warn("Failed to add signature:", error);
    }
  }

  // Utility functions
  private parseColor(colorString: string): any {
    if (colorString.startsWith("#")) {
      const hex = colorString.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return rgb(r, g, b);
    }
    return rgb(0, 0, 0); // Default to black
  }

  private base64ToBytes(base64String: string): Uint8Array {
    const base64 = base64String.split(",")[1] || base64String;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private convertPathToSVG(
    path: { x: number; y: number }[],
    pageHeight: number,
  ): string {
    if (path.length === 0) return "";

    let pathString = `M ${path[0].x} ${pageHeight - path[0].y}`;

    for (let i = 1; i < path.length; i++) {
      pathString += ` L ${path[i].x} ${pageHeight - path[i].y}`;
    }

    return pathString;
  }

  // Export as image
  async exportAsImage(
    elements: PDFElement[],
    pageIndex: number,
    format: "png" | "jpg" = "png",
    quality: number = 0.9,
  ): Promise<Blob> {
    // This would require canvas rendering
    // Implementation depends on your specific needs
    throw new Error("Image export not implemented yet");
  }

  // Get PDF statistics
  getDocumentStats(): {
    pageCount: number;
    elementCount: number;
    fileSize: number;
  } {
    return {
      pageCount: this.pdfDocument?.getPageCount() || 0,
      elementCount: 0, // Would be passed from outside
      fileSize: this.originalPdfBytes?.length || 0,
    };
  }

  // Cleanup
  destroy(): void {
    this.pdfDocument = null;
    this.originalPdfBytes = null;
  }
}

// Export singleton instance
export const pdfEditorService = PDFEditorService.getInstance();

// Initialize PDF.js on module load
PDFEditorService.initializePDFjs();
