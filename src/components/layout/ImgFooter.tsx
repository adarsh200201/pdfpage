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
  ImageIcon,
} from "lucide-react";

const ImgFooter = () => {
  const currentYear = new Date().getFullYear();

  const imageTools = [
    { label: "Compress Image", href: "/img/compress" },
    { label: "Resize Image", href: "/img/resize" },
    { label: "JPG to PNG", href: "/img/jpg-to-png" },
    { label: "PNG to JPG", href: "/img/png-to-jpg" },
    { label: "Add Watermark", href: "/img/watermark" },
    { label: "Rotate Image", href: "/img/rotate" },
  ];

  const formats = [
    { label: "JPEG Converter", href: "/img/jpeg-converter" },
    { label: "PNG Converter", href: "/img/png-converter" },
    { label: "WebP Converter", href: "/img/webp-converter" },
    { label: "GIF Converter", href: "/img/gif-converter" },
    { label: "TIFF Converter", href: "/img/tiff-converter" },
    { label: "BMP Converter", href: "/img/bmp-converter" },
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
    { label: "Feature Requests", href: "/feature-requests" },
  ];

  const legal = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "GDPR", href: "/gdpr" },
    { label: "Security", href: "/security" },
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/img" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">
                Img<span className="text-blue-600">Page</span>
              </span>
            </Link>
            <p className="text-gray-600 text-sm mb-4">
              Professional image processing tools. Fast, secure, and free.
              Process your images with our comprehensive suite of online tools.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com"
                className="text-gray-400 hover:text-blue-500 transition-colors"
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
                className="text-gray-400 hover:text-blue-700 transition-colors"
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

          {/* Image Tools */}
          <div className="lg:col-span-1">
            <h3 className="text-gray-900 font-semibold mb-4">Image Tools</h3>
            <ul className="space-y-2">
              {imageTools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    to={tool.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Format Converters */}
          <div className="lg:col-span-1">
            <h3 className="text-gray-900 font-semibold mb-4">
              Format Converters
            </h3>
            <ul className="space-y-2">
              {formats.map((format) => (
                <li key={format.href}>
                  <Link
                    to={format.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  >
                    {format.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-1">
            <h3 className="text-gray-900 font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {company.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="lg:col-span-1">
            <h3 className="text-gray-900 font-semibold mb-4">Support</h3>
            <ul className="space-y-2 mb-6">
              {support.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-gray-900 font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm mb-4 md:mb-0">
              © {currentYear} ImgPage. All rights reserved.
            </div>

            {/* Contact Info */}
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <a
                  href="mailto:support@imgpage.com"
                  className="hover:text-blue-600"
                >
                  support@imgpage.com
                </a>
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                <span>Available in 25+ languages</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-8 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              SSL Encrypted
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              GDPR Compliant
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              SOC 2 Certified
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              ISO 27001
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ImgFooter;
