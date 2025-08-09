import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  WifiOff,
  Download,
  Smartphone,
  Globe,
  Zap,
  CheckCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { useMobile, useNetworkStatus, usePWAInstall } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";

interface PWAStatusBarProps {
  className?: string;
  showInstallPrompt?: boolean;
  showNetworkStatus?: boolean;
  showUpdatePrompt?: boolean;
}

const PWAStatusBar: React.FC<PWAStatusBarProps> = ({
  className,
  showInstallPrompt = true,
  showNetworkStatus = true,
  showUpdatePrompt = true,
}) => {
  const { isMobile, pwa, device } = useMobile();
  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();
  const { isInstallable, isInstalled, installApp, canInstall } =
    usePWAInstall();

  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  // Check if install prompt should be shown - Enhanced for mobile
  useEffect(() => {
    // Show on mobile devices when installable, or on desktop if explicitly enabled
    const shouldShow = canInstall && showInstallPrompt && !dismissedInstall &&
                      (isMobile || (!isMobile && showInstallPrompt));

    console.log('PWA Install Check:', { canInstall, showInstallPrompt, dismissedInstall, isMobile, shouldShow });

    setShowInstallBanner(shouldShow);
  }, [canInstall, showInstallPrompt, dismissedInstall, isMobile]);

  // Listen for service worker updates
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowInstallBanner(false);
    }
  };

  const handleDismissInstall = () => {
    setDismissedInstall(true);
    setShowInstallBanner(false);
  };

  const handleUpdate = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        }
      });
    }
  };

  // Don't render if not mobile or PWA is already installed
  if (!isMobile && !pwa.isPWA) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Network Status Bar */}
      {showNetworkStatus && (
        <div
          className={cn(
            "fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium transition-all duration-300",
            isOnline
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white animate-pulse",
          )}
        >
          <div className="flex items-center justify-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>
                  Online
                  {connectionType && (
                    <span className="ml-1 opacity-80">({connectionType})</span>
                  )}
                </span>
                {isSlowConnection && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Slow
                  </Badge>
                )}
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Offline - Using cached content</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Install App Banner - Mobile Optimized */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 shadow-lg animate-slide-up">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs sm:text-sm">Install PdfPage App</div>
                <div className="text-xs opacity-90 truncate">
                  Get faster access and offline features
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDismissInstall}
                className="px-2 sm:px-3 py-1 text-xs touch-target bg-white/20 hover:bg-white/30 text-white border-white/30"
                aria-label="Dismiss install prompt"
              >
                <X className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-white text-blue-600 hover:bg-gray-100 px-2 sm:px-3 py-1 text-xs font-semibold touch-target"
              >
                <Download className="w-3 h-3 mr-1" />
                <span className="hidden xs:inline">Install</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {updateAvailable && showUpdatePrompt && (
        <div className="fixed top-16 left-4 right-4 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-lg shadow-lg animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <div>
                <div className="font-semibold text-sm">Update Available</div>
                <div className="text-xs opacity-90">
                  New features and improvements ready
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleUpdate}
              className="bg-white text-orange-600 hover:bg-gray-100 px-3 py-1 text-xs font-semibold"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Update
            </Button>
          </div>
        </div>
      )}

      {/* PWA Status Indicator (for debugging) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 z-40">
          <div className="bg-black bg-opacity-80 text-white text-xs p-2 rounded-lg max-w-xs">
            <div className="font-semibold mb-1">PWA Status</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {pwa.isPWA ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <Globe className="w-3 h-3 text-gray-400" />
                )}
                <span>{pwa.isPWA ? "PWA Mode" : "Browser Mode"}</span>
              </div>
              <div className="flex items-center gap-2">
                {isInstalled ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <Download className="w-3 h-3 text-yellow-400" />
                )}
                <span>{isInstalled ? "Installed" : "Not Installed"}</span>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-400" />
                )}
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
              <div className="text-xs opacity-70">
                {device.isIOS && "iOS"} {device.isAndroid && "Android"}{" "}
                {device.isSafari && "Safari"} {device.isChrome && "Chrome"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWAStatusBar;
