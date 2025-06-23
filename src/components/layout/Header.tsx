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
  const location = useLocation();

  const { user, isAuthenticated, logout } = useAuth();
  const { currentLanguage, setLanguage, languages } = useLanguage();

  // Determine if current page is image-related
  const isImagePage = location.pathname.startsWith("/img");

  const navItems = [
    { label: "Merge PDF", href: "/merge" },
    { label: "Split PDF", href: "/split" },
    { label: "Compress PDF", href: "/compress" },
    { label: isImagePage ? "Image Tools" : "PdfPage", href: "/img" },
  ];

  const allPdfTools = [
    {
      title: "Merge PDF",
      href: "/merge",
      icon: Combine,
      color: "from-blue-500 to-blue-600",
      available: true,
    },
    {
      title: "Split PDF",
      href: "/split",
      icon: Scissors,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Compress PDF",
      href: "/compress",
      icon: Minimize,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "PDF to Word",
      href: "/pdf-to-word",
      icon: FileText,
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "PDF to PowerPoint",
      href: "/pdf-to-powerpoint",
      icon: FileText,
      color: "from-red-500 to-red-600",
    },
    {
      title: "PDF to Excel",
      href: "/pdf-to-excel",
      icon: FileText,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Word to PDF",
      href: "/word-to-pdf",
      icon: FileText,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "PowerPoint to PDF",
      href: "/powerpoint-to-pdf",
      icon: FileText,
      color: "from-red-500 to-red-600",
    },
    {
      title: "Excel to PDF",
      href: "/excel-to-pdf",
      icon: FileText,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "JPG to PDF",
      href: "/jpg-to-pdf",
      icon: FileImage,
      color: "from-pink-500 to-pink-600",
    },
    {
      title: "PDF to JPG",
      href: "/pdf-to-jpg",
      icon: FileImage,
      color: "from-yellow-500 to-yellow-600",
    },
    {
      title: "Watermark PDF",
      href: "/watermark",
      icon: Scissors,
      color: "from-cyan-500 to-cyan-600",
    },
    {
      title: "Unlock PDF",
      href: "/unlock-pdf",
      icon: Shield,
      color: "from-red-500 to-red-600",
    },
    {
      title: "Protect PDF",
      href: "/protect-pdf",
      icon: Shield,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Organize PDF",
      href: "/organize-pdf",
      icon: FileText,
      color: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Edit PDF",
      href: "/edit-pdf",
      icon: FileText,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Sign PDF",
      href: "/sign-pdf",
      icon: FileText,
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Page Numbers",
      href: "/page-numbers",
      icon: FileText,
      color: "from-blue-600 to-blue-700",
    },
    {
      title: "HTML to PDF",
      href: "/html-to-pdf",
      icon: FileText,
      color: "from-amber-500 to-amber-600",
    },
    {
      title: "PDF to PDF/A",
      href: "/pdf-to-pdfa",
      icon: FileText,
      color: "from-teal-500 to-teal-600",
    },
    {
      title: "Repair PDF",
      href: "/repair-pdf",
      icon: FileText,
      color: "from-red-600 to-red-700",
    },
    {
      title: "Rotate PDF",
      href: "/rotate-pdf",
      icon: FileText,
      color: "from-purple-600 to-purple-700",
    },
    {
      title: "Scan to PDF",
      href: "/scan-to-pdf",
      icon: FileText,
      color: "from-green-600 to-green-700",
    },
    {
      title: "OCR PDF",
      href: "/ocr-pdf",
      icon: FileText,
      color: "from-blue-700 to-blue-800",
    },
    {
      title: "Compare PDF",
      href: "/compare-pdf",
      icon: FileText,
      color: "from-indigo-600 to-indigo-700",
      isNew: true,
    },
    {
      title: "Redact PDF",
      href: "/redact-pdf",
      icon: FileText,
      color: "from-red-700 to-red-800",
      isNew: true,
    },
    {
      title: "Crop PDF",
      href: "/crop-pdf",
      icon: Scissors,
      color: "from-green-700 to-green-800",
      isNew: true,
    },
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
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}

            {/* Convert PDF Dropdown */}
            <div className="relative group">
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200 flex items-center">
                Convert PDF
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/word-to-pdf"
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                      Word to PDF
                    </span>
                  </Link>
                  <Link
                    to="/powerpoint-to-pdf"
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                      PowerPoint to PDF
                    </span>
                  </Link>
                  <Link
                    to="/excel-to-pdf"
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                      Excel to PDF
                    </span>
                  </Link>
                  <Link
                    to="/jpg-to-pdf"
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600 to-pink-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileImage className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                      JPG to PDF
                    </span>
                  </Link>
                  <Link
                    to="/html-to-pdf"
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                      HTML to PDF
                    </span>
                  </Link>
                  <Link
                    to="/pdf-to-jpg"
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileImage className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                      PDF to JPG
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* All Tools Button */}
            <button
              onClick={() => setShowMegaMenu(!showMegaMenu)}
              className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200 flex items-center"
            >
              All Tools
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {/* Get Premium */}
            <Link
              to="/pricing"
              className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200"
            >
              Get Premium
            </Link>
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
                    <Crown className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-text-dark" />
              ) : (
                <Menu className="w-6 h-6 text-text-dark" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200 block py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100 mt-4">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      size="sm"
                      className="w-full justify-start bg-brand-red hover:bg-red-600"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}

              {/* Mobile Language Selector */}
              <div className="pt-4 border-t border-gray-100 mt-4">
                <div className="flex items-center mb-2">
                  <Globe className="w-4 h-4 mr-2 text-text-medium" />
                  <span className="text-sm font-medium text-text-dark">
                    Language
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => {
                        setLanguage(language);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center p-2 rounded-lg text-left transition-colors duration-200 ${
                        currentLanguage.code === language.code
                          ? "bg-blue-50 text-blue-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="mr-2 text-sm">{language.flag}</span>
                      <span className="text-xs truncate flex-1">
                        {language.nativeName}
                      </span>
                      {currentLanguage.code === language.code && (
                        <span className="text-blue-600 text-xs ml-1">✓</span>
                      )}
                    </button>
                  ))}
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {allPdfTools.map((tool, index) => {
                const IconComponent = tool.icon;
                return (
                  <Link
                    key={index}
                    to={tool.href}
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setShowMegaMenu(false)}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                          {tool.title}
                        </span>
                        {tool.isNew && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
