import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreVertical,
  Copy,
  Trash2,
  MoveUp,
  MoveDown,
  ChevronLeft,
  ChevronRight,
  Type,
  Square,
  Circle,
  Image,
  PenTool,
  Signature,
  Settings,
  Palette,
  MousePointer,
} from "lucide-react";
import { PDFElement, EditorSettings } from "@/hooks/usePDFEditor";
import { cn } from "@/lib/utils";

interface PDFEditorSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  elements: PDFElement[];
  selectedElements: string[];
  onElementSelect: (ids: string[]) => void;
  onElementDelete: (ids: string[]) => void;
  onElementUpdate: (id: string, updates: Partial<PDFElement>) => void;
  onElementDuplicate: (ids: string[]) => void;
  settings: EditorSettings;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
}

const ELEMENT_ICONS = {
  text: Type,
  draw: PenTool,
  rectangle: Square,
  circle: Circle,
  image: Image,
  signature: Signature,
  select: MousePointer,
};

export function PDFEditorSidebar({
  isOpen,
  onToggle,
  elements,
  selectedElements,
  onElementSelect,
  onElementDelete,
  onElementUpdate,
  onElementDuplicate,
  settings,
  onSettingsChange,
}: PDFEditorSidebarProps) {
  const [activeTab, setActiveTab] = useState("layers");

  const selectedElement =
    selectedElements.length === 1
      ? elements.find((el) => el.id === selectedElements[0])
      : null;

  const getElementTitle = (element: PDFElement) => {
    switch (element.type) {
      case "text":
        return (element as any).content?.substring(0, 20) || "Text";
      case "draw":
        return "Drawing";
      case "rectangle":
        return "Rectangle";
      case "circle":
        return "Circle";
      case "image":
        return "Image";
      case "signature":
        return "Signature";
      default:
        return "Element";
    }
  };

  const handleElementClick = (elementId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      onElementSelect(
        selectedElements.includes(elementId)
          ? selectedElements.filter((id) => id !== elementId)
          : [...selectedElements, elementId],
      );
    } else {
      // Single selection
      onElementSelect([elementId]);
    }
  };

  const handleElementVisibilityToggle = (element: PDFElement) => {
    onElementUpdate(element.id, { visible: !element.visible });
  };

  const handleElementLockToggle = (element: PDFElement) => {
    onElementUpdate(element.id, { locked: !element.locked });
  };

  const handleOpacityChange = (elementId: string, opacity: number) => {
    onElementUpdate(elementId, { opacity: opacity / 100 });
  };

  const handleRotationChange = (elementId: string, rotation: number) => {
    onElementUpdate(elementId, { rotation });
  };

  if (!isOpen) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Editor Panel</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b border-gray-200">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="layers" className="text-xs">
              <Layers className="w-4 h-4 mr-1" />
              Layers
            </TabsTrigger>
            <TabsTrigger value="properties" className="text-xs">
              <Settings className="w-4 h-4 mr-1" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Palette className="w-4 h-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Layers Tab */}
        <TabsContent value="layers" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Elements ({elements.length})
                </h4>
                {selectedElements.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onElementDuplicate(selectedElements)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onElementDelete(selectedElements)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {elements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No elements yet</p>
                  <p className="text-xs">Start adding elements to your PDF</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {elements
                    .slice()
                    .reverse()
                    .map((element) => {
                      const Icon = ELEMENT_ICONS[element.type] || Type;
                      const isSelected = selectedElements.includes(element.id);

                      return (
                        <div
                          key={element.id}
                          className={cn(
                            "flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors",
                            isSelected && "bg-red-50 border border-red-200",
                          )}
                          onClick={(e) => handleElementClick(element.id, e)}
                        >
                          <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getElementTitle(element)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Page {element.pageIndex + 1} •{" "}
                              {Math.round(element.bounds.x)},
                              {Math.round(element.bounds.y)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleElementVisibilityToggle(element);
                              }}
                              className="p-1 h-6 w-6"
                            >
                              {element.visible ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleElementLockToggle(element);
                              }}
                              className="p-1 h-6 w-6"
                            >
                              {element.locked ? (
                                <Lock className="w-3 h-3 text-gray-400" />
                              ) : (
                                <Unlock className="w-3 h-3" />
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    onElementDuplicate([element.id])
                                  }
                                >
                                  <Copy className="w-3 h-3 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onElementDelete([element.id])}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {selectedElement ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Element Properties
                    </h4>
                    <div className="space-y-4">
                      {/* Position and Size */}
                      <Accordion
                        type="single"
                        collapsible
                        defaultValue="transform"
                      >
                        <AccordionItem value="transform">
                          <AccordionTrigger className="text-sm">
                            Transform
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">X Position</Label>
                                  <Input
                                    type="number"
                                    value={Math.round(selectedElement.bounds.x)}
                                    onChange={(e) =>
                                      onElementUpdate(selectedElement.id, {
                                        bounds: {
                                          ...selectedElement.bounds,
                                          x: parseFloat(e.target.value) || 0,
                                        },
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Y Position</Label>
                                  <Input
                                    type="number"
                                    value={Math.round(selectedElement.bounds.y)}
                                    onChange={(e) =>
                                      onElementUpdate(selectedElement.id, {
                                        bounds: {
                                          ...selectedElement.bounds,
                                          y: parseFloat(e.target.value) || 0,
                                        },
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Width</Label>
                                  <Input
                                    type="number"
                                    value={Math.round(
                                      selectedElement.bounds.width,
                                    )}
                                    onChange={(e) =>
                                      onElementUpdate(selectedElement.id, {
                                        bounds: {
                                          ...selectedElement.bounds,
                                          width:
                                            parseFloat(e.target.value) || 0,
                                        },
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Height</Label>
                                  <Input
                                    type="number"
                                    value={Math.round(
                                      selectedElement.bounds.height,
                                    )}
                                    onChange={(e) =>
                                      onElementUpdate(selectedElement.id, {
                                        bounds: {
                                          ...selectedElement.bounds,
                                          height:
                                            parseFloat(e.target.value) || 0,
                                        },
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Rotation (°)</Label>
                                <Slider
                                  value={[selectedElement.rotation]}
                                  onValueChange={([value]) =>
                                    handleRotationChange(
                                      selectedElement.id,
                                      value,
                                    )
                                  }
                                  min={-180}
                                  max={180}
                                  step={1}
                                  className="mt-2"
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                  {selectedElement.rotation}°
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Opacity (%)</Label>
                                <Slider
                                  value={[
                                    Math.round(selectedElement.opacity * 100),
                                  ]}
                                  onValueChange={([value]) =>
                                    handleOpacityChange(
                                      selectedElement.id,
                                      value,
                                    )
                                  }
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="mt-2"
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                  {Math.round(selectedElement.opacity * 100)}%
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      {/* Text Properties */}
                      {selectedElement.type === "text" && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="text">
                            <AccordionTrigger className="text-sm">
                              Text Properties
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs">Content</Label>
                                  <Input
                                    value={
                                      (selectedElement as any).content || ""
                                    }
                                    onChange={(e) =>
                                      onElementUpdate(selectedElement.id, {
                                        content: e.target.value,
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Font Size</Label>
                                  <Input
                                    type="number"
                                    value={
                                      (selectedElement as any).fontSize || 14
                                    }
                                    onChange={(e) =>
                                      onElementUpdate(selectedElement.id, {
                                        fontSize:
                                          parseInt(e.target.value) || 14,
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Color</Label>
                                  <Input
                                    type="color"
                                    value={
                                      (selectedElement as any).color ||
                                      "#000000"
                                    }
                                    onChange={(e) =>
                                      onElementUpdate(selectedElement.id, {
                                        color: e.target.value,
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {/* Shape Properties */}
                      {(selectedElement.type === "rectangle" ||
                        selectedElement.type === "circle") && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="shape">
                            <AccordionTrigger className="text-sm">
                              Shape Properties
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs">Fill Color</Label>
                                  <Input
                                    type="color"
                                    value={
                                      (selectedElement as any).fillColor ||
                                      "#ffffff"
                                    }
                                    onChange={(e) =>
                                      onElementUpdate(selectedElement.id, {
                                        fillColor: e.target.value,
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">
                                    Stroke Color
                                  </Label>
                                  <Input
                                    type="color"
                                    value={
                                      (selectedElement as any).strokeColor ||
                                      "#000000"
                                    }
                                    onChange={(e) =>
                                      onElementUpdate(selectedElement.id, {
                                        strokeColor: e.target.value,
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">
                                    Stroke Width
                                  </Label>
                                  <Input
                                    type="number"
                                    value={
                                      (selectedElement as any).strokeWidth || 1
                                    }
                                    onChange={(e) =>
                                      onElementUpdate(selectedElement.id, {
                                        strokeWidth:
                                          parseInt(e.target.value) || 1,
                                      })
                                    }
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No element selected</p>
                  <p className="text-xs">
                    Select an element to edit properties
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Editor Settings
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Show Grid</Label>
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
                    <Label className="text-sm">Snap to Grid</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onSettingsChange({ snapToGrid: !settings.snapToGrid })
                      }
                    >
                      {settings.snapToGrid ? (
                        <Layers className="w-4 h-4" />
                      ) : (
                        <Layers className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>

                  <div>
                    <Label className="text-sm">Grid Size</Label>
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
                    <div className="text-xs text-gray-500 mt-1">
                      {settings.gridSize}px
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm">Default Text Color</Label>
                    <Input
                      type="color"
                      value={settings.defaultTextColor}
                      onChange={(e) =>
                        onSettingsChange({ defaultTextColor: e.target.value })
                      }
                      className="h-8 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Default Stroke Color</Label>
                    <Input
                      type="color"
                      value={settings.defaultStrokeColor}
                      onChange={(e) =>
                        onSettingsChange({ defaultStrokeColor: e.target.value })
                      }
                      className="h-8 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Default Fill Color</Label>
                    <Input
                      type="color"
                      value={settings.defaultFillColor}
                      onChange={(e) =>
                        onSettingsChange({ defaultFillColor: e.target.value })
                      }
                      className="h-8 mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
