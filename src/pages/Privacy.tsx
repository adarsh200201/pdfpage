import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Eye,
  Globe,
  UserX,
  Mail,
  Clock,
  CheckCircle,
  FileText,
  Users,
} from "lucide-react";

const Privacy = () => {
  const lastUpdated = "December 15, 2024";

  const sections = [
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: FileText,
    },
    {
      id: "how-we-use",
      title: "How We Use Your Information",
      icon: Users,
    },
    {
      id: "file-processing",
      title: "File Processing & Security",
      icon: Shield,
    },
    {
      id: "data-sharing",
      title: "Information Sharing",
      icon: Globe,
    },
    {
      id: "data-retention",
      title: "Data Retention",
      icon: Clock,
    },
    {
      id: "your-rights",
      title: "Your Rights & Choices",
      icon: UserX,
    },
    {
      id: "cookies",
      title: "Cookies & Tracking",
      icon: Eye,
    },
    {
      id: "security",
      title: "Security Measures",
      icon: Lock,
    },
    {
      id: "contact-us",
      title: "Contact Information",
      icon: Mail,
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
              Privacy <span className="text-brand-red">Policy</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Your privacy is our priority. Learn how we collect, use, and
              protect your personal information.
            </p>
            <Badge className="bg-brand-red/10 text-brand-red border-brand-red/20">
              Last updated: {lastUpdated}
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {sections.map((section, index) => (
                    <a
                      key={index}
                      href={`#${section.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <section.icon className="h-4 w-4 text-brand-red" />
                      <span className="text-text-medium hover:text-text-dark">
                        {section.title}
                      </span>
                    </a>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Introduction */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-4">
                  Introduction
                </h2>
                <p className="text-text-medium leading-relaxed mb-4">
                  PdfPage ("we," "our," or "us") is committed to protecting your
                  privacy and ensuring transparency about how we handle your
                  personal information. This Privacy Policy explains what
                  information we collect, how we use it, and your rights
                  regarding your personal data.
                </p>
                <p className="text-text-medium leading-relaxed">
                  By using our services, you agree to the collection and use of
                  information in accordance with this policy. This policy
                  complies with the General Data Protection Regulation (GDPR)
                  and other applicable privacy laws.
                </p>
              </CardContent>
            </Card>

            {/* Information Collection */}
            <Card id="information-collection">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  Information We Collect
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Files You Upload
                    </h3>
                    <p className="text-text-medium leading-relaxed mb-3">
                      When you use our PDF processing tools, we temporarily
                      process the files you upload. These files may contain
                      personal information depending on their content.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800 mb-1">
                            Important:
                          </p>
                          <p className="text-green-700 text-sm">
                            All uploaded files are automatically deleted from
                            our servers within 1 hour of processing. We do not
                            store, access, or analyze the content of your files.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Account Information
                    </h3>
                    <p className="text-text-medium leading-relaxed">
                      If you create an account, we collect:
                    </p>
                    <ul className="list-disc list-inside text-text-medium mt-2 space-y-1">
                      <li>Email address</li>
                      <li>Name (optional)</li>
                      <li>Password (encrypted)</li>
                      <li>Account preferences and settings</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Usage Information
                    </h3>
                    <p className="text-text-medium leading-relaxed">
                      We automatically collect certain information about your
                      use of our services:
                    </p>
                    <ul className="list-disc list-inside text-text-medium mt-2 space-y-1">
                      <li>IP address and approximate location</li>
                      <li>Browser type and version</li>
                      <li>Pages visited and features used</li>
                      <li>Time and date of visits</li>
                      <li>Referring website</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Information */}
            <Card id="how-we-use">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  How We Use Your Information
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-brand-red mt-1" />
                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Provide Our Services
                      </h3>
                      <p className="text-text-medium">
                        Process your PDF files and deliver the requested output
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-brand-red mt-1" />
                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Account Management
                      </h3>
                      <p className="text-text-medium">
                        Create and manage user accounts, process payments
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-brand-red mt-1" />
                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Service Improvement
                      </h3>
                      <p className="text-text-medium">
                        Analyze usage patterns to improve our tools and user
                        experience
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-brand-red mt-1" />
                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Communication
                      </h3>
                      <p className="text-text-medium">
                        Send important updates, security notices, and customer
                        support
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-brand-red mt-1" />
                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Legal Compliance
                      </h3>
                      <p className="text-text-medium">
                        Comply with legal obligations and protect against misuse
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Processing & Security */}
            <Card id="file-processing">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  File Processing & Security
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-blue-800 mb-2">
                        Zero Data Retention Policy
                      </h3>
                      <p className="text-blue-700">
                        We have a strict zero data retention policy for user
                        files. All uploaded documents are automatically deleted
                        from our servers within 1 hour of processing, regardless
                        of whether the processing was successful or not.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Processing Security
                    </h3>
                    <ul className="space-y-2 text-text-medium">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                        <span>
                          All file transfers use 256-bit SSL encryption
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                        <span>
                          Files are processed in isolated, secure environments
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                        <span>
                          No human access to file contents during processing
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                        <span>
                          Automatic deletion prevents unauthorized access
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Sharing */}
            <Card id="data-sharing">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  Information Sharing
                </h2>

                <p className="text-text-medium leading-relaxed mb-6">
                  We do not sell, trade, or rent your personal information to
                  third parties. We may share information only in the following
                  limited circumstances:
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-text-dark">
                      Service Providers
                    </h3>
                    <p className="text-text-medium">
                      We work with trusted third-party service providers for
                      payment processing, analytics, and infrastructure. These
                      providers are bound by strict data protection agreements.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-text-dark">
                      Legal Requirements
                    </h3>
                    <p className="text-text-medium">
                      We may disclose information if required by law, legal
                      process, or to protect the rights, property, and safety of
                      PdfPage, our users, or others.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-text-dark">
                      Business Transfers
                    </h3>
                    <p className="text-text-medium">
                      In the event of a merger, acquisition, or sale, user
                      information may be transferred as part of the business
                      assets, subject to the same privacy protections.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card id="your-rights">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  Your Rights & Choices
                </h2>

                <p className="text-text-medium leading-relaxed mb-6">
                  Under GDPR and other privacy laws, you have the following
                  rights regarding your personal data:
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-text-dark">Access</h3>
                      <p className="text-text-medium text-sm">
                        Request a copy of your personal data
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Rectification
                      </h3>
                      <p className="text-text-medium text-sm">
                        Correct inaccurate or incomplete data
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-text-dark">Erasure</h3>
                      <p className="text-text-medium text-sm">
                        Request deletion of your personal data
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Restriction
                      </h3>
                      <p className="text-text-medium text-sm">
                        Limit how we process your data
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Portability
                      </h3>
                      <p className="text-text-medium text-sm">
                        Receive your data in a portable format
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Objection
                      </h3>
                      <p className="text-text-medium text-sm">
                        Object to processing for specific purposes
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Withdraw Consent
                      </h3>
                      <p className="text-text-medium text-sm">
                        Revoke consent at any time
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-text-dark">
                        Lodge Complaints
                      </h3>
                      <p className="text-text-medium text-sm">
                        File complaints with supervisory authorities
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-text-medium">
                    To exercise any of these rights, please contact us at{" "}
                    <a
                      href="mailto:privacy@pdfpage.com"
                      className="text-brand-red hover:underline"
                    >
                      privacy@pdfpage.com
                    </a>
                    . We will respond to your request within 30 days.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card id="contact-us">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  Contact Information
                </h2>

                <p className="text-text-medium leading-relaxed mb-6">
                  If you have any questions about this Privacy Policy or our
                  data practices, please contact us:
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-brand-red" />
                    <div>
                      <p className="font-medium text-text-dark">Email</p>
                      <a
                        href="mailto:privacy@pdfpage.com"
                        className="text-brand-red hover:underline"
                      >
                        privacy@pdfpage.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-brand-red mt-1" />
                    <div>
                      <p className="font-medium text-text-dark">Address</p>
                      <p className="text-text-medium">
                        PdfPage Inc.
                        <br />
                        123 Market Street, Suite 300
                        <br />
                        patna, Bihar 94105
                        <br />
                        India
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-brand-red/5 rounded-lg">
                  <p className="text-sm text-text-medium">
                    This policy may be updated periodically. We will notify
                    users of significant changes via email or prominent notice
                    on our website. Continued use of our services after changes
                    constitutes acceptance of the updated policy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;
