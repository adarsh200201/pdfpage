import React, { useRef, useState, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Pen,
  Type,
  Upload,
  RotateCcw,
  Download,
  Palette,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedSignatureProps {
  onSignature: (
    signatureData: string,
    signatureType: "draw" | "type" | "upload",
  ) => void;
  onClose: () => void;
  className?: string;
}

const EnhancedSignature: React.FC<EnhancedSignatureProps> = ({
  onSignature,
  onClose,
  className,
}) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"draw" | "type" | "upload">(
    "draw",
  );
  const [typedSignature, setTypedSignature] = useState("");
  const [signatureStyle, setSignatureStyle] = useState({
    strokeWidth: 2,
    color: "#000000",
    backgroundColor: "transparent",
    fontFamily: "Dancing Script",
    fontSize: 32,
  });

  const fontOptions = [
    "Dancing Script",
    "Great Vibes",
    "Allura",
    "Pacifico",
    "Satisfy",
    "Kaushan Script",
    "Amatic SC",
    "Caveat",
  ];

  const handleClear = useCallback(() => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  }, []);

  const handleSaveDrawn = useCallback(() => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataURL = signatureRef.current.getTrimmedCanvas().toDataURL();
      onSignature(dataURL, "draw");
    }
  }, [onSignature]);

  const handleSaveTyped = useCallback(() => {
    if (typedSignature.trim()) {
      // Create canvas for typed signature
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 400;
      canvas.height = 100;

      // Set font and style
      ctx.font = `${signatureStyle.fontSize}px "${signatureStyle.fontFamily}"`;
      ctx.fillStyle = signatureStyle.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Draw text
      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

      const dataURL = canvas.toDataURL();
      onSignature(dataURL, "type");
    }
  }, [typedSignature, signatureStyle, onSignature]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          onSignature(result, "upload");
        };
        reader.readAsDataURL(file);
      }
    },
    [onSignature],
  );

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="w-5 h-5" />
          Create Signature
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <Pen className="w-4 h-4" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <Label>Pen Width:</Label>
                  <Slider
                    value={[signatureStyle.strokeWidth]}
                    onValueChange={(value) =>
                      setSignatureStyle((prev) => ({
                        ...prev,
                        strokeWidth: value[0],
                      }))
                    }
                    max={10}
                    min={1}
                    step={0.5}
                    className="w-20"
                  />
                  <span className="text-sm">
                    {signatureStyle.strokeWidth}px
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <Label>Color:</Label>
                  <ColorPicker
                    color={signatureStyle.color}
                    onChange={(color) =>
                      setSignatureStyle((prev) => ({ ...prev, color }))
                    }
                  />
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 500,
                    height: 200,
                    className: "signature-canvas border rounded",
                  }}
                  penColor={signatureStyle.color}
                  dotSize={signatureStyle.strokeWidth}
                  minWidth={signatureStyle.strokeWidth}
                  maxWidth={signatureStyle.strokeWidth}
                  backgroundColor={signatureStyle.backgroundColor}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleClear} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={handleSaveDrawn} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Use Signature
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="font-family">Font Style</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={signatureStyle.fontFamily}
                    onChange={(e) =>
                      setSignatureStyle((prev) => ({
                        ...prev,
                        fontFamily: e.target.value,
                      }))
                    }
                  >
                    {fontOptions.map((font) => (
                      <option
                        key={font}
                        value={font}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="font-size">
                    Size: {signatureStyle.fontSize}px
                  </Label>
                  <Slider
                    value={[signatureStyle.fontSize]}
                    onValueChange={(value) =>
                      setSignatureStyle((prev) => ({
                        ...prev,
                        fontSize: value[0],
                      }))
                    }
                    max={60}
                    min={16}
                    step={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="signature-text">Your Signature</Label>
                <Input
                  id="signature-text"
                  placeholder="Type your signature here..."
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  style={{
                    fontFamily: signatureStyle.fontFamily,
                    fontSize: `${Math.min(signatureStyle.fontSize, 24)}px`,
                    color: signatureStyle.color,
                  }}
                />
              </div>

              {typedSignature && (
                <div className="border rounded p-4 bg-gray-50">
                  <Label>Preview:</Label>
                  <div
                    className="text-center py-4"
                    style={{
                      fontFamily: signatureStyle.fontFamily,
                      fontSize: `${signatureStyle.fontSize}px`,
                      color: signatureStyle.color,
                    }}
                  >
                    {typedSignature}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSaveTyped}
                disabled={!typedSignature.trim()}
              >
                <Download className="w-4 h-4 mr-2" />
                Use Signature
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Upload Signature Image
              </h3>
              <p className="text-gray-600 mb-4">
                Choose a clear image of your signature (PNG, JPG, or GIF)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedSignature;
