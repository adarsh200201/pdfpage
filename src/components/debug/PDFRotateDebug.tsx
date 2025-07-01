import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  RotateCw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

const PDFRotateDebug = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [rotatedPreview, setRotatedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generatePreview = async (file: File): Promise<string | null> => {
    try {
      const pdfjsLib = await import("pdfjs-dist");

      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
      });

      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const scale = 0.5;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) throw new Error("No context");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      canvas.remove();

      return dataUrl;
    } catch (error) {
      console.error("Preview generation failed:", error);
      return null;
    }
  };

  const testRotation = async () => {
    if (!file) return;

    setIsProcessing(true);
    setTestResults([]);

    const results: string[] = [];

    try {
      results.push("🔍 Starting PDF rotation test...");
      setTestResults([...results]);

      // Generate original preview
      results.push("📷 Generating original preview...");
      setTestResults([...results]);

      const originalPreviewUrl = await generatePreview(file);
      setOriginalPreview(originalPreviewUrl);

      if (originalPreviewUrl) {
        results.push("✅ Original preview generated successfully");
      } else {
        results.push("❌ Original preview failed");
      }
      setTestResults([...results]);

      // Test PDF rotation
      results.push("🔄 Testing PDF rotation (90°)...");
      setTestResults([...results]);

      const { PDFDocument, degrees } = await import("pdf-lib");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: false,
      });

      const pages = pdfDoc.getPages();
      results.push(`📄 PDF loaded: ${pages.length} pages`);
      setTestResults([...results]);

      // Apply 90° rotation
      pages.forEach((page, index) => {
        const currentRotation = page.getRotation().angle;
        const newRotation = (currentRotation + 90) % 360;
        page.setRotation(degrees(newRotation));
        results.push(
          `🔄 Page ${index + 1}: ${currentRotation}° -> ${newRotation}°`,
        );
      });
      setTestResults([...results]);

      // Save rotated PDF
      const rotatedBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      results.push("💾 Rotated PDF saved");
      setTestResults([...results]);

      // Generate rotated preview
      results.push("📷 Generating rotated preview...");
      setTestResults([...results]);

      const rotatedFile = new File([rotatedBytes], "rotated.pdf", {
        type: "application/pdf",
      });
      const rotatedPreviewUrl = await generatePreview(rotatedFile);
      setRotatedPreview(rotatedPreviewUrl);

      if (rotatedPreviewUrl) {
        results.push("✅ Rotated preview generated successfully");
        results.push("🎉 PDF rotation test completed successfully!");
      } else {
        results.push("❌ Rotated preview failed");
        results.push("⚠️ PDF rotation may have issues");
      }

      setTestResults([...results]);

      toast({
        title: "Test completed",
        description: "Check the results above for details",
      });
    } catch (error) {
      results.push(
        `❌ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setTestResults([...results]);

      toast({
        title: "Test failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setOriginalPreview(null);
      setRotatedPreview(null);
      setTestResults([]);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          PDF Rotation Debug Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            variant={file ? "outline" : "default"}
          >
            <Upload className="w-4 h-4 mr-2" />
            {file ? `Selected: ${file.name}` : "Select PDF File"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Test Button */}
        {file && (
          <Button
            onClick={testRotation}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RotateCw className="w-4 h-4 mr-2" />
                Test PDF Rotation
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 font-mono text-xs">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {result.includes("✅") ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : result.includes("❌") ? (
                      <XCircle className="w-3 h-3 text-red-500" />
                    ) : (
                      <div className="w-3 h-3" />
                    )}
                    <span>{result}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Comparison */}
        {(originalPreview || rotatedPreview) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Original PDF</CardTitle>
              </CardHeader>
              <CardContent>
                {originalPreview ? (
                  <img
                    src={originalPreview}
                    alt="Original PDF"
                    className="w-full border rounded"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 border rounded flex items-center justify-center">
                    <span className="text-gray-500">No preview</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rotated Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rotated PDF (90°)</CardTitle>
              </CardHeader>
              <CardContent>
                {rotatedPreview ? (
                  <img
                    src={rotatedPreview}
                    alt="Rotated PDF"
                    className="w-full border rounded"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 border rounded flex items-center justify-center">
                    <span className="text-gray-500">No preview</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFRotateDebug;
