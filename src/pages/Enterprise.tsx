import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import {
  Building,
  Shield,
  Zap,
  Users,
  Globe,
  CheckCircle,
  Star,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Lock,
  Cloud,
  BarChart,
  Settings,
  HeadphonesIcon,
  Award,
  Briefcase,
  Target,
  TrendingUp,
  FileText,
  Database,
  Cpu,
  Network,
} from "lucide-react";

const Enterprise = () => {
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    employees: "",
    message: "",
  });

  const enterpriseFeatures = [
    {
      title: "Advanced Security",
      icon: Shield,
      color: "from-red-500 to-red-600",
      features: [
        "SOC 2 Type II Compliance",
        "GDPR & HIPAA Ready",
        "SSO/SAML Integration",
        "Advanced Encryption (AES-256)",
        "Audit Logs & Compliance Reports",
        "Custom Data Retention Policies",
      ],
    },
    {
      title: "Scale & Performance",
      icon: Zap,
      color: "from-blue-500 to-blue-600",
      features: [
        "Unlimited File Processing",
        "Dedicated Infrastructure",
        "99.9% Uptime SLA",
        "Priority Processing Queue",
        "Load Balancing",
        "Custom API Rate Limits",
      ],
    },
    {
      title: "Team Management",
      icon: Users,
      color: "from-green-500 to-green-600",
      features: [
        "Centralized User Management",
        "Role-Based Access Control",
        "Team Analytics & Reporting",
        "Bulk User Provisioning",
        "Department Organization",
        "Usage Monitoring",
      ],
    },
    {
      title: "Integration & API",
      icon: Network,
      color: "from-purple-500 to-purple-600",
      features: [
        "RESTful API Access",
        "Webhook Support",
        "Third-party Integrations",
        "Custom Workflow Automation",
        "White-label Solutions",
        "SDK & Documentation",
      ],
    },
  ];

  const pricingPlans = [
    {
      name: "Team",
      price: "$29",
      period: "per user/month",
      description: "Perfect for small to medium teams",
      users: "5-50 users",
      popular: false,
      features: [
        "All PDF tools included",
        "100MB file size limit",
        "Priority support",
        "Team collaboration",
        "Basic analytics",
        "SSO integration",
      ],
    },
    {
      name: "Business",
      price: "$49",
      period: "per user/month",
      description: "Ideal for growing businesses",
      users: "50-250 users",
      popular: true,
      features: [
        "Everything in Team",
        "500MB file size limit",
        "Advanced security features",
        "Custom branding",
        "API access",
        "Dedicated account manager",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For large organizations",
      users: "250+ users",
      popular: false,
      features: [
        "Everything in Business",
        "Unlimited file sizes",
        "On-premise deployment",
        "Custom integrations",
        "24/7 phone support",
        "Custom SLA",
      ],
    },
  ];

  const successStories = [
    {
      company: "TechCorp Inc.",
      logo: "https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=webp&width=200",
      industry: "Technology",
      employees: "5,000+",
      results: [
        "75% faster document processing",
        "$50K annual savings",
        "Improved compliance",
      ],
      quote: "PdfPage Enterprise transformed our document workflows. The security features and API integration were exactly what we needed.",
      author: "Sarah Johnson, CTO",
    },
    {
      company: "Global Finance LLC",
      logo: "https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=webp&width=200",
      industry: "Financial Services",
      employees: "2,500+",
      results: [
        "100% compliance achieved",
        "60% reduction in processing time",
        "Enhanced security protocols",
      ],
      quote: "The security and compliance features gave us confidence to process sensitive financial documents at scale.",
      author: "Michael Chen, Head of Operations",
    },
  ];

  const integrations = [
    { name: "Salesforce", category: "CRM" },
    { name: "Microsoft 365", category: "Productivity" },
    { name: "Google Workspace", category: "Productivity" },
    { name: "Slack", category: "Communication" },
    { name: "Dropbox", category: "Storage" },
    { name: "Box", category: "Storage" },
    { name: "SharePoint", category: "Collaboration" },
    { name: "Zapier", category: "Automation" },
    { name: "AWS S3", category: "Storage" },
    { name: "Azure", category: "Cloud" },
    { name: "Jira", category: "Project Management" },
    { name: "ServiceNow", category: "ITSM" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Enterprise inquiry:", formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <SEO
        title="Enterprise PDF Solutions | PdfPage for Business"
        description="Enterprise-grade PDF processing solutions with advanced security, compliance, and team management features. Get custom pricing and dedicated support."
        keywords="enterprise PDF tools, business PDF solutions, team collaboration, API integration, security compliance"
        canonical="/enterprise"
        ogImage="/images/enterprise.jpg"
      />
      <Header />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-white/20 text-white border-white/30">
                🏢 Enterprise Solutions
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                PDF Tools Built for
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                  Enterprise Scale
                </span>
              </h1>
              <p className="text-xl lg:text-2xl mb-8 leading-relaxed opacity-90">
                Secure, compliant, and scalable PDF processing solutions for teams and organizations. 
                Get advanced features, dedicated support, and custom integrations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule Demo
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <FileText className="mr-2 h-5 w-5" />
                  Download Brochure
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">99.9%</div>
                    <div className="text-sm opacity-75">Uptime SLA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">SOC 2</div>
                    <div className="text-sm opacity-75">Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">24/7</div>
                    <div className="text-sm opacity-75">Support</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">500+</div>
                    <div className="text-sm opacity-75">Enterprises</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for security, scale, and seamless integration with your existing workflows
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {enterpriseFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feature.features.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Enterprise Pricing Plans
            </h2>
            <p className="text-xl text-gray-600">
              Flexible pricing to match your organization's needs
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative hover:shadow-xl transition-all duration-300 ${
                plan.popular ? "ring-2 ring-blue-500 scale-105" : ""
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                  <Badge variant="outline" className="mt-2">{plan.users}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See how enterprises are transforming their document workflows
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {successStories.map((story, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={story.logo}
                      alt={`${story.company} logo`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{story.company}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{story.industry}</span>
                        <span>•</span>
                        <span>{story.employees} employees</span>
                      </div>
                    </div>
                  </div>

                  <blockquote className="text-lg text-gray-700 italic mb-6">
                    "{story.quote}"
                  </blockquote>

                  <div className="flex items-center justify-between mb-6">
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900">{story.author}</div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Results:</h4>
                    <div className="space-y-2">
                      {story.results.map((result, resultIndex) => (
                        <div key={resultIndex} className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">{result}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-600">
              Connect with the tools your team already uses
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {integrations.map((integration, index) => (
              <div key={index} className="group">
                <Card className="h-24 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        {integration.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {integration.category}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              <Network className="mr-2 h-5 w-5" />
              View All Integrations
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Ready to Transform Your Document Workflows?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Get a personalized demo and see how PdfPage Enterprise can help your organization 
                process documents more efficiently and securely.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Schedule a Demo</div>
                    <div className="text-white/75">See PdfPage in action with your use cases</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <HeadphonesIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Dedicated Support</div>
                    <div className="text-white/75">Get 24/7 priority support from our experts</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Custom Solutions</div>
                    <div className="text-white/75">Tailored features and integrations for your needs</div>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Get Started Today</CardTitle>
                <p className="text-white/75">Fill out the form and we'll be in touch within 24 hours</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="name"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                      required
                    />
                    <Input
                      name="company"
                      placeholder="Company Name"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                      required
                    />
                  </div>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Work Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                    <Input
                      name="employees"
                      placeholder="Company Size"
                      value={formData.employees}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                  </div>
                  <Textarea
                    name="message"
                    placeholder="Tell us about your PDF processing needs..."
                    value={formData.message}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    rows={4}
                  />
                  <Button type="submit" className="w-full bg-white text-gray-900 hover:bg-gray-100">
                    Schedule Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Enterprise;
