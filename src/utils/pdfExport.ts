import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  AnyElement,
  TextElement,
  DrawElement,
  ShapeElement,
} from "@/types/pdf-editor";

export interface ExportOptions {
  originalFile: File;
  elements: AnyElement[];
  pageCount: number;
}

export async function exportPDFWithEdits(
  options: ExportOptions,
): Promise<Uint8Array> {
  const { originalFile, elements, pageCount } = options;

  try {
    // Load the original PDF
    const originalPdfBytes = await originalFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(originalPdfBytes);

    // Get pages
    const pages = pdfDoc.getPages();

    // Group elements by page
    const elementsByPage = elements.reduce(
      (acc, element) => {
        if (!acc[element.pageIndex]) {
          acc[element.pageIndex] = [];
        }
        acc[element.pageIndex].push(element);
        return acc;
      },
      {} as Record<number, AnyElement[]>,
    );

    // For text replacement workflow:
    // 1. Hide/remove original text that was replaced
    // 2. Add only the new text elements
    const textReplacements = elements.filter(
      (el) => el.type === "text" && (el as any).properties?.isReplacement,
    );

    console.log(
      `📝 Processing ${elements.length} elements, ${textReplacements.length} text replacements`,
    );

    // Process each page
    for (
      let pageIndex = 0;
      pageIndex < Math.min(pageCount, pages.length);
      pageIndex++
    ) {
      const page = pages[pageIndex];
      const pageElements = elementsByPage[pageIndex] || [];

      const { width: pageWidth, height: pageHeight } = page.getSize();

      // For text replacements, we need to handle them specially:
      // 1. Original text is already hidden in the UI
      // 2. We only render the new text
      const elementsToRender = pageElements.filter((element) => {
        // Skip empty text elements (deleted text)
        if (element.type === "text" && !(element as any).properties?.text) {
          return false;
        }
        return true;
      });

      console.log(
        `📄 Page ${pageIndex + 1}: Rendering ${elementsToRender.length} elements`,
      );

      for (const element of elementsToRender) {
        await addElementToPage(page, element, pageWidth, pageHeight, pdfDoc);
      }
    }

    // Add metadata about the editing session
    pdfDoc.setSubject(`Edited PDF - ${elements.length} modifications applied`);
    pdfDoc.setCreator("PdfPage - Real-time Text Editor");
    pdfDoc.setProducer("PdfPage Enhanced PDF Editor");
    pdfDoc.setModificationDate(new Date());

    // Serialize the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error("Error exporting PDF:", error);
    throw new Error("Failed to export PDF with edits");
  }
}

async function addElementToPage(
  page: any,
  element: AnyElement,
  pageWidth: number,
  pageHeight: number,
  pdfDoc: PDFDocument,
) {
  const { bounds } = element;

  // Convert coordinates (PDF coordinate system has origin at bottom-left)
  const x = bounds.x;
  const y = pageHeight - bounds.y - bounds.height;

  switch (element.type) {
    case "text":
      await addTextElement(page, element as TextElement, x, y, pdfDoc);
      break;
    case "rectangle":
      await addRectangleElement(page, element as ShapeElement, x, y);
      break;
    case "circle":
      await addCircleElement(page, element as ShapeElement, x, y);
      break;
    case "arrow":
      await addArrowElement(page, element as ShapeElement, x, y);
      break;
    case "draw":
    case "drawing":
      await addDrawElement(page, element as DrawElement, pageHeight);
      break;
    case "image":
      await addImageElement(page, element as any, x, y, pdfDoc);
      break;
    case "signature":
      await addSignatureElement(page, element as any, x, y, pdfDoc);
      break;
    case "note":
      await addNoteElement(page, element as any, x, y, pdfDoc);
      break;
    default:
      console.warn(`Unsupported element type: ${element.type}`);
  }
}

