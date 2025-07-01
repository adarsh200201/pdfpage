import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Gift,
  Sparkles,
  Crown,
  ArrowRight,
  X,
  FileText,
  Zap,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface RewardBannerProps {
  isVisible: boolean;
  onClose: () => void;
  conversionInfo?: {
    fromSoftLimit: boolean;
    limitTool: string;
    unlockedFeatures: string[];
    showWelcomeReward: boolean;
  };
  className?: string;
}

const RewardBanner: React.FC<RewardBannerProps> = ({
  isVisible,
  onClose,
  conversionInfo,
  className,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);

      // Cycle through unlocked features
      if (
        conversionInfo?.unlockedFeatures &&
        conversionInfo.unlockedFeatures.length > 1
      ) {
        const interval = setInterval(() => {
          setCurrentFeatureIndex(
            (prev) =>
              (prev + 1) % (conversionInfo.unlockedFeatures?.length || 1),
          );
        }, 2000);

        return () => clearInterval(interval);
      }
    }
  }, [isVisible, conversionInfo?.unlockedFeatures]);

  if (!isVisible) return null;

  const getToolIcon = (toolName: string) => {
    if (toolName?.toLowerCase().includes("word"))
      return <FileText className="w-5 h-5" />;
    if (toolName?.toLowerCase().includes("compress"))
      return <Zap className="w-5 h-5" />;
    return <Crown className="w-5 h-5" />;
  };

  const getToolPath = (toolName: string) => {
    if (toolName?.toLowerCase().includes("word")) return "/pdf-to-word";
    if (toolName?.toLowerCase().includes("compress")) return "/compress";
    return "/all-tools";
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-md transition-all duration-500 transform",
        isAnimating
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
        className,
      )}
    >
      <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-green-500 p-1 rounded-lg shadow-2xl">
        <div className="bg-white rounded-lg p-4 relative overflow-hidden">
          {/* Animated background sparkles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-2 left-4 animate-pulse">
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="absolute top-8 right-8 animate-pulse delay-300">
              <Star className="w-3 h-3 text-blue-400" />
            </div>
            <div className="absolute bottom-4 left-8 animate-pulse delay-700">
              <Star className="w-2 h-2 text-purple-400" />
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-full">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  Welcome Gift Unlocked!
                </h3>
                <p className="text-sm text-gray-600">
                  {conversionInfo?.fromSoftLimit
                    ? "Thanks for creating an account!"
                    : "Welcome to PdfPage!"}
                </p>
              </div>
            </div>

            {/* Feature showcase */}
            {conversionInfo?.unlockedFeatures &&
              conversionInfo.unlockedFeatures.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold text-sm text-gray-800">
                      Unlocked Features:
                    </span>
                  </div>

                  <div className="min-h-[24px] flex items-center">
                    <div className="flex items-center gap-2 transition-all duration-300">
                      {getToolIcon(
                        conversionInfo.unlockedFeatures[currentFeatureIndex],
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {conversionInfo.unlockedFeatures[currentFeatureIndex]}
                      </span>
                    </div>
                  </div>

                  {conversionInfo.unlockedFeatures.length > 1 && (
                    <div className="flex gap-1 mt-2 justify-center">
                      {conversionInfo.unlockedFeatures.map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            index === currentFeatureIndex
                              ? "bg-purple-500"
                              : "bg-gray-300",
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {conversionInfo?.limitTool && (
                <Link
                  to={getToolPath(conversionInfo.limitTool)}
                  className="flex-1"
                >
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    <span className="flex items-center gap-1">
                      {getToolIcon(conversionInfo.limitTool)}
                      Try Now
                    </span>
                  </Button>
                </Link>
              )}

              <Link to="/all-tools" className="flex-1">
                <Button size="sm" variant="outline" className="w-full">
                  <span className="flex items-center gap-1">
                    Explore All
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Button>
              </Link>
            </div>

            {/* Additional perks */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Unlimited usage
                </span>
                <span className="flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Priority support
                </span>
              </div>
            </div>
          </div>

          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 opacity-20 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default RewardBanner;
