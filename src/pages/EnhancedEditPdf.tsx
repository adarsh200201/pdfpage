import React, { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, X } from "lucide-react";
import PDFTextEditor from "@/components/pdf-editor/PDFTextEditor";

const EnhancedEditPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (
      acceptedFiles.length > 0 &&
      acceptedFiles[0].type === "application/pdf"
    ) {
      setFile(acceptedFiles[0]);
      setIsEditing(true);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a valid PDF file",
        variant: "destructive",
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setIsEditing(true);
    } else if (selectedFile) {
      toast({
        title: "Invalid file",
        description: "Please upload a valid PDF file",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (modifiedPdf: Blob) => {
    try {
      // Create a download link
      const url = window.URL.createObjectURL(modifiedPdf);
      const a = document.createElement("a");
      a.href = url;
      a.download = file ? `edited_${file.name}` : "edited_document.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Your PDF has been downloaded",
      });
    } catch (error) {
      console.error("Error saving PDF:", error);
      toast({
        title: "Error",
        description: "Failed to save PDF",
        variant: "destructive",
      });
    }
  };

  const handleError = (error: Error) => {
    console.error("PDF Error:", error);
    toast({
      title: "Error",
      description:
        error.message || "An error occurred while processing the PDF",
      variant: "destructive",
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">PDF Text Editor</h1>
        <p className="text-gray-600">Edit text directly in your PDF files</p>
      </div>

      {!isEditing ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Upload a PDF to Edit</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload className="w-12 h-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? "Drop the PDF here"
                      : "Drag & drop a PDF file here"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to select a file
                  </p>
                </div>
                <Button type="button" variant="outline">
                  Select PDF
                </Button>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span className="font-medium truncate max-w-xs">
                {file?.name || "Document.pdf"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700"
              onClick={handleRemoveFile}
            >
              <X className="w-4 h-4 mr-1" /> Close
            </Button>
          </div>

          <div className="h-[calc(100vh-250px)]">
            {file && (
              <PDFTextEditor
                file={file}
                onSave={handleSave}
                onError={handleError}
              />
            )}
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Note: For best results, use PDFs with embedded text (not scanned
          documents).
        </p>
      </div>
    </div>
  );
};

export default EnhancedEditPdf;
