import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Shield,
  X,
  Zap,
} from "lucide-react";
import {
  LIBREOFFICE_TOOLS,
  validateFileType,
  LibreOfficeToolConfig,
} from "@/config/libreoffice-tools";

interface FileWithValidation {
  file: File;
  isValid: boolean;
  error?: string;
  toolId?: string;
}

const LibreOfficeConverter: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [files, setFiles] = useState<FileWithValidation[]>([]);
  const [processing, setProcessing] = useState(false);

  const getIcon = (iconName: string) => {
    const icons = {
      FileText,
      FileSpreadsheet,
      Presentation,
      Image,
    };
    return icons[iconName as keyof typeof icons] || FileText;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!selectedTool) {
        alert("Please select a conversion tool first");
        return;
      }

      const validatedFiles = acceptedFiles.map((file) => {
        const validation = validateFileType(file.name, selectedTool);
        return {
          file,
          isValid: validation.isValid,
          error: validation.error,
          toolId: selectedTool,
        };
      });

      setFiles(validatedFiles);
    },
    [selectedTool],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: !selectedTool,
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    const validFiles = files.filter((f) => f.isValid);
    if (validFiles.length === 0) return;

    setProcessing(true);
    try {
      // Here you would call your backend API
      const tool = LIBREOFFICE_TOOLS.find((t) => t.id === selectedTool);

      for (const fileItem of validFiles) {
        const formData = new FormData();
        formData.append("file", fileItem.file);
        formData.append("toolId", selectedTool);

        const response = await fetch("/api/libreoffice-strict/convert", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${fileItem.file.name.split(".")[0]}${tool?.outputType}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          throw new Error("Conversion failed");
        }
      }
    } catch (error) {
      console.error("Conversion error:", error);
      alert("Conversion failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const selectedToolConfig = LIBREOFFICE_TOOLS.find(
    (t) => t.id === selectedTool,
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>LibreOffice-Only Conversion Tools</span>
          </CardTitle>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>
                All conversions handled exclusively by LibreOffice in headless
                mode
              </span>
            </p>
            <p className="flex items-center space-x-2">
              <X className="w-4 h-4 text-red-600" />
              <span>No fallback libraries (Puppeteer, Pandoc, Mammoth)</span>
            </p>
            <p className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>
                Accurate, format-pure results for professional processing
              </span>
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Tool Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Conversion Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTool} onValueChange={setSelectedTool}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a conversion tool..." />
            </SelectTrigger>
            <SelectContent>
              {LIBREOFFICE_TOOLS.map((tool) => {
                const IconComponent = getIcon(tool.icon);
                return (
                  <SelectItem key={tool.id} value={tool.id}>
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-4 h-4" />
                      <span>{tool.name}</span>
                      <span className="text-xs text-gray-500">
                        ({tool.acceptedTypes.join(", ")})
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {selectedToolConfig && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">
                {selectedToolConfig.name}
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                {selectedToolConfig.description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-700">
                    ✅ Accept:{" "}
                  </span>
                  <span className="text-green-600">
                    {selectedToolConfig.acceptedTypes.join(", ")}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">📤 Output: </span>
                  <span className="text-blue-600">
                    {selectedToolConfig.outputType}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-red-700">❌ Reject: </span>
                  <span className="text-red-600">
                    {selectedToolConfig.rejectedTypes.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              !selectedTool
                ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                : isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 cursor-pointer"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />

            {!selectedTool ? (
              <p className="text-gray-500">
                Please select a conversion tool first
              </p>
            ) : isDragActive ? (
              <p className="text-blue-600">Drop the file here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop a file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Only accepts: {selectedToolConfig?.acceptedTypes.join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((fileItem, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    fileItem.isValid
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {fileItem.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">{fileItem.file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(fileItem.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Error Messages */}
          {files.some((f) => !f.isValid) && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {files.find((f) => !f.isValid)?.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Process Button */}
          {files.some((f) => f.isValid) && (
            <div className="mt-4">
              <Button
                onClick={processFiles}
                disabled={processing}
                className="w-full"
              >
                {processing ? (
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 animate-spin" />
                    <span>Converting with LibreOffice...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Convert File</span>
                  </div>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <strong>⚠️ Strict Validation:</strong> Only the specified input file
          types are accepted. Uploading unsupported formats will be rejected
          automatically. No fallback conversion methods are available.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default LibreOfficeConverter;
