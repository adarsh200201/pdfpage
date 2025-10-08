import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Globe,
  User,
  Crown,
  ChevronDown,
  LogOut,
  Settings,
  FileText,
  Image,
  Merge,
  Split,
  Minimize2,
  Shield,
  Sparkles,
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import PdfPageLogo from "@/components/ui/PdfPageLogo";
import MobileMenuButton from "@/components/ui/mobile-menu-button";
import { LOGO_CONFIG } from "@/config/logo-config";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);


  const { user, isAuthenticated, logout } = useAuth();
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const { t } = useTranslation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const mainNavItems = [
    {
      label: "Merge PDF",
      href: "/merge",
      icon: Merge,
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      label: "Split PDF",
      href: "/split",
      icon: Split,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      label: "Compress PDF",
      href: "/compress",
      icon: Minimize2,
      gradient: "from-purple-500 to-violet-600"
    },
    {
      label: "Protect PDF",
      href: "/protect-pdf",
      icon: Shield,
      gradient: "from-red-500 to-rose-600"
    },
  ];

  const allPdfTools = [
    // Core PDF Tools
    {
      title: "Merge PDF",
      href: "/merge",
      icon: Merge,
      color: "from-blue-500 to-indigo-600",
      description: "Combine multiple PDF files into one document",
      category: "Core Tools",
      isPopular: true,
    },
    {
      title: "Split PDF",
      href: "/split",
      icon: Split,
      color: "from-green-500 to-emerald-600",
      description: "Extract specific pages or split PDF into multiple files",
      category: "Core Tools",
      isPopular: true,
    },
    {
      title: "Compress PDF",
      href: "/compress",
      icon: Minimize2,
      color: "from-purple-500 to-violet-600",
      description: "Reduce PDF file size while maintaining optimal quality",
      category: "Core Tools",
      isPopular: true,
    },
    {
      title: "Rotate PDF",
      href: "/rotate-pdf",
      icon: FileText,
      color: "from-indigo-500 to-purple-600",
      description: "Rotate PDF pages to correct orientation",
      category: "Core Tools",
    },

    // Conversion Tools
    {
      title: "PDF to Word",
      href: "/pdf-to-word",
      icon: FileText,
      color: "from-blue-500 to-cyan-600",
      description: "Convert PDF to editable Word documents (DOCX)",
      category: "Conversion",
      isPopular: true,
      isNew: true,
    },
    {
      title: "Word to PDF",
      href: "/word-to-pdf",
      icon: FileText,
      color: "from-orange-500 to-amber-600",
      description: "Convert Word documents (DOC, DOCX) to PDF format",
      category: "Conversion",
    },
    {
      title: "PDF to PowerPoint",
      href: "/pdf-to-powerpoint",
      icon: FileText,
      color: "from-red-500 to-pink-600",
      description: "Convert PDF files to editable PowerPoint presentations",
      category: "Conversion",
      isNew: true,
    },
    {
      title: "PowerPoint to PDF",
      href: "/powerpoint-to-pdf",
      icon: FileText,
      color: "from-pink-500 to-rose-600",
      description: "Convert PowerPoint presentations to PDF",
      category: "Conversion",
    },
    {
      title: "PDF to Excel",
      href: "/pdf-to-excel",
      icon: FileText,
      color: "from-green-500 to-teal-600",
      description: "Extract tables and data from PDF to Excel",
      category: "Conversion",
      isNew: true,
    },
    {
      title: "Excel to PDF",
      href: "/excel-to-pdf",
      icon: FileText,
      color: "from-cyan-500 to-teal-600",
      description: "Convert Excel spreadsheets to PDF",
      category: "Conversion",
    },
    {
      title: "PDF to JPG",
      href: "/pdf-to-jpg",
      icon: Image,
      color: "from-yellow-500 to-orange-600",
      description: "Convert PDF pages to high-quality JPG images",
      category: "Conversion",
      isPopular: true,
    },
    {
      title: "JPG to PDF",
      href: "/jpg-to-pdf",
      icon: Image,
      color: "from-orange-500 to-red-600",
      description: "Convert JPG, PNG, and other images to PDF",
      category: "Conversion",
    },
    {
      title: "HTML to PDF",
      href: "/html-to-pdf",
      icon: FileText,
      color: "from-violet-500 to-purple-600",
      description: "Convert HTML files and web pages to PDF",
      category: "Conversion",
    },

    // PDF Editor Tools
    {
      title: "Edit PDF",
      href: "/edit-pdf",
      icon: FileText,
      color: "from-emerald-500 to-green-600",
      description: "Add text, images, shapes, and annotations to PDF",
      category: "Editor",
      isPopular: true,
    },
    {
      title: "Sign PDF",
      href: "/sign-pdf",
      icon: FileText,
      color: "from-blue-500 to-indigo-600",
      description: "Add digital signatures, draw signatures",
      category: "Editor",
    },
    {
      title: "Add Watermark",
      href: "/watermark",
      icon: FileText,
      color: "from-teal-500 to-cyan-600",
      description: "Add text or image watermarks to protect PDF",
      category: "Editor",
    },

    // Security Tools
    {
      title: "Protect PDF",
      href: "/protect-pdf",
      icon: Shield,
      color: "from-red-500 to-rose-600",
      description: "Add password protection and encryption",
      category: "Security",
    },
    {
      title: "Unlock PDF",
      href: "/unlock-pdf",
      icon: FileText,
      color: "from-yellow-500 to-amber-600",
      description: "Remove password protection from encrypted PDFs",
      category: "Security",
    },
  ];

  const quickActions = [
    { label: "Image Tools", href: "/img", icon: Image, color: "text-blue-600" },
    { label: "Favicon Generator", href: "/favicon", icon: Sparkles, color: "text-purple-600" },
    { label: "Blog", href: "/blog", icon: FileText, color: "text-green-600" },
  ];

  return (
    <>
      {/* Modern Header with Glass Morphism */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20" 
            : "bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
            {/* Enhanced Logo with Mobile-Responsive Design */}
            <div className="flex items-center min-w-0 flex-shrink-0 mr-4 lg:mr-8">
              <Link to="/" className="transition-all duration-300 hover:scale-105">
                <PdfPageLogo
                  size="md"
                  showHover={true}
                  useImage={true}
                  className="sm:scale-110 lg:scale-125"
                />
              </Link>
            </div>

            {/* Enhanced Desktop Navigation with proper spacing */}
            <nav className="hidden lg:flex items-center space-x-3 ml-8">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-all duration-300 rounded-xl hover:bg-gray-50/80"
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
                </Link>
              ))}

              {/* Enhanced All PDF Tools Button with Hover */}
              <div
                className="relative"
                onMouseEnter={() => setShowMegaMenu(true)}
                onMouseLeave={() => setShowMegaMenu(false)}
              >
                <button
                  onClick={() => setShowMegaMenu(!showMegaMenu)}
                  className={`group flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                    showMegaMenu
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50/80"
                  }`}
                >
                  <Zap className={`w-4 h-4 transition-all duration-300 ${showMegaMenu ? "text-primary" : "group-hover:text-primary"}`} />
                  <span>All PDF Tools</span>
                  <ChevronDown className={`w-4 h-4 transition-all duration-300 ${showMegaMenu ? "rotate-180 text-primary" : "group-hover:text-primary"}`} />
                </button>
              </div>

              {/* Quick Action Pills */}
              <div className="flex items-center space-x-1 ml-4 pl-4 border-l border-gray-200">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    to={action.href}
                    className={`group flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-gray-50/80 ${action.color}`}
                  >
                    <action.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                    <span className="hidden xl:inline">{action.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Enhanced Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Modern Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:flex items-center space-x-2 px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50/80 rounded-lg transition-all duration-300 group">
                    <Globe className="w-4 h-4 group-hover:text-primary transition-colors duration-300" />
                    <span className="text-xs font-bold">{currentLanguage.code.toUpperCase()}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 bg-white/95 backdrop-blur-md border border-white/20 shadow-xl">
                  <div className="grid gap-1">
                    {languages.map((language) => (
                      <DropdownMenuItem
                        key={language.code}
                        onClick={() => setLanguage(language)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                          currentLanguage.code === language.code
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-lg">{language.flag}</span>
                        <span className="flex-1 text-sm font-medium">{language.nativeName}</span>
                        {currentLanguage.code === language.code && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Authentication UI - Optional */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="hidden md:flex items-center space-x-3 px-3 py-2 hover:bg-gray-50/80 rounded-xl transition-all duration-300 group">
                    <div className="relative">
                      <div className="w-9 h-9 bg-gradient-to-r from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm -z-10"></div>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">User</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2 bg-white/95 backdrop-blur-md border border-white/20 shadow-xl">
                    <div className="px-3 py-3 border-b border-gray-100/80 mb-2">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{t("nav.dashboard")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{t("nav.settings")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/pricing" className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{t("nav.upgradeToPro")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem onClick={logout} className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">{t("nav.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
                      <User className="w-4 h-4 mr-2" />
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Crown className="w-4 h-4 mr-2" />
                      <span className="font-semibold">{t("nav.getStarted")}</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <MobileMenuButton
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Mega Menu with Hover and Scroll */}
        {showMegaMenu && (
          <div
            className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-2xl border-t border-white/20 z-40 animate-in slide-in-from-top-2 duration-300 max-h-[80vh] overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6',
            }}
            onMouseEnter={() => setShowMegaMenu(true)}
            onMouseLeave={() => setShowMegaMenu(false)}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Category-based organization */}
              <div className="space-y-8">
                {/* Core Tools */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    🛠️ Core PDF Tools
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {allPdfTools
                      .filter(tool => tool.category === "Core Tools")
                      .map((tool, index) => (
                        <Link
                          key={tool.href}
                          to={tool.href}
                          className="group relative p-4 rounded-xl hover:bg-white/80 transition-all duration-300 border border-gray-100/50 hover:border-gray-200/80 hover:shadow-lg"
                          onClick={() => setShowMegaMenu(false)}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}>
                              <tool.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300">
                                  {tool.title}
                                </h4>
                                {tool.isPopular && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-600 rounded-full">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>

                {/* Conversion Tools */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    🔄 Conversion Tools
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allPdfTools
                      .filter(tool => tool.category === "Conversion")
                      .map((tool, index) => (
                        <Link
                          key={tool.href}
                          to={tool.href}
                          className="group relative p-4 rounded-xl hover:bg-white/80 transition-all duration-300 border border-gray-100/50 hover:border-gray-200/80 hover:shadow-lg"
                          onClick={() => setShowMegaMenu(false)}
                          style={{ animationDelay: `${(index + 4) * 50}ms` }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}>
                              <tool.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300">
                                  {tool.title}
                                </h4>
                                {tool.isPopular && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-600 rounded-full">
                                    Popular
                                  </span>
                                )}
                                {tool.isNew && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-600 rounded-full">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>

                {/* Editor & Security Tools */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Editor Tools */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                      ✏️ Editor Tools
                    </h3>
                    <div className="space-y-3">
                      {allPdfTools
                        .filter(tool => tool.category === "Editor")
                        .map((tool, index) => (
                          <Link
                            key={tool.href}
                            to={tool.href}
                            className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-white/80 transition-all duration-300 border border-gray-100/50 hover:border-gray-200/80"
                            onClick={() => setShowMegaMenu(false)}
                          >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                              <tool.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                {tool.title}
                              </h4>
                              <p className="text-xs text-gray-600">{tool.description}</p>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>

                  {/* Security Tools */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                      🔒 Security Tools
                    </h3>
                    <div className="space-y-3">
                      {allPdfTools
                        .filter(tool => tool.category === "Security")
                        .map((tool, index) => (
                          <Link
                            key={tool.href}
                            to={tool.href}
                            className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-white/80 transition-all duration-300 border border-gray-100/50 hover:border-gray-200/80"
                            onClick={() => setShowMegaMenu(false)}
                          >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                              <tool.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                {tool.title}
                              </h4>
                              <p className="text-xs text-gray-600">{tool.description}</p>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>

                {/* View All Tools CTA */}
                <div className="border-t border-gray-200 pt-6">
                  <Link
                    to="/all-tools"
                    onClick={() => setShowMegaMenu(false)}
                    className="group flex items-center justify-center space-x-2 w-full p-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:from-primary/90 hover:to-blue-600/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Zap className="w-5 h-5" />
                    <span className="font-semibold">View All {allPdfTools.length} PDF Tools</span>
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed top-14 sm:top-16 lg:top-20 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-white/20 shadow-2xl z-50 max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="px-4 pt-4 pb-6 space-y-3">
              {/* Mobile Brand Header */}
              <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-primary/5 to-blue-600/5 rounded-xl border border-primary/10 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-blue-600 rounded-xl flex items-center justify-center">
                  <img
                    src={LOGO_CONFIG.getLogoUrl('webp', 256)}
                    alt="PdfPage"
                    className="h-6 w-6 brightness-0 invert"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    PdfPage
                  </h2>
                  <p className="text-xs text-gray-500">The Ultimate PDF Toolkit</p>
                </div>
              </div>
              {/* Main PDF Tools */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-4">PDF Tools</h3>
                {mainNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50/80 rounded-xl transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="pt-3 border-t border-gray-200/80 space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-4">Quick Tools</h3>
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    to={action.href}
                    className={`flex items-center space-x-3 px-4 py-3 text-base font-medium hover:bg-gray-50/80 rounded-xl transition-all duration-300 ${action.color}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <action.icon className="w-5 h-5" />
                    <span>{action.label}</span>
                  </Link>
                ))}

                {/* All Tools Link */}
                <Link
                  to="/all-tools"
                  className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-primary hover:bg-primary/5 rounded-xl transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Zap className="w-5 h-5" />
                  <span>All PDF Tools</span>
                </Link>
              </div>


            </div>
          </div>
        )}
      </header>
      
      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-14 sm:h-16 lg:h-20"></div>
    </>
  );
};

export default Header;
