// PDF rotation testing and validation utility
import { PDFService } from "@/services/pdfService";

// Test PDF rotation to ensure content remains visible
export const testPDFRotation = async (
  file: File,
  rotation: number,
): Promise<{
  success: boolean;
  error?: string;
  originalPageCount?: number;
  rotatedPageCount?: number;
  contentPreserved?: boolean;
}> => {
  try {
    console.log(`Testing PDF rotation: ${rotation}° for file: ${file.name}`);

    // Load original PDF to get baseline info
    const { PDFDocument } = await import("pdf-lib");
    const originalArrayBuffer = await file.arrayBuffer();
    const originalPDF = await PDFDocument.load(originalArrayBuffer);
    const originalPageCount = originalPDF.getPageCount();

    console.log(`Original PDF has ${originalPageCount} pages`);

    // Perform rotation
    const rotatedBytes = await PDFService.rotatePDF(file, rotation);

    // Verify rotated PDF
    const rotatedPDF = await PDFDocument.load(rotatedBytes);
    const rotatedPageCount = rotatedPDF.getPageCount();

    console.log(`Rotated PDF has ${rotatedPageCount} pages`);

    // Check if page count is preserved
    if (originalPageCount !== rotatedPageCount) {
      return {
        success: false,
        error: `Page count mismatch: original ${originalPageCount}, rotated ${rotatedPageCount}`,
        originalPageCount,
        rotatedPageCount,
        contentPreserved: false,
      };
    }

    // Verify rotation was applied correctly
    const pages = rotatedPDF.getPages();
    let rotationVerified = true;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageRotation = page.getRotation();
      const expectedRotation = rotation % 360;

      console.log(
        `Page ${i + 1}: expected rotation ${expectedRotation}°, actual rotation ${pageRotation.angle}°`,
      );

      if (pageRotation.angle !== expectedRotation) {
        console.warn(`Page ${i + 1} rotation mismatch`);
        rotationVerified = false;
      }

      // Check if page has content (media box should exist)
      const mediaBox = page.getMediaBox();
      if (!mediaBox || mediaBox.width <= 0 || mediaBox.height <= 0) {
        console.warn(`Page ${i + 1} has invalid media box`);
        rotationVerified = false;
      }
    }

    return {
      success: true,
      originalPageCount,
      rotatedPageCount,
      contentPreserved: rotationVerified,
    };
  } catch (error) {
    console.error("PDF rotation test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      contentPreserved: false,
    };
  }
};

// Validate PDF file before rotation
export const validatePDFForRotation = async (
  file: File,
): Promise<{
  valid: boolean;
  error?: string;
  pageCount?: number;
  hasContent?: boolean;
}> => {
  try {
    const { PDFDocument } = await import("pdf-lib");

    // Check file type
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return {
        valid: false,
        error: "File is not a PDF",
      };
    }

    // Load and analyze PDF
    const arrayBuffer = await file.arrayBuffer();

    // Validate PDF signature
    const uint8Array = new Uint8Array(arrayBuffer);
    const header = new TextDecoder().decode(uint8Array.slice(0, 5));

    if (!header.startsWith("%PDF-")) {
      return {
        valid: false,
        error: "Invalid PDF file (missing PDF signature)",
      };
    }

    // Load with pdf-lib
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 0) {
      return {
        valid: false,
        error: "PDF has no pages",
        pageCount: 0,
        hasContent: false,
      };
    }

    // Check if pages have content
    let hasContent = false;
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const mediaBox = page.getMediaBox();
      if (mediaBox && mediaBox.width > 0 && mediaBox.height > 0) {
        hasContent = true;
        break;
      }
    }

    return {
      valid: true,
      pageCount,
      hasContent,
    };
  } catch (error) {
    console.error("PDF validation failed:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Failed to validate PDF",
    };
  }
};

// Test PDF.js rendering capability
export const testPDFJSRendering = async (
  file: File,
): Promise<{
  canRender: boolean;
  error?: string;
  pageCount?: number;
}> => {
  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Configure worker
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0,
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    // Try to render first page
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.1 }); // Very small scale for test

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Cannot get canvas context");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Clean up
    canvas.remove();

    return {
      canRender: true,
      pageCount,
    };
  } catch (error) {
    console.error("PDF.js rendering test failed:", error);
    return {
      canRender: false,
      error: error instanceof Error ? error.message : "Rendering test failed",
    };
  }
};

// Comprehensive PDF rotation test
export const comprehensivePDFRotationTest = async (
  file: File,
  rotation: number = 90,
) => {
  console.log("=== Comprehensive PDF Rotation Test ===");
  console.log(`File: ${file.name} (${file.size} bytes)`);
  console.log(`Rotation: ${rotation}°`);

  // Step 1: Validate PDF
  console.log("\n1. Validating PDF...");
  const validation = await validatePDFForRotation(file);
  console.log("Validation result:", validation);

  if (!validation.valid) {
    return {
      success: false,
      stage: "validation",
      error: validation.error,
    };
  }

  // Step 2: Test PDF.js rendering
  console.log("\n2. Testing PDF.js rendering...");
  const renderTest = await testPDFJSRendering(file);
  console.log("Render test result:", renderTest);

  // Step 3: Test rotation
  console.log("\n3. Testing PDF rotation...");
  const rotationTest = await testPDFRotation(file, rotation);
  console.log("Rotation test result:", rotationTest);

  // Final result
  const success = validation.valid && rotationTest.success;

  console.log("\n=== Test Summary ===");
  console.log(`Overall success: ${success}`);
  console.log(`PDF valid: ${validation.valid}`);
  console.log(`Can render: ${renderTest.canRender}`);
  console.log(`Rotation successful: ${rotationTest.success}`);
  console.log(`Content preserved: ${rotationTest.contentPreserved}`);

  return {
    success,
    validation,
    renderTest,
    rotationTest,
  };
};
