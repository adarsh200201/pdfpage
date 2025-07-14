import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Shield,
  Zap,
  Users,
  Globe,
  CheckCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  Smartphone,
  Cloud,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ModernLogin: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectPath = searchParams.get("redirect") || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await login();

      toast({
        title: "Welcome to PdfPage! 🎉",
        description: "You now have unlimited access to all PDF tools.",
      });

      // Navigate to the intended page after successful login
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Unable to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Benefits list
  const benefits = [
    {
      icon: Shield,
      title: "Secure Login",
      description: "Your data is protected with enterprise-grade security",
    },
    {
      icon: Zap,
      title: "Unlimited Access",
      description: "Use all PDF tools without any restrictions",
    },
    {
      icon: Cloud,
      title: "Sync Across Devices",
      description: "Access your tools from any device, anywhere",
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Perfect experience on desktop and mobile",
    },
  ];

  // Feature highlights
  const features = [
    "Merge & Split PDFs",
    "Compress Files",
    "Convert Documents",
    "Edit & Annotate",
    "Add Watermarks",
    "OCR Text Recognition",
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="relative bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              to="/"
              className="flex items-center space-x-2 text-2xl font-bold text-gray-900"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span>PdfPage</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="hidden sm:flex">
                <Globe className="w-3 h-3 mr-1" />
                Trusted by 100K+ users
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Login Form */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="text-center lg:text-left mb-8">
              <div className="flex items-center justify-center lg:justify-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome to PdfPage
                </h1>
              </div>
              <p className="text-lg text-gray-600 mb-6">
                Sign in to unlock unlimited access to all PDF tools and
                features.
              </p>
            </div>

            {/* Login Card */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Get Started
                </h2>
                <p className="text-sm text-gray-600">
                  One click to access all features
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Google Login Button */}
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                {/* Benefits */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm text-gray-600"
                    >
                      <benefit.icon className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="font-medium">{benefit.title}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-4 border-t space-y-3">
                  <p className="text-xs text-gray-500">
                    By signing in, you agree to our{" "}
                    <Link to="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Create one here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Features & Benefits */}
          <div className="space-y-8">
            {/* Main Benefits */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Why Choose PdfPage?
              </h3>
              <div className="grid gap-6">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Grid */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-500" />
                Available Tools
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>100K+ Users</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>1M+ Files Processed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>100% Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">PdfPage</span>
              <Badge variant="secondary" className="ml-2">
                Secure & Fast
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 G Initiations eServices Pvt. Ltd. All Rights Reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernLogin;
