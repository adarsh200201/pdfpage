import { useState, useEffect } from "react";

// Hook to detect mobile devices and screen sizes
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    // Initial check
    checkScreenSize();

    // Listen for resize events
    window.addEventListener("resize", checkScreenSize);

    // Listen for orientation changes (mobile)
    window.addEventListener("orientationchange", () => {
      setTimeout(checkScreenSize, 100); // Delay to get accurate dimensions
    });

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      window.removeEventListener("orientationchange", checkScreenSize);
    };
  }, []);

  // Device detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // PWA detection
  const isPWA = window.matchMedia("(display-mode: standalone)").matches;
  const isInAppBrowser = window.navigator.standalone === true;

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize,
    device: {
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isTouch,
    },
    pwa: {
      isPWA,
      isInAppBrowser,
      isInstallable: !isPWA && !isInAppBrowser,
    },
    breakpoints: {
      isSm: screenSize.width >= 640,
      isMd: screenSize.width >= 768,
      isLg: screenSize.width >= 1024,
      isXl: screenSize.width >= 1280,
      is2Xl: screenSize.width >= 1536,
    },
  };
}

// Hook for viewport dimensions with safe areas
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    safeArea: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  });

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Get safe area insets for notched devices
      const computedStyle = getComputedStyle(document.documentElement);
      const safeArea = {
        top:
          parseInt(
            computedStyle.getPropertyValue("env(safe-area-inset-top)"),
          ) || 0,
        bottom:
          parseInt(
            computedStyle.getPropertyValue("env(safe-area-inset-bottom)"),
          ) || 0,
        left:
          parseInt(
            computedStyle.getPropertyValue("env(safe-area-inset-left)"),
          ) || 0,
        right:
          parseInt(
            computedStyle.getPropertyValue("env(safe-area-inset-right)"),
          ) || 0,
      };

      setViewport({ width, height, safeArea });
    };

    updateViewport();

    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

  return viewport;
}

// Hook for network status (PWA feature)
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Get connection information if available
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      setConnectionType(connection.effectiveType);

      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType);
      };

      connection.addEventListener("change", handleConnectionChange);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        connection.removeEventListener("change", handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    isSlowConnection: connectionType === "slow-2g" || connectionType === "2g",
    isFastConnection: connectionType === "4g" || connectionType === "5g",
  };
}

// Hook for PWA install prompt
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error("PWA install failed:", error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
    canInstall: isInstallable && !isInstalled,
  };
}

// Hook for touch gestures (useful for mobile interactions)
export function useTouchGestures(elementRef: React.RefObject<HTMLElement>) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setTouchEnd(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setTouchEnd({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const distanceX = touchStart.x - touchEnd.x;
      const distanceY = touchStart.y - touchEnd.y;

      // Determine swipe direction
      const isLeftSwipe = distanceX > 50;
      const isRightSwipe = distanceX < -50;
      const isUpSwipe = distanceY > 50;
      const isDownSwipe = distanceY < -50;

      // Dispatch custom events
      if (isLeftSwipe) {
        element.dispatchEvent(
          new CustomEvent("swipeLeft", { detail: { distanceX, distanceY } }),
        );
      } else if (isRightSwipe) {
        element.dispatchEvent(
          new CustomEvent("swipeRight", { detail: { distanceX, distanceY } }),
        );
      } else if (isUpSwipe) {
        element.dispatchEvent(
          new CustomEvent("swipeUp", { detail: { distanceX, distanceY } }),
        );
      } else if (isDownSwipe) {
        element.dispatchEvent(
          new CustomEvent("swipeDown", { detail: { distanceX, distanceY } }),
        );
      }
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchmove", handleTouchMove);
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef, touchStart, touchEnd]);

  return {
    touchStart,
    touchEnd,
  };
}

export default useMobile;
