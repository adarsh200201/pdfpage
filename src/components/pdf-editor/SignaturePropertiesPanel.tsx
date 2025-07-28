import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Trash2, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  ArrowUp,
  ArrowDown,
  Palette,
  RotateCw,
  Move,
  Square
} from "lucide-react";

interface SignatureData {
  id: string;
  type: "draw" | "type" | "upload" | "date" | "text";
  data: string;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  rotation: number;
  opacity: number;
  color: string;
  fontSize?: number;
  fontFamily?: string;
  locked: boolean;
  visible: boolean;
  style?: string;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  createdAt: Date;
}

interface SignaturePropertiesPanelProps {
  signature: SignatureData;
  onUpdate: (updates: Partial<SignatureData>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveLayer: (direction: "up" | "down") => void;
}

export const SignaturePropertiesPanel: React.FC<SignaturePropertiesPanelProps> = ({
  signature,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveLayer,
}) => {
  const fontFamilies = [
    { value: "Arial", label: "Arial" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "serif", label: "Serif" },
    { value: "sans-serif", label: "Sans Serif" },
    { value: "cursive", label: "Cursive" },
    { value: "monospace", label: "Monospace" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Properties</h3>
        <Badge variant="outline" className="text-xs">
          {signature.type}
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdate({ visible: !signature.visible })}
          className="text-xs"
        >
          {signature.visible ? (
            <Eye className="w-3 h-3 mr-1" />
          ) : (
            <EyeOff className="w-3 h-3 mr-1" />
          )}
          {signature.visible ? "Hide" : "Show"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdate({ locked: !signature.locked })}
          className="text-xs"
        >
          {signature.locked ? (
            <Unlock className="w-3 h-3 mr-1" />
          ) : (
            <Lock className="w-3 h-3 mr-1" />
          )}
          {signature.locked ? "Unlock" : "Lock"}
        </Button>
      </div>

      {/* Position and Size */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 text-sm flex items-center">
          <Move className="w-4 h-4 mr-1" />
          Position & Size
        </h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              X Position
            </label>
            <input
              type="number"
              value={Math.round(signature.x)}
              onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Y Position
            </label>
            <input
              type="number"
              value={Math.round(signature.y)}
              onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Width
            </label>
            <input
              type="number"
              value={Math.round(signature.width)}
              onChange={(e) =>
                onUpdate({ width: parseInt(e.target.value) || 50 })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Height
            </label>
            <input
              type="number"
              value={Math.round(signature.height)}
              onChange={(e) =>
                onUpdate({ height: parseInt(e.target.value) || 20 })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Rotation and Opacity */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 text-sm flex items-center">
          <RotateCw className="w-4 h-4 mr-1" />
          Transform
        </h4>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Rotation (degrees)
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={signature.rotation}
            onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-xs text-gray-600 text-center">
            {signature.rotation}°
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Opacity
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={signature.opacity}
            onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
          <div className="text-xs text-gray-600 text-center">
            {Math.round(signature.opacity * 100)}%
          </div>
        </div>
      </div>

      {/* Text Styling (for text-based signatures) */}
      {(signature.type === "type" || signature.type === "text" || signature.type === "date") && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-sm flex items-center">
            <Palette className="w-4 h-4 mr-1" />
            Text Styling
          </h4>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Font Size
            </label>
            <input
              type="number"
              min="8"
              max="72"
              value={signature.fontSize || 18}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 18 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Font Family
            </label>
            <select
              value={signature.fontFamily || "Arial"}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {fontFamilies.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Text Color
            </label>
            <input
              type="color"
              value={signature.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Background Color
            </label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={signature.backgroundColor || "#ffffff"}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="flex-1 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ backgroundColor: undefined })}
                className="px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Border Styling */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 text-sm flex items-center">
          <Square className="w-4 h-4 mr-1" />
          Border
        </h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Width
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={signature.borderWidth || 0}
              onChange={(e) => onUpdate({ borderWidth: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              value={signature.borderColor || "#000000"}
              onChange={(e) => onUpdate({ borderColor: e.target.value })}
              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Layer Management */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 text-sm">Layer Order</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMoveLayer("up")}
            className="text-xs"
          >
            <ArrowUp className="w-3 h-3 mr-1" />
            Bring Forward
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMoveLayer("down")}
            className="text-xs"
          >
            <ArrowDown className="w-3 h-3 mr-1" />
            Send Backward
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-3 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onDuplicate}
          className="w-full text-sm"
        >
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </Button>
        <Button
          variant="destructive"
          onClick={onDelete}
          className="w-full text-sm"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
        Created: {signature.createdAt.toLocaleDateString()}
      </div>
    </div>
  );
};

export default SignaturePropertiesPanel;
