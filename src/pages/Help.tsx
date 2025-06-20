import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Search,
  FileText,
  Shield,
  Zap,
  Users,
  MessageSquare,
  Book,
  Video,
  Mail,
  Phone,
  ChevronRight,
  Download,
  Upload,
  Scissors,
  Combine,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

const Help = () => {
  const popularArticles = [
    {
      title: "How to merge PDF files",
      description:
        "Step-by-step guide to combining multiple PDFs into one document",
      category: "PDF Tools",
      readTime: "3 min",
      views: "45.2k",
      href: "/help/how-to-merge-pdf",
    },
    {
      title: "Converting PDF to Word safely",
      description:
        "Best practices for maintaining formatting when converting PDFs",
      category: "Conversion",
      readTime: "5 min",
      views: "32.1k",
      href: "/help/pdf-to-word-guide",
    },
    {
      title: "Is my data secure on PdfPage?",
      description:
        "Understanding our security measures and data protection policies",
      category: "Security",
      readTime: "4 min",
      views: "28.9k",
      href: "/help/data-security",
    },
    {
      title: "Troubleshooting upload issues",
      description:
        "Common solutions for file upload problems and error messages",
      category: "Troubleshooting",
      readTime: "6 min",
      views: "25.7k",
      href: "/help/upload-troubleshooting",
    },
    {
      title: "Understanding Premium features",
      description: "Complete overview of Premium benefits and how to upgrade",
      category: "Premium",
      readTime: "4 min",
      views: "22.3k",
      href: "/help/premium-features",
    },
    {
      title: "Batch processing PDFs",
      description: "How to process multiple files simultaneously with Premium",
      category: "Premium",
      readTime: "5 min",
      views: "18.9k",
      href: "/help/batch-processing",
    },
  ];

  const categories = [
    {
      title: "Getting Started",
      description: "New to PdfPage? Start here for basic guides and tutorials",
      icon: Book,
      color: "from-blue-500 to-blue-600",
      articleCount: 12,
      href: "/help/getting-started",
    },
    {
      title: "PDF Tools",
      description: "Learn how to use all our PDF processing tools effectively",
      icon: FileText,
      color: "from-green-500 to-green-600",
      articleCount: 25,
      href: "/help/pdf-tools",
    },
    {
      title: "Account & Billing",
      description:
        "Manage your account, subscriptions, and billing information",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      articleCount: 8,
      href: "/help/account-billing",
    },
    {
      title: "Security & Privacy",
      description: "Information about data protection and security measures",
      icon: Shield,
      color: "from-red-500 to-red-600",
      articleCount: 6,
      href: "/help/security-privacy",
    },
    {
      title: "API Documentation",
      description: "Developer resources and API integration guides",
      icon: Zap,
      color: "from-orange-500 to-orange-600",
      articleCount: 15,
      href: "/api-docs",
    },
    {
      title: "Troubleshooting",
      description: "Solutions to common problems and error messages",
      icon: HelpCircle,
      color: "from-pink-500 to-pink-600",
      articleCount: 18,
      href: "/help/troubleshooting",
    },
  ];

  const quickActions = [
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: MessageSquare,
      href: "/contact",
      color: "bg-brand-red",
    },
    {
      title: "Report a Bug",
      description: "Found an issue? Let us know",
      icon: AlertCircle,
      href: "/contact?type=bug",
      color: "bg-orange-500",
    },
    {
      title: "Feature Request",
      description: "Suggest new features",
      icon: CheckCircle,
      href: "/feature-requests",
      color: "bg-green-500",
    },
    {
      title: "System Status",
      description: "Check service availability",
      icon: Zap,
      href: "/status",
      color: "bg-blue-500",
    },
  ];

  const faqs = [
    {
      question: "How secure is my data on PdfPage?",
      answer:
        "Your files are protected with 256-bit SSL encryption during upload and processing. All files are automatically deleted from our servers within 1 hour after processing. We never store, access, or share your documents.",
    },
    {
      question: "What file formats do you support?",
      answer:
        "We support PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, BMP, GIF, TIFF, and HTML files. Maximum file size is 25MB for free users and 100MB for Premium users.",
    },
    {
      question: "Do I need to create an account to use PdfPage?",
      answer:
        "No account required for basic PDF tools! You can use most features without signing up. Creating an account gives you access to file history, Premium features, and priority support.",
    },
    {
      question: "What's included in Premium?",
      answer:
        "Premium includes unlimited file processing, no ads, batch processing, OCR text recognition, priority support, larger file size limits, and advanced security features.",
    },
    {
      question: "Can I cancel my Premium subscription anytime?",
      answer:
        "Yes! You can cancel your Premium subscription at any time from your account dashboard. You'll retain Premium access until the end of your current billing period.",
    },
    {
      question: "How does batch processing work?",
      answer:
        "Premium users can upload multiple files at once and apply the same operation to all files simultaneously. This saves significant time when processing large numbers of documents.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-brand-red/5 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-text-dark mb-6">
              How can we <span className="text-brand-red">help you?</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Find answers to your questions, learn how to use our tools, and
              get the most out of PdfPage
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative mb-8">
              <Input
                placeholder="Search for help articles, guides, and FAQs..."
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 focus:border-brand-red"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-medium" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  className="group bg-white rounded-lg p-4 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100"
                >
                  <div
                    className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-text-dark text-sm mb-1">
                    {action.title}
                  </h3>
                  <p className="text-xs text-text-medium">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Browse by Category */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link key={index} to={category.href} className="group">
                <Card className="h-full hover:shadow-lg transition-shadow border-0 shadow-md">
                  <CardContent className="p-6">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-dark mb-2 group-hover:text-brand-red transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-text-medium text-sm mb-3 leading-relaxed">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {category.articleCount} articles
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-text-light group-hover:text-brand-red group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Articles */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Popular Articles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {popularArticles.map((article, index) => (
              <Link key={index} to={article.href} className="group">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-brand-red/10 text-brand-red border-brand-red/20">
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-3 text-xs text-text-light">
                        <span>{article.readTime}</span>
                        <span>•</span>
                        <span>{article.views} views</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-text-dark mb-2 group-hover:text-brand-red transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-text-medium text-sm leading-relaxed">
                      {article.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-text-dark mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-text-medium leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">
                View All FAQs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Still Need Help */}
        <section className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-text-dark mb-4">
            Still need help?
          </h2>
          <p className="text-text-medium mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help
            you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-brand-red hover:bg-red-700" asChild>
              <Link to="/contact">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/feature-requests">Submit Feature Request</Link>
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Help;
