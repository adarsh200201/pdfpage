import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Youtube,
  ArrowRight,
  ChevronUp,
  Star,
  Download,
  FileText,
  Scissors,
  RotateCw,
  Merge,
  SplitSquareHorizontal,
  Shield,
  Zap,
  Users,
  Heart,
  MapPin,
  Phone,
  CheckCircle,
  Image,
  Star as Favicon,
} from "lucide-react";
import PdfPageLogo from "@/components/ui/PdfPageLogo";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isNewsletterSubmitted, setIsNewsletterSubmitted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const currentYear = new Date().getFullYear();

  // Popular tools data
  const popularTools = [
    { name: "Merge PDF", icon: Merge, href: "/merge" },
    { name: "Split PDF", icon: SplitSquareHorizontal, href: "/split" },
    { name: "Compress PDF", icon: Download, href: "/compress" },
    { name: "PDF to Word", icon: FileText, href: "/pdf-to-word" },
    { name: "Crop PDF", icon: Scissors, href: "/crop" },
  ];

  // Resources links
  const resources = [
    { name: "Blog", href: "/blog" },
    { name: "API Documentation", href: "/api-docs" },
    { name: "User Guide", href: "/guide" },
    { name: "Video Tutorials", href: "/tutorials" },
    { name: "FAQ", href: "/faq" },
    { name: "System Status", href: "/status" },
  ];

  // Company links
  const company = [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/careers" },
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

  // Customer testimonials
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      text: "PdfPage has streamlined our document workflow immensely!",
      rating: 5,
    },
    {
      name: "Michael Rodriguez",
      role: "Freelancer",
      text: "Fast, reliable, and exactly what I needed for my PDFs.",
      rating: 5,
    },
    {
      name: "Emily Watson",
      role: "Student",
      text: "The merge tool saved me hours on my research project.",
      rating: 5,
    },
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
                    to="/"
                    className="inline-flex items-center space-x-3 mb-4 group"
                  >
                    <PdfPageLogo
                      size="md"
                      variant="icon-only"
                      showHover={true}
                      useImage={true}
                      className="transform group-hover:scale-105 transition-all duration-200"
                    />
                    <div>
                      <span className="font-bold text-xl text-white">
                        Pdf
                        <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                          Page
                        </span>
                      </span>
                      <div className="text-xs text-gray-400 mt-0.5">
                        PDF Toolkit
                      </div>
                    </div>
                  </Link>

                  <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                    The ultimate PDF toolkit trusted by millions worldwide.
                    Fast, secure, and privacy-focused document processing.
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Mail className="h-4 w-4" />
                      <a
                        href="mailto:Hipdfpage@gmail.com"
                        className="hover:text-brand-red transition-colors"
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
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-brand-red transition-all duration-200 group"
                      >
                        <tool.icon className="h-4 w-4 text-brand-red group-hover:scale-110 transition-transform" />
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
                        className="block text-sm text-gray-300 hover:text-brand-red transition-colors duration-200 hover:translate-x-1 transform"
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
                        className="text-gray-400 hover:text-brand-red transition-all duration-200 transform hover:scale-110"
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
                      Tools
                    </h5>
                    <div className="space-y-2">
                      <Link
                        to="/img"
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-brand-red transition-colors duration-200 group"
                      >
                        <Image className="h-4 w-4 text-brand-red group-hover:scale-110 transition-transform" />
                        <span className="group-hover:translate-x-1 transition-transform">
                          Image Tools
                        </span>
                      </Link>
                      <Link
                        to="/favicon"
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-brand-red transition-colors duration-200 group"
                      >
                        <Favicon className="h-4 w-4 text-brand-red group-hover:scale-110 transition-transform" />
                        <span className="group-hover:translate-x-1 transition-transform">
                          Favicon Generator
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 bg-slate-900/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col lg:flex-row justify-between items-center space-y-3 lg:space-y-0">
                {/* Copyright */}
                <div className="text-gray-400 text-sm">
                  © 2025 G Initiations eServices Pvt. Ltd. All Rights Reserved.
                </div>

                {/* Powered by Cloud AI Badge */}
                <div className="flex items-center space-x-2 text-sm">
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-3 py-1.5 rounded-full border border-blue-500/30">
                    <Zap className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-blue-300 font-medium">Powered by Cloud AI</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-green-900/30 px-2 py-1 rounded-full border border-green-500/30">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-green-300 text-xs">Connected</span>
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
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-brand-red hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center group"
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />
        </button>
      )}
    </>
  );
};

export default Footer;
