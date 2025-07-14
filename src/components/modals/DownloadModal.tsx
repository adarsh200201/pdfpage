import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, FileDown, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import DownloadAdSense from "@/components/ads/DownloadAdSense";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  fileName?: string;
  fileSize?: string;
  countdownSeconds?: number;
  adSlot?: string;
  showAd?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  fileName = "processed-file.pdf",
  fileSize,
  countdownSeconds = 5,
  adSlot = "1234567890", // Default slot for development
  showAd = true,
  title = "Preparing your file...",
  description = "Your file is ready for download. Please wait while we prepare everything.",
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [isDownloading, setIsDownloading] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(countdownSeconds);
      setIsDownloading(false);
      setAdLoaded(false);
      setProgress(0);
    }
  }, [isOpen, countdownSeconds]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        // Update progress bar (inverse of countdown)
        setProgress(((countdownSeconds - newTime) / countdownSeconds) * 100);

        if (newTime <= 0) {
          // Countdown finished, trigger download
          handleDownload();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, countdownSeconds]);

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      // Trigger the actual download
      await onDownload();

      // Small delay to show download started, then close modal
      setTimeout(() => {
        onClose();
        setIsDownloading(false);
      }, 1000);
    } catch (error) {
      console.error("Download error:", error);
      setIsDownloading(false);
    }
  }, [isDownloading, onDownload, onClose]);

  const handleSkipCountdown = () => {
    setTimeLeft(0);
    handleDownload();
  };

  const handleAdLoad = useCallback(() => {
    setAdLoaded(true);
    console.log("📺 Ad loaded successfully in download modal");
  }, []);

  const handleAdError = useCallback(() => {
    console.log("⚠️ Ad failed to load, continuing with download flow");
  }, []);

  // Format file size for display
  const formatFileSize = (sizeStr?: string) => {
    if (!sizeStr) return "";
    return ` (${sizeStr})`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-[480px] max-w-[95vw] mx-auto p-0 overflow-hidden",
          className,
        )}
        // Prevent closing by clicking outside during countdown
        onPointerDownOutside={(e) => {
          if (timeLeft > 0) {
            e.preventDefault();
          }
        }}
        // Prevent closing with escape during countdown
        onEscapeKeyDown={(e) => {
          if (timeLeft > 0) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileDown className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-left">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 text-left mt-1">
                  {description}
                </DialogDescription>
              </div>
            </div>

            {/* Close button - only enabled after countdown */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={timeLeft > 0}
              className={cn(
                "h-8 w-8 p-0 rounded-full",
                timeLeft > 0 && "opacity-50 cursor-not-allowed",
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* File Info */}
          <div className="text-center space-y-2">
            <div className="text-sm font-medium text-gray-700">
              📄 {fileName}
              {formatFileSize(fileSize)}
            </div>

            {/* Countdown Display */}
            {timeLeft > 0 && !isDownloading && (
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2 text-lg font-semibold text-blue-600">
                  <Clock className="w-5 h-5" />
                  <span>{timeLeft}s</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-gray-500">
                    Download will start automatically...
                  </div>
                </div>
              </div>
            )}

            {/* Download in Progress */}
            {isDownloading && (
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium">Starting download...</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            )}
          </div>

          {/* Advertisement Section */}
          {showAd && timeLeft > 0 && !isDownloading && (
            <div className="border-t border-gray-100 pt-6">
              <DownloadAdSense
                adSlot={adSlot}
                adFormat="rectangle"
                onAdLoad={handleAdLoad}
                onAdError={handleAdError}
                className="flex justify-center"
                fallbackContent={
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">
                      Thank you for using our PDF tools! 🎉
                    </div>
                    <div className="text-xs mt-1 opacity-70">
                      Your download will start in {timeLeft} seconds
                    </div>
                  </div>
                }
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            {timeLeft > 0 && !isDownloading && (
              <Button
                onClick={handleSkipCountdown}
                variant="outline"
                className="flex-1 sm:flex-none"
                size="sm"
              >
                Skip ({timeLeft}s)
              </Button>
            )}

            <Button
              onClick={timeLeft > 0 ? handleSkipCountdown : handleDownload}
              disabled={isDownloading}
              className="flex-1"
              size="sm"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Now
                </>
              )}
            </Button>
          </div>

          {/* Accessibility Info */}
          <div className="text-xs text-gray-400 text-center">
            Press Escape or click outside to cancel{" "}
            {timeLeft > 0 ? "after countdown" : ""}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadModal;
