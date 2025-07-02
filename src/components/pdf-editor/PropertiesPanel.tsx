import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AnyElement,
  TextElement,
  ShapeElement,
  DrawElement,
  SignatureElement,
  ImageElement,
} from "@/types/pdf-editor";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  RotateCcw,
  Copy,
  Trash2,
  Move,
} from "lucide-react";

interface PropertiesPanelProps {
  selectedElements: AnyElement[];
  onElementUpdate: (id: string, updates: Partial<AnyElement>) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedStrokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  selectedFontSize: number;
  onFontSizeChange: (size: number) => void;
  className?: string;
}

const colorOptions = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#FF0000" },
  { name: "Green", value: "#00FF00" },
  { name: "Blue", value: "#0000FF" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Orange", value: "#FFA500" },
  { name: "Purple", value: "#800080" },
  { name: "Gray", value: "#808080" },
];

const fontFamilies = [
  "Arial",
  "Times New Roman",
  "Helvetica",
  "Georgia",
  "Verdana",
  "Courier New",
];

const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

export default function PropertiesPanel({
  selectedElements,
  onElementUpdate,
  selectedColor,
  onColorChange,
  selectedStrokeWidth,
  onStrokeWidthChange,
  selectedFontSize,
  onFontSizeChange,
  className,
}: PropertiesPanelProps) {
  const hasSelection = selectedElements.length > 0;
  const singleSelection = selectedElements.length === 1;
  const element = singleSelection ? selectedElements[0] : null;

  const updateProperty = (property: string, value: any) => {
    selectedElements.forEach((el) => {
      onElementUpdate(el.id, {
        properties: {
          ...el.properties,
          [property]: value,
        },
      });
    });
  };

  const updateBounds = (key: keyof AnyElement["bounds"], value: number) => {
    selectedElements.forEach((el) => {
      onElementUpdate(el.id, {
        bounds: {
          ...el.bounds,
          [key]: value,
        },
      });
    });
  };

  if (!hasSelection) {
    return (
      <div
        className={cn("w-80 bg-white border-l border-gray-200 p-4", className)}
      >
        {/* Properties panel only shows when element is selected */}
      </div>
    );
  }

  return (
    <div className={cn("w-80 bg-white border-l border-gray-200", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        <p className="text-sm text-gray-500 mt-1">
          {selectedElements.length} element
          {selectedElements.length > 1 ? "s" : ""} selected
        </p>
      </div>

      {/* Properties Content */}
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Position & Size */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Position & Size
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="x" className="text-xs">
                X
              </Label>
              <Input
                id="x"
                type="number"
                value={Math.round(element?.bounds.x || 0)}
                onChange={(e) =>
                  updateBounds("x", parseFloat(e.target.value) || 0)
                }
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="y" className="text-xs">
                Y
              </Label>
              <Input
                id="y"
                type="number"
                value={Math.round(element?.bounds.y || 0)}
                onChange={(e) =>
                  updateBounds("y", parseFloat(e.target.value) || 0)
                }
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="width" className="text-xs">
                Width
              </Label>
              <Input
                id="width"
                type="number"
                value={Math.round(element?.bounds.width || 0)}
                onChange={(e) =>
                  updateBounds("width", parseFloat(e.target.value) || 0)
                }
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs">
                Height
              </Label>
              <Input
                id="height"
                type="number"
                value={Math.round(element?.bounds.height || 0)}
                onChange={(e) =>
                  updateBounds("height", parseFloat(e.target.value) || 0)
                }
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Text Properties */}
        {element?.type === "text" && (
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Text</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="text-content" className="text-xs">
                  Content
                </Label>
                <Textarea
                  id="text-content"
                  value={(element as TextElement).properties.text}
                  onChange={(e) => updateProperty("text", e.target.value)}
                  className="min-h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="font-family" className="text-xs">
                    Font
                  </Label>
                  <Select
                    value={(element as TextElement).properties.fontFamily}
                    onValueChange={(value) =>
                      updateProperty("fontFamily", value)
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="font-size" className="text-xs">
                    Size
                  </Label>
                  <Select
                    value={(
                      element as TextElement
                    ).properties.fontSize.toString()}
                    onValueChange={(value) =>
                      updateProperty("fontSize", parseInt(value))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontSizes.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs mb-2 block">Alignment</Label>
                <div className="flex items-center space-x-1">
                  {["left", "center", "right"].map((align) => (
                    <Button
                      key={align}
                      variant={
                        (element as TextElement).properties.alignment === align
                          ? "default"
                          : "ghost"
                      }
                      size="sm"
                      onClick={() => updateProperty("alignment", align)}
                      className="h-8 w-8 p-0"
                    >
                      {align === "left" && <AlignLeft className="h-4 w-4" />}
                      {align === "center" && (
                        <AlignCenter className="h-4 w-4" />
                      )}
                      {align === "right" && <AlignRight className="h-4 w-4" />}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="text-color" className="text-xs">
                  Color
                </Label>
                <Select
                  value={(element as TextElement).properties.color}
                  onValueChange={(value) => updateProperty("color", value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Shape Properties */}
        {["rectangle", "circle", "line", "arrow"].includes(
          element?.type || "",
        ) && (
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Shape</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="stroke-width" className="text-xs">
                  Stroke Width
                </Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[(element as ShapeElement).properties.strokeWidth]}
                    onValueChange={(value) =>
                      updateProperty("strokeWidth", value[0])
                    }
                    max={20}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs w-8">
                    {(element as ShapeElement).properties.strokeWidth}px
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="stroke-color" className="text-xs">
                  Stroke Color
                </Label>
                <Select
                  value={(element as ShapeElement).properties.strokeColor}
                  onValueChange={(value) =>
                    updateProperty("strokeColor", value)
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {["rectangle", "circle"].includes(element?.type || "") && (
                <div>
                  <Label htmlFor="fill-color" className="text-xs">
                    Fill Color
                  </Label>
                  <Select
                    value={(element as ShapeElement).properties.fillColor}
                    onValueChange={(value) =>
                      updateProperty("fillColor", value)
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transparent">Transparent</SelectItem>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: color.value }}
                            />
                            <span>{color.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="opacity" className="text-xs">
                  Opacity
                </Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[(element as ShapeElement).properties.opacity * 100]}
                    onValueChange={(value) =>
                      updateProperty("opacity", value[0] / 100)
                    }
                    max={100}
                    min={0}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs w-8">
                    {Math.round(
                      (element as ShapeElement).properties.opacity * 100,
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Draw Properties */}
        {element?.type === "draw" && (
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Drawing
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="draw-stroke-width" className="text-xs">
                  Stroke Width
                </Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[(element as DrawElement).properties.strokeWidth]}
                    onValueChange={(value) =>
                      updateProperty("strokeWidth", value[0])
                    }
                    max={20}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs w-8">
                    {(element as DrawElement).properties.strokeWidth}px
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="draw-color" className="text-xs">
                  Color
                </Label>
                <Select
                  value={(element as DrawElement).properties.color}
                  onValueChange={(value) => updateProperty("color", value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Signature Properties */}
        {element?.type === "signature" && (
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Signature
            </h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Type</Label>
                <p className="text-sm text-gray-600">
                  {(element as SignatureElement).properties.signatureType}
                </p>
              </div>

              {(element as SignatureElement).properties.signatureType ===
                "type" && (
                <div>
                  <Label htmlFor="signature-text" className="text-xs">
                    Text
                  </Label>
                  <Input
                    id="signature-text"
                    value={
                      (element as SignatureElement).properties.signatureText ||
                      ""
                    }
                    onChange={(e) =>
                      updateProperty("signatureText", e.target.value)
                    }
                    className="h-8"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="signature-color" className="text-xs">
                  Color
                </Label>
                <Select
                  value={(element as SignatureElement).properties.color}
                  onValueChange={(value) => updateProperty("color", value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Selection Info */}
        {selectedElements.length > 1 && (
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Multiple Selection
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {selectedElements.length} elements selected
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedElements.map((el) => (
                  <span
                    key={el.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {el.type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
