import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import {
  Download,
  ExternalLink,
  Users,
  TrendingUp,
  Award,
  Globe,
  Calendar,
  FileText,
  Image,
  Video,
  Zap,
  Star,
  Building,
  Mail,
  Phone,
} from "lucide-react";

const Press = () => {
  const pressStats = [
    { icon: Users, number: "2.5M+", label: "Active Users", color: "text-blue-600" },
    { icon: Globe, number: "150+", label: "Countries", color: "text-green-600" },
    { icon: FileText, number: "25+", label: "PDF Tools", color: "text-purple-600" },
    { icon: TrendingUp, number: "500M+", label: "Files Processed", color: "text-orange-600" },
  ];

  const milestones = [
    {
      date: "2024 Q4",
      title: "AI-Powered PDF Tools Launch",
      description: "Introduced AI-powered PDF conversion and editing capabilities",
      type: "Product",
    },
    {
      date: "2024 Q3",
      title: "2 Million User Milestone",
      description: "Reached 2 million active users worldwide",
      type: "Growth",
    },
    {
      date: "2024 Q2",
      title: "Mobile App Launch",
      description: "Released native mobile applications for iOS and Android",
      type: "Product",
    },
    {
      date: "2024 Q1",
      title: "Enterprise Edition",
      description: "Launched enterprise solutions with advanced security features",
      type: "Business",
    },
    {
      date: "2023",
      title: "Company Founded",
      description: "PdfPage was founded to make PDF processing accessible to everyone",
      type: "Milestone",
    },
  ];

  const awards = [
    {
      title: "Best Free PDF Tool 2024",
      organization: "TechRadar",
      date: "2024",
      description: "Recognized for comprehensive features and user experience",
    },
    {
      title: "Editor's Choice Award",
      organization: "PCMag",
      date: "2024",
      description: "Outstanding performance in PDF processing and conversion",
    },
    {
      title: "Innovation Award",
      organization: "Web Summit",
      date: "2024",
      description: "AI-powered document processing innovation",
    },
  ];

  const mediaKit = [
    {
      type: "Logos",
      title: "Company Logos",
      description: "High-resolution logos in various formats",
      items: [
        { name: "Primary Logo (PNG)", size: "2MB", format: "PNG" },
        { name: "Logo Variations (ZIP)", size: "5MB", format: "ZIP" },
        { name: "Brand Guidelines (PDF)", size: "1.5MB", format: "PDF" },
      ],
    },
    {
      type: "Screenshots",
      title: "Product Screenshots",
      description: "Marketing-ready screenshots of all PDF tools and features",
      items: [
        { name: "Tool Interface Screenshots", size: "15MB", format: "ZIP" },
        { name: "Mobile App Screenshots", size: "8MB", format: "ZIP" },
        { name: "Dashboard Screenshots", size: "3MB", format: "ZIP" },
      ],
    },
    {
      type: "Assets",
      title: "Marketing Assets",
      description: "Ready-to-use marketing materials and graphics",
      items: [
        { name: "Social Media Kit", size: "12MB", format: "ZIP" },
        { name: "Banner Images", size: "6MB", format: "ZIP" },
        { name: "Icon Pack", size: "2MB", format: "ZIP" },
      ],
    },
  ];

  const pressReleases = [
    {
      date: "2024-12-15",
      title: "PdfPage Launches Revolutionary AI-Powered PDF Editor",
      excerpt: "New AI technology enables intelligent document editing and automatic formatting corrections.",
      category: "Product Launch",
    },
    {
      date: "2024-11-20",
      title: "PdfPage Reaches 2 Million Active Users Milestone",
      excerpt: "Platform growth accelerates as demand for online PDF tools continues to surge.",
      category: "Company News",
    },
    {
      date: "2024-10-10",
      title: "PdfPage Introduces Enterprise Security Features",
      excerpt: "New enterprise-grade security features meet corporate compliance requirements.",
      category: "Product Update",
    },
    {
      date: "2024-09-05",
      title: "PdfPage Partners with Major Cloud Storage Providers",
      excerpt: "Seamless integration with Google Drive, Dropbox, and OneDrive now available.",
      category: "Partnership",
    },
  ];

  const teamInfo = {
    ceo: {
      name: "Adarsh Kumar",
      title: "CEO & Founder",
      bio: "Passionate about making document processing accessible to everyone. 10+ years in tech innovation.",
      image: "https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=webp&width=200",
    },
    company: {
      name: "PdfPage Technologies LLC",
      founded: "2023",
      headquarters: "Patna, Bihar, India",
      employees: "10-50",
      mission: "To democratize access to professional PDF processing tools through innovative web technology.",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <SEO
        title="Press Kit & Media Resources | PdfPage"
        description="Press kit, media resources, company information, and brand assets for PdfPage - The Ultimate PDF Toolkit. Download logos, screenshots, and press materials."
        keywords="press kit, media resources, company information, brand assets, PdfPage news, press releases"
        canonical="/press"
        ogImage="/images/press-kit.jpg"
      />
      <Header />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30">
              📰 Press & Media
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Press Kit & Media Resources
            </h1>
            <p className="text-xl lg:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed opacity-90">
              Get the latest news, company information, and marketing assets for PdfPage - 
              the world's most trusted PDF processing platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                <Download className="mr-2 h-5 w-5" />
                Download Media Kit
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Mail className="mr-2 h-5 w-5" />
                Contact Press Team
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">PdfPage by the Numbers</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {pressStats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`w-16 h-16 ${stat.color} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold">Latest Press Releases</h2>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View All Releases
            </Button>
          </div>
          <div className="grid gap-6">
            {pressReleases.map((release, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary">{release.category}</Badge>
                        <span className="text-sm text-gray-500">{release.date}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                        {release.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{release.excerpt}</p>
                      <div className="flex gap-3">
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Read Full Release
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit Downloads */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Media Kit & Brand Assets</h2>
          <div className="grid lg:grid-cols-3 gap-8">
            {mediaKit.map((kit, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    {kit.type === "Logos" && <Image className="w-8 h-8 text-white" />}
                    {kit.type === "Screenshots" && <Video className="w-8 h-8 text-white" />}
                    {kit.type === "Assets" && <Zap className="w-8 h-8 text-white" />}
                  </div>
                  <CardTitle className="text-xl">{kit.title}</CardTitle>
                  <p className="text-gray-600">{kit.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {kit.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.size} • {item.format}</div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button className="w-full mt-4">
                    <Download className="mr-2 h-4 w-4" />
                    Download All {kit.type}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Company Milestones</h2>
          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start mb-8 last:mb-0">
                <div className="flex-shrink-0 w-24 text-right pr-6">
                  <div className="text-sm font-semibold text-blue-600">{milestone.date}</div>
                </div>
                <div className="flex-shrink-0 w-4 h-4 bg-blue-600 rounded-full mt-1 relative">
                  {index !== milestones.length - 1 && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-blue-200"></div>
                  )}
                </div>
                <div className="flex-1 pl-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
                    <Badge variant="outline">{milestone.type}</Badge>
                  </div>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Awards & Recognition</h2>
          <div className="grid lg:grid-cols-3 gap-8">
            {awards.map((award, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{award.title}</h3>
                  <p className="text-blue-600 font-medium mb-2">{award.organization}</p>
                  <p className="text-gray-500 text-sm mb-3">{award.date}</p>
                  <p className="text-gray-600">{award.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Company Information</h2>
          <div className="grid lg:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Building className="w-6 h-6 text-blue-600" />
                  About PdfPage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Founded</div>
                    <div className="font-semibold">{teamInfo.company.founded}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Employees</div>
                    <div className="font-semibold">{teamInfo.company.employees}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Headquarters</div>
                    <div className="font-semibold">{teamInfo.company.headquarters}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Legal Name</div>
                    <div className="font-semibold">{teamInfo.company.name}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Mission</div>
                  <p className="text-gray-700">{teamInfo.company.mission}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <User className="w-6 h-6 text-blue-600" />
                  Leadership Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <img
                    src={teamInfo.ceo.image}
                    alt={teamInfo.ceo.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{teamInfo.ceo.name}</h3>
                    <p className="text-blue-600 text-sm mb-2">{teamInfo.ceo.title}</p>
                    <p className="text-gray-600 text-sm">{teamInfo.ceo.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Press Contact</h2>
          <div className="max-w-2xl mx-auto">
            <p className="text-xl mb-8 opacity-90">
              For press inquiries, interviews, or additional information, please contact our media team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                <Mail className="mr-2 h-5 w-5" />
                press@pdfpage.in
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Phone className="mr-2 h-5 w-5" />
                +1 (800) PDF-PAGE
              </Button>
            </div>
            <p className="mt-6 text-sm opacity-75">
              Response time: 24-48 hours for media inquiries
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Press;
