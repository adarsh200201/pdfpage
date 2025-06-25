import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Globe,
  User,
  Crown,
  ImageIcon,
  Minimize2,
  Crop,
  RotateCw,
  Type,
  ChevronDown,
  LogOut,
  Settings,
  Palette,
  Scissors,
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

const ImgHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const { t } = useTranslation();

  const imageNavItems = [
    { label: t("img.compressImage"), href: "/img/compress" },
    { label: t("img.resizeImage"), href: "/img/resize" },
    { label: t("img.jpgToPng"), href: "/img/jpg-to-png" },
    { label: t("img.pngToJpg"), href: "/img/png-to-jpg" },
  ];

  const allImageTools = [
    {
      title: t("img.compressImage"),
      href: "/img/compress",
      icon: Minimize2,
      color: "from-blue-500 to-blue-600",
      description: "Reduce file size while maintaining quality",
    },
    {
      title: t("img.resizeImage"),
      href: "/img/resize",
      icon: Crop,
      color: "from-green-500 to-green-600",
      description: "Change image dimensions and scale",
    },
    {
      title: t("img.jpgToPng"),
      href: "/img/jpg-to-png",
      icon: ImageIcon,
      color: "from-purple-500 to-purple-600",
      description: "Convert JPEG images to PNG format",
    },
    {
      title: t("img.pngToJpg"),
      href: "/img/png-to-jpg",
      icon: ImageIcon,
      color: "from-orange-500 to-orange-600",
      description: "Convert PNG images to JPEG format",
    },
    {
      title: t("img.addWatermark"),
      href: "/img/watermark",
      icon: Type,
      color: "from-pink-500 to-pink-600",
      description: "Add text or image watermarks",
    },
    {
      title: t("img.rotateImage"),
      href: "/img/rotate",
      icon: RotateCw,
      color: "from-cyan-500 to-cyan-600",
      description: "Rotate images to any angle",
    },
    {
      title: "Crop Image",
      href: "/img/crop",
      icon: Scissors,
      color: "from-red-500 to-red-600",
      description: "Crop and trim images",
      isNew: true,
    },
    {
      title: "Enhance Colors",
      href: "/img/enhance",
      icon: Palette,
      color: "from-yellow-500 to-yellow-600",
      description: "Adjust brightness, contrast & saturation",
      isNew: true,
    },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/img" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <ImageIcon className="text-white font-bold text-sm w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-text-dark">
                Img<span className="text-blue-600">Page</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 relative">
            {imageNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-body-medium text-text-medium hover:text-blue-600 transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}

            {/* All Image Tools Button */}
            <button
              onClick={() => setShowMegaMenu(!showMegaMenu)}
              className="text-body-medium text-text-medium hover:text-blue-600 transition-colors duration-200 flex items-center"
            >
              {t("img.allImageTools")}
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {/* Back to PdfPage */}
            <Link
              to="/"
              className="text-body-medium text-text-medium hover:text-red-600 transition-colors duration-200 flex items-center"
            >
              {t("img.backToPdfPage")}
            </Link>

            {/* Favicon Generator */}
            <Link
              to="/favicon"
              className="text-body-medium text-text-medium hover:text-purple-600 transition-colors duration-200"
            >
              Favicon Generator
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center text-text-medium hover:text-blue-600 transition-colors duration-200 cursor-pointer">
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
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
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
                      {t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      {t("nav.settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="flex items-center">
                      <Crown className="w-4 h-4 mr-2" />
                      {t("nav.upgradeToPro")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Crown className="w-4 h-4 mr-2" />
                    {t("nav.getStarted")}
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
            {imageNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-body-medium text-text-medium hover:text-blue-600 transition-colors duration-200 block py-2"
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
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      size="sm"
                      className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      {t("nav.getStarted")}
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
                      {t("nav.dashboard")}
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
                    {t("nav.logout")}
                  </Button>
                </>
              )}

              {/* Mobile Language Selector */}
              <div className="pt-4 border-t border-gray-100 mt-4">
                <div className="flex items-center mb-2">
                  <Globe className="w-4 h-4 mr-2 text-text-medium" />
                  <span className="text-sm font-medium text-text-dark">
                    {t("nav.language")}
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

      {/* Mega Menu Overlay for Image Tools */}
      {showMegaMenu && (
        <div className="absolute top-full left-0 w-full bg-white shadow-2xl border-t border-gray-100 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allImageTools.map((tool, index) => {
                const IconComponent = tool.icon;
                return (
                  <Link
                    key={index}
                    to={tool.href}
                    className="group flex flex-col space-y-3 p-4 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                    onClick={() => setShowMegaMenu(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-text-dark group-hover:text-blue-600 transition-colors duration-200">
                            {tool.title}
                          </span>
                          {tool.isNew && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                      {tool.description}
                    </p>
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

export default ImgHeader;
