// Client-side PDF text extraction utility
// This provides a fallback when backend extraction fails

// Simple PDF.js configuration for client-side extraction

export interface ExtractedContent {
  text: string;
  pages: number;
  hasContent: boolean;
  isImageBased: boolean;
  metadata: {
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
  };
}

export async function extractPDFContent(file: File): Promise<ExtractedContent> {
  console.log("🔍 Starting client-side PDF analysis...");

  try {
    // Basic PDF analysis using raw bytes
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfContent = new TextDecoder("latin1").decode(uint8Array);

    // Extract basic information
    let pages = 0;
    let hasTextStreams = false;
    const metadata: any = {};

    // Count pages by looking for page objects
    const pageMatches = pdfContent.match(/\/Type\s*\/Page[\s\n]/g);
    pages = pageMatches ? pageMatches.length : 0;

    // Check for text content streams
    const textMatches = pdfContent.match(/BT[\s\S]*?ET/g);
    hasTextStreams = textMatches && textMatches.length > 0;

    // Try to extract basic metadata
    const titleMatch = pdfContent.match(/\/Title\s*\(\s*([^)]+)\s*\)/);
    if (titleMatch) metadata.title = titleMatch[1];

    const authorMatch = pdfContent.match(/\/Author\s*\(\s*([^)]+)\s*\)/);
    if (authorMatch) metadata.author = authorMatch[1];

    // Estimate content
    let estimatedTextLength = 0;
    if (textMatches) {
      estimatedTextLength = textMatches.join("").length;
    }

    const result: ExtractedContent = {
      text: "", // We don't extract actual text in this simple version
      pages: pages,
      hasContent: hasTextStreams,
      isImageBased: pages > 0 && !hasTextStreams,
      metadata: metadata,
    };

    console.log("✅ Client-side analysis completed:", {
      pages: result.pages,
      hasTextStreams: hasTextStreams,
      isImageBased: result.isImageBased,
      estimatedTextLength: estimatedTextLength,
    });

    return result;
  } catch (error) {
    console.error("❌ Client-side PDF analysis failed:", error);

    return {
      text: "",
      pages: 0,
      hasContent: false,
      isImageBased: false,
      metadata: {},
    };
  }
}

export function createFallbackDocContent(
  fileName: string,
  fileSize: number,
  extractedContent: ExtractedContent,
): string {
  let content = "";

  if (extractedContent.hasContent && extractedContent.text) {
    // Use extracted text if available
    content = extractedContent.text;
  } else if (extractedContent.isImageBased) {
    // Create meaningful content for image-based PDFs
    content = `Document: ${fileName}\n\n`;
    content += `This appears to be a ${extractedContent.pages}-page document that contains primarily images or scanned content.\n\n`;
    content += `File Information:\n`;
    content += `- Pages: ${extractedContent.pages}\n`;
    content += `- File Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`;

    if (extractedContent.metadata.title) {
      content += `- Title: ${extractedContent.metadata.title}\n`;
    }
    if (extractedContent.metadata.author) {
      content += `- Author: ${extractedContent.metadata.author}\n`;
    }

    content += `\nNote: This PDF appears to contain scanned images or graphics rather than extractable text. `;
    content += `For better results with scanned documents, consider using OCR (Optical Character Recognition) tools `;
    content += `to convert the images to searchable text before converting to Word format.\n\n`;
    content += `The original visual content and layout from the PDF should be preserved when possible.`;
  } else {
    // Fallback for unknown issues
    content = `Document: ${fileName}\n\n`;
    content += `This document could not be processed for text extraction. `;
    content += `It may be corrupted, password-protected, or in an unsupported format.\n\n`;
    content += `Original file size: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`;
    content += `Detected pages: ${extractedContent.pages || "Unknown"}\n`;
  }

  return content;
}
