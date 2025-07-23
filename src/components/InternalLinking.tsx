import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingUp,
  Star,
  Clock,
  Users,
  FileText,
  ImageIcon,
  Settings,
  Crown,
  Zap,
  Download,
  Layers,
  Scissors,
  RotateCw,
  Move,
  Minimize2,
  FileImage,
  Globe,
  Shield,
  Heart
} from "lucide-react";

interface RelatedTool {
  name: string;
  href: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  category: string;
  popular?: boolean;
  premium?: boolean;
  usage?: string;
}

interface InternalLinkingProps {
  currentTool: string;
  category?: "pdf" | "image" | "favicon" | "all";
  variant?: "grid" | "list" | "carousel" | "sidebar";
  maxItems?: number;
  showCategories?: boolean;
  showPopular?: boolean;
}

const InternalLinking = ({
  currentTool,
  category = "all",
  variant = "grid",
  maxItems = 6,
  showCategories = true,
  showPopular = true
}: InternalLinkingProps) => {

  const allTools: RelatedTool[] = [
    // PDF Tools
    {
      name: "PDF to Word",
      href: "/pdf-to-word",
      description: "Convert PDF to editable Word documents",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      category: "PDF Conversion",
      popular: true,
      usage: "2.1M monthly"
    },
    {
      name: "Merge PDF",
      href: "/merge-pdf",
      description: "Combine multiple PDF files into one",
      icon: Layers,
      color: "text-green-600",
      bgColor: "bg-green-50",
      category: "PDF Tools",
      popular: true,
      usage: "1.8M monthly"
    },
    {
      name: "Split PDF",
      href: "/split-pdf",
      description: "Extract pages from PDF documents",
      icon: Scissors,
      color: "text-red-600",
      bgColor: "bg-red-50",
      category: "PDF Tools",
      usage: "1.5M monthly"
    },
    {
      name: "Compress PDF",
      href: "/compress-pdf",
      description: "Reduce PDF file size without quality loss",
      icon: Minimize2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      category: "PDF Tools",
      popular: true,
      usage: "1.2M monthly"
    },
    
    // Image Tools
    {
      name: "Image Compressor",
      href: "/img/compress",
      description: "Reduce image size while maintaining quality",
      icon: Minimize2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      category: "Image Tools",
      popular: true,
      usage: "950K monthly"
    },
    {
      name: "Resize Image",
      href: "/img/resize",
      description: "Change image dimensions and resolution",
      icon: Move,
      color: "text-green-600",
      bgColor: "bg-green-50",
      category: "Image Tools",
      usage: "780K monthly"
    },
    {
      name: "Crop Image",
      href: "/img/crop",
      description: "Cut and trim images precisely",
      icon: Scissors,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      category: "Image Tools",
      usage: "650K monthly"
    },
    {
      name: "Remove Background",
      href: "/img/remove-bg",
      description: "AI-powered background removal",
      icon: Layers,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      category: "Image Tools",
      premium: true,
      usage: "520K monthly"
    },
    {
      name: "JPG to PNG",
      href: "/img/jpg-to-png",
      description: "Convert JPG images to PNG format",
      icon: FileImage,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      category: "Image Conversion",
      usage: "430K monthly"
    },
    {
      name: "PNG to JPG",
      href: "/img/png-to-jpg",
      description: "Convert PNG images to JPG format",
      icon: FileImage,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      category: "Image Conversion",
      usage: "380K monthly"
    },
    
    // Favicon Tools
    {
      name: "Favicon Generator",
      href: "/favicon/upload",
      description: "Create favicons from images",
      icon: Globe,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      category: "Favicon Tools",
      usage: "290K monthly"
    },
    {
      name: "Text to Favicon",
      href: "/favicon/text",
      description: "Generate favicons from text",
      icon: FileText,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      category: "Favicon Tools",
      usage: "180K monthly"
    },
    {
      name: "Emoji Favicon",
      href: "/favicon/emoji",
      description: "Create favicons from emojis",
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      category: "Favicon Tools",
      usage: "150K monthly"
    }
  ];

  // Filter tools based on category and current tool
  const getFilteredTools = () => {
    let filtered = allTools.filter(tool => 
      tool.href !== currentTool && // Exclude current tool
      (category === "all" || 
       (category === "pdf" && tool.category.includes("PDF")) ||
       (category === "image" && tool.category.includes("Image")) ||
       (category === "favicon" && tool.category.includes("Favicon")))
    );

    // Sort by popularity if requested
    if (showPopular) {
      filtered = filtered.sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return 0;
      });
    }

    return filtered.slice(0, maxItems);
  };

  const filteredTools = getFilteredTools();
  const categories = [...new Set(filteredTools.map(tool => tool.category))];

  if (variant === "sidebar") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Popular Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredTools.slice(0, 4).map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <Link
                  key={index}
                  to={tool.href}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-8 h-8 ${tool.bgColor} rounded-lg flex items-center justify-center`}>
                    <IconComponent className={`w-4 h-4 ${tool.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h4>
                    <p className="text-xs text-gray-500">{tool.usage}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Related Tools</span>
            <Badge variant="outline" className="text-xs">
              {filteredTools.length} tools
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <Link
                  key={index}
                  to={tool.href}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <div className={`w-12 h-12 ${tool.bgColor} rounded-lg flex items-center justify-center`}>
                    <IconComponent className={`w-6 h-6 ${tool.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {tool.name}
                      </h4>
                      {tool.popular && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                      {tool.premium && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{tool.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{tool.usage}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid variant (default)
  return (
    <div className="space-y-6">
      {showCategories && categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool, index) => {
          const IconComponent = tool.icon;
          return (
            <Link
              key={index}
              to={tool.href}
              className="group block"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 ${tool.bgColor} rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 ${tool.color}`} />
                    </div>
                    <div className="flex gap-1">
                      {tool.popular && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          <Star className="w-3 h-3" />
                        </Badge>
                      )}
                      {tool.premium && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          <Crown className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {tool.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      {tool.usage}
                    </div>
                    <div className="flex items-center text-blue-600 text-sm group-hover:translate-x-1 transition-transform">
                      <span className="mr-1">Try it</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="text-center">
        <Link to="/available-tools">
          <Button variant="outline" className="group">
            <span>View All Tools</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default InternalLinking;
