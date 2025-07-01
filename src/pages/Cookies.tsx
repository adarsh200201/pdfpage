import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import {
  Cookie,
  Shield,
  BarChart,
  Globe,
  Settings,
  CheckCircle,
  AlertCircle,
  Eye,
  Clock,
  Users,
} from "lucide-react";

const Cookies = () => {
  const lastUpdated = "December 15, 2024";

  const cookieTypes = [
    {
      type: "Essential Cookies",
      description: "Required for basic website functionality",
      purpose: "Website operation, security, load balancing",
      examples: ["Session management", "Security tokens", "Load balancing"],
      required: true,
      icon: Shield,
      color: "from-green-500 to-green-600",
    },
    {
      type: "Analytics Cookies",
      description: "Help us understand how visitors use our website",
      purpose: "Website performance analysis and improvement",
      examples: ["Google Analytics", "Usage statistics", "Error tracking"],
      required: false,
      icon: BarChart,
      color: "from-blue-500 to-blue-600",
    },
    {
      type: "Functional Cookies",
      description: "Remember your preferences and settings",
      purpose: "Enhanced user experience and personalization",
      examples: ["Language preferences", "Theme settings", "Recent files"],
      required: false,
      icon: Settings,
      color: "from-purple-500 to-purple-600",
    },
    {
      type: "Marketing Cookies",
      description: "Used to deliver relevant advertisements",
      purpose: "Targeted advertising and marketing campaigns",
      examples: ["Ad targeting", "Conversion tracking", "Social media"],
      required: false,
      icon: Eye,
      color: "from-orange-500 to-orange-600",
    },
  ];

  const cookieDetails = [
    {
      name: "session_id",
      type: "Essential",
      duration: "Session",
      purpose: "Maintains user session state and security",
      provider: "PdfPage",
    },
    {
      name: "_ga",
      type: "Analytics",
      duration: "2 years",
      purpose: "Distinguishes unique users for Google Analytics",
      provider: "Google",
    },
    {
      name: "_gid",
      type: "Analytics",
      duration: "24 hours",
      purpose: "Distinguishes unique users for Google Analytics",
      provider: "Google",
    },
    {
      name: "preferences",
      type: "Functional",
      duration: "1 year",
      purpose: "Stores user preferences and settings",
      provider: "PdfPage",
    },
    {
      name: "_fbp",
      type: "Marketing",
      duration: "3 months",
      purpose: "Facebook pixel tracking for advertising",
      provider: "Facebook",
    },
    {
      name: "csrf_token",
      type: "Essential",
      duration: "Session",
      purpose: "Cross-site request forgery protection",
      provider: "PdfPage",
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
              Cookie <span className="text-brand-red">Policy</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Learn about how we use cookies and similar technologies to improve
              your experience on PdfPage.
            </p>
            <Badge className="bg-brand-red/10 text-brand-red border-brand-red/20">
              Last updated: {lastUpdated}
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <Cookie className="h-8 w-8 text-brand-red mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-text-dark mb-4">
                  What are Cookies?
                </h2>
                <p className="text-text-medium leading-relaxed mb-4">
                  Cookies are small text files that are stored on your device
                  when you visit a website. They help websites remember
                  information about your visit, such as your preferred language
                  and other settings.
                </p>
                <p className="text-text-medium leading-relaxed">
                  We use cookies and similar technologies to provide, protect,
                  and improve our services. This policy explains what cookies we
                  use, why we use them, and how you can manage your preferences.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Types */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Types of Cookies We Use
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {cookieTypes.map((cookie, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${cookie.color} rounded-lg flex items-center justify-center`}
                    >
                      <cookie.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-text-dark">
                          {cookie.type}
                        </h3>
                        {cookie.required && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-text-medium text-sm mb-3">
                        {cookie.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-text-dark text-sm mb-1">
                        Purpose:
                      </p>
                      <p className="text-text-medium text-sm">
                        {cookie.purpose}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-text-dark text-sm mb-1">
                        Examples:
                      </p>
                      <ul className="text-text-medium text-sm space-y-1">
                        {cookie.examples.map((example, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-sm text-text-medium">
                        {cookie.required ? "Always Active" : "Optional"}
                      </span>
                      <Switch
                        disabled={cookie.required}
                        defaultChecked={cookie.required}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cookie Settings */}
        <section className="mb-12">
          <Card className="border-2 border-brand-red/20">
            <CardHeader className="bg-brand-red/5">
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-brand-red" />
                Cookie Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-text-medium mb-6">
                Manage your cookie preferences below. Note that disabling some
                cookies may affect your experience on our website.
              </p>

              <div className="space-y-4">
                {cookieTypes.map((cookie, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <Label className="font-medium text-text-dark">
                        {cookie.type}
                      </Label>
                      <p className="text-sm text-text-medium mt-1">
                        {cookie.description}
                      </p>
                    </div>
                    <Switch
                      disabled={cookie.required}
                      defaultChecked={cookie.required}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-6">
                <Button className="bg-brand-red hover:bg-red-700">
                  Save Preferences
                </Button>
                <Button variant="outline">Accept All</Button>
                <Button variant="outline">Reject All</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Detailed Cookie List */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Detailed Cookie Information
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-semibold text-text-dark">
                        Cookie Name
                      </th>
                      <th className="text-left p-3 font-semibold text-text-dark">
                        Type
                      </th>
                      <th className="text-left p-3 font-semibold text-text-dark">
                        Duration
                      </th>
                      <th className="text-left p-3 font-semibold text-text-dark">
                        Purpose
                      </th>
                      <th className="text-left p-3 font-semibold text-text-dark">
                        Provider
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cookieDetails.map((cookie, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-3 font-mono text-xs">{cookie.name}</td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={
                              cookie.type === "Essential"
                                ? "bg-green-100 text-green-800"
                                : cookie.type === "Analytics"
                                  ? "bg-blue-100 text-blue-800"
                                  : cookie.type === "Functional"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-orange-100 text-orange-800"
                            }
                          >
                            {cookie.type}
                          </Badge>
                        </td>
                        <td className="p-3 text-text-medium">
                          {cookie.duration}
                        </td>
                        <td className="p-3 text-text-medium">
                          {cookie.purpose}
                        </td>
                        <td className="p-3 text-text-medium">
                          {cookie.provider}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Managing Cookies */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Managing Your Cookies
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-brand-red" />
                  Browser Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-medium mb-4">
                  You can control cookies through your browser settings:
                </p>
                <ul className="space-y-2 text-text-medium text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Block all cookies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Accept only first-party cookies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Delete existing cookies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Get notified when cookies are set</span>
                  </li>
                </ul>
                <p className="text-text-medium text-xs mt-4">
                  Note: Blocking cookies may affect website functionality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-brand-red" />
                  Third-Party Opt-Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-medium mb-4">
                  Opt out of third-party tracking:
                </p>
                <div className="space-y-3">
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-red hover:underline text-sm"
                  >
                    <Globe className="h-4 w-4" />
                    Google Analytics Opt-out
                  </a>
                  <a
                    href="https://www.facebook.com/help/568137493302217"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-red hover:underline text-sm"
                  >
                    <Globe className="h-4 w-4" />
                    Facebook Cookie Settings
                  </a>
                  <a
                    href="http://optout.aboutads.info/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-red hover:underline text-sm"
                  >
                    <Globe className="h-4 w-4" />
                    Digital Advertising Alliance
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Information */}
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-text-dark mb-4">
              Questions About Cookies?
            </h2>
            <p className="text-text-medium mb-6 max-w-2xl mx-auto">
              If you have any questions about our use of cookies or this Cookie
              Policy, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-brand-red hover:bg-red-700">
                <a href="mailto:support@pdfpage.com">Contact Support</a>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/privacy">Privacy Policy</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Cookies;
