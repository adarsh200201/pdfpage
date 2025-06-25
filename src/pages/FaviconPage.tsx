import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import FaviconHeader from "@/components/layout/FaviconHeader";
import FaviconFooter from "@/components/layout/FaviconFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdSense from "@/components/ads/AdSense";
import {
  Globe,
  Smartphone,
  Monitor,
  Type,
  Smile,
  Image,
  Sparkles,
  CheckCircle,
  Zap,
  Shield,
  Users,
  Crown,
  Star,
  ArrowRight,
  Download,
  Heart,
  TrendingUp,
  Layers,
  Palette,
  FileText,
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

const FaviconPage = () => {
  const faviconTools = [
    {
      title: "Image to Favicon",
      description: "Convert any image to professional favicon files",
      icon: Image,
      path: "/img/favicon",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      category: "convert",
    },
    {
      title: "Text to Favicon",
      description: "Create favicons from text with custom fonts and colors",
      icon: Type,
      path: "/img/favicon",
      color: "text-green-600",
      bgColor: "bg-green-50",
      category: "generate",
    },
    {
      title: "Emoji to Favicon",
      description: "Generate favicons from emojis for fun websites",
      icon: Smile,
      path: "/img/favicon",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      category: "generate",
    },
    {
      title: "Logo to Favicon",
      description: "Optimize logos for perfect favicon display",
      icon: Sparkles,
      path: "/img/favicon",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      category: "optimize",
    },
  ];

  const features = [
    {
      icon: Globe,
      title: "All Platforms",
      description: "Generate favicons for web, iOS, Android, and desktop",
    },
    {
      icon: Zap,
      title: "Instant Generation",
      description: "Create all favicon sizes in seconds with one click",
    },
    {
      icon: Shield,
      title: "Perfect Quality",
      description: "High-quality output optimized for each platform",
    },
    {
      icon: Download,
      title: "Easy Download",
      description: "Download individual files or get everything as a ZIP",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <FaviconHeader />

      {/* Enhanced Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 opacity-10">
            <FloatingElement delay={0}>
              <Globe className="h-24 w-24 text-blue-600" />
            </FloatingElement>
          </div>
          <div className="absolute top-40 right-20 opacity-10">
            <FloatingElement delay={1}>
              <Smartphone className="h-20 w-20 text-green-600" />
            </FloatingElement>
          </div>
          <div className="absolute bottom-20 left-20 opacity-10">
            <FloatingElement delay={2}>
              <Monitor className="h-28 w-28 text-purple-600" />
            </FloatingElement>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-6 py-3 rounded-full text-sm font-medium mb-6">
              <Globe className="h-4 w-4" />
              Professional Favicon Generator Suite
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              Create Perfect Favicons
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
              Generate professional favicon files from images, text, emojis, or
              logos.
              <br />
              Get all sizes for web, iOS, and Android in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/img/favicon">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Creating Favicons
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg border-2"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  <StatsCounter end={8} />
                </div>
                <div className="text-sm text-gray-600">Favicon Sizes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  <StatsCounter end={4} />
                </div>
                <div className="text-sm text-gray-600">Input Methods</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  <StatsCounter end={3} />
                </div>
                <div className="text-sm text-gray-600">Platforms</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600 mb-1">
                  <StatsCounter end={100} suffix="%" />
                </div>
                <div className="text-sm text-gray-600">Free to Use</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Favicon Tools Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Favicon Creation Method
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Multiple ways to create perfect favicons for your website. All
              methods generate the complete set of favicon files you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {faviconTools.map((tool, index) => (
              <Link key={tool.title} to={tool.path}>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 ${tool.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <tool.icon className={`w-8 h-8 ${tool.color}`} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </h3>

                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {tool.description}
                    </p>

                    <Badge
                      variant="secondary"
                      className="text-xs font-medium capitalize"
                    >
                      {tool.category}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-br from-gray-50 to-white"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Favicon Generator?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade favicon generation with all the features you
              need for modern web development.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={feature.title} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Formats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Favicon Package
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get all the favicon files you need for perfect compatibility
              across all platforms and devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Web Browsers
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• favicon.ico (legacy support)</div>
                <div>• favicon-16x16.png</div>
                <div>• favicon-32x32.png</div>
                <div>• favicon-48x48.png</div>
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <Smartphone className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Mobile Devices
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• apple-touch-icon.png (180×180)</div>
                <div>• android-chrome-192x192.png</div>
                <div>• android-chrome-512x512.png</div>
                <div>• site.webmanifest (PWA)</div>
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <Monitor className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Desktop Apps
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• favicon-96x96.png</div>
                <div>• High-resolution support</div>
                <div>• Perfect scaling</div>
                <div>• Multiple formats</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link to="/img/favicon">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Create Your Perfect Favicon?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers and designers who trust our favicon
            generator for their web projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/img/favicon">
              <Button
                size="lg"
                variant="secondary"
                className="px-8 py-4 text-lg bg-white text-blue-600 hover:bg-gray-100"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Creating
              </Button>
            </Link>
            <Link to="/img">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-blue-600"
              >
                <Image className="mr-2 h-5 w-5" />
                Browse All Image Tools
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <AdSense />
      <FaviconFooter />
    </div>
  );
};

export default FaviconPage;
