import { useState } from "react";
import { Link } from "react-router-dom";
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
import AuthModal from "@/components/auth/AuthModal";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">(
    "login",
  );

  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { label: "Merge PDF", href: "/merge" },
    { label: "Split PDF", href: "/split" },
    { label: "Compress PDF", href: "/compress" },
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
      color: "from-blue-600 to-blue-700",
    },
    {
      title: "PowerPoint to PDF",
      href: "/powerpoint-to-pdf",
      icon: FileText,
      color: "from-red-600 to-red-700",
    },
    {
      title: "Excel to PDF",
      href: "/excel-to-pdf",
      icon: FileText,
      color: "from-emerald-600 to-emerald-700",
    },
    {
      title: "Edit PDF",
      href: "/edit-pdf",
      icon: FileText,
      color: "from-indigo-500 to-indigo-600",
      isNew: true,
    },
    {
      title: "PDF to JPG",
      href: "/pdf-to-jpg",
      icon: FileImage,
      color: "from-pink-500 to-pink-600",
    },
    {
      title: "JPG to PDF",
      href: "/jpg-to-pdf",
      icon: FileImage,
      color: "from-pink-600 to-pink-700",
    },
    {
      title: "Sign PDF",
      href: "/sign-pdf",
      icon: FileText,
      color: "from-violet-500 to-violet-600",
    },
    {
      title: "Watermark",
      href: "/watermark",
      icon: FileText,
      color: "from-cyan-500 to-cyan-600",
    },
    {
      title: "Rotate PDF",
      href: "/rotate-pdf",
      icon: FileText,
      color: "from-teal-500 to-teal-600",
    },
    {
      title: "HTML to PDF",
      href: "/html-to-pdf",
      icon: FileText,
      color: "from-amber-500 to-amber-600",
    },
    {
      title: "Unlock PDF",
      href: "/unlock-pdf",
      icon: FileText,
      color: "from-lime-500 to-lime-600",
    },
    {
      title: "Protect PDF",
      href: "/protect-pdf",
      icon: Shield,
      color: "from-red-500 to-red-600",
    },
    {
      title: "Organize PDF",
      href: "/organize-pdf",
      icon: FileText,
      color: "from-slate-500 to-slate-600",
    },
    {
      title: "PDF to PDF/A",
      href: "/pdf-to-pdfa",
      icon: FileText,
      color: "from-gray-500 to-gray-600",
    },
    {
      title: "Repair PDF",
      href: "/repair-pdf",
      icon: FileText,
      color: "from-orange-600 to-orange-700",
    },
    {
      title: "Page numbers",
      href: "/page-numbers",
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
                  <Link to="/word-to-pdf" className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">Word to PDF</span>
                  </Link>
                  <Link to="/powerpoint-to-pdf" className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">PowerPoint to PDF</span>
                  </Link>
                  <Link to="/excel-to-pdf" className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">Excel to PDF</span>
                  </Link>
                  <Link to="/jpg-to-pdf" className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600 to-pink-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileImage className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">JPG to PDF</span>
                  </Link>
                  <Link to="/html-to-pdf" className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">HTML to PDF</span>
                  </Link>
                  <Link to="/scan-to-pdf" className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">Scan to PDF</span>
                  </Link>
                  <Link to="/ocr-pdf" className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-blue-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">OCR PDF</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* All PDF Tools with Mega Menu */}
            <div
              className="relative"
              onMouseEnter={() => setShowMegaMenu(true)}
              onMouseLeave={() => setShowMegaMenu(false)}
            >
              <button className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200 flex items-center">
                All PDF tools
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>

              {/* Mega Menu */}
              {showMegaMenu && (
                <div
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-screen max-w-4xl bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-6"
                  onMouseEnter={() => setShowMegaMenu(true)}
                  onMouseLeave={() => setShowMegaMenu(false)}
                >
                  <div className="mb-4">
                    <h3 className="text-heading-small text-text-dark mb-2">
                      All PDF Tools
                    </h3>
                    <p className="text-body-small text-text-light">
                      Choose from our complete collection of PDF tools
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                    {allPdfTools.map((tool) => {
                      const IconComponent = tool.icon;
                      return (
                        <Link
                          key={tool.href}
                          to={tool.href}
                          className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 relative"
                          onClick={() => setShowMegaMenu(false)}
                        >
                          {tool.isNew && (
                            <div className="absolute -top-1 -right-1 bg-brand-red text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                              New!
                            </div>
                          )}
                          {tool.available && (
                            <div className="absolute -top-1 -left-1 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                              Live
                            </div>
                          )}
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                          >
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-dark group-hover:text-brand-red transition-colors duration-200 truncate">
                              {tool.title}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      to="/"
                      className="text-body-medium text-brand-red hover:text-red-600 transition-colors duration-200"
                      onClick={() => setShowMegaMenu(false)}
                    >
                      View all tools on homepage →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Globe className="w-4 h-4 mr-2" />
                  EN
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>Español</DropdownMenuItem>
                <DropdownMenuItem>Français</DropdownMenuItem>
                <DropdownMenuItem>Deutsch</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Actions */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">
                          {user?.name}
                        </span>
                        {user?.isPremium && (
                          <span className="text-xs text-brand-yellow">
                            Premium
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
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
                    {!user?.isPremium && (
                      <DropdownMenuItem asChild>
                        <Link to="/pricing" className="flex items-center">
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Premium
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user?.isPremium && (
                      <DropdownMenuItem asChild>
                        <Link to="/billing" className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Billing
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAuthModalTab("login");
                    setShowAuthModal(true);
                  }}
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button
                  size="sm"
                  className="bg-brand-red hover:bg-red-600"
                  onClick={() => {
                    setAuthModalTab("register");
                    setShowAuthModal(true);
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Premium Button */}
            <Button
              asChild
              size="sm"
              className="bg-brand-yellow text-black hover:bg-yellow-400 hidden lg:flex"
            >
              <Link to="/pricing">
                <Crown className="w-4 h-4 mr-2" />
                Get Premium
              </Link>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-body-medium text-text-medium hover:text-brand-red transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
                <Button variant="ghost" size="sm" className="justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button size="sm" className="bg-brand-red hover:bg-red-600">
                  Sign Up
                </Button>
                <Button
                  size="sm"
                  className="bg-brand-yellow text-black hover:bg-yellow-400"
                  asChild
                >
                  <Link to="/pricing">
                    <Crown className="w-4 h-4 mr-2" />
                    Get Premium
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authModalTab}
      />
    </header>
  );
};

export default Header;
