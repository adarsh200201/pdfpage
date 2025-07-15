import { useState, useEffect } from "react";
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
  ArrowRight,
  CheckCircle,
  Palette,
  Download,
  Crop,
} from "lucide-react";

const FaviconFooter = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isNewsletterSubmitted, setIsNewsletterSubmitted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Popular favicon tools data
  const popularTools = [
    { name: "Image to Favicon", icon: Image, href: "/img/favicon" },
    { name: "Text to Favicon", icon: Type, href: "/favicon/text" },
    { name: "Emoji to Favicon", icon: Smile, href: "/favicon/emoji" },
    { name: "Logo to Favicon", icon: Sparkles, href: "/favicon/logo" },
    { name: "Download Favicon", icon: Download, href: "/favicon/download" },
  ];

  // Resources links
  const resources = [
    { name: "Blog", href: "/blog" },
    { name: "API Documentation", href: "/api-docs" },
    { name: "Security", href: "/security" },
    { name: "Enterprise", href: "/enterprise" },
  ];

  // Support links
  const support = [
    { name: "Contact Us", href: "/contact" },
    { name: "Report Bug", href: "/report-bug" },
    { name: "Feature Request", href: "/feature-request" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsNewsletterSubmitted(true);
      setEmail("");
      setTimeout(() => setIsNewsletterSubmitted(false), 3000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Listen for scroll to show back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div
          className={
            'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] opacity-50'
          }
        ></div>

        <div className="relative z-10">
          {/* Main Footer Content */}
          <div className="py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Brand & About Column */}
                <div>
                  <Link
                    to="/favicon"
                    className="inline-flex items-center space-x-2 mb-4 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-xl text-white">
                        Favicon<span className="text-purple-400">Page</span>
                      </span>
                    </div>
                  </Link>

                  <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                    Create professional favicons for your website in seconds.
                    Fast, easy-to-use tools for developers and designers.
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Mail className="h-4 w-4" />
                      <a
                        href="mailto:Hipdfpage@gmail.com"
                        className="hover:text-purple-400 transition-colors"
                      >
                        Hipdfpage@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Popular Tools Column */}
                <div>
                  <h4 className="font-bold text-lg mb-4 text-white">
                    Popular Tools
                  </h4>
                  <div className="space-y-2">
                    {popularTools.map((tool) => (
                      <Link
                        key={tool.name}
                        to={tool.href}
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-purple-400 transition-all duration-200 group"
                      >
                        <tool.icon className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="group-hover:translate-x-1 transition-transform">
                          {tool.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Support Column */}
                <div>
                  <h4 className="font-bold text-lg mb-4 text-white">Support</h4>
                  <div className="space-y-2">
                    {support.map((link) => (
                      <Link
                        key={link.name}
                        to={link.href}
                        className="block text-sm text-gray-300 hover:text-purple-400 transition-colors duration-200 hover:translate-x-1 transform"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Social Column */}
                <div>
                  <h4 className="font-bold text-lg mb-4 text-white">
                    Follow Us
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {[
                      {
                        icon: Twitter,
                        href: "https://twitter.com/signup",
                        label: "Twitter",
                      },
                      {
                        icon: Facebook,
                        href: "https://facebook.com/login",
                        label: "Facebook",
                      },
                      {
                        icon: Linkedin,
                        href: "https://linkedin.com/signup",
                        label: "LinkedIn",
                      },
                      {
                        icon: Instagram,
                        href: "https://instagram.com/accounts/login/",
                        label: "Instagram",
                      },
                      {
                        icon: Youtube,
                        href: "https://youtube.com/signin",
                        label: "YouTube",
                      },
                    ].map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        className="text-gray-400 hover:text-purple-400 transition-all duration-200 transform hover:scale-110"
                        aria-label={social.label}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <social.icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>

                  {/* Additional Page Links */}
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <h5 className="font-semibold text-white mb-3 text-sm">
                      Resources
                    </h5>
                    <div className="space-y-2">
                      {resources.slice(0, 3).map((resource) => (
                        <Link
                          key={resource.name}
                          to={resource.href}
                          className="block text-xs text-gray-400 hover:text-purple-400 transition-colors"
                        >
                          {resource.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 py-6">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-gray-400 text-sm">
                  © {currentYear} G Initiations eServices Pvt. Ltd. All Rights
                  Reserved.
                </div>

                {/* Trust Badges */}
                <div className="mt-4 md:mt-0 flex items-center space-x-6 text-xs text-gray-500">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    SSL Encrypted
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    GDPR Compliant
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Developer Friendly
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-50"
          aria-label="Back to top"
        >
          <ArrowRight className="h-5 w-5 rotate-[-90deg]" />
        </button>
      )}
    </>
  );
};

export default FaviconFooter;
