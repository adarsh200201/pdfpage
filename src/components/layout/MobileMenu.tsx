import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  X,
  User,
  Crown,
  Globe,
  LogOut,
  Settings,
  ImageIcon,
  Minimize2,
  Crop,
  RotateCw,
  Type,
  Scissors,
  Palette,
  ChevronRight,
  Home,
  FileText,
  Smartphone,
  Zap,
  Sparkles,
  ArrowUpRight,
  Grid3X3,
  RefreshCw,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const { t } = useTranslation();

  const imageTools = [
    {
      title: "Compress Image",
      href: "/img/compress",
      icon: Minimize2,
      color: "bg-blue-500",
      description: "Reduce file size",
    },
    {
      title: "Resize Image",
      href: "/img/resize",
      icon: Crop,
      color: "bg-green-500",
      description: "Change dimensions",
    },
    {
      title: "Crop Image",
      href: "/img/crop",
      icon: Scissors,
      color: "bg-purple-500",
      description: "Trim & crop",
      isNew: true,
    },
    {
      title: "Rotate Image",
      href: "/img/rotate",
      icon: RotateCw,
      color: "bg-orange-500",
      description: "Rotate & flip",
    },
    {
      title: "JPG to PNG",
      href: "/img/jpg-to-png",
      icon: RefreshCw,
      color: "bg-pink-500",
      description: "Convert format",
    },
    {
      title: "PNG to JPG",
      href: "/img/png-to-jpg",
      icon: RefreshCw,
      color: "bg-cyan-500",
      description: "Convert format",
    },
    {
      title: "Add Watermark",
      href: "/img/watermark",
      icon: Type,
      color: "bg-indigo-500",
      description: "Brand images",
    },
    {
      title: "Enhance Colors",
      href: "/img/enhance",
      icon: Palette,
      color: "bg-yellow-500",
      description: "Adjust colors",
      isNew: true,
    },
  ];

  const pdfTools = [
    {
      title: "Merge PDF",
      href: "/merge",
      icon: Grid3X3,
      color: "bg-red-500",
      description: "Combine files",
    },
    {
      title: "Split PDF",
      href: "/split",
      icon: Scissors,
      color: "bg-blue-500",
      description: "Split pages",
    },
    {
      title: "Compress PDF",
      href: "/compress",
      icon: Minimize2,
      color: "bg-green-500",
      description: "Reduce size",
    },
    {
      title: "Convert to PDF",
      href: "/convert",
      icon: FileText,
      color: "bg-purple-500",
      description: "Any to PDF",
    },
  ];

  const quickActions = [
    {
      title: "PDF Tools",
      href: "/",
      icon: FileText,
      color: "from-red-500 to-red-600",
      description: "All PDF operations",
      count: "15+ tools",
    },
    {
      title: "Image Tools",
      href: "/img",
      icon: ImageIcon,
      color: "from-blue-500 to-blue-600",
      description: "Image editing tools",
      count: "8+ tools",
    },
    {
      title: "Favicon Generator",
      href: "/favicon",
      icon: Smartphone,
      color: "from-purple-500 to-purple-600",
      description: "Create favicons",
      count: "NEW",
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900">Menu</h2>
                <p className="text-xs text-gray-500">
                  Quick access to all tools
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* User Profile Section */}
            {isAuthenticated && user ? (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/dashboard" onClick={onClose}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/settings" onClick={onClose}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" onClick={onClose}>
                    <Button variant="outline" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={onClose}>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                      <Crown className="w-4 h-4 mr-2" />
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                Quick Access
              </h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.href}
                      onClick={onClose}
                      className="flex items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mr-3 group-hover:scale-105 transition-transform`}
                      >
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {action.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {action.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                          {action.count}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Image Tools Section */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
                  Image Tools
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setActiveSection(
                      activeSection === "images" ? null : "images",
                    )
                  }
                  className="p-1"
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${activeSection === "images" ? "rotate-90" : ""}`}
                  />
                </Button>
              </div>

              {activeSection === "images" && (
                <div className="grid grid-cols-2 gap-2">
                  {imageTools.map((tool, index) => {
                    const IconComponent = tool.icon;
                    return (
                      <Link
                        key={index}
                        to={tool.href}
                        onClick={onClose}
                        className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg ${tool.color} flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}
                        >
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-900 text-center">
                          {tool.title}
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          {tool.description}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PDF Tools Section */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-red-600" />
                  PDF Tools
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setActiveSection(activeSection === "pdfs" ? null : "pdfs")
                  }
                  className="p-1"
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${activeSection === "pdfs" ? "rotate-90" : ""}`}
                  />
                </Button>
              </div>

              {activeSection === "pdfs" && (
                <div className="grid grid-cols-2 gap-2">
                  {pdfTools.map((tool, index) => {
                    const IconComponent = tool.icon;
                    return (
                      <Link
                        key={index}
                        to={tool.href}
                        onClick={onClose}
                        className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg ${tool.color} flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}
                        >
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-900 text-center">
                          {tool.title}
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          {tool.description}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-green-600" />
                  Language
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setActiveSection(
                      activeSection === "language" ? null : "language",
                    )
                  }
                  className="p-1"
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${activeSection === "language" ? "rotate-90" : ""}`}
                  />
                </Button>
              </div>

              {activeSection === "language" && (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => {
                        setLanguage(language);
                        onClose();
                      }}
                      className={`flex items-center p-2 rounded-lg text-left transition-colors ${
                        currentLanguage.code === language.code
                          ? "bg-blue-100 border border-blue-200"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span className="mr-2 text-lg">{language.flag}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">
                          {language.nativeName}
                        </span>
                      </div>
                      {currentLanguage.code === language.code && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            {isAuthenticated ? (
              <Button
                onClick={() => {
                  logout();
                  onClose();
                }}
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  Join thousands of users worldwide
                </p>
                <Link to="/register" onClick={onClose}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                    <Crown className="w-4 h-4 mr-2" />
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
