import React, { useState } from "react";
import {
  MousePointer,
  Type,
  PenTool,
  Highlighter,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Image,
  Stamp,
  FileText,
  StickyNote,
  Copy,
  Clipboard,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Download,
  Save,
  Palette,
  Settings,
  ChevronDown,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ToolType } from "@/types/pdf-editor";

interface EditorToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSave: () => void;
  onDownload: () => void;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  canPaste: boolean;
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedStrokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  selectedFontSize: number;
  onFontSizeChange: (size: number) => void;
}

const colorPalette = [
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#000080",
  "#008000",
  "#800000",
];

const strokeWidths = [1, 2, 3, 4, 5, 8, 12, 16, 20];
const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const ToolButton: React.FC<{
  tool: ToolType;
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  icon: React.ComponentType<any>;
  label: string;
  shortcut?: string;
}> = ({ tool, currentTool, onToolChange, icon: Icon, label, shortcut }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={currentTool === tool ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange(tool)}
          className={cn(
            "h-10 w-10 p-0",
            currentTool === tool && "bg-blue-600 text-white hover:bg-blue-700",
          )}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {label}{" "}
          {shortcut && <span className="text-xs opacity-75">({shortcut})</span>}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function EditorToolbar({
  currentTool,
  onToolChange,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDelete,
  onZoomIn,
  onZoomOut,
  onSave,
  onDownload,
  zoom,
  canUndo,
  canRedo,
  hasSelection,
  canPaste,
  selectedColor,
  onColorChange,
  selectedStrokeWidth,
  onStrokeWidthChange,
  selectedFontSize,
  onFontSizeChange,
}: EditorToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Main Toolbar */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Tool Selection */}
        <div className="flex items-center space-x-1">
          {/* Selection Tools */}
          <div className="flex items-center space-x-1 mr-2">
            <ToolButton
              tool="select"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={MousePointer}
              label="Select"
              shortcut="V"
            />
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Text Tools */}
          <div className="flex items-center space-x-1 mr-2">
            <ToolButton
              tool="text"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={Type}
              label="Add Text"
              shortcut="T"
            />
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Drawing Tools */}
          <div className="flex items-center space-x-1 mr-2">
            <ToolButton
              tool="draw"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={PenTool}
              label="Draw"
              shortcut="P"
            />
            <ToolButton
              tool="highlight"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={Highlighter}
              label="Highlight"
              shortcut="H"
            />
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Shape Tools */}
          <div className="flex items-center space-x-1 mr-2">
            <ToolButton
              tool="rectangle"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={Square}
              label="Rectangle"
              shortcut="R"
            />
            <ToolButton
              tool="circle"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={Circle}
              label="Circle"
              shortcut="C"
            />
            <ToolButton
              tool="line"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={Minus}
              label="Line"
              shortcut="L"
            />
            <ToolButton
              tool="arrow"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={ArrowRight}
              label="Arrow"
              shortcut="A"
            />
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Advanced Tools */}
          <div className="flex items-center space-x-1 mr-2">
            <ToolButton
              tool="signature"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={PenTool}
              label="Signature"
              shortcut="S"
            />
            <ToolButton
              tool="image"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={Image}
              label="Insert Image"
              shortcut="I"
            />
            <ToolButton
              tool="stamp"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={Stamp}
              label="Stamp"
            />
            <ToolButton
              tool="form-field"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={FileText}
              label="Form Field"
            />
            <ToolButton
              tool="sticky-note"
              currentTool={currentTool}
              onToolChange={onToolChange}
              icon={StickyNote}
              label="Sticky Note"
              shortcut="N"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* Edit Actions */}
          <div className="flex items-center space-x-1 mr-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="h-10 w-10 p-0"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="h-10 w-10 p-0"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Clipboard Actions */}
          <div className="flex items-center space-x-1 mr-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCopy}
                    disabled={!hasSelection}
                    className="h-10 w-10 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy (Ctrl+C)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPaste}
                    disabled={!canPaste}
                    className="h-10 w-10 p-0"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Paste (Ctrl+V)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    disabled={!hasSelection}
                    className="h-10 w-10 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete (Del)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 mr-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onZoomOut}
                    className="h-10 w-10 p-0"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom Out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-sm font-medium w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onZoomIn}
                    className="h-10 w-10 p-0"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom In</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Save Actions */}
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSave}
                    className="h-10 w-10 p-0"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save (Ctrl+S)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onDownload}
                    className="h-10 px-3"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Properties Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200">
        {/* Color Picker */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Color:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: selectedColor }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <div className="grid grid-cols-5 gap-1 p-2">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 hover:border-gray-400"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        selectedColor === color ? "#3b82f6" : "#e5e7eb",
                    }}
                    onClick={() => onColorChange(color)}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Stroke:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {selectedStrokeWidth}px
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {strokeWidths.map((width) => (
                <DropdownMenuItem
                  key={width}
                  onClick={() => onStrokeWidthChange(width)}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="bg-black rounded"
                      style={{ width: "20px", height: `${width}px` }}
                    />
                    <span>{width}px</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Font Size */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Font Size:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {selectedFontSize}px
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {fontSizes.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => onFontSizeChange(size)}
                >
                  {size}px
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium mr-2">Align:</span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <AlignLeft className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <AlignCenter className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <AlignRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Grid Toggle */}
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Grid className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Grid</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
