import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AdSense from "@/components/ads/AdSense";
import { PromoBanner } from "@/components/ui/promo-banner";
import AdvancedSEO from "@/components/AdvancedSEO";
import CriticalCSS from "@/components/CriticalCSS";
import { useRealTimeStats } from "@/hooks/useRealTimeStats";
import { useMixpanel } from "@/hooks/useMixpanel";
import { getSEOData } from "@/data/seo-routes";
import {
  Combine,
  Scissors,
  Minimize,
  FileText,
  FileImage,
  ImageIcon,
  Shield,
  Zap,
  Users,
  Crown,
  CheckCircle,
  Star,
  ArrowRight,
  Globe,
  Smartphone,
  Cloud,
  Lock,
  Clock,
  Download,
  Upload,
  Sparkles,
  TrendingUp,
  Award,
  Heart,
  Play,
  Layers,
  Eye,
} from "lucide-react";
// import GoogleOAuthTest from "@/components/GoogleOAuthTest";

// Performance optimized components - keeping sections inline for better maintainability

// Optimized Counter Component with Intersection Observer
const AnimatedCounter = ({
  end,
  duration = 2000,
  suffix = "",
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  // Start animation when element comes into view
  useEffect(() => {
    const timer = setTimeout(() => setHasStarted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// Floating elements animation
const FloatingElement = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <div
    className="animate-bounce"
    style={{
      animationDelay: `${delay}s`,
      animationDuration: "3s",
    }}
  >
    {children}
  </div>
);

const Index = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const mixpanel = useMixpanel();

  // Track homepage visit in real-time (deferred for performance)
  useEffect(() => {
    // Defer analytics to avoid blocking critical rendering
    const timer = setTimeout(() => {
      mixpanel.trackPageView("Homepage", {
        page_title: "PdfPage - The Ultimate PDF Toolkit",
        visitor_type: "homepage_visitor",
        timestamp: new Date().toISOString(),
      });

      // Track engagement event
      mixpanel.trackEngagement("homepage_loaded", {
        load_time: Date.now(),
        user_agent: navigator.userAgent,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [mixpanel]);

  // Smooth scroll to tools section
  const scrollToTools = () => {
    const toolsSection = document.getElementById("tools");
    if (toolsSection) {
      toolsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const pdfTools = [
    {
      title: "Merge PDF",
      description:
        "Combine PDFs in the order you want with the easiest PDF merger available.",
      icon: Combine,
      href: "/merge",
      color: "from-blue-500 to-blue-600",
      available: true,
      isWorking: true,
      popular: true,
    },
    {
      title: "Split PDF",
      description:
        "Separate one page or a whole set for easy conversion into independent PDF files.",
      icon: Scissors,
      href: "/split",
      color: "from-green-500 to-green-600",
      available: true,
      isWorking: true,
    },
    {
      title: "Compress PDF",
      description: "Reduce file size while optimizing for maximal PDF quality.",
      icon: Minimize,
      href: "/compress",
      color: "from-purple-500 to-purple-600",
      available: true,
      isWorking: true,
      popular: true,
    },
    {
      title: "Rotate PDF",
      description: "Rotate your PDF pages to the correct orientation.",
      icon: ArrowRight,
      href: "/rotate-pdf",
      color: "from-teal-500 to-teal-600",
      available: true,
      isWorking: true,
    },
    {
      title: "PDF to Word",
      description:
        "Easily convert your PDF files into easy to edit DOC and DOCX documents.",
      icon: FileText,
      href: "/pdf-to-word",
      color: "from-orange-500 to-orange-600",
      available: true,
      isWorking: true,
      isNew: true,
    },
    {
      title: "PDF to PowerPoint",
      description:
        "Turn your PDF files into easy to edit PPT and PPTX slideshows.",
      icon: FileText,
      href: "/pdf-to-powerpoint",
      color: "from-red-500 to-red-600",
      available: true,
      isWorking: true,
      isNew: true,
    },
    {
      title: "PDF to Excel",
      description:
        "Pull data straight from PDFs into Excel spreadsheets in seconds.",
      icon: FileText,
      href: "/pdf-to-excel",
      color: "from-emerald-500 to-emerald-600",
      available: true,
      isWorking: true,
      isNew: true,
    },
    {
      title: "Word to PDF",
      description:
        "Make DOC and DOCX files easy to read by converting them to PDF.",
      icon: FileText,
      href: "/word-to-pdf",
      color: "from-blue-600 to-blue-700",
      available: true,
      isWorking: true,
    },
    {
      title: "PowerPoint to PDF",
      description:
        "Make PPT and PPTX slideshows easy to view by converting them to PDF.",
      icon: FileText,
      href: "/powerpoint-to-pdf",
      color: "from-red-600 to-red-700",
      available: true,
      isWorking: true,
    },
    {
      title: "Excel to PDF",
      description:
        "Make EXCEL spreadsheets easy to read by converting them to PDF.",
      icon: FileText,
      href: "/excel-to-pdf",
      color: "from-emerald-600 to-emerald-700",
      available: true,
      isWorking: true,
    },
    {
      title: "Edit PDF",
      description:
        "Add text, images, shapes, and signatures to your PDF documents.",
      icon: FileText,
      href: "/edit-pdf",
      color: "from-indigo-500 to-indigo-600",
      isNew: true,
      popular: true,
      available: true,
      isWorking: true,
    },

    {
      title: "PDF to JPG",
      description:
        "Convert each PDF page into a JPG or extract all images contained in a PDF.",
      icon: FileImage,
      href: "/pdf-to-jpg",
      color: "from-pink-500 to-pink-600",
      available: true,
      isWorking: true,
    },
    {
      title: "JPG to PDF",
      description:
        "Convert JPG, PNG, BMP, GIF and TIFF images to PDF in seconds.",
      icon: FileImage,
      href: "/jpg-to-pdf",
      color: "from-pink-600 to-pink-700",
      available: true,
      isWorking: true,
    },
    {
      title: "Sign PDF",
      description:
        "Draw, type, or upload your signature and apply it to PDF documents.",
      icon: FileText,
      href: "/sign-pdf",
      color: "from-violet-500 to-violet-600",
      available: true,
      isWorking: true,
    },

    {
      title: "Unlock PDF",
      description: "Remove password protection from your PDF files securely.",
      icon: Lock,
      href: "/unlock-pdf",
      color: "from-lime-500 to-lime-600",
      available: true,
      isWorking: true,
    },
    {
      title: "Protect PDF",
      description:
        "Add password protection and encryption to secure your PDF files.",
      icon: Shield,
      href: "/protect-pdf",
      color: "from-red-500 to-red-600",
      available: true,
      isWorking: true,
    },

    {
      title: "HTML to PDF",
      description: "Convert HTML files and web pages into PDF documents.",
      icon: FileText,
      href: "/html-to-pdf",
      color: "from-amber-500 to-amber-600",
      available: true,
      isWorking: true,
    },

    {
      title: "Page Numbers",
      description: "Add customizable page numbers to your PDF documents.",
      icon: FileText,
      href: "/page-numbers",
      color: "from-purple-600 to-purple-700",
      available: true,
      isWorking: true,
    },
    {
      title: "Scan to PDF",
      description: "Capture document scans and convert them to PDF format.",
      icon: FileText,
      href: "/scan-to-pdf",
      color: "from-green-600 to-green-700",
      available: true,
      isWorking: true,
      isNew: true,
    },
    {
      title: "OCR PDF",
      description:
        "Extract text from scanned PDFs using optical character recognition.",
      icon: FileText,
      href: "/ocr-pdf",
      color: "from-blue-700 to-blue-800",
      available: true,
      isWorking: true,
      isNew: true,
    },

    {
      title: "Crop PDF",
      description: "Crop margins and select specific areas of your PDF pages.",
      icon: Scissors,
      href: "/crop-pdf",
      color: "from-green-700 to-green-800",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "Text to PDF",
      description:
        "Convert text files and CSV documents to PDF using LibreOffice.",
      icon: FileText,
      href: "/text-to-pdf",
      color: "from-slate-600 to-slate-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "ODT to PDF",
      description: "Convert OpenDocument Text files to PDF with LibreOffice.",
      icon: FileText,
      href: "/odt-to-pdf",
      color: "from-cyan-600 to-cyan-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "RTF to PDF",
      description:
        "Convert Rich Text Format documents to PDF using LibreOffice.",
      icon: FileText,
      href: "/rtf-to-pdf",
      color: "from-pink-600 to-pink-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "CSV to XLSX",
      description: "Convert CSV files to Excel XLSX format with LibreOffice.",
      icon: FileText,
      href: "/csv-to-xlsx",
      color: "from-teal-600 to-teal-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "ODT to DOCX",
      description: "Convert OpenDocument Text to Word DOCX format.",
      icon: FileText,
      href: "/odt-to-docx",
      color: "from-indigo-600 to-indigo-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "RTF to DOCX",
      description: "Convert Rich Text Format to Word DOCX documents.",
      icon: FileText,
      href: "/rtf-to-docx",
      color: "from-violet-600 to-violet-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "DOCX to ODT",
      description: "Convert Word DOCX to OpenDocument Text format.",
      icon: FileText,
      href: "/docx-to-odt",
      color: "from-rose-600 to-rose-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "XLS to CSV",
      description: "Convert Excel XLS files to CSV format using LibreOffice.",
      icon: FileText,
      href: "/xls-to-csv",
      color: "from-amber-600 to-amber-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "XLSX to ODS",
      description: "Convert Excel XLSX to OpenDocument Spreadsheet format.",
      icon: FileText,
      href: "/xlsx-to-ods",
      color: "from-lime-600 to-lime-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "PPTX to ODP",
      description: "Convert PowerPoint PPTX to OpenDocument Presentation.",
      icon: FileText,
      href: "/pptx-to-odp",
      color: "from-orange-600 to-orange-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "PPTX to PNG",
      description: "Export PowerPoint slides as PNG images using LibreOffice.",
      icon: FileText,
      href: "/pptx-to-png",
      color: "from-fuchsia-600 to-fuchsia-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
    {
      title: "DOC to ODT",
      description: "Convert legacy Word DOC to OpenDocument Text format.",
      icon: FileText,
      href: "/doc-to-odt",
      color: "from-sky-600 to-sky-700",
      isNew: true,
      available: true,
      isWorking: true,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Manager",
      company: "TechCorp",
      content:
        "PdfPage has revolutionized how our team handles documents. The merge and split tools save us hours every week!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
    },
    {
      name: "Michael Chen",
      role: "Small Business Owner",
      company: "Chen's Consulting",
      content:
        "As a consultant, I work with PDFs daily. The conversion tools are incredibly accurate and fast. Highly recommended!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
    },
    {
      name: "Emily Rodriguez",
      role: "Student",
      company: "University of California",
      content:
        "Free, fast, and reliable. Perfect for academic work. The compress tool helped me submit assignments under size limits!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
    },
  ];

  // Use real-time stats instead of dummy data
  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    lastUpdated,
    refresh: refreshStats,
  } = useRealTimeStats({
    fileText: FileText,
    users: Users,
    globe: Globe,
    shield: Shield,
  });

  // Auto-rotate testimonials (deferred for performance)
  useEffect(() => {
    // Start testimonial rotation after initial load
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }, 2000);

    return () => clearTimeout(startDelay);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Critical CSS for immediate render */}
      <CriticalCSS />

      {/* Performance Optimization: Preload critical resources */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://images.unsplash.com" />
      <link rel="dns-prefetch" href="https://cdn.builder.io" />

      <AdvancedSEO
        {...getSEOData("/")}
        contentType="landing"
        enablePreconnect={true}
        enablePrefetch={true}
        criticalCSS={true}
        lastModified="2025-01-24T12:00:00Z"
      />
      <Header />

      {/* Promotional Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <PromoBanner />
      </div>

      {/* Enhanced Modern Hero Section */}
      <section className="relative pt-6 pb-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 overflow-hidden">
        {/* Advanced Background Elements */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute top-1/4 right-1/6 w-72 h-72 bg-gradient-to-br from-brand-red/15 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 left-1/6 w-56 h-56 bg-gradient-to-br from-blue-500/15 to-purple-600/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-1/2 right-1/3 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/10 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-20 w-4 h-4 bg-yellow-400/30 rounded-full animate-bounce" style={{ animationDelay: "1s" }}></div>
          <div className="absolute bottom-32 right-32 w-6 h-6 bg-purple-400/30 rounded-square animate-bounce" style={{ animationDelay: "3s" }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Enhanced Trust Badge with AI mention */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60 rounded-full px-6 py-3 mb-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current animate-pulse" />
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" style={{ animationDelay: "0.3s" }} />
              </div>
              <span className="text-sm font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                🚀 Trusted by 2M+ users • AI-Powered Processing
              </span>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" style={{ animationDelay: "0.6s" }} />
                <Star className="w-4 h-4 text-yellow-500 fill-current animate-pulse" style={{ animationDelay: "0.9s" }} />
              </div>
            </div>

            {/* Enhanced Main Headline with Modern Naming */}
            <div className="relative mb-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-gray-900 leading-tight tracking-tight">
                The{" "}
                <span className="relative inline-block group">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red via-red-600 to-orange-600 animate-gradient-x">
                    Smart PDF Studio
                  </span>
                  {/* Animated underline with glow */}
                  <div className="absolute -bottom-3 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-red/70 via-red-600 to-orange-600/70 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 shadow-lg"></div>
                  {/* Glow effect */}
                  <div className="absolute -bottom-3 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-red/40 via-red-600/40 to-orange-600/40 rounded-full blur-sm transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                </span>
              </h1>

              {/* Enhanced floating elements */}
              <div
                className="absolute -top-8 left-1/4 opacity-70 animate-bounce"
                style={{ animationDelay: "1s" }}
              >
                <div className="relative">
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                  <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-lg animate-pulse"></div>
                </div>
              </div>
              <div
                className="absolute -top-6 right-1/4 opacity-70 animate-bounce"
                style={{ animationDelay: "2s" }}
              >
                <div className="relative">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                  <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-lg animate-pulse"></div>
                </div>
              </div>
              <div
                className="absolute -bottom-4 left-1/3 opacity-60 animate-bounce"
                style={{ animationDelay: "3s" }}
              >
                <div className="relative">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-md animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Subtitle with Tech Keywords */}
            <div className="mb-6">
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 mb-4 max-w-5xl mx-auto leading-relaxed px-4 font-medium">
                AI-powered PDF processing with{" "}
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-600">
                  instant conversion
                </span>
                ,{" "}
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  smart editing
                </span>
                , and{" "}
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  cloud sync
                </span>
              </p>
              <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-4">
                <span className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <Shield className="w-5 h-5 text-green-500" />
                  No downloads
                </span>
                {" • "}
                <span className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <Zap className="w-5 h-5 text-blue-500" />
                  No registration
                </span>
                {" • "}
                <span className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <Heart className="w-5 h-5 text-red-500" />
                  100% free
                </span>
              </p>
            </div>

            {/* Gradient separator */}
            <div className="flex justify-center mb-6">
              <div className="w-96 h-1 bg-gradient-to-r from-transparent via-brand-red/50 to-transparent rounded-full shadow-lg"></div>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-6 px-4">
              <Button
                size="lg"
                className="group relative bg-gradient-to-r from-brand-red via-red-600 to-orange-600 hover:from-red-600 hover:via-red-700 hover:to-orange-700 text-white px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 overflow-hidden w-full sm:w-auto border-2 border-red-500/20"
                onClick={scrollToTools}
              >
                {/* Enhanced shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>

                <Upload className="mr-3 h-6 w-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                <span className="relative z-10">🚀 Start Creating</span>
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="group border-2 border-gray-300 hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl font-bold rounded-2xl transition-all duration-300 hover:shadow-xl w-full sm:w-auto bg-white/80 backdrop-blur-sm"
                asChild
              >
                <Link to="/about">
                  <Play className="mr-3 h-6 w-6 group-hover:scale-110 group-hover:text-blue-600 transition-all duration-300" />
                  <span className="group-hover:text-blue-600 transition-colors duration-300">
                    ✨ Watch Magic
                  </span>
                </Link>
              </Button>
            </div>

            {/* Enhanced Feature Grid with Modern Icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="group flex flex-col items-center p-4 rounded-3xl hover:bg-white/70 hover:shadow-xl transition-all duration-300 border border-transparent hover:border-green-200/50">
                <div className="relative w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <Shield className="h-7 w-7 text-green-600" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-green-400/20 rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-green-700 transition-colors duration-300 text-center">
                  🔒 Bank-Level Security
                </span>
              </div>

              <div className="group flex flex-col items-center p-4 rounded-3xl hover:bg-white/70 hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-200/50">
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-100 to-sky-200 rounded-3xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <Zap className="h-7 w-7 text-blue-600" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-blue-400/20 rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700 transition-colors duration-300 text-center">
                  ⚡ AI-Fast Processing
                </span>
              </div>

              <div className="group flex flex-col items-center p-4 rounded-3xl hover:bg-white/70 hover:shadow-xl transition-all duration-300 border border-transparent hover:border-purple-200/50">
                <div className="relative w-14 h-14 bg-gradient-to-br from-purple-100 to-violet-200 rounded-3xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <Cloud className="h-7 w-7 text-purple-600" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-purple-400/20 rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-purple-700 transition-colors duration-300 text-center">
                  ☁️ Smart Cloud Sync
                </span>
              </div>

              <div className="group flex flex-col items-center p-4 rounded-3xl hover:bg-white/70 hover:shadow-xl transition-all duration-300 border border-transparent hover:border-orange-200/50">
                <div className="relative w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-200 rounded-3xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <Sparkles className="h-7 w-7 text-orange-600" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-orange-400/20 rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-orange-700 transition-colors duration-300 text-center">
                  ✨ AI Magic Tools
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Enhanced Modern Stats Section */}
      <section className="pt-4 pb-6 bg-gradient-to-r from-white via-gray-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-red/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200/60 rounded-full px-4 py-2 shadow-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-gray-700">Live Performance Metrics</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group relative">
                {/* Background card with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100"></div>

                <div className="relative p-6 rounded-3xl transition-all duration-300">
                  {/* Enhanced icon container */}
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-brand-red/10 via-red-500/15 to-orange-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg relative overflow-hidden">
                    {/* Icon glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-red/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                    <stat.icon className="h-8 w-8 text-brand-red relative z-10" />
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl"></div>
                  </div>

                  {/* Enhanced number display */}
                  <div className="text-3xl lg:text-4xl font-black text-gray-900 mb-2 group-hover:text-brand-red transition-colors duration-300">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-10 w-20 mx-auto rounded-lg"></div>
                    ) : (
                      <div className="relative">
                        <AnimatedCounter end={stat.number} suffix={stat.suffix} />
                        {/* Number glow effect on hover */}
                        <div className="absolute inset-0 text-brand-red/50 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <AnimatedCounter end={stat.number} suffix={stat.suffix} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced label */}
                  <div className="text-sm text-gray-600 font-bold uppercase tracking-wide group-hover:text-gray-800 transition-colors duration-300">
                    {stat.label}
                  </div>

                  {/* Progress bar decoration */}
                  <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-red to-orange-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                      style={{ transitionDelay: `${index * 100}ms` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {statsError && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                <Eye className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-700 font-medium">
                  {statsError} ⚠️ Showing cached data
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* Enhanced PDF Tools Grid */}
      <section
        id="tools"
        className="py-12 bg-gradient-to-b from-white to-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Professional PDF Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our comprehensive suite of PDF processing tools. All
              tools work directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {pdfTools.map((tool, index) => {
              const IconComponent = tool.icon;

              const handleToolClick = () => {
                // Track tool click in real-time
                mixpanel.trackToolUsage(
                  tool.href.replace("/", ""),
                  "homepage_click",
                  {
                    tool_title: tool.title,
                    tool_description: tool.description,
                    from_page: "homepage",
                    click_timestamp: new Date().toISOString(),
                    tool_index: index,
                  },
                );
              };

              return (
                <Link
                  key={tool.href}
                  to={tool.href}
                  className="group relative"
                  onClick={handleToolClick}
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4 sm:p-6">
                      {/* Badges */}
                      <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                        {tool.available && (
                          <Badge className="bg-green-500 text-white text-xs font-bold">
                            Live
                          </Badge>
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}
                      >
                        {IconComponent && (
                          <IconComponent className="w-7 h-7 text-white" />
                        )}
                      </div>

                      {/* Content */}
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-brand-red transition-colors duration-200">
                        {tool.title}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        {tool.description}
                      </p>

                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-red/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Favicon Tools Promotion Section */}
      <section className="py-8 sm:py-12 bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-4 sm:mb-6 bg-purple-600/10 text-purple-600 border-purple-600/20 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2">
              🌟 NEW: Professional Favicon Generator
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
              Create Perfect Favicons
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Generate professional favicon files from images, text, emojis, or
              logos. Get all sizes for web, iOS, and Android with one click.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-2xl">
                    <Globe className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                  Complete Favicon Package
                </h3>
                <div className="space-y-3">
                  {[
                    "Image to favicon conversion",
                    "Text to favicon generator",
                    "Emoji to favicon creator",
                    "Logo optimization",
                    "All platform sizes (8 formats)",
                    "PWA manifest generation",
                    "HTML code included",
                    "Instant batch download",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { icon: "🖼️", title: "From Image", desc: "Upload any image" },
                  {
                    icon: "✍️",
                    title: "From Text",
                    desc: "Custom fonts & colors",
                  },
                  { icon: "😀", title: "From Emoji", desc: "Fun & creative" },
                  { icon: "⭐", title: "From Logo", desc: "Professional look" },
                ].map((tool, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 sm:p-4 rounded-xl shadow-sm text-center"
                  >
                    <div className="text-xl sm:text-2xl mb-2">{tool.icon}</div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      {tool.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">{tool.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/favicon">
                  <Button
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Explore Favicon Tools
                  </Button>
                </Link>
                <Link to="/img/favicon">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Creating
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdSense
            adSlot="1234567890"
            adFormat="horizontal"
            className="max-w-4xl mx-auto"
          />
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full" />
          <div className="absolute bottom-20 right-20 w-32 h-32 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-16 h-16 border border-white/20 rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Why Choose PdfPage?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built for speed, security, and simplicity. Experience the
              difference with our cutting-edge technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Bank-Level Security</h3>
              <p className="text-gray-300 leading-relaxed">
                Your files are protected with 256-bit SSL encryption and
                automatically deleted after processing. Zero data retention
                policy.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Lightning Fast</h3>
              <p className="text-gray-300 leading-relaxed">
                Powered by cutting-edge cloud infrastructure. Process files in
                seconds, not minutes. Optimized for speed and reliability.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Works Everywhere</h3>
              <p className="text-gray-300 leading-relaxed">
                No downloads or installations. Works perfectly on desktop,
                tablet, and mobile. Cross-platform compatibility guaranteed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Loved by Millions
            </h2>
            <p className="text-xl text-gray-600">
              See what our users are saying about PdfPage
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-8 lg:p-12">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map(
                      (_, i) => (
                        <Star
                          key={i}
                          className="w-6 h-6 text-yellow-500 fill-current"
                        />
                      ),
                    )}
                  </div>

                  <blockquote className="text-2xl lg:text-3xl font-medium text-gray-900 mb-8 leading-relaxed">
                    "{testimonials[currentTestimonial].content}"
                  </blockquote>

                  <div className="flex items-center justify-center gap-4">
                    <img
                      src={testimonials[currentTestimonial].avatar}
                      alt={testimonials[currentTestimonial].name}
                      className="w-16 h-16 rounded-full"
                      loading="lazy"
                    />
                    <div className="text-left">
                      <div className="font-bold text-gray-900 text-lg">
                        {testimonials[currentTestimonial].name}
                      </div>
                      <div className="text-gray-600">
                        {testimonials[currentTestimonial].role} at{" "}
                        {testimonials[currentTestimonial].company}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial Indicators */}
            <div className="flex justify-center mt-8 gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                    index === currentTestimonial
                      ? "bg-brand-red"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ImgPage Promotion Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-blue-600/10 text-blue-600 border-blue-600/20 text-sm px-4 py-2">
              🎨 NEW: Image Tools Available
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Introducing PdfPage Image Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The same powerful experience you love for PDFs, now available for
              image processing. Compress, resize, convert, and enhance your
              images with professional tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: "🗜️", title: "Compress", desc: "Reduce file sizes" },
                  { icon: "📏", title: "Resize", desc: "Perfect dimensions" },
                  { icon: "🔄", title: "Convert", desc: "JPG ↔ PNG" },
                  { icon: "💧", title: "Watermark", desc: "Protect your work" },
                ].map((tool, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-xl shadow-sm text-center"
                  >
                    <div className="text-2xl mb-2">{tool.icon}</div>
                    <h3 className="font-semibold text-gray-900">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-600">{tool.desc}</p>
                  </div>
                ))}
              </div>

              <Link to="/img">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Try Image Tools
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
                    <ImageIcon className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                  Professional Image Tools
                </h3>
                <div className="space-y-3">
                  {[
                    "12+ image processing tools",
                    "Batch processing support",
                    "Lossless quality compression",
                    "Social media presets",
                    "Watermark protection",
                    "Format conversion (JPG, PNG, WebP)",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-12 bg-gradient-to-r from-brand-red to-red-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Get Premium Power
              </h2>
              <p className="text-xl text-white mb-8 leading-relaxed font-medium">
                Unlock unlimited processing, advanced features, and priority
                support. Perfect for businesses and power users.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[
                  "Unlimited file processing",
                  "No ads or interruptions",
                  "Batch file processing",
                  "OCR text recognition",
                  "Priority customer support",
                  "Advanced file security",
                ].map((feature) => (
                  <div key={feature} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                    <span className="text-white font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-brand-red hover:bg-gray-100 font-bold px-8 py-4"
                  asChild
                >
                  <Link to="/pricing">
                    <Crown className="mr-2 h-5 w-5" />
                    Get Premium Now
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-8 py-4 font-bold shadow-xl bg-red-50/80 backdrop-blur-sm"
                  asChild
                >
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="text-center">
                  <Crown className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4">Premium Features</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center justify-between py-2 border-b border-white/20">
                      <span>File Size Limit</span>
                      <span className="font-bold">Unlimited</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/20">
                      <span>Processing Speed</span>
                      <span className="font-bold">5x Faster</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/20">
                      <span>Batch Processing</span>
                      <span className="font-bold">✓ Included</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span>Support Priority</span>
                      <span className="font-bold">VIP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Optimized Load */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Get the latest PDF tips, feature updates, and exclusive offers
            delivered to your inbox.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              placeholder="Enter your email"
              className="flex-1 h-12 text-lg"
            />
            <Button className="bg-brand-red hover:bg-red-700 h-12 px-8 font-semibold">
              Subscribe
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Join 100,000+ subscribers. Unsubscribe anytime. No spam, ever.
          </p>
        </div>
      </section>

      <Footer />
      {/* {import.meta.env.DEV && <GoogleOAuthTest />} */}
    </div>
  );
};

export default Index;
