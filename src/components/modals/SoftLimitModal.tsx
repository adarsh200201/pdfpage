import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  Crown,
  Zap,
  Clock,
  CheckCircle,
  Gift,
  Sparkles,
} from "lucide-react";

interface SoftLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any, conversionInfo?: any) => void;
  usageInfo?: {
    currentUsage: number;
    maxUsage: number;
    timeToReset: string;
  };
  toolName?: string;
  redirectPath?: string;
}

const SoftLimitModal: React.FC<SoftLimitModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  usageInfo,
  toolName,
  redirectPath,
}) => {
  const [activeTab, setActiveTab] = useState("register");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [timeToReset, setTimeToReset] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { login, register, loginWithGoogle } = useAuth();
  const { toast } = useToast();

  // Calculate time to reset
  useEffect(() => {
    if (usageInfo?.timeToReset) {
      const updateTimer = () => {
        const now = new Date();
        const resetTime = new Date(usageInfo.timeToReset);
        const diff = resetTime.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeToReset("Available now");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeToReset(`${hours}h ${minutes}m`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [usageInfo?.timeToReset]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (activeTab === "login") {
        result = await login(formData.email, formData.password);
        toast({
          title: "Welcome back!",
          description: "You now have unlimited access to all tools.",
        });
      } else {
        // Enhanced validation
        if (formData.name.length < 2 || formData.name.length > 50) {
          throw new Error("Name must be between 2-50 characters");
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        // Register with conversion tracking
        result = await register(
          formData.name,
          formData.email,
          formData.password,
          {
            signupSource: "soft_limit",
            toolName,
            sessionId: `soft_limit_${Date.now()}`,
          },
        );

        toast({
          title: "Account created successfully!",
          description: "Welcome to PdfPage! You now have unlimited access.",
        });
      }

      // Call success handler with user data and conversion info
      if (onSuccess) {
        onSuccess(result.user, result.conversion);
      }

      onClose();
    } catch (error: any) {
      console.error("Authentication failed:", error);
      toast({
        title: activeTab === "login" ? "Login Failed" : "Registration Failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const result = await loginWithGoogle();

      toast({
        title: "Success!",
        description: "You now have unlimited access to all tools.",
      });

      if (onSuccess) {
        onSuccess(result.user);
      }

      onClose();
    } catch (error: any) {
      console.error("Google authentication failed:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Google authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-blue-500" />,
      title: "Unlimited Tool Usage",
      description: "Use all PDF tools without daily limits",
    },
    {
      icon: <Crown className="w-5 h-5 text-purple-500" />,
      title: "Priority Processing",
      description: "Faster processing for all your files",
    },
    {
      icon: <Gift className="w-5 h-5 text-green-500" />,
      title: "Advanced Features",
      description: "Access to PDF-to-Word and premium tools",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
      title: "No Watermarks",
      description: "Clean, professional results",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-6 h-6 text-blue-500" />
              <span>Free Usage Complete</span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-center">
            You've reached your free usage limit. Please log in to continue
            using unlimited tools — it's free!
          </DialogDescription>
        </DialogHeader>

        {/* Usage Status */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-blue-700">Free Tools Used:</span>
            <span className="font-bold text-blue-800">
              {usageInfo?.currentUsage || 2}/{usageInfo?.maxUsage || 2} lifetime
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((usageInfo?.currentUsage || 2) / (usageInfo?.maxUsage || 2)) * 100}%`,
              }}
            />
          </div>
          <div className="text-xs text-blue-600 mt-2 text-center">
            ✨ Login once for unlimited access to all tools!
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {feature.icon}
                <span className="font-semibold text-sm">{feature.title}</span>
              </div>
              <p className="text-xs text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Auth Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="register" className="text-sm">
              Create Account
            </TabsTrigger>
            <TabsTrigger value="login" className="text-sm">
              Sign In
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Create Free Account
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="loginEmail" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="loginEmail"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loginPassword" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="loginPassword"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sign In & Continue
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Google Sign In */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleAuth}
          className="w-full"
          disabled={isLoading}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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

        {/* Incentive Message */}
        <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <Sparkles className="w-4 h-4 inline mr-1 text-blue-500" />
          <strong>Welcome Gift:</strong> Get PDF-to-Word conversion unlocked
          when you sign up!
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SoftLimitModal;
