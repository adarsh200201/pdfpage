import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SEO from "@/components/SEO";
import {
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  Phone,
  Video,
  FileText,
  Users,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  ExternalLink,
  Play,
  Download,
  Star,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Settings,
} from "lucide-react";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    {
      title: "Getting Started",
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      description: "Basic tutorials and setup guides",
      articles: 15,
      popular: true,
    },
    {
      title: "PDF Tools",
      icon: FileText,
      color: "from-green-500 to-green-600",
      description: "How to use our PDF processing tools",
      articles: 28,
      popular: true,
    },
    {
      title: "Account & Billing",
      icon: Settings,
      color: "from-purple-500 to-purple-600",
      description: "Account management and subscription help",
      articles: 12,
      popular: false,
    },
    {
      title: "Security & Privacy",
      icon: Shield,
      color: "from-red-500 to-red-600",
      description: "Data protection and security features",
      articles: 8,
      popular: false,
    },
    {
      title: "Troubleshooting",
      icon: Zap,
      color: "from-yellow-500 to-orange-600",
      description: "Common issues and solutions",
      articles: 22,
      popular: true,
    },
    {
      title: "API & Integrations",
      icon: Users,
      color: "from-cyan-500 to-blue-600",
      description: "Developer resources and API docs",
      articles: 18,
      popular: false,
    },
  ];

  const popularArticles = [
    {
      title: "How to merge multiple PDF files",
      category: "PDF Tools",
      views: "45K views",
      rating: 4.9,
      readTime: "3 min",
    },
    {
      title: "Converting PDF to Word document",
      category: "PDF Tools", 
      views: "38K views",
      rating: 4.8,
      readTime: "4 min",
    },
    {
      title: "Compressing PDF files without quality loss",
      category: "PDF Tools",
      views: "32K views",
      rating: 4.9,
      readTime: "2 min",
    },
    {
      title: "Setting up your account",
      category: "Getting Started",
      views: "28K views",
      rating: 4.7,
      readTime: "5 min",
    },
    {
      title: "Understanding file security",
      category: "Security & Privacy",
      views: "25K views",
      rating: 4.8,
      readTime: "6 min",
    },
  ];

  const faqData = [
    {
      question: "How secure are my files on PdfPage?",
      answer: "Your files are processed with 256-bit SSL encryption and automatically deleted after 1 hour. We never store or access your documents. All processing happens securely in our SOC 2 compliant infrastructure.",
    },
    {
      question: "Is there a file size limit?",
      answer: "Free users can process files up to 25MB. Pro users have a 100MB limit per file. For larger files, try our compression tool first or consider upgrading to our Enterprise plan.",
    },
    {
      question: "Can I use PdfPage offline?",
      answer: "PdfPage is a web-based service that requires an internet connection. However, we're developing an offline desktop app that will be available soon for Pro subscribers.",
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription anytime from your account settings. Go to Dashboard > Settings > Billing and click 'Cancel Subscription'. You'll retain access until your current billing period ends.",
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. Contact our support team within 30 days of purchase for a full refund.",
    },
    {
      question: "Can I process multiple files at once?",
      answer: "Yes! Most of our tools support batch processing. Simply select multiple files when uploading, or drag and drop them all at once. Pro users can process up to 50 files simultaneously.",
    },
    {
      question: "What file formats do you support?",
      answer: "We support PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), Excel (XLS/XLSX), images (JPG/PNG/GIF), text files, and many other popular formats. Check each tool for specific format support.",
    },
    {
      question: "How can I contact support?",
      answer: "You can reach our support team via live chat (bottom right), email (support@pdfpage.in), or through our contact form. Pro users get priority support with faster response times.",
    },
  ];

  const tutorials = [
    {
      title: "Complete PDF Processing Guide",
      description: "Learn all the essential PDF tools in 15 minutes",
      duration: "15:32",
      thumbnail: "https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=webp&width=400",
      category: "Overview",
      difficulty: "Beginner",
    },
    {
      title: "Advanced PDF Editing Techniques",
      description: "Professional editing features and workflows",
      duration: "12:45",
      thumbnail: "https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=webp&width=400",
      category: "PDF Tools",
      difficulty: "Advanced",
    },
    {
      title: "Security Features Deep Dive",
      description: "Protecting your documents with advanced security",
      duration: "8:20",
      thumbnail: "https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=webp&width=400",
      category: "Security",
      difficulty: "Intermediate",
    },
  ];

  const supportOptions = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      availability: "24/7",
      responseTime: "< 2 minutes",
      color: "bg-blue-500",
      action: "Start Chat",
    },
    {
      title: "Email Support",
      description: "Send us a detailed message about your issue",
      icon: Mail,
      availability: "24/7",
      responseTime: "< 4 hours",
      color: "bg-green-500",
      action: "Send Email",
    },
    {
      title: "Phone Support",
      description: "Talk directly with our technical experts",
      icon: Phone,
      availability: "Mon-Fri 9AM-6PM EST",
      responseTime: "Immediate",
      color: "bg-purple-500",
      action: "Call Now",
    },
    {
      title: "Video Call",
      description: "Screen sharing session for complex issues",
      icon: Video,
      availability: "By appointment",
      responseTime: "Same day",
      color: "bg-orange-500",
      action: "Schedule Call",
    },
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <SEO
        title="Help Center & Support | PdfPage"
        description="Get help with PdfPage PDF tools. Find tutorials, guides, FAQ, and contact support for all your PDF processing needs."
        keywords="help center, support, tutorials, FAQ, PDF help, guides"
        canonical="/help"
        ogImage="/images/help-center.jpg"
      />
      <Header />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30">
              📚 Help Center
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              How can we help you?
            </h1>
            <p className="text-xl lg:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed opacity-90">
              Find answers, tutorials, and get support for all your PDF processing needs
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for help articles, tutorials, or FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg rounded-xl border-0 bg-white/95 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                💡 Popular: "How to merge PDFs"
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                🔧 "PDF to Word conversion"
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                🔒 "File security"
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Browse Help Topics</h2>
          <div className="grid lg:grid-cols-3 gap-8">
            {filteredCategories.map((category, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    {category.popular && (
                      <Badge className="bg-orange-100 text-orange-600 border-orange-200">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{category.articles} articles</span>
                    <Button variant="ghost" size="sm" className="group-hover:text-blue-600">
                      Browse <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="popular" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
              </TabsList>
            </div>

            {/* Popular Articles */}
            <TabsContent value="popular" className="space-y-6">
              <h3 className="text-2xl font-bold text-center mb-8">Most Popular Articles</h3>
              <div className="grid gap-6">
                {popularArticles.map((article, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="secondary">{article.category}</Badge>
                            <span className="text-sm text-gray-500">{article.readTime} read</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{article.rating}</span>
                            </div>
                          </div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer">
                            {article.title}
                          </h4>
                          <p className="text-gray-500 text-sm">{article.views}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Read
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Video Tutorials */}
            <TabsContent value="tutorials" className="space-y-6">
              <h3 className="text-2xl font-bold text-center mb-8">Video Tutorials</h3>
              <div className="grid lg:grid-cols-3 gap-8">
                {tutorials.map((tutorial, index) => (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="relative">
                      <img
                        src={tutorial.thumbnail}
                        alt={tutorial.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-blue-600 ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {tutorial.duration}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{tutorial.category}</Badge>
                        <Badge variant={tutorial.difficulty === "Beginner" ? "default" : tutorial.difficulty === "Intermediate" ? "secondary" : "destructive"}>
                          {tutorial.difficulty}
                        </Badge>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {tutorial.title}
                      </h4>
                      <p className="text-gray-600 text-sm">{tutorial.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* FAQ */}
            <TabsContent value="faq" className="space-y-6">
              <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
              <div className="max-w-4xl mx-auto">
                <Accordion type="single" collapsible className="space-y-4">
                  {faqData.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                      <AccordionTrigger className="text-left font-semibold hover:text-blue-600">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
            <p className="text-xl text-gray-600">Our support team is here to assist you 24/7</p>
          </div>
          <div className="grid lg:grid-cols-4 gap-6">
            {supportOptions.map((option, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className={`w-16 h-16 ${option.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <option.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {option.availability}
                    </div>
                    <div>Response: {option.responseTime}</div>
                  </div>
                  <Button className="w-full">
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Lightbulb className="w-8 h-8" />
            <h2 className="text-3xl font-bold">Pro Tips</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
              <p className="text-white/90">Process multiple files at once to save time. Most tools support batch uploads.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">File Security</h3>
              <p className="text-white/90">All files are automatically deleted after processing. Your data stays private.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Download Options</h3>
              <p className="text-white/90">Choose individual downloads or zip all processed files for convenience.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Help;
