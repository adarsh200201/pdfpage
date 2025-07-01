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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Email Support Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <Card className="max-w-md mx-auto hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="mx-auto w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-brand-red" />
                </div>
                <h3 className="text-lg font-semibold text-text-dark mb-2">
                  Email Support
                </h3>
                <p className="text-text-medium text-sm">
                  Get help with your account or technical questions
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Form */}
        <div className="mb-16">
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
      </div>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-dark">
              Frequently Asked Questions
            </h2>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
