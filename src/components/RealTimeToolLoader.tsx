import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  Activity,
  TrendingUp,
  Users,
  Clock,
  Rocket,
  Star,
  Shield,
  Globe,
} from "lucide-react";

interface RealTimeToolLoaderProps {
  toolName: string;
  redirectTo: string;
  description: string;
  features: string[];
  color?: string;
  gradient?: string;
  icon?: any;
}

const RealTimeToolLoader: React.FC<RealTimeToolLoaderProps> = ({
  toolName,
  redirectTo,
  description,
  features,
  color = "blue",
  gradient = "from-blue-500 to-indigo-600",
  icon: Icon = Zap,
}) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [liveStats, setLiveStats] = useState({
    activeUsers: 847 + Math.floor(Math.random() * 500),
    processedToday: 3421 + Math.floor(Math.random() * 1000),
    avgSpeed: 1.2 + Math.random() * 2,
    successRate: 99.7,
  });

  const loadingSteps = [
    "Initializing real-time engine...",
    "Loading AI processing modules...",
    "Establishing secure connection...",
    "Optimizing performance...",
    "Calibrating quality settings...",
    "Ready for real-time processing!",
  ];

  useEffect(() => {
    // Live stats simulation
    const statsInterval = setInterval(() => {
      setLiveStats((prev) => ({
        activeUsers: Math.max(
          100,
          prev.activeUsers + Math.floor(Math.random() * 20) - 10,
        ),
        processedToday: prev.processedToday + Math.floor(Math.random() * 5),
        avgSpeed:
          Math.round((prev.avgSpeed + (Math.random() * 0.6 - 0.3)) * 10) / 10,
        successRate: Math.max(
          95,
          Math.min(100, prev.successRate + (Math.random() * 0.2 - 0.1)),
        ),
      }));
    }, 3000);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 12;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setIsReady(true);
          return 100;
        }
        return newProgress;
      });
    }, 400);

    // Step progression
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 1000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [loadingSteps.length]);

  // Auto redirect when ready
  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        navigate(redirectTo);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isReady, navigate, redirectTo]);

  const handleLaunchNow = () => {
    navigate(redirectTo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Announcement */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <CheckCircle className="w-4 h-4" />
            Now Available!
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {toolName} is Ready!
          </h1>
          <p className="text-lg text-gray-600">
            This tool is now fully functional with real-time processing!
          </p>
        </div>

        {/* Live Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {liveStats.activeUsers}
                </span>
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {liveStats.processedToday.toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-600">Processed Today</div>
              <div className="text-xs text-green-600 mt-1">
                +{Math.floor(Math.random() * 20 + 5)}/min
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">
                  {liveStats.avgSpeed}s
                </span>
              </div>
              <div className="text-sm text-gray-600">Avg Speed</div>
              <div className="text-xs text-yellow-600 mt-1">Lightning Fast</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {liveStats.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-xs text-purple-600 mt-1">Reliable</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Loading Interface */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm mb-8">
          <CardContent className="p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Tool Information */}
              <div>
                <div
                  className={`inline-flex items-center gap-3 p-4 bg-gradient-to-r ${gradient} rounded-2xl text-white mb-6`}
                >
                  <Icon className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">{toolName}</h2>
                    <p className="text-white/90 text-sm">
                      Real-time Processing Enabled
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">{description}</p>

                <div className="space-y-3 mb-8">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Real-time Features
                  </h3>
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {isReady && (
                  <Button
                    onClick={handleLaunchNow}
                    className={`bg-gradient-to-r ${gradient} hover:opacity-90 text-white px-8 py-3`}
                    size="lg"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Launch Tool Now
                  </Button>
                )}
              </div>

              {/* Loading Progress */}
              <div className="space-y-6">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-full animate-pulse opacity-20`}
                    ></div>
                    <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                      {!isReady ? (
                        <Loader2
                          className={`w-12 h-12 text-${color}-600 animate-spin`}
                        />
                      ) : (
                        <CheckCircle className="w-12 h-12 text-green-600" />
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700 mt-16">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {!isReady ? "Loading tool..." : "Ready to go!"}
                  </h3>

                  <p className="text-gray-600 mb-4">
                    {loadingSteps[currentStep]}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress value={progress} className="h-3" />
                </div>

                {/* Loading Steps */}
                <div className="space-y-2">
                  {loadingSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 text-sm ${
                        index < currentStep
                          ? "text-green-600"
                          : index === currentStep
                            ? `text-${color}-600`
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

                {isReady && (
                  <div className="text-center pt-4">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-medium mb-2">
                      <Star className="w-4 h-4" />
                      Tool is ready! Redirecting automatically...
                    </div>
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
              <Globe className="w-5 h-5 text-blue-500" />
              Global Activity Feed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  location: "New York, USA",
                  action: "processed PDF",
                  time: "2s ago",
                  result: "Compressed 89%",
                },
                {
                  location: "London, UK",
                  action: "merged documents",
                  time: "4s ago",
                  result: "5 files combined",
                },
                {
                  location: "Tokyo, Japan",
                  action: "converted file",
                  time: "7s ago",
                  result: "PDF to DOCX",
                },
                {
                  location: "Berlin, Germany",
                  action: "split PDF",
                  time: "11s ago",
                  result: "24 pages extracted",
                },
                {
                  location: "Sydney, Australia",
                  action: "protected PDF",
                  time: "15s ago",
                  result: "Password added",
                },
                {
                  location: "Mumbai, India",
                  action: "edited PDF",
                  time: "18s ago",
                  result: "Text updated",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {activity.location}
                      </div>
                      <div className="text-xs text-gray-600">
                        {activity.action}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{activity.time}</div>
                    <div className="text-xs text-green-600 font-medium">
                      {activity.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTimeToolLoader;
