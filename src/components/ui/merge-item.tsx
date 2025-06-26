import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Trash2,
  RotateCw,
  Eye,
  Plus,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfPreview from "./pdf-preview";

export interface MergeFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: "pdf" | "image";
}

interface MergeItemProps {
  item: MergeFileItem;
  index: number;
  isDragging: boolean;
  isInsertionTarget: boolean;
  onRemove: (id: string) => void;
  onRotate?: (id: string) => void;
  onPreview: (item: MergeFileItem) => void;
  onInsertBefore: (index: number) => void;
  onInsertAfter: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  showInsertionControls?: boolean;
}

export const MergeItem: React.FC<MergeItemProps> = ({
  item,
  index,
  isDragging,
  isInsertionTarget,
  onRemove,
  onRotate,
  onPreview,
  onInsertBefore,
  onInsertAfter,
  onDragStart,
  onDragOver,
  onDragEnd,
  showInsertionControls = true,
}) => {
  const [showInsertOptions, setShowInsertOptions] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="relative group">
      {/* Insert Before Button */}
      {showInsertionControls && (
        <div className="flex justify-center mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onInsertBefore(index)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-dashed border-blue-300"
          >
            <Plus className="w-4 h-4 mr-1" />
            Insert Here
          </Button>
        </div>
      )}

      {/* Main Item */}
      <div
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragEnd={onDragEnd}
        className={cn(
          "flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 cursor-move bg-white",
          isDragging
            ? "border-brand-red bg-red-50 shadow-lg scale-105"
            : isInsertionTarget
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
        )}
      >
        {/* Drag Handle */}
        <div className="flex-shrink-0">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        {/* Preview */}
        <div className="flex-shrink-0">
          <PdfPreview
            file={item.file}
            showFileName={false}
            maxWidth={60}
            maxHeight={80}
            className="w-16 h-20"
          />
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {item.type === "pdf" ? (
              <FileText className="w-4 h-4 text-blue-500" />
            ) : (
              <ImageIcon className="w-4 h-4 text-green-500" />
            )}
            <p className="text-sm font-medium text-text-dark truncate">
              {item.name}
            </p>
          </div>
          <p className="text-xs text-text-light">
            {formatFileSize(item.size)} • {item.type.toUpperCase()}
          </p>
          <div className="text-xs text-gray-500 mt-1">Position {index + 1}</div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPreview(item)}
            className="opacity-60 hover:opacity-100"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {item.type === "pdf" && onRotate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRotate(item.id)}
              className="opacity-60 hover:opacity-100"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 opacity-60 hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Insert After Button */}
      {showInsertionControls && (
        <div className="flex justify-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onInsertAfter(index)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-dashed border-blue-300"
          >
            <Plus className="w-4 h-4 mr-1" />
            Insert Here
          </Button>
        </div>
      )}
    </div>
  );
};

export default MergeItem;
