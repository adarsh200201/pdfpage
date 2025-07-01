import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Type,
  CheckSquare,
  Circle,
  ChevronDown,
  Calendar,
  Signature,
  Image,
  FileText,
  Plus,
  Trash2,
  Copy,
  Settings,
  Save,
  Eye,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

interface FormField {
  id: string;
  type:
    | "text"
    | "textarea"
    | "checkbox"
    | "radio"
    | "select"
    | "date"
    | "signature"
    | "image"
    | "number"
    | "email"
    | "tel";
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  options?: string[];
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pageIndex: number;
  properties: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderStyle?: "solid" | "dashed" | "dotted" | "none";
    borderWidth?: number;
    borderColor?: string;
    readonly?: boolean;
    multiline?: boolean;
    defaultValue?: string;
  };
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  settings: {
    submitUrl?: string;
    method?: "POST" | "GET";
    emailNotification?: string;
    thankYouMessage?: string;
    redirectUrl?: string;
  };
}

interface PDFFormBuilderProps {
  onSave: (template: FormTemplate) => void;
  onPreview: (template: FormTemplate) => void;
  initialTemplate?: FormTemplate;
  className?: string;
}

const fieldTypeIcons: Record<FormField["type"], React.ComponentType<any>> = {
  text: Type,
  textarea: FileText,
  checkbox: CheckSquare,
  radio: Circle,
  select: ChevronDown,
  date: Calendar,
  signature: Signature,
  image: Image,
  number: Type,
  email: Type,
  tel: Type,
};

const fieldTypeLabels: Record<FormField["type"], string> = {
  text: "Text Input",
  textarea: "Text Area",
  checkbox: "Checkbox",
  radio: "Radio Button",
  select: "Dropdown",
  date: "Date Picker",
  signature: "Signature",
  image: "Image Upload",
  number: "Number",
  email: "Email",
  tel: "Phone",
};

