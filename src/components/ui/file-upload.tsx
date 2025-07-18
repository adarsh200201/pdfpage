import React, { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  className?: string;
  allowedTypes?: string[]; // e.g., ["pdf", "image"]
  acceptedFileTypes?: Record<string, string[]>; // For image tools compatibility
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
  accept,
  multiple = true,
  maxSize = 10,
  maxFiles,
  className,
  allowedTypes = [],
  acceptedFileTypes,
  uploadText,
  supportText,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Determine the correct accept attribute based on acceptedFileTypes or allowedTypes
  const getAcceptAttribute = () => {
    if (accept) {
      return accept;
    }

    if (acceptedFileTypes) {
      const mimeTypes = Object.keys(acceptedFileTypes);
      const extensions = Object.values(acceptedFileTypes).flat();
      return [...mimeTypes, ...extensions].join(",");
    }

    if (allowedTypes.includes("image")) {
      return "image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp";
    }

    if (allowedTypes.includes("pdf")) {
      return ".pdf";
    }

    // No specific restrictions, allow common file types
    return "*";
  };

  // Determine the correct upload text
  const getUploadText = () => {
    if (uploadText) return uploadText;

    if (acceptedFileTypes) {
      if (
        Object.keys(acceptedFileTypes).some((key) => key.startsWith("image"))
      ) {
        return "Select image files";
      }
    }

    if (allowedTypes.includes("image")) {
      return "Select image files";
    }

    if (allowedTypes.includes("pdf")) {
      return "Select PDF files";
    }

    return "Select files";
  };

  // Determine the correct support text
  const getSupportText = () => {
    if (supportText) return supportText;

    if (acceptedFileTypes) {
      const extensions = Object.values(acceptedFileTypes).flat();
      return `Supports ${extensions.join(", ")} formats`;
    }

    if (allowedTypes.includes("image")) {
      return "Supports JPG, PNG, GIF, BMP, WebP formats";
    }

    if (allowedTypes.includes("pdf")) {
      return "Supports PDF format";
    }

    return "Supports multiple file formats";
  };

  const finalAccept = getAcceptAttribute();
  const finalUploadText = getUploadText();
  const finalSupportText = getSupportText();

  const validateFile = useCallback(
    (file: File): string | null => {
      let isValidType = false;
      let errorMessage = "";

      // Handle acceptedFileTypes prop (used by image tools)
      if (acceptedFileTypes && Object.keys(acceptedFileTypes).length > 0) {
        isValidType = Object.keys(acceptedFileTypes).some((mimeType) => {
          if (mimeType === "image/*") {
            return (
              file.type.startsWith("image/") ||
              /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)
            );
          }
          return file.type === mimeType;
        });

        if (!isValidType) {
          const extensions = Object.values(acceptedFileTypes).flat();
          errorMessage = `Only ${extensions.join(", ")} files are allowed`;
        }
      } else if (allowedTypes.length > 0) {
        // Check file type based on allowedTypes
        isValidType = allowedTypes.some((type) => {
          if (type === "pdf") {
            return (
              file.type === "application/pdf" ||
              file.type.includes("pdf") ||
              file.name.toLowerCase().endsWith(".pdf")
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
            if (type === "image") return "image files";
            if (type === "pdf") return "PDF files";
            return type.toUpperCase() + " files";
          });
          errorMessage = `Only ${typeNames.join(", ")} are allowed`;
        }
      } else {
        // No file type restrictions specified, allow all files
        isValidType = true;
      }

      if (!isValidType) {
        return errorMessage;
      }

      if (file.size > maxSize * 1024 * 1024) {
        return `File size must be less than ${maxSize}MB`;
      }

      return null;
    },
    [maxSize, allowedTypes, acceptedFileTypes],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles: UploadedFile[] = [];
      const validFiles: File[] = [];

      // Respect maxFiles limit
      const filesToProcess = maxFiles
        ? Array.from(files).slice(0, maxFiles)
        : Array.from(files);

      filesToProcess.forEach((file) => {
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

      if (multiple && !maxFiles) {
        setUploadedFiles((prev) => [...prev, ...newFiles]);
      } else {
        setUploadedFiles(newFiles);
      }

      if (validFiles.length > 0) {
        onFilesSelect(validFiles);
      }
    },
    [multiple, maxFiles, validateFile, onFilesSelect],
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
      // Reset the input value to allow re-selecting the same file
      e.target.value = "";
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
          "relative border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-all duration-200",
          isDragOver
            ? "border-brand-red bg-red-50 animate-pulse-border"
            : "border-gray-300 hover:border-brand-red hover:bg-gray-50",
        )}
      >
        <input
          type="file"
          accept={finalAccept}
          multiple={multiple}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div
            className={cn(
              "w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors duration-200",
              isDragOver
                ? "bg-brand-red text-white"
                : "bg-gray-100 text-gray-400",
            )}
          >
            <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>

          <div className="w-full max-w-xs sm:max-w-sm md:max-w-none">
            <h3 className="text-xs sm:text-sm md:text-base font-medium text-text-dark mb-2 leading-tight px-2 break-words text-center">
              {uploadText || "Select files"}
            </h3>
            <p className="text-xs sm:text-sm text-text-light mb-4 px-2 text-center">
              or drag & drop
            </p>

            <Button
              type="button"
              className="bg-brand-red hover:bg-red-600 text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-6 py-2 whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault();
                const fileInput =
                  e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector(
                    'input[type="file"]',
                  ) as HTMLInputElement;
                fileInput?.click();
              }}
            >
              <span className="hidden sm:inline">
                {uploadText || "Choose Files"}
              </span>
              <span className="sm:hidden">
                {acceptedFileTypes &&
                Object.keys(acceptedFileTypes).some((key) =>
                  key.startsWith("image"),
                )
                  ? "Select image"
                  : allowedTypes.includes("pdf")
                    ? "Select PDFs"
                    : allowedTypes.includes("image")
                      ? "Select image"
                      : "Choose"}
              </span>
            </Button>

            <p className="text-xs text-text-light mt-2 leading-relaxed px-2 break-words text-center">
              {finalSupportText}
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> • </span>
              Max file size: {maxSize}MB
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 sm:mt-6 space-y-3">
          <h4 className="text-sm sm:text-base font-medium text-text-dark">
            Uploaded Files ({uploadedFiles.length})
          </h4>

          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className={cn(
                  "flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-colors duration-200",
                  uploadedFile.error
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-white hover:bg-gray-50",
                )}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      uploadedFile.error ? "bg-red-100" : "bg-blue-100",
                    )}
                  >
                    {uploadedFile.error ? (
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    ) : (
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-text-dark truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-text-light">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    {uploadedFile.error && (
                      <p className="text-xs text-red-500 mt-1 break-words">
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
                  className="text-gray-400 hover:text-red-500 flex-shrink-0 p-1 sm:p-2"
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
