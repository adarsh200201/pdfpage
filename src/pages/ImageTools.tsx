import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Image,
  Camera,
  Palette,
  Scissors,
  RotateCw,
  Maximize2,
  Minimize2,
  Crop,
  Filter,
  Download,
  Upload,
  Zap,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  FileImage,
  ImageIcon,
  Layers,
  Eye,
  Settings,
  MonitorSpeaker,
  Smartphone,
  Globe,
  Shield,
  ArrowLeft,
  Home,
  Grid3X3,
  ChevronRight,
} from "lucide-react";

const imageTools = [
  {
    id: "resize-image",
    name: "Resize Image",
    description:
      "Resize images to specific dimensions while maintaining quality",
    icon: Maximize2,
    route: "/resize-image",
    gradient: "from-blue-500 to-blue-600",
    category: "Basic",
    features: [
      "Custom dimensions",
      "Aspect ratio lock",
      "Batch processing",
      "Quality preservation",
    ],
    popular: true,
  },
  {
    id: "crop-image",
    name: "Crop Image",
    description:
      "Crop images to focus on specific areas or remove unwanted parts",
    icon: Crop,
    route: "/crop-image",
    gradient: "from-green-500 to-green-600",
    category: "Basic",
    features: [
      "Free crop",
      "Aspect ratios",
      "Precise selection",
      "Preview mode",
    ],
    popular: true,
  },
  {
    id: "compress-image",
    name: "Compress Image",
    description: "Reduce image file size without losing visual quality",
    icon: Minimize2,
    route: "/compress-image",
    gradient: "from-purple-500 to-purple-600",
    category: "Optimization",
    features: [
      "Smart compression",
      "Quality settings",
      "Batch compress",
      "Format optimization",
    ],
    popular: true,
  },
  {
    id: "rotate-image",
    name: "Rotate Image",
    description: "Rotate images by any angle or flip horizontally/vertically",
    icon: RotateCw,
    route: "/rotate-image",
    gradient: "from-teal-500 to-teal-600",
    category: "Basic",
    features: [
      "Any angle rotation",
      "Flip horizontal/vertical",
      "Auto-straighten",
      "Background fill",
    ],
    popular: false,
  },
  {
    id: "image-filters",
    name: "Image Filters",
    description:
      "Apply professional filters and effects to enhance your images",
    icon: Filter,
    route: "/image-filters",
    gradient: "from-pink-500 to-pink-600",
    category: "Enhancement",
    features: [
      "Professional filters",
      "Color adjustments",
      "Artistic effects",
      "Real-time preview",
    ],
    popular: false,
  },
  {
    id: "background-remover",
    name: "Background Remover",
    description: "Remove backgrounds from images using AI technology",
    icon: Layers,
    route: "/background-remover",
    gradient: "from-indigo-500 to-indigo-600",
    category: "AI Tools",
    features: [
      "AI-powered removal",
      "Edge detection",
      "Transparent background",
      "High precision",
    ],
    popular: true,
  },
  {
    id: "image-enhancer",
    name: "Image Enhancer",
    description: "Enhance image quality using advanced AI algorithms",
    icon: Sparkles,
    route: "/image-enhancer",
    gradient: "from-yellow-500 to-yellow-600",
    category: "AI Tools",
    features: [
      "AI upscaling",
      "Noise reduction",
      "Detail enhancement",
      "Color correction",
    ],
    popular: false,
  },
  {
    id: "favicon-generator",
    name: "Favicon Generator",
    description: "Create favicons for websites from any image",
    icon: Star,
    route: "/favicon",
    gradient: "from-amber-500 to-amber-600",
    category: "Web Tools",
    features: [
      "Multiple sizes",
      "ICO format",
      "PNG support",
      "Browser compatibility",
    ],
    popular: true,
  },
  {
    id: "image-to-pdf",
    name: "Image to PDF",
    description: "Convert images to PDF documents with custom layouts",
    icon: FileImage,
    route: "/jpg-to-pdf",
    gradient: "from-cyan-500 to-cyan-600",
    category: "Conversion",
    features: [
      "Multiple images",
      "Custom layouts",
      "Page sizing",
      "Quality control",
    ],
    popular: false,
  },
  {
    id: "photo-editor",
    name: "Photo Editor",
    description: "Comprehensive photo editing with professional tools",
    icon: Camera,
    route: "/photo-editor",
    gradient: "from-violet-500 to-violet-600",
    category: "Professional",
    features: [
      "Layer support",
      "Advanced tools",
      "Adjustment layers",
      "Export options",
    ],
    popular: false,
  },
];

