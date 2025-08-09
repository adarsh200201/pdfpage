import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AdvancedSEO from "@/components/AdvancedSEO";
import { useRealTimeStats } from "@/hooks/useRealTimeStats";
import { useMixpanel } from "@/hooks/useMixpanel";
import { getSEOData } from "@/data/seo-routes";
import {
  Combine,
  Scissors,
  Minimize,
  FileText,
  Shield,
  Zap,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Globe,
  Cloud,
  Download,
  Upload,
  Sparkles,
  Award,
  Heart,
  Play,
  Eye,
  Rocket,
  ChevronRight,
} from "lucide-react";

const NewIndex = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const mixpanel = useMixpanel();

  useEffect(() => {
    setIsVisible(true);
    // Track homepage visit
    mixpanel.trackPageView("Homepage", {
      page_title: "PdfPage - The Ultimate PDF Toolkit",
      design_version: "2024_modern",
    });
  }, [mixpanel]);

  // Featured tools for hero section
  const featuredTools = [
    {
      title: "Merge PDF",
      description: "Combine multiple PDFs into one",
      icon: Combine,
      href: "/merge",
      color: "from-blue-500 to-blue-700",
      popular: true,
    },
    {
      title: "Split PDF", 
      description: "Extract specific pages or ranges",
      icon: Scissors,
      href: "/split",
      color: "from-green-500 to-green-700",
    },
    {
      title: "Compress PDF",
      description: "Reduce file size without quality loss",
      icon: Minimize,
      href: "/compress", 
      color: "from-purple-500 to-purple-700",
      popular: true,
    },
    {
      title: "PDF to Word",
      description: "Convert to editable documents",
      icon: FileText,
      href: "/pdf-to-word",
      color: "from-orange-500 to-orange-700",
      isNew: true,
    },
  ];

  // Auto-rotate featured tools
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % featuredTools.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredTools.length]);

  const stats = [
    { number: 2500000, suffix: "+", label: "PDFs Processed", icon: FileText },
    { number: 150000, suffix: "+", label: "Happy Users", icon: Users },
    { number: 195, suffix: "+", label: "Countries", icon: Globe },
    { number: 99.9, suffix: "%", label: "Uptime", icon: Award },
  ];

  const currentTool = featuredTools[currentFeature];
  const IconComponent = currentTool.icon;

  return (
    <div className="min-h-screen bg-white">
      <AdvancedSEO {...getSEOData("/")} />
      <Header />

      {/* Optimized Hero Section - Reduced Mobile Height */}
      <section className="relative pt-16 sm:pt-20 md:pt-24 lg:pt-20 pb-12 sm:pb-16 md:pb-20 lg:pb-24 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/50">
        {/* Optimized Background Elements - Smaller on Mobile */}
        <div className="absolute inset-0">
          <div className="absolute top-8 sm:top-16 left-4 sm:left-8 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-8 sm:bottom-16 right-4 sm:right-8 w-40 h-40 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-gradient-to-r from-pink-400/10 to-red-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-56 sm:h-56 md:w-72 md:h-72 bg-gradient-to-r from-green-400/5 to-blue-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center min-h-[calc(100vh-12rem)] sm:min-h-[calc(100vh-10rem)] lg:min-h-[calc(100vh-8rem)]">
            
            {/* Enhanced Left Content - Mobile Optimized */}
            <div className={`text-center lg:text-left transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              {/* Trust Badge - Mobile Responsive */}
              <div className="inline-flex items-center gap-1 sm:gap-2 bg-green-50 border border-green-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                <span className="text-xs sm:text-sm font-semibold text-green-800">Trusted by 2M+ users worldwide</span>
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
              </div>

              {/* Optimized Main Headline - Smaller Mobile Fonts */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 leading-tight mb-3 sm:mb-4 md:mb-6 px-2 sm:px-0">
                <span className="block sm:inline">The Ultimate</span>
                <br className="hidden sm:block" />
                <span className="block sm:inline"> </span>
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x">
                    PDF Toolkit
                  </span>
                  <div className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-600/60 via-purple-600/60 to-pink-600/60 rounded-full"></div>
                </span>
              </h1>

              {/* Optimized Subtitle - Smaller Mobile Text */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed px-2 sm:px-0">
                Convert, merge, split, compress, and edit PDFs
                <span className="font-bold text-gray-900"> instantly</span>.
                <br className="hidden sm:block" />
                <span className="block sm:inline mt-1 sm:mt-0 text-sm sm:text-base md:text-lg text-green-600 font-semibold">
                  ✓ No downloads ✓ No registration ✓ 100% free
                </span>
              </p>

              {/* Optimized CTA Buttons - Reduced Mobile Spacing */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8 px-2 sm:px-0">
                <Button
                  size="lg"
                  className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 overflow-hidden touch-target"
                  onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Upload className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                  <span className="relative z-10">Start Processing Now</span>
                  <Rocket className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300 relative z-10" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="group border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-lg touch-target"
                  asChild
                >
                  <Link to="/about">
                    <Play className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 group-hover:text-blue-600 transition-all duration-300" />
                    <span className="group-hover:text-blue-600 transition-colors duration-300">
                      Watch Demo
                    </span>
                  </Link>
                </Button>
              </div>

              {/* Enhanced Feature Highlights - Mobile Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 px-2 sm:px-0">
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold text-gray-700">100% Secure</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold text-gray-700">Lightning Fast</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <Cloud className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold text-gray-700">Cloud Based</span>
                </div>
              </div>
            </div>

            {/* Right Side - Interactive Tool Preview */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative">
                {/* Main Tool Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div className="text-center mb-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentTool.color} flex items-center justify-center mx-auto mb-4 transform transition-all duration-500 hover:scale-110`}>
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentTool.title}
                    </h3>
                    <p className="text-gray-600">
                      {currentTool.description}
                    </p>
                  </div>

                  {/* Mock Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300" />
                    <p className="text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
                      Drop your PDF here or click to browse
                    </p>
                  </div>

                  {/* Tool Navigation Dots */}
                  <div className="flex justify-center mt-6 gap-2">
                    {featuredTools.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFeature(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentFeature
                            ? 'bg-blue-500 scale-125'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">
                  Free Forever!
                </div>
                
                {currentTool.popular && (
                  <div className="absolute -top-4 -left-4 bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                )}

                {currentTool.isNew && (
                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-400 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                    New!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Floating Design */}
      <section className="relative -mt-16 z-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const StatIcon = stat.icon;
                return (
                  <div key={index} className="text-center group cursor-pointer">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                      <StatIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">
                      {stat.number.toLocaleString()}{stat.suffix}
                    </div>
                    <div className="text-gray-600 font-semibold">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section - Modern Grid */}
      <section id="tools" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200 px-4 py-2">
              ⚡ 25+ Professional Tools
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
              Everything You Need for PDFs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From basic conversions to advanced editing, we've got every PDF task covered.
              All tools work instantly in your browser.
            </p>
          </div>

          {/* Quick Access Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { title: "Merge PDF", icon: Combine, href: "/merge", color: "from-blue-500 to-blue-700", desc: "Combine multiple PDFs" },
              { title: "Split PDF", icon: Scissors, href: "/split", color: "from-green-500 to-green-700", desc: "Extract specific pages" },
              { title: "Compress PDF", icon: Minimize, href: "/compress", color: "from-purple-500 to-purple-700", desc: "Reduce file size" },
              { title: "Edit PDF", icon: FileText, href: "/edit-pdf", color: "from-orange-500 to-orange-700", desc: "Add text & images" },
            ].map((tool, index) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  to={tool.href}
                  className="group relative overflow-hidden"
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white">
                    <CardContent className="p-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <ToolIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                        {tool.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">{tool.desc}</p>
                      <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700">
                        Try Now
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* View All Tools CTA */}
          <div className="text-center">
            <Link to="/tools">
              <Button size="lg" variant="outline" className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-lg">
                <Eye className="mr-3 h-5 w-5" />
                View All 25+ Tools
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Why Choose Us */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border border-white/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-white/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 border border-white/20 rounded-full animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              Why 2M+ Users Choose PdfPage
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Built for speed, security, and simplicity. Experience the difference with our cutting-edge technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Bank-Level Security",
                description: "Your files are protected with 256-bit SSL encryption and automatically deleted after processing. Zero data retention policy.",
                color: "from-green-400 to-emerald-500"
              },
              {
                icon: Zap,
                title: "Lightning Fast Processing",
                description: "Powered by cutting-edge cloud infrastructure. Process files in seconds, not minutes. Optimized for speed and reliability.",
                color: "from-blue-400 to-cyan-500"
              },
              {
                icon: Heart,
                title: "User-Friendly Design",
                description: "Intuitive interface that works perfectly on desktop, tablet, and mobile. No learning curve required.",
                color: "from-pink-400 to-rose-500"
              }
            ].map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <div key={index} className="text-center group">
                  <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl`}>
                    <FeatureIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-blue-100 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-black mb-6">
            Ready to Transform Your PDFs?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join 2 million+ users who've already discovered the power of PdfPage.
            Start processing your documents today - it's completely free!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Rocket className="mr-3 h-6 w-6" />
              Start Processing Now
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-bold rounded-2xl transition-all duration-300"
              asChild
            >
              <Link to="/about">
                <Eye className="mr-3 h-6 w-6" />
                Learn More
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex justify-center items-center gap-8 text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>No Registration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Instant Results</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NewIndex;
