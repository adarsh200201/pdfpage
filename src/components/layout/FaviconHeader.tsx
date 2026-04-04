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
  Type,
  Smile,
  Image,
  ChevronDown,
  LogOut,
  Settings,
  Palette,
  Sparkles,
  Check,
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

const FaviconHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const { t } = useTranslation();

  const firstName = user?.name
    ? user.name.split(" ")[0]
    : user?.email?.split("@")[0] || "User";

  const faviconNavItems = [
    { id: "image-favicon", label: "Image to Favicon", href: "/img/favicon" },
    { id: "logo-favicon", label: "Logo to Favicon", href: "/img/favicon" },
  ];

  const allFaviconTools = [
    {
      id: "image-favicon-tool",
      title: "Image to Favicon",
      href: "/img/favicon",
      icon: Image,
      color: "from-blue-500 to-blue-600",
      description: "Convert any image to favicon",
      isNew: false,
    },

    {
      id: "logo-favicon-tool",
      title: "Logo to Favicon",
      href: "/img/favicon",
      icon: Sparkles,
      color: "from-purple-500 to-purple-600",
      description: "Optimize logo for favicon",
      isNew: true,
    },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Modern Logo Design */}
          <div className="flex items-center">
            <Link to="/favicon" className="transition-all duration-300 hover:scale-105">
              <PdfPageLogo size="lg" showHover={true} useImage={true} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 relative">
            {faviconNavItems.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="text-body-medium text-text-medium hover:text-purple-600 transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}

            {/* All Favicon Tools Button */}
            <button
              onClick={() => setShowMegaMenu(!showMegaMenu)}
              className="text-body-medium text-text-medium hover:text-purple-600 transition-colors duration-200 flex items-center"
            >
              All Favicon Tools
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {/* Back to PdfPage */}
            <Link
              to="/img"
              className="text-body-medium text-text-medium hover:text-blue-600 transition-colors duration-200 flex items-center"
            >
              Back to PdfPage
            </Link>

            {/* Back to PdfPage */}
            <Link
              to="/"
              className="text-body-medium text-text-medium hover:text-red-600 transition-colors duration-200 flex items-center"
            >
              Back to PdfPage
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
  

            {/* User Actions */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden md:flex items-center space-x-3 px-3 py-2 hover:bg-gray-50/80 rounded-xl transition-all duration-300 group">
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-r from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm -z-10" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{firstName}</p>
                    <p className="text-xs text-gray-500">User</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-text-medium hover:text-purple-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mega Menu for All Favicon Tools */}
        {showMegaMenu && (
          <div className="absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {allFaviconTools.map((tool) => (
                  <Link
                    key={tool.id}
                    to={tool.href}
                    className="group p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setShowMegaMenu(false)}
                  >
                    <div className="flex items-center mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-r ${tool.color} flex items-center justify-center mr-3`}
                      >
                        <tool.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">
                          {tool.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{tool.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {faviconNavItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-text-medium hover:text-purple-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/img"
                className="block px-3 py-2 text-base font-medium text-text-medium hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Back to PdfPage
              </Link>
              <Link
                to="/"
                className="block px-3 py-2 text-base font-medium text-text-medium hover:text-red-600 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Back to PdfPage
              </Link>

              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="block px-3 py-2 text-base font-medium text-text-medium hover:text-purple-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default FaviconHeader;
