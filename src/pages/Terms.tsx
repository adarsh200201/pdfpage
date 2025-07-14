import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  FileText,
  Shield,
  CreditCard,
  Users,
  AlertTriangle,
  Mail,
  Scale,
  Clock,
  Globe,
} from "lucide-react";

const Terms = () => {
  const lastUpdated = "December 15, 2024";

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: FileText,
    },
    {
      id: "description",
      title: "Service Description",
      icon: Globe,
    },
    {
      id: "user-accounts",
      title: "User Accounts",
      icon: Users,
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use Policy",
      icon: Shield,
    },
    {
      id: "content-rights",
      title: "Content & Intellectual Property",
      icon: FileText,
    },
    {
      id: "payment-terms",
      title: "Payment Terms",
      icon: CreditCard,
    },
    {
      id: "privacy-security",
      title: "Privacy & Security",
      icon: Shield,
    },
    {
      id: "disclaimers",
      title: "Disclaimers & Limitations",
      icon: AlertTriangle,
    },
    {
      id: "termination",
      title: "Termination",
      icon: Clock,
    },
    {
      id: "governing-law",
      title: "Governing Law",
      icon: Scale,
    },
    {
      id: "contact",
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
              Terms of <span className="text-brand-red">Service</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              These terms govern your use of PdfPage and outline the rights and
              responsibilities of all users.
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
                  Welcome to PdfPage. These Terms of Service ("Terms") govern
                  your access to and use of our PDF processing services,
                  website, and applications (collectively, the "Service")
                  operated by PdfPage Inc. ("PdfPage," "we," "us," or "our").
                </p>
                <p className="text-text-medium leading-relaxed">
                  By accessing or using our Service, you agree to be bound by
                  these Terms. If you disagree with any part of these terms,
                  then you may not access the Service.
                </p>
              </CardContent>
            </Card>

            {/* Acceptance of Terms */}
            <Card id="acceptance">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  1. Acceptance of Terms
                </h2>

                <div className="space-y-4">
                  <p className="text-text-medium leading-relaxed">
                    By accessing and using PdfPage, you acknowledge that you
                    have read, understood, and agree to be bound by these Terms
                    and our Privacy Policy. These Terms apply to all visitors,
                    users, and others who access or use the Service.
                  </p>

                  <p className="text-text-medium leading-relaxed">
                    If you are using the Service on behalf of an organization,
                    you represent and warrant that you have the authority to
                    bind that organization to these Terms.
                  </p>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800 mb-1">
                          Age Requirement
                        </p>
                        <p className="text-yellow-700 text-sm">
                          You must be at least 18 years old to use this Service.
                          By using PdfPage, you represent that you meet this age
                          requirement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card id="description">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  2. Service Description
                </h2>

                <div className="space-y-4">
                  <p className="text-text-medium leading-relaxed">
                    PdfPage provides online PDF processing tools that allow
                    users to:
                  </p>

                  <ul className="list-disc list-inside text-text-medium space-y-2 ml-4">
                    <li>Merge, split, and compress PDF documents</li>
                    <li>Convert PDFs to and from various file formats</li>
                    <li>Edit, annotate, and sign PDF documents</li>
                    <li>Protect and unlock PDF files</li>
                    <li>Organize and manipulate PDF pages</li>
                    <li>Extract text and images from PDFs</li>
                  </ul>

                  <p className="text-text-medium leading-relaxed">
                    We reserve the right to modify, suspend, or discontinue any
                    part of the Service at any time without prior notice. We may
                    also impose limits on certain features or restrict access to
                    parts of the Service without notice or liability.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* User Accounts */}
            <Card id="user-accounts">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  3. User Accounts
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Account Creation
                    </h3>
                    <p className="text-text-medium leading-relaxed">
                      You may create an account to access additional features.
                      When creating an account, you must provide accurate,
                      complete, and current information.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Account Security
                    </h3>
                    <p className="text-text-medium leading-relaxed mb-3">
                      You are responsible for:
                    </p>
                    <ul className="list-disc list-inside text-text-medium space-y-1 ml-4">
                      <li>
                        Safeguarding your password and account credentials
                      </li>
                      <li>All activities that occur under your account</li>
                      <li>Immediately notifying us of any unauthorized use</li>
                      <li>Maintaining the security of your account</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Account Termination
                    </h3>
                    <p className="text-text-medium leading-relaxed">
                      You may delete your account at any time. We may suspend or
                      terminate your account if you violate these Terms or
                      engage in activities that could harm our Service or other
                      users.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acceptable Use Policy */}
            <Card id="acceptable-use">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  4. Acceptable Use Policy
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Permitted Uses
                    </h3>
                    <p className="text-text-medium leading-relaxed">
                      You may use our Service for lawful purposes only, in
                      accordance with these Terms and all applicable laws and
                      regulations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Prohibited Uses
                    </h3>
                    <p className="text-text-medium leading-relaxed mb-3">
                      You agree not to:
                    </p>
                    <ul className="list-disc list-inside text-text-medium space-y-2 ml-4">
                      <li>
                        Upload files containing illegal, harmful, or copyrighted
                        content without permission
                      </li>
                      <li>
                        Attempt to gain unauthorized access to our systems or
                        other users' accounts
                      </li>
                      <li>
                        Use the Service to transmit malware, viruses, or other
                        harmful code
                      </li>
                      <li>Violate any applicable laws or regulations</li>
                      <li>Interfere with or disrupt the Service or servers</li>
                      <li>
                        Use automated tools to access the Service without
                        permission
                      </li>
                      <li>
                        Reverse engineer or attempt to extract source code
                      </li>
                      <li>
                        Resell or redistribute the Service without authorization
                      </li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 mb-1">
                          Violation Consequences
                        </p>
                        <p className="text-red-700 text-sm">
                          Violation of these terms may result in immediate
                          account suspension or termination, and we may report
                          illegal activities to appropriate authorities.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card id="payment-terms">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  5. Payment Terms
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Premium Services
                    </h3>
                    <p className="text-text-medium leading-relaxed">
                      Some features require a Premium subscription. By
                      purchasing Premium access, you agree to pay all fees
                      associated with your chosen plan.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Billing
                    </h3>
                    <ul className="list-disc list-inside text-text-medium space-y-2 ml-4">
                      <li>
                        Fees are charged in advance on a monthly or annual basis
                      </li>
                      <li>
                        All fees are non-refundable except as required by law
                      </li>
                      <li>
                        Prices may change with 30 days notice to existing
                        subscribers
                      </li>
                      <li>Failed payments may result in service suspension</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Cancellation
                    </h3>
                    <p className="text-text-medium leading-relaxed">
                      You may cancel your Premium subscription at any time.
                      Cancellation takes effect at the end of your current
                      billing period, and you will retain access until that
                      time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimers */}
            <Card id="disclaimers">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  6. Disclaimers & Limitations
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Service Availability
                    </h3>
                    <p className="text-text-medium leading-relaxed">
                      We strive to maintain high service availability but cannot
                      guarantee uninterrupted access. The Service is provided
                      "as is" without warranties of any kind.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Limitation of Liability
                    </h3>
                    <p className="text-text-medium leading-relaxed">
                      To the maximum extent permitted by law, PdfPage shall not
                      be liable for any indirect, incidental, special,
                      consequential, or punitive damages arising from your use
                      of the Service.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-dark mb-3">
                      Data Loss
                    </h3>
                    <p className="text-text-medium leading-relaxed">
                      While we implement security measures, you are responsible
                      for maintaining backups of your important files. We are
                      not liable for any data loss or corruption.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Governing Law */}
            <Card id="governing-law">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  7. Governing Law
                </h2>

                <div className="space-y-4">
                  <p className="text-text-medium leading-relaxed">
                    These Terms shall be governed by and construed in accordance
                    with the laws of the State of California, United States,
                    without regard to its conflict of law provisions.
                  </p>

                  <p className="text-text-medium leading-relaxed">
                    Any disputes arising from these Terms or your use of the
                    Service shall be resolved through binding arbitration in San
                    Francisco, California, except for claims that may be brought
                    in small claims court.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card id="contact">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-dark mb-6">
                  8. Contact Information
                </h2>

                <p className="text-text-medium leading-relaxed mb-6">
                  If you have any questions about these Terms of Service, please
                  contact us:
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-brand-red" />
                    <div>
                      <p className="font-medium text-text-dark">Email</p>
                      <a
                        href="mailto:Hipdfpage@gmail.com"
                        className="text-brand-red hover:underline"
                      >
                        Hipdfpage@gmail.com
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
                        Global Remote Company
                        <br />
                        Contact: Hipdfpage@gmail.com
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-brand-red/5 rounded-lg">
                  <p className="text-sm text-text-medium">
                    We reserve the right to modify these Terms at any time. We
                    will notify users of material changes via email or prominent
                    notice on our website. Continued use of the Service after
                    changes constitutes acceptance of the new Terms.
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

export default Terms;
