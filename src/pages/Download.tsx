import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import {
  Download as DownloadIcon,
  Monitor,
  Smartphone,
  CheckCircle,
  Star,
  Shield,
  Zap,
  Globe,
  Clock,
  ArrowRight,
  Play,
  Users,
  Award,
  Cpu,
  HardDrive,
  Wifi,
  Apple,
  Chrome,
  Tablet,
} from "lucide-react";

const Download = () => {
  const downloadOptions = [
    {
      platform: "Windows",
      icon: Monitor,
      version: "v2.1.0",
      size: "85 MB",
      requirements: "Windows 10 or later",
      color: "from-blue-500 to-blue-600",
      primary: true,
      features: [
        "Offline PDF processing",
        "Batch operations",
        "Advanced security",
        "Priority support",
      ],
    },
    {
      platform: "macOS",
      icon: Apple,
      version: "v2.1.0",
      size: "92 MB",
      requirements: "macOS 11.0 or later",
      color: "from-gray-700 to-gray-800",
      primary: true,
      features: [
        "Native M1/M2 support",
        "Touch Bar integration",
        "Spotlight search",
        "Auto-updates",
      ],
    },
    {
      platform: "Linux",
      icon: Monitor,
      version: "v2.1.0",
      size: "78 MB",
      requirements: "Ubuntu 20.04+ / Fedora 35+",
      color: "from-orange-500 to-red-600",
      primary: false,
      features: [
        "AppImage format",
        "Command line tools",
        "System integration",
        "Open source",
      ],
    },
    {
      platform: "Chrome Extension",
      icon: Chrome,
      version: "v1.5.2",
      size: "2.8 MB",
      requirements: "Chrome 90+ or Edge",
      color: "from-green-500 to-green-600",
      primary: false,
      features: [
        "Right-click context menu",
        "Tab integration",
        "Quick access toolbar",
        "Sync across devices",
      ],
    },
  ];

  const mobileApps = [
    {
      platform: "iOS",
      icon: Apple,
      version: "v1.8.3",
      rating: 4.8,
      reviews: "12K",
      color: "from-blue-500 to-purple-600",
      features: [
        "Camera PDF scanner",
        "Touch editing",
        "iCloud sync",
        "Share extensions",
      ],
    },
    {
      platform: "Android",
      icon: Smartphone,
      version: "v1.8.1",
      rating: 4.7,
      reviews: "8.5K",
      color: "from-green-500 to-blue-600",
      features: [
        "Material Design",
        "Google Drive sync",
        "Quick actions",
        "Offline mode",
      ],
    },
    {
      platform: "iPad",
      icon: Tablet,
      version: "v1.8.3",
      rating: 4.9,
      reviews: "3.2K",
      color: "from-purple-500 to-pink-600",
      features: [
        "Apple Pencil support",
        "Split screen mode",
        "Drag & drop",
        "Keyboard shortcuts",
      ],
    },
  ];

  const desktopFeatures = [
    {
      title: "Offline Processing",
      icon: Wifi,
      description: "Work without internet connection. All processing happens locally for maximum privacy and speed.",
    },
    {
      title: "Batch Operations",
      icon: Cpu,
      description: "Process hundreds of files simultaneously with powerful batch processing capabilities.",
    },
    {
      title: "Advanced Security",
      icon: Shield,
      description: "Enterprise-grade encryption with local processing ensures your files never leave your device.",
    },
    {
      title: "High Performance",
      icon: Zap,
      description: "Optimized for speed with multi-core processing and GPU acceleration support.",
    },
    {
      title: "Large File Support",
      icon: HardDrive,
      description: "Handle files up to 10GB in size with efficient memory management.",
    },
    {
      title: "System Integration",
      icon: Monitor,
      description: "Native file associations, context menus, and seamless OS integration.",
    },
  ];

  const systemRequirements = {
    windows: {
      minimum: {
        os: "Windows 10 (64-bit)",
        processor: "Intel Core i3 or AMD equivalent",
        memory: "4 GB RAM",
        storage: "200 MB available space",
        graphics: "DirectX 11 compatible",
      },
      recommended: {
        os: "Windows 11 (64-bit)",
        processor: "Intel Core i5 or AMD Ryzen 5",
        memory: "8 GB RAM",
        storage: "1 GB available space",
        graphics: "Dedicated graphics card",
      },
    },
    mac: {
      minimum: {
        os: "macOS 11.0 Big Sur",
        processor: "Intel Core i5 or Apple M1",
        memory: "4 GB RAM",
        storage: "200 MB available space",
        graphics: "Integrated graphics",
      },
      recommended: {
        os: "macOS 13.0 Ventura or later",
        processor: "Apple M1 Pro or M2",
        memory: "8 GB RAM",
        storage: "1 GB available space",
        graphics: "Apple Silicon GPU",
      },
    },
  };

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Marketing Director",
      company: "TechFlow Inc.",
      avatar: "https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=webp&width=100",
      quote: "The desktop app is a game-changer. Being able to process confidential documents offline gives us peace of mind.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Legal Counsel",
      company: "Roberts & Associates",
      avatar: "https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=webp&width=100",
      quote: "Batch processing saves me hours every week. The security features are exactly what our firm needs.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <SEO
        title="Download PdfPage Desktop & Mobile Apps | Offline PDF Tools"
        description="Download PdfPage desktop and mobile apps for offline PDF processing. Available for Windows, macOS, Linux, iOS, and Android with advanced features."
        keywords="PDF app download, desktop PDF tools, mobile PDF app, offline PDF processing"
        canonical="/download"
        ogImage="/images/download-apps.jpg"
      />
      <Header />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30">
              📱 Desktop & Mobile Apps
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Take PdfPage
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Everywhere You Go
              </span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed opacity-90">
              Download our powerful desktop and mobile apps for offline PDF processing, 
              enhanced privacy, and advanced features you won't find anywhere else.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                <DownloadIcon className="mr-2 h-5 w-5" />
                Download for Windows
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop Apps */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Desktop Applications
            </h2>
            <p className="text-xl text-gray-600">
              Professional PDF processing with offline capabilities and enhanced performance
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {downloadOptions.map((option, index) => (
              <Card key={index} className={`hover:shadow-xl transition-all duration-300 ${
                option.primary ? "ring-2 ring-blue-500 scale-105" : ""
              }`}>
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${option.color} flex items-center justify-center mx-auto mb-4`}>
                    <option.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">
                    PdfPage for {option.platform}
                  </CardTitle>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <span>{option.version}</span>
                    <span>•</span>
                    <span>{option.size}</span>
                  </div>
                  <p className="text-gray-600">{option.requirements}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {option.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" size="lg">
                    <DownloadIcon className="mr-2 h-5 w-5" />
                    Download for {option.platform}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Free 30-day trial • No credit card required
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Apps */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Mobile Applications
            </h2>
            <p className="text-xl text-gray-600">
              Process PDFs on the go with our intuitive mobile apps
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {mobileApps.map((app, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${app.color} flex items-center justify-center mx-auto mb-4`}>
                    <app.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    PdfPage for {app.platform}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{app.rating}</span>
                    <span className="text-sm text-gray-500">({app.reviews})</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    {app.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Desktop Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Desktop Apps?
            </h2>
            <p className="text-xl text-gray-600">
              Advanced features and capabilities exclusive to our desktop applications
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {desktopFeatures.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
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

      {/* System Requirements */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              System Requirements
            </h2>
            <p className="text-xl text-gray-600">
              Ensure your system meets the requirements for optimal performance
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Windows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Monitor className="w-6 h-6 text-blue-600" />
                  Windows Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Minimum Requirements</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operating System:</span>
                      <span className="font-medium">{systemRequirements.windows.minimum.os}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processor:</span>
                      <span className="font-medium">{systemRequirements.windows.minimum.processor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Memory:</span>
                      <span className="font-medium">{systemRequirements.windows.minimum.memory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-medium">{systemRequirements.windows.minimum.storage}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recommended</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operating System:</span>
                      <span className="font-medium">{systemRequirements.windows.recommended.os}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processor:</span>
                      <span className="font-medium">{systemRequirements.windows.recommended.processor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Memory:</span>
                      <span className="font-medium">{systemRequirements.windows.recommended.memory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-medium">{systemRequirements.windows.recommended.storage}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* macOS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Apple className="w-6 h-6 text-gray-700" />
                  macOS Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Minimum Requirements</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operating System:</span>
                      <span className="font-medium">{systemRequirements.mac.minimum.os}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processor:</span>
                      <span className="font-medium">{systemRequirements.mac.minimum.processor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Memory:</span>
                      <span className="font-medium">{systemRequirements.mac.minimum.memory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-medium">{systemRequirements.mac.minimum.storage}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recommended</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operating System:</span>
                      <span className="font-medium">{systemRequirements.mac.recommended.os}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processor:</span>
                      <span className="font-medium">{systemRequirements.mac.recommended.processor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Memory:</span>
                      <span className="font-medium">{systemRequirements.mac.recommended.memory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-medium">{systemRequirements.mac.recommended.storage}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Users Are Saying
            </h2>
            <p className="text-xl text-gray-600">
              Thousands of professionals trust our desktop and mobile apps
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-gray-700 italic mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Download PdfPage today and experience the power of professional PDF processing 
            with offline capabilities and advanced features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              <DownloadIcon className="mr-2 h-5 w-5" />
              Download Desktop App
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Smartphone className="mr-2 h-5 w-5" />
              Get Mobile App
            </Button>
          </div>
          <p className="mt-6 text-sm opacity-75">
            Available for Windows, macOS, Linux, iOS, and Android
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Download;
