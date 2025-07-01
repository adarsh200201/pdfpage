import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Construction,
  Clock,
  CheckCircle,
  Star,
} from "lucide-react";

interface ToolPlaceholderProps {
  toolName: string;
  toolDescription: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  workingTool?: boolean;
  redirectTo?: string;
  isNew?: boolean;
}

const ToolPlaceholder: React.FC<ToolPlaceholderProps> = ({
  toolName,
  toolDescription,
  icon,
  comingSoon = true,
  workingTool = false,
  redirectTo,
  isNew = false,
}) => {
  const navigate = useNavigate();

  // Auto-redirect to working tool if available
  useEffect(() => {
    if (workingTool && redirectTo) {
      const timer = setTimeout(() => {
        navigate(redirectTo);
      }, 2000); // 2 second delay to show the "Now Available" message

      return () => clearTimeout(timer);
    }
  }, [workingTool, redirectTo, navigate]);
  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-8">
          <Link
            to="/"
            className="text-body-medium text-text-light hover:text-brand-red"
          >
            <ArrowLeft className="w-4 h-4 mr-1 inline" />
            Back to Home
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            {icon}
          </div>

          <h1 className="text-heading-medium text-text-dark mb-4 flex items-center justify-center gap-3">
            {toolName}
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto mb-8">
            {toolDescription}
          </p>

          {workingTool ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-heading-small text-green-800 mb-2">
                Now Available!
              </h3>
              <p className="text-body-medium text-green-700 mb-4">
                This tool is now fully functional with real-time processing!
                Redirecting you to the working tool...
              </p>
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm">Loading tool...</span>
              </div>
            </div>
          ) : comingSoon ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-heading-small text-yellow-800 mb-2">
                Coming Soon!
              </h3>
              <p className="text-body-medium text-yellow-700">
                We're working hard to bring you this tool. It will be available
                soon as part of our comprehensive PDF toolkit.
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-center space-x-4">
            {workingTool && redirectTo ? (
              <Link to={redirectTo}>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Star className="w-4 h-4 mr-2" />
                  Use Tool Now
                </Button>
              </Link>
            ) : (
              <Link to="/">
                <Button className="bg-brand-red hover:bg-red-600">
                  Try Other Tools
                </Button>
              </Link>
            )}
            <Link to="/merge">
              <Button variant="outline">Try Merge PDF</Button>
            </Link>
          </div>
        </div>

        {/* Available Tools */}
        <div className="mt-12">
          <h3 className="text-heading-small text-text-dark text-center mb-6">
            Available Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/merge"
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-brand-red transition-colors text-center"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Construction className="w-5 h-5 text-blue-500" />
              </div>
              <h4 className="font-semibold text-text-dark">Merge PDF</h4>
              <p className="text-body-small text-text-light">Available Now</p>
            </Link>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center opacity-60">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-600">Split PDF</h4>
              <p className="text-body-small text-gray-500">Coming Soon</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center opacity-60">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-600">Compress PDF</h4>
              <p className="text-body-small text-gray-500">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolPlaceholder;
