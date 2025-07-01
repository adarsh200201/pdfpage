import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onClose?: () => void;
  className?: string;
  isActive?: boolean;
}

export default function ImageUpload({
  onImageSelect,
  onClose,
  className,
  isActive = false,
}: ImageUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageSelect(acceptedFiles[0]);
      }
    },
    [onImageSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg"],
    },
    multiple: false,
    noClick: !isActive,
    noDrag: !isActive,
  });

  if (!isActive) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50",
        className,
      )}
      onClick={handleBackdropClick}
    >
      <div
        {...getRootProps()}
        className={cn(
          "bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center border-2 border-dashed transition-colors",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-gray-100 rounded-full">
            {isDragActive ? (
              <Upload className="w-8 h-8 text-blue-500" />
            ) : (
              <Image className="w-8 h-8 text-gray-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragActive ? "Drop image here" : "Upload Image"}
            </h3>
            <p className="text-sm text-gray-500">
              {isDragActive
                ? "Release to upload"
                : "Drag & drop an image here, or click to select"}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports: PNG, JPG, JPEG, GIF, BMP, SVG
            </p>
          </div>
          {!isDragActive && (
            <button
              type="button"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Select Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ImageTool({
  onImageSelect,
  className,
}: {
  onImageSelect: (file: File) => void;
  className?: string;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 transition-colors",
          className,
        )}
        title="Add Image"
      >
        <Image className="w-5 h-5" />
      </button>
    </>
  );
}