async function addTextElement(
  page: any,
  element: TextElement | any,
  x: number,
  y: number,
  pdfDoc: PDFDocument,
) {
  try {
    const { properties } = element;

    // Skip empty text (deleted text)
    if (!properties.text || properties.text.trim() === "") {
      console.log("⏭️ Skipping empty text element");
      return;
    }

    // Enhanced font selection based on fontFamily
    let font;
    try {
      const fontFamily = properties.fontFamily?.toLowerCase() || "";

      if (fontFamily.includes("times")) {
        font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      } else if (fontFamily.includes("courier")) {
        font = await pdfDoc.embedFont(StandardFonts.Courier);
      } else if (
        fontFamily.includes("helvetica") ||
        fontFamily.includes("arial")
      ) {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      } else {
        // Default fallback
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }
    } catch {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // Parse color with better error handling
    const color = parseColor(properties.color || "#000000");

    // For text replacements, we need to handle positioning differently
    let finalX = x;
    let finalY = y;

    if (properties.isTextReplacement && properties.originalTransform) {
      // Use original transform data for better positioning
      const [a, b, c, d, e, f] = properties.originalTransform;
      finalX = e; // Use original X position
      finalY = f; // Use original Y position (PDF coordinates)
      console.log(
        `🔄 Using original transform positioning: (${finalX}, ${finalY})`,
      );
    }

    // Enhanced text rendering with replacement info
    console.log(
      `📝 Rendering text: "${properties.text}" at (${Math.round(finalX)}, ${Math.round(finalY)})`,
    );
    if (properties.isReplacement) {
      console.log(
        `🔄 Text replacement for original textId: ${properties.originalTextId}`,
        properties.originalText
          ? `"${properties.originalText}" -> "${properties.text}"`
          : "",
      );
    }

    // Draw text with enhanced properties and better positioning
    page.drawText(properties.text, {
      x: finalX,
      y: finalY,
      size: properties.fontSize || 12,
      font,
      color,
    });
  } catch (error) {
    console.error("Error adding text element:", error, element);
  }
}

async function addRectangleElement(
  page: any,
  element: ShapeElement,
  x: number,
  y: number,
) {
  try {
    const { properties, bounds } = element;

    const strokeColor = parseColor(properties.strokeColor);
    const fillColor =
      properties.fillColor !== "transparent"
        ? parseColor(properties.fillColor)
        : undefined;

    page.drawRectangle({
      x,
      y,
      width: bounds.width,
      height: bounds.height,
      borderColor: strokeColor,
      borderWidth: properties.strokeWidth,
      color: fillColor,
      opacity: properties.opacity,
    });
  } catch (error) {
    console.error("Error adding rectangle element:", error);
  }
}

async function addCircleElement(
  page: any,
  element: ShapeElement,
  x: number,
  y: number,
) {
  try {
    const { properties, bounds } = element;

    const strokeColor = parseColor(properties.strokeColor);
    const fillColor =
      properties.fillColor !== "transparent"
        ? parseColor(properties.fillColor)
        : undefined;

    const centerX = x + bounds.width / 2;
    const centerY = y + bounds.height / 2;
    const radius = Math.min(bounds.width, bounds.height) / 2;

    page.drawCircle({
      x: centerX,
      y: centerY,
      size: radius,
      borderColor: strokeColor,
      borderWidth: properties.strokeWidth,
      color: fillColor,
      opacity: properties.opacity,
    });
  } catch (error) {
    console.error("Error adding circle element:", error);
  }
}

async function addDrawElement(
  page: any,
  element: DrawElement | any,
  pageHeight: number,
) {
  try {
    const { properties } = element;
    const color = parseColor(properties.color || properties.strokeColor);

    // Handle drawing paths from professional editor
    if (properties.path && Array.isArray(properties.path)) {
      const path = properties.path;
      if (path.length < 2) return;

      // Set drawing properties for highlighter vs pen
      const strokeWidth = properties.strokeWidth || 2;
      const opacity =
        properties.toolType === "highlighter" ? 0.3 : properties.opacity || 1;

      // Draw path as connected lines
      for (let i = 1; i < path.length; i++) {
        const prevPoint = path[i - 1];
        const currentPoint = path[i];

        const prevY = pageHeight - prevPoint.y;
        const currentY = pageHeight - currentPoint.y;

        page.drawLine({
          start: { x: prevPoint.x, y: prevY },
          end: { x: currentPoint.x, y: currentY },
          thickness: strokeWidth,
          color,
          opacity,
        });
      }
    }
    // Handle legacy drawing format
    else if (properties.paths && Array.isArray(properties.paths)) {
      for (const path of properties.paths) {
        if (path.length < 2) continue;

        for (let i = 1; i < path.length; i++) {
          const prevPoint = path[i - 1];
          const currentPoint = path[i];

          const prevY = pageHeight - prevPoint.y;
          const currentY = pageHeight - currentPoint.y;

          page.drawLine({
            start: { x: prevPoint.x, y: prevY },
            end: { x: currentPoint.x, y: currentY },
            thickness: properties.strokeWidth,
            color,
            opacity: properties.opacity || 1,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error adding draw element:", error);
  }
}

async function addArrowElement(
  page: any,
  element: ShapeElement,
  x: number,
  y: number,
) {
  try {
    const { properties, bounds } = element;
    const strokeColor = parseColor(properties.strokeColor);

    // Draw arrow line
    const startX = x;
    const startY = y + bounds.height / 2;
    const endX = x + bounds.width;
    const endY = y + bounds.height / 2;

    page.drawLine({
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      thickness: properties.strokeWidth,
      color: strokeColor,
      opacity: properties.opacity || 1,
    });

    // Draw arrowhead
    const headLength = 10;
    const headAngle = Math.PI / 6;

    page.drawLine({
      start: { x: endX, y: endY },
      end: {
        x: endX - headLength * Math.cos(headAngle),
        y: endY - headLength * Math.sin(headAngle),
      },
      thickness: properties.strokeWidth,
      color: strokeColor,
      opacity: properties.opacity || 1,
    });

    page.drawLine({
      start: { x: endX, y: endY },
      end: {
        x: endX - headLength * Math.cos(-headAngle),
        y: endY - headLength * Math.sin(-headAngle),
      },
      thickness: properties.strokeWidth,
      color: strokeColor,
      opacity: properties.opacity || 1,
    });
  } catch (error) {
    console.error("Error adding arrow element:", error);
  }
}

async function addSignatureElement(
  page: any,
  element: any,
  x: number,
  y: number,
  pdfDoc: PDFDocument,
) {
  try {
    const { properties, bounds } = element;

    if (properties.signatureData) {
      // Handle signature as image
      await addImageElement(page, element, x, y, pdfDoc);
    } else if (properties.signatureText) {
      // Handle typed signature as text
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      page.drawText(properties.signatureText, {
        x,
        y,
        size: 24,
        font,
        color: parseColor(properties.color || "#000000"),
      });
    }
  } catch (error) {
    console.error("Error adding signature element:", error);
  }
}

async function addNoteElement(
  page: any,
  element: any,
  x: number,
  y: number,
  pdfDoc: PDFDocument,
) {
  try {
    const { properties, bounds } = element;

    // Draw note background
    page.drawRectangle({
      x,
      y,
      width: bounds.width,
      height: bounds.height,
      color: rgb(1, 1, 0.8), // Light yellow
      opacity: 0.8,
    });

    // Draw note border
    page.drawRectangle({
      x,
      y,
      width: bounds.width,
      height: bounds.height,
      borderColor: rgb(1, 0.8, 0),
      borderWidth: 1,
    });

    // Add note text if present
    if (properties.text) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText(properties.text, {
        x: x + 5,
        y: y + bounds.height - 20,
        size: 12,
        font,
        color: rgb(0, 0, 0),
        maxWidth: bounds.width - 10,
      });
    }
  } catch (error) {
    console.error("Error adding note element:", error);
  }
}

async function addImageElement(
  page: any,
  element: any, // ImageElement type
  x: number,
  y: number,
  pdfDoc: PDFDocument,
) {
  try {
    const { properties, bounds } = element;

    // Convert data URL to bytes
    const imageUrl = properties.imageUrl;
    if (!imageUrl.startsWith("data:")) {
      console.warn("Only data URLs are supported for image export");
      return;
    }

    // Extract image data
    const base64Data = imageUrl.split(",")[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0),
    );

    // Determine image type and embed
    let image;
    if (imageUrl.startsWith("data:image/png")) {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (
      imageUrl.startsWith("data:image/jpeg") ||
      imageUrl.startsWith("data:image/jpg")
    ) {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      console.warn("Unsupported image format for PDF export");
      return;
    }

    // Draw image
    page.drawImage(image, {
      x,
      y,
      width: bounds.width,
      height: bounds.height,
      opacity: properties.opacity,
    });
  } catch (error) {
    console.error("Error adding image element:", error);
  }
}

function parseColor(colorString: string) {
  // Handle hex colors
  if (colorString.startsWith("#")) {
    const hex = colorString.substring(1);
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }

  // Handle rgb colors
  if (colorString.startsWith("rgb")) {
    const matches = colorString.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0]) / 255;
      const g = parseInt(matches[1]) / 255;
      const b = parseInt(matches[2]) / 255;
      return rgb(r, g, b);
    }
  }

  // Default to black
  return rgb(0, 0, 0);
}

export async function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  try {
    const { saveAs } = await import("file-saver");
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    saveAs(blob, filename);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    // Fallback download method
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
