import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import {
  Shield,
  Download,
  Trash2,
  Edit,
  Eye,
  Lock,
  UserX,
  Mail,
  CheckCircle,
  Globe,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";

const Gdpr = () => {
  const userRights = [
    {
      title: "Right to Access",
      description:
        "You can request a copy of all personal data we hold about you",
      icon: Eye,
      color: "from-blue-500 to-blue-600",
      examples: [
        "Account information",
        "Usage history",
        "Processing logs",
        "Communication records",
      ],
    },
    {
      title: "Right to Rectification",
      description: "You can request correction of inaccurate personal data",
      icon: Edit,
      color: "from-green-500 to-green-600",
      examples: [
        "Update email address",
        "Correct name spelling",
        "Fix billing information",
        "Update preferences",
      ],
    },
    {
      title: "Right to Erasure",
      description:
        "You can request deletion of your personal data (right to be forgotten)",
      icon: Trash2,
      color: "from-red-500 to-red-600",
      examples: [
        "Delete account completely",
        "Remove processing history",
        "Erase personal identifiers",
        "Clear stored preferences",
      ],
    },
    {
      title: "Right to Restrict Processing",
      description: "You can request limitation of how we process your data",
      icon: Lock,
      color: "from-yellow-500 to-yellow-600",
      examples: [
        "Stop marketing emails",
        "Limit analytics tracking",
        "Pause automated processing",
        "Restrict data sharing",
      ],
    },
    {
      title: "Right to Data Portability",
      description:
        "You can request your data in a structured, commonly used format",
      icon: Download,
      color: "from-purple-500 to-purple-600",
      examples: [
        "Export account data",
        "Download usage history",
        "Transfer to another service",
        "Backup personal information",
      ],
    },
    {
      title: "Right to Object",
      description:
        "You can object to processing for specific purposes, including direct marketing",
      icon: UserX,
      color: "from-orange-500 to-orange-600",
      examples: [
        "Opt out of marketing",
        "Stop profiling",
        "Refuse automated decisions",
        "Object to legitimate interests",
      ],
    },
  ];

  const legalBases = [
    {
      basis: "Consent",
      description: "You have given clear consent for processing",
      examples: [
        "Marketing emails",
        "Optional analytics",
        "Cookie preferences",
      ],
      icon: CheckCircle,
    },
    {
      basis: "Contract",
      description: "Processing is necessary to fulfill our service contract",
      examples: ["PDF processing", "Account management", "Payment processing"],
      icon: FileText,
    },
    {
      basis: "Legal Obligation",
      description: "Required by law to process certain data",
      examples: ["Tax records", "Anti-fraud measures", "Legal compliance"],
      icon: Shield,
    },
    {
      basis: "Legitimate Interest",
      description:
        "Our legitimate business interests that don't override your rights",
      examples: [
        "Security monitoring",
        "Service improvement",
        "Customer support",
      ],
      icon: Globe,
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
              GDPR <span className="text-brand-red">Compliance</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Your data protection rights under the General Data Protection
              Regulation and how we protect your privacy.
            </p>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              🇪🇺 EU Data Protection Compliant
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <Shield className="h-8 w-8 text-brand-red mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-text-dark mb-4">
                  What is GDPR?
                </h2>
                <p className="text-text-medium leading-relaxed mb-4">
                  The General Data Protection Regulation (GDPR) is a
                  comprehensive data protection law that came into effect on May
                  25, 2018. It strengthens and unifies data protection for
                  individuals within the European Union and applies to all
                  companies processing EU residents' personal data.
                </p>
                <p className="text-text-medium leading-relaxed">
                  At PdfPage, we are committed to full GDPR compliance and
                  protecting your fundamental right to privacy. This page
                  explains your rights under GDPR and how we ensure compliance
                  in all our data processing activities.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Our GDPR Commitment
                  </h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Complete transparency about data processing</li>
                    <li>• Respect for all individual rights under GDPR</li>
                    <li>• Minimal data collection and processing</li>
                    <li>• Strong security measures and breach notification</li>
                    <li>• Regular compliance audits and staff training</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Your Data Protection Rights
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRights.map((right, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${right.color} rounded-lg flex items-center justify-center mb-4`}
                  >
                    <right.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-3">
                    {right.title}
                  </h3>
                  <p className="text-text-medium text-sm mb-4 leading-relaxed">
                    {right.description}
                  </p>
                  <div>
                    <p className="font-medium text-text-dark text-xs mb-2">
                      Examples:
                    </p>
                    <ul className="text-text-medium text-xs space-y-1">
                      {right.examples.map((example, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Legal Bases */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Legal Bases for Processing
          </h2>
          <p className="text-center text-text-medium mb-8 max-w-3xl mx-auto">
            Under GDPR, we must have a legal basis for processing your personal
            data. Here are the legal bases we rely on:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {legalBases.map((basis, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center">
                      <basis.icon className="h-5 w-5 text-brand-red" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-dark mb-2">
                        {basis.basis}
                      </h3>
                      <p className="text-text-medium text-sm mb-3">
                        {basis.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium text-text-dark text-sm mb-2">
                      Examples:
                    </p>
                    <ul className="text-text-medium text-sm space-y-1">
                      {basis.examples.map((example, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Data Request Form */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Exercise Your Rights
          </h2>

          <Card className="max-w-4xl mx-auto border-2 border-brand-red/20">
            <CardHeader className="bg-brand-red/5">
              <CardTitle className="text-center">
                Data Protection Request Form
              </CardTitle>
              <p className="text-center text-text-medium">
                Use this form to exercise any of your GDPR rights. We will
                respond within 30 days.
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" placeholder="Enter your full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <Label htmlFor="request-type">Type of Request *</Label>
                <select className="w-full p-3 border border-gray-300 rounded-md">
                  <option value="">Select a request type</option>
                  <option value="access">
                    Right to Access - Request my personal data
                  </option>
                  <option value="rectification">
                    Right to Rectification - Correct my data
                  </option>
                  <option value="erasure">
                    Right to Erasure - Delete my data
                  </option>
                  <option value="restrict">Right to Restrict Processing</option>
                  <option value="portability">Right to Data Portability</option>
                  <option value="object">Right to Object to Processing</option>
                  <option value="withdraw-consent">Withdraw Consent</option>
                  <option value="complaint">Lodge a Complaint</option>
                </select>
              </div>

              <div className="space-y-2 mb-6">
                <Label htmlFor="description">Request Details *</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about your request. Include any specific data or processing activities you're concerned about."
                  rows={5}
                />
              </div>

              <div className="space-y-2 mb-6">
                <Label htmlFor="verification">Identity Verification</Label>
                <Textarea
                  id="verification"
                  placeholder="To protect your privacy, please provide information that helps us verify your identity (e.g., account details, recent activities, etc.)"
                  rows={3}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 mb-1">
                      Identity Verification Required
                    </p>
                    <p className="text-yellow-700 text-sm">
                      To protect your privacy and prevent unauthorized access,
                      we may request additional verification before processing
                      your request. This may include verification of your
                      identity through your registered email address or account
                      details.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button className="bg-brand-red hover:bg-red-700 flex-1">
                  Submit Request
                </Button>
                <Button variant="outline">Clear Form</Button>
              </div>

              <div className="mt-6 text-center text-sm text-text-medium">
                <p>
                  We will acknowledge your request within 72 hours and provide a
                  full response within 30 days. For complex requests, we may
                  extend this period by an additional 60 days with proper
                  notification.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Data Processing Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            How We Process Your Data
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-dark mb-3">
                  Minimal Retention
                </h3>
                <p className="text-text-medium text-sm">
                  We keep personal data only as long as necessary for the
                  purposes it was collected. Files are automatically deleted
                  within 1 hour.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-dark mb-3">
                  Strong Security
                </h3>
                <p className="text-text-medium text-sm">
                  All data is protected with enterprise-grade security measures
                  including encryption, access controls, and regular audits.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-dark mb-3">
                  Transparent Processing
                </h3>
                <p className="text-text-medium text-sm">
                  We provide clear information about what data we collect, why
                  we collect it, and how we use it in our Privacy Policy.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact and Complaints */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Contact & Complaints
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-brand-red" />
                  Data Protection Officer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-medium mb-4">
                  For any questions about data protection or to exercise your
                  rights:
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:dpo@pdfpage.com"
                      className="text-brand-red hover:underline"
                    >
                      dpo@pdfpage.com
                    </a>
                  </p>
                  <p>
                    <strong>Address:</strong> Data Protection Officer, PdfPage
                    Inc., 123 Market Street, Suite 300, patna, Bihar 843117
                  </p>
                  <p>
                    <strong>Response Time:</strong> Within 30 days
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-brand-red" />
                  Supervisory Authority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-medium mb-4">
                  You have the right to lodge a complaint with your local
                  supervisory authority:
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>EU:</strong> Your local Data Protection Authority
                  </p>
                  <p>
                    <strong>UK:</strong> Information Commissioner's Office (ICO)
                  </p>
                  <p>
                    <strong>Other regions:</strong> Contact your local privacy
                    regulator
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <a
                    href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Find Your Authority
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Links */}
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-text-dark mb-4">
              Related Information
            </h2>
            <p className="text-text-medium mb-6">
              Learn more about how we protect your privacy and handle your data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-brand-red hover:bg-red-700">
                <Link to="/privacy">Privacy Policy</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/cookies">Cookie Policy</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/security">Security Information</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Gdpr;