const PDFFormBuilder: React.FC<PDFFormBuilderProps> = ({
  onSave,
  onPreview,
  initialTemplate,
  className,
}) => {
  const [template, setTemplate] = useState<FormTemplate>(
    initialTemplate || {
      id: uuidv4(),
      name: "New Form",
      description: "",
      fields: [],
      settings: {
        method: "POST",
        thankYouMessage: "Thank you for your submission!",
      },
    },
  );

  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [activeTab, setActiveTab] = useState("design");
  const [draggedFieldType, setDraggedFieldType] = useState<
    FormField["type"] | null
  >(null);

  const addField = useCallback(
    (type: FormField["type"], position?: { x: number; y: number }) => {
      const newField: FormField = {
        id: uuidv4(),
        type,
        name: `field_${Date.now()}`,
        label: `${fieldTypeLabels[type]} Field`,
        required: false,
        position: {
          x: position?.x || 50,
          y: position?.y || 50,
          width: type === "textarea" ? 300 : 200,
          height: type === "textarea" ? 100 : 32,
        },
        pageIndex: 0,
        properties: {
          fontSize: 12,
          fontFamily: "Arial",
          color: "#000000",
          backgroundColor: "#ffffff",
          borderStyle: "solid",
          borderWidth: 1,
          borderColor: "#cccccc",
        },
      };

      if (type === "radio" || type === "select") {
        newField.options = ["Option 1", "Option 2", "Option 3"];
      }

      setTemplate((prev) => ({
        ...prev,
        fields: [...prev.fields, newField],
      }));

      setSelectedField(newField);
    },
    [],
  );

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      setTemplate((prev) => ({
        ...prev,
        fields: prev.fields.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field,
        ),
      }));

      if (selectedField?.id === fieldId) {
        setSelectedField((prev) => (prev ? { ...prev, ...updates } : null));
      }
    },
    [selectedField],
  );

  const deleteField = useCallback(
    (fieldId: string) => {
      setTemplate((prev) => ({
        ...prev,
        fields: prev.fields.filter((field) => field.id !== fieldId),
      }));

      if (selectedField?.id === fieldId) {
        setSelectedField(null);
      }
    },
    [selectedField],
  );

  const duplicateField = useCallback((field: FormField) => {
    const newField: FormField = {
      ...field,
      id: uuidv4(),
      name: `${field.name}_copy`,
      position: {
        ...field.position,
        x: field.position.x + 20,
        y: field.position.y + 20,
      },
    };

    setTemplate((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  }, []);

  const moveField = useCallback(
    (fieldId: string, newPosition: { x: number; y: number }) => {
      updateField(fieldId, {
        position: { ...selectedField?.position, ...newPosition } as any,
      });
    },
    [updateField, selectedField],
  );

  const handleSave = useCallback(() => {
    onSave(template);
  }, [template, onSave]);

  const handlePreview = useCallback(() => {
    onPreview(template);
  }, [template, onPreview]);

  const addOption = useCallback(
    (fieldId: string) => {
      const field = template.fields.find((f) => f.id === fieldId);
      if (field && field.options) {
        updateField(fieldId, {
          options: [...field.options, `Option ${field.options.length + 1}`],
        });
      }
    },
    [template.fields, updateField],
  );

  const updateOption = useCallback(
    (fieldId: string, optionIndex: number, value: string) => {
      const field = template.fields.find((f) => f.id === fieldId);
      if (field && field.options) {
        const newOptions = [...field.options];
        newOptions[optionIndex] = value;
        updateField(fieldId, { options: newOptions });
      }
    },
    [template.fields, updateField],
  );

  const removeOption = useCallback(
    (fieldId: string, optionIndex: number) => {
      const field = template.fields.find((f) => f.id === fieldId);
      if (field && field.options && field.options.length > 1) {
        updateField(fieldId, {
          options: field.options.filter((_, index) => index !== optionIndex),
        });
      }
    },
    [template.fields, updateField],
  );

  return (
    <div className={cn("flex h-full", className)}>
      {/* Sidebar - Field Library */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <h3 className="font-semibold mb-4">Form Fields</h3>
        <div className="space-y-2">
          {Object.entries(fieldTypeLabels).map(([type, label]) => {
            const Icon = fieldTypeIcons[type as FormField["type"]];
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addField(type as FormField["type"])}
                draggable
                onDragStart={() =>
                  setDraggedFieldType(type as FormField["type"])
                }
                onDragEnd={() => setDraggedFieldType(null)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Button>
            );
          })}
        </div>

        {/* Template Settings */}
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold">Form Settings</h3>
          <div className="space-y-2">
            <Label htmlFor="form-name">Form Name</Label>
            <Input
              id="form-name"
              value={template.name}
              onChange={(e) =>
                setTemplate((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-description">Description</Label>
            <Textarea
              id="form-description"
              value={template.description}
              onChange={(e) =>
                setTemplate((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{template.name}</h2>
            <Badge variant="secondary">{template.fields.length} fields</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Form
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Form Canvas */}
          <div className="flex-1 p-4 overflow-auto bg-white">
            <div
              className="relative min-h-[800px] border-2 border-dashed border-gray-300 rounded-lg"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedFieldType) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  addField(draggedFieldType, { x, y });
                  setDraggedFieldType(null);
                }
              }}
            >
              {template.fields.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Drag fields from the sidebar to build your form
                </div>
              ) : (
                template.fields.map((field) => {
                  const Icon = fieldTypeIcons[field.type];
                  return (
                    <div
                      key={field.id}
                      className={cn(
                        "absolute border-2 rounded cursor-pointer",
                        selectedField?.id === field.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-white hover:border-gray-400",
                      )}
                      style={{
                        left: field.position.x,
                        top: field.position.y,
                        width: field.position.width,
                        height: field.position.height,
                      }}
                      onClick={() => setSelectedField(field)}
                      draggable
                      onDragEnd={(e) => {
                        const container = e.currentTarget.parentElement;
                        if (container) {
                          const rect = container.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          moveField(field.id, { x, y });
                        }
                      }}
                    >
                      <div className="p-2 flex items-center justify-between h-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {field.label}
                          </span>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateField(field);
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteField(field.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel - Field Properties */}
          {selectedField && (
            <div className="w-80 border-l bg-gray-50 p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                </TabsList>

                <TabsContent value="properties" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Field Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Field Name</Label>
                        <Input
                          value={selectedField.name}
                          onChange={(e) =>
                            updateField(selectedField.id, {
                              name: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={selectedField.label}
                          onChange={(e) =>
                            updateField(selectedField.id, {
                              label: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={selectedField.placeholder || ""}
                          onChange={(e) =>
                            updateField(selectedField.id, {
                              placeholder: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedField.required}
                          onCheckedChange={(checked) =>
                            updateField(selectedField.id, { required: checked })
                          }
                        />
                        <Label>Required Field</Label>
                      </div>

                      {(selectedField.type === "radio" ||
                        selectedField.type === "select") && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          {selectedField.options?.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={option}
                                onChange={(e) =>
                                  updateOption(
                                    selectedField.id,
                                    index,
                                    e.target.value,
                                  )
                                }
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  removeOption(selectedField.id, index)
                                }
                                disabled={selectedField.options!.length <= 1}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addOption(selectedField.id)}
                            className="w-full"
                          >
                            <Plus className="w-3 h-3 mr-2" />
                            Add Option
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="style" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Appearance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Width</Label>
                          <Input
                            type="number"
                            value={selectedField.position.width}
                            onChange={(e) =>
                              updateField(selectedField.id, {
                                position: {
                                  ...selectedField.position,
                                  width: parseInt(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Height</Label>
                          <Input
                            type="number"
                            value={selectedField.position.height}
                            onChange={(e) =>
                              updateField(selectedField.id, {
                                position: {
                                  ...selectedField.position,
                                  height: parseInt(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Font Size</Label>
                        <Input
                          type="number"
                          value={selectedField.properties.fontSize || 12}
                          onChange={(e) =>
                            updateField(selectedField.id, {
                              properties: {
                                ...selectedField.properties,
                                fontSize: parseInt(e.target.value),
                              },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Font Family</Label>
                        <Select
                          value={selectedField.properties.fontFamily || "Arial"}
                          onValueChange={(value) =>
                            updateField(selectedField.id, {
                              properties: {
                                ...selectedField.properties,
                                fontFamily: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">
                              Times New Roman
                            </SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Text Color</Label>
                        <Input
                          type="color"
                          value={selectedField.properties.color || "#000000"}
                          onChange={(e) =>
                            updateField(selectedField.id, {
                              properties: {
                                ...selectedField.properties,
                                color: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Background Color</Label>
                        <Input
                          type="color"
                          value={
                            selectedField.properties.backgroundColor ||
                            "#ffffff"
                          }
                          onChange={(e) =>
                            updateField(selectedField.id, {
                              properties: {
                                ...selectedField.properties,
                                backgroundColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFFormBuilder;
