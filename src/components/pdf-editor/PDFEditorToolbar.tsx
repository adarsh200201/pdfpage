import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MousePointer,
  Type,
  Square,
  Circle,
  PenTool,
  Image,
  Signature,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Download,
  Save,
  Palette,
  Settings,
  Grid,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Trash2,
  Copy,
  Layers,
  Lock,
  Unlock,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ToolType, EditorSettings } from "@/hooks/usePDFEditor";
import { cn } from "@/lib/utils";

interface PDFEditorToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onExport: () => void;
  settings: EditorSettings;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isLoading: boolean;
}

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];

const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Comic Sans MS",
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

export function PDFEditorToolbar({
  currentTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  currentPage,
  totalPages,
  onPageChange,
  onExport,
  settings,
  onSettingsChange,
  isCollapsed,
  onToggleCollapse,
  isLoading,
}: PDFEditorToolbarProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const tools = [
    {
      id: "select" as ToolType,
      icon: MousePointer,
      label: "Select",
      shortcut: "V",
    },
    {
      id: "text" as ToolType,
      icon: Type,
      label: "Text",
      shortcut: "T",
    },
    {
      id: "draw" as ToolType,
      icon: PenTool,
      label: "Draw",
      shortcut: "P",
    },
    {
      id: "rectangle" as ToolType,
      icon: Square,
      label: "Rectangle",
      shortcut: "R",
    },
    {
      id: "circle" as ToolType,
      icon: Circle,
      label: "Circle",
      shortcut: "C",
    },
    {
      id: "image" as ToolType,
      icon: Image,
      label: "Image",
      shortcut: "I",
    },
    {
      id: "signature" as ToolType,
      icon: Signature,
      label: "Signature",
      shortcut: "S",
    },
  ];

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex((level) => level >= zoom);
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
    onZoomChange(ZOOM_LEVELS[nextIndex]);
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex((level) => level >= zoom);
    const prevIndex = Math.max(currentIndex - 1, 0);
    onZoomChange(ZOOM_LEVELS[prevIndex]);
  };

  const handleZoomFit = () => {
    onZoomChange(1);
  };

  return (
    <TooltipProvider>
      <div className="bg-white border-b border-gray-200 shadow-sm">
        {/* Main Toolbar */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left Section - Tools */}
          <div className="flex items-center space-x-2">
            {/* Tool Selection */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {tools.map((tool) => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentTool === tool.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onToolChange(tool.id)}
                      className={cn(
                        "px-3 py-2",
                        currentTool === tool.id &&
                          "bg-red-600 text-white hover:bg-red-700",
                      )}
                    >
                      <tool.icon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {tool.label}{" "}
                      <kbd className="ml-1 text-xs">({tool.shortcut})</kbd>
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* History Controls */}
            <div className="flex items-center space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                  >
                    <Undo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Undo <kbd className="ml-1 text-xs">(Ctrl+Z)</kbd>
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo}
                  >
                    <Redo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Redo <kbd className="ml-1 text-xs">(Ctrl+Shift+Z)</kbd>
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Color Picker */}
            <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="px-3">
                  <Palette className="w-4 h-4 mr-1" />
                  <div
                    className="w-4 h-4 border border-gray-300 rounded"
                    style={{
                      backgroundColor:
                        currentTool === "text"
                          ? settings.defaultTextColor
                          : settings.defaultStrokeColor,
                    }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <Label>Stroke Color</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        type="color"
                        value={settings.defaultStrokeColor}
                        onChange={(e) =>
                          onSettingsChange({
                            defaultStrokeColor: e.target.value,
                          })
                        }
                        className="w-12 h-8 p-0 border-0"
                      />
                      <Input
                        value={settings.defaultStrokeColor}
                        onChange={(e) =>
                          onSettingsChange({
                            defaultStrokeColor: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Fill Color</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        type="color"
                        value={settings.defaultFillColor}
                        onChange={(e) =>
                          onSettingsChange({
                            defaultFillColor: e.target.value,
                          })
                        }
                        className="w-12 h-8 p-0 border-0"
                      />
                      <Input
                        value={settings.defaultFillColor}
                        onChange={(e) =>
                          onSettingsChange({
                            defaultFillColor: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Stroke Width</Label>
                    <Slider
                      value={[settings.defaultStrokeWidth]}
                      onValueChange={([value]) =>
                        onSettingsChange({ defaultStrokeWidth: value })
                      }
                      min={1}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      {settings.defaultStrokeWidth}px
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Center Section - Page Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Page</span>
                <Input
                  type="number"
                  value={currentPage}
                  onChange={(e) =>
                    onPageChange(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  min={1}
                  max={totalPages}
                  className="w-16 h-8 text-center"
                />
                <span className="text-sm text-gray-600">of {totalPages}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right Section - Zoom, Settings, Export */}
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomFit}
                className="min-w-[60px]"
              >
                {Math.round(zoom * 100)}%
              </Button>

              <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Settings */}
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Editor Settings</h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Show Grid</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onSettingsChange({ showGrid: !settings.showGrid })
                        }
                      >
                        {settings.showGrid ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Snap to Grid</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onSettingsChange({
                            snapToGrid: !settings.snapToGrid,
                          })
                        }
                      >
                        {settings.snapToGrid ? (
                          <Grid className="w-4 h-4" />
                        ) : (
                          <Grid className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </div>

                    <div>
                      <Label>Grid Size</Label>
                      <Slider
                        value={[settings.gridSize]}
                        onValueChange={([value]) =>
                          onSettingsChange({ gridSize: value })
                        }
                        min={10}
                        max={50}
                        step={5}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        {settings.gridSize}px
                      </div>
                    </div>

                    <div>
                      <Label>Default Font Family</Label>
                      <Select
                        value={settings.defaultFontFamily}
                        onValueChange={(value) =>
                          onSettingsChange({ defaultFontFamily: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_FAMILIES.map((font) => (
                            <SelectItem key={font} value={font}>
                              <span style={{ fontFamily: font }}>{font}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Default Font Size</Label>
                      <Select
                        value={settings.defaultFontSize.toString()}
                        onValueChange={(value) =>
                          onSettingsChange({
                            defaultFontSize: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_SIZES.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-8" />

            {/* Export */}
            <Button
              onClick={onExport}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>

            {/* Collapse Toggle */}
            <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Secondary Toolbar (Font Controls when text tool is active) */}
        {!isCollapsed && currentTool === "text" && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label className="text-sm">Font:</Label>
                <Select
                  value={settings.defaultFontFamily}
                  onValueChange={(value) =>
                    onSettingsChange({ defaultFontFamily: value })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Label className="text-sm">Size:</Label>
                <Select
                  value={settings.defaultFontSize.toString()}
                  onValueChange={(value) =>
                    onSettingsChange({ defaultFontSize: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Label className="text-sm">Color:</Label>
                <Input
                  type="color"
                  value={settings.defaultTextColor}
                  onChange={(e) =>
                    onSettingsChange({ defaultTextColor: e.target.value })
                  }
                  className="w-8 h-8 p-0 border-0"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
