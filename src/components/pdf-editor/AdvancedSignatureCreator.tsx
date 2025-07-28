import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/ui/file-upload";
import { RotateCcw } from "lucide-react";

interface AdvancedSignatureCreatorProps {
  type: "draw" | "type" | "upload" | "date" | "text";
  onComplete: (data: string, text?: string, saveAsTemplate?: boolean) => void;
  onCancel: () => void;
}

export const AdvancedSignatureCreator: React.FC<AdvancedSignatureCreatorProps> = ({
  type,
  onComplete,
  onCancel,
}) => {
  const [signatureText, setSignatureText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [selectedFont, setSelectedFont] = useState("serif");
  const [selectedStyle, setSelectedStyle] = useState("normal");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);

  const fonts = [
    { value: "serif", label: "Serif", family: "serif" },
    { value: "sans-serif", label: "Sans Serif", family: "sans-serif" },
    { value: "cursive", label: "Cursive", family: "cursive" },
    { value: "monospace", label: "Monospace", family: "monospace" },
  ];

  const styles = [
    { value: "normal", label: "Normal" },
    { value: "italic", label: "Italic" },
    { value: "bold", label: "Bold" },
    { value: "bold-italic", label: "Bold Italic" },
  ];

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.strokeStyle = strokeColor;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = () => {
    if (type === "draw") {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL();
        onComplete(dataURL, "", saveAsTemplate);
      }
    } else if (type === "type" && signatureText.trim()) {
      onComplete("", signatureText.trim(), saveAsTemplate);
    } else if (type === "upload" && uploadedImage) {
      onComplete(uploadedImage, "", saveAsTemplate);
    }
  };

  const canComplete = () => {
    if (type === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return imageData.data.some((channel) => channel !== 0);
    } else if (type === "type") {
      return signatureText.trim().length > 0;
    } else if (type === "upload") {
      return uploadedImage !== null;
    }
    return false;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {type === "draw" && "Draw Your Signature"}
            {type === "type" && "Create Typed Signature"}
            {type === "upload" && "Upload Signature Image"}
          </h2>
          <p className="text-gray-600 text-lg">
            {type === "draw" &&
              "Use your mouse or touch to draw your signature"}
            {type === "type" &&
              "Enter your name to create a professional typed signature"}
            {type === "upload" && "Upload an image file of your signature"}
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          {type === "draw" && (
            <div className="space-y-6">
              {/* Drawing controls */}
              <div className="flex items-center justify-center space-x-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Color:
                  </label>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Thickness:
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">{strokeWidth}px</span>
                </div>
                <Button variant="outline" onClick={clearCanvas}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>

              {/* Drawing canvas */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={250}
                  className="w-full border-2 border-gray-400 rounded-lg bg-white cursor-crosshair shadow-inner"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <p className="text-center text-sm text-gray-600 mt-3">
                  Draw your signature in the box above
                </p>
              </div>
            </div>
          )}

          {type === "type" && (
            <div className="space-y-6">
              {/* Typography controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    {fonts.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    {styles.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl"
                />
              </div>

              {/* Preview */}
              {signatureText && (
                <div className="bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Preview:
                  </p>
                  <div
                    className="text-center"
                    style={{
                      fontFamily: fonts.find((f) => f.value === selectedFont)
                        ?.family,
                      fontSize: "3rem",
                      fontWeight: selectedStyle.includes("bold")
                        ? "bold"
                        : "normal",
                      fontStyle: selectedStyle.includes("italic")
                        ? "italic"
                        : "normal",
                      color: "#1f2937",
                    }}
                  >
                    {signatureText}
                  </div>
                </div>
              )}
            </div>
          )}

          {type === "upload" && (
            <div className="space-y-6">
              <FileUpload
                onFilesSelect={handleImageUpload}
                accept="image/*"
                multiple={false}
                maxSize={5}
                allowedTypes={["image"]}
                uploadText="Upload signature image"
                supportText="PNG, JPG, SVG supported • Max 5MB • Transparent backgrounds work best"
              />
              {uploadedImage && (
                <div className="bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Preview:
                  </p>
                  <img
                    src={uploadedImage}
                    alt="Signature preview"
                    className="max-w-full h-auto max-h-48 mx-auto shadow-lg rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save as template option */}
        <div className="flex items-center justify-center mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Save as template for future use
            </span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={onCancel} className="px-8 py-3">
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!canComplete()}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700"
          >
            {saveAsTemplate ? "Save & Use Signature" : "Use This Signature"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSignatureCreator;