const conversionFormats = [
  { from: "JPG", to: "PNG", route: "/jpg-to-png" },
  { from: "PNG", to: "JPG", route: "/png-to-jpg" },
  { from: "WebP", to: "PNG", route: "/webp-to-png" },
  { from: "PNG", to: "WebP", route: "/png-to-webp" },
  { from: "HEIC", to: "JPG", route: "/heic-to-jpg" },
  { from: "HEIC", to: "PNG", route: "/heic-to-png" },
];

const ImageTools = () => {
  const categories = [
    "All",
    "Basic",
    "Conversion",
    "Optimization",
    "Enhancement",
    "AI Tools",
    "Protection",
    "Web Tools",
    "Professional",
  ];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTools =
    selectedCategory === "All"
      ? imageTools
      : imageTools.filter((tool) => tool.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      <Header />

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link
            to="/"
            className="flex items-center hover:text-purple-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-1" />
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            to="/available-tools"
            className="hover:text-purple-600 transition-colors"
          >
            All Tools
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-purple-600 font-medium">Image Tools</span>
        </nav>
      </div>

      {/* Page Navigation */}
      <div className="container mx-auto px-6 mb-8">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Image className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Image Tools
                  </h2>
                  <p className="text-sm text-gray-600">
                    Professional image processing tools
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/available-tools">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    All Tools
                  </Button>
                </Link>
                <Link to="/favicon">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Favicon Tools
                  </Button>
                </Link>
                <Link to="/">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    PDF Tools
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Tool Access */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quick Access
              </h3>
              <div className="flex flex-wrap gap-2">
                <Link to="/resize-image">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-purple-100 transition-colors"
                  >
                    <Maximize2 className="w-3 h-3 mr-1" />
                    Resize
                  </Badge>
                </Link>
                <Link to="/compress-image">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-purple-100 transition-colors"
                  >
                    <Minimize2 className="w-3 h-3 mr-1" />
                    Compress
                  </Badge>
                </Link>
                <Link to="/crop-image">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-purple-100 transition-colors"
                  >
                    <Crop className="w-3 h-3 mr-1" />
                    Crop
                  </Badge>
                </Link>
                <Link to="/convert-image-format">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-purple-100 transition-colors"
                  >
                    <FileImage className="w-3 h-3 mr-1" />
                    Convert
                  </Badge>
                </Link>
                <Link to="/background-remover">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-purple-100 transition-colors"
                  >
                    <Layers className="w-3 h-3 mr-1" />
                    Remove BG
                  </Badge>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 py-24">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Image className="w-4 h-4" />
              {imageTools.length} Professional Image Tools
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Image Processing Studio
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Professional image editing, conversion, and optimization tools.
              From basic editing to AI-powered enhancements, everything you need
              for image processing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/resize-image">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-white/90 shadow-lg"
                >
                  <Image className="w-5 h-5 mr-2" />
                  Resize Image
                </Button>
              </Link>
              <Link to="/compress-image">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  <Minimize2 className="w-5 h-5 mr-2" />
                  Compress Image
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Format Conversion */}
      <div className="container mx-auto px-6 -mt-12 relative z-10 mb-12">
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
              Quick Format Conversion
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {conversionFormats.map((format, index) => (
                <Link
                  key={index}
                  to={format.route}
                  className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                >
                  <div className="text-sm font-medium text-gray-600 group-hover:text-purple-600">
                    {format.from}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 my-2 group-hover:text-purple-500" />
                  <div className="text-sm font-medium text-gray-600 group-hover:text-purple-600">
                    {format.to}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {imageTools.length}
            </div>
            <div className="text-gray-600 text-sm">Image Tools</div>
          </Card>
          <Card className="text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="text-3xl font-bold text-pink-600 mb-2">50+</div>
            <div className="text-gray-600 text-sm">Formats Supported</div>
          </Card>
          <Card className="text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="text-3xl font-bold text-orange-600 mb-2">AI</div>
            <div className="text-gray-600 text-sm">Powered Tools</div>
          </Card>
          <Card className="text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="text-3xl font-bold text-green-600 mb-2">100MB</div>
            <div className="text-gray-600 text-sm">Max File Size</div>
          </Card>
        </div>
      </div>

      {/* Category Filter */}
      <div className="container mx-auto px-6 mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "bg-purple-600 hover:bg-purple-700"
                  : ""
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="container mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.id}
                className="group border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Tool Header */}
                  <div
                    className={`bg-gradient-to-r ${tool.gradient} p-6 text-white relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative flex items-center justify-between">
                      <Icon className="w-8 h-8" />
                      {tool.popular && (
                        <Badge className="bg-yellow-500 text-yellow-900 border-0">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mt-4 mb-2">{tool.name}</h3>
                    <p className="text-white/90 text-sm">{tool.description}</p>
                  </div>

                  {/* Tool Content */}
                  <div className="p-6">
                    {/* Category Badge */}
                    <Badge variant="outline" className="mb-4 text-xs">
                      {tool.category}
                    </Badge>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {tool.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Link to={tool.route} className="block">
                      <Button
                        className={`w-full bg-gradient-to-r ${tool.gradient} hover:opacity-90 text-white group-hover:shadow-lg transition-all`}
                      >
                        <span>Launch Tool</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Image Tools?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional-grade image processing with cutting-edge AI
              technology and lightning-fast performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI-Powered
              </h3>
              <p className="text-gray-600">
                Advanced AI algorithms for background removal, enhancement, and
                smart processing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ultra Fast
              </h3>
              <p className="text-gray-600">
                Process images in seconds with optimized algorithms and cloud
                infrastructure.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                High Quality
              </h3>
              <p className="text-gray-600">
                Professional results with lossless processing and quality
                preservation.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/available-tools">
              <Button
                size="lg"
                variant="outline"
                className="mr-4 border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                View All Tools
              </Button>
            </Link>
            <Link to="/pricing">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                <Star className="w-5 h-5 mr-2" />
                Get Premium Access
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Related Pages Navigation */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Explore More Tools</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Discover our complete suite of professional tools for all your
              digital needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PDF Tools */}
            <Link to="/available-tools" className="group">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileImage className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">PDF Tools</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Complete PDF processing suite with merge, split, compress,
                    and convert tools
                  </p>
                  <div className="flex items-center justify-center text-red-400 group-hover:text-red-300">
                    <span className="text-sm font-medium mr-2">
                      Explore PDF Tools
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Favicon Tools */}
            <Link to="/favicon" className="group">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Favicon Generator</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Create professional favicons from images, text, emojis, and
                    logos
                  </p>
                  <div className="flex items-center justify-center text-yellow-400 group-hover:text-yellow-300">
                    <span className="text-sm font-medium mr-2">
                      Create Favicons
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* All Tools */}
            <Link to="/" className="group">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Home</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Return to homepage and discover all available tools and
                    features
                  </p>
                  <div className="flex items-center justify-center text-blue-400 group-hover:text-blue-300">
                    <span className="text-sm font-medium mr-2">Go Home</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Quick Navigation</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/merge">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Merge PDF
                  </Button>
                </Link>
                <Link to="/compress">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Compress PDF
                  </Button>
                </Link>
                <Link to="/split">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Split PDF
                  </Button>
                </Link>
                <Link to="/favicon/image-to-favicon">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Image to Favicon
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-300 hover:bg-yellow-900/20"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Get Premium
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageTools;
