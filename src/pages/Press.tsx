import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Calendar,
  Download,
  ExternalLink,
  Award,
  Users,
  TrendingUp,
  Globe,
  FileText,
  Image,
  Video,
} from "lucide-react";

const Press = () => {
  const pressReleases = [
    {
      title: "PdfPage Reaches 10 Million PDF Processing Milestone",
      date: "December 15, 2024",
      excerpt:
        "Leading PDF toolkit platform celebrates major user growth and announces new enterprise features.",
      category: "Company News",
      href: "/press/10-million-milestone",
    },
    {
      title: "PdfPage Introduces Advanced AI-Powered PDF Analysis",
      date: "November 28, 2024",
      excerpt:
        "New machine learning capabilities enable intelligent document classification and content extraction.",
      category: "Product Launch",
      href: "/press/ai-powered-analysis",
    },
    {
      title: "PdfPage Partners with Microsoft for Enterprise Integration",
      date: "October 15, 2024",
      excerpt:
        "Strategic partnership brings seamless PDF processing to Microsoft 365 ecosystem.",
      category: "Partnership",
      href: "/press/microsoft-partnership",
    },
    {
      title: "PdfPage Raises $25M Series B for Global Expansion",
      date: "September 10, 2024",
      excerpt:
        "Funding round led by Accel Partners will accelerate international growth and product development.",
      category: "Funding",
      href: "/press/series-b-funding",
    },
  ];

  const mediaKit = [
    {
      title: "Company Logo Pack",
      description: "High-resolution logos in various formats (PNG, SVG, EPS)",
      type: "Images",
      icon: Image,
      size: "2.3 MB",
      href: "/media/logo-pack.zip",
    },
    {
      title: "Product Screenshots",
      description: "Marketing-ready screenshots of all PDF tools and features",
      type: "Images",
      icon: Image,
      size: "15.7 MB",
      href: "/media/screenshots.zip",
    },
    {
      title: "Company Fact Sheet",
      description: "Key statistics, milestones, and company information",
      type: "Document",
      icon: FileText,
      size: "245 KB",
      href: "/media/fact-sheet.pdf",
    },
    {
      title: "Executive Photos",
      description: "Professional headshots of leadership team",
      type: "Images",
      icon: Image,
      size: "8.2 MB",
      href: "/media/executive-photos.zip",
    },
    {
      title: "Product Demo Video",
      description: "2-minute overview of PdfPage platform and features",
      type: "Video",
      icon: Video,
      size: "45 MB",
      href: "/media/product-demo.mp4",
    },
  ];

  const awards = [
    {
      title: "Best PDF Software 2024",
      organization: "Software Review",
      date: "2024",
      description:
        "Recognized for innovation in document processing technology",
    },
    {
      title: "Top 50 SaaS Startups",
      organization: "TechCrunch",
      date: "2024",
      description:
        "Featured among the most promising software-as-a-service companies",
    },
    {
      title: "Customer Choice Award",
      organization: "G2 Crowd",
      date: "2023",
      description: "Highest user satisfaction rating in PDF tools category",
    },
    {
      title: "Innovation Excellence Award",
      organization: "Digital Document World",
      date: "2023",
      description: "Outstanding contribution to digital document management",
    },
  ];

  const stats = [
    { number: "10M+", label: "PDFs Processed Monthly", icon: FileText },
    { number: "500K+", label: "Active Users", icon: Users },
    { number: "190+", label: "Countries Served", icon: Globe },
    { number: "99.9%", label: "Platform Uptime", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-brand-red/5 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-text-dark mb-6">
              Press & <span className="text-brand-red">Media</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Latest news, announcements, and media resources about PdfPage
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-brand-red hover:bg-red-700"
              >
                <Link to="/contact">Media Inquiries</Link>
              </Button>
              <Button variant="outline" size="lg">
                <Download className="mr-2 h-4 w-4" />
                Download Media Kit
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-dark mb-4">
              By the Numbers
            </h2>
            <p className="text-lg text-text-medium">
              Key metrics that define our impact
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-brand-red" />
                </div>
                <div className="text-3xl font-bold text-text-dark mb-2">
                  {stat.number}
                </div>
                <div className="text-text-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Press Releases */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-text-dark mb-6">
              Latest Press Releases
            </h2>
            <div className="space-y-6">
              {pressReleases.map((release, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-brand-red/10 text-brand-red border-brand-red/20">
                        {release.category}
                      </Badge>
                      <div className="flex items-center text-sm text-text-light">
                        <Calendar className="h-4 w-4 mr-1" />
                        {release.date}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-text-dark mb-3">
                      {release.title}
                    </h3>
                    <p className="text-text-medium mb-4">{release.excerpt}</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={release.href}>
                        Read Full Release{" "}
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Media Kit */}
            <div>
              <h3 className="text-xl font-bold text-text-dark mb-4">
                Media Kit
              </h3>
              <div className="space-y-3">
                {mediaKit.map((item, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <item.icon className="h-5 w-5 text-brand-red" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-text-dark text-sm mb-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-text-medium mb-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-light">
                              {item.size}
                            </span>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={item.href}>
                                <Download className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Awards */}
            <div>
              <h3 className="text-xl font-bold text-text-dark mb-4">
                Awards & Recognition
              </h3>
              <div className="space-y-4">
                {awards.map((award, index) => (
                  <Card key={index} className="border-l-4 border-l-brand-red">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-brand-red flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-text-dark text-sm mb-1">
                            {award.title}
                          </h4>
                          <p className="text-xs text-brand-red mb-1">
                            {award.organization} • {award.date}
                          </p>
                          <p className="text-xs text-text-medium">
                            {award.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-text-dark mb-4">
            Media Inquiries
          </h2>
          <p className="text-lg text-text-medium mb-8">
            For interviews, press releases, or media assets, please contact our
            press team.
          </p>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-left max-w-md mx-auto space-y-2">
              <div>
                <span className="font-medium text-text-dark">
                  Press Contact:
                </span>
                <span className="text-text-medium ml-2">
                  Sarah Chen, VP Marketing
                </span>
              </div>
              <div>
                <span className="font-medium text-text-dark">Email:</span>
                <span className="text-brand-red ml-2">press@pdfpage.com</span>
              </div>
              <div>
                <span className="font-medium text-text-dark">Phone:</span>
                <span className="text-text-medium ml-2">+91 9572377168</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Press;
