import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ImgHeader from "@/components/layout/ImgHeader";
import ImgFooter from "@/components/layout/ImgFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdSense from "@/components/ads/AdSense";
import {
  ImageIcon,
  Minimize2,
  Move,
  Crop,
  RotateCw,
  Droplets,
  FileImage,
  Palette,
  Zap,
  Scissors,
  ArrowUpDown,
  Crown,
  Star,
  Shield,
  Clock,
  Users,
  CheckCircle,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Play,
  Globe,
  Heart,
  Layers,
} from "lucide-react";

// Floating Animation Component
const FloatingElement = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  return (
    <div
      className="animate-bounce"
      style={{
        animationDelay: `${delay}s`,
        animationDuration: "3s",
        animationIterationCount: "infinite",
      }}
    >
      {children}
    </div>
  );
};

// Stats Counter Component
const StatsCounter = ({
  end,
  suffix = "",
  duration = 2000,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [end, duration]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const ImgPage = () => {
  const imageTools = [
    {
      title: "Compress Image",
      description: "Reduce image file size without losing quality",
      icon: Minimize2,
      path: "/img/compress",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      category: "optimize",
    },
    {
      title: "Resize Image",
      description: "Change image dimensions and resolution",
      icon: Move,
      path: "/img/resize",
      color: "text-green-600",
      bgColor: "bg-green-50",
      category: "edit",
    },
    {
      title: "Crop Image",
      description: "Cut and trim your images precisely",
      icon: Crop,
      path: "/img/crop",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      category: "edit",
    },
    {
      title: "Rotate Image",
      description: "Rotate images at any angle",
      icon: RotateCw,
      path: "/img/rotate",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      category: "edit",
    },
    {
      title: "Add Watermark",
      description: "Add text or image watermarks",
      icon: Droplets,
      path: "/img/watermark",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      category: "protect",
    },
    {
      title: "JPG to PNG",
      description: "Convert JPG images to PNG format",
      icon: FileImage,
      path: "/img/jpg-to-png",
      color: "text-red-600",
      bgColor: "bg-red-50",
      category: "convert",
    },
    {
      title: "PNG to JPG",
      description: "Convert PNG images to JPG format",
      icon: FileImage,
      path: "/img/png-to-jpg",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      category: "convert",
    },
    {
      title: "Remove Background",
      description: "Remove image backgrounds automatically",
      icon: Scissors,
      path: "/img/remove-bg",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      category: "edit",
      premium: true,
    },
    {
      title: "Upscale Image",
      description: "Enhance and enlarge images with AI",
      icon: Zap,
      path: "/img/upscale",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      category: "enhance",
      premium: true,
    },
    {
      title: "Image to PDF",
      description: "Convert images to PDF documents",
      icon: FileImage,
      path: "/img/to-pdf",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      category: "convert",
    },
    {
      title: "Meme Generator",
      description: "Create memes with text overlays",
      icon: Palette,
      path: "/img/meme",
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      category: "fun",
    },
    {
      title: "Convert Format",
      description: "Convert between all image formats",
      icon: ArrowUpDown,
      path: "/img/convert",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      category: "convert",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "100% Secure",
      description:
        "Your images are processed securely and deleted after 1 hour",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process images in seconds with our optimized engines",
    },
    {
      icon: Users,
      title: "Batch Processing",
      description: "Process multiple images at once to save time",
    },
    {
      icon: Crown,
      title: "Premium Quality",
      description: "Professional-grade image processing algorithms",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ImgHeader />

      {/* Enhanced Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 opacity-10">
            <FloatingElement delay={0}>
              <ImageIcon className="w-16 h-16 text-blue-600" />
            </FloatingElement>
          </div>
          <div className="absolute top-40 right-20 opacity-10">
            <FloatingElement delay={1}>
              <Palette className="w-12 h-12 text-purple-500" />
            </FloatingElement>
          </div>
          <div className="absolute bottom-20 left-1/4 opacity-10">
            <FloatingElement delay={2}>
              <Zap className="w-14 h-14 text-pink-500" />
            </FloatingElement>
          </div>
          <div className="absolute top-1/2 right-1/4 opacity-10">
            <FloatingElement delay={1.5}>
              <Sparkles className="w-10 h-10 text-yellow-500" />
            </FloatingElement>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 border-blue-600/20 text-sm px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              🎨 Professional Image Tools
            </Badge>

            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-lg opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-3xl shadow-2xl">
                  <ImageIcon className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ImgPage
              </span>
              <span className="block text-4xl lg:text-5xl text-gray-900 mt-4">
                Image Processing Made Simple
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
              Transform your images with our professional-grade toolkit.
              <span className="font-semibold text-blue-600"> 100% free</span>,
              lightning-fast, and secure processing for all your image needs.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
              <Badge
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2 text-base"
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
                12+ Image Tools
              </Badge>
              <Badge
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2 text-base"
              >
                <Zap className="w-5 h-5 text-yellow-500" />
                Lightning Fast
              </Badge>
              <Badge
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2 text-base"
              >
                <Shield className="w-5 h-5 text-blue-500" />
                100% Secure
              </Badge>
              <Badge
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2 text-base"
              >
                <Clock className="w-5 h-5 text-purple-500" />
                No Registration
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Processing Images
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg border-2"
              >
                <Globe className="w-5 h-5 mr-2" />
                View All Tools
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                  <StatsCounter end={2500000} suffix="+" />
                </div>
                <p className="text-gray-600">Images Processed</p>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-purple-600 mb-2">
                  <StatsCounter end={12} suffix="+" />
                </div>
                <p className="text-gray-600">Tools Available</p>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-pink-600 mb-2">
                  <StatsCounter end={99} suffix="%" />
                </div>
                <p className="text-gray-600">User Satisfaction</p>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-green-600 mb-2">
                  <StatsCounter end={150} suffix="+" />
                </div>
                <p className="text-gray-600">Countries Served</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* AdSense */}
        <div className="mb-12">
          <AdSense
            slot="1234567890"
            style={{ display: "block", textAlign: "center" }}
            responsive={true}
          />
        </div>

        {/* Tools Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Choose Your Image Tool
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Professional-grade image processing tools designed for creators,
            businesses, and individuals
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {imageTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <Link key={index} to={tool.path} className="group block">
                  <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 border-2 hover:border-gradient-to-r hover:from-blue-400 hover:to-purple-400 relative overflow-hidden bg-white/80 backdrop-blur-sm">
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />

                    {/* Glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                    </div>

                    <CardContent className="p-6 relative">
                      <div className="flex items-center justify-between mb-6">
                        {/* Enhanced icon container */}
                        <div className="relative">
                          {/* Icon shadow/glow */}
                          <div
                            className={`absolute inset-0 ${tool.bgColor} rounded-xl blur-md opacity-0 group-hover:opacity-60 transition-all duration-500 group-hover:scale-125`}
                          />

                          {/* Main icon container */}
                          <div
                            className={`relative p-4 rounded-xl ${tool.bgColor} group-hover:scale-110 transition-all duration-500 group-hover:rotate-3 shadow-lg group-hover:shadow-xl`}
                          >
                            {/* Icon background pattern */}
                            <div className="absolute inset-0 rounded-xl opacity-10 bg-gradient-to-br from-white to-transparent" />

                            {/* Main icon */}
                            <IconComponent
                              className={`w-8 h-8 ${tool.color} relative z-10 group-hover:scale-110 transition-all duration-300`}
                            />

                            {/* Sparkle effect */}
                            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                            </div>
                          </div>

                          {/* Floating particles effect */}
                          <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                            <div
                              className="absolute top-1 left-1 w-1 h-1 bg-blue-400 rounded-full animate-ping"
                              style={{ animationDelay: "0ms" }}
                            />
                            <div
                              className="absolute top-3 right-2 w-1 h-1 bg-purple-400 rounded-full animate-ping"
                              style={{ animationDelay: "200ms" }}
                            />
                            <div
                              className="absolute bottom-2 left-3 w-1 h-1 bg-pink-400 rounded-full animate-ping"
                              style={{ animationDelay: "400ms" }}
                            />
                          </div>
                        </div>

                        {/* Enhanced premium badge */}
                        {tool.premium && (
                          <Badge className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white shadow-lg animate-pulse relative">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-red-500/20 rounded animate-ping" />
                          </Badge>
                        )}
                      </div>

                      {/* Enhanced text content */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 group-hover:translate-x-1">
                        {tool.title}
                      </h3>

                      <p className="text-gray-600 text-sm mb-6 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                        {tool.description}
                      </p>

                      {/* Enhanced CTA */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-blue-600 text-sm font-medium group-hover:translate-x-2 transition-all duration-300">
                          <span className="relative">
                            Try it now
                            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-500" />
                          </span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>

                        {/* Category badge */}
                        <Badge
                          variant="outline"
                          className="text-xs opacity-60 group-hover:opacity-100 transition-opacity capitalize"
                        >
                          {tool.category}
                        </Badge>
                      </div>

                      {/* Progress bar animation */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Why Choose ImgPage?
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Built for professionals, designed for everyone. Experience the
            difference with our advanced image processing platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card
                  key={index}
                  className="group text-center hover:shadow-2xl transition-all duration-500 border-2 hover:border-blue-200 hover:-translate-y-2 relative overflow-hidden bg-white/90 backdrop-blur-sm"
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <CardContent className="p-6 relative">
                    {/* Enhanced icon container */}
                    <div className="relative mx-auto mb-6 w-fit">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl blur-md opacity-0 group-hover:opacity-80 transition-all duration-500 group-hover:scale-125" />

                      {/* Main icon container */}
                      <div className="relative bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6 rounded-xl group-hover:scale-110 transition-all duration-500 group-hover:rotate-6 shadow-lg group-hover:shadow-xl">
                        {/* Inner glow */}
                        <div className="absolute inset-2 bg-gradient-to-br from-white/40 to-transparent rounded-lg" />

                        {/* Icon */}
                        <IconComponent className="w-8 h-8 text-blue-600 relative z-10 group-hover:scale-110 transition-all duration-300" />

                        {/* Sparkle animations */}
                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                        </div>
                        <div className="absolute -bottom-1 -left-1 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-300">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                        </div>
                      </div>

                      {/* Orbiting particles */}
                      <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                        <div
                          className="absolute top-0 left-1/2 w-1 h-1 bg-purple-400 rounded-full animate-spin"
                          style={{
                            transformOrigin: "0 32px",
                            animationDuration: "3s",
                          }}
                        />
                        <div
                          className="absolute top-1/2 right-0 w-1 h-1 bg-pink-400 rounded-full animate-spin"
                          style={{
                            transformOrigin: "-32px 0",
                            animationDuration: "4s",
                            animationDelay: "1s",
                          }}
                        />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Testimonials Section */}
        <section className="py-20 bg-white rounded-3xl shadow-xl mb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              See what professionals are saying about our image processing tools
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "ImgPage has revolutionized my workflow. The compression tool
                  alone saves me hours every week."
                </p>
                <div className="font-semibold text-gray-900">Sarah Chen</div>
                <div className="text-sm text-gray-500">Graphic Designer</div>
              </div>

              <div className="p-6">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Perfect for social media content. The resize presets are
                  exactly what I needed."
                </p>
                <div className="font-semibold text-gray-900">
                  Mark Rodriguez
                </div>
                <div className="text-sm text-gray-500">Content Creator</div>
              </div>

              <div className="p-6">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Fast, reliable, and completely free. I've processed thousands
                  of images without any issues."
                </p>
                <div className="font-semibold text-gray-900">Emma Thompson</div>
                <div className="text-sm text-gray-500">Photographer</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-3xl shadow-2xl mb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Transform Your Images?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join millions of users who trust ImgPage for their image
              processing needs. Start creating amazing visuals today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Processing Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10 px-8 py-4"
              >
                <Heart className="w-5 h-5 mr-2" />
                Explore All Tools
              </Button>
            </div>
          </div>
        </section>

        {/* AdSense Bottom */}
        <div className="mb-8">
          <AdSense
            slot="9876543210"
            style={{ display: "block", textAlign: "center" }}
            responsive={true}
          />
        </div>
      </div>

      {/* Footer */}
      <ImgFooter />
    </div>
  );
};

export default ImgPage;
