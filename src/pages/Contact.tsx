import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  HeadphonesIcon,
  Users,
  FileText,
  Globe,
  Send,
} from "lucide-react";

const Contact = () => {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help with your account or technical questions",
      contact: "support@pdfpage.com",
      responseTime: "Usually within 2 hours",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Instant help for quick questions and guidance",
      contact: "Available 24/7",
      responseTime: "Immediate response",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our support team",
      contact: "+91 9572377168",
      responseTime: "Mon-Fri, 9AM-6PM PST",
    },
    {
      icon: HeadphonesIcon,
      title: "Premium Support",
      description: "Priority support for Pro and Enterprise users",
      contact: "enterprise@pdfpage.com",
      responseTime: "Within 1 hour",
    },
  ];

  const departments = [
    {
      icon: Users,
      title: "Sales",
      description: "Questions about pricing, features, or enterprise solutions",
      email: "sales@pdfpage.com",
    },
    {
      icon: FileText,
      title: "Press & Media",
      description:
        "Media inquiries, press releases, and partnership opportunities",
      email: "press@pdfpage.com",
    },
    {
      icon: Users,
      title: "Partnerships",
      description: "Integration partnerships and business development",
      email: "partnerships@pdfpage.com",
    },
    {
      icon: Globe,
      title: "General Inquiries",
      description: "Any other questions or feedback",
      email: "hello@pdfpage.com",
    },
  ];

  const offices = [
    {
      city: "patna",
      address: "123 Market Street, Suite 300\npatna, Bihar 94105",
      phone: "+91 9572377168",
      email: "sf@pdfpage.com",
      hours: "Mon-Fri: 9AM-6PM PST",
    },
    {
      city: "patna",
      address: "456 Broadway, Floor 15\npatna, Bihar 10013",
      phone: "+91 9572377168",
      email: "ny@pdfpage.com",
      hours: "Mon-Fri: 9AM-6PM EST",
    },
    {
      city: "patna",
      address: "789 Oxford Street\npatna, Bihar 1DX, UK",
      phone: "+91 9572377168",
      email: "london@pdfpage.com",
      hours: "Mon-Fri: 9AM-5PM GMT",
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
              Get in <span className="text-brand-red">Touch</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              We're here to help with any questions about PdfPage, from
              technical support to enterprise solutions
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Methods */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-dark mb-4">
              How Can We Help?
            </h2>
            <p className="text-lg text-text-medium">
              Choose the best way to reach us based on your needs
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="mx-auto w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
                    <method.icon className="h-6 w-6 text-brand-red" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-2">
                    {method.title}
                  </h3>
                  <p className="text-text-medium text-sm mb-3">
                    {method.description}
                  </p>
                  <p className="text-brand-red font-medium text-sm mb-1">
                    {method.contact}
                  </p>
                  <p className="text-text-light text-xs">
                    {method.responseTime}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-text-dark">
                  Send us a Message
                </CardTitle>
                <p className="text-text-medium">
                  Fill out the form below and we'll get back to you as soon as
                  possible.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Enter your first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Enter your last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What is this regarding?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    rows={6}
                  />
                </div>
                <Button
                  className="w-full bg-brand-red hover:bg-red-700"
                  size="lg"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
                <p className="text-xs text-text-light text-center">
                  We typically respond within 2 hours during business hours.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Departments & Offices */}
          <div className="space-y-8">
            {/* Departments */}
            <div>
              <h3 className="text-xl font-bold text-text-dark mb-6">
                Contact by Department
              </h3>
              <div className="space-y-4">
                {departments.map((dept, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <dept.icon className="h-5 w-5 text-brand-red" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-text-dark mb-1">
                            {dept.title}
                          </h4>
                          <p className="text-text-medium text-sm mb-2">
                            {dept.description}
                          </p>
                          <a
                            href={`mailto:${dept.email}`}
                            className="text-brand-red text-sm font-medium hover:underline"
                          >
                            {dept.email}
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Office Locations */}
            <div>
              <h3 className="text-xl font-bold text-text-dark mb-6">
                Our Offices
              </h3>
              <div className="space-y-4">
                {offices.map((office, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-text-dark mb-3">
                        {office.city}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-brand-red flex-shrink-0 mt-0.5" />
                          <span className="text-text-medium whitespace-pre-line">
                            {office.address}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-brand-red" />
                          <span className="text-text-medium">
                            {office.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-brand-red" />
                          <a
                            href={`mailto:${office.email}`}
                            className="text-brand-red hover:underline"
                          >
                            {office.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-brand-red" />
                          <span className="text-text-medium">
                            {office.hours}
                          </span>
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

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-dark mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-text-medium">
              Quick answers to common questions about PdfPage
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-text-dark mb-2">
                  How secure is my data when using PdfPage?
                </h3>
                <p className="text-text-medium">
                  Your files are processed with 256-bit SSL encryption and
                  automatically deleted from our servers after processing. We
                  never store or access your documents.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-text-dark mb-2">
                  What file size limits do you have?
                </h3>
                <p className="text-text-medium">
                  Free users can process files up to 25MB. Pro users get 100MB
                  limits, and Enterprise users have no file size restrictions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-text-dark mb-2">
                  Do you offer API access for developers?
                </h3>
                <p className="text-text-medium">
                  Yes! We provide RESTful APIs for all our PDF processing tools.
                  Contact our sales team for API documentation and pricing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-text-dark mb-2">
                  Can I cancel my subscription anytime?
                </h3>
                <p className="text-text-medium">
                  Absolutely. You can cancel your subscription at any time from
                  your dashboard, and you'll retain access until the end of your
                  billing period.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-text-medium mb-4">Still have questions?</p>
            <Button variant="outline" size="lg">
              View All FAQs
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
