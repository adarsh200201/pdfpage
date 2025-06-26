import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ImageIcon,
  ArrowLeft,
  CheckCircle,
  Shield,
  Zap,
} from "lucide-react";
import GoogleAuthDebug from "@/components/debug/GoogleAuthDebug";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if user came from image tools context
  const referrer = location.state?.from?.pathname || document.referrer;
  const isFromImageContext =
    referrer.includes("/img") || location.pathname.includes("/img");

  // Brand settings based on context
  const brandSettings = isFromImageContext
    ? {
        name: "ImgPage",
        subtitle: "Image Tools",
        accent: "blue",
        gradientFrom: "from-blue-600",
        gradientTo: "to-purple-600",
        textAccent: "text-blue-600",
        backLink: "Back to ImgPage",
      }
    : {
        name: "PdfPage",
        subtitle: "PDF Tools",
        accent: "red",
        gradientFrom: "from-red-600",
        gradientTo: "to-red-700",
        textAccent: "text-red-600",
        backLink: "Back to PdfPage",
      };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div
              className={`w-10 h-10 bg-gradient-to-br ${brandSettings.gradientFrom} ${brandSettings.gradientTo} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}
            >
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-gray-900">
                {isFromImageContext ? "Img" : "Pdf"}
                <span className={brandSettings.textAccent}>
                  {isFromImageContext ? "Page" : "Page"}
                </span>
              </span>
              <span className="text-xs text-gray-500">
                {brandSettings.subtitle}
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {brandSettings.backLink}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div
                className={`w-16 h-16 bg-gradient-to-br ${brandSettings.gradientFrom} ${brandSettings.gradientTo} rounded-2xl flex items-center justify-center mx-auto mb-4`}
              >
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back
              </h1>
              <p className="text-gray-600">
                Sign in to your account to continue processing images
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 border-gray-200 focus:border-${brandSettings.accent}-500 focus:ring-${brandSettings.accent}-500`}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 h-12 border-gray-200 focus:border-${brandSettings.accent}-500 focus:ring-${brandSettings.accent}-500`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className={`text-sm ${brandSettings.textAccent} hover:text-${brandSettings.accent}-700 hover:underline`}
                  >
                    Forgot your password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className={`w-full h-12 bg-gradient-to-r ${brandSettings.gradientFrom} ${brandSettings.gradientTo} hover:from-${brandSettings.accent}-700 hover:to-${brandSettings.accent === "blue" ? "purple" : "red"}-700 text-white font-medium rounded-lg`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              {/* Social Login Options */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-gray-200 hover:bg-gray-50"
                  onClick={loginWithGoogle}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className={`font-medium ${brandSettings.textAccent} hover:text-${brandSettings.accent}-700 hover:underline`}
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              {/* Debug Panel - Remove in production */}
              <GoogleAuthDebug />
            </CardContent>
          </Card>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600">Secure & Private</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-600">Lightning Fast</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600">Always Free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center border-t border-gray-100 bg-white/50">
        <p className="text-xs text-gray-500">
          © 2024 {brandSettings.name}. All rights reserved. •{" "}
          <Link to="/privacy" className="hover:text-gray-700">
            Privacy
          </Link>{" "}
          •{" "}
          <Link to="/terms" className="hover:text-gray-700">
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
