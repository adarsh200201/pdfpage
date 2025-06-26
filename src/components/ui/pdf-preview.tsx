import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Loader2,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface PdfPreviewProps {
  file: File;
  className?: string;
  showFileName?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

interface PreviewData {
  type: "pdf" | "image";
  thumbnail: string;
  pageCount?: number;
  error?: string;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  file,
  className,
  showFileName = true,
  maxWidth = 120,
  maxHeight = 160,
}) => {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generatePreview();
  }, [file]);

  const generatePreview = async () => {
    setIsLoading(true);
    setPreview(null);

    try {
      if (file.type === "application/pdf") {
        await generatePdfPreview();
      } else if (file.type.startsWith("image/")) {
        await generateImagePreview();
      } else {
        setPreview({
          type: "pdf",
          thumbnail: "",
          error: "Unsupported file type",
        });
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      setPreview({
        type: file.type.startsWith("image/") ? "image" : "pdf",
        thumbnail: "",
        error: "Failed to load preview",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePdfPreview = async () => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Calculate scale to fit within maxWidth/maxHeight while maintaining aspect ratio
    const viewport = page.getViewport({ scale: 1 });
    const scaleX = maxWidth / viewport.width;
    const scaleY = maxHeight / viewport.height;
    const scale = Math.min(scaleX, scaleY);

    const scaledViewport = page.getViewport({ scale });
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };

    await page.render(renderContext).promise;

    const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
    setPreview({
      type: "pdf",
      thumbnail,
      pageCount: pdf.numPages,
    });
  };

  const generateImagePreview = async () => {
    const img = new Image();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        // Calculate scale to fit within maxWidth/maxHeight while maintaining aspect ratio
        const scaleX = maxWidth / img.width;
        const scaleY = maxHeight / img.height;
        const scale = Math.min(scaleX, scaleY);

        const width = img.width * scale;
        const height = img.height * scale;

        canvas.width = width;
        canvas.height = height;

        context.drawImage(img, 0, 0, width, height);

        const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
        setPreview({
          type: "image",
          thumbnail,
        });
        resolve();
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
        style={{ width: maxWidth, height: maxHeight }}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : preview?.error ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-red-500 p-2">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-xs text-center">{preview.error}</p>
          </div>
        ) : preview?.thumbnail ? (
          <img
            src={preview.thumbnail}
            alt="Preview"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            {file.type.startsWith("image/") ? (
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            ) : (
              <FileText className="w-8 h-8 text-gray-400 mb-2" />
            )}
            <p className="text-xs text-gray-500">No preview</p>
          </div>
        )}

        {/* File type indicator */}
        <div className="absolute top-2 right-2">
          <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            {preview?.type === "pdf" && preview.pageCount
              ? `PDF (${preview.pageCount})`
              : preview?.type === "image"
                ? "IMG"
                : file.type.includes("pdf")
                  ? "PDF"
                  : "IMG"}
          </div>
        </div>
      </div>

      {showFileName && (
        <div className="mt-2 text-center max-w-full">
          <p
            className="text-sm font-medium text-gray-700 truncate"
            title={file.name}
          >
            {file.name}
          </p>
          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        </div>
      )}

      {/* Hidden canvas for generating previews */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PdfPreview;
