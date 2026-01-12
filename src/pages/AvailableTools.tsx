import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Merge,
  Scissors,
  Archive,
  RotateCw,
  Shield,
  Unlock,
  FileText,
  Image,
  Zap,
  Crown,
  Camera,
  Presentation,
  FileSpreadsheet,
  Type,
  Code,
  Globe,
  Edit3,
  Palette,
  Star,
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  FileX,
  Split,
  FileImage,
  Download,
  Upload,
  ArrowLeft,
  Home,
  ChevronRight,
} from "lucide-react";

// Real PDF tools with actual routes and descriptions
const pdfTools = [
  {
    id: "merge",
    name: "Merge PDF",
    description: "Combine multiple PDF files into a single document",
    icon: Merge,
    route: "/merge",
    gradient: "from-blue-500 to-blue-600",
    category: "Essential",
    features: [
      "Drag & drop ordering",
      "Page range selection",
      "Instant preview",
    ],
    popular: true,
  },
  {
    id: "split",
    name: "Split PDF",
    description: "Split PDF into separate files or extract specific pages",
    icon: Scissors,
    route: "/split",
    gradient: "from-purple-500 to-purple-600",
    category: "Essential",
    features: ["Page ranges", "Single pages", "Custom split"],
    popular: true,
  },
  {
    id: "compress",
    name: "Compress PDF",
    description: "Reduce PDF file size while maintaining quality",
    icon: Archive,
    route: "/compress",
    gradient: "from-green-500 to-green-600",
    category: "Essential",
    features: [
      "Multiple compression levels",
      "Quality preservation",
      "Up to 85% reduction",
    ],
    popular: true,
  },
  {
    id: "protect",
    name: "Protect PDF",
    description: "Add password protection and encryption to PDF files",
    icon: Shield,
    route: "/protect",
    gradient: "from-red-500 to-red-600",
    category: "Security",
    features: ["Password protection", "Encryption", "Permission settings"],
    popular: false,
  },
  {
    id: "unlock",
    name: "Unlock PDF",
    description: "Remove password protection from PDF files",
    icon: Unlock,
    route: "/unlock",
    gradient: "from-orange-500 to-orange-600",
    category: "Security",
    features: ["Remove passwords", "Decrypt files", "Secure processing"],
    popular: false,
  },
  {
    id: "rotate",
    name: "Rotate PDF",
    description: "Rotate PDF pages to correct orientation",
    icon: RotateCw,
    route: "/rotate",
    gradient: "from-teal-500 to-teal-600",
    category: "Essential",
    features: ["90° rotation", "Individual pages", "Bulk rotation"],
    popular: false,
  },
  {
    id: "pdf-editor",
    name: "PDF Editor",
    description: "Advanced PDF editing with real-time collaboration",
    icon: Edit3,
    route: "/pdf-editor",
    gradient: "from-indigo-500 to-indigo-600",
    category: "Advanced",
    features: ["Text editing", "Annotations", "Digital signatures"],
    popular: true,
  },
];

// Real conversion tools
const conversionTools = [
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    description: "Convert PDF to editable Word documents",
    icon: FileText,
    route: "/pdf-to-word",
    gradient: "from-blue-600 to-blue-700",
    category: "Convert from PDF",
  },
  {
    id: "pdf-to-excel",
    name: "PDF to Excel",
    description: "Convert PDF to Excel spreadsheets",
    icon: FileSpreadsheet,
    route: "/pdf-to-excel",
    gradient: "from-green-600 to-green-700",
    category: "Convert from PDF",
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    description: "Convert PDF pages to JPG images",
    icon: Camera,
    route: "/pdf-to-jpg",
    gradient: "from-purple-600 to-purple-700",
    category: "Convert from PDF",
  },
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    description: "Convert Word documents to PDF",
    icon: FileText,
    route: "/word-to-pdf",
    gradient: "from-blue-500 to-blue-600",
    category: "Convert to PDF",
  },
  {
    id: "excel-to-pdf",
    name: "Excel to PDF",
    description: "Convert Excel spreadsheets to PDF",
    icon: FileSpreadsheet,
    route: "/excel-to-pdf",
    gradient: "from-green-500 to-green-600",
    category: "Convert to PDF",
  },
  {
    id: "ppt-to-pdf",
    name: "PowerPoint to PDF",
    description: "Convert PowerPoint presentations to PDF",
    icon: Presentation,
    route: "/ppt-to-pdf",
    gradient: "from-orange-500 to-orange-600",
    category: "Convert to PDF",
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    description: "Convert JPG images to PDF",
    icon: Camera,
    route: "/jpg-to-pdf",
    gradient: "from-purple-500 to-purple-600",
    category: "Convert to PDF",
  },
];

