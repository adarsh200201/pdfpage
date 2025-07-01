import React, { useState } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  showInput?: boolean;
}

const predefinedColors = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#008000",
  "#800000",
  "#808080",
  "#C0C0C0",
  "#000080",
  "#008080",
  "#808000",
  "#FF6347",
  "#40E0D0",
  "#EE82EE",
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  className,
  showInput = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-8 h-8 p-0 border-2", className)}
          style={{ backgroundColor: color }}
        >
          <span className="sr-only">Pick a color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div>
            <Label>Color Palette</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {predefinedColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className={cn(
                    "w-8 h-8 rounded border-2 hover:scale-110 transition-transform",
                    color === presetColor
                      ? "border-gray-900"
                      : "border-gray-300",
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    onChange(presetColor);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>

          {showInput && (
            <div>
              <Label htmlFor="color-input">Custom Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color-input"
                  type="color"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-12 h-8 p-0 border-0"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
