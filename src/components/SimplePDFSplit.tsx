import React, { useState } from "react";
import { Upload, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { PDFService } from "@/services/pdfService";

interface SplitPage {
  index: number;
  data: Uint8Array;
  size: string;
}

export const SimplePDFSplit: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitPages, setSplitPages] = useState<SplitPage[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setSplitPages([]);
      setProgress(0);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const splitPDF = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      console.log("🚀 Starting simple PDF split for:", file.name);

      // Split PDF into individual pages
      const pages = await PDFService.splitPDF(file, (progressPercent) => {
        setProgress(progressPercent);
      });

      console.log(`✅ Split complete: ${pages.length} pages`);

      // Convert to simple format with size info
      const processedPages: SplitPage[] = pages.map((pageData, index) => ({
        index,
        data: pageData,
        size: `${Math.round(pageData.length / 1024)} KB`,
      }));

      setSplitPages(processedPages);
      setProgress(100);

      toast({
        title: "Success!",
        description: `PDF split into ${pages.length} pages`,
      });
    } catch (error) {
      console.error("❌ Split failed:", error);
      toast({
        title: "Split Failed",
        description: "Could not split the PDF file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPage = (pageIndex: number) => {
    const page = splitPages[pageIndex];
    if (!page) return;

    try {
      const blob = new Blob([page.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file?.name?.replace(".pdf", "")}-page-${pageIndex + 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: `Page ${pageIndex + 1} downloaded successfully`,
      });
    } catch (error) {
      console.error("❌ Download failed:", error);
      toast({
        title: "Download Failed",
        description: `Could not download page ${pageIndex + 1}`,
        variant: "destructive",
      });
    }
  };

  const downloadAll = () => {
    splitPages.forEach((_, index) => {
      setTimeout(() => downloadPage(index), index * 200);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Split PDF</h1>
        <p className="text-gray-600">
          Upload a PDF and split it into individual pages for download
        </p>
      </div>

      {/* File Upload */}
      <Card>
        <CardContent className="pt-6">
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload PDF File</h3>
                <p className="text-gray-500">
                  Choose a PDF file to split into individual pages
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="outline" className="cursor-pointer">
                    Select PDF File
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="space-x-2">
                  <Button
                    onClick={() => {
                      setFile(null);
                      setSplitPages([]);
                      setProgress(0);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Remove
                  </Button>
                  {!isProcessing && splitPages.length === 0 && (
                    <Button onClick={splitPDF} size="sm">
                      Split PDF
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Splitting PDF...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {splitPages.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Split Results ({splitPages.length} pages)
              </h3>
              <Button onClick={downloadAll} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {splitPages.map((page) => (
                <div
                  key={page.index}
                  className="border rounded-lg p-4 text-center space-y-2"
                >
                  <FileText className="w-8 h-8 text-red-600 mx-auto" />
                  <div>
                    <p className="font-medium">Page {page.index + 1}</p>
                    <p className="text-xs text-gray-500">{page.size}</p>
                  </div>
                  <Button
                    onClick={() => downloadPage(page.index)}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
