import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PDFDebug from "@/components/debug/PDFDebug";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Globe,
  Server,
  Database,
  Zap,
  Shield,
  BarChart,
  Bell,
  ExternalLink,
  TrendingUp,
  Activity,
} from "lucide-react";

const Status = () => {
  const currentStatus = "operational"; // operational, degraded, outage

  const services = [
    {
      name: "PDF Processing API",
      status: "operational",
      uptime: "99.98%",
      responseTime: "1.2s",
      description: "Core PDF processing services",
      icon: Server,
    },
    {
      name: "File Upload Service",
      status: "operational",
      uptime: "99.99%",
      responseTime: "0.8s",
      description: "File upload and storage system",
      icon: Database,
    },
    {
      name: "Authentication System",
      status: "operational",
      uptime: "99.97%",
      responseTime: "0.3s",
      description: "User authentication and API keys",
      icon: Shield,
    },
    {
      name: "CDN & Static Assets",
      status: "operational",
      uptime: "99.99%",
      responseTime: "0.1s",
      description: "Content delivery network",
      icon: Globe,
    },
    {
      name: "Payment Processing",
      status: "operational",
      uptime: "99.95%",
      responseTime: "2.1s",
      description: "Subscription and billing system",
      icon: Zap,
    },
    {
      name: "Email Service",
      status: "degraded",
      uptime: "98.87%",
      responseTime: "5.2s",
      description: "Email notifications and support",
      icon: Bell,
    },
  ];

  const incidents = [
    {
      title: "Email Service Degradation",
      status: "investigating",
      impact: "Minor",
      startTime: "Dec 15, 2024 - 14:30 UTC",
      description:
        "We're experiencing delays in email delivery. Email notifications may be delayed by up to 15 minutes.",
      updates: [
        {
          time: "15:45 UTC",
          message:
            "We've identified the issue with our email service provider and are working on a resolution.",
        },
        {
          time: "14:35 UTC",
          message:
            "We're investigating reports of delayed email notifications.",
        },
      ],
    },
  ];

  const pastIncidents = [
    {
      title: "API Rate Limiting Issues",
      date: "Dec 12, 2024",
      duration: "1h 23m",
      impact: "Minor",
      resolved: true,
    },
    {
      title: "Scheduled Database Maintenance",
      date: "Dec 8, 2024",
      duration: "2h 15m",
      impact: "Minor",
      resolved: true,
    },
    {
      title: "CDN Performance Degradation",
      date: "Dec 3, 2024",
      duration: "45m",
      impact: "Minor",
      resolved: true,
    },
  ];

  const metrics = [
    {
      label: "Overall Uptime",
      value: "99.97%",
      period: "Last 30 days",
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "Average Response Time",
      value: "1.1s",
      period: "Last 24 hours",
      icon: Zap,
      color: "blue",
    },
    {
      label: "Active Users",
      value: "847K",
      period: "Currently online",
      icon: Activity,
      color: "purple",
    },
    {
      label: "Files Processed",
      value: "2.3M",
      period: "Last 7 days",
      icon: BarChart,
      color: "orange",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "outage":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Operational
          </Badge>
        );
      case "degraded":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Degraded
          </Badge>
        );
      case "outage":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Outage
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-brand-red/5 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-text-dark mb-6">
              System <span className="text-brand-red">Status</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Real-time status and performance monitoring for all PdfPage
              services
            </p>

            {/* Overall Status */}
            <div className="bg-white rounded-lg p-6 shadow-lg inline-block">
              <div className="flex items-center gap-3">
                {getStatusIcon(currentStatus)}
                <div>
                  <h2 className="text-2xl font-bold text-text-dark">
                    All Systems{" "}
                    {currentStatus === "operational"
                      ? "Operational"
                      : "Experiencing Issues"}
                  </h2>
                  <p className="text-text-medium">
                    Last updated: {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Key Metrics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Performance Metrics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 bg-${metric.color}-100 rounded-lg flex items-center justify-center mx-auto mb-4`}
                  >
                    <metric.icon
                      className={`h-6 w-6 text-${metric.color}-600`}
                    />
                  </div>
                  <div className="text-2xl font-bold text-text-dark mb-1">
                    {metric.value}
                  </div>
                  <div className="text-sm font-medium text-text-dark mb-1">
                    {metric.label}
                  </div>
                  <div className="text-xs text-text-medium">
                    {metric.period}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Current Incidents */}
        {incidents.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
              Current Incidents
            </h2>
            <div className="space-y-6">
              {incidents.map((incident, index) => (
                <Card
                  key={index}
                  className="border-l-4 border-l-yellow-500 shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-text-dark mb-2">
                          {incident.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            {incident.status}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {incident.impact} Impact
                          </Badge>
                          <span className="text-text-medium">
                            Started: {incident.startTime}
                          </span>
                        </div>
                      </div>
                      <AlertCircle className="h-6 w-6 text-yellow-500" />
                    </div>

                    <p className="text-text-medium mb-6">
                      {incident.description}
                    </p>

                    <div>
                      <h4 className="font-semibold text-text-dark mb-3">
                        Updates:
                      </h4>
                      <div className="space-y-3">
                        {incident.updates.map((update, updateIndex) => (
                          <div
                            key={updateIndex}
                            className="border-l-2 border-gray-200 pl-4"
                          >
                            <div className="flex items-center gap-2 text-sm text-text-medium mb-1">
                              <Clock className="h-3 w-3" />
                              {update.time}
                            </div>
                            <p className="text-text-medium">{update.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Service Status */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Service Status
          </h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <service.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-dark">
                          {service.name}
                        </h3>
                        <p className="text-sm text-text-medium">
                          {service.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right text-sm">
                        <div className="text-text-dark font-medium">
                          {service.uptime}
                        </div>
                        <div className="text-text-medium">Uptime</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-text-dark font-medium">
                          {service.responseTime}
                        </div>
                        <div className="text-text-medium">Response</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(service.status)}
                        {getStatusBadge(service.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Incident History */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Recent Incident History
          </h2>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                {pastIncidents.map((incident, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <h3 className="font-semibold text-text-dark">
                          {incident.title}
                        </h3>
                        <p className="text-sm text-text-medium">
                          {incident.date} • Duration: {incident.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {incident.impact} Impact
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Resolved
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-6">
                <Button variant="outline">
                  View Full History
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Status Page Information */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Status Page Information
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Bell className="h-6 w-6 text-brand-red" />
                  Subscribe to Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-medium mb-4">
                  Get notified about service incidents and maintenance windows:
                </p>
                <div className="space-y-3">
                  <Button className="w-full bg-brand-red hover:bg-red-700">
                    <Bell className="mr-2 h-4 w-4" />
                    Subscribe to Email Alerts
                  </Button>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    RSS Feed
                  </Button>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Webhook Integration
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart className="h-6 w-6 text-brand-red" />
                  SLA & Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-medium mb-4">
                  Our service level agreements and uptime commitments:
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-medium">API Uptime SLA:</span>
                    <span className="font-semibold text-text-dark">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-medium">Current Uptime:</span>
                    <span className="font-semibold text-green-600">99.97%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-medium">Response Time SLA:</span>
                    <span className="font-semibold text-text-dark">
                      &lt; 2s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-medium">Current Avg:</span>
                    <span className="font-semibold text-green-600">1.1s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* PDF.js Debug Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            PDF.js Configuration Debug
          </h2>
          <div className="flex justify-center">
            <PDFDebug />
          </div>
        </section>

        {/* Contact Support */}
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-text-dark mb-4">
              Need Additional Support?
            </h2>
            <p className="text-text-medium mb-6 max-w-2xl mx-auto">
              If you're experiencing issues not listed here or need immediate
              assistance, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-brand-red hover:bg-red-700">
                <Link to="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/api-docs">API Documentation</Link>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://twitter.com/pdfpage"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Follow @PdfPage
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Status;
