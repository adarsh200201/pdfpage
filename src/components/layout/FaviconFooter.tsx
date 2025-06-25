import { Link } from "react-router-dom";
import {
  Globe,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Youtube,
  Image,
  Type,
  Smile,
  Sparkles,
} from "lucide-react";

const FaviconFooter = () => {
  const currentYear = new Date().getFullYear();

  const faviconTools = [
    {
      id: "image-favicon-footer",
      label: "Image to Favicon",
      href: "/img/favicon",
    },
    {
      id: "text-favicon-footer",
      label: "Text to Favicon",
      href: "/img/favicon",
    },
    {
      id: "emoji-favicon-footer",
      label: "Emoji to Favicon",
      href: "/img/favicon",
    },
    {
      id: "logo-favicon-footer",
      label: "Logo to Favicon",
      href: "/img/favicon",
    },
    {
      id: "favicon-sizes-footer",
      label: "Favicon Sizes",
      href: "/img/favicon",
    },
    {
      id: "ico-converter-footer",
      label: "ICO Converter",
      href: "/img/favicon",
    },
  ];

  const faviconFormats = [
    { id: "16x16-favicon", label: "16x16 Favicon", href: "/img/favicon" },
    { id: "32x32-favicon", label: "32x32 Favicon", href: "/img/favicon" },
    { id: "48x48-favicon", label: "48x48 Favicon", href: "/img/favicon" },
    { id: "64x64-favicon", label: "64x64 Favicon", href: "/img/favicon" },
    { id: "apple-touch-icon", label: "Apple Touch Icon", href: "/img/favicon" },
    { id: "android-icon", label: "Android Icon", href: "/img/favicon" },
  ];

  const company = [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Press", href: "/press" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
    { label: "Affiliate Program", href: "/affiliate" },
  ];

  const support = [
    { label: "Help Center", href: "/help" },
    { label: "Contact Support", href: "/contact" },
    { label: "API Documentation", href: "/api-docs" },
    { label: "System Status", href: "/status" },
    { label: "FAQ", href: "/faq" },
    { label: "Tutorials", href: "/tutorials" },
  ];

  const legal = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "GDPR", href: "/gdpr" },
  ];

  const relatedTools = [
    { label: "PDF Tools", href: "/" },
    { label: "Image Tools", href: "/img" },
    { label: "Compress Image", href: "/img/compress" },
    { label: "Resize Image", href: "/img/resize" },
    { label: "Convert Images", href: "/img/convert" },
    { label: "Add Watermark", href: "/img/watermark" },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="text-white font-bold text-sm w-5 h-5" />
              </div>
              <span className="font-bold text-xl">
                Favicon<span className="text-purple-400">Generator</span>
              </span>
            </div>
            <p className="text-gray-300 mb-6 max-w-sm">
              Create professional favicons for your website with our
              comprehensive favicon generator. Convert images, text, emojis, and
              logos into perfect favicon files.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-gray-400">
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-sm">support@favicongen.com</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="w-4 h-4 mr-2" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">San Francisco, CA</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a
                href="https://twitter.com"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                className="text-gray-400 hover:text-blue-600 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                className="text-gray-400 hover:text-blue-500 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                className="text-gray-400 hover:text-pink-500 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                className="text-gray-400 hover:text-red-500 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Favicon Tools */}
          <div className="lg:col-span-1">
            <h3 className="text-gray-100 font-semibold mb-4">Favicon Tools</h3>
            <ul className="space-y-2">
              {faviconTools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    to={tool.href}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Favicon Formats */}
          <div className="lg:col-span-1">
            <h3 className="text-gray-100 font-semibold mb-4">
              Favicon Formats
            </h3>
            <ul className="space-y-2">
              {faviconFormats.map((format) => (
                <li key={format.id}>
                  <Link
                    to={format.href}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
                  >
                    {format.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Related Tools */}
          <div className="lg:col-span-1">
            <h3 className="text-gray-100 font-semibold mb-4">Related Tools</h3>
            <ul className="space-y-2">
              {relatedTools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    to={tool.href}
                    className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="lg:col-span-1">
            <h3 className="text-gray-100 font-semibold mb-4">Support</h3>
            <ul className="space-y-2 mb-6">
              {support.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-gray-100 font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Image className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-2">From Image</h4>
              <p className="text-gray-400 text-sm">
                Convert any image to professional favicon
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Type className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-2">From Text</h4>
              <p className="text-gray-400 text-sm">
                Create custom text-based favicons
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smile className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-2">From Emoji</h4>
              <p className="text-gray-400 text-sm">
                Turn emojis into fun favicons
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-2">From Logo</h4>
              <p className="text-gray-400 text-sm">
                Optimize logos for perfect favicons
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">
                © {currentYear} FaviconGenerator. All rights reserved.
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 text-sm">Powered by</span>
                <Link
                  to="/"
                  className="text-red-400 hover:text-red-300 text-sm font-semibold"
                >
                  PdfPage
                </Link>
                <span className="text-gray-400">•</span>
                <Link
                  to="/img"
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                >
                  ImgPage
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">
                Made with ❤️ for developers
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FaviconFooter;
