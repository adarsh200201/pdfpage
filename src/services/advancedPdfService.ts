import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { v4 as uuidv4 } from "uuid";

// Configure PDF.js worker
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface TextExtraction {
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  font: string;
  fontSize: number;
  page: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface PDFSearchResult {
  text: string;
  page: number;
  matches: Array<{
    text: string;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

class AdvancedPDFService {
  private static instance: AdvancedPDFService;
  private ocrWorker: any = null;

  private constructor() {}

  public static getInstance(): AdvancedPDFService {
    if (!AdvancedPDFService.instance) {
      AdvancedPDFService.instance = new AdvancedPDFService();
    }
    return AdvancedPDFService.instance;
  }

  /**
   * Extract text from PDF with position information
   */
  async extractTextWithPositions(file: File): Promise<TextExtraction[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const extractions: TextExtraction[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });

        textContent.items.forEach((item: any) => {
          if (item.str && item.str.trim()) {
            const transform = item.transform;
            extractions.push({
              text: item.str,
              position: {
                x: transform[4],
                y: viewport.height - transform[5],
                width: item.width,
                height: item.height,
              },
              font: item.fontName || "Unknown",
              fontSize: transform[0],
              page: pageNum,
            });
          }
        });
      }

      return extractions;
    } catch (error) {
      console.error("Error extracting text:", error);
      throw new Error("Failed to extract text from PDF");
    }
  }

  /**
   * Perform OCR on PDF pages
   */
  async performOCR(file: File, pageNumbers?: number[]): Promise<OCRResult[]> {
    try {
      if (!this.ocrWorker) {
        this.ocrWorker = await createWorker("eng");
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const results: OCRResult[] = [];

      const pages =
        pageNumbers || Array.from({ length: pdf.numPages }, (_, i) => i + 1);

      for (const pageNum of pages) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const imageData = canvas.toDataURL();
        const { data } = await this.ocrWorker.recognize(imageData);

        results.push({
          text: data.text,
          confidence: data.confidence,
          words: data.words.map((word: any) => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox,
          })),
        });
      }

      return results;
    } catch (error) {
      console.error("Error performing OCR:", error);
      throw new Error("Failed to perform OCR on PDF");
    }
  }

  /**
   * Search text in PDF
   */
  async searchText(file: File, searchTerm: string): Promise<PDFSearchResult[]> {
    try {
      const extractions = await this.extractTextWithPositions(file);
      const results: PDFSearchResult[] = [];
      const regex = new RegExp(searchTerm, "gi");

      const pageGroups = extractions.reduce(
        (acc, extraction) => {
          if (!acc[extraction.page]) {
            acc[extraction.page] = [];
          }
          acc[extraction.page].push(extraction);
          return acc;
        },
        {} as Record<number, TextExtraction[]>,
      );

      Object.entries(pageGroups).forEach(([pageStr, pageExtractions]) => {
        const page = parseInt(pageStr);
        const fullText = pageExtractions.map((e) => e.text).join(" ");
        const matches = [];
        let match;

        while ((match = regex.exec(fullText)) !== null) {
          // Find the extraction that contains this match
          let currentPos = 0;
          for (const extraction of pageExtractions) {
            if (
              currentPos <= match.index &&
              match.index < currentPos + extraction.text.length
            ) {
              matches.push({
                text: match[0],
                position: extraction.position,
              });
              break;
            }
            currentPos += extraction.text.length + 1; // +1 for space
          }
        }

        if (matches.length > 0) {
          results.push({
            text: fullText,
            page,
            matches,
          });
        }
      });

      return results;
    } catch (error) {
      console.error("Error searching text:", error);
      throw new Error("Failed to search text in PDF");
    }
  }

  /**
   * Convert HTML element to PDF
   */
  async htmlToPDF(
    element: HTMLElement,
    filename: string = "document.pdf",
  ): Promise<Blob> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      return pdf.output("blob");
    } catch (error) {
      console.error("Error converting HTML to PDF:", error);
      throw new Error("Failed to convert HTML to PDF");
    }
  }

  /**
   * Merge multiple PDFs
   */
  async mergePDFs(files: File[]): Promise<Uint8Array> {
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      return await mergedPdf.save();
    } catch (error) {
      console.error("Error merging PDFs:", error);
      throw new Error("Failed to merge PDFs");
    }
  }

  /**
   * Split PDF into individual pages
   */
  async splitPDF(file: File): Promise<Uint8Array[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();
      const splitPdfs: Uint8Array[] = [];

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        splitPdfs.push(pdfBytes);
      }

      return splitPdfs;
    } catch (error) {
      console.error("Error splitting PDF:", error);
      throw new Error("Failed to split PDF");
    }
  }

  /**
   * Add watermark to PDF
   */
  async addWatermark(
    file: File,
    watermarkText: string,
    options: {
      fontSize?: number;
      color?: [number, number, number];
      opacity?: number;
      rotation?: number;
      position?:
        | "center"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right";
    } = {},
  ): Promise<Uint8Array> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const {
        fontSize = 50,
        color = [0.8, 0.8, 0.8],
        opacity = 0.3,
        rotation = 45,
        position = "center",
      } = options;

      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        let x = width / 2;
        let y = height / 2;

        // Adjust position based on option
        switch (position) {
          case "top-left":
            x = fontSize;
            y = height - fontSize;
            break;
          case "top-right":
            x = width - fontSize * 3;
            y = height - fontSize;
            break;
          case "bottom-left":
            x = fontSize;
            y = fontSize;
            break;
          case "bottom-right":
            x = width - fontSize * 3;
            y = fontSize;
            break;
        }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font: helveticaFont,
          color: rgb(color[0], color[1], color[2]),
          opacity,
          rotate: { angle: rotation, origin: { x, y } },
        });
      });

      return await pdfDoc.save();
    } catch (error) {
      console.error("Error adding watermark:", error);
      throw new Error("Failed to add watermark to PDF");
    }
  }

  /**
   * Extract images from PDF
   */
  async extractImages(file: File): Promise<Blob[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: Blob[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const ops = await page.getOperatorList();

        for (let i = 0; i < ops.fnArray.length; i++) {
          if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
            const imageName = ops.argsArray[i][0];
            const image = page.objs.get(imageName);

            if (image) {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (ctx && image.data) {
                canvas.width = image.width;
                canvas.height = image.height;

                const imageData = ctx.createImageData(
                  image.width,
                  image.height,
                );
                imageData.data.set(image.data);
                ctx.putImageData(imageData, 0, 0);

                canvas.toBlob((blob) => {
                  if (blob) images.push(blob);
                });
              }
            }
          }
        }
      }

      return images;
    } catch (error) {
      console.error("Error extracting images:", error);
      throw new Error("Failed to extract images from PDF");
    }
  }

  /**
   * Cleanup OCR worker
   */
  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }
}

export default AdvancedPDFService;
