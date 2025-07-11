import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  Bell,
  Zap,
  Star,
  CheckCircle,
  Presentation,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

const ComingSoon = () => {
  const [searchParams] = useSearchParams();
  const tool = searchParams.get("tool");

  const getToolInfo = (toolName: string) => {
    switch (toolName) {
      case "pdf-to-powerpoint":
        // Redirect to the actual working tool
        window.location.href = "/pdf-to-powerpoint";
        return {
          title: "PDF to PowerPoint",
          description: "Convert PDF files to editable PowerPoint presentations",
          icon: Presentation,
          eta: "Available Now!",
          features: [
            "Preserve original formatting",
            "Extract images and text",
            "Maintain slide layouts",
            "High-quality conversion",
          ],
        };
      case "pdf-to-excel":
        return {
          title: "PDF to Excel",
          description:
            "Extract tables and data from PDFs to Excel spreadsheets",
          icon: FileSpreadsheet,
          eta: "Q1 2024",
          features: [
            "Smart table detection",
            "Preserve data structure",
            "Multiple sheet support",
            "Formula preservation",
          ],
        };
      default:
        return {
          title: "New Tool",
          description: "An exciting new PDF tool is coming soon",
          icon: FileText,
          eta: "Coming Soon",
          features: [
            "Professional quality",
            "Fast processing",
            "Easy to use",
            "Free to try",
          ],
        };
    }
  };

  const toolInfo = getToolInfo(tool || "");
  const IconComponent = toolInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <IconComponent className="w-10 h-10 text-white" />
          </div>

          <Badge variant="secondary" className="mb-4">
            <Clock className="w-3 h-3 mr-1" />
            {toolInfo.eta}
          </Badge>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {toolInfo.title}
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {toolInfo.description}
          </p>

          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4" />
            Currently in development
          </div>
        </div>

        {/* Features Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              What to Expect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {toolInfo.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alternative Tools */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              While you wait, try these other PDF tools:
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/pdf-to-word">
                <Button variant="outline" size="sm">
                  PDF to Word
                </Button>
              </Link>
              <Link to="/pdf-to-jpg">
                <Button variant="outline" size="sm">
                  PDF to Image
                </Button>
              </Link>
              <Link to="/merge">
                <Button variant="outline" size="sm">
                  Merge PDFs
                </Button>
              </Link>
              <Link to="/split">
                <Button variant="outline" size="sm">
                  Split PDF
                </Button>
              </Link>
              <Link to="/compress">
                <Button variant="outline" size="sm">
                  Compress PDF
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Notification Signup */}
        <Card>
          <CardContent className="text-center p-8">
            <Bell className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Get Notified</h3>
            <p className="text-gray-600 mb-4">
              Be the first to know when {toolInfo.title} is ready!
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button>
                <Bell className="w-4 h-4 mr-2" />
                Notify Me
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComingSoon;
