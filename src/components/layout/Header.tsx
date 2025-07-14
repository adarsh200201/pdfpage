import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Menu,
  Globe,
  User,
  Crown,
  FileText,
  ChevronDown,
  LogOut,
  Settings,
  File,
  FileImage,
  FileSpreadsheet,
  Presentation,
  Type,
  Code,
  Image,
  Camera,
  Shield,
  RotateCw,
  Merge,
  Split,
  Archive,
  Lock,
  Unlock,
  Download,
  Upload,
  Scissors,
  Layers,
  Heart,
  Star,
  Palette,
  Zap,
  Search,
  X,
  Sparkles,
  Bell,
  HelpCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import MobileMenu from "./MobileMenu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();

  // Close search on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };

    if (searchOpen) {
      document.addEventListener("keydown", handleEscape);
      searchRef.current?.focus();
    }

    return () => document.removeEventListener("keydown", handleEscape);
  }, [searchOpen]);

  const convertFromPdf = [
    {
      label: "PDF to Word",
      href: "/pdf-to-word",
      icon: File,
      description: "Convert PDF to editable Word documents",
    },
    {
      label: "PDF to PPT",
      href: "/pdf-to-ppt",
      icon: Presentation,
      description: "Convert PDF to PowerPoint presentations",
    },
    {
      label: "PDF to Excel",
      href: "/pdf-to-excel",
      icon: FileSpreadsheet,
      description: "Convert PDF to Excel spreadsheets",
    },
    {
      label: "PDF to TXT",
      href: "/pdf-to-txt",
      icon: Type,
      description: "Extract text from PDF files",
    },
    {
      label: "PDF to RTF",
      href: "/pdf-to-rtf",
      icon: FileText,
      description: "Convert PDF to Rich Text Format",
    },
    {
      label: "PDF to PNG",
      href: "/pdf-to-png",
      icon: Image,
      description: "Convert PDF pages to PNG images",
    },
    {
      label: "PDF to JPG",
      href: "/pdf-to-jpg",
      icon: Camera,
      description: "Convert PDF pages to JPG images",
    },
    {
      label: "PDF to Long Image",
      href: "/pdf-to-long-image",
      icon: Layers,
      description: "Create long scrollable images",
    },
    {
      label: "PDF to PDF/A",
      href: "/pdf-to-pdfa",
      icon: Shield,
      description: "Convert to archival PDF format",
    },
    {
      label: "PDF to Markdown",
      href: "/pdf-to-markdown",
      icon: Code,
      description: "Convert PDF to Markdown text",
    },
  ];

  const convertToPdf = [
    {
      label: "Word to PDF",
      href: "/word-to-pdf",
      icon: File,
      description: "Convert Word documents to PDF",
    },
    {
      label: "PPT to PDF",
      href: "/ppt-to-pdf",
      icon: Presentation,
      description: "Convert PowerPoint to PDF",
    },
    {
      label: "Excel to PDF",
      href: "/excel-to-pdf",
      icon: FileSpreadsheet,
      description: "Convert Excel sheets to PDF",
    },
    {
      label: "TXT to PDF",
      href: "/text-to-pdf",
      icon: Type,
      description: "Convert text files to PDF",
    },
    {
      label: "RTF to PDF",
      href: "/rtf-to-pdf",
      icon: FileText,
      description: "Convert RTF documents to PDF",
    },
    {
      label: "Markdown to PDF",
      href: "/markdown-to-pdf",
      icon: Code,
      description: "Convert Markdown to PDF",
    },
    {
      label: "ODP to PDF",
      href: "/odp-to-pdf",
      icon: Presentation,
      description: "Convert OpenDocument Presentation to PDF",
    },
    {
      label: "ODS to PDF",
      href: "/ods-to-pdf",
      icon: FileSpreadsheet,
      description: "Convert OpenDocument Spreadsheet to PDF",
    },
    {
      label: "ODT to PDF",
      href: "/odt-to-pdf",
      icon: File,
      description: "Convert OpenDocument Text to PDF",
    },
    {
      label: "HTML to PDF",
      href: "/html-to-pdf",
      icon: Globe,
      description: "Convert web pages to PDF",
    },
    {
      label: "EPUB to PDF",
      href: "/epub-to-pdf",
      icon: FileText,
      description: "Convert EPUB ebooks to PDF",
    },
    {
      label: "OFD to PDF",
      href: "/ofd-to-pdf",
      icon: File,
      description: "Convert OFD documents to PDF",
    },
    {
      label: "CAJ to PDF",
      href: "/caj-to-pdf",
      icon: File,
      description: "Convert CAJ documents to PDF",
    },
    {
      label: "JPG to PDF",
      href: "/jpg-to-pdf",
      icon: Camera,
      description: "Convert JPG images to PDF",
    },
    {
      label: "PNG to PDF",
      href: "/png-to-pdf",
      icon: Image,
      description: "Convert PNG images to PDF",
    },
    {
      label: "SVG to PDF",
      href: "/svg-to-pdf",
      icon: Palette,
      description: "Convert SVG graphics to PDF",
    },
    {
      label: "TIFF to PDF",
      href: "/tiff-to-pdf",
      icon: FileImage,
      description: "Convert TIFF images to PDF",
    },
    {
      label: "HEIC to PDF",
      href: "/heic-to-pdf",
      icon: Camera,
      description: "Convert HEIC images to PDF",
    },
    {
      label: "WebP to PDF",
      href: "/webp-to-pdf",
      icon: Image,
      description: "Convert WebP images to PDF",
    },
    {
      label: "CAD to PDF",
      href: "/cad-to-pdf",
      icon: Layers,
      description: "Convert CAD drawings to PDF",
    },
  ];

  const essentialTools = [
    {
      label: "Merge PDF",
      href: "/merge",
      icon: Merge,
      description: "Combine multiple PDFs",
    },
    {
      label: "Split PDF",
      href: "/split",
      icon: Split,
      description: "Split PDF into separate files",
    },
    {
      label: "Compress PDF",
      href: "/compress",
      icon: Archive,
      description: "Reduce PDF file size",
    },
    {
      label: "Rotate PDF",
      href: "/rotate",
      icon: RotateCw,
      description: "Rotate PDF pages",
    },
    {
      label: "Unlock PDF",
      href: "/unlock",
      icon: Unlock,
      description: "Remove PDF password protection",
    },
    {
      label: "Protect PDF",
      href: "/protect",
      icon: Lock,
      description: "Add password protection",
    },
  ];

  // Search functionality
  const allTools = [...convertFromPdf, ...convertToPdf, ...essentialTools];
  const filteredTools = searchQuery
    ? allTools.filter(
        (tool) =>
          tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleToolSelect = (href: string) => {
    navigate(href);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo - Enhanced */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-red-500/20 group-hover:shadow-red-500/30 transition-all duration-300 group-hover:scale-105">
                    <span className="text-white font-bold text-lg tracking-tight">
                      PP
                    </span>
                  </div>
                  {user?.isPremium && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    Pdf
                    <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                      Page
                    </span>
                  </span>
                  {user?.isPremium && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300"
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Enhanced */}
            <nav className="hidden lg:flex items-center space-x-1">
              {/* Convert from PDF */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-red-600 transition-all duration-300 flex items-center px-4 py-3 rounded-xl hover:bg-red-50 hover:shadow-sm group-hover:bg-red-50">
                  <Download className="w-4 h-4 mr-2 text-red-500" />
                  Convert from PDF
                  <ChevronDown className="w-4 h-4 ml-2 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-80 bg-white shadow-2xl border border-gray-200 rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Download className="w-4 h-4 mr-2 text-red-500" />
                      Convert from PDF
                    </div>
                    <div className="space-y-1">
                      {convertFromPdf.slice(0, 8).map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            className="flex items-center p-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-xl group/item"
                          >
                            <IconComponent className="w-4 h-4 mr-3 text-red-500 group-hover/item:scale-110 transition-transform" />
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-gray-500">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      to="/tools/convert-from-pdf"
                      className="block text-center text-sm text-red-600 hover:text-red-700 font-medium mt-3 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      View all conversion tools →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Convert to PDF */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 transition-all duration-300 flex items-center px-4 py-3 rounded-xl hover:bg-blue-50 hover:shadow-sm group-hover:bg-blue-50">
                  <Upload className="w-4 h-4 mr-2 text-blue-500" />
                  Convert to PDF
                  <ChevronDown className="w-4 h-4 ml-2 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-80 bg-white shadow-2xl border border-gray-200 rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Upload className="w-4 h-4 mr-2 text-blue-500" />
                      Convert to PDF
                    </div>
                    <div className="space-y-1">
                      {convertToPdf.slice(0, 12).map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            className="flex items-center p-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-xl group/item"
                          >
                            <IconComponent className="w-4 h-4 mr-3 text-blue-500 group-hover/item:scale-110 transition-transform" />
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-gray-500">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      to="/tools/convert-to-pdf"
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-3 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      View all conversion tools →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Essential Tools */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-green-600 transition-all duration-300 flex items-center px-4 py-3 rounded-xl hover:bg-green-50 hover:shadow-sm group-hover:bg-green-50">
                  <Zap className="w-4 h-4 mr-2 text-green-500" />
                  Essential Tools
                  <ChevronDown className="w-4 h-4 ml-2 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-80 bg-white shadow-2xl border border-gray-200 rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-green-500" />
                      Essential PDF Tools
                    </div>
                    <div className="space-y-1">
                      {essentialTools.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            className="flex items-center p-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all duration-200 rounded-xl group/item"
                          >
                            <IconComponent className="w-4 h-4 mr-3 text-green-500 group-hover/item:scale-110 transition-transform" />
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-gray-500">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* All Tools */}
              <Link
                to="/available-tools"
                className="text-gray-700 hover:text-purple-600 transition-all duration-300 flex items-center px-4 py-3 rounded-xl hover:bg-purple-50 hover:shadow-sm"
              >
                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                All Tools
              </Link>
            </nav>

            {/* Right Side Actions - Enhanced */}
            <div className="flex items-center space-x-3">
              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 group"
              >
                <Search className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                <span className="text-sm text-gray-500 group-hover:text-gray-700">
                  Search tools...
                </span>
                <kbd className="px-2 py-1 text-xs bg-white rounded shadow text-gray-500">
                  ⌘K
                </kbd>
              </button>

              {/* User Actions */}
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  {/* Notifications */}
                  <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>

                  {/* Help */}
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
                    <HelpCircle className="w-5 h-5" />
                  </button>

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 group">
                        <div className="relative">
                          <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-sm font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {user?.isPremium && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                              <Crown className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="hidden lg:block text-left">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {user.name}
                            {user?.isPremium && (
                              <Crown className="w-3 h-3 ml-1 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user?.isPremium ? "Premium Member" : "Free User"}
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-2">
                      <div className="px-3 py-3 border-b border-gray-100 mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 flex items-center">
                              {user.name}
                              {user?.isPremium && (
                                <Crown className="w-3 h-3 ml-1 text-yellow-500" />
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
                            {user?.isPremium && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300 mt-1"
                              >
                                Premium Member
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/dashboard"
                          className="flex items-center px-3 py-2 rounded-lg"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/settings"
                          className="flex items-center px-3 py-2 rounded-lg"
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      {!user?.isPremium && (
                        <DropdownMenuItem asChild>
                          <Link
                            to="/pricing"
                            className="flex items-center px-3 py-2 rounded-lg text-yellow-600"
                          >
                            <Crown className="w-4 h-4 mr-3" />
                            Upgrade to Premium
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={logout}
                        className="text-red-600 px-3 py-2 rounded-lg"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Get Premium
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center px-6 py-4 border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <Input
                  ref={searchRef}
                  placeholder="Search for PDF tools..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="border-0 focus:ring-0 text-lg placeholder:text-gray-400"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {searchQuery && (
                <div className="max-h-96 overflow-y-auto">
                  {filteredTools.length > 0 ? (
                    <div className="p-2">
                      <div className="text-sm text-gray-500 px-4 py-2">
                        {filteredTools.length} tool
                        {filteredTools.length !== 1 ? "s" : ""} found
                      </div>
                      {filteredTools.map((tool) => {
                        const IconComponent = tool.icon;
                        return (
                          <button
                            key={tool.href}
                            onClick={() => handleToolSelect(tool.href)}
                            className="w-full flex items-center p-4 hover:bg-gray-50 rounded-xl transition-colors text-left"
                          >
                            <IconComponent className="w-5 h-5 mr-4 text-blue-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {tool.label}
                              </div>
                              <div className="text-sm text-gray-500">
                                {tool.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <div className="text-gray-500">
                        No tools found for "{searchQuery}"
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Try searching for "merge", "convert", or "compress"
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!searchQuery && (
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-4">
                    Popular tools
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {essentialTools.slice(0, 6).map((tool) => {
                      const IconComponent = tool.icon;
                      return (
                        <button
                          key={tool.href}
                          onClick={() => handleToolSelect(tool.href)}
                          className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                        >
                          <IconComponent className="w-4 h-4 mr-3 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {tool.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Press ESC to close</span>
                  <span>⌘K to open search</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
};

export default Header;
