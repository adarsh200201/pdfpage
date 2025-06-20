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
import {
  Combine,
  Scissors,
  Minimize,
  FileText,
  FileImage,
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
} from "lucide-react";

// Animated Counter Component
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

  useEffect(() => {
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
  }, [end, duration]);

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
    },
    {
      title: "Excel to PDF",
      description:
        "Make EXCEL spreadsheets easy to read by converting them to PDF.",
      icon: FileText,
      href: "/excel-to-pdf",
      color: "from-emerald-600 to-emerald-700",
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
      title: "Watermark PDF",
      description:
        "Add watermarks to PDF files with customizable text and positioning.",
      icon: FileText,
      href: "/watermark",
      color: "from-cyan-500 to-cyan-600",
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
      title: "Organize PDF",
      description: "Reorder, rotate, and delete pages in your PDF documents.",
      icon: FileText,
      href: "/organize-pdf",
      color: "from-slate-500 to-slate-600",
      available: true,
      isWorking: true,
    },
    {
      title: "HTML to PDF",
      description: "Convert HTML files and web pages into PDF documents.",
      icon: FileText,
      href: "/html-to-pdf",
      color: "from-amber-500 to-amber-600",
    },
    {
      title: "PDF to PDF/A",
      description: "Convert PDF files to PDF/A format for long-term archiving.",
      icon: FileText,
      href: "/pdf-to-pdfa",
      color: "from-gray-500 to-gray-600",
    },
    {
      title: "Repair PDF",
      description: "Fix corrupted PDF files and restore damaged documents.",
      icon: FileText,
      href: "/repair-pdf",
      color: "from-orange-600 to-orange-700",
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
    },
    {
      title: "OCR PDF",
      description:
        "Extract text from scanned PDFs using optical character recognition.",
      icon: FileText,
      href: "/ocr-pdf",
      color: "from-blue-700 to-blue-800",
    },
    {
      title: "Compare PDF",
      description:
        "Compare two PDF files and highlight differences between versions.",
      icon: FileText,
      href: "/compare-pdf",
      color: "from-indigo-600 to-indigo-700",
      isNew: true,
    },
    {
      title: "Redact PDF",
      description:
        "Permanently remove sensitive information from PDF documents.",
      icon: FileText,
      href: "/redact-pdf",
      color: "from-red-700 to-red-800",
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

  const stats = [
    { number: 50, suffix: "M+", label: "PDFs Processed", icon: FileText },
    { number: 2, suffix: "M+", label: "Happy Users", icon: Users },
    { number: 190, suffix: "+", label: "Countries", icon: Globe },
    { number: 99.9, suffix: "%", label: "Uptime", icon: Shield },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />

      {/* Promotional Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <PromoBanner />
      </div>

      {/* Enhanced Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 opacity-10">
            <FloatingElement delay={0}>
              <FileText className="w-16 h-16 text-brand-red" />
            </FloatingElement>
          </div>
          <div className="absolute top-40 right-20 opacity-10">
            <FloatingElement delay={1}>
              <Scissors className="w-12 h-12 text-blue-500" />
            </FloatingElement>
          </div>
          <div className="absolute bottom-20 left-1/4 opacity-10">
            <FloatingElement delay={2}>
              <Minimize className="w-14 h-14 text-purple-500" />
            </FloatingElement>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-brand-red/10 text-brand-red border-brand-red/20 text-sm px-4 py-2">
              🚀 Trusted by 2M+ Users Worldwide
            </Badge>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Every PDF Tool You Need
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-red-600">
                In One Place
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
              The ultimate PDF toolkit for professionals, students, and
              businesses.
              <span className="font-semibold text-brand-red"> 100% free</span>,
              secure, and blazingly fast.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                size="lg"
                className="bg-brand-red hover:bg-red-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <Link to="#tools">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Processing PDFs
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 hover:border-brand-red px-8 py-4 text-lg font-semibold"
                asChild
              >
                <Link to="/about">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Lightning Fast</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-500" />
                <span>No Registration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-brand-red/10 to-brand-red/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <stat.icon className="h-8 w-8 text-brand-red" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  <AnimatedCounter end={stat.number} suffix={stat.suffix} />
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced PDF Tools Grid */}
      <section
        id="tools"
        className="py-20 bg-gradient-to-b from-white to-gray-50"
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pdfTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <Link key={tool.href} to={tool.href} className="group relative">
                  <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      {/* Badges */}
                      <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                        {tool.isNew && (
                          <Badge className="bg-brand-red text-white text-xs font-bold">
                            New!
                          </Badge>
                        )}
                        {tool.popular && (
                          <Badge className="bg-yellow-500 text-white text-xs font-bold">
                            Popular
                          </Badge>
                        )}
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
                      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-brand-red transition-colors duration-200">
                        {tool.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
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

      {/* Ad Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdSense
            adSlot="1234567890"
            adFormat="horizontal"
            className="max-w-4xl mx-auto"
          />
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
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
      <section className="py-20 bg-white">
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

      {/* Premium CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-red to-red-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Get Premium Power
              </h2>
              <p className="text-xl text-red-100 mb-8 leading-relaxed">
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
                    <span className="text-red-100">{feature}</span>
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
                  className="border-white text-white hover:bg-white/10 px-8 py-4"
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

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50">
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
    </div>
  );
};

export default Index;
