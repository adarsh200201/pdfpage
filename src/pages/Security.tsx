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
  Server,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Cloud,
  Key,
  Zap,
  Database,
  Monitor,
  Mail,
} from "lucide-react";

const Security = () => {
  const securityFeatures = [
    {
      title: "256-bit SSL Encryption",
      description:
        "All data in transit is protected with industry-standard encryption",
      icon: Lock,
      color: "from-green-500 to-green-600",
      details: [
        "TLS 1.3 protocol for maximum security",
        "Perfect Forward Secrecy (PFS)",
        "HSTS headers for secure connections",
        "Certificate transparency monitoring",
      ],
    },
    {
      title: "Zero Data Retention",
      description:
        "Files are automatically deleted within 1 hour of processing",
      icon: Clock,
      color: "from-blue-500 to-blue-600",
      details: [
        "Automatic file deletion after processing",
        "No long-term storage of user files",
        "Secure deletion using DoD standards",
        "Real-time processing without persistence",
      ],
    },
    {
      title: "Isolated Processing",
      description: "Each file is processed in a secure, isolated environment",
      icon: Server,
      color: "from-purple-500 to-purple-600",
      details: [
        "Containerized processing environments",
        "No cross-contamination between files",
        "Memory isolation for each operation",
        "Process sandboxing for security",
      ],
    },
    {
      title: "Access Controls",
      description: "Strict access controls and authentication for all systems",
      icon: Key,
      color: "from-red-500 to-red-600",
      details: [
        "Multi-factor authentication required",
        "Role-based access control (RBAC)",
        "Principle of least privilege",
        "Regular access reviews and audits",
      ],
    },
    {
      title: "Infrastructure Security",
      description:
        "Enterprise-grade cloud infrastructure with multiple security layers",
      icon: Cloud,
      color: "from-orange-500 to-orange-600",
      details: [
        "AWS/Azure enterprise security features",
        "DDoS protection and mitigation",
        "Network segmentation and firewalls",
        "Intrusion detection and prevention",
      ],
    },
    {
      title: "24/7 Monitoring",
      description: "Continuous monitoring for security threats and anomalies",
      icon: Monitor,
      color: "from-cyan-500 to-cyan-600",
      details: [
        "Real-time security event monitoring",
        "Automated threat detection",
        "SOC team with 24/7 coverage",
        "Incident response procedures",
      ],
    },
  ];

  const complianceStandards = [
    {
      name: "SOC 2 Type II",
      description:
        "Annual audits for security, availability, and confidentiality",
      icon: Shield,
      status: "Certified",
    },
    {
      name: "GDPR Compliant",
      description: "Full compliance with EU data protection regulations",
      icon: Globe,
      status: "Compliant",
    },
    {
      name: "ISO 27001",
      description: "Information security management system certification",
      icon: FileText,
      status: "In Progress",
    },
    {
      name: "PCI DSS",
      description: "Payment card industry data security standards",
      icon: Lock,
      status: "Compliant",
    },
  ];

  const securityPractices = [
    {
      category: "Data Protection",
      practices: [
        "End-to-end encryption for all file transfers",
        "Zero-knowledge architecture - we never see your file contents",
        "Automatic secure deletion after processing",
        "No backup or archival of user files",
        "GDPR-compliant data handling procedures",
      ],
    },
    {
      category: "Infrastructure Security",
      practices: [
        "Multi-region cloud deployment for redundancy",
        "Load balancers with SSL termination",
        "Web Application Firewall (WAF) protection",
        "DDoS mitigation and rate limiting",
        "Regular vulnerability assessments and penetration testing",
      ],
    },
    {
      category: "Application Security",
      practices: [
        "Secure coding practices and code reviews",
        "Input validation and sanitization",
        "OWASP Top 10 vulnerability protection",
        "Dependency scanning for security vulnerabilities",
        "Regular security updates and patches",
      ],
    },
    {
      category: "Operational Security",
      practices: [
        "Employee security training and awareness",
        "Background checks for all staff",
        "Incident response and business continuity plans",
        "Regular security audits and assessments",
        "Secure development lifecycle (SDLC)",
      ],
    },
  ];

  const threatMitigation = [
    {
      threat: "Data Breaches",
      mitigation:
        "Multiple layers of encryption, access controls, and monitoring",
      icon: Shield,
    },
    {
      threat: "Malware & Viruses",
      mitigation:
        "File scanning, isolated processing, and sandboxed environments",
      icon: AlertTriangle,
    },
    {
      threat: "Unauthorized Access",
      mitigation: "MFA, RBAC, and continuous access monitoring",
      icon: Lock,
    },
    {
      threat: "DDoS Attacks",
      mitigation: "CDN protection, rate limiting, and traffic filtering",
      icon: Zap,
    },
    {
      threat: "Data Loss",
      mitigation:
        "Redundant systems, backups, and disaster recovery procedures",
      icon: Database,
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
              Security <span className="text-brand-red">First</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Your data security and privacy are our top priorities. Learn about
              the comprehensive security measures we implement to protect your
              information.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                🔒 256-bit Encryption
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                ⏱️ 1-Hour File Deletion
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                🛡️ SOC 2 Certified
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Security Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Our Security Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-text-medium text-sm mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <div>
                    <p className="font-medium text-text-dark text-xs mb-2">
                      Key Features:
                    </p>
                    <ul className="text-text-medium text-xs space-y-1">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Compliance Standards */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Compliance & Certifications
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceStandards.map((standard, index) => (
              <Card key={index} className="text-center border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <standard.icon className="h-8 w-8 text-brand-red" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-2">
                    {standard.name}
                  </h3>
                  <p className="text-text-medium text-sm mb-3">
                    {standard.description}
                  </p>
                  <Badge
                    className={
                      standard.status === "Certified" ||
                      standard.status === "Compliant"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }
                  >
                    {standard.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Security Practices */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Security Practices
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {securityPractices.map((category, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-text-dark">
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {category.practices.map((practice, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-text-medium text-sm">
                          {practice}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Threat Mitigation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Threat Mitigation
          </h2>
          <p className="text-center text-text-medium mb-8 max-w-3xl mx-auto">
            We actively protect against common security threats through multiple
            layers of defense and proactive security measures.
          </p>
          <div className="space-y-4">
            {threatMitigation.map((item, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-dark mb-1">
                        {item.threat}
                      </h3>
                      <p className="text-text-medium">{item.mitigation}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Protected
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Security Architecture */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Security Architecture
          </h2>
          <Card className="border-2 border-brand-red/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-3">
                    Edge Security
                  </h3>
                  <ul className="text-text-medium text-sm space-y-2 text-left">
                    <li>• CDN with DDoS protection</li>
                    <li>• Web Application Firewall</li>
                    <li>• SSL/TLS termination</li>
                    <li>• Rate limiting & throttling</li>
                  </ul>
                </div>

                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Server className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-3">
                    Application Layer
                  </h3>
                  <ul className="text-text-medium text-sm space-y-2 text-left">
                    <li>• Input validation & sanitization</li>
                    <li>• Authentication & authorization</li>
                    <li>• Session management</li>
                    <li>• API security controls</li>
                  </ul>
                </div>

                <div>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-3">
                    Data Layer
                  </h3>
                  <ul className="text-text-medium text-sm space-y-2 text-left">
                    <li>• Encryption at rest</li>
                    <li>• Database access controls</li>
                    <li>• Audit logging</li>
                    <li>• Secure deletion procedures</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Security Best Practices for Users */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Security Best Practices for Users
          </h2>
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-text-dark mb-4">
                    Protect Your Files
                  </h3>
                  <ul className="space-y-3 text-text-medium">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>
                        Only upload files you own or have permission to process
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>Remove sensitive information before uploading</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>
                        Use strong passwords for password-protected PDFs
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>Verify downloaded files are what you expect</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-text-dark mb-4">
                    Account Security
                  </h3>
                  <ul className="space-y-3 text-text-medium">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>
                        Use a strong, unique password for your account
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>
                        Enable two-factor authentication when available
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>Log out of shared or public computers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>Report suspicious activity immediately</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Incident Response */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Incident Response & Reporting
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-brand-red" />
                  Report Security Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-medium mb-4">
                  If you discover a security vulnerability or incident, please
                  report it immediately:
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Security Email:</strong>{" "}
                    <a
                      href="mailto:security@pdfpage.com"
                      className="text-brand-red hover:underline"
                    >
                      security@pdfpage.com
                    </a>
                  </p>
                  <p>
                    <strong>Response Time:</strong> Within 24 hours
                  </p>
                  <p>
                    <strong>Disclosure Policy:</strong> Responsible disclosure
                  </p>
                </div>
                <Button className="mt-4 bg-brand-red hover:bg-red-700" asChild>
                  <a href="mailto:security@pdfpage.com">
                    <Mail className="mr-2 h-4 w-4" />
                    Report Issue
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-brand-red" />
                  Our Response Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-text-medium text-sm">
                  <li className="flex items-start gap-3">
                    <span className="bg-brand-red text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Immediate acknowledgment and investigation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-brand-red text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>Impact assessment and containment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-brand-red text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>Remediation and security improvements</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-brand-red text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <span>User notification and transparency report</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact */}
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-text-dark mb-4">
              Questions About Security?
            </h2>
            <p className="text-text-medium mb-6 max-w-2xl mx-auto">
              Our security team is here to answer your questions and address any
              concerns about the safety of your data on PdfPage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-brand-red hover:bg-red-700">
                <Link to="/contact">Contact Security Team</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/privacy">Privacy Policy</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/gdpr">GDPR Information</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Security;
