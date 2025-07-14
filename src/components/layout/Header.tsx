import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import MobileMenu from "./MobileMenu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();

  const convertFromPdf = [
    { label: "PDF to Word", href: "/pdf-to-word", icon: File },
    { label: "PDF to PPT", href: "/pdf-to-ppt", icon: Presentation },
    { label: "PDF to Excel", href: "/pdf-to-excel", icon: FileSpreadsheet },
    { label: "PDF to TXT", href: "/pdf-to-txt", icon: Type },
    { label: "PDF to RTF", href: "/pdf-to-rtf", icon: FileText },
    { label: "PDF to PNG", href: "/pdf-to-png", icon: Image },
    { label: "PDF to JPG", href: "/pdf-to-jpg", icon: Camera },
    { label: "PDF to Long Image", href: "/pdf-to-long-image", icon: Layers },
    { label: "PDF to PDF/A", href: "/pdf-to-pdfa", icon: Shield },
    { label: "PDF to Markdown", href: "/pdf-to-markdown", icon: Code },
  ];

  const convertToPdf = [
    { label: "Word to PDF", href: "/word-to-pdf", icon: File },
    { label: "PPT to PDF", href: "/ppt-to-pdf", icon: Presentation },
    { label: "Excel to PDF", href: "/excel-to-pdf", icon: FileSpreadsheet },
    { label: "TXT to PDF", href: "/text-to-pdf", icon: Type },
    { label: "RTF to PDF", href: "/rtf-to-pdf", icon: FileText },
    { label: "Markdown to PDF", href: "/markdown-to-pdf", icon: Code },
    { label: "ODP to PDF", href: "/odp-to-pdf", icon: Presentation },
    { label: "ODS to PDF", href: "/ods-to-pdf", icon: FileSpreadsheet },
    { label: "ODT to PDF", href: "/odt-to-pdf", icon: File },
    { label: "HTML to PDF", href: "/html-to-pdf", icon: Globe },
    { label: "EPUB to PDF", href: "/epub-to-pdf", icon: FileText },
    { label: "OFD to PDF", href: "/ofd-to-pdf", icon: File },
    { label: "CAJ to PDF", href: "/caj-to-pdf", icon: File },
    { label: "JPG to PDF", href: "/jpg-to-pdf", icon: Camera },
    { label: "PNG to PDF", href: "/png-to-pdf", icon: Image },
    { label: "SVG to PDF", href: "/svg-to-pdf", icon: Palette },
    { label: "TIFF to PDF", href: "/tiff-to-pdf", icon: FileImage },
    { label: "HEIC to PDF", href: "/heic-to-pdf", icon: Camera },
    { label: "WebP to PDF", href: "/webp-to-pdf", icon: Image },
    { label: "CAD to PDF", href: "/cad-to-pdf", icon: Layers },
  ];

  const imageConversion = [
    { label: "HEIC to JPG", href: "/heic-to-jpg", icon: Camera },
    { label: "HEIC to PNG", href: "/heic-to-png", icon: Camera },
    { label: "WebP to PNG", href: "/webp-to-png", icon: Image },
    { label: "PNG to WebP", href: "/png-to-webp", icon: Image },
  ];

  const essentialTools = [
    { label: "Merge PDF", href: "/merge", icon: Merge },
    { label: "Split PDF", href: "/split", icon: Split },
    { label: "Compress PDF", href: "/compress", icon: Archive },
    { label: "Rotate PDF", href: "/rotate", icon: RotateCw },
    { label: "Unlock PDF", href: "/unlock", icon: Unlock },
    { label: "Protect PDF", href: "/protect", icon: Lock },
  ];

  return (
    <header className="bg-gradient-to-r from-white via-gray-50 to-white shadow-lg border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-red-500/30 group-hover:shadow-red-500/25 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-base tracking-tight">
                  PP
                </span>
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Pdf
                <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                  Page
                </span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <div className="relative group">
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-all duration-300 flex items-center px-3 py-2 rounded-lg hover:bg-red-50 hover:shadow-sm">
                <Download className="w-4 h-4 mr-2 text-red-500" />
                Convert from PDF
                <ChevronDown className="w-4 h-4 ml-2 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 mt-3 w-64 bg-white shadow-2xl border border-gray-200 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 backdrop-blur-sm">
                <div className="py-2">
                  {convertFromPdf.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex items-center px-4 py-3 text-sm text-text-medium hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-brand-red transition-all duration-200 rounded-lg mx-2 my-1"
                      >
                        <IconComponent className="w-4 h-4 mr-3 text-red-500" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-all duration-300 flex items-center px-3 py-2 rounded-lg hover:bg-blue-50 hover:shadow-sm">
                <Upload className="w-4 h-4 mr-2 text-blue-500" />
                Convert to PDF
                <ChevronDown className="w-4 h-4 ml-2 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 mt-3 w-64 bg-white shadow-2xl border border-gray-200 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 backdrop-blur-sm">
                <div className="py-2 max-h-80 overflow-y-auto">
                  {convertToPdf.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex items-center px-4 py-3 text-sm text-text-medium hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 transition-all duration-200 rounded-lg mx-2 my-1"
                      >
                        <IconComponent className="w-4 h-4 mr-3 text-blue-500" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-all duration-300 flex items-center px-3 py-2 rounded-lg hover:bg-purple-50 hover:shadow-sm">
                <Image className="w-4 h-4 mr-2 text-purple-500" />
                Image Tools
                <ChevronDown className="w-4 h-4 ml-2 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 mt-3 w-64 bg-white shadow-2xl border border-gray-200 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 backdrop-blur-sm">
                <div className="py-2">
                  {imageConversion.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex items-center px-4 py-3 text-sm text-text-medium hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-600 transition-all duration-200 rounded-lg mx-2 my-1"
                      >
                        <IconComponent className="w-4 h-4 mr-3 text-purple-500" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <div className="border-t border-gray-100 my-2"></div>
                  <Link
                    to="/img"
                    className="flex items-center px-4 py-3 text-sm text-text-medium hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-600 transition-all duration-200 rounded-lg mx-2 my-1"
                  >
                    <Image className="w-4 h-4 mr-3 text-purple-500" />
                    All Image Tools
                  </Link>
                </div>
              </div>
            </div>

            <Link
              to="/favicon"
              className="text-body-medium text-text-medium hover:text-brand-red transition-all duration-300 flex items-center px-3 py-2 rounded-lg hover:bg-yellow-50 hover:shadow-sm"
            >
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              Favicon
            </Link>

            <div className="relative group">
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-all duration-300 flex items-center px-3 py-2 rounded-lg hover:bg-green-50 hover:shadow-sm">
                <Zap className="w-4 h-4 mr-2 text-green-500" />
                All Tools
                <ChevronDown className="w-4 h-4 ml-2 transition-transform group-hover:rotate-180" />
              </button>

              {/* Mega Menu */}
              <div className="absolute top-full left-0 mt-3 w-screen max-w-6xl bg-white shadow-2xl border border-gray-200 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 backdrop-blur-sm -translate-x-1/2">
                <div className="px-8 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Essential PDF Tools */}
                    <div>
                      <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-brand-red" />
                        Essential Tools
                      </h3>
                      <div className="space-y-2">
                        {essentialTools.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              className="flex items-center text-sm text-text-medium hover:text-green-600 transition-colors"
                            >
                              <IconComponent className="w-4 h-4 mr-3 text-green-500" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Convert from PDF */}
                    <div>
                      <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center">
                        <Download className="w-5 h-5 mr-2 text-brand-red" />
                        Convert from PDF
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {convertFromPdf.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              className="flex items-center text-sm text-text-medium hover:text-red-600 transition-colors"
                            >
                              <IconComponent className="w-4 h-4 mr-3 text-red-500" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Convert to PDF */}
                    <div>
                      <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center">
                        <Upload className="w-5 h-5 mr-2 text-brand-red" />
                        Convert to PDF
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {convertToPdf.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              className="flex items-center text-sm text-text-medium hover:text-blue-600 transition-colors"
                            >
                              <IconComponent className="w-4 h-4 mr-3 text-blue-500" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Image & Other Tools */}
                    <div>
                      <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center">
                        <Image className="w-5 h-5 mr-2 text-brand-red" />
                        Image & Special Tools
                      </h3>
                      <div className="space-y-2">
                        {imageConversion.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              className="flex items-center text-sm text-text-medium hover:text-purple-600 transition-colors"
                            >
                              <IconComponent className="w-4 h-4 mr-3 text-purple-500" />
                              {item.label}
                            </Link>
                          );
                        })}
                        <div className="border-t border-gray-100 my-3"></div>
                        <Link
                          to="/img"
                          className="flex items-center text-sm text-text-medium hover:text-purple-600 transition-colors"
                        >
                          <Image className="w-4 h-4 mr-3 text-purple-500" />
                          All Image Tools
                        </Link>
                        <Link
                          to="/favicon"
                          className="flex items-center text-sm text-text-medium hover:text-yellow-600 transition-colors"
                        >
                          <Star className="w-4 h-4 mr-3 text-yellow-500" />
                          Favicon Generator
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* User Actions */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-text-dark font-medium">
                      {user.name}
                    </span>
                  </button>
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
                    <Crown className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <Menu className="w-6 h-6 text-text-dark" />
            </button>
          </div>
        </div>
      </div>

      {/* Modern Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </header>
  );
};

export default Header;
