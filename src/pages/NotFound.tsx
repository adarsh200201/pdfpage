import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PdfPageLogo from "@/components/ui/PdfPageLogo";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="max-w-md w-full text-center shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <PdfPageLogo size="xl" variant="icon-only" showHover={false} useImage={true} />
          </div>

          {/* Error content */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Link to="/" className="w-full">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            
            <Link to="/tools" className="w-full">
              <Button variant="outline" className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Browse Tools
              </Button>
            </Link>
          </div>

          {/* Helpful links */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Popular tools:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link 
                to="/merge" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Merge PDF
              </Link>
              <Link 
                to="/split" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Split PDF
              </Link>
              <Link 
                to="/compress" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Compress PDF
              </Link>
              <Link 
                to="/img" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Image Tools
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
