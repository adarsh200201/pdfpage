/**
 * Test utility to verify PDF configuration fixes
 */

import { PDFService } from "@/services/pdfService";
import { configurePDFjs, getPDFConfigStatus } from "@/lib/pdf-config";

// Test PDF worker configuration
export const testPDFWorkerConfig = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log("🧪 Testing PDF worker configuration...");

    // Test configuration
    await configurePDFjs(true); // Force reconfiguration

    // Get configuration status
    const status = getPDFConfigStatus();
    console.log("📊 PDF Configuration Status:", status);

    // Verify configuration is marked as complete
    if (status.isConfigured) {
      return {
        success: true,
        message: "PDF worker configuration successful",
        details: status,
      };
    } else {
      return {
        success: false,
        message: "PDF worker configuration incomplete",
        details: status,
      };
    }
  } catch (error: any) {
    console.error("❌ PDF worker configuration test failed:", error);
    return {
      success: false,
      message: `Configuration test failed: ${error.message}`,
    };
  }
};

// Test PDF service formatFileSize method
export const testPDFServiceMethods = (): {
  success: boolean;
  message: string;
} => {
  try {
    console.log("🧪 Testing PDF service methods...");

    // Test that we can access PDFService without errors
    const hasCompressPDF = typeof PDFService.compressPDF === "function";
    const hasDownloadFile = typeof PDFService.downloadFile === "function";

    if (hasCompressPDF && hasDownloadFile) {
      return {
        success: true,
        message: "PDF service methods are accessible",
      };
    } else {
      return {
        success: false,
        message: "PDF service methods are missing",
      };
    }
  } catch (error: any) {
    console.error("❌ PDF service test failed:", error);
    return {
      success: false,
      message: `Service test failed: ${error.message}`,
    };
  }
};

// Comprehensive test function
export const runPDFFixTests = async (): Promise<void> => {
  console.log("🔧 Running PDF configuration fix tests...");

  // Test 1: PDF Worker Configuration
  const workerTest = await testPDFWorkerConfig();
  console.log("📋 Worker Test Result:", workerTest);

  // Test 2: PDF Service Methods
  const serviceTest = testPDFServiceMethods();
  console.log("📋 Service Test Result:", serviceTest);

  // Summary
  const allTestsPassed = workerTest.success && serviceTest.success;
  console.log(`✅ All tests ${allTestsPassed ? "PASSED" : "FAILED"}`);

  if (!allTestsPassed) {
    console.warn("⚠️ Some tests failed. Please check the implementation.");
  }
};

// Auto-run tests in development
if (import.meta.env.DEV) {
  // Run tests after a short delay to allow for initialization
  setTimeout(runPDFFixTests, 3000);
}
