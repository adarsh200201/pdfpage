import { createWorker, Worker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

export interface OcrProgress {
  status: string;
  progress: number;
  userJobId: string;
}

export interface OcrResult {
  extractedText: string[];
  confidence: number;
  detectedLanguages: string[];
  pageCount: number;
  processedPages: number;
  processingTime: number;
  wordCount: number;
  characterCount: number;
  qualityScore: number;
  languageConfidence: Record<string, number>;
  textStructure: {
    headers: number;
    paragraphs: number;
    lists: number;
    tables: number;
  };
}

export interface OcrSettings {
  language: string;
  outputFormat: "txt" | "pdf" | "docx";
  preserveFormatting: boolean;
  enhanceQuality: boolean;
}

class OcrService {
  private worker: Worker | null = null;
  private isInitialized = false;

  // Initialize Tesseract worker
  private async initializeWorker(language: string): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
    }

    this.worker = await createWorker({
      logger: (m) => {
        // Optional: log progress
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    await this.worker.loadLanguage(language);
    await this.worker.initialize(language);
    this.isInitialized = true;
  }

  // Convert PDF page to image
  private async pdfPageToImage(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    scale: number = 2.0,
  ): Promise<ImageData> {
    const page = await pdfDoc.getPage(pageNumber);
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

    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  // Perform OCR on a single page
  private async processPage(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    onProgress?: (progress: number) => void,
  ): Promise<{ text: string; confidence: number }> {
    if (!this.worker || !this.isInitialized) {
      throw new Error("OCR worker not initialized");
    }

    onProgress?.(10);

    // Convert PDF page to image
    const imageData = await this.pdfPageToImage(pdfDoc, pageNumber);
    onProgress?.(30);

    // Create canvas for Tesseract
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    context.putImageData(imageData, 0, 0);

    onProgress?.(50);

    // Perform OCR
    const { data } = await this.worker.recognize(canvas);
    onProgress?.(90);

    return {
      text: data.text.trim(),
      confidence: data.confidence,
    };
  }

  // Main OCR processing function
  async performOcr(
    file: File,
    settings: OcrSettings,
    onProgress?: (progress: number, status: string) => void,
  ): Promise<OcrResult> {
    const startTime = Date.now();

    try {
      onProgress?.(5, "Initializing OCR engine...");

      // Initialize worker with selected language
      await this.initializeWorker(settings.language);

      onProgress?.(10, "Loading PDF document...");

      // Load PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdfDoc.numPages;

      onProgress?.(15, "Starting text extraction...");

      const extractedText: string[] = [];
      const pageConfidences: number[] = [];
      let totalWords = 0;
      let totalCharacters = 0;

      // Process each page
      for (let i = 1; i <= pageCount; i++) {
        const pageProgress = 15 + (i / pageCount) * 70;
        onProgress?.(pageProgress, `Processing page ${i} of ${pageCount}...`);

        try {
          const result = await this.processPage(pdfDoc, i, (progress) => {
            const adjustedProgress =
              pageProgress + (progress / 100) * (70 / pageCount);
            onProgress?.(adjustedProgress, `OCR processing page ${i}...`);
          });

          extractedText.push(result.text);
          pageConfidences.push(result.confidence);

          // Count words and characters
          const words = result.text
            .split(/\s+/)
            .filter((word) => word.length > 0);
          totalWords += words.length;
          totalCharacters += result.text.length;
        } catch (error) {
          console.error(`Error processing page ${i}:`, error);
          extractedText.push(`[Error processing page ${i}]`);
          pageConfidences.push(0);
        }
      }

      onProgress?.(90, "Analyzing results...");

      // Calculate overall confidence
      const averageConfidence =
        pageConfidences.length > 0
          ? pageConfidences.reduce((sum, conf) => sum + conf, 0) /
            pageConfidences.length
          : 0;

      // Analyze text structure
      const textStructure = this.analyzeTextStructure(extractedText);

      // Clean up worker
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
      }

      const processingTime = Date.now() - startTime;

      onProgress?.(100, "OCR complete!");

      return {
        extractedText,
        confidence: Math.round(averageConfidence),
        detectedLanguages: [settings.language],
        pageCount,
        processedPages: extractedText.length,
        processingTime,
        wordCount: totalWords,
        characterCount: totalCharacters,
        qualityScore: Math.round(averageConfidence * 0.9), // Slightly lower than confidence
        languageConfidence: {
          [settings.language]: averageConfidence,
        },
        textStructure,
      };
    } catch (error) {
      // Clean up worker on error
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
      }

      console.error("OCR processing failed:", error);
      throw new Error(
        `OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Analyze text structure for better insights
  private analyzeTextStructure(textPages: string[]): {
    headers: number;
    paragraphs: number;
    lists: number;
    tables: number;
  } {
    let headers = 0;
    let paragraphs = 0;
    let lists = 0;
    let tables = 0;

    const allText = textPages.join("\n");

    // Count headers (lines that are shorter and followed by longer lines)
    const lines = allText.split("\n").filter((line) => line.trim().length > 0);
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1]?.trim();

      if (
        currentLine.length < 50 &&
        nextLine &&
        nextLine.length > currentLine.length
      ) {
        headers++;
      }
    }

    // Count paragraphs (blocks of text separated by empty lines)
    const blocks = allText
      .split(/\n\s*\n/)
      .filter((block) => block.trim().length > 0);
    paragraphs = blocks.length;

    // Count lists (lines starting with bullet points or numbers)
    const listPatterns = /^[\s]*[•\-\*\d+\.]/gm;
    const listMatches = allText.match(listPatterns);
    lists = listMatches ? listMatches.length : 0;

    // Count potential tables (lines with multiple spaces suggesting columns)
    const tablePatterns = /^[^\n]*\s{3,}[^\n]*\s{3,}[^\n]*$/gm;
    const tableMatches = allText.match(tablePatterns);
    tables = tableMatches ? Math.ceil(tableMatches.length / 3) : 0; // Estimate tables

    return { headers, paragraphs, lists, tables };
  }

  // Get supported languages
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: "eng", name: "English" },
      { code: "fra", name: "French" },
      { code: "deu", name: "German" },
      { code: "spa", name: "Spanish" },
      { code: "ita", name: "Italian" },
      { code: "por", name: "Portuguese" },
      { code: "rus", name: "Russian" },
      { code: "chi_sim", name: "Chinese (Simplified)" },
      { code: "chi_tra", name: "Chinese (Traditional)" },
      { code: "jpn", name: "Japanese" },
      { code: "kor", name: "Korean" },
      { code: "ara", name: "Arabic" },
      { code: "hin", name: "Hindi" },
      { code: "tha", name: "Thai" },
      { code: "vie", name: "Vietnamese" },
      { code: "pol", name: "Polish" },
      { code: "nld", name: "Dutch" },
      { code: "swe", name: "Swedish" },
      { code: "dan", name: "Danish" },
      { code: "nor", name: "Norwegian" },
    ];
  }
}

export const ocrService = new OcrService();
