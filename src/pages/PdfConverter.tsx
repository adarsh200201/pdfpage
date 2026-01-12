import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import {
  FileText,
  ArrowRight,
  Star,
  CheckCircle,
  Zap,
  Shield,
  Users,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  Globe,
  Crown,
  Heart,
  TrendingUp,
} from "lucide-react";

const PdfConverter = () => {
  const converterTools = [
    {
      title: "PDF to Word",
      description: "Convert PDF to editable Word documents (DOCX) with perfect formatting preservation.",
      href: "/pdf-to-word",
      icon: FileText,
      popular: true,
      keywords: "pdf to word, convert pdf to word, pdf to docx, pdf2word",
    },
    {
      title: "Word to PDF", 
      description: "Convert Word documents (DOC, DOCX) to PDF format instantly.",
      href: "/word-to-pdf",
      icon: FileText,
      keywords: "word to pdf, doc to pdf, docx to pdf, convert word to pdf",
    },
    {
      title: "PowerPoint to PDF",
      description: "Convert PowerPoint presentations to PDF format for easy sharing.",
      href: "/powerpoint-to-pdf",
      icon: FileText,
      keywords: "powerpoint to pdf, ppt to pdf, pptx to pdf",
    },
    {
      title: "PDF to Excel",
      description: "Extract data from PDF to Excel spreadsheets (XLSX) with table recognition.",
      href: "/pdf-to-excel",
      icon: FileText,
      isNew: true,
      keywords: "pdf to excel, pdf to xlsx, pdf to spreadsheet",
    },
    {
      title: "Excel to PDF",
      description: "Convert Excel spreadsheets to PDF format while preserving formatting.",
      href: "/excel-to-pdf", 
      icon: FileText,
      keywords: "excel to pdf, xlsx to pdf, spreadsheet to pdf",
    },
    {
      title: "PDF to JPG",
      description: "Convert PDF pages to high-quality JPG images instantly.",
      href: "/pdf-to-jpg",
      icon: FileText,
      popular: true,
      keywords: "pdf to jpg, pdf to image, pdf to jpeg, convert pdf to jpg",
    },
    {
      title: "JPG to PDF",
      description: "Convert JPG, PNG, and other images to PDF format easily.",
      href: "/jpg-to-pdf",
      icon: FileText,
      keywords: "jpg to pdf, image to pdf, png to pdf, convert image to pdf",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "100% Secure",
      description: "All files are encrypted and automatically deleted after processing. Your privacy is guaranteed.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Convert files in seconds with our optimized cloud processing infrastructure.",
    },
    {
      icon: Smartphone,
      title: "Works Everywhere", 
      description: "Use on any device - desktop, mobile, tablet. No downloads or installations required.",
    },
    {
      icon: Crown,
      title: "No Registration",
      description: "Start converting immediately. No signup, no email required, no hidden fees.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Business Analyst",
      content: "PDFPage's converter tools save me hours every week. The PDF to Word conversion is incredibly accurate!",
      rating: 5,
    },
    {
      name: "Mike T.",
      role: "Student",
      content: "Perfect for converting my research papers. Fast, free, and reliable. No watermarks or signup required.",
      rating: 5,
    },
    {
      name: "Jennifer L.",
      role: "Marketing Manager", 
      content: "Best PDF converter I've used. Works great on mobile and the quality is always perfect.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO
        title="Free PDF Converter Online | Convert PDF to Word, Excel, PPT | PDFPage"
        description="Convert PDF files online free with PDFPage. PDF to Word, Excel, PowerPoint, JPG converter tools. No registration, no watermark. Fast, secure, and accurate conversion. Works on mobile & desktop."
        keywords="pdf converter, free pdf converter, online pdf converter, convert pdf online, pdf conversion tools, pdf to word converter, pdf to excel converter, pdf to powerpoint converter, pdf to jpg converter, word to pdf converter, excel to pdf converter, powerpoint to pdf converter, jpg to pdf converter, html to pdf converter, document converter, file converter online, convert documents online, pdf file converter, instant pdf converter, secure pdf converter, fast pdf converter, professional pdf converter, pdf converter no registration, pdf converter without watermark, pdf converter mobile, pdf converter chrome, best pdf converter online, free document converter, convert pdf to docx, convert pdf to xlsx, convert pdf to pptx, convert pdf to jpeg, pdfpage converter, pdf page converter"
        canonical="/pdf-converter"
        ogImage="/images/pdf-converter-tools.jpg"
        toolName="PDF Converter Online"
        toolType="converter"
        schemaData={{
          "@type": "WebApplication",
          "name": "PDF Converter Online - PDFPage",
          "description": "Free online PDF converter supporting multiple formats including Word, Excel, PowerPoint, and image conversions",
          "applicationCategory": "UtilityApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          },
          "featureList": [
            "PDF to Word Converter",
            "PDF to Excel Converter", 
            "PDF to PowerPoint Converter",
            "PDF to JPG Converter",
            "Word to PDF Converter",
            "Excel to PDF Converter",
            "PowerPoint to PDF Converter",
            "JPG to PDF Converter",
            "HTML to PDF Converter"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": 4.9,
            "reviewCount": 25000,
            "bestRating": 5,
            "worstRating": 1
          }
        }}
      />
      <Header />

      {/* Hero Section */}
      <section className="pt-8 pb-16 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-600/10 text-blue-600 border-blue-600/20 text-sm px-4 py-2">
              🚀 Free PDF Converter Tools
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
              Free PDF Converter Online
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Convert PDF files to Word, Excel, PowerPoint, JPG and more. Fast, secure, and completely free. 
              <span className="font-bold text-gray-900"> No registration required.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                size="lg"
                className="group relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white px-10 py-4 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link to="/pdf-to-word">
                  <Upload className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  Convert PDF to Word
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 px-10 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                asChild
              >
                <Link to="#tools">
                  <RefreshCw className="mr-3 h-5 w-5" />
                  View All Converters
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-blue-600" />
                2M+ Users
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                4.9/5 Rating
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                100% Secure
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PDF Converter Tools Grid */}
      <section id="tools" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Professional PDF Conversion Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Convert PDF files to and from popular formats. All tools work directly in your browser - no software installation required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {converterTools.map((tool, index) => {
              const IconComponent = tool.icon;

              return (
                <Link
                  key={tool.href}
                  to={tool.href}
                  className="group relative"
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      {/* Badges */}
                      <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                        {tool.popular && (
                          <Badge className="bg-orange-500 text-white text-xs font-bold">
                            Popular
                          </Badge>
                        )}
                        {tool.isNew && (
                          <Badge className="bg-green-500 text-white text-xs font-bold">
                            New
                          </Badge>
                        )}
                      </div>

                      {/* Icon */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                        {tool.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {tool.description}
                      </p>

                      {/* Keywords for SEO */}
                      <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Keywords: {tool.keywords}
                      </div>

                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Why Choose PDFPage Converter?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built for speed, security, and simplicity. Experience professional-grade PDF conversion with zero compromise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Millions
            </h2>
            <p className="text-xl text-gray-600">
              See what our users say about PDFPage converter tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4 text-center">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section for Long-tail Keywords */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How do I convert PDF to Word for free?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Simply upload your PDF file, click "Convert to Word", and download the converted DOCX file. 
                  No registration required and completely free. Works on any device with a web browser.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Is PDFPage converter safe to use?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes, absolutely. All files are processed with 256-bit SSL encryption and automatically deleted 
                  from our servers after conversion. We never store or access your documents.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What file formats does PDFPage support?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  PDFPage supports PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), Excel (XLS/XLSX), 
                  images (JPG/PNG/GIF), HTML, and many other popular document formats.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Can I use PDFPage on mobile devices?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes, PDFPage works perfectly on smartphones, tablets, and desktops. No app download required - 
                  just use your mobile browser to access all converter tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Start Converting Now
          </h2>
          <p className="text-xl mb-8">
            Join millions of users who trust PDFPage for their document conversion needs. 
            Fast, secure, and always free.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-4"
              asChild
            >
              <Link to="/pdf-to-word">
                <Upload className="mr-2 h-5 w-5" />
                Convert PDF to Word
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 font-bold"
              asChild
            >
              <Link to="/">
                <Globe className="mr-2 h-5 w-5" />
                View All Tools
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PdfConverter;
