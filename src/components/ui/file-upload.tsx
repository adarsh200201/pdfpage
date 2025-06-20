import React, { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  className?: string;
  allowedTypes?: string[]; // e.g., ["pdf", "image"]
  uploadText?: string;
  supportText?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelect,
  accept = ".pdf",
  multiple = true,
  maxSize = 10,
  className,
  allowedTypes = ["pdf"],
  uploadText = "Select PDF files or drop PDF files here",
  supportText = "Supports PDF format",
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type based on allowedTypes
    const isValidType = allowedTypes.some((type) => {
      if (type === "pdf") {
        return (
          file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")
        );
      }
      if (type === "image") {
        return (
          file.type.startsWith("image/") ||
          /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)
        );
      }
      return file.type.includes(type);
    });

    if (!isValidType) {
      const typeNames = allowedTypes.map((type) => {
        if (type === "image") return "Image files (JPG, PNG, GIF, etc.)";
        if (type === "pdf") return "PDF files";
        return type.toUpperCase() + " files";
      });
      return `Only ${typeNames.join(", ")} are allowed`;
    }

    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    return null;
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles: UploadedFile[] = [];
      const validFiles: File[] = [];

      Array.from(files).forEach((file) => {
        const error = validateFile(file);
        const uploadedFile: UploadedFile = {
          file,
          id: Math.random().toString(36).substr(2, 9),
          error: error || undefined,
        };

        newFiles.push(uploadedFile);
        if (!error) {
          validFiles.push(file);
        }
      });

      if (multiple) {
        setUploadedFiles((prev) => [...prev, ...newFiles]);
      } else {
        setUploadedFiles(newFiles);
      }

      if (validFiles.length > 0) {
        onFilesSelect(validFiles);
      }
    },
    [multiple, maxSize, onFilesSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles],
  );

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragOver
            ? "border-brand-red bg-red-50 animate-pulse-border"
            : "border-gray-300 hover:border-brand-red hover:bg-gray-50",
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center space-y-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200",
              isDragOver
                ? "bg-brand-red text-white"
                : "bg-gray-100 text-gray-400",
            )}
          >
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-heading-small text-text-dark mb-2">
              {uploadText.split(" or ")[0]}
            </h3>
            <p className="text-body-small text-text-light mb-4">
              {uploadText.includes(" or ")
                ? uploadText.split(" or ")[1]
                : supportText}
            </p>

            <Button
              type="button"
              className="bg-brand-red hover:bg-red-600"
              onClick={() =>
                document.querySelector('input[type="file"]')?.click()
              }
            >
              {uploadText.split(" or ")[0]}
            </Button>

            <p className="text-xs text-text-light mt-2">
              {supportText} • Max file size: {maxSize}MB
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-heading-small text-text-dark">
            Uploaded Files ({uploadedFiles.length})
          </h4>

          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors duration-200",
                  uploadedFile.error
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-white hover:bg-gray-50",
                )}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      uploadedFile.error ? "bg-red-100" : "bg-blue-100",
                    )}
                  >
                    {uploadedFile.error ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-dark truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-text-light">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    {uploadedFile.error && (
                      <p className="text-xs text-red-500 mt-1">
                        {uploadedFile.error}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadedFile.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
