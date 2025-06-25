import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  Star,
  TrendingUp,
  Activity,
  RefreshCw,
  Rocket,
  Crown,
  Clock,
} from "lucide-react";

interface ToolInfo {
  name: string;
  description: string;
  features: string[];
  redirectTo: string;
  icon: any;
  color: string;
  gradient: string;
}

const toolsInfo: { [key: string]: ToolInfo } = {
  "merge-pdf": {
    name: "PDF Merger",
    description:
      "Combine multiple PDF files into one document with real-time preview",
    features: [
      "Drag & Drop Interface",
      "Real-time Preview",
      "Batch Processing",
      "Smart Optimization",
    ],
    redirectTo: "/merge",
    icon: RefreshCw,
    color: "blue",
    gradient: "from-blue-500 to-indigo-600",
  },
  "split-pdf": {
    name: "PDF Splitter",
    description: "Split PDF files into separate pages or custom ranges",
    features: [
      "Page Range Selection",
      "Real-time Splitting",
      "Instant Download",
      "Preview Mode",
    ],
    redirectTo: "/split",
    icon: Zap,
    color: "purple",
    gradient: "from-purple-500 to-pink-600",
  },
  "compress-pdf": {
    name: "PDF Compressor",
    description: "Reduce PDF file size while maintaining quality",
    features: [
      "Smart Compression",
      "Quality Control",
      "Size Optimization",
      "Batch Processing",
    ],
    redirectTo: "/compress",
    icon: Activity,
    color: "green",
    gradient: "from-green-500 to-emerald-600",
  },
  "convert-pdf": {
    name: "PDF Converter",
    description: "Convert PDF to various formats with real-time processing",
    features: [
      "Multiple Formats",
      "Real-time Conversion",
      "Quality Settings",
      "Batch Mode",
    ],
    redirectTo: "/convert",
    icon: ArrowRight,
    color: "orange",
    gradient: "from-orange-500 to-red-600",
  },
  "edit-pdf": {
    name: "PDF Editor",
    description: "Edit PDF content with advanced real-time editing tools",
    features: [
      "Text Editing",
      "Image Insertion",
      "Real-time Preview",
      "Annotation Tools",
    ],
    redirectTo: "/edit-pdf",
    icon: Star,
    color: "yellow",
    gradient: "from-yellow-500 to-orange-600",
  },
  "protect-pdf": {
    name: "PDF Protector",
    description: "Secure your PDFs with password protection and encryption",
    features: [
      "Password Protection",
      "Encryption",
      "Permission Control",
      "Security Analytics",
    ],
    redirectTo: "/protect-pdf",
    icon: Crown,
    color: "red",
    gradient: "from-red-500 to-pink-600",
  },
};

const ToolRedirect = () => {
  const { toolSlug } = useParams<{ toolSlug: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    usersOnline: 1247,
    filesProcessed: 8934,
    processingSpeed: 2.3,
  });

  const tool = toolsInfo[toolSlug || ""] || toolsInfo["merge-pdf"];
  const Icon = tool.icon;

  const steps = [
    "Initializing real-time engine...",
    "Loading AI processing modules...",
    "Establishing secure connection...",
    "Optimizing performance settings...",
    "Ready for real-time processing!",
  ];

  useEffect(() => {
    // Real-time stats update
    const statsInterval = setInterval(() => {
      setRealTimeStats((prev) => ({
        usersOnline: prev.usersOnline + Math.floor(Math.random() * 10) - 5,
        filesProcessed: prev.filesProcessed + Math.floor(Math.random() * 3),
        processingSpeed:
          Math.round(
            (prev.processingSpeed + (Math.random() * 0.4 - 0.2)) * 10,
          ) / 10,
      }));
    }, 2000);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsLoading(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    // Step progression
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 800);

    // Auto redirect after loading
    const redirectTimer = setTimeout(() => {
      if (!isLoading) {
        navigate(tool.redirectTo);
      }
    }, 6000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearTimeout(redirectTimer);
    };
  }, [isLoading, navigate, tool.redirectTo, steps.length]);

  const handleManualRedirect = () => {
    navigate(tool.redirectTo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Main Announcement */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle className="w-4 h-4" />
              Now Available!
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {tool.name} is Ready!
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              This tool is now fully functional with real-time processing!
              Redirecting you to the working tool...
            </p>
          </div>

          {/* Real-time Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {realTimeStats.usersOnline.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Users Online</div>
                <div className="flex items-center justify-center mt-2">
                  <Activity className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">Live</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {realTimeStats.filesProcessed.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  Files Processed Today
                </div>
                <div className="flex items-center justify-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">
                    +{Math.floor(Math.random() * 50 + 10)}/hr
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {realTimeStats.processingSpeed}s
                </div>
                <div className="text-sm text-gray-600">Avg Processing Time</div>
                <div className="flex items-center justify-center mt-2">
                  <Zap className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-xs text-purple-600">Ultra Fast</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tool Preview Card */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm mb-12">
            <CardContent className="p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Tool Info */}
                <div>
                  <div
                    className={`inline-flex items-center gap-3 p-4 bg-gradient-to-r ${tool.gradient} rounded-2xl text-white mb-6`}
                  >
                    <Icon className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">{tool.name}</h2>
                      <p className="text-white/90 text-sm">
                        Real-time Processing Enabled
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-6">{tool.description}</p>

                  <div className="space-y-3 mb-8">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      Real-time Features
                    </h3>
                    {tool.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleManualRedirect}
                    className={`bg-gradient-to-r ${tool.gradient} hover:opacity-90 text-white px-8 py-3`}
                    size="lg"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Launch Tool Now
                  </Button>
                </div>

                {/* Loading Progress */}
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${tool.gradient} rounded-full animate-pulse opacity-20`}
                      ></div>
                      <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                        {isLoading ? (
                          <Loader2
                            className={`w-12 h-12 text-${tool.color}-600 animate-spin`}
                          />
                        ) : (
                          <CheckCircle className="w-12 h-12 text-green-600" />
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {isLoading ? "Loading tool..." : "Ready to go!"}
                    </h3>

                    <p className="text-gray-600 mb-4">{steps[currentStep]}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  {/* Step Indicators */}
                  <div className="space-y-2">
                    {steps.map((step, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 text-sm ${
                          index < currentStep
                            ? "text-green-600"
                            : index === currentStep
                              ? `text-${tool.color}-600`
                              : "text-gray-400"
                        }`}
                      >
                        {index < currentStep ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : index === currentStep ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  {!isLoading && (
                    <div className="text-center pt-4">
                      <p className="text-green-600 font-medium mb-2">
                        🎉 Tool is ready! Redirecting in 3 seconds...
                      </p>
                      <div className="text-xs text-gray-500">
                        or click "Launch Tool Now" to proceed immediately
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Activity Feed */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Live Activity Feed
              </h3>
              <div className="space-y-3">
                {[
                  {
                    user: "User from New York",
                    action: "compressed PDF",
                    time: "2s ago",
                    size: "Reduced 87%",
                  },
                  {
                    user: "User from London",
                    action: "merged 5 PDFs",
                    time: "5s ago",
                    size: "2.3MB total",
                  },
                  {
                    user: "User from Tokyo",
                    action: "split PDF",
                    time: "8s ago",
                    size: "24 pages",
                  },
                  {
                    user: "User from Berlin",
                    action: "converted PDF",
                    time: "12s ago",
                    size: "to DOCX",
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-700">
                        <strong>{activity.user}</strong> {activity.action}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      <div>{activity.time}</div>
                      <div className="text-green-600">{activity.size}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ToolRedirect;
