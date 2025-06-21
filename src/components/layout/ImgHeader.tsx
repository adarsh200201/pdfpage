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

const ImgHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();

  const imageNavItems = [
    { label: "Compress Image", href: "/img/compress" },
    { label: "Resize Image", href: "/img/resize" },
    { label: "Convert JPG to PNG", href: "/img/jpg-to-png" },
    { label: "Convert PNG to JPG", href: "/img/png-to-jpg" },
  ];

  const allImageTools = [
    {
      title: "Compress Image",
      href: "/img/compress",
      icon: Minimize2,
      color: "from-blue-500 to-blue-600",
      description: "Reduce file size while maintaining quality",
    },
    {
      title: "Resize Image",
      href: "/img/resize",
      icon: Crop,
      color: "from-green-500 to-green-600",
      description: "Change image dimensions and scale",
    },
    {
      title: "JPG to PNG",
      href: "/img/jpg-to-png",
      icon: ImageIcon,
      color: "from-purple-500 to-purple-600",
      description: "Convert JPEG images to PNG format",
    },
    {
      title: "PNG to JPG",
      href: "/img/png-to-jpg",
      icon: ImageIcon,
      color: "from-orange-500 to-orange-600",
      description: "Convert PNG images to JPEG format",
    },
    {
      title: "Add Watermark",
      href: "/img/watermark",
      icon: Type,
      color: "from-pink-500 to-pink-600",
      description: "Add text or image watermarks",
    },
    {
      title: "Rotate Image",
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
              All Image Tools
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {/* Back to PdfPage */}
            <Link
              to="/"
              className="text-body-medium text-text-medium hover:text-red-600 transition-colors duration-200 flex items-center"
            >
              Back to PdfPage
            </Link>

            {/* Get Premium */}
            <Link
              to="/pricing"
              className="text-body-medium text-text-medium hover:text-blue-600 transition-colors duration-200"
            >
              Get Premium
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden md:flex items-center text-text-medium hover:text-blue-600 transition-colors duration-200">
                <Globe className="w-4 h-4 mr-1" />
                EN
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>🇺🇸 English</DropdownMenuItem>
                <DropdownMenuItem>🇪🇸 Español</DropdownMenuItem>
                <DropdownMenuItem>🇫🇷 Français</DropdownMenuItem>
                <DropdownMenuItem>🇩🇪 Deutsch</DropdownMenuItem>
                <DropdownMenuItem>🇮🇹 Italiano</DropdownMenuItem>
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
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
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
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      size="sm"
                      className="w-full justify-start bg-blue-600 hover:bg-blue-700"
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
