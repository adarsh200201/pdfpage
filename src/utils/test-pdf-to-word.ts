// Test script for PDF to Word conversion debugging
import { PDFService } from "../services/pdfService";

export async function testPdfToWordConversion() {
  console.log("🧪 Starting PDF to Word conversion test...");

  try {
    // Create a simple test PDF file (mock data for testing)
    const testPdfContent = new Uint8Array([
      0x25,
      0x50,
      0x44,
      0x46,
      0x2d,
      0x31,
      0x2e,
      0x34, // %PDF-1.4
      0x0a,
      0x25,
      0xe2,
      0xe3,
      0xcf,
      0xd3,
      0x0a, // Binary comment
      // Minimal PDF structure
    ]);

    const testFile = new File([testPdfContent], "test.pdf", {
      type: "application/pdf",
      lastModified: Date.now(),
    });

    console.log("📁 Created test PDF file:", {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type,
    });

    // Test API endpoint accessibility
    const apiUrl = "https://pdfpage-app.onrender.com/api";
    console.log("🌐 Testing API connectivity to:", apiUrl);

    try {
      const healthResponse = await fetch(`${apiUrl}/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log("✅ Backend health check passed:", healthData);
      } else {
        console.warn("⚠️ Backend health check failed:", healthResponse.status);
      }
    } catch (healthError) {
      console.error("❌ Backend health check error:", healthError);
      return false;
    }

    // Test conversion with options
    const conversionOptions = {
      preserveFormatting: true,
      includeMetadata: true,
      extractImages: false,
    };

    console.log("🔄 Testing PDF to Word conversion...");
    const startTime = Date.now();

    try {
      const result = await PDFService.convertPdfToWordAPI(
        testFile,
        conversionOptions,
      );
      const endTime = Date.now();

      console.log("✅ Conversion test completed:", {
        timeTaken: `${endTime - startTime}ms`,
        resultFile: {
          name: result.file.name,
          size: result.file.size,
          type: result.file.type,
        },
        stats: result.stats,
      });

      return true;
    } catch (conversionError) {
      console.error("❌ Conversion test failed:", conversionError);
      return false;
    }
  } catch (error) {
    console.error("❌ Test setup failed:", error);
    return false;
  }
}

// Helper function to test with real PDF content
export async function testWithRealPdf(file: File) {
  console.log("🧪 Testing with real PDF file:", file.name);

  try {
    const result = await PDFService.convertPdfToWordAPI(file, {
      preserveFormatting: true,
      includeMetadata: true,
      extractImages: false,
    });

    console.log("✅ Real PDF conversion test passed:", {
      originalFile: file.name,
      convertedFile: result.file.name,
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      convertedSize: `${(result.file.size / 1024 / 1024).toFixed(2)} MB`,
      stats: result.stats,
    });

    // Test download
    const downloadUrl = URL.createObjectURL(result.file);
    console.log("📥 Download URL created:", downloadUrl);

    return { success: true, downloadUrl, result };
  } catch (error) {
    console.error("❌ Real PDF conversion test failed:", error);
    return { success: false, error: error.message };
  }
}