// Image tools
const imageTools = [
  {
    id: "img-tools",
    name: "Image Tools",
    description: "Comprehensive image editing and conversion tools",
    icon: Image,
    route: "/img",
    gradient: "from-pink-500 to-pink-600",
    category: "Image",
    features: ["Format conversion", "Resize & crop", "Filters & effects"],
  },
  {
    id: "favicon",
    name: "Favicon Generator",
    description: "Create favicons from images for your website",
    icon: Star,
    route: "/favicon",
    gradient: "from-yellow-500 to-yellow-600",
    category: "Design",
    features: ["Multiple sizes", "ICO format", "PNG support"],
  },
];

const allTools = [...pdfTools, ...conversionTools, ...imageTools];

const AvailableTools = () => {
  const categories = [
    "All",
    "Essential",
    "Convert from PDF",
    "Convert to PDF",
    "Security",
    "Advanced",
    "Image",
    "Design",
  ];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTools =
    selectedCategory === "All"
      ? allTools
      : allTools.filter((tool) => tool.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header />

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link
            to="/"
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-1" />
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-blue-600 font-medium">All Tools</span>
        </nav>
      </div>

      {/* Page Navigation */}
      <div className="container mx-auto px-6 mb-8">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    All PDF Tools
                  </h2>
                  <p className="text-sm text-gray-600">
                    Complete professional PDF toolkit
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <Link to="/img">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Image Tools
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
              </div>
            </div>

            {/* Quick Tool Access */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Most Popular Tools
              </h3>
              <div className="flex flex-wrap gap-2">
                <Link to="/merge">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <Merge className="w-3 h-3 mr-1" />
                    Merge PDF
                  </Badge>
                </Link>
                <Link to="/split">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <Scissors className="w-3 h-3 mr-1" />
                    Split PDF
                  </Badge>
                </Link>
                <Link to="/compress">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <Archive className="w-3 h-3 mr-1" />
                    Compress PDF
                  </Badge>
                </Link>
                <Link to="/pdf-to-word">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    PDF to Word
                  </Badge>
                </Link>
                <Link to="/word-to-pdf">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Word to PDF
                  </Badge>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 py-24">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle className="w-4 h-4" />
              {allTools.length} Professional PDF Tools Available
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Complete PDF Toolkit
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Professional PDF processing tools with real-time preview,
              high-quality output, and enterprise-grade security. All tools are
              fully functional and ready to use.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/merge">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-white/90 shadow-lg"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Try PDF Merger
                </Button>
              </Link>
              <Link to="/compress">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  <Archive className="w-5 h-5 mr-2" />
                  Compress PDF
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {allTools.length}
            </div>
            <div className="text-gray-600">Total Tools</div>
          </Card>
          <Card className="text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
            <div className="text-gray-600">Functional</div>
          </Card>
          <Card className="text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="text-3xl font-bold text-purple-600 mb-2">2.3s</div>
            <div className="text-gray-600">Avg Speed</div>
          </Card>
          <Card className="text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="text-3xl font-bold text-orange-600 mb-2">100MB</div>
            <div className="text-gray-600">Max File Size</div>
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
              className={selectedCategory === category ? "bg-blue-600" : ""}
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
                    {tool.features && (
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
                    )}

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
              Why Choose PdfPage Tools?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional-grade PDF processing with enterprise security and
              lightning-fast performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                Process files in seconds with our optimized algorithms and cloud
                infrastructure.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Your files are encrypted in transit and automatically deleted
                after processing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Professional Quality
              </h3>
              <p className="text-gray-600">
                Enterprise-grade tools used by professionals worldwide for
                high-quality results.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/pricing">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Crown className="w-5 h-5 mr-2" />
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
            <h2 className="text-3xl font-bold mb-4">
              Explore Specialized Tools
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Discover our specialized tool collections for different use cases
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image Tools */}
            <Link to="/img" className="group">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Image className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Image Tools</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Professional image editing, compression, and format
                    conversion tools
                  </p>
                  <div className="flex items-center justify-center text-purple-400 group-hover:text-purple-300">
                    <span className="text-sm font-medium mr-2">
                      Explore Image Tools
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

            {/* Home */}
            <Link to="/" className="group">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Homepage</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Return to homepage and discover featured tools and quick
                    access
                  </p>
                  <div className="flex items-center justify-center text-green-400 group-hover:text-green-300">
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
              <h3 className="text-lg font-semibold mb-4">
                Essential PDF Tools
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/merge">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Merge className="w-3 h-3 mr-1" />
                    Merge PDF
                  </Button>
                </Link>
                <Link to="/split">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Scissors className="w-3 h-3 mr-1" />
                    Split PDF
                  </Button>
                </Link>
                <Link to="/compress">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Archive className="w-3 h-3 mr-1" />
                    Compress PDF
                  </Button>
                </Link>
                <Link to="/pdf-to-word">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    PDF to Word
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-300 hover:bg-yellow-900/20"
                  >
                    <Crown className="w-3 h-3 mr-1" />
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

export default AvailableTools;
