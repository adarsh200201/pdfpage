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

    // Process each page
    for (
      let pageIndex = 0;
      pageIndex < Math.min(pageCount, pages.length);
      pageIndex++
    ) {
      const page = pages[pageIndex];
      const pageElements = elementsByPage[pageIndex] || [];

      const { width: pageWidth, height: pageHeight } = page.getSize();

      for (const element of pageElements) {
        await addElementToPage(page, element, pageWidth, pageHeight, pdfDoc);
      }
    }

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
    case "draw":
      await addDrawElement(page, element as DrawElement, pageHeight);
      break;
    case "image":
      await addImageElement(page, element as any, x, y, pdfDoc);
      break;
    default:
      console.warn(`Unsupported element type: ${element.type}`);
  }
}

async function addTextElement(
  page: any,
  element: TextElement,
  x: number,
  y: number,
  pdfDoc: PDFDocument,
) {
  try {
    const { properties } = element;

    // Get font
    let font;
    try {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    } catch {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // Parse color
    const color = parseColor(properties.color);

    // Draw text
    page.drawText(properties.text, {
      x,
      y,
      size: properties.fontSize,
      font,
      color,
    });
  } catch (error) {
    console.error("Error adding text element:", error);
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
  element: DrawElement,
  pageHeight: number,
) {
  try {
    const { properties } = element;
    const color = parseColor(properties.color);

    // Convert draw paths to PDF coordinate system
    for (const path of properties.paths) {
      if (path.length < 2) continue;

      // Start path
      const startPoint = path[0];
      const startY = pageHeight - startPoint.y;

      // Draw path as connected lines
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
          opacity: properties.opacity,
        });
      }
    }
  } catch (error) {
    console.error("Error adding draw element:", error);
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
