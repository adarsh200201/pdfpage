import { useState } from "react";
import { Link } from "react-router-dom";
import ImgHeader from "@/components/layout/ImgHeader";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Download,
  ImageIcon,
  FileImage,
  CheckCircle,
  Loader2,
  ArrowRight,
  Minimize2,
  Palette,
} from "lucide-react";
import { imageService } from "@/services/imageService";
import { useToast } from "@/hooks/use-toast";

interface ProcessedImage {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  preview: string;
}

const ImgPngToJpg = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState([0.9]);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [convertedImages, setConvertedImages] = useState<
    { original: ProcessedImage; converted: File; preview: string }[]
  >([]);

  const { toast } = useToast();

  const handleFilesSelect = async (files: File[]) => {
    const validImages: ProcessedImage[] = [];

    for (const file of files) {
      if (!imageService.isValidImageFile(file)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image file`,
          variant: "destructive",
        });
        continue;
      }

      // Check if it's PNG
      if (!file.type.includes("png")) {
        toast({
          title: "Wrong format",
          description: `${file.name} is not a PNG file`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const info = await imageService.getImageInfo(file);
        const preview = URL.createObjectURL(file);

        validImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          width: info.width,
          height: info.height,
          preview,
        });
      } catch (error) {
        toast({
          title: "Error loading image",
          description: `Failed to load ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setImages(validImages);
    setConvertedImages([]);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    const converted: {
      original: ProcessedImage;
      converted: File;
      preview: string;
    }[] = [];

    try {
      for (const image of images) {
        // Create canvas to add background color
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Fill with background color
            ctx!.fillStyle = backgroundColor;
            ctx?.fillRect(0, 0, canvas.width, canvas.height);

            // Draw PNG on top
            ctx?.drawImage(img, 0, 0);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const fileName = image.name.replace(/\.png$/i, ".jpg");
                  const convertedFile = new File([blob], fileName, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });

                  const preview = URL.createObjectURL(convertedFile);
                  converted.push({
                    original: image,
                    converted: convertedFile,
                    preview,
                  });
                  resolve();
                } else {
                  reject(new Error("Failed to convert"));
                }
              },
              "image/jpeg",
              quality[0],
            );
          };

          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = URL.createObjectURL(image.file);
        });
      }

      setConvertedImages(converted);

      toast({
        title: "Conversion completed!",
        description: `Successfully converted ${converted.length} image(s) to JPG`,
      });
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: "Failed to convert some images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (convertedImage: {
    original: ProcessedImage;
    converted: File;
    preview: string;
  }) => {
    const url = URL.createObjectURL(convertedImage.converted);
    const link = document.createElement("a");
    link.href = url;
    link.download = convertedImage.converted.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    convertedImages.forEach((convertedImage) => {
      setTimeout(() => handleDownload(convertedImage), 100);
    });
  };

  const resetState = () => {
    setImages([]);
    setConvertedImages([]);
    setQuality([0.9]);
    setBackgroundColor("#ffffff");
  };

  const presetColors = [
    { name: "White", value: "#ffffff" },
    { name: "Black", value: "#000000" },
    { name: "Gray", value: "#808080" },
    { name: "Red", value: "#ff0000" },
    { name: "Blue", value: "#0000ff" },
    { name: "Green", value: "#00ff00" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ImgHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/img"
            className="flex items-center text-yellow-600 hover:text-yellow-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to PdfPage
          </Link>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {images.length === 0 ? (
            <div className="space-y-8">
              {/* Mobile-First Upload Section - Priority */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-yellow-600" />
                    Upload PNG Images
                  </CardTitle>
                  <CardDescription>
                    Select PNG files to convert to JPG (max 50MB each)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onFilesSelect={handleFilesSelect}
                    acceptedFileTypes={{
                      "image/png": [".png"],
                    }}
                    maxFiles={10}
                    maxSize={50}
                    multiple={true}
                    uploadText="Select PNG files or drop PNG files here"
                    supportText="Supports PNG format"
                  />
                </CardContent>
              </Card>

              {/* Tool Description */}
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4 rounded-2xl w-fit mx-auto mb-4">
                  <FileImage className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  PNG to JPG Converter
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Convert your PNG images to JPG format with custom background
                  colors and quality settings. Perfect for reducing file sizes.
                </p>
              </div>

              {/* Features */}
              <Card>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4">
                      <Minimize2 className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">
                        Smaller Files
                      </h3>
                      <p className="text-gray-600 text-sm">
                        JPG files are typically much smaller than PNG
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <Palette className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">
                        Custom Background
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Choose background color for transparent areas
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">
                        Quality Control
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Adjust compression quality to balance size and quality
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Conversion Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quality Setting */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      JPG Quality: {Math.round(quality[0] * 100)}%
                    </label>
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Higher quality = larger file size
                    </p>
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color (for transparent areas)
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-12 h-12 rounded border"
                      />
                      <div className="flex flex-wrap gap-2">
                        {presetColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setBackgroundColor(color.value)}
                            className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500"
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Original Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    PNG Images ({images.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="text-center">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <p className="text-sm text-gray-600 mt-2 truncate">
                          {image.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {imageService.formatFileSize(image.size)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Arrow */}
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-3 rounded-full">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Converted Images */}
              {convertedImages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      JPG Images ({convertedImages.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {convertedImages.map((convertedImage, index) => (
                        <div key={index} className="text-center">
                          <img
                            src={convertedImage.preview}
                            alt={convertedImage.converted.name}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <p className="text-sm text-gray-600 mt-2 truncate">
                            {convertedImage.converted.name}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            {imageService.formatFileSize(
                              convertedImage.converted.size,
                            )}{" "}
                            (
                            {(
                              (convertedImage.converted.size /
                                convertedImage.original.size) *
                              100
                            ).toFixed(0)}
                            % of original)
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(convertedImage)}
                            className="w-full"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>

                    {convertedImages.length > 1 && (
                      <div className="mt-6 text-center">
                        <Button onClick={handleDownloadAll} size="lg">
                          <Download className="w-4 h-4 mr-2" />
                          Download All JPG Files
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                {convertedImages.length === 0 ? (
                  <Button
                    onClick={handleConvert}
                    disabled={isProcessing || images.length === 0}
                    className="flex-1"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting to JPG...
                      </>
                    ) : (
                      <>
                        <FileImage className="w-4 h-4 mr-2" />
                        Convert to JPG
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleDownloadAll}
                    className="flex-1"
                    size="lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All JPG Files
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={resetState}
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  Convert More Images
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImgPngToJpg;
