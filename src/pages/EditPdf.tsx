import React from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import { ArrowLeft, FileText, Clock, Wrench, Star, Bell } from "lucide-react";

const EditPdf: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PromoBanner className="mb-6" />

        {/* Navigation */}
        <div className="flex items-center mb-8">
          <Link
            to="/"
            className="flex items-center text-sm text-gray-600 hover:text-brand-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Coming Soon Content */}
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF Editor</h1>

          <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="w-4 h-4 mr-2" />
            Coming Soon
          </div>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            We're working hard to bring you an amazing PDF editing experience.
            Our advanced editor will allow you to edit text, add annotations,
            insert images, and much more.
          </p>

          {/* Features Preview */}
          <Card className="max-w-2xl mx-auto mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                <Wrench className="w-5 h-5 mr-2 text-brand-red" />
                Features in Development
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center space-x-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">Direct text editing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">Drawing tools</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">Image insertion</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">Form field editing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">Digital signatures</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">Annotations & comments</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Tools */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Meanwhile, try our other PDF tools:
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline">
                <Link to="/merge">Merge PDF</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/split">Split PDF</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/compress">Compress PDF</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/rotate">Rotate PDF</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/watermark">Add Watermark</Link>
              </Button>
            </div>
          </div>

          {/* Notification Signup */}
          <Card className="max-w-md mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-800">Get Notified</h4>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Be the first to know when our PDF Editor launches!
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Notify Me When Ready
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditPdf;
