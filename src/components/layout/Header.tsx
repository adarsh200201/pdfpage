import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Globe,
  User,
  Crown,
  Combine,
  Scissors,
  Minimize,
  FileText,
  FileImage,
  Shield,
  ChevronDown,
  LogOut,
  Settings,
  CreditCard,
  Image,
  PenTool,
  Code,
  Zap,
  Building,
  Monitor,
  Smartphone,
  DollarSign,
  HelpCircle,
  Info,
  Star,
  RotateCw,
  Grid3X3,
  Unlock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showAllToolsMenu, setShowAllToolsMenu] = useState(false);
  const location = useLocation();

  const { user, isAuthenticated, logout } = useAuth();
  const { currentLanguage, setLanguage, languages } = useLanguage();

  // Determine if current page is image-related
  const isImagePage = location.pathname.startsWith("/img");

  const navItems = [
    { label: "PDF Tools", href: "/merge", type: "dropdown" },
    { label: "Image Tools", href: "/img", type: "dropdown" },
    { label: "Favicon Tools", href: "/favicon", type: "dropdown" },
    { label: "All Tools", href: "/tools", type: "mega" },
  ];

  // PDF Tools
  const pdfTools = [
    {
      title: "Merge PDF",
      href: "/merge",
      icon: Combine,
      color: "from-blue-500 to-blue-600",
      description: "Combine multiple PDFs into one",
    },
    {
      title: "Split PDF",
      href: "/split",
      icon: Scissors,
      color: "from-green-500 to-green-600",
      description: "Extract pages from PDF",
    },
    {
      title: "Compress PDF",
      href: "/compress",
      icon: Minimize,
      color: "from-purple-500 to-purple-600",
      description: "Reduce PDF file size",
    },
    {
      title: "Edit PDF",
      href: "/edit-pdf",
      icon: PenTool,
      color: "from-indigo-500 to-indigo-600",
      description: "Edit PDF content",
    },
    {
      title: "Sign PDF",
      href: "/sign-pdf",
      icon: PenTool,
      color: "from-orange-500 to-orange-600",
      description: "Add digital signatures",
    },
    {
      title: "Watermark PDF",
      href: "/watermark",
      icon: Scissors,
      color: "from-cyan-500 to-cyan-600",
      description: "Add watermarks",
    },
    {
      title: "Protect PDF",
      href: "/protect-pdf",
      icon: Shield,
      color: "from-green-500 to-green-600",
      description: "Password protect PDF",
    },
    {
      title: "Unlock PDF",
      href: "/unlock-pdf",
      icon: Shield,
      color: "from-red-500 to-red-600",
      description: "Remove PDF password",
    },
    {
      title: "Rotate PDF",
      href: "/rotate-pdf",
      icon: FileText,
      color: "from-purple-600 to-purple-700",
      description: "Rotate PDF pages",
    },
    {
      title: "Organize PDF",
      href: "/organize-pdf",
      icon: FileText,
      color: "from-indigo-500 to-indigo-600",
      description: "Rearrange PDF pages",
    },
    {
      title: "Page Numbers",
      href: "/page-numbers",
      icon: FileText,
      color: "from-blue-600 to-blue-700",
      description: "Add page numbers",
    },
    {
      title: "OCR PDF",
      href: "/ocr-pdf",
      icon: FileText,
      color: "from-blue-700 to-blue-800",
      description: "Extract text from scanned PDFs",
    },
    {
      title: "Compare PDF",
      href: "/compare-pdf",
      icon: FileText,
      color: "from-indigo-600 to-indigo-700",
      description: "Compare PDF documents",
      isNew: true,
    },
    {
      title: "Redact PDF",
      href: "/redact-pdf",
      icon: FileText,
      color: "from-red-700 to-red-800",
      description: "Hide sensitive information",
      isNew: true,
    },
    {
      title: "Crop PDF",
      href: "/crop-pdf",
      icon: Scissors,
      color: "from-green-700 to-green-800",
      description: "Crop PDF pages",
      isNew: true,
    },
    {
      title: "Repair PDF",
      href: "/repair-pdf",
      icon: FileText,
      color: "from-red-600 to-red-700",
      description: "Fix corrupted PDFs",
    },
    {
      title: "Scan to PDF",
      href: "/scan-to-pdf",
      icon: FileText,
      color: "from-green-600 to-green-700",
      description: "Convert scans to PDF",
    },
  ];

  // PDF Conversion Tools
  const pdfConversionTools = [
    {
      title: "PDF to Word",
      href: "/pdf-to-word",
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      description: "Convert PDF to Word",
    },
    {
      title: "PDF to PowerPoint",
      href: "/pdf-to-powerpoint",
      icon: FileText,
      color: "from-red-500 to-red-600",
      description: "Convert PDF to PowerPoint",
    },
    {
      title: "PDF to Excel",
      href: "/pdf-to-excel",
      icon: FileText,
      color: "from-emerald-500 to-emerald-600",
      description: "Convert PDF to Excel",
    },
    {
      title: "PDF to JPG",
      href: "/pdf-to-jpg",
      icon: FileImage,
      color: "from-yellow-500 to-yellow-600",
      description: "Convert PDF to images",
    },
    {
      title: "Word to PDF",
      href: "/word-to-pdf",
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      description: "Convert Word to PDF",
    },
    {
      title: "PowerPoint to PDF",
      href: "/powerpoint-to-pdf",
      icon: FileText,
      color: "from-red-500 to-red-600",
      description: "Convert PowerPoint to PDF",
    },
    {
      title: "Excel to PDF",
      href: "/excel-to-pdf",
      icon: FileText,
      color: "from-emerald-500 to-emerald-600",
      description: "Convert Excel to PDF",
    },
    {
      title: "JPG to PDF",
      href: "/jpg-to-pdf",
      icon: FileImage,
      color: "from-pink-500 to-pink-600",
      description: "Convert images to PDF",
    },
    {
      title: "HTML to PDF",
      href: "/html-to-pdf",
      icon: FileText,
      color: "from-amber-500 to-amber-600",
      description: "Convert HTML to PDF",
    },
    {
      title: "PDF to PDF/A",
      href: "/pdf-to-pdfa",
      icon: FileText,
      color: "from-teal-500 to-teal-600",
      description: "Convert to archival format",
    },
  ];

  // Image Tools
  const imageTools = [
    {
      title: "Compress Image",
      href: "/img/compress",
      icon: Minimize,
      color: "from-green-500 to-green-600",
      description: "Reduce image file size",
    },
    {
      title: "Resize Image",
      href: "/img/resize",
      icon: Image,
      color: "from-blue-500 to-blue-600",
      description: "Change image dimensions",
    },
    {
      title: "Crop Image",
      href: "/img/crop",
      icon: Scissors,
      color: "from-purple-500 to-purple-600",
      description: "Crop and trim images",
    },
    {
      title: "Rotate Image",
      href: "/img/rotate",
      icon: RotateCw,
      color: "from-orange-500 to-orange-600",
      description: "Rotate and flip images",
    },
    {
      title: "Remove Background",
      href: "/img/remove-bg",
      icon: Scissors,
      color: "from-red-500 to-red-600",
      description: "Remove image background",
      isPopular: true,
    },
    {
      title: "Upscale Image",
      href: "/img/upscale",
      icon: Image,
      color: "from-indigo-500 to-indigo-600",
      description: "Enhance image quality",
      isNew: true,
    },
    {
      title: "Add Watermark",
      href: "/img/watermark",
      icon: Shield,
      color: "from-cyan-500 to-cyan-600",
      description: "Add watermarks to images",
    },
    {
      title: "Meme Generator",
      href: "/img/meme",
      icon: Image,
      color: "from-pink-500 to-pink-600",
      description: "Create memes",
      isFun: true,
    },
    {
      title: "JPG to PNG",
      href: "/img/jpg-to-png",
      icon: FileImage,
      color: "from-emerald-500 to-emerald-600",
      description: "Convert JPG to PNG",
    },
    {
      title: "PNG to JPG",
      href: "/img/png-to-jpg",
      icon: FileImage,
      color: "from-yellow-500 to-yellow-600",
      description: "Convert PNG to JPG",
    },
    {
      title: "Image Converter",
      href: "/img/convert",
      icon: FileImage,
      color: "from-teal-500 to-teal-600",
      description: "Convert image formats",
    },
    {
      title: "Image to PDF",
      href: "/img/to-pdf",
      icon: FileImage,
      color: "from-amber-500 to-amber-600",
      description: "Convert images to PDF",
    },
  ];

  // Favicon Tools
  const faviconTools = [
    {
      title: "Favicon Generator",
      href: "/favicon",
      icon: Globe,
      color: "from-purple-500 to-purple-600",
      description: "Create favicon from image",
    },
    {
      title: "Favicon Converter",
      href: "/favicon-converter",
      icon: FileImage,
      color: "from-blue-500 to-blue-600",
      description: "Convert to favicon format",
    },
  ];

  // All tools combined for mega menu
  const allTools = [
    ...pdfTools,
    ...pdfConversionTools,
    ...imageTools,
    ...faviconTools,
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-red to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PP</span>
              </div>
              <span className="font-bold text-xl text-text-dark">
                Pdf<span className="text-brand-red">Page</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 relative">
            {/* PDF Tools Dropdown */}
            <div className="relative group">
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200 flex items-center">
                PDF Tools
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-[900px] bg-white rounded-xl shadow-2xl border border-gray-100 z-[60] p-6 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                <div className="grid grid-cols-2 gap-6">
                  {/* PDF Editing Tools */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                      Edit & Organize
                    </h4>
                    <div className="grid gap-2">
                      {pdfTools.slice(0, 8).map((tool) => (
                        <Link
                          key={tool.href}
                          to={tool.href}
                          className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                          >
                            <tool.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                                {tool.title}
                              </span>
                              {tool.isNew && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {tool.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* PDF Conversion Tools */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                      Convert & Transform
                    </h4>
                    <div className="grid gap-2">
                      {pdfConversionTools.slice(0, 8).map((tool) => (
                        <Link
                          key={tool.href}
                          to={tool.href}
                          className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                          >
                            <tool.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                              {tool.title}
                            </span>
                            <p className="text-xs text-gray-500">
                              {tool.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* View All PDF Tools */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    to="/tools?category=pdf"
                    className="flex items-center justify-center space-x-2 p-2 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                  >
                    <span className="text-sm font-medium">
                      View All PDF Tools
                    </span>
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Image Tools Dropdown */}
            <div className="relative group">
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200 flex items-center">
                Image Tools
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-[600px] bg-white rounded-xl shadow-2xl border border-gray-100 z-[60] p-6 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                <div className="grid grid-cols-2 gap-3">
                  {imageTools.map((tool) => (
                    <Link
                      key={tool.href}
                      to={tool.href}
                      className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <tool.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                            {tool.title}
                          </span>
                          {tool.isNew && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                          {tool.isPopular && (
                            <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                          {tool.isFun && (
                            <span className="ml-2 text-xs bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                              Fun
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* View All Image Tools */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    to="/img"
                    className="flex items-center justify-center space-x-2 p-2 rounded-lg hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors duration-200"
                  >
                    <span className="text-sm font-medium">
                      View All Image Tools
                    </span>
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Favicon Tools Dropdown */}
            <div className="relative group">
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200 flex items-center">
                Favicon Tools
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[60] p-4 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                <div className="grid gap-3">
                  {faviconTools.map((tool) => (
                    <Link
                      key={tool.href}
                      to={tool.href}
                      className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <tool.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                          {tool.title}
                        </span>
                        <p className="text-xs text-gray-500">
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* All Tools Mega Menu */}
            <div className="relative group">
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200 flex items-center">
                All Tools
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-[1200px] bg-white rounded-xl shadow-2xl border border-gray-100 z-[60] p-6 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                <div className="grid grid-cols-4 gap-6">
                  {/* PDF Tools Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-red-500" />
                      PDF Tools
                    </h4>
                    <div className="grid gap-1">
                      {pdfTools.slice(0, 8).map((tool) => (
                        <Link
                          key={tool.href}
                          to={tool.href}
                          className="group flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div
                            className={`w-6 h-6 rounded bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}
                          >
                            <tool.icon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                            {tool.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* PDF Conversion Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center">
                      <FileImage className="w-4 h-4 mr-2 text-blue-500" />
                      PDF Convert
                    </h4>
                    <div className="grid gap-1">
                      {pdfConversionTools.slice(0, 8).map((tool) => (
                        <Link
                          key={tool.href}
                          to={tool.href}
                          className="group flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div
                            className={`w-6 h-6 rounded bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}
                          >
                            <tool.icon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                            {tool.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Image Tools Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center">
                      <Image className="w-4 h-4 mr-2 text-green-500" />
                      Image Tools
                    </h4>
                    <div className="grid gap-1">
                      {imageTools.slice(0, 8).map((tool) => (
                        <Link
                          key={tool.href}
                          to={tool.href}
                          className="group flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div
                            className={`w-6 h-6 rounded bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}
                          >
                            <tool.icon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                            {tool.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Other Tools Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-purple-500" />
                      Other Tools
                    </h4>
                    <div className="grid gap-1">
                      {faviconTools.map((tool) => (
                        <Link
                          key={tool.href}
                          to={tool.href}
                          className="group flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div
                            className={`w-6 h-6 rounded bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}
                          >
                            <tool.icon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                            {tool.title}
                          </span>
                        </Link>
                      ))}

                      {/* Additional tools and links */}
                      <Link
                        to="/api-docs"
                        className="group flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Code className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                          API Documentation
                        </span>
                      </Link>

                      <Link
                        to="/business"
                        className="group flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                          <Building className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                          Business Solutions
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* View All Tools */}
                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <Link
                    to="/tools"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                  >
                    <span className="text-sm font-medium">
                      View All {allTools.length} Tools
                    </span>
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Other Products & Services Dropdown (temporarily hidden) */}
            <div className="relative group hidden">
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200 flex items-center">
                Other products
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200">
                <div className="grid gap-1">
                  {/* Products Section */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Products
                    </h4>
                    <Link
                      to="/img"
                      className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <Image className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                          iLoveIMG
                        </span>
                        <p className="text-xs text-gray-500">
                          Effortless image editing
                        </p>
                      </div>
                    </Link>
                    <Link
                      to="/sign-pdf"
                      className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <PenTool className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                          iLoveSign
                        </span>
                        <p className="text-xs text-gray-500">
                          e-Signing made simple
                        </p>
                      </div>
                    </Link>
                    <Link
                      to="/api-docs"
                      className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <Code className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                          iLoveAPI
                        </span>
                        <p className="text-xs text-gray-500">
                          Document automation for developers
                        </p>
                      </div>
                    </Link>
                  </div>

                  {/* Integrations Section */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Integrations
                    </h4>
                    <Link
                      to="/integrations"
                      className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                          Integrations
                        </span>
                        <p className="text-xs text-gray-500">
                          Zapier, Make, Wordpress...
                        </p>
                      </div>
                    </Link>
                  </div>

                  {/* Solutions Section */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Solutions
                    </h4>
                    <Link
                      to="/business"
                      className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <Building className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                          Business
                        </span>
                        <p className="text-xs text-gray-500">
                          PDF editing & workflows for teams
                        </p>
                      </div>
                    </Link>
                  </div>

                  {/* Applications Section */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Applications
                    </h4>
                    <Link
                      to="/desktop-app"
                      className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <Monitor className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                          Desktop App
                        </span>
                        <p className="text-xs text-gray-500">
                          Available for Mac and Windows
                        </p>
                      </div>
                    </Link>
                    <Link
                      to="/mobile-app"
                      className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <Smartphone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                          Mobile App
                        </span>
                        <p className="text-xs text-gray-500">
                          Available for iOS and Android
                        </p>
                      </div>
                    </Link>
                  </div>

                  {/* Footer Links */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/pricing"
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-text-dark hover:text-brand-red transition-colors duration-200">
                          Pricing
                        </span>
                      </Link>
                      <Link
                        to="/security"
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Shield className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-text-dark hover:text-brand-red transition-colors duration-200">
                          Security
                        </span>
                      </Link>
                      <Link
                        to="/features"
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Star className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-text-dark hover:text-brand-red transition-colors duration-200">
                          Features
                        </span>
                      </Link>
                      <Link
                        to="/about"
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Info className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-text-dark hover:text-brand-red transition-colors duration-200">
                          About us
                        </span>
                      </Link>
                      <Link
                        to="/help"
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <HelpCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-text-dark hover:text-brand-red transition-colors duration-200">
                          Help
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center text-text-medium hover:text-brand-red transition-colors duration-200 cursor-pointer">
                  <Globe className="w-4 h-4 mr-1" />
                  {currentLanguage.code.toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-80 overflow-y-auto w-56">
                {languages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => setLanguage(language)}
                    className={`cursor-pointer ${
                      currentLanguage.code === language.code
                        ? "bg-blue-50 text-blue-600"
                        : ""
                    }`}
                  >
                    <span className="mr-2">{language.flag}</span>
                    <span className="flex-1">{language.nativeName}</span>
                    {currentLanguage.code === language.code && (
                      <span className="text-blue-600 text-xs">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Actions */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-text-dark font-medium">
                    {user.name}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-text-dark">
                      {user.name}
                    </p>
                    <p className="text-xs text-text-light">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="flex items-center">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-brand-red hover:bg-red-600">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* All Tools Menu Icon */}
            <div className="relative">
              <button
                onClick={() => setShowAllToolsMenu(!showAllToolsMenu)}
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/50 hover:border-blue-300/70 transition-all duration-300 ml-4 group shadow-sm hover:shadow-md"
                aria-label="All Tools Menu"
              >
                <Grid3X3 className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors duration-200" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-text-dark" />
            ) : (
              <Menu className="w-6 h-6 text-text-dark" />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-in Menu */}
            <div
              className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
                mobileMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-brand-red to-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">PP</span>
                  </div>
                  <span className="font-bold text-lg text-text-dark">
                    Pdf<span className="text-brand-red">Page</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-dark" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto h-full pb-20">
                {/* Quick Access Tools */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Quick Tools
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      to="/merge"
                      className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Combine className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        Merge PDF
                      </span>
                    </Link>
                    <Link
                      to="/split"
                      className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Scissors className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Split PDF
                      </span>
                    </Link>
                    <Link
                      to="/compress"
                      className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Minimize className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">
                        Compress PDF
                      </span>
                    </Link>
                    <Link
                      to="/img/remove-bg"
                      className="flex items-center space-x-3 p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Scissors className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-700">
                        Remove Background
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Category Links */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    All Categories
                  </h3>
                  <div className="space-y-2">
                    <Link
                      to="/tools?category=pdf"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-medium text-text-dark">
                          PDF Tools
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                    </Link>

                    <Link
                      to="/tools?category=image"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <Image className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium text-text-dark">
                          Image Tools
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                    </Link>

                    <Link
                      to="/tools?category=favicon"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-purple-500" />
                        <span className="text-sm font-medium text-text-dark">
                          Favicon Tools
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                    </Link>

                    <Link
                      to="/tools"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <Grid3X3 className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium text-text-dark">
                          All Tools
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                    </Link>
                  </div>
                </div>

                {/* Auth Section */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Account
                  </h3>
                  {!isAuthenticated ? (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant="outline"
                          className="w-full text-sm font-medium border-gray-200 text-text-dark hover:bg-gray-50"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Login
                        </Button>
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant="default"
                          className="w-full text-sm font-medium bg-brand-red hover:bg-red-600"
                        >
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant="outline"
                          className="w-full text-sm font-medium border-gray-200 text-text-dark hover:bg-gray-50"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  )}
                </div>

                {/* Language Switcher */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Language
                    </h3>
                    <Globe className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => {
                          setLanguage(language);
                          setMobileMenuOpen(false);
                        }}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          currentLanguage.code === language.code
                            ? "bg-brand-red text-white"
                            : "bg-gray-100 text-text-dark hover:bg-gray-200"
                        }`}
                      >
                        {language.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mega Menu Overlay */}
      {showMegaMenu && (
        <div className="absolute top-full left-0 w-full bg-white shadow-2xl border-t border-gray-100 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {/* PDF Tools */}
              <div>
                <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-red-500" />
                  PDF Tools
                </h3>
                <div className="space-y-2">
                  {pdfTools.slice(0, 6).map((tool) => (
                    <Link
                      key={tool.href}
                      to={tool.href}
                      className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setShowMegaMenu(false)}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <tool.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                        {tool.title}
                      </span>
                    </Link>
                  ))}
                  <Link
                    to="/tools?category=pdf"
                    className="block mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => setShowMegaMenu(false)}
                  >
                    View all PDF tools →
                  </Link>
                </div>
              </div>

              {/* Image Tools */}
              <div>
                <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center">
                  <Image className="w-5 h-5 mr-2 text-green-500" />
                  Image Tools
                </h3>
                <div className="space-y-2">
                  {imageTools.slice(0, 6).map((tool) => (
                    <Link
                      key={tool.href}
                      to={tool.href}
                      className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setShowMegaMenu(false)}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <tool.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                            {tool.title}
                          </span>
                          {tool.isPopular && (
                            <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link
                    to="/img"
                    className="block mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                    onClick={() => setShowMegaMenu(false)}
                  >
                    View all image tools →
                  </Link>
                </div>
              </div>

              {/* Conversion Tools */}
              <div>
                <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center">
                  <FileImage className="w-5 h-5 mr-2 text-blue-500" />
                  Convert Files
                </h3>
                <div className="space-y-2">
                  {pdfConversionTools.slice(0, 6).map((tool) => (
                    <Link
                      key={tool.href}
                      to={tool.href}
                      className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setShowMegaMenu(false)}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <tool.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                        {tool.title}
                      </span>
                    </Link>
                  ))}
                  <Link
                    to="/tools?category=convert"
                    className="block mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => setShowMegaMenu(false)}
                  >
                    View all converters →
                  </Link>
                </div>
              </div>

              {/* Other Tools & Services */}
              <div>
                <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-purple-500" />
                  Other Tools
                </h3>
                <div className="space-y-2">
                  {faviconTools.map((tool) => (
                    <Link
                      key={tool.href}
                      to={tool.href}
                      className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setShowMegaMenu(false)}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <tool.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                        {tool.title}
                      </span>
                    </Link>
                  ))}

                  <Link
                    to="/api-docs"
                    className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setShowMegaMenu(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <Code className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                      API Documentation
                    </span>
                  </Link>

                  <Link
                    to="/business"
                    className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setShowMegaMenu(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200">
                      Business Solutions
                    </span>
                  </Link>

                  <Link
                    to="/tools"
                    className="block mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    onClick={() => setShowMegaMenu(false)}
                  >
                    View all tools →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Tools Dropdown Menu */}
      {showAllToolsMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setShowAllToolsMenu(false)}
          />

          {/* Menu Content - Slide from Right */}
          <div
            className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-[600px] max-w-[95vw] bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
              showAllToolsMenu ? "translate-x-0" : "translate-x-full"
            } overflow-y-auto`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <Grid3X3 className="w-5 h-5 mr-2 text-blue-600" />
                    All Tools
                  </h2>
                  <button
                    onClick={() => setShowAllToolsMenu(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors duration-200"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content - Horizontal Layout */}
            <div className="px-6 py-4">
              {/* Main Categories Section - Horizontal Flow */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Tool Categories
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <Link
                    to="/tools?category=pdf"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-blue-900 group-hover:text-blue-800">
                        PDF Tools
                      </span>
                      <p className="text-xs text-blue-700 mt-1">
                        Merge, split, compress
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/tools?category=image"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-green-900 group-hover:text-green-800">
                        Image Tools
                      </span>
                      <p className="text-xs text-green-700 mt-1">
                        Edit, resize, compress
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/tools?category=favicon"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-purple-900 group-hover:text-purple-800">
                        Favicon Tools
                      </span>
                      <p className="text-xs text-purple-700 mt-1">
                        Generate favicons
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Popular Tools - 4 Column Grid for Better Horizontal Flow */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Popular Tools
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <Link
                    to="/merge"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Combine className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      Merge PDF
                    </span>
                  </Link>

                  <Link
                    to="/split"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-green-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Scissors className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      Split PDF
                    </span>
                  </Link>

                  <Link
                    to="/compress"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-purple-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Minimize className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      Compress
                    </span>
                  </Link>

                  <Link
                    to="/img/remove-bg"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="relative flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-red-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Scissors className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      Remove BG
                    </span>
                    <span className="absolute -top-1 -right-1 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                      Hot
                    </span>
                  </Link>

                  <Link
                    to="/img/compress"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-green-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Minimize className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      Img Compress
                    </span>
                  </Link>

                  <Link
                    to="/img/resize"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      Resize
                    </span>
                  </Link>

                  <Link
                    to="/pdf-to-word"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-orange-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      PDF to Word
                    </span>
                  </Link>

                  <Link
                    to="/pdf-to-jpg"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-pink-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      PDF to JPG
                    </span>
                  </Link>
                </div>
              </div>

              {/* More Tools Row */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  More Tools
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <Link
                    to="/word-to-pdf"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      Word to PDF
                    </span>
                  </Link>

                  <Link
                    to="/protect"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-red-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      Protect PDF
                    </span>
                  </Link>

                  <Link
                    to="/unlock"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-emerald-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <Unlock className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      Unlock PDF
                    </span>
                  </Link>

                  <Link
                    to="/rotate"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-cyan-300 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <RotateCw className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      Rotate PDF
                    </span>
                  </Link>
                </div>
              </div>

              {/* Quick Actions - Horizontal */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/tools"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex items-center justify-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <Grid3X3 className="w-5 h-5" />
                    <span className="font-medium">View All Tools</span>
                  </Link>

                  <Link
                    to="/pricing"
                    onClick={() => setShowAllToolsMenu(false)}
                    className="flex items-center justify-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <Crown className="w-5 h-5" />
                    <span className="font-medium">Upgrade to Pro</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
