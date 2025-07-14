import React, { useCallback, useState } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  File,
  Image,
  X,
  CheckCircle,
  AlertCircle,
  Camera,
  Folder,
  Smartphone,
} from "lucide-react";
import { useMobile } from "@/hooks/useMobile";

interface MobileFileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
  showPreview?: boolean;
  uploadProgress?: number;
  isUploading?: boolean;
  title?: string;
  description?: string;
  allowCamera?: boolean; // Allow camera capture on mobile
}

const MobileFileUpload: React.FC<MobileFileUploadProps> = ({
  onFilesSelected,
  acceptedFileTypes = [],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 1,
  multiple = false,
  className,
  children,
  showPreview = true,
  uploadProgress,
  isUploading = false,
  title = "Upload your files",
  description = "Drag & drop files here or tap to browse",
  allowCamera = false,
}) => {
  const { isMobile, device } = useMobile();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    if (acceptedFileTypes.length > 0) {
      const isAccepted = acceptedFileTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type);
      });

      if (!isAccepted) {
        return `File type not supported. Accepted types: ${acceptedFileTypes.join(", ")}`;
      }
    }

    if (file.size > maxFileSize) {
      return `File size too large. Maximum size: ${formatFileSize(maxFileSize)}`;
    }

    return null;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setUploadError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0].errors[0];
        setUploadError(firstError.message);
        return;
      }

      // Validate each file
      const validFiles: File[] = [];
      for (const file of acceptedFiles) {
        const error = validateFile(file);
        if (error) {
          setUploadError(error);
          return;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        onFilesSelected(validFiles);
      }
    },
    [acceptedFileTypes, maxFileSize, onFilesSelected],
  );

  // Dropzone configuration
  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: acceptedFileTypes.reduce(
      (acc, type) => {
        if (type.startsWith(".")) {
          // File extension
          acc["application/octet-stream"] = [type];
        } else {
          // MIME type
          acc[type] = [];
        }
        return acc;
      },
      {} as Record<string, string[]>,
    ),
    maxFiles,
    multiple,
    maxSize: maxFileSize,
    // Mobile-specific options
    noClick: false,
    noKeyboard: false,
    disabled: isUploading,
  };

  const { getRootProps, getInputProps, isDragActive, open } =
    useDropzone(dropzoneOptions);

  // Remove file
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type === "application/pdf") return File;
    return File;
  };

  // Camera capture (mobile only)
  const handleCameraCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // Use rear camera
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        onDrop(Array.from(files), []);
      }
    };
    input.click();
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Main upload area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          isMobile ? "mobile-file-input" : "p-8",
          isDragActive
            ? "border-blue-500 bg-blue-50 scale-[1.02]"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
          isUploading && "opacity-50 cursor-not-allowed",
          uploadError && "border-red-300 bg-red-50",
        )}
      >
        <input {...getInputProps()} />

        {children || (
          <div className="text-center space-y-4">
            {/* Icon */}
            <div
              className={cn(
                "mx-auto rounded-full flex items-center justify-center",
                isMobile ? "w-16 h-16 bg-blue-100" : "w-20 h-20 bg-gray-100",
              )}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              ) : (
                <Upload
                  className={cn(
                    "text-gray-600",
                    isMobile ? "w-8 h-8" : "w-10 h-10",
                  )}
                />
              )}
            </div>

            {/* Title */}
            <div>
              <h3
                className={cn(
                  "font-semibold text-gray-900",
                  isMobile ? "text-lg" : "text-xl",
                )}
              >
                {isUploading ? "Uploading..." : title}
              </h3>
              <p
                className={cn(
                  "text-gray-600 mt-2",
                  isMobile ? "text-sm" : "text-base",
                )}
              >
                {description}
              </p>
            </div>

            {/* File type info */}
            {acceptedFileTypes.length > 0 && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>Supported: {acceptedFileTypes.join(", ")}</div>
                <div>Max size: {formatFileSize(maxFileSize)}</div>
                {multiple && <div>Max files: {maxFiles}</div>}
              </div>
            )}

            {/* Mobile-specific buttons */}
            {isMobile && !isUploading && (
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                  className="touch-target"
                >
                  <Folder className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>

                {allowCamera && device.isTouch && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCameraCapture();
                    }}
                    className="touch-target"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upload progress */}
        {isUploading && uploadProgress !== undefined && (
          <div className="absolute inset-x-4 bottom-4">
            <Progress value={uploadProgress} className="h-2" />
            <div className="text-xs text-gray-600 mt-1 text-center">
              {uploadProgress}% complete
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{uploadError}</p>
        </div>
      )}

      {/* Selected files preview */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => {
              const Icon = getFileIcon(file);
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 touch-target"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PWA device info (development) */}
      {process.env.NODE_ENV === "development" && isMobile && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <div className="flex items-center gap-2">
            <Smartphone className="w-3 h-3" />
            Mobile Upload: {device.isIOS && "iOS"}{" "}
            {device.isAndroid && "Android"} {device.isTouch && "Touch"}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileFileUpload;
