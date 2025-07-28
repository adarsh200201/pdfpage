import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  PenTool, 
  Type, 
  Image as ImageIcon, 
  Star,
  Plus,
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureTemplate {
  id: string;
  name: string;
  type: "draw" | "type" | "upload";
  data: string;
  text?: string;
  preview: string;
}

interface TemplateLibraryProps {
  templates: SignatureTemplate[];
  onSelect: (template: SignatureTemplate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  onSelect,
  onDelete,
  onClose,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "draw":
        return <PenTool className="w-4 h-4" />;
      case "type":
        return <Type className="w-4 h-4" />;
      case "upload":
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "draw":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "type":
        return "bg-green-100 text-green-700 border-green-200";
      case "upload":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Signature Templates
            </h2>
            <p className="text-gray-600 text-lg">
              Choose from your saved signature templates or create a new one
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Templates Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first signature template to reuse it across multiple documents. 
              Templates are saved locally on your device.
            </p>
            <Button onClick={onClose} className="bg-gradient-to-r from-blue-600 to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group relative border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => onSelect(template)}
              >
                {/* Template type badge */}
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getTypeColor(template.type))}
                  >
                    {getTypeIcon(template.type)}
                    <span className="ml-1 capitalize">{template.type}</span>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(template.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Template preview */}
                <div className="mb-4 h-24 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  {template.type === "type" ? (
                    <div
                      className="text-2xl font-semibold text-gray-800 text-center"
                      style={{
                        fontFamily: "serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}
                    >
                      {template.text || template.name}
                    </div>
                  ) : template.type === "upload" || template.type === "draw" ? (
                    <img
                      src={template.data}
                      alt={template.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-500 text-sm">Preview</div>
                  )}
                </div>

                {/* Template name */}
                <h3 className="font-semibold text-gray-900 mb-2 truncate">
                  {template.name}
                </h3>

                {/* Use button */}
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(template);
                  }}
                >
                  Use This Template
                </Button>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-blue-500 bg-opacity-5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {templates.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {templates.length} saved template{templates.length !== 1 ? 's' : ''}
              </div>
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white border-none hover:from-green-700 hover:to-green-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Template
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary;
