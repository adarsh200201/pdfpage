import React from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileText,
  ArrowLeft,
  Clock,
  Star,
  Zap,
  Shield,
  Globe,
  Crown,
  Bell,
  Mail,
  CheckCircle,
} from "lucide-react";

const WordToPdf = () => {
  return (
    <div className="min-h-screen bg-[rgb(245,245,250)]">
      <Header />

      <main className="pt-16">
        {/* Coming Soon Section */}
        <div className="min-h-[740px] bg-[rgb(245,245,250)] flex flex-col items-center justify-center px-6 py-12">
          {/* Navigation */}
          <div className="w-full max-w-6xl mb-8">
            <Link
              to="/"
              className="flex items-center text-[rgb(229,50,45)] hover:text-[rgb(200,40,35)] transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>

          {/* Main Content */}
          <div className="text-center max-w-4xl">
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-[rgb(229,50,45)] rounded-xl flex items-center justify-center mr-6 relative">
                <FileText className="h-10 w-10 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-[42px] font-semibold text-[rgb(51,51,59)] leading-[52px] mb-2">
                  Word to PDF
                </h1>
                <Badge className="bg-orange-100 text-orange-700 text-lg px-4 py-2">
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Badge>
              </div>
            </div>

            <p className="text-[24px] leading-8 text-gray-700 mb-8 max-w-3xl mx-auto">
              We're building the most advanced Word to PDF converter with
              professional-grade features and perfect formatting preservation.
            </p>

            {/* Features Preview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                {
                  icon: Shield,
                  title: "Perfect Formatting",
                  description: "Preserve all fonts, styles, and layouts",
                  color: "bg-blue-500",
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Convert documents in seconds",
                  color: "bg-green-500",
                },
                {
                  icon: Globe,
                  title: "Batch Processing",
                  description: "Convert multiple files at once",
                  color: "bg-purple-500",
                },
                {
                  icon: Crown,
                  title: "Premium Quality",
                  description: "Enterprise-grade conversion",
                  color: "bg-orange-500",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <div
                    className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[rgb(51,51,59)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Expected Features */}
            <div className="bg-white rounded-xl p-8 shadow-lg mb-12">
              <h2 className="text-2xl font-bold text-[rgb(51,51,59)] mb-6">
                What to Expect
              </h2>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                {[
                  "Complete text extraction and formatting",
                  "Image and graphics preservation",
                  "Table and layout maintenance",
                  "Font and style preservation",
                  "Multiple file format support",
                  "Advanced compression options",
                  "Password protection",
                  "Cloud storage integration",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Signup */}
            <div className="bg-gradient-to-r from-[rgb(229,50,45)] to-[rgb(255,100,95)] rounded-xl p-8 text-white mb-8">
              <h3 className="text-2xl font-bold mb-4">Get Notified</h3>
              <p className="text-lg mb-6 opacity-90">
                Be the first to know when our Word to PDF converter launches!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
                <Button className="bg-white text-[rgb(229,50,45)] hover:bg-gray-100 px-6 py-3 font-semibold">
                  <Bell className="h-4 w-4 mr-2" />
                  Notify Me
                </Button>
              </div>
            </div>

            {/* Alternative Tools */}
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                In the meantime, try our other PDF tools:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/pdf-to-word">
                  <Button
                    variant="outline"
                    className="border-[rgb(229,50,45)] text-[rgb(229,50,45)] hover:bg-[rgb(229,50,45)] hover:text-white"
                  >
                    PDF to Word
                  </Button>
                </Link>
                <Link to="/merge">
                  <Button
                    variant="outline"
                    className="border-[rgb(229,50,45)] text-[rgb(229,50,45)] hover:bg-[rgb(229,50,45)] hover:text-white"
                  >
                    Merge PDF
                  </Button>
                </Link>
                <Link to="/split">
                  <Button
                    variant="outline"
                    className="border-[rgb(229,50,45)] text-[rgb(229,50,45)] hover:bg-[rgb(229,50,45)] hover:text-white"
                  >
                    Split PDF
                  </Button>
                </Link>
                <Link to="/compress">
                  <Button
                    variant="outline"
                    className="border-[rgb(229,50,45)] text-[rgb(229,50,45)] hover:bg-[rgb(229,50,45)] hover:text-white"
                  >
                    Compress PDF
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-white py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[rgb(51,51,59)] mb-4">
                Development Timeline
              </h2>
              <p className="text-lg text-gray-600">
                Here's what we're working on and when you can expect it
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Timeline items */}
                {[
                  {
                    phase: "Phase 1",
                    title: "Core Conversion Engine",
                    status: "In Progress",
                    date: "January 2025",
                    description:
                      "Building the foundational Word document parsing and PDF generation system.",
                    color: "bg-blue-500",
                  },
                  {
                    phase: "Phase 2",
                    title: "Advanced Formatting",
                    status: "Coming Soon",
                    date: "February 2025",
                    description:
                      "Enhanced formatting preservation, image handling, and layout optimization.",
                    color: "bg-orange-500",
                  },
                  {
                    phase: "Phase 3",
                    title: "Premium Features",
                    status: "Planned",
                    date: "March 2025",
                    description:
                      "Batch processing, cloud integration, and professional-grade options.",
                    color: "bg-gray-400",
                  },
                ].map((item, index) => (
                  <div key={index} className="relative flex items-start mb-12">
                    <div
                      className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center text-white font-bold text-lg z-10`}
                    >
                      {index + 1}
                    </div>
                    <div className="ml-8 flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-[rgb(51,51,59)]">
                          {item.title}
                        </h3>
                        <Badge
                          className={cn(
                            "text-white",
                            item.status === "In Progress" && "bg-blue-500",
                            item.status === "Coming Soon" && "bg-orange-500",
                            item.status === "Planned" && "bg-gray-500",
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <p className="text-sm font-medium text-[rgb(229,50,45)]">
                        {item.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-[rgb(245,245,250)] py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-[rgb(51,51,59)] mb-4">
              Have Questions?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We'd love to hear from you! Reach out with feature requests,
              questions, or feedback.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-[rgb(229,50,45)] hover:bg-[rgb(200,40,35)] text-white px-8 py-3">
                <Mail className="h-5 w-5 mr-2" />
                Contact Support
              </Button>
              <Button
                variant="outline"
                className="border-[rgb(229,50,45)] text-[rgb(229,50,45)] hover:bg-[rgb(229,50,45)] hover:text-white px-8 py-3"
              >
                <Star className="h-5 w-5 mr-2" />
                Request Feature
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WordToPdf;
